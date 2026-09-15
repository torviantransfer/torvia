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

  return (
    <SeoScreen
      initialPages={(pages ?? []) as Record<string, unknown>[]}
      initialRegions={(regions ?? []) as Record<string, unknown>[]}
      initialPosts={(posts ?? []) as Record<string, unknown>[]}
      initialLandings={(landings ?? []) as Record<string, unknown>[]}
      initialQuery={initialQuery}
    />
  );
}
