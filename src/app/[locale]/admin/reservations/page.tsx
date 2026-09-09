import { createAdminClient } from "@/lib/supabase/admin";
import ReservationList from "@/components/admin/ReservationList";
import ExportButton from "@/components/admin/ExportButton";
import type { Reservation } from "@/components/admin/reservations/types";

// The list is refreshed in place via router.refresh() after every mutation, so the
// segment must never be served from a prerender.
export const dynamic = "force-dynamic";

/**
 * Only what a row shows or a filter reads.
 *
 * This used to be `*` plus four joins for two hundred rows — every price
 * component, every note and address, the full assignment records with their
 * drivers and vehicles — because the row expanded in place and needed all of
 * it eventually. Now that opening a reservation loads its own page, the list
 * carries a fraction of the payload, which is the difference that shows on a
 * phone.
 *
 * The text columns that look surplus are the ones the search box reads:
 * flight codes, hotel name, the customer's email and phone, and the assigned
 * driver's name. Dropping those would quietly narrow what search can find.
 */
const LIST_COLUMNS = `
  id, reservation_code, status, trip_type, direction, created_at,
  pickup_datetime, total_price, payment_method,
  adults, children, flight_code, return_flight_code, hotel_name,
  customers(first_name, last_name, email, phone),
  regions(name_en, name_tr, slug),
  driver_assignments(id, leg, status, drivers(full_name))
`;

export default async function AdminReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createAdminClient();

  const { data: reservations } = await supabase
    .from("reservations")
    .select(LIST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(200);

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
        reservations={(reservations ?? []) as unknown as Reservation[]}
        adminBase={`/${locale}/admin`}
      />
    </div>
  );
}
