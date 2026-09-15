import { createAdminClient } from "@/lib/supabase/admin";
import { todayInBookingTz } from "@/lib/datetime";
import { loadDriversOverview } from "@/lib/driversData";
import { loadRates } from "@/lib/rates";
import DriversScreen from "@/components/admin/drivers/DriversScreen";

// A payment or a status change has to show on the next visit.
export const dynamic = "force-dynamic";

export default async function AdminDriversPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = createAdminClient();
  const today = todayInBookingTz();

  const [drivers, rates] = await Promise.all([
    loadDriversOverview(supabase, today),
    loadRates(supabase).catch(() => null),
  ]);

  return <DriversScreen drivers={drivers} rates={rates} today={today} adminBase={`/${locale}/admin`} />;
}
