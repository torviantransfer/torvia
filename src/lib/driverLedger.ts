import type { SupabaseClient } from "@supabase/supabase-js";
// One implementation of "move this amount between euro and dollars", shared
// with the admin screens — the ledger and the profit line must not be able to
// disagree about what a job is worth.
import { convertSettlement, settlementOf, type Settlement } from "@/lib/currency";

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
    .select("id, leg, driver_id, driver_fee, driver_fee_currency, reservation_id")
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
    .select(
      "reservation_code, payment_method, driver_amount, trip_type, currency, exchange_rate_usd, exchange_rate_eur"
    )
    .eq("id", assignment.reservation_id)
    .single();

  const code = reservation?.reservation_code ?? "?";
  const isReturn = assignment.leg === "return";
  const legLabel =
    reservation?.trip_type === "round_trip" ? (isReturn ? "dönüş" : "gidiş") : "tek yön";

  /**
   * Every row of one assignment is written in the currency that assignment is
   * settled in, which is the currency of the agreed fee — dollars, unless
   * someone has set this driver to euro. A ledger holding two currencies has no
   * balance at all: a $70 fee against a €60 collection nets to "$10 owed" when
   * the truth is about fifty cents.
   */
  const feeCurrency: Settlement =
    assignment.driver_fee_currency === "EUR" ? "EUR" : "USD";

  const rows: Record<string, unknown>[] = [
    {
      driver_id: assignment.driver_id,
      reservation_id: assignment.reservation_id,
      assignment_id: assignmentId,
      type: "earning",
      amount: fee,
      currency: feeCurrency,
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
   *
   * The fare is in the reservation's own currency — euro since the switch —
   * while the driver is settled in dollars, so it is converted first, at the
   * rate stored on the reservation rather than today's. The job was priced,
   * agreed and collected on its own day; re-reading it months later at a moved
   * rate would change what the driver is owed after the fact.
   */
  const cashFromPassenger = Number(reservation?.driver_amount ?? 0);
  if (reservation?.payment_method === "cash" && !isReturn && cashFromPassenger > 0) {
    const settled = convertSettlement(
      cashFromPassenger,
      settlementOf(reservation.currency),
      feeCurrency,
      reservation.exchange_rate_usd,
      reservation.exchange_rate_eur
    );

    if (settled === null) {
      // Writing the unconverted figure would look plausible and stay wrong by
      // the exchange rate for ever. Leaving the row out overstates what the
      // driver is owed, which is caught at payout — the louder failure is the
      // safer one.
      console.error(
        `[driverLedger] ${assignmentId}: ${code} tahsilatı ${reservation.currency} ` +
          `ama şoför ${feeCurrency} ile hesaplaşıyor ve rezervasyonda kur yok. ` +
          `Nakit satırı yazılmadı — bakiye olduğundan yüksek görünecek.`
      );
    } else {
      rows.push({
        driver_id: assignment.driver_id,
        reservation_id: assignment.reservation_id,
        assignment_id: assignmentId,
        type: "payment",
        amount: settled,
        currency: feeCurrency,
        description: `${code} · ${legLabel} — müşteriden nakit tahsil etti`,
      });
    }
  }

  const { error } = await supabase.from("driver_payments").insert(rows);
  if (error) {
    // The assignment itself is already saved; failing here would leave the
    // caller unsure which half went through. Loud in the log, silent to the
    // admin, and re-running the fee save fixes it.
    console.error(`[driverLedger] ${assignmentId} ledger write failed:`, error.message);
  }
}
