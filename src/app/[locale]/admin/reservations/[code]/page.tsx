import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import ReservationDetailView from "@/components/admin/reservations/ReservationDetailView";
import type { Reservation } from "@/components/admin/reservations/types";

// Assigning a driver or editing the booking calls router.refresh(), so this
// must never be served from a prerender.
export const dynamic = "force-dynamic";

/** How far either side of the transfer to look for a driver's other jobs. */
const WORKLOAD_WINDOW_DAYS = 2;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return { title: `${decodeURIComponent(code)} — TORVIAN Admin` };
}

export default async function AdminReservationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  const supabase = createAdminClient();

  const { data: reservation } = await supabase
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
    .eq("reservation_code", decodeURIComponent(code))
    .maybeSingle();

  if (!reservation) notFound();

  /**
   * The assign panel shows how busy each driver already is on the day, which
   * needs other bookings — but only the ones near this transfer. Loading the
   * whole table again to answer "does this driver have another job that
   * morning" would undo the point of splitting the list from the detail.
   */
  const centre = new Date(reservation.pickup_datetime as string);
  const from = new Date(centre);
  from.setDate(from.getDate() - WORKLOAD_WINDOW_DAYS);
  const to = new Date(centre);
  to.setDate(to.getDate() + WORKLOAD_WINDOW_DAYS);

  const { data: nearby } = await supabase
    .from("reservations")
    .select(
      `id, reservation_code, status, trip_type, pickup_datetime, return_datetime,
       regions(name_en, name_tr),
       driver_assignments(id, leg, status, driver_id)`
    )
    .neq("status", "cancelled")
    .gte("pickup_datetime", from.toISOString())
    .lte("pickup_datetime", to.toISOString())
    .limit(300);

  const [{ data: drivers }, { data: vehicles }] = await Promise.all([
    supabase
      .from("drivers")
      .select("id, full_name, phone")
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("vehicles")
      .select("id, plate_number, brand, model")
      .eq("is_active", true)
      .order("plate_number"),
  ]);

  return (
    <ReservationDetailView
      reservation={reservation as unknown as Reservation}
      nearbyReservations={(nearby ?? []) as unknown as Reservation[]}
      drivers={drivers ?? []}
      vehicles={vehicles ?? []}
      adminBase={`/${locale}/admin`}
    />
  );
}
