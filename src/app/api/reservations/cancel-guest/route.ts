import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyCancelRequest } from "@/lib/telegram";

const CANCELLABLE = ["pending", "paid", "driver_assigned"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const reservation_code = String(body.reservation_code ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const reason = String(body.reason ?? "").trim().slice(0, 500);

  if (!reservation_code || !email) {
    return NextResponse.json({ error: "reservation_code and email required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find customer by email
  const { data: customer } = await admin
    .from("customers")
    .select("id, email, first_name, last_name")
    .eq("email", email)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  // Fetch reservation and verify ownership
  const { data: reservation } = await admin
    .from("reservations")
    .select("id, reservation_code, status, customer_id, pickup_datetime, regions(name_en)")
    .eq("reservation_code", reservation_code)
    .eq("customer_id", customer.id)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  if (!CANCELLABLE.includes(reservation.status)) {
    return NextResponse.json({ error: "Cannot cancel this reservation" }, { status: 400 });
  }

  // Update status
  const { error: updateError } = await admin
    .from("reservations")
    .update({ status: "cancel_requested", notes: reason ? `Cancel reason: ${reason}` : null })
    .eq("id", reservation.id);

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Log notification
  await admin.from("notification_log").insert({
    reservation_id: reservation.id,
    type: "cancel_requested",
    channel: "system",
    recipient: customer.email ?? "unknown",
    content: `Cancel request by ${customer.first_name} ${customer.last_name} for ${reservation.reservation_code}. Reason: ${reason || "N/A"}`,
    metadata: {
      reservation_code: reservation.reservation_code,
      customer_name: `${customer.first_name} ${customer.last_name}`,
      reason,
      previous_status: reservation.status,
      timestamp: new Date().toISOString(),
    },
  });

  // Telegram notification to admin
  const regionName = Array.isArray(reservation.regions)
    ? (reservation.regions[0] as { name_en: string })?.name_en
    : (reservation.regions as { name_en: string } | null)?.name_en ?? "";

  notifyCancelRequest({
    code: reservation.reservation_code,
    customer: `${customer.first_name} ${customer.last_name}`,
    route: `Antalya Airport → ${regionName}`,
    pickup: new Date(reservation.pickup_datetime).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
    previousStatus: reservation.status,
    reason: reason || undefined,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
