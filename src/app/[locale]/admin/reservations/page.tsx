import { createAdminClient } from "@/lib/supabase/admin";
import { loadReservationList } from "@/lib/adminReservationsData";
import { parseReservationQuery } from "@/lib/reservationQuery";
import ReservationsScreen from "@/components/admin/reservations/ReservationsScreen";

// Every mutation reloads the list through the API; the first page must still
// be read fresh on each visit, never from a prerender.
export const dynamic = "force-dynamic";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function AdminReservationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const query = parseReservationQuery(sp);
  const db = createAdminClient();

  const [initial, { data: regions }, { data: drivers }] = await Promise.all([
    loadReservationList(db, query),
    db.from("regions").select("id, name_tr, name_en").order("name_en"),
    db.from("drivers").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  return (
    <ReservationsScreen
      initial={initial}
      initialQuery={query}
      regions={(regions ?? [])
        .map((r: { id: string; name_tr: string | null; name_en: string | null }) => ({
          id: r.id,
          name: r.name_tr || r.name_en || "—",
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "tr"))}
      drivers={(drivers ?? []).map((d: { id: string; full_name: string }) => ({ id: d.id, name: d.full_name }))}
      adminBase={`/${locale}/admin`}
      openCode={first(sp.open) ?? null}
    />
  );
}
