import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import crypto from "crypto";
import { reservationSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
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
  const supabase = createAdminClient();
  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`reservation:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = reservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      regionSlug,
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

    // Fetch pricing
    const { data: pricing } = await supabase
      .from("pricing")
      .select("*")
      .eq("region_id", region.id)
      .single();

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
      .in("key", ["night_surcharge_percent", "child_seat_fee", "welcome_sign_fee"]);

    const settingsMap: Record<string, number> = {};
    for (const s of settings ?? []) {
      settingsMap[s.key] = typeof s.value === "number" ? s.value : Number(s.value);
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
      nightSurchargePercent: settingsMap.night_surcharge_percent ?? 0,
      childSeatFee: settingsMap.child_seat_fee ?? 10,
      welcomeSignFee: settingsMap.welcome_sign_fee ?? 5,
    });

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
      .single();

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
        return NextResponse.json(
          { error: "Failed to create customer" },
          { status: 500 }
        );
      }
      customer = newCustomer;
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

    // Create reservation (status: pending)
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
        coupon_id: couponId,
        total_price: calc.totalPrice,
        currency: "USD",
        exchange_rate_eur: rateMap.EUR ?? null,
        exchange_rate_try: rateMap.TRY ?? null,
        status: "pending",
        qr_code_token: qrCodeToken,
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

    // Create Stripe PaymentIntent
    const regionName = region[`name_${locale ?? "en"}`] || region.name_en;
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(calc.totalPrice * 100),
      currency: "usd",
      payment_method_types: ["card"],
      description: `TORVIAN VIP Transfer — ${regionName} | ${tripType === "round_trip" ? "Round Trip" : "One Way"} | ${pickupDate} ${pickupTime} | Ref: ${reservationCode}`,
      receipt_email: email,
      metadata: {
        reservation_id: reservation.id,
        reservation_code: reservationCode,
        locale: locale ?? "en",
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
        totalPrice: calc.totalPrice,
        status: "pending",
      },
    });
  } catch (err) {
    console.error("Reservation API error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
