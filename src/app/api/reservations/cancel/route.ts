import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyCancelRequest } from "@/lib/telegram";
import { legRoute } from "@/lib/transfer-route";
import { formatBookingDateTime } from "@/lib/datetime";

const CANCELLABLE = ["pending", "paid", "driver_assigned"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const reservation_id = String(body.reservation_id ?? "").trim();
  const reason = String(body.reason ?? "").trim().slice(0, 500);

  if (!reservation_id) {
    return NextResponse.json({ error: "reservation_id required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find customer
  const { data: customer } = await admin
    .from("customers")
    .select("id, email, first_name, last_name")
    .eq("auth_user_id", user.id)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Fetch reservation and verify ownership
  const { data: reservation } = await admin
    .from("reservations")
    .select("id, reservation_code, status, customer_id, direction, pickup_datetime, regions(name_en)")
    .eq("id", reservation_id)
    .single();

  if (!reservation || reservation.customer_id !== customer.id) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  if (!CANCELLABLE.includes(reservation.status)) {
    return NextResponse.json({ error: "Cannot cancel this reservation" }, { status: 400 });
  }

  // Update status
  const { error: updateError } = await admin
    .from("reservations")
    .update({ status: "cancel_requested", notes: reason ? `Cancel reason: ${reason}` : null })
    .eq("id", reservation_id);

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Log notification
  await admin.from("notification_log").insert({
    reservation_id,
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
    route: legRoute(reservation.direction, "outbound", regionName),
    pickup: formatBookingDateTime(reservation.pickup_datetime),
    previousStatus: reservation.status,
    reason: reason || undefined,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
