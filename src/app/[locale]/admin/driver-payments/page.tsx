import { createAdminClient } from "@/lib/supabase/admin";
import DriverPayments from "@/components/admin/DriverPayments";
import { todayInBookingTz } from "@/lib/datetime";
import { summariseLedger, type LedgerListRow, type LedgerSummary } from "@/lib/driverStatement";
import { loadAllLedger } from "@/lib/driverStatementData";
import { loadRates } from "@/lib/rates";

// Fees are edited on the reservations screen and the numbers here have to move
// with them, so this must never come back from a prerender.
export const dynamic = "force-dynamic";

/** The movements listed under the drivers; the rest live on each driver's own account. */
const RECENT_MOVEMENTS = 12;

export default async function AdminDriverPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createAdminClient();
  const today = todayInBookingTz();

  const [{ data: drivers }, ledger, rates] = await Promise.all([
    supabase.from("drivers").select("id, full_name, phone, is_active").order("full_name"),
    loadAllLedger(supabase),
    loadRates(supabase),
  ]);

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
    <DriverPayments
      drivers={drivers ?? []}
      balances={balances}
      recent={recent}
      rates={rates}
      today={today}
      adminBase={`/${locale}/admin`}
    />
  );
}
