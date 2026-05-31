import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const assignmentId = body?.assignmentId;
    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: assignment, error: fetchError } = await supabase
      .from("driver_assignments")
      .select("id, reservation_id, status")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment) {
      return NextResponse.json({ error: "Driver assignment not found" }, { status: 404 });
    }

    if (assignment.status === "picked_up" || assignment.status === "completed") {
      return NextResponse.json(
        { error: "This driver assignment cannot be removed after pickup or completion" },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabase
      .from("driver_assignments")
      .update({ status: "cancelled" })
      .eq("id", assignmentId);

    if (updateError) {
      console.error("Unassign driver error:", updateError.message);
      return NextResponse.json({ error: "Failed to remove driver assignment" }, { status: 500 });
    }

    const { data: remainingActive, error: remainingError } = await supabase
      .from("driver_assignments")
      .select("id")
      .eq("reservation_id", assignment.reservation_id)
      .in("status", ["assigned", "picked_up"]);

    if (!remainingError && (!remainingActive || remainingActive.length === 0)) {
      await supabase
        .from("reservations")
        .update({ status: "paid" })
        .eq("id", assignment.reservation_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unassign driver error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
