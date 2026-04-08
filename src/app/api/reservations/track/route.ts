import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, email } = body;

  if (!code || !email) {
    return NextResponse.json(
      { error: "Reservation code and email are required" },
      { status: 400 }
    );
  }

  const trimmedCode = String(code).trim().toUpperCase();
  const trimmedEmail = String(email).trim().toLowerCase();

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
      vehicle_categories(name)
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
