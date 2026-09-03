import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { sendDriverVoucherToTelegram } from "@/lib/telegram";

/**
 * Posts a reservation into the transfer group on demand, so whichever driver is
 * free can pick it up. Same message the booking flow posts automatically, and
 * likewise without any prices in it.
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const reservationId = body?.reservationId;
  if (!reservationId) {
    return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: r } = await supabase
    .from("reservations")
    .select(
      `reservation_code, trip_type, direction, pickup_datetime, return_datetime,
       flight_code, adults, children, luggage_count, child_seat,
       hotel_name, hotel_address, notes,
       customers(first_name, last_name, phone),
       regions(name_en, name_tr, distance_km, duration_minutes),
       driver_assignments(leg, pickup_time, status)`
    )
    .eq("id", reservationId)
    .single();

  if (!r) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const customer = Array.isArray(r.customers) ? r.customers[0] : r.customers;
  const region = Array.isArray(r.regions) ? r.regions[0] : r.regions;

  // If a return driver has already been given a hotel pickup time, the group
  // should see that time rather than the flight's.
  const returnAssignment = (r.driver_assignments ?? []).find(
    (a: { leg: string; status: string }) =>
      a.leg === "return" && ["assigned", "accepted", "picked_up"].includes(a.status)
  ) as { pickup_time?: string | null } | undefined;

  try {
    await sendDriverVoucherToTelegram({
      reservationCode: r.reservation_code,
      customerFirstName: customer?.first_name ?? "",
      customerLastName: customer?.last_name ?? "",
      customerPhone: customer?.phone,
      tripType: r.trip_type,
      direction: r.direction,
      pickupDatetime: r.pickup_datetime,
      returnDatetime: r.return_datetime ?? undefined,
      returnPickupTime: returnAssignment?.pickup_time ?? null,
      flightCode: r.flight_code ?? undefined,
      hotelName: r.hotel_name ?? undefined,
      hotelAddress: r.hotel_address ?? undefined,
      regionName: String(region?.name_tr ?? region?.name_en ?? ""),
      distanceKm: region?.distance_km ?? undefined,
      durationMinutes: region?.duration_minutes ?? undefined,
      adults: r.adults ?? 1,
      children: r.children ?? 0,
      luggageCount: r.luggage_count ?? 0,
      childSeat: r.child_seat ?? false,
      notes: r.notes ?? undefined,
    });
  } catch (err) {
    console.error("send-to-telegram failed:", err);
    return NextResponse.json({ error: "Telegram'a gönderilemedi." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
