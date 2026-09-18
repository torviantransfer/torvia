import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { calculatePrice } from "@/lib/pricing";
import { logEvent } from "@/lib/eventLog";
import { z } from "zod";

/**
 * A booking taken by hand — the phone/WhatsApp customer who cannot fill the
 * public wizard themselves. Mirrors /api/reservations' pricing and insert
 * logic, but the operator names region/category ids directly rather than
 * slugs, skips the coupon and same-day capacity gates (an operator choosing
 * to overbook a slot is doing so on purpose), and takes no payment — the
 * reservation lands as `pending` and a payment link is sent separately
 * (/api/admin/send-payment-link), which is what actually starts the charge.
 */
const schema = z
  .object({
    // `guid`, not `uuid`: zod 4's uuid() also checks the version nibble, and
    // the seeded region and vehicle ids (a0000000-0000-0000-0000-000000000001)
    // have none, so every manual booking for them failed as "Geçersiz form".
    regionId: z.guid(),
    categoryId: z.guid(),
    tripType: z.enum(["one_way", "round_trip"]).default("one_way"),
    direction: z.enum(["airport_to_region", "region_to_airport"]).default("airport_to_region"),
    pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    pickupTime: z.string().regex(/^\d{2}:\d{2}$/),
    returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    returnTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    flightCode: z.string().trim().max(20).optional().nullable(),
    returnFlightCode: z.string().trim().max(20).optional().nullable(),
    adults: z.number().int().min(1).max(20).default(1),
    children: z.number().int().min(0).max(10).default(0),
    luggage: z.number().int().min(0).max(20).default(0),
    childSeat: z.boolean().default(false),
    welcomeSign: z.boolean().default(false),
    welcomeName: z.string().max(100).optional().nullable(),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().toLowerCase().email().max(255),
    phone: z.string().trim().min(7).max(20),
    hotelName: z.string().trim().max(200).optional().nullable(),
    hotelAddress: z.string().max(500).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    locale: z.enum(["tr", "en", "de", "pl", "ru", "nl", "ro", "ar"]).default("tr"),
    paymentMethod: z.enum(["online", "cash"]).default("online"),
  })
  .refine((d) => (d.tripType === "round_trip" ? !!d.returnDate && !!d.returnTime : true), {
    message: "Round trip requires a return date and time",
    path: ["returnDate"],
  });

function generateReservationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "VL-";
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export async function POST(request: NextRequest) {
  const { error: authError, user } = await requireAdmin();
  if (authError) return authError;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz form", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const d = parsed.data;
  const supabase = createAdminClient();

  const { data: region } = await supabase.from("regions").select("*").eq("id", d.regionId).single();
  if (!region) return NextResponse.json({ error: "Bölge bulunamadı." }, { status: 404 });

  const { data: pricing } = await supabase
    .from("pricing")
    .select("*")
    .eq("region_id", d.regionId)
    .eq("category_id", d.categoryId)
    .single();
  if (!pricing) return NextResponse.json({ error: "Bu bölge/araç için fiyat tanımlı değil." }, { status: 404 });

  const { data: category } = await supabase
    .from("vehicle_categories")
    .select("max_passengers")
    .eq("id", d.categoryId)
    .single();
  const partySize = d.adults + d.children;
  if (category && partySize > category.max_passengers) {
    return NextResponse.json(
      { error: `Bu araç en fazla ${category.max_passengers} yolcu alır, bu rezervasyon ${partySize} kişilik.` },
      { status: 400 }
    );
  }

  if (d.tripType === "round_trip" && !pricing.round_trip_price) {
    return NextResponse.json({ error: "Bu bölge için gidiş-dönüş fiyatı tanımlı değil." }, { status: 400 });
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [
      "child_seat_fee",
      "welcome_sign_fee",
      "cash_payment_enabled",
      "night_tariff_enabled",
      "night_tariff_start",
      "night_tariff_end",
      "night_tariff_percent",
    ]);
  const settingsMap: Record<string, unknown> = {};
  for (const s of settings ?? []) settingsMap[s.key] = s.value;
  const numSetting = (key: string) => {
    const v = settingsMap[key];
    return typeof v === "number" ? v : Number(v ?? 0);
  };

  const isCash = d.paymentMethod === "cash";
  const cashEnabled = settingsMap.cash_payment_enabled === true || settingsMap.cash_payment_enabled === "true";
  const pricingRow = pricing as Record<string, unknown>;
  const cashBasePrice = d.tripType === "round_trip"
    ? (pricingRow.round_trip_cash_price as number | null)
    : (pricingRow.one_way_cash_price as number | null);
  const cashDepositAmt = d.tripType === "round_trip"
    ? ((pricingRow.round_trip_cash_deposit_amount as number | null) ?? (pricingRow.cash_deposit_amount as number | null))
    : (pricingRow.cash_deposit_amount as number | null);

  if (isCash && !cashEnabled) return NextResponse.json({ error: "Nakit ödeme kapalı." }, { status: 400 });
  if (isCash && (!cashBasePrice || !cashDepositAmt)) {
    return NextResponse.json({ error: "Bu bölge için nakit fiyat tanımlı değil." }, { status: 400 });
  }

  const nightEnabled = settingsMap.night_tariff_enabled === true || settingsMap.night_tariff_enabled === "true";
  const parseHour = (v: unknown) => {
    const s = String(v ?? "");
    return parseInt(s.includes(":") ? s.split(":")[0] : s, 10) || 0;
  };

  const calc = calculatePrice({
    oneWayPrice: pricing.one_way_price,
    roundTripPrice: pricing.round_trip_price,
    tripType: d.tripType,
    pickupTime: d.pickupTime,
    childSeat: d.childSeat,
    welcomeSign: d.welcomeSign,
    couponDiscountPercent: 0,
    couponDiscountFixed: 0,
    nightSurchargePercent: numSetting("night_tariff_percent"),
    nightTariffEnabled: nightEnabled,
    nightTariffStart: parseHour(settingsMap.night_tariff_start ?? "0"),
    nightTariffEnd: parseHour(settingsMap.night_tariff_end ?? "7"),
    childSeatFee: numSetting("child_seat_fee") || 10,
    welcomeSignFee: numSetting("welcome_sign_fee") || 5,
    onlineDiscountPercent: 0,
  });

  const finalTotalPrice = isCash
    ? cashBasePrice! + calc.childSeatFee + calc.welcomeSignFee + calc.nightSurcharge
    : calc.totalPrice;
  const finalDepositAmount = isCash ? cashDepositAmt! : 0;
  const finalDriverAmount = isCash ? finalTotalPrice - finalDepositAmount : 0;

  const { data: rates } = await supabase.from("exchange_rates").select("target_currency, rate").eq("base_currency", "EUR");
  const rateMap: Record<string, number> = {};
  for (const r of rates ?? []) rateMap[r.target_currency] = r.rate;

  let { data: customer } = await supabase.from("customers").select("*").eq("email", d.email).maybeSingle();
  if (!customer) {
    const { data: newCustomer, error: custErr } = await supabase
      .from("customers")
      .insert({ first_name: d.firstName, last_name: d.lastName, email: d.email, phone: d.phone })
      .select()
      .single();
    if (custErr) {
      if (custErr.code === "23505") {
        const { data: existing } = await supabase.from("customers").select("*").eq("email", d.email).maybeSingle();
        customer = existing;
      }
      if (!customer) return NextResponse.json({ error: "Müşteri oluşturulamadı." }, { status: 500 });
    } else {
      customer = newCustomer;
    }
  }

  let reservationCode = generateReservationCode();
  let exists = true;
  while (exists) {
    const { data } = await supabase.from("reservations").select("id").eq("reservation_code", reservationCode).single();
    if (!data) exists = false;
    else reservationCode = generateReservationCode();
  }

  const pickupDatetime = `${d.pickupDate}T${d.pickupTime}:00`;
  const returnDatetime = d.tripType === "round_trip" && d.returnDate && d.returnTime ? `${d.returnDate}T${d.returnTime}:00` : null;

  const { data: reservation, error: resErr } = await supabase
    .from("reservations")
    .insert({
      reservation_code: reservationCode,
      customer_id: customer!.id,
      region_id: d.regionId,
      category_id: d.categoryId,
      trip_type: d.tripType,
      direction: d.direction,
      pickup_datetime: pickupDatetime,
      return_datetime: returnDatetime,
      flight_code: d.flightCode || null,
      return_flight_code: d.tripType === "round_trip" ? d.returnFlightCode || null : null,
      adults: d.adults,
      children: d.children,
      luggage_count: d.luggage,
      child_seat: d.childSeat,
      welcome_sign: d.welcomeSign,
      welcome_name: d.welcomeName || null,
      hotel_name: d.hotelName || null,
      hotel_address: d.hotelAddress || null,
      notes: d.notes || null,
      base_price: calc.basePrice,
      night_surcharge: calc.nightSurcharge,
      child_seat_fee: calc.childSeatFee,
      welcome_sign_fee: calc.welcomeSignFee,
      round_trip_discount: calc.roundTripDiscount,
      coupon_discount: 0,
      online_discount: 0,
      deposit_amount: finalDepositAmount,
      driver_amount: finalDriverAmount,
      total_price: finalTotalPrice,
      currency: "EUR",
      exchange_rate_eur: null,
      exchange_rate_usd: rateMap.USD ?? null,
      exchange_rate_try: rateMap.TRY ?? null,
      status: "pending",
      payment_method: isCash ? "cash" : "online",
      qr_code_token: crypto.randomUUID(),
      locale: d.locale,
    })
    .select()
    .single();

  if (resErr || !reservation) {
    console.error("Admin create-reservation error:", resErr?.message);
    return NextResponse.json({ error: "Rezervasyon oluşturulamadı." }, { status: 500 });
  }

  await logEvent(supabase, {
    reservationId: reservation.id,
    action: "created",
    actor: user?.email ?? "admin",
    detail: { source: "admin" },
  });

  return NextResponse.json({ reservationCode, reservationId: reservation.id });
}
