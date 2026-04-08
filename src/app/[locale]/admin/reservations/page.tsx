import { createAdminClient } from "@/lib/supabase/admin";
import ReservationList from "@/components/admin/ReservationList";
import ExportButton from "@/components/admin/ExportButton";

export default async function AdminReservationsPage() {
  const supabase = createAdminClient();

  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      `*, 
       customers(first_name, last_name, email, phone),
       regions(name_en, slug),
       vehicle_categories(name),
       driver_assignments(*, drivers(full_name, phone))`
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, full_name, phone")
    .eq("is_active", true);

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, plate_number, brand, model")
    .eq("is_active", true);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rezervasyonlar</h1>
        <ExportButton />
      </div>
      <ReservationList
        reservations={reservations ?? []}
        drivers={drivers ?? []}
        vehicles={vehicles ?? []}
      />
    </div>
  );
}
