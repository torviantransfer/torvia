import { createAdminClient } from "@/lib/supabase/admin";
import SettingsManager from "@/components/admin/SettingsManager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();

  const { data: settings } = await supabase.from("settings").select("*").order("key");
  const { data: rates } = await supabase.from("exchange_rates").select("*").eq("base_currency", "EUR");

  return <SettingsManager initialSettings={settings ?? []} exchangeRates={rates ?? []} />;
}
