import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

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
    // Soft-delete: set status to cancelled
    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", reservationId);

    if (error) {
      console.error("Delete reservation error:", error.message);
      return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete reservation exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
