import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import crypto from "crypto";
import { reservationSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { sendReservationEmail } from "@/lib/email";
import { notifyNewCashBooking, sendDriverVoucherToTelegram } from "@/lib/telegram";
import { capiInitiateCheckout, identityFromRequest } from "@/lib/capi";
import { evaluateCoupon, type CouponRow } from "@/lib/coupon";
import {
  capacityFor,
  countBookingsOnDate,
  getDateOverride,
  getGlobalMaxDaily,
} from "@/lib/availability";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, {
    apiVersion: "2026-03-25.dahlia",
  });
}

function generateReservationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "VL-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    // Move supabase init inside try so any init failure returns JSON 500 (not HTML)
    const supabase = createAdminClient();

    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`reservation:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Safely parse JSON — some browsers/devices can send malformed bodies
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const parsed = reservationSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Reservation validation failed:", JSON.stringify(parsed.error.flatten().fieldErrors));
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      regionSlug,
      categorySlug,
      tripType,
      direction,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      flightCode,
      returnFlightCode,
      adults,
      children,
      luggage,
      childSeat,
      welcomeSign,
      welcomeName,
      firstName,
      lastName,
      email,
      phone,
      hotelName,
      hotelAddress,
      notes,
      couponCode,
      locale,
      paymentMethod,
    } = parsed.data;

    // Fetch region
    const { data: region } = await supabase
      .from("regions")
      .select("*")
      .eq("slug", regionSlug)
      .eq("is_active", true)
      .single();

    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    // ─── Check date availability ───
    // Resolved through lib/availability so this guard and the calendar the
    // customer just picked from apply exactly the same capacity rules.
    const [globalMax, pickupOverride] = await Promise.all([
      getGlobalMaxDaily(supabase),
      getDateOverride(supabase, pickupDate),
    ]);

    const pickupCapacity = capacityFor(pickupOverride, globalMax);
    if (pickupCapacity === 0) {
      return NextResponse.json(
        { error: "This date is not available for booking", code: "date_unavailable" },
        { status: 400 }
      );
    }

    if ((await countBookingsOnDate(supabase, pickupDate)) >= pickupCapacity) {
      return NextResponse.json(
        { error: "This date is fully booked", code: "date_full" },
        { status: 400 }
      );
    }

    // A round trip also occupies a slot on its return day.
    const returnLegDate =
      tripType === "round_trip" && returnDate ? returnDate : null;
    if (returnLegDate && returnLegDate !== pickupDate) {
      const returnCapacity = capacityFor(
        await getDateOverride(supabase, returnLegDate),
        globalMax
      );
      if (returnCapacity === 0) {
        return NextResponse.json(
          { error: "This date is not available for booking" },
          { status: 400 }
        );
      }
      if ((await countBookingsOnDate(supabase, returnLegDate)) >= returnCapacity) {
        return NextResponse.json(
          { error: "This date is fully booked" },
          { status: 400 }
        );
      }
    }

    // Fetch pricing — include cash pricing columns
    let pricingQuery = supabase
      .from("pricing")
      .select("*, one_way_cash_price, round_trip_cash_price, cash_deposit_amount, vehicle_categories!inner(slug, name, max_passengers, max_luggage)")
      .eq("region_id", region.id);

    if (categorySlug) {
      pricingQuery = pricingQuery.eq("vehicle_categories.slug", categorySlug);
    }

    // The wizard always names a vehicle, but a request that omits one still has
    // to land somewhere. With several vehicles priced per region, `limit(1)`
    // alone would pick an arbitrary one; the cheapest is the price the region
    // pages advertise as "from", and category_id below is taken from the same
    // row, so the booking stays consistent with what was charged.
    const { data: pricing } = await pricingQuery
      .order("one_way_price", { ascending: true })
      .limit(1)
      .single();

    if (!pricing) {
      return NextResponse.json({ error: "Pricing not found" }, { status: 404 });
    }

    // ─── The party has to fit in the vehicle ───
    // Checked here and not only in the wizard: the wizard clamps its adult and
    // child counters against separate ceilings, so their sum can pass the
    // vehicle's seat count, and nothing downstream looks at it again. Without
    // this a booking for more people than the car holds is confirmed and paid,
    // and the failure surfaces at the airport with the driver.
    const category = pricing.vehicle_categories as unknown as {
      name: string;
      max_passengers: number;
      max_luggage: number;
    };
    const partySize = (adults ?? 1) + (children ?? 0);
    if (category && partySize > category.max_passengers) {
      return NextResponse.json(
        {
          error: `${category.name} seats up to ${category.max_passengers} passengers, but the booking is for ${partySize}`,
          code: "capacity_exceeded",
          maxPassengers: category.max_passengers,
        },
        { status: 400 }
      );
    }

    // Check round-trip availability
    if (tripType === "round_trip" && !pricing.round_trip_price) {
      return NextResponse.json(
        { error: "Round trip not available for this region" },
        { status: 400 }
      );
    }

    // Fetch settings
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "child_seat_fee",
        "welcome_sign_fee",
        "cash_payment_enabled",
        "online_payment_discount_percent",
        "night_tariff_enabled",
        "night_tariff_start",
        "night_tariff_end",
        "night_tariff_percent",
      ]);

    const settingsMap: Record<string, unknown> = {};
    for (const s of settings ?? []) {
      settingsMap[s.key] = s.value;
    }
    const numSetting = (key: string) => {
      const v = settingsMap[key];
      return typeof v === "number" ? v : Number(v ?? 0);
    };

    const isCash = paymentMethod === "cash";
    const cashEnabled = settingsMap.cash_payment_enabled === true || settingsMap.cash_payment_enabled === "true";

    // Cash pricing comes from DB per region — not a percentage
    const pricingRow = pricing as Record<string, unknown>;
    const cashBasePrice = tripType === "round_trip"
      ? (pricingRow.round_trip_cash_price as number | null)
      : (pricingRow.one_way_cash_price as number | null);
    /**
     * The deposit follows the trip type the same way the fare does.
     *
     * There is a second column for it because one figure cannot serve both: a
     * €145 return journey taking the €35 deposit set against a €78 one-way
     * collects a quarter of the job, where the ladder the deposits are built on
     * asks for about half. Falling back to the one-way figure keeps a region
     * that has a round-trip fare but no round-trip deposit bookable instead of
     * rejecting the booking outright.
     */
    const cashDepositAmt =
      tripType === "round_trip"
        ? ((pricingRow.round_trip_cash_deposit_amount as number | null) ??
           (pricingRow.cash_deposit_amount as number | null))
        : (pricingRow.cash_deposit_amount as number | null);
    const nightEnabled = settingsMap.night_tariff_enabled === true || settingsMap.night_tariff_enabled === "true";
    const nightPercent = numSetting("night_tariff_percent");
    const parseHour = (v: unknown) => {
      const s = String(v ?? "");
      return parseInt(s.includes(":") ? s.split(":")[0] : s, 10) || 0;
    };
    const nightStartHour = parseHour(settingsMap.night_tariff_start ?? "0");
    const nightEndHour = parseHour(settingsMap.night_tariff_end ?? "7");

    if (isCash && !cashEnabled) {
      return NextResponse.json({ error: "Cash payment is not available" }, { status: 400 });
    }
    if (isCash && (!cashBasePrice || !cashDepositAmt)) {
      return NextResponse.json({ error: "Cash pricing not configured for this region" }, { status: 400 });
    }

    // Validate coupon
    let couponDiscountPercent = 0;
    let couponDiscountFixed = 0;
    let couponId: string | null = null;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .maybeSingle();

      // Same evaluator as /api/pricing — the quote the customer saw and the
      // price we actually charge must agree on whether the code is valid.
      const result = evaluateCoupon(coupon as CouponRow | null);
      if (result.valid) {
        couponId = result.id;
        couponDiscountPercent = result.discountPercent;
        couponDiscountFixed = result.discountFixed;
      }
    }

    // Calculate price server-side (source of truth)
    const { calculatePrice } = await import("@/lib/pricing");
    const calc = calculatePrice({
      oneWayPrice: pricing.one_way_price,
      roundTripPrice: pricing.round_trip_price,
      tripType: tripType ?? "one_way",
      pickupTime,
      childSeat: !!childSeat,
      welcomeSign: !!welcomeSign,
      couponDiscountPercent,
      couponDiscountFixed,
      nightSurchargePercent: nightPercent,
      nightTariffEnabled: nightEnabled,
      nightTariffStart: nightStartHour,
      nightTariffEnd: nightEndHour,
      childSeatFee: numSetting("child_seat_fee") || 10,
      welcomeSignFee: numSetting("welcome_sign_fee") || 5,
      onlineDiscountPercent: 0,
    });

    // For cash bookings: override total price with cash price from DB
    const finalTotalPrice = isCash ? (cashBasePrice! + calc.childSeatFee + calc.welcomeSignFee + calc.nightSurcharge - calc.couponDiscount) : calc.totalPrice;
    const finalDepositAmount = isCash ? cashDepositAmt! : 0;
    const finalDriverAmount = isCash ? (finalTotalPrice - finalDepositAmount) : 0;

    // Get exchange rates for storing
    const { data: rates } = await supabase
      .from("exchange_rates")
      .select("target_currency, rate")
      .eq("base_currency", "EUR");

    const rateMap: Record<string, number> = {};
    for (const r of rates ?? []) {
      rateMap[r.target_currency] = r.rate;
    }

    // Create or find customer
    let { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!customer) {
      const { data: newCustomer, error: custErr } = await supabase
        .from("customers")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
        })
        .select()
        .single();

      if (custErr) {
        // Unique constraint violation (23505): another concurrent request already created the customer
        if (custErr.code === "23505") {
          const { data: existingCustomer } = await supabase
            .from("customers")
            .select("*")
            .eq("email", email)
            .maybeSingle();
          customer = existingCustomer;
        }
        if (!customer) {
          console.error("Customer creation error:", custErr.message, custErr.code);
          return NextResponse.json(
            { error: "Failed to create customer" },
            { status: 500 }
          );
        }
      } else {
        customer = newCustomer;
      }
    }

    // Generate unique reservation code
    let reservationCode = generateReservationCode();
    let codeExists = true;
    while (codeExists) {
      const { data } = await supabase
        .from("reservations")
        .select("id")
        .eq("reservation_code", reservationCode)
        .single();
      if (!data) codeExists = false;
      else reservationCode = generateReservationCode();
    }

    // Build pickup datetime
    const pickupDatetime = `${pickupDate}T${pickupTime}:00`;
    const returnDatetime =
      tripType === "round_trip" && returnDate && returnTime
        ? `${returnDate}T${returnTime}:00`
        : null;

    // QR code token
    const qrCodeToken = crypto.randomUUID();

    // All reservations start as pending — status updated to paid/deposit_paid by webhook
    const initialStatus = "pending";
    const { data: reservation, error: resErr } = await supabase
      .from("reservations")
      .insert({
        reservation_code: reservationCode,
        customer_id: customer.id,
        region_id: region.id,
        category_id: pricing.category_id,
        trip_type: tripType ?? "one_way",
        direction: direction ?? "airport_to_region",
        pickup_datetime: pickupDatetime,
        return_datetime: returnDatetime,
        flight_code: flightCode || null,
        // NULL on a one-way booking: there is no return leg to fly.
        return_flight_code: tripType === "round_trip" ? (returnFlightCode || null) : null,
        adults: adults ?? 1,
        children: children ?? 0,
        luggage_count: luggage ?? 0,
        child_seat: !!childSeat,
        welcome_sign: !!welcomeSign,
        welcome_name: welcomeName || null,
        hotel_name: hotelName || null,
        hotel_address: hotelAddress || null,
        notes: notes || null,
        base_price: calc.basePrice,
        night_surcharge: calc.nightSurcharge,
        child_seat_fee: calc.childSeatFee,
        welcome_sign_fee: calc.welcomeSignFee,
        round_trip_discount: calc.roundTripDiscount,
        coupon_discount: calc.couponDiscount,
        online_discount: 0,
        deposit_amount: finalDepositAmount,
        driver_amount: finalDriverAmount,
        coupon_id: couponId,
        total_price: finalTotalPrice,
        /**
         * The currency this row is denominated in, and the only thing that
         * tells a reader which it is. Rows taken before the euro switch say
         * "USD" and carry `exchange_rate_eur`; everything written from here on
         * says "EUR" and carries no euro rate, because none is needed to show
         * a euro figure. `reservationMoney` in lib/currency is what reads this.
         */
        currency: "EUR",
        exchange_rate_eur: null,
        /**
         * Dollars per one euro on the day of booking. Not used for display —
         * the driver ledger needs it. We pay drivers in USD while the passenger
         * now hands them euro on a cash job, and that cash has to be recorded
         * against the driver's dollar fee at the rate of the day it happened,
         * not whatever the rate is when the ledger is next read.
         */
        exchange_rate_usd: rateMap.USD ?? null,
        exchange_rate_try: rateMap.TRY ?? null,
        status: initialStatus,
        payment_method: isCash ? "cash" : "online",
        qr_code_token: qrCodeToken,
        locale: locale ?? "en",
      })
      .select()
      .single();

    if (resErr || !reservation) {
      console.error("Reservation creation error:", resErr?.message);
      return NextResponse.json(
        { error: "Failed to create reservation" },
        { status: 500 }
      );
    }

    // If coupon was used, increment used_count.
    //
    // The argument is named `p_coupon_id`, not `coupon_id` — see
    // increment_coupon_usage in 001_initial_schema.sql. PostgREST resolves a
    // function by its argument names, so the old `coupon_id` key matched no
    // function and every call failed silently. used_count therefore stayed at
    // 0 forever, and because evaluateCoupon gates on
    // `used_count >= max_uses`, no coupon limit was ever reachable: a coupon
    // capped at 100 uses could be redeemed without end. Found after booking
    // VL-UUQG5U redeemed WELCOME10 while its used_count still read 0.
    //
    // The result is checked rather than discarded, so the next time this
    // breaks it appears in the logs instead of quietly uncapping every coupon.
    if (couponId) {
      const { error: couponUsageErr } = await supabase.rpc(
        "increment_coupon_usage",
        { p_coupon_id: couponId }
      );
      if (couponUsageErr) {
        console.error(
          "Failed to increment coupon usage — usage limits are not being enforced:",
          couponUsageErr.message,
          { couponId, reservationCode }
        );
      }
    }

    // ─── STRIPE PAYMENT INTENT ─────────────────────────────────────────────
    // For cash: charge deposit only. For online: charge full amount.
    const regionName = region[`name_${locale ?? "en"}`] || region.name_en;
    const stripeAmount = isCash ? finalDepositAmount : finalTotalPrice;

    if (stripeAmount <= 0) {
      console.error("Invalid stripe amount:", stripeAmount, { isCash, finalTotalPrice, finalDepositAmount });
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }
    const stripeDescription = isCash
      ? `TORVIAN Deposit — ${regionName} | ${tripType === "round_trip" ? "Round Trip" : "One Way"} | ${pickupDate} ${pickupTime} | Ref: ${reservationCode}`
      : `TORVIAN VIP Transfer — ${regionName} | ${tripType === "round_trip" ? "Round Trip" : "One Way"} | ${pickupDate} ${pickupTime} | Ref: ${reservationCode}`;

    // Meta's own cookies, carried on the PaymentIntent so the webhook can
    // report the Purchase with the match signals the customer's browser had.
    // Stripe calls that webhook, not the customer, so it has no cookies, IP or
    // user agent of its own.
    const metaIdentity = identityFromRequest(request);

    /**
     * Charged in euro, which is what fares are stored in and what the page
     * quoted. This is the one place the billing currency is decided; the "you
     * are charged as …" line on the checkout reads BILLING_CURRENCY in
     * hooks/useCurrency, and the two have to name the same currency or the
     * customer is told one thing and billed another.
     */
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(stripeAmount * 100),
      currency: "eur",
      /* Let Stripe decide what to offer instead of naming one method.
         This was locked to "card", which meant the wallets were unreachable
         even though the account has them switched on: an iPhone visitor had
         to type a 16-digit number where a fingerprint would have done, and
         that keypad is the highest-friction moment in the whole funnel. It
         also hid the method each market actually pays with — BLIK in Poland,
         Bancontact in Belgium, EPS in Austria, PayPal and Klarna in Germany.
         Stripe now shows what the Dashboard has enabled and what the
         customer's country, device and this EUR amount support.

         Nothing else has to change for the redirect-based ones: the client
         confirms with a `return_url` already, and the webhook completes the
         booking on `payment_intent.succeeded`, which is what an iDEAL or
         Klarna payment lands as once the customer comes back. */
      automatic_payment_methods: { enabled: true },
      description: stripeDescription,
      receipt_email: email,
      metadata: {
        reservation_id: reservation.id,
        reservation_code: reservationCode,
        locale: locale ?? "en",
        payment_method: isCash ? "cash" : "online",
        is_deposit: isCash ? "true" : "false",
        cash_total: isCash ? String(finalTotalPrice) : "",
        driver_amount: isCash ? String(finalDriverAmount) : "",
        ...(metaIdentity.fbp ? { fbp: metaIdentity.fbp } : {}),
        ...(metaIdentity.fbc ? { fbc: metaIdentity.fbc } : {}),
      },
    });

    // Store Stripe payment intent ID on reservation
    await supabase
      .from("reservations")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", reservation.id);

    // Server-side InitiateCheckout to Meta Conversions API. The currency must
    // match what the fare is actually in, or Meta reads a euro figure as
    // dollars and every optimisation target drifts by the exchange rate.
    capiInitiateCheckout(
      finalTotalPrice,
      "EUR",
      { email, phone, firstName, lastName, ...metaIdentity },
      request.headers.get("referer") || undefined,
      `checkout_${reservationCode}`
    ).catch(() => {});

    return NextResponse.json({
      reservationCode,
      clientSecret: paymentIntent.client_secret,
      reservation: {
        id: reservation.id,
        reservationCode,
        totalPrice: finalTotalPrice,
        depositAmount: finalDepositAmount,
        driverAmount: finalDriverAmount,
        paymentMethod: isCash ? "cash" : "online",
        status: "pending",
      },
    });
  } catch (err) {
    console.error("Reservation API unhandled error:", err instanceof Error ? err.stack ?? err.message : String(err));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
