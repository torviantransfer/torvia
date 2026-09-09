import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Keeps the driver ledger in step with one assignment's agreed fee.
 *
 * Every row this writes carries the assignment's id, which is what separates
 * generated rows from the ones an admin typed into the payments screen by hand
 * (those have assignment_id NULL). So this can safely clear its own previous
 * output before writing the current answer — editing a fee replaces the old
 * entries instead of stacking another set on top of them — while a real payout
 * someone recorded manually is never touched.
 *
 * Call it after anything that changes driver_fee, driver_id, or the
 * reservation's payment terms. Removing an assignment needs no call: the
 * assignment_id foreign key cascades, so the rows go with it.
 */
export async function syncAssignmentLedger(
  supabase: SupabaseClient,
  assignmentId: string
): Promise<void> {
  const { data: assignment } = await supabase
    .from("driver_assignments")
    .select("id, leg, driver_id, driver_fee, reservation_id")
    .eq("id", assignmentId)
    .single();

  if (!assignment) return;

  // Always clear first, so clearing a fee — or moving the leg to a different
  // driver — leaves nothing owed to the old one.
  await supabase.from("driver_payments").delete().eq("assignment_id", assignmentId);

  const fee = assignment.driver_fee === null ? null : Number(assignment.driver_fee);
  if (!assignment.driver_id || fee === null || Number.isNaN(fee)) return;

  const { data: reservation } = await supabase
    .from("reservations")
    .select("reservation_code, payment_method, driver_amount, trip_type")
    .eq("id", assignment.reservation_id)
    .single();

  const code = reservation?.reservation_code ?? "?";
  const isReturn = assignment.leg === "return";
  const legLabel =
    reservation?.trip_type === "round_trip" ? (isReturn ? "dönüş" : "gidiş") : "tek yön";

  const rows: Record<string, unknown>[] = [
    {
      driver_id: assignment.driver_id,
      reservation_id: assignment.reservation_id,
      assignment_id: assignmentId,
      type: "earning",
      amount: fee,
      description: `${code} · ${legLabel} — şoför ücreti`,
    },
  ];

  /**
   * On a cash booking the passenger hands the driver the fare, so that money
   * has already reached him and comes off what we owe. Recorded as a payment
   * rather than netted off the fee, so the ledger still shows both the agreed
   * rate and how it was settled.
   *
   * Only on the outbound leg. The passenger pays once, at the airport pickup,
   * and reservations.driver_amount is a single figure for the whole booking —
   * charging it against both drivers of a round trip would wipe out a debt
   * that is genuinely owed. (The driver voucher prints this amount on both
   * legs' sheets, which is a separate problem with the voucher, not a reason
   * to double-count it here.)
   */
  const cashFromPassenger = Number(reservation?.driver_amount ?? 0);
  if (reservation?.payment_method === "cash" && !isReturn && cashFromPassenger > 0) {
    rows.push({
      driver_id: assignment.driver_id,
      reservation_id: assignment.reservation_id,
      assignment_id: assignmentId,
      type: "payment",
      amount: cashFromPassenger,
      description: `${code} · ${legLabel} — müşteriden nakit tahsil etti`,
    });
  }

  const { error } = await supabase.from("driver_payments").insert(rows);
  if (error) {
    // The assignment itself is already saved; failing here would leave the
    // caller unsure which half went through. Loud in the log, silent to the
    // admin, and re-running the fee save fixes it.
    console.error(`[driverLedger] ${assignmentId} ledger write failed:`, error.message);
  }
}
