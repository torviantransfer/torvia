import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { locales } from "@/i18n/config";
import { readHotels, readPageContent } from "@/lib/regionContent";
import { aboutDefault, generalFaq, heroIntroDefault } from "@/lib/regionDefaults";
import { regionImagePath } from "@/lib/regionImages";
import RegionEditor, { type RegionEditorDefaults } from "@/components/admin/regions/RegionEditor";

// Saving calls router.refresh(), so this must never be served from a prerender.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await createAdminClient().from("regions").select("name_tr").eq("id", id).maybeSingle();
  return { title: `${data?.name_tr ?? "Bölge"} — düzenle — TORVIAN Admin` };
}

/** Bölge düzenleme: docs/bolge-sayfasi.md, bölüm 5. */
export default async function AdminRegionEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = createAdminClient();
  const { data: region } = await supabase.from("regions").select("*").eq("id", id).maybeSingle();
  if (!region) notFound();

  const row = region as Record<string, unknown>;

  // The same cheapest bookable fare the public page quotes in its FAQ.
  const { data: pricing } = await supabase
    .from("pricing")
    .select("one_way_price, vehicle_categories!inner(is_active)")
    .eq("region_id", id)
    .eq("is_active", true)
    .eq("vehicle_categories.is_active", true)
    .order("one_way_price", { ascending: true })
    .limit(1)
    .maybeSingle();

  const hotels = readHotels(row.hotels) ?? [];
  const duration = typeof row.duration_minutes === "number" ? row.duration_minutes : null;

  // What each language's page shows where nothing has been written — the
  // editor puts it in the fields so nobody edits against an empty box.
  const defaults: Record<string, RegionEditorDefaults> = {};
  for (const l of locales) {
    const t = await getTranslations({ locale: l, namespace: "regionDetail" });
    const name = String(row[`name_${l}`] || row.name_en || row.slug);
    defaults[l] = {
      subtitle: heroIntroDefault(name, l),
      about: aboutDefault(t, name, duration),
      faq: generalFaq(t, {
        name,
        locale: l,
        durationMinutes: duration,
        distanceKm: (row.distance_km as number | null) ?? null,
        price: pricing?.one_way_price ?? 0,
        hotels,
      }),
    };
  }

  const text = (key: string) => (typeof row[key] === "string" ? (row[key] as string) : "");

  return (
    <RegionEditor
      adminBase={`/${locale}/admin`}
      columnsReady={"page_content" in row}
      defaults={defaults}
      fallbackImage={regionImagePath(String(row.slug), null)}
      region={{
        id: String(row.id),
        slug: String(row.slug),
        isActive: row.is_active === true,
        isPopular: row.is_popular === true,
        sortOrder: Number(row.sort_order ?? 0),
        distanceKm: row.distance_km != null ? String(row.distance_km) : "",
        durationMinutes: row.duration_minutes != null ? String(row.duration_minutes) : "",
        imageUrl: text("image_url"),
        routeName: text("route_name"),
        hotels,
        names: Object.fromEntries(locales.map((l) => [l, text(`name_${l}`)])),
        descriptions: Object.fromEntries(locales.map((l) => [l, text(`description_${l}`)])),
        content: readPageContent(row.page_content, locales),
      }}
    />
  );
}
