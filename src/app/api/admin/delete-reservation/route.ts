import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

const HARD_DELETE_STATUSES = ["pending", "cancelled"];

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const reservationId = body?.reservationId;
    if (!reservationId) {
      return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch current status first
    const { data: existing } = await supabase
      .from("reservations")
      .select("status")
      .eq("id", reservationId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (HARD_DELETE_STATUSES.includes(existing.status)) {
      // Hard delete — cascade handles driver_assignments, reviews, notification_log
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservationId);

      if (error) {
        console.error("Hard delete error:", error.message);
        return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 });
      }
    } else {
      // Paid/active reservations: soft-cancel only (preserve audit trail)
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);

      if (error) {
        console.error("Soft cancel error:", error.message);
        return NextResponse.json({ error: "Failed to cancel reservation" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete reservation exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
