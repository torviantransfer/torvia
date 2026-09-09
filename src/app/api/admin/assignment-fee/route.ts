import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { syncAssignmentLedger } from "@/lib/driverLedger";

/**
 * Sets, changes or clears what we pay the driver for one leg.
 *
 * Separate from assign-driver because the rate is usually agreed after the
 * driver is booked — the admin assigns first and haggles second — and because
 * changing it later must not mean tearing down the assignment and its link.
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const assignmentId = body?.assignmentId;

    if (typeof assignmentId !== "string" || !assignmentId) {
      return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
    }

    // null clears the fee, which is not the same as zero: cleared means "not
    // agreed yet" and the transfer is counted as unpriced in the earnings
    // summary, where zero would quietly report the whole fare as profit.
    const raw = body?.driverFee;
    let driverFee: number | null = null;
    if (raw !== null && raw !== undefined && raw !== "") {
      driverFee = Number(raw);
      if (!Number.isFinite(driverFee) || driverFee < 0) {
        return NextResponse.json({ error: "Geçersiz ücret." }, { status: 400 });
      }
      driverFee = Math.round(driverFee * 100) / 100;
    }

    const supabase = createAdminClient();

    const { data: assignment, error: updateError } = await supabase
      .from("driver_assignments")
      .update({ driver_fee: driverFee })
      .eq("id", assignmentId)
      .select("id")
      .single();

    if (updateError || !assignment) {
      console.error("Assignment fee update error:", updateError?.message);
      return NextResponse.json({ error: "Ücret kaydedilemedi." }, { status: 500 });
    }

    await syncAssignmentLedger(supabase, assignmentId);

    return NextResponse.json({ ok: true, driverFee });
  } catch (err) {
    console.error("Assignment fee exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
