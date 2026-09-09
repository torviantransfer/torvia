import { createAdminClient } from "@/lib/supabase/admin";
import ReservationList from "@/components/admin/ReservationList";
import ExportButton from "@/components/admin/ExportButton";

// The list is refreshed in place via router.refresh() after every mutation, so the
// segment must never be served from a prerender.
export const dynamic = "force-dynamic";

export default async function AdminReservationsPage() {
  const supabase = createAdminClient();

  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      `*,
       customers(first_name, last_name, email, phone),
       regions(name_en, name_tr, slug),
       vehicle_categories(name),
       driver_assignments(
         *,
         drivers(full_name, phone),
         vehicles(plate_number, brand, model)
       )`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, full_name, phone")
    .eq("is_active", true)
    .order("full_name");

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, plate_number, brand, model")
    .eq("is_active", true)
    .order("plate_number");

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rezervasyonlar</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Transfer takibi, şoför ataması ve voucher yönetimi
          </p>
        </div>
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
