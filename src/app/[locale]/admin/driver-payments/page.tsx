import { createAdminClient } from "@/lib/supabase/admin";
import DriverPayments from "@/components/admin/DriverPayments";
import DriverEarnings, {
  type EarningsReservation,
} from "@/components/admin/DriverEarnings";
import { CONFIRMED_STATUSES } from "@/lib/reservation-status";
import { todayInBookingTz } from "@/lib/datetime";
import { summariseLedger, type LedgerListRow, type LedgerSummary } from "@/lib/driverStatement";
import { loadAllLedger, loadUsdRate } from "@/lib/driverStatementData";

// Fees are edited on the reservations screen and the numbers here have to move
// with them, so this must never come back from a prerender.
export const dynamic = "force-dynamic";

/**
 * Statuses where the customer's money is real.
 *
 * `pending` has not been paid for and `cancelled` was refunded — counting
 * either as revenue would inflate the earnings figure with fares that never
 * arrived. `deposit_paid` does belong: a cash booking's deposit has cleared and
 * the driver is owed for the job, which is the whole point of this screen.
 */
const EARNING_STATUSES = CONFIRMED_STATUSES;

/** The ledger list under the drivers table shows this many of the latest movements. */
const RECENT_MOVEMENTS = 200;

export default async function AdminDriverPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createAdminClient();
  const today = todayInBookingTz();

  const [{ data: drivers }, ledger, usdRate] = await Promise.all([
    supabase.from("drivers").select("id, full_name, phone, is_active").order("full_name"),
    loadAllLedger(supabase),
    loadUsdRate(supabase),
  ]);

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
       currency, exchange_rate_usd, exchange_rate_eur,
       regions(name_tr, name_en),
       driver_assignments(id, leg, status, driver_fee, driver_fee_currency, drivers(full_name))`
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

  /**
   * Every row of every driver, in dollars, up to today — the same sum a
   * driver's own statement shows. This used to total the latest 200 rows as
   * raw numbers, so an old movement could drop out of a balance and a euro row
   * could be added to dollars as if it were one.
   */
  const byDriver = new Map<string, LedgerListRow[]>();
  for (const row of ledger) {
    const rows = byDriver.get(row.driver_id) ?? [];
    rows.push(row);
    byDriver.set(row.driver_id, rows);
  }
  const balances: Record<string, LedgerSummary> = {};
  for (const [driverId, rows] of byDriver) {
    balances[driverId] = summariseLedger(rows, today);
  }

  const recent = [...ledger]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, RECENT_MOVEMENTS);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Şoför Ödemeleri (Cari Hesap)
      </h1>

      <DriverEarnings reservations={withDrivers} />

      <DriverPayments
        drivers={drivers ?? []}
        payments={recent}
        balances={balances}
        usdRate={usdRate}
        today={today}
        adminBase={`/${locale}/admin`}
      />
    </div>
  );
}
