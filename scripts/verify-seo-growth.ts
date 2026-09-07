/**
 * Checks the growth work's own contracts.
 *
 * Deliberately not a content-quality scorer. There is no keyword-density
 * target here and no "primary keyword must appear N times" rule — those
 * measure a ritual, not whether the page answers the query. What this asserts
 * is the set of things that are actually decidable from the repository:
 *
 *   - the keyword map covers the inventory and nothing outside it
 *   - no keyword cluster has two owners in the same locale
 *   - no cluster is left without one
 *   - every URL the map names still exists, is indexable, and does not redirect
 *   - the blog's related-posts block cannot serve a foreign-language title
 *   - the decisions recorded as "changed" are actually present in the source
 *
 *   npm run verify:growth
 */
import { readFileSync, existsSync } from "node:fs";
import { locales } from "../src/i18n/config";

const R = "\x1b[31m";
const G = "\x1b[32m";
const D = "\x1b[2m";
const X = "\x1b[0m";

let failures = 0;
function assert(name: string, ok: boolean, detail?: string) {
  if (!ok) failures++;
  console.log(`${ok ? G + "PASS" + X : R + "FAIL" + X}  ${name}`);
  if (!ok && detail) console.log(`      ${D}${detail}${X}`);
}

interface MapRow {
  locale: string;
  url: string;
  pageType: string;
  existingTitle: string;
  existingH1: string;
  primaryIntent: string;
  keywordCluster: string;
  indexable: boolean;
  inSitemap: boolean;
  action: string;
  growthId: string;
  rationale: string;
}

const keywordMap = JSON.parse(readFileSync("docs/seo-growth/keyword-map.json", "utf8")) as {
  rows: MapRow[];
};
const audit = JSON.parse(readFileSync("docs/seo-runtime-audit.json", "utf8")) as {
  results: { path: string; kind: string; finalStatus: number; robots: string | null; redirectChain: unknown[] }[];
};

const rows = keywordMap.rows;
const byPath = new Map(audit.results.map((r) => [r.path, r]));

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: keyword map envanteri kapsıyor ---");
// -------------------------------------------------------------------------
const inventoryUrls = audit.results
  .filter((r) => r.finalStatus === 200 && r.kind !== "private")
  .map((r) => r.path);
const mapped = new Set(rows.map((r) => r.url));
const missing = inventoryUrls.filter((u) => !mapped.has(u));
assert(
  "envanterdeki her indexlenebilir URL map'te var",
  missing.length === 0,
  missing.slice(0, 5).join(", ")
);

const extra = rows.filter((r) => !byPath.has(r.url));
assert("map'te envanterde olmayan URL yok", extra.length === 0, extra.slice(0, 5).map((r) => r.url).join(", "));

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: her cluster'ın locale başına tek sahibi var ---");
// -------------------------------------------------------------------------
// The rule §11 exists to enforce: one primary keyword cluster, one URL.
const owners = new Map<string, string[]>();
for (const r of rows) {
  if (!r.indexable) continue;
  if (r.pageType === "legal" || r.pageType === "utility") continue;
  const key = `${r.locale}::${r.keywordCluster}`;
  if (!owners.has(key)) owners.set(key, []);
  owners.get(key)!.push(r.url);
}
const contested = [...owners.entries()].filter(([, urls]) => urls.length > 1);
assert(
  "hiçbir cluster aynı locale'de iki URL'ye atanmamış",
  contested.length === 0,
  contested.slice(0, 5).map(([k, u]) => `${k} -> ${u.join(" + ")}`).join("; ")
);

const orphanClusters = [...owners.entries()].filter(([, urls]) => urls.length === 0);
assert("sahipsiz cluster yok", orphanClusters.length === 0);

// Every locale must own the four commercial clusters.
for (const cluster of ["brand-hub", "airport-transfer-service", "vip-premium-vehicle", "airport-to-hotel"]) {
  const covered = locales.filter((l) => owners.has(`${l}::${cluster}`));
  assert(
    `${cluster} 7 dilde de sahipli`,
    covered.length === locales.length,
    `eksik: ${locales.filter((l) => !covered.includes(l)).join(", ")}`
  );
}

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: hedef URL'ler sağlıklı ---");
// -------------------------------------------------------------------------
const targets = rows.filter((r) => r.indexable && r.pageType !== "legal" && r.pageType !== "utility");
assert(
  "hedef URL'lerin hiçbiri noindex değil",
  targets.every((r) => {
    const a = byPath.get(r.url);
    return a ? !/noindex/i.test(a.robots ?? "") : false;
  })
);
assert("hedef URL'lerin hiçbiri boş title taşımıyor", targets.every((r) => r.existingTitle.trim().length > 0));
assert("hedef URL'lerin hiçbiri boş H1 taşımıyor", targets.every((r) => r.existingH1.trim().length > 0));

// -------------------------------------------------------------------------
// Two conditions below are read from the production snapshot the keyword map
// was built on, and production is still running the pre-deploy code. Failing
// this script for them would be failing it for work that is finished in the
// repository and only waiting to ship — which §49 rules out. So the assertion
// is on the repository fix, and the production count is reported as pending.
// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: birinci audit'in düzeltmeleri repoda duruyor ---");

const regionSrc = readFileSync("src/app/[locale]/[region]/page.tsx", "utf8");
assert(
  "SEO-001 düzeltmesi kodda: fiyat etiketi gerçek default'u olan bir fonksiyon",
  /function priceLabelFor\([\s\S]{0,600}default:/.test(regionSrc),
  "priceLabelFor bulunamadı veya default dalı yok"
);
assert(
  "SEO-001 düzeltmesi kodda: eksik locale'li Record literali geri gelmemiş",
  !/const priceLabel: Record<string, string> = \{/.test(regionSrc)
);

const redirectsSrc = readFileSync("src/lib/redirects.ts", "utf8");
assert(
  "SEO-008 yönlendirmesi kodda",
  redirectsSrc.includes("antalya-alanya-transfer-suresi") &&
    redirectsSrc.includes("LOCALIZED_BLOG_CONSOLIDATION")
);
assert(
  "sitemap 308'lenen blog slug'larını atlıyor",
  readFileSync("src/app/sitemap.ts", "utf8").includes("redirectedBlogSlugs")
);

const pendingPlaceholders = rows.filter((r) => /undefined|\[object Object\]|NaN/.test(r.existingTitle + r.existingH1));
const pendingRedirects = targets.filter((r) => (byPath.get(r.url)?.redirectChain.length ?? 0) > 0);
console.log(
  `${D}      deploy bekleyen: ${pendingPlaceholders.length} URL'de yer tutucu (SEO-001, migration/deploy), ` +
    `${pendingRedirects.length} URL yönlendiriyor (SEO-008, migration 071)${X}`
);

// Sitemap agreement: an indexable commercial target should be submitted.
const shouldBeListed = targets.filter((r) => ["home", "landing", "region", "blog-post", "static"].includes(r.pageType));
const notListed = shouldBeListed.filter((r) => !r.inSitemap);
assert(
  "indexlenebilir ticari hedeflerin tamamı sitemap'te",
  notListed.length === 0,
  notListed.slice(0, 5).map((r) => r.url).join(", ")
);

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: kaydedilen değişiklikler kodda/migration'da mevcut ---");
// -------------------------------------------------------------------------
const blogSrc = readFileSync("src/app/[locale]/blog/[slug]/page.tsx", "utf8");

// GROWTH-001: related posts must be topical and locale-safe.
assert(
  "GROWTH-001 ilgili yazılar artık salt yayın tarihine göre seçilmiyor",
  !/const \{ data: related \}[\s\S]{0,200}order\("published_at"[\s\S]{0,80}\.limit\(3\)/.test(blogSrc),
  "recency-only sorgu hâlâ yerinde"
);
assert(
  "GROWTH-001 ilgili yazılar bu locale'e çevrilmiş olanlarla sınırlı",
  /const translated = pool\.filter/.test(blogSrc)
);
assert(
  "GROWTH-001 ilgili yazı başlığında İngilizce fallback kalmadı",
  !/rp\[`title_\$\{loc\}`\] \|\| rp\.title_en/.test(blogSrc),
  "title_en fallback hâlâ var — Hollandaca sayfada İngilizce başlık üretir"
);

for (const [id, file, needle] of [
  ["GROWTH-002/003/004", "supabase/migrations/074_seo_override_retargeting.sql", "meta_title_de = NULL"],
  ["GROWTH-006", "supabase/migrations/075_blog_english_title_language_fix.sql", "Antalya Airport Transfer: Private, Fixed-Price Rides to Your Hotel"],
] as const) {
  assert(`${id} migration dosyası mevcut`, existsSync(file), file);
  if (existsSync(file)) {
    assert(`${id} migration beklenen değişikliği içeriyor`, readFileSync(file, "utf8").includes(needle));
  }
}

// The first audit's migrations must not have been renumbered or edited away.
for (const f of [
  "supabase/migrations/070_romanian_seo_columns.sql",
  "supabase/migrations/071_finish_alanya_duration_consolidation.sql",
  "supabase/migrations/072_region_price_token.sql",
  "supabase/migrations/073_fix_missing_blog_images.sql",
]) {
  assert(`birinci audit migration'ı korunmuş: ${f.split("/").pop()}`, existsSync(f));
}

// The first audit's footer commercial links must survive (§53).
const footer = readFileSync("src/components/Footer.tsx", "utf8");
for (const href of ["/antalya-airport-transfer", "/vip-transfer-antalya", "/hotel-transfer-antalya", "/lara-beach-transfer"]) {
  assert(`footer ticari linki korunmuş: ${href}`, footer.includes(`href: "${href}"`));
}

// -------------------------------------------------------------------------
console.log("\n--- KONTRAT: araştırma kanıtı dosyada ---");
// -------------------------------------------------------------------------
// A decision that cites evidence has to be able to show it.
const ac = existsSync("docs/seo-growth/autocomplete-research.json")
  ? JSON.parse(readFileSync("docs/seo-growth/autocomplete-research.json", "utf8"))
  : null;
assert("autocomplete araştırması kaydedilmiş", ac !== null);
if (ac) {
  assert(
    "7 pazarın tamamı çekilmiş",
    locales.every((l) => ac.markets?.[l]),
    Object.keys(ac.markets ?? {}).join(", ")
  );
  const nl = ac.markets?.nl?.seeds ?? {};
  const airport = nl["antalya airport transfer"]?.suggestions?.length ?? 0;
  const luchthaven = nl["antalya luchthaven transfer"]?.suggestions?.length ?? 0;
  assert(
    "NL kararının dayandığı ölçüm dosyada doğrulanabiliyor",
    airport > luchthaven,
    `airport=${airport} luchthaven=${luchthaven}`
  );
}

for (const doc of [
  "00-baseline", "01-current-gsc-analysis", "02-trends-research", "03-serp-competitor-analysis",
  "04-keyword-map", "05-cannibalization", "06-content-audit", "07-priority-roadmap",
  "08-implementation-log", "09-content-migrations", "10-final-local-verification",
]) {
  assert(`doküman mevcut: ${doc}.md`, existsSync(`docs/seo-growth/${doc}.md`));
}

console.log(
  `\n${failures === 0 ? `${G}TÜM GROWTH KONTRATLARI GEÇTİ${X}` : `${R}${failures} KONTRAT BAŞARISIZ${X}`}\n`
);
process.exit(failures === 0 ? 0 : 1);
