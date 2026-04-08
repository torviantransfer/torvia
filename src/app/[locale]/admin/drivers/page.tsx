import { createAdminClient } from "@/lib/supabase/admin";
import DriversManager from "@/components/admin/DriversManager";

export default async function AdminDriversPage() {
  const supabase = createAdminClient();

  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, plate_number, brand, model")
    .eq("is_active", true);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Şoförler</h1>
      <DriversManager
        initialDrivers={drivers ?? []}
        vehicles={vehicles ?? []}
      />
    </div>
  );
}
