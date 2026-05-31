import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyCancelAction } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  // Verify admin auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const reservation_id = String(body.reservation_id ?? "").trim();
  const action = String(body.action ?? "").trim();

  if (!reservation_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: reservation } = await admin
    .from("reservations")
    .select("id, reservation_code, status, customer_id, customers(email, first_name, last_name)")
    .eq("id", reservation_id)
    .single();

  if (!reservation || reservation.status !== "cancel_requested") {
    return NextResponse.json({ error: "Reservation not found or not in cancel_requested state" }, { status: 400 });
  }

  const newStatus = action === "approve" ? "cancelled" : "paid";

  if (action === "approve") {
    // Cancel active driver assignments for this reservation so drivers become free again.
    const { error: assignmentError } = await admin
      .from("driver_assignments")
      .update({ status: "cancelled" })
      .eq("reservation_id", reservation_id)
      .in("status", ["assigned", "picked_up"]);

    if (assignmentError) {
      console.error("Cancel action assignment update error:", assignmentError.message);
      return NextResponse.json({ error: "Failed to cancel driver assignments" }, { status: 500 });
    }
  }

  const { error: updateError } = await admin
    .from("reservations")
    .update({ status: newStatus, notes: action === "approve" ? "Cancelled by admin" : "Cancel request rejected" })
    .eq("id", reservation_id);

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // Log
  const rawCustomer = reservation.customers;
  const customer = (Array.isArray(rawCustomer) ? rawCustomer[0] : rawCustomer) as { email: string; first_name: string; last_name: string } | null;
  await admin.from("notification_log").insert({
    reservation_id,
    type: action === "approve" ? "cancel_approved" : "cancel_rejected",
    channel: "system",
    recipient: customer?.email ?? "unknown",
    content: `Cancel ${action}d for ${reservation.reservation_code} by admin`,
    metadata: {
      reservation_code: reservation.reservation_code,
      action,
      admin_user: user.email,
      timestamp: new Date().toISOString(),
    },
  });

  // Telegram
  notifyCancelAction({
    action: action as "approve" | "reject",
    code: reservation.reservation_code,
    customer: `${customer?.first_name} ${customer?.last_name}`,
    admin: user.email ?? "unknown",
  }).catch(() => {});

  return NextResponse.json({ ok: true, newStatus });
}
