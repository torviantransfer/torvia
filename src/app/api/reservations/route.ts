import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import crypto from "crypto";
import { reservationSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { sendReservationEmail } from "@/lib/email";
import { notifyNewCashBooking, sendDriverVoucherToTelegram } from "@/lib/telegram";

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
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      flightCode,
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
    const { data: blockedDate } = await supabase
      .from("blocked_dates")
      .select("id")
      .eq("blocked_date", pickupDate)
      .single();

    if (blockedDate) {
      return NextResponse.json(
        { error: "This date is not available for booking" },
        { status: 400 }
      );
    }

    // Check max daily bookings
    const { data: maxSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "max_daily_bookings")
      .single();

    const maxDaily = maxSetting ? Number(maxSetting.value) : 3;

    const { count: dateBookingCount } = await supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .gte("pickup_datetime", `${pickupDate}T00:00:00`)
      .lte("pickup_datetime", `${pickupDate}T23:59:59`)
      .not("status", "in", '("cancelled")');

    if ((dateBookingCount ?? 0) >= maxDaily) {
      return NextResponse.json(
        { error: "This date is fully booked" },
        { status: 400 }
      );
    }

    // Fetch pricing — include cash pricing columns
    let pricingQuery = supabase
      .from("pricing")
      .select("*, one_way_cash_price, round_trip_cash_price, cash_deposit_amount, vehicle_categories!inner(slug)")
      .eq("region_id", region.id);

    if (categorySlug) {
      pricingQuery = pricingQuery.eq("vehicle_categories.slug", categorySlug);
    }

    const { data: pricing } = await pricingQuery.limit(1).single();

    if (!pricing) {
      return NextResponse.json({ error: "Pricing not found" }, { status: 404 });
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
    const cashDepositAmt = pricingRow.cash_deposit_amount as number | null;
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
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (coupon) {
        const now = new Date();
        const from = new Date(coupon.valid_from);
        const until = new Date(coupon.valid_until);
        if (now >= from && now <= until && coupon.used_count < coupon.max_uses) {
          couponId = coupon.id;
          if (coupon.discount_type === "percent") {
            couponDiscountPercent = coupon.discount_value;
          } else {
            couponDiscountFixed = coupon.discount_value;
          }
        }
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
      .eq("base_currency", "USD");

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
        pickup_datetime: pickupDatetime,
        return_datetime: returnDatetime,
        flight_code: flightCode || null,
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
        currency: "USD",
        exchange_rate_eur: rateMap.EUR ?? null,
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

    // If coupon was used, increment used_count
    if (couponId) {
      await supabase.rpc("increment_coupon_usage", { coupon_id: couponId });
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

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(stripeAmount * 100),
      currency: "usd",
      payment_method_types: ["card"],
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
      },
    });

    // Store Stripe payment intent ID on reservation
    await supabase
      .from("reservations")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", reservation.id);

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
