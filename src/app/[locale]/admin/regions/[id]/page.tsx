import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { locales } from "@/i18n/config";
import { readHotels, readPageContent } from "@/lib/regionContent";
import RegionContentEditor from "@/components/admin/regions/RegionContentEditor";

// Saving calls router.refresh(), so this must never be served from a prerender.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await createAdminClient().from("regions").select("name_tr").eq("id", id).maybeSingle();
  return { title: `${data?.name_tr ?? "Bölge"} — sayfa içeriği — TORVIAN Admin` };
}

/** Bölge sayfası içeriği: docs/bolge-sayfasi.md, bölüm 5. */
export default async function AdminRegionContentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const { data: region } = await createAdminClient().from("regions").select("*").eq("id", id).maybeSingle();
  if (!region) notFound();

  const row = region as Record<string, unknown>;

  return (
    <RegionContentEditor
      adminBase={`/${locale}/admin`}
      region={{
        id: String(row.id),
        slug: String(row.slug),
        name: String(row.name_tr ?? row.name_en ?? row.slug),
        isActive: row.is_active === true,
        routeName: typeof row.route_name === "string" ? row.route_name : "",
        // Undefined when migration 097 has not been applied yet — the editor
        // then says so rather than offering fields that cannot be saved.
        columnsReady: "page_content" in row,
        hotels: readHotels(row.hotels) ?? [],
        names: Object.fromEntries(locales.map((l) => [l, String(row[`name_${l}`] ?? "")])),
        content: readPageContent(row.page_content, locales),
      }}
    />
  );
}
