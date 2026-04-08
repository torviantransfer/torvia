import { createAdminClient } from "@/lib/supabase/admin";
import PricingManager from "@/components/admin/PricingManager";

export default async function AdminPricingPage() {
  const supabase = createAdminClient();

  const { data: pricing } = await supabase
    .from("pricing")
    .select("*, regions(slug, name_en, name_tr), vehicle_categories(name, slug)")
    .order("regions(sort_order)", { ascending: true });

  const { data: regions } = await supabase
    .from("regions")
    .select("id, slug, name_en")
    .eq("is_active", true)
    .order("sort_order");

  const { data: categories } = await supabase
    .from("vehicle_categories")
    .select("id, name, slug")
    .eq("is_active", true);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Fiyatlandırma</h1>
      <PricingManager
        initialPricing={pricing ?? []}
        regions={regions ?? []}
        categories={categories ?? []}
      />
    </div>
  );
}
