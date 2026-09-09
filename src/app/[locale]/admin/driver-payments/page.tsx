import { createAdminClient } from "@/lib/supabase/admin";
import DriverPayments from "@/components/admin/DriverPayments";
import DriverEarnings, {
  type EarningsReservation,
} from "@/components/admin/DriverEarnings";

// Fees are edited on the reservations screen and the numbers here have to move
// with them, so this must never come back from a prerender.
export const dynamic = "force-dynamic";

/**
 * Statuses where the customer's money is real.
 *
 * `pending` has not been paid for and `cancelled` was refunded — counting
 * either as revenue would inflate the earnings figure with fares that never
 * arrived.
 */
const EARNING_STATUSES = [
  "paid",
  "driver_assigned",
  "passenger_picked_up",
  "completed",
];

export default async function AdminDriverPaymentsPage() {
  const supabase = createAdminClient();

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, full_name, phone, is_active")
    .order("full_name");

  const { data: payments } = await supabase
    .from("driver_payments")
    .select(
      "*, drivers(full_name), reservations(reservation_code)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  /**
   * Grouped by pickup_datetime rather than by when the booking was made: "this
   * month's earnings" means the transfers driven this month, which is also the
   * month the driver invoices for.
   *
   * Thirteen months so "this year" is whole in January; the period buttons
   * filter this set in the browser.
   */
  const since = new Date();
  since.setMonth(since.getMonth() - 13);

  const { data: earningsRows } = await supabase
    .from("reservations")
    .select(
      `id, reservation_code, pickup_datetime, total_price, trip_type, payment_method,
       regions(name_tr, name_en),
       driver_assignments(id, leg, status, driver_fee, drivers(full_name))`
    )
    .in("status", EARNING_STATUSES)
    .gte("pickup_datetime", since.toISOString())
    .order("pickup_datetime", { ascending: false })
    .limit(1000);

  // Only bookings that actually have a driver on them: an unassigned transfer
  // has no driver cost yet and would read as pure profit.
  const withDrivers = ((earningsRows ?? []) as unknown as EarningsReservation[]).filter(
    (r) => (r.driver_assignments ?? []).length > 0
  );

  // Calculate balances per driver
  const balances: Record<
    string,
    { earnings: number; payments: number; adjustments: number; balance: number }
  > = {};

  for (const d of drivers ?? []) {
    balances[d.id] = { earnings: 0, payments: 0, adjustments: 0, balance: 0 };
  }

  for (const p of payments ?? []) {
    if (!balances[p.driver_id]) continue;
    if (p.type === "earning") {
      balances[p.driver_id].earnings += p.amount;
      balances[p.driver_id].balance += p.amount;
    } else if (p.type === "payment") {
      balances[p.driver_id].payments += p.amount;
      balances[p.driver_id].balance -= p.amount;
    } else if (p.type === "adjustment") {
      balances[p.driver_id].adjustments += p.amount;
      balances[p.driver_id].balance += p.amount;
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Şoför Ödemeleri (Cari Hesap)
      </h1>

      <DriverEarnings reservations={withDrivers} />

      <DriverPayments
        drivers={drivers ?? []}
        payments={payments ?? []}
        balances={balances}
      />
    </div>
  );
}
