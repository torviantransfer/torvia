import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ReservationsList from "@/components/account/ReservationsList";

export default async function AccountReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single();

  let reservations: Array<{
    id: string;
    reservation_code: string;
    trip_type: string;
    pickup_datetime: string;
    return_datetime: string | null;
    status: string;
    total_price: number;
    exchange_rate_eur: number | null;
    hotel_name: string | null;
    adults: number;
    children: number;
    qr_code_token: string | null;
    regions: { name_en: string; name_tr: string; name_de: string; name_pl: string; name_ru: string } | null;
    vehicle_categories: { name: string } | null;
    driver_assignments: Array<{
      id: string;
      leg: string;
      pickup_time: string | null;
      status: string;
      drivers: { full_name: string; phone: string } | null;
      vehicles: { plate_number: string; brand: string; model: string } | null;
    }>;
  }> = [];

  if (customer) {
    const { data } = await admin
      .from("reservations")
      .select("id, reservation_code, trip_type, pickup_datetime, return_datetime, status, total_price, exchange_rate_eur, hotel_name, adults, children, qr_code_token, regions(name_en, name_tr, name_de, name_pl, name_ru), vehicle_categories(name), driver_assignments(id, leg, pickup_time, status, drivers(full_name, phone), vehicles(plate_number, brand, model))")
      .eq("customer_id", customer.id)
      .order("pickup_datetime", { ascending: false });

    reservations = ((data ?? []) as unknown as typeof reservations).map((r) => ({
      ...r,
      regions: Array.isArray(r.regions) ? r.regions[0] ?? null : r.regions,
      vehicle_categories: Array.isArray(r.vehicle_categories) ? r.vehicle_categories[0] ?? null : r.vehicle_categories,
      driver_assignments: (r.driver_assignments ?? []).map((da) => ({
        ...da,
        drivers: Array.isArray(da.drivers) ? da.drivers[0] ?? null : da.drivers,
        vehicles: Array.isArray(da.vehicles) ? da.vehicles[0] ?? null : da.vehicles,
      })),
    }));
  }

  return <ReservationsList reservations={reservations} locale={locale} />;
}
