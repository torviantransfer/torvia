import { createAdminClient } from "@/lib/supabase/admin";
import SeoScreen, { type SeoScreenQuery } from "@/components/admin/seo/SeoScreen";

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminSeoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = createAdminClient();
  const sp = await searchParams;

  // All four tables that back an indexable page. Regions, posts and landing
  // pages are read regardless of whether they are live: an unpublished page
  // still has SEO fields worth preparing, and the panel labels it rather than
  // hiding it.
  const [{ data: pages }, { data: regions }, { data: posts }, { data: landings }] =
    await Promise.all([
      supabase.from("seo_pages").select("*").order("sort_order"),
      supabase.from("regions").select("*").order("sort_order"),
      supabase.from("blog_posts").select("*").order("published_at", { ascending: false }),
      supabase.from("landing_pages").select("*").order("sort_order"),
    ]);

  const initialQuery: SeoScreenQuery = {
    locale: one(sp.locale),
    group: one(sp.group),
    issue: one(sp.issue),
    q: one(sp.q),
    open: one(sp.open),
  };

  // Four of the five landing pages that used to be hardcoded routes kept a
  // page_type "landing" row here from before they were migrated into
  // landing_pages, so each showed up twice — once from each table, under the
  // same route. Dropped rather than deleted, so nothing is lost if the
  // migration is ever undone.
  //
  // A literal list of exactly those four, not "any seo_pages row whose route
  // matches a landing_pages slug": land-of-legends-transfer also has a row in
  // both tables, but its hardcoded file was deliberately kept (it collides
  // with an active region — see migration 099's note), so its seo_pages row
  // is still the one `generateMetadata` actually reads and must stay visible.
  const MIGRATED_LANDING_SLUGS = new Set([
    "antalya-airport-transfer",
    "vip-transfer-antalya",
    "hotel-transfer-antalya",
    "lara-beach-transfer",
  ]);
  const dedupedPages = (pages ?? []).filter((p) => {
    const row = p as Record<string, unknown>;
    if (row.page_type !== "landing") return true;
    return !MIGRATED_LANDING_SLUGS.has(String(row.route ?? row.page_key ?? ""));
  });

  return (
    <SeoScreen
      initialPages={dedupedPages as Record<string, unknown>[]}
      initialRegions={(regions ?? []) as Record<string, unknown>[]}
      initialPosts={(posts ?? []) as Record<string, unknown>[]}
      initialLandings={(landings ?? []) as Record<string, unknown>[]}
      initialQuery={initialQuery}
    />
  );
}
