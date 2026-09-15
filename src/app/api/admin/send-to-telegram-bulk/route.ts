import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { sendBulkTransferToTelegram, type DriverVoucherData } from "@/lib/telegram";

/**
 * The selection from the reservations list, posted to the transfer group as
 * one message (see sendBulkTransferToTelegram) instead of the list's old
 * behaviour of calling /api/admin/send-to-telegram once per row.
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const reservationIds: string[] = Array.isArray(body?.reservationIds) ? body.reservationIds : [];
  if (reservationIds.length === 0) {
    return NextResponse.json({ error: "reservationIds is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from("reservations")
    .select(
      `id, reservation_code, trip_type, direction, pickup_datetime, return_datetime,
       flight_code, return_flight_code, adults, children, luggage_count, child_seat,
       hotel_name, hotel_address, notes,
       payment_method, deposit_amount, driver_amount, currency, exchange_rate_eur,
       customers(first_name, last_name, phone),
       regions(name_en, name_tr, distance_km, duration_minutes),
       driver_assignments(leg, pickup_time, status)`
    )
    .in("id", reservationIds);

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "Reservations not found" }, { status: 404 });
  }

  // Keeps the order the operator selected, not whatever order the database returns.
  const byId = new Map(rows.map((r) => [r.id as string, r]));

  const items: DriverVoucherData[] = [];
  for (const id of reservationIds) {
    const r = byId.get(id);
    if (!r) continue;
    const customer = Array.isArray(r.customers) ? r.customers[0] : r.customers;
    const region = Array.isArray(r.regions) ? r.regions[0] : r.regions;
    const returnAssignment = (r.driver_assignments ?? []).find(
      (a: { leg: string; status: string }) => a.leg === "return" && ["assigned", "accepted", "picked_up"].includes(a.status)
    ) as { pickup_time?: string | null } | undefined;

    items.push({
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
      returnFlightCode: r.return_flight_code ?? undefined,
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
      paymentMethod: r.payment_method,
      depositAmountUsd: r.deposit_amount,
      driverAmountUsd: r.driver_amount,
      currency: r.currency,
      exchangeRateEur: r.exchange_rate_eur,
    });
  }

  try {
    const { messages } = await sendBulkTransferToTelegram(items);
    return NextResponse.json({ ok: true, sent: items.length, messages });
  } catch (err) {
    console.error("send-to-telegram-bulk failed:", err);
    return NextResponse.json({ error: "Telegram'a gönderilemedi." }, { status: 500 });
  }
}
