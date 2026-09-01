import { createAdminClient } from "@/lib/supabase/admin";
import VehicleCategoriesManager from "@/components/admin/VehicleCategoriesManager";

/**
 * Vehicle classes offered in the booking flow — not the physical fleet, which
 * lives at /admin/vehicles. This is what a customer picks between: capacity,
 * luggage, features and photo. Prices for each class are set in
 * /admin/pricing, which stays the only place a price is edited.
 */
export default async function AdminVehicleCategoriesPage() {
  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from("vehicle_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Araç Tipleri</h1>
      <p className="text-sm text-gray-500 mb-6">
        Rezervasyon ekranında müşterinin seçtiği araçlar. Fiyatlar{" "}
        <span className="font-medium text-gray-700">Fiyatlandırma</span> sayfasından yönetilir.
      </p>
      <VehicleCategoriesManager initialCategories={categories ?? []} />
    </div>
  );
}
