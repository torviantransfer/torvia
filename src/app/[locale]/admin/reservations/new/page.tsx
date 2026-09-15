import { createAdminClient } from "@/lib/supabase/admin";
import CreateReservationScreen from "@/components/admin/reservations/CreateReservationScreen";

export const dynamic = "force-dynamic";

export default async function AdminCreateReservationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const db = createAdminClient();

  const { data: regions } = await db.from("regions").select("id, name_tr, name_en").eq("is_active", true).order("name_en");

  return (
    <CreateReservationScreen
      regions={(regions ?? [])
        .map((r: { id: string; name_tr: string | null; name_en: string | null }) => ({ id: r.id, name: r.name_tr || r.name_en || "—" }))
        .sort((a, b) => a.name.localeCompare(b.name, "tr"))}
      adminBase={`/${locale}/admin`}
    />
  );
}
