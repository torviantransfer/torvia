import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { settledStatusFor } from "@/lib/reservation-status";

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
      .select("id, reservation_id, status, reservations(payment_method)")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !assignment) {
      return NextResponse.json({ error: "Driver assignment not found" }, { status: 404 });
    }

    if (assignment.status === "picked_up" || assignment.status === "completed") {
      return NextResponse.json(
        { error: "Yolculuk başlamış veya tamamlanmış bir atama kaldırılamaz." },
        { status: 409 }
      );
    }

    // Hard delete — status CHECK constraint doesn't include 'cancelled'
    const { error: deleteError } = await supabase
      .from("driver_assignments")
      .delete()
      .eq("id", assignmentId);

    if (deleteError) {
      console.error("Unassign driver error:", deleteError.message);
      return NextResponse.json({ error: "Atama kaldırılamadı." }, { status: 500 });
    }

    // Back to the paid state if no active assignments remain. Which paid state
    // depends on how the fare is being settled: writing `paid` on a cash
    // booking would say the whole fare is in, when the driver has yet to
    // collect the balance from the passenger.
    const { data: remaining } = await supabase
      .from("driver_assignments")
      .select("id")
      .eq("reservation_id", assignment.reservation_id)
      .in("status", ["assigned", "accepted", "picked_up"]);

    if (!remaining || remaining.length === 0) {
      /* PostgREST hands a to-one join back as an object, while the generated
         types describe it as an array. Unwrap either shape. */
      const reservation = Array.isArray(assignment.reservations)
        ? assignment.reservations[0]
        : assignment.reservations;

      await supabase
        .from("reservations")
        .update({ status: settledStatusFor(reservation?.payment_method) })
        .eq("id", assignment.reservation_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unassign driver exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
