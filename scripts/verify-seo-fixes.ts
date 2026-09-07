/**
 * Checks, in rendered HTML, every SEO fix that does not need a database.
 *
 * `audit:seo` is the broad instrument — it crawls the whole site and reports
 * whatever it finds. This is the narrow one: it asserts the specific defects
 * recorded in docs/seo-master-audit.md are gone, by ID, so a regression names
 * itself instead of appearing as a number moving in a summary.
 *
 * It deliberately avoids region and blog pages, which cannot render without
 * Supabase credentials. That makes it runnable against a local production
 * build with no environment at all:
 *
 *   npm run build && npm run start &
 *   BASE_URL=http://localhost:3000 npm run verify:fixes
 *
 * and against the real deployment once shipped:
 *
 *   BASE_URL=https://torviantransfer.com npm run verify:fixes
 *
 * Region and blog metadata are covered instead by scripts/verify-seo-callers.ts,
 * which calls those pages' own builders directly.
 */
import { locales } from "../src/i18n/config";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const SITE = "https://torviantransfer.com";

const R = "\x1b[31m";
const G = "\x1b[32m";
const D = "\x1b[2m";
const X = "\x1b[0m";

const checks: { id: string; name: string; ok: boolean; detail?: string }[] = [];
const add = (id: string, name: string, ok: boolean, detail?: string) =>
  checks.push({ id, name, ok, detail });

async function get(path: string): Promise<{ status: number; html: string }> {
  const res = await fetch(BASE + path, {
    redirect: "manual",
    headers: { "user-agent": "TorvianSeoInspector/1.0" },
  });
  return { status: res.status, html: res.status < 300 ? await res.text() : "" };
}

const metaTag = (html: string, name: string) =>
  html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`, "i"))?.[1] ?? null;
const ogTag = (html: string, prop: string) =>
  html.match(new RegExp(`<meta property="${prop}" content="([^"]*)"`, "i"))?.[1] ?? null;
const titleOf = (html: string) => html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? null;
const canonicalOf = (html: string) =>
  html.match(/<link rel="canonical" href="([^"]*)"/i)?.[1] ?? null;
const hreflangsOf = (html: string) =>
  [...html.matchAll(/<link rel="alternate" hrefLang="([^"]*)" href="([^"]*)"/gi)].map(
    (m) => [m[1], m[2]] as [string, string]
  );

async function main() {
  console.log(`\nHedef: ${BASE}\n${"=".repeat(72)}`);

  // -- SEO-004: the admin is a login wall, not content ----------------------
  for (const l of locales) {
    for (const path of [`/${l}/admin`, `/${l}/admin/login`]) {
      const { html } = await get(path);
      const robots = metaTag(html, "robots") ?? "";
      add("SEO-004", `${path} noindex`, /noindex/.test(robots), robots || "(robots yok)");
    }
  }

  // -- SEO-007: /track is a lookup form, not a landing page -----------------
  for (const l of locales) {
    const { html } = await get(`/${l}/track`);
    const robots = metaTag(html, "robots") ?? "";
    add("SEO-007", `/${l}/track noindex`, /noindex/.test(robots), robots || "(robots yok)");
    add("SEO-007", `/${l}/track canonical yok`, canonicalOf(html) === null, canonicalOf(html) ?? "");
    add("SEO-007", `/${l}/track hreflang yok`, hreflangsOf(html).length === 0);
  }

  // -- SEO-005 / SEO-022 / SEO-027 / SEO-001: the homepage ------------------
  for (const l of locales) {
    const { html } = await get(`/${l}`);
    const tags = hreflangsOf(html);
    const codes = tags.map((t) => t[0]);
    add(
      "SEO-005",
      `/${l} hreflang 7 dil + x-default`,
      locales.every((x) => codes.includes(x)) && codes.includes("x-default"),
      codes.join(", ")
    );
    const self = tags.find((t) => t[0] === l);
    add("SEO-005", `/${l} self hreflang doğru`, self?.[1] === `${SITE}/${l}`, self?.[1]);
    add("SEO-005", `/${l} canonical self`, canonicalOf(html) === `${SITE}/${l}`, canonicalOf(html) ?? "");

    const bare = (titleOf(html) ?? "").replace(/ \| TORVIAN Transfer$/, "");
    add("SEO-022", `/${l} title == og:title`, bare === ogTag(html, "og:title"), `${bare} ≠ ${ogTag(html, "og:title")}`);
    add(
      "SEO-022",
      `/${l} description == og:description`,
      metaTag(html, "description") === ogTag(html, "og:description")
    );
    add("SEO-001", `/${l} title yer tutucu içermiyor`, !/undefined|\[object Object\]/.test(titleOf(html) ?? ""), titleOf(html) ?? "");
  }

  const ro = await get("/ro");
  add(
    "SEO-027",
    "/ro kendi Romence başlığını kullanıyor",
    (titleOf(ro.html) ?? "").startsWith("Transfer Aeroport Antalya | Transfer Privat"),
    titleOf(ro.html) ?? ""
  );

  // -- SEO-012: the brand is appended once, by the template -----------------
  for (const l of locales) {
    for (const page of ["privacy", "terms", "cookies", "kvkk", "cancellation"]) {
      const { html } = await get(`/${l}/${page}`);
      const t = titleOf(html) ?? "";
      add("SEO-012", `/${l}/${page} marka bir kez`, !/TORVIAN Transfer\s*\|\s*TORVIAN Transfer/.test(t), t);
      add("SEO-012", `/${l}/${page} marka mevcut`, / \| TORVIAN Transfer$/.test(t), t);
    }
  }

  // -- SEO-029: the commercial landing pages are linked site-wide -----------
  for (const l of locales) {
    const { html } = await get(`/${l}/privacy`);
    for (const page of [
      "antalya-airport-transfer",
      "vip-transfer-antalya",
      "hotel-transfer-antalya",
      "lara-beach-transfer",
    ]) {
      add("SEO-029", `/${l} footer → /${page}`, html.includes(`href="/${l}/${page}"`));
    }
  }

  // -- SEO-013: the schema knows the site speaks Romanian -------------------
  for (const path of ["/en/about", "/en/antalya-airport-transfer"]) {
    const { html } = await get(path);
    add("SEO-013", `${path} availableLanguage Romanian`, html.includes('"Romanian"'));
  }

  // -- SEO-004: robots.txt matches the URLs that actually exist -------------
  const robotsTxt = await fetch(`${BASE}/robots.txt`).then((r) => r.text());
  for (const l of locales) {
    for (const route of ["admin", "account", "track"]) {
      add("SEO-004", `robots.txt Disallow /${l}/${route}`, robotsTxt.includes(`Disallow: /${l}/${route}`));
    }
  }

  // ------------------------------------------------------------------------
  const failed = checks.filter((c) => !c.ok);
  for (const c of failed) {
    console.log(`${R}FAIL${X} ${c.id}  ${c.name}`);
    if (c.detail) console.log(`     ${D}${c.detail}${X}`);
  }

  const byId = new Map<string, { pass: number; total: number }>();
  for (const c of checks) {
    const e = byId.get(c.id) ?? { pass: 0, total: 0 };
    e.total += 1;
    if (c.ok) e.pass += 1;
    byId.set(c.id, e);
  }
  console.log("");
  for (const [id, e] of [...byId.entries()].sort()) {
    const ok = e.pass === e.total;
    console.log(`  ${ok ? G : R}${id}${X}  ${e.pass}/${e.total}`);
  }
  console.log(
    `\n${failed.length === 0 ? `${G}${checks.length}/${checks.length} PASS${X}` : `${R}${failed.length} BAŞARISIZ${X} (${checks.length} kontrol)`}\n`
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(`${R}Çalıştırılamadı:${X}`, err);
  process.exit(2);
});
