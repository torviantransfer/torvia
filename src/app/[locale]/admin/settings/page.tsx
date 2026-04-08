import { createAdminClient } from "@/lib/supabase/admin";
import SettingsManager from "@/components/admin/SettingsManager";

export default async function AdminSettingsPage() {
  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .order("key");

  const { data: rates } = await supabase
    .from("exchange_rates")
    .select("*")
    .eq("base_currency", "USD");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ayarlar</h1>
      <SettingsManager
        initialSettings={settings ?? []}
        exchangeRates={rates ?? []}
      />
    </div>
  );
}
