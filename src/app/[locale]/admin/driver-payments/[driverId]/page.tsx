import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInBookingTz } from "@/lib/datetime";
import { parseRange } from "@/lib/driverStatement";
import { loadDriverStatement } from "@/lib/driverStatementData";
import DriverStatement from "@/components/admin/DriverStatement";

// A payment saved on this screen has to show on the next render.
export const dynamic = "force-dynamic";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function DriverStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; driverId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, driverId } = await params;
  const sp = await searchParams;
  const today = todayInBookingTz();
  const { range, period } = parseRange(
    { from: first(sp.from), to: first(sp.to), period: first(sp.period) },
    today
  );

  const loaded = await loadDriverStatement(createAdminClient(), driverId, range, today);
  if (!loaded) notFound();

  return (
    <DriverStatement
      statement={loaded.statement}
      period={period}
      rates={loaded.rates}
      adminBase={`/${locale}/admin`}
    />
  );
}
