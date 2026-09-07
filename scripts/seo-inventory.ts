/**
 * Builds the full list of URLs the site is supposed to expose, independently
 * of the sitemap.
 *
 * The sitemap is one opinion about what exists; the filesystem routes and the
 * regions/posts tables are another. Auditing only the sitemap can never find
 * a page that is missing from it, and auditing only the routes can never find
 * a sitemap entry that 404s. So this returns both, labelled, and the audit
 * compares them.
 *
 * No Supabase credentials are required: active regions come from the public
 * /api/regions endpoint and published posts from the sitemap, which is how a
 * crawler would see them too.
 */
import { locales } from "../src/i18n/config";

export type UrlKind =
  | "home"
  | "landing"
  | "static"
  | "legal"
  | "region"
  | "blog-index"
  | "blog-post"
  | "utility"
  | "private";

export interface InventoryUrl {
  path: string;
  locale: string;
  /** Path after the locale segment; "" for the homepage. */
  route: string;
  kind: UrlKind;
  /** What the audit asserts about this URL's robots directive. */
  expect: "index" | "noindex";
  /** Whether it is supposed to appear in sitemap.xml. */
  inSitemapExpected: boolean;
  /** Which table an admin would edit it in, when there is one. */
  table: "seo_pages" | "regions" | "blog_posts" | null;
  key: string;
  /** Where this URL was discovered. */
  sources: string[];
}

/**
 * The routes that exist as files under src/app/[locale]. Every one is listed,
 * including the ones that must NOT be indexed — a route left out of this
 * table is a route nothing ever checks.
 */
export const FILESYSTEM_ROUTES: {
  route: string;
  kind: UrlKind;
  expect: "index" | "noindex";
  inSitemapExpected: boolean;
  table: "seo_pages" | null;
  key: string;
}[] = [
  { route: "", kind: "home", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "home" },

  // Commercial landing pages.
  { route: "antalya-airport-transfer", kind: "landing", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "antalya-airport-transfer" },
  { route: "vip-transfer-antalya", kind: "landing", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "vip-transfer-antalya" },
  { route: "hotel-transfer-antalya", kind: "landing", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "hotel-transfer-antalya" },
  { route: "lara-beach-transfer", kind: "landing", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "lara-beach-transfer" },
  { route: "land-of-legends-transfer", kind: "landing", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "land-of-legends-transfer" },
  { route: "booking", kind: "landing", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "booking" },

  // Informational / hub.
  { route: "regions", kind: "static", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "regions" },
  { route: "blog", kind: "blog-index", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "blog" },
  { route: "about", kind: "static", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "about" },
  { route: "contact", kind: "static", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "contact" },
  { route: "faq", kind: "static", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "faq" },

  // Legal.
  { route: "cancellation", kind: "legal", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "cancellation" },
  { route: "privacy", kind: "legal", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "privacy" },
  { route: "terms", kind: "legal", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "terms" },
  { route: "cookies", kind: "legal", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "cookies" },
  { route: "kvkk", kind: "legal", expect: "index", inSitemapExpected: true, table: "seo_pages", key: "kvkk" },

  // Utility: public, reachable, deliberately not competing for anything.
  { route: "track", kind: "utility", expect: "noindex", inSitemapExpected: false, table: null, key: "track" },
  { route: "booking/success", kind: "utility", expect: "noindex", inSitemapExpected: false, table: null, key: "booking-success" },
  { route: "booking/cancel", kind: "utility", expect: "noindex", inSitemapExpected: false, table: null, key: "booking-cancel" },

  // Private: an authentication wall, not content.
  { route: "admin", kind: "private", expect: "noindex", inSitemapExpected: false, table: null, key: "admin" },
  { route: "admin/login", kind: "private", expect: "noindex", inSitemapExpected: false, table: null, key: "admin-login" },
  { route: "account", kind: "private", expect: "noindex", inSitemapExpected: false, table: null, key: "account" },
  { route: "account/login", kind: "private", expect: "noindex", inSitemapExpected: false, table: null, key: "account-login" },
  { route: "account/reset-password", kind: "private", expect: "noindex", inSitemapExpected: false, table: null, key: "account-reset" },
];

/**
 * The five pages whose copy lives inline in the component rather than in a
 * messages namespace. They are indexable only for the locales that copy has
 * been written for — mirrored from src/i18n/config.ts by the caller.
 */
export const INLINE_COPY_ROUTES = new Set([
  "antalya-airport-transfer",
  "hotel-transfer-antalya",
  "vip-transfer-antalya",
  "land-of-legends-transfer",
  "lara-beach-transfer",
]);

export interface RegionRow {
  slug: string;
  name_en: string;
  [key: string]: unknown;
}

export async function fetchSitemapUrls(baseUrl: string): Promise<string[]> {
  const res = await fetch(`${baseUrl}/sitemap.xml`, {
    headers: { "user-agent": "TorvianSeoInspector/1.0" },
  });
  if (!res.ok) throw new Error(`sitemap.xml -> HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

export async function fetchActiveRegions(baseUrl: string): Promise<RegionRow[]> {
  const res = await fetch(`${baseUrl}/api/regions`, {
    headers: { "user-agent": "TorvianSeoInspector/1.0" },
  });
  if (!res.ok) throw new Error(`/api/regions -> HTTP ${res.status}`);
  const rows = await res.json();
  return Array.isArray(rows) ? (rows as RegionRow[]) : [];
}

function regionPath(slug: string): string {
  return slug.endsWith("-transfer") ? slug : `${slug}-transfer`;
}

/**
 * The whole inventory, merged.
 *
 * `sources` records which of the three views produced each URL, which is what
 * turns "the sitemap has 482 entries" into a statement about whether those
 * are the right 482.
 */
export async function buildInventory(
  baseUrl: string,
  inlineCopyLocales: readonly string[]
): Promise<{
  urls: InventoryUrl[];
  sitemapUrls: string[];
  regions: RegionRow[];
  /** Sitemap entries that no route in the inventory accounts for. */
  orphanSitemapUrls: string[];
  /** URLs the sitemap lists more than once. */
  duplicateSitemapUrls: string[];
}> {
  const [sitemapUrls, regions] = await Promise.all([
    fetchSitemapUrls(baseUrl),
    fetchActiveRegions(baseUrl).catch(() => [] as RegionRow[]),
  ]);

  const origin = baseUrl.replace(/\/+$/, "");
  const sitemapPaths = sitemapUrls.map((u) => u.replace(origin, ""));
  const sitemapSet = new Set(sitemapPaths);

  const seenCount = new Map<string, number>();
  for (const p of sitemapPaths) seenCount.set(p, (seenCount.get(p) ?? 0) + 1);
  const duplicateSitemapUrls = [...seenCount.entries()]
    .filter(([, n]) => n > 1)
    .map(([p]) => p)
    .sort();

  const byPath = new Map<string, InventoryUrl>();
  const addUrl = (u: InventoryUrl) => {
    const existing = byPath.get(u.path);
    if (existing) {
      for (const s of u.sources) if (!existing.sources.includes(s)) existing.sources.push(s);
      return;
    }
    byPath.set(u.path, u);
  };

  // 1. Filesystem routes x locales.
  for (const locale of locales) {
    for (const r of FILESYSTEM_ROUTES) {
      const inlineGated = INLINE_COPY_ROUTES.has(r.route);
      const translated = !inlineGated || inlineCopyLocales.includes(locale);
      addUrl({
        path: `/${locale}${r.route ? `/${r.route}` : ""}`,
        locale,
        route: r.route,
        kind: r.kind,
        expect: translated ? r.expect : "noindex",
        inSitemapExpected: r.inSitemapExpected && translated,
        table: r.table,
        key: r.key,
        sources: ["filesystem"],
      });
    }
  }

  // 2. Active regions x locales. Whether a locale is indexable depends on the
  //    row's per-locale copy, which the sitemap already encodes — so the
  //    sitemap decides `expect` here and a disagreement with the rendered page
  //    is exactly what the audit reports.
  for (const locale of locales) {
    for (const region of regions) {
      const path = `/${locale}/${regionPath(region.slug)}`;
      const listed = sitemapSet.has(path);
      addUrl({
        path,
        locale,
        route: regionPath(region.slug),
        kind: "region",
        expect: listed ? "index" : "noindex",
        inSitemapExpected: listed,
        table: "regions",
        key: region.slug.replace(/-transfer$/, ""),
        sources: ["regions-api"],
      });
    }
  }

  // 3. Blog posts, which only the sitemap knows about without credentials.
  for (const path of sitemapSet) {
    const m = path.match(/^\/([a-z]{2})\/blog\/(.+)$/);
    if (!m) continue;
    addUrl({
      path,
      locale: m[1],
      route: `blog/${m[2]}`,
      kind: "blog-post",
      expect: "index",
      inSitemapExpected: true,
      table: "blog_posts",
      key: m[2],
      sources: ["sitemap"],
    });
  }

  for (const u of byPath.values()) {
    if (sitemapSet.has(u.path) && !u.sources.includes("sitemap")) u.sources.push("sitemap");
  }

  const known = new Set(byPath.keys());
  const orphanSitemapUrls = [...sitemapSet].filter((p) => !known.has(p)).sort();

  const urls = [...byPath.values()].sort((a, b) =>
    a.locale === b.locale ? a.path.localeCompare(b.path) : locales.indexOf(a.locale as never) - locales.indexOf(b.locale as never)
  );

  return { urls, sitemapUrls, regions, orphanSitemapUrls, duplicateSitemapUrls };
}
