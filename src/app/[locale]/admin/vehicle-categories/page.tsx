import { createAdminClient } from "@/lib/supabase/admin";
import VehicleCategoriesScreen from "@/components/admin/vehicle-categories/VehicleCategoriesScreen";

/**
 * Vehicle classes offered in the booking flow — not the physical fleet, which
 * lives at /admin/vehicles. Prices for each class are set in /admin/pricing.
 */
export default async function AdminVehicleCategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = createAdminClient();

  const { data: categories } = await supabase.from("vehicle_categories").select("*").order("sort_order", { ascending: true });

  return <VehicleCategoriesScreen categories={categories ?? []} adminBase={`/${locale}/admin`} />;
}
