import { createAdminClient } from "@/lib/supabase/admin";
import VehiclesManager from "@/components/admin/VehiclesManager";

export default async function AdminVehiclesPage() {
  const supabase = createAdminClient();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*, vehicle_categories(name, slug)")
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("vehicle_categories")
    .select("id, name, slug")
    .eq("is_active", true);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Araçlar</h1>
      <VehiclesManager
        initialVehicles={vehicles ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
