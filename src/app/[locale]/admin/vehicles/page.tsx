import { createAdminClient } from "@/lib/supabase/admin";
import VehiclesScreen from "@/components/admin/vehicles/VehiclesScreen";

export const dynamic = "force-dynamic";

export default async function AdminVehiclesPage() {
  const supabase = createAdminClient();

  const [{ data: vehicles }, { data: categories }] = await Promise.all([
    supabase.from("vehicles").select("*, vehicle_categories(name)").order("plate_number"),
    supabase.from("vehicle_categories").select("id, name").eq("is_active", true).order("sort_order"),
  ]);

  return <VehiclesScreen vehicles={vehicles ?? []} categories={categories ?? []} />;
}
