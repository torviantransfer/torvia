import { createAdminClient } from "@/lib/supabase/admin";
import { todayInBookingTz } from "@/lib/datetime";
import { loadFinance } from "@/lib/financeData";
import { parseRange } from "@/lib/period";
import FinanceDashboard from "@/components/admin/finance/FinanceDashboard";

// Fees and entries change on other screens and have to show on the next visit.
export const dynamic = "force-dynamic";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function AdminFinancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const today = todayInBookingTz();
  const { range, period } = parseRange({ from: first(sp.from), to: first(sp.to), period: first(sp.period) }, today);

  const { report, categories, rates, tablesMissing } = await loadFinance(createAdminClient(), range, today);

  return (
    <FinanceDashboard
      report={report}
      categories={categories}
      rates={rates}
      tablesMissing={tablesMissing}
      period={period}
      adminBase={`/${locale}/admin`}
    />
  );
}
