import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackReservationSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  // Rate limit: 10 attempts per minute per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`track:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = trackReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input" },
      { status: 400 }
    );
  }

  const trimmedCode = parsed.data.code.toUpperCase();
  const trimmedEmail = parsed.data.email;

  const { data: reservation } = await supabase
    .from("reservations")
    .select(
      `
      id,
      reservation_code,
      trip_type,
      pickup_datetime,
      return_datetime,
      status,
      adults,
      children,
      luggage_count,
      hotel_name,
      hotel_address,
      flight_code,
      child_seat,
      welcome_sign,
      welcome_name,
      total_price,
      base_price,
      night_surcharge,
      child_seat_fee,
      welcome_sign_fee,
      round_trip_discount,
      coupon_discount,
      exchange_rate_eur,
      qr_code_token,
      created_at,
      regions(name_en, name_tr, name_de, name_pl, name_ru, slug),
      customers!inner(first_name, last_name, email),
      vehicle_categories(name),
      driver_assignments(id, leg, pickup_time, status, drivers(full_name, phone), vehicles(plate_number, brand, model))
    `
    )
    .eq("reservation_code", trimmedCode)
    .eq("customers.email", trimmedEmail)
    .single();

  if (!reservation) {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ reservation });
}
