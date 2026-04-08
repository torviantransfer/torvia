import { createAdminClient } from "@/lib/supabase/admin";
import RegionsManager from "@/components/admin/RegionsManager";

export default async function AdminRegionsPage() {
  const supabase = createAdminClient();

  const { data: regions } = await supabase
    .from("regions")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bölgeler</h1>
      <RegionsManager initialRegions={regions ?? []} />
    </div>
  );
}
