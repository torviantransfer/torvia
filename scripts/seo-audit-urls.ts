/**
 * Full-site SEO runtime audit.
 *
 * Reads every URL the site is supposed to expose — not a sample — and reports
 * what a crawler actually receives for each one. The sample-based version of
 * this script passed clean for six months while every Romanian region page
 * shipped the literal string "undefined" in its <title>, because no sampled
 * URL was Romanian. Coverage is the feature.
 *
 * The inventory is built from three independent views (filesystem routes,
 * the regions API, sitemap.xml) so the audit can also report the disagreements
 * between them: a sitemap entry no route accounts for, a route missing from
 * the sitemap, a URL listed twice.
 *
 *   npm run audit:seo                                  # production, full
 *   SEO_AUDIT_SCOPE=sample npm run audit:seo           # one URL per kind
 *   BASE_URL=https://<preview>.vercel.app npm run audit:seo
 *   BASE_URL=https://<preview>.vercel.app \
 *     COMPARE_URL=https://torviantransfer.com npm run audit:seo
 *
 * Writes docs/seo-runtime-audit.json (machine-readable) and
 * docs/seo-runtime-audit.md (human-readable) next to the console output.
 *
 * Supabase credentials, when present, are used to read the override columns so
 * the Override/Fallback/Effective/Source breakdown is measured rather than
 * assumed. Without them the script says so instead of guessing.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { parseInspection, type PageInspection } from "../src/lib/seoInspect";
import { auditPage, type AuditFinding } from "../src/lib/seoAudit";
import { locales, inlineCopyLocales } from "../src/i18n/config";
import { buildInventory, type InventoryUrl } from "./seo-inventory";

const BASE_URL = (process.env.BASE_URL ?? "https://torviantransfer.com").replace(/\/+$/, "");
const COMPARE_URL = process.env.COMPARE_URL?.replace(/\/+$/, "") ?? null;
const SCOPE = process.env.SEO_AUDIT_SCOPE === "sample" ? "sample" : "full";
const CONCURRENCY = Number(process.env.SEO_AUDIT_CONCURRENCY ?? 6);
const SOFT = process.env.SEO_AUDIT_SOFT === "1";
const OUT_DIR = "docs";

const R = "\x1b[31m";
const G = "\x1b[32m";
const Y = "\x1b[33m";
const B = "\x1b[1m";
const D = "\x1b[2m";
const X = "\x1b[0m";

const UA = "TorvianSeoInspector/1.0";

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

interface Fetched {
  /** Status of the first response, before any redirect is followed. */
  initialStatus: number;
  /** Every Location hop, in order. Empty when the first response was final. */
  redirectChain: { from: string; to: string; status: number }[];
  finalUrl: string;
  finalStatus: number;
  html: string;
  error?: string;
}

/**
 * Follows redirects by hand so the chain itself is data.
 *
 * `redirect: "follow"` collapses a 302→301→200 into a single 200, which hides
 * exactly the thing an SEO audit is looking for: a temporary hop that splits
 * ranking signal, or a chain long enough that Googlebot gives up.
 */
async function fetchWithChain(url: string, maxHops = 6): Promise<Fetched> {
  const chain: { from: string; to: string; status: number }[] = [];
  let current = url;
  let initialStatus = 0;

  for (let hop = 0; hop <= maxHops; hop++) {
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        headers: { "user-agent": UA, accept: "text/html" },
      });
    } catch (err) {
      return {
        initialStatus,
        redirectChain: chain,
        finalUrl: current,
        finalStatus: 0,
        html: "",
        error: err instanceof Error ? err.message : String(err),
      };
    }
    if (hop === 0) initialStatus = res.status;

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      const next = new URL(location, current).toString();
      chain.push({ from: current, to: next, status: res.status });
      current = next;
      continue;
    }

    return {
      initialStatus,
      redirectChain: chain,
      finalUrl: current,
      finalStatus: res.status,
      html: await res.text(),
    };
  }

  return {
    initialStatus,
    redirectChain: chain,
    finalUrl: current,
    finalStatus: 0,
    html: "",
    error: `${maxHops} adımdan fazla yönlendirme`,
  };
}

/** HEAD (falling back to a ranged GET) for the og:image reachability check. */
const assetStatusCache = new Map<string, number>();
async function assetStatus(url: string): Promise<number> {
  const cached = assetStatusCache.get(url);
  if (cached !== undefined) return cached;
  let status = 0;
  try {
    const head = await fetch(url, { method: "HEAD", headers: { "user-agent": UA } });
    status = head.status;
    if (status === 405 || status === 501) {
      const get = await fetch(url, { headers: { "user-agent": UA, range: "bytes=0-0" } });
      status = get.status;
    }
  } catch {
    status = 0;
  }
  assetStatusCache.set(url, status);
  return status;
}

async function pool<T, U>(items: T[], n: number, fn: (item: T, i: number) => Promise<U>): Promise<U[]> {
  const out: U[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(n, items.length)) }, async () => {
    for (;;) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

// ---------------------------------------------------------------------------
// Per-URL checks that go beyond seoAudit's single-page rules
// ---------------------------------------------------------------------------

export interface UrlResult {
  path: string;
  locale: string;
  route: string;
  kind: InventoryUrl["kind"];
  expect: "index" | "noindex";
  inSitemapExpected: boolean;
  inSitemap: boolean;
  sources: string[];
  table: InventoryUrl["table"];
  key: string;

  initialStatus: number;
  finalStatus: number;
  finalUrl: string;
  redirectChain: { from: string; to: string; status: number }[];

  title: string | null;
  description: string | null;
  h1s: string[];
  canonical: string | null;
  robots: string | null;
  htmlLang: string | null;
  alternates: { hreflang: string; href: string }[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogUrl: string | null;
  ogImage: string | null;
  ogImageStatus: number | null;
  twitterCard: string | null;
  schemaTypes: string[];
  schemaInvalid: number;
  imagesWithoutAlt: number;
  wordCount: number;
  /** Same-origin paths this page links to. */
  outboundLinks: string[];
  /** How many other crawled pages link here. Filled in by crossChecks. */
  inboundLinks: number;

  findings: Finding[];
  pass: boolean;
}

export interface Finding {
  id: string;
  level: "error" | "warning" | "info";
  label: string;
  detail: string;
}

// "undefined" is checked WITHOUT a leading word boundary on purpose: the bug
// this exists to catch concatenates it straight onto real text
// ("... · 2 oreundefined"), and \b would have missed every one of them.
const PLACEHOLDER = /(undefined|\[object Object\]|\bNaN\b|\bnull\b)/;

function isIndexable(robots: string | null): boolean {
  if (!robots) return true; // The root layout declares index,follow.
  return !/\bnoindex\b/i.test(robots);
}

/**
 * Same-origin links found in the page body, as paths.
 *
 * Collected so the audit can answer a question no single page can: which
 * commercial pages nothing links to. Search Console shows the smaller region
 * pages sitting on a handful of impressions each, and internal links are how
 * Google decides a page matters — but "this page is orphaned" is a statement
 * about every other page, so it can only be made after the whole crawl.
 *
 * Header and footer links are included: they are real links. What matters is
 * the shape of the distribution, and a page reachable only from the footer
 * still shows up here as weakly linked rather than as unreachable.
 */
function collectInternalLinks(html: string, origin: string): string[] {
  const out = new Set<string>();
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1];
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) continue;
    let url: URL;
    try {
      url = new URL(raw, origin);
    } catch {
      continue;
    }
    if (url.origin !== origin) continue;
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path.startsWith("/_next") || path.startsWith("/api")) continue;
    out.add(path);
  }
  return [...out];
}

function normUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    u.hash = "";
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    return u.toString();
  } catch {
    return raw;
  }
}

function checkUrl(
  inv: InventoryUrl,
  inSitemap: boolean,
  fetched: Fetched,
  insp: PageInspection,
  ogImageStatus: number | null
): Finding[] {
  const f: Finding[] = [];
  const add = (id: string, level: Finding["level"], label: string, detail: string) =>
    f.push({ id, level, label, detail });

  const isPrivateOrUtility = inv.kind === "private" || inv.kind === "utility";

  // ---- Reachability -----------------------------------------------------
  if (fetched.error) {
    add("fetch-failed", "error", "İstek başarısız", fetched.error);
    return f;
  }
  if (fetched.finalStatus === 404) {
    add("404", "error", "404", `${inv.path} bulunamadı (son adres: ${fetched.finalUrl}).`);
    return f;
  }
  if (fetched.finalStatus >= 400) {
    add("http-error", "error", `HTTP ${fetched.finalStatus}`, `${inv.path} hata döndürüyor.`);
    return f;
  }

  // ---- Redirects --------------------------------------------------------
  if (fetched.redirectChain.length > 0) {
    const temporary = fetched.redirectChain.filter((h) => h.status === 302 || h.status === 307);
    const level = inv.inSitemapExpected ? "error" : "info";
    add(
      "redirected",
      temporary.length ? "error" : (level as Finding["level"]),
      "Yönlendirme",
      `${fetched.redirectChain.map((h) => `${h.status} → ${h.to.replace(BASE_URL, "")}`).join(" ")}` +
        (temporary.length ? " (kalıcı olmalı: 301/308)" : "")
    );
    if (fetched.redirectChain.length > 1) {
      add(
        "redirect-chain",
        "warning",
        "Yönlendirme zinciri",
        `${fetched.redirectChain.length} adım — tek adıma indirilmeli.`
      );
    }
  }

  // ---- Placeholder leakage ----------------------------------------------
  // The class of bug that put "undefined" into every Romanian region title:
  // a per-locale lookup table missing the locale, interpolated anyway.
  for (const [name, value] of [
    ["title", insp.title],
    ["description", insp.description],
    ["og:title", insp.ogTitle],
    ["og:description", insp.ogDescription],
    ["h1", insp.h1s[0] ?? null],
  ] as const) {
    if (value && PLACEHOLDER.test(value)) {
      add(
        "placeholder-leak",
        "error",
        "Metinde yer tutucu değer",
        `${name} içinde "${value.match(PLACEHOLDER)?.[0]}" geçiyor: ${value}`
      );
    }
  }

  // ---- Indexation -------------------------------------------------------
  const indexable = isIndexable(insp.robots);
  if (inv.expect === "noindex" && indexable) {
    add(
      isPrivateOrUtility ? "should-be-noindex" : "noindex-expected",
      "error",
      "Indexlenmemesi gereken sayfa indexlenebilir",
      `robots: ${insp.robots ?? "(yok — kök layout index,follow veriyor)"}`
    );
  }
  if (inv.expect === "index" && !indexable) {
    add("noindex-unexpected", "error", "Indexlenmesi gereken sayfa noindex", `robots: ${insp.robots}`);
  }

  // ---- Sitemap consistency ---------------------------------------------
  if (inSitemap && !indexable) {
    add(
      "sitemap-noindex",
      "error",
      "Sitemap'te ama noindex",
      "Search Console bunu \"Gönderilen URL 'noindex' olarak işaretlenmiş\" hatası olarak raporlar."
    );
  }
  if (inSitemap && fetched.redirectChain.length > 0) {
    add("sitemap-redirect", "error", "Sitemap'te ama yönlendiriyor", `→ ${fetched.finalUrl}`);
  }
  if (!inSitemap && inv.inSitemapExpected && indexable) {
    add("sitemap-missing", "warning", "Sitemap'te yok", "Indexlenebilir sayfa sitemap'te listelenmemiş.");
  }
  if (inSitemap && !inv.inSitemapExpected) {
    add("sitemap-unexpected", "warning", "Sitemap'te olmamalı", `${inv.kind} sayfası sitemap'te listelenmiş.`);
  }

  if (isPrivateOrUtility) {
    // Nothing below is meaningful for a login wall or a lookup form.
    return f;
  }

  // ---- Title / description ----------------------------------------------
  if (!insp.title) add("title-missing", "error", "Title yok", "<title> bulunamadı.");
  if (!insp.description) add("description-missing", "error", "Description yok", "meta description yok.");

  // The root layout's template appends " | TORVIAN Transfer"; a page that also
  // ends with the brand ships it twice and burns SERP pixels on a repeat.
  if (insp.title && /TORVIAN Transfer\s*\|\s*TORVIAN Transfer\s*$/i.test(insp.title)) {
    add("title-double-brand", "warning", "Marka adı iki kez", insp.title);
  }

  // ---- H1 ---------------------------------------------------------------
  if (insp.h1s.length === 0) add("h1-missing", "error", "H1 yok", "Sayfada <h1> yok.");
  if (insp.h1s.length > 1)
    add("h1-multiple", "warning", "Birden fazla H1", `${insp.h1s.length} adet: ${insp.h1s.join(" | ")}`);

  // ---- html lang --------------------------------------------------------
  if (!insp.htmlLang) add("lang-missing", "error", "html lang yok", "<html> etiketinde lang yok.");
  else if (insp.htmlLang.split("-")[0] !== inv.locale)
    add("lang-mismatch", "error", "html lang yanlış", `lang="${insp.htmlLang}", beklenen "${inv.locale}"`);

  // ---- Canonical --------------------------------------------------------
  if (!insp.canonical) {
    add("canonical-missing", "error", "Canonical yok", "rel=canonical bulunamadı.");
  } else {
    let canonical: URL | null = null;
    try {
      canonical = new URL(insp.canonical);
    } catch {
      add("canonical-malformed", "error", "Canonical geçersiz", insp.canonical);
    }
    if (canonical) {
      if (canonical.origin !== BASE_URL) {
        add("canonical-offsite", "error", "Canonical site dışı", insp.canonical);
      } else if (indexable) {
        const self = normUrl(`${BASE_URL}${inv.path}`);
        const declared = normUrl(insp.canonical);
        const final = normUrl(fetched.finalUrl);
        if (declared !== self && declared !== final) {
          add(
            "canonical-mismatch",
            "error",
            "Canonical kendini göstermiyor",
            `canonical=${insp.canonical}, sayfa=${BASE_URL}${inv.path}`
          );
        }
      }
      if (/%[0-9A-Fa-f]{2}/.test(canonical.pathname) || /[^\x00-\x7F]/.test(canonical.pathname)) {
        add("canonical-nonascii", "warning", "Canonical ASCII değil", insp.canonical);
      }
    }
  }

  // ---- hreflang ---------------------------------------------------------
  if (insp.alternates.length > 0) {
    const tags = insp.alternates.map((a) => a.hreflang.toLowerCase());
    const selfTag = insp.alternates.find((a) => a.hreflang.toLowerCase() === inv.locale);
    if (!selfTag) {
      add("hreflang-no-self", "error", "hreflang kendini içermiyor", `${inv.locale} etiketi yok: ${tags.join(", ")}`);
    } else if (normUrl(selfTag.href) !== normUrl(`${BASE_URL}${inv.path}`) && normUrl(selfTag.href) !== normUrl(fetched.finalUrl)) {
      add(
        "hreflang-self-mismatch",
        "error",
        "hreflang self yanlış adres",
        `${inv.locale} → ${selfTag.href}, sayfa ${BASE_URL}${inv.path}`
      );
    }
    if (!tags.includes("x-default")) {
      add("hreflang-no-xdefault", "warning", "x-default yok", tags.join(", "));
    }
    const dupes = tags.filter((t, i) => tags.indexOf(t) !== i);
    if (dupes.length) add("hreflang-duplicate", "error", "hreflang tekrar ediyor", [...new Set(dupes)].join(", "));

    // A canonical that points outside its own hreflang cluster is the
    // contradiction Google resolves by ignoring the cluster.
    if (insp.canonical && indexable) {
      const hrefs = insp.alternates.map((a) => normUrl(a.href));
      if (!hrefs.includes(normUrl(insp.canonical))) {
        add(
          "canonical-hreflang-conflict",
          "error",
          "Canonical hreflang kümesinde yok",
          `canonical=${insp.canonical}`
        );
      }
    }
  } else if (indexable && inv.kind !== "private" && inv.kind !== "utility") {
    add("hreflang-missing", "warning", "hreflang yok", "Çok dilli sayfada alternate etiketi yok.");
  }

  // ---- Open Graph / Twitter --------------------------------------------
  if (!insp.ogTitle) add("og-title-missing", "info", "og:title yok", "Paylaşımlarda <title> kullanılır.");
  if (!insp.ogImage) add("og-image-missing", "warning", "og:image yok", "Paylaşımlar görselsiz görünür.");
  if (insp.ogImage && ogImageStatus !== null && ogImageStatus !== 200) {
    add("og-image-broken", "error", "og:image erişilemiyor", `HTTP ${ogImageStatus} — ${insp.ogImage}`);
  }
  if (insp.ogUrl && indexable && insp.canonical && normUrl(insp.ogUrl) !== normUrl(insp.canonical)) {
    add("og-url-mismatch", "warning", "og:url canonical ile aynı değil", `og:url=${insp.ogUrl}`);
  }
  if (!insp.twitterCard) add("twitter-card-missing", "info", "twitter:card yok", "Kart tipi bildirilmemiş.");

  // ---- Structured data --------------------------------------------------
  for (const s of insp.schemas) {
    if (!s.valid) add("schema-invalid", "error", "Geçersiz JSON-LD", s.error ?? "Ayrıştırılamadı.");
  }

  // ---- Images -----------------------------------------------------------
  const noAlt = insp.images.filter((i) => i.alt === null).length;
  if (noAlt > 0) add("image-alt-missing", "warning", "alt metni eksik görsel", `${noAlt} adet`);

  // ---- Thin content -----------------------------------------------------
  if (indexable && inv.kind !== "legal" && insp.wordCount < 250) {
    add("thin-content", "warning", "İnce içerik", `${insp.wordCount} kelime`);
  }

  return f;
}

// ---------------------------------------------------------------------------
// Cross-URL checks
// ---------------------------------------------------------------------------

/**
 * Reciprocity, duplicate copy and cluster completeness — none of which can be
 * decided from a single page.
 */
function crossChecks(results: UrlResult[], complete: boolean): void {
  const byPath = new Map(results.map((r) => [r.path, r]));
  const seen = (raw: string | null): string | null => {
    const n = normUrl(raw);
    return n ? n.replace(BASE_URL, "") : null;
  };

  // --- hreflang reciprocity ---
  for (const r of results) {
    if (r.finalStatus !== 200 || !isIndexable(r.robots)) continue;
    for (const alt of r.alternates) {
      if (alt.hreflang.toLowerCase() === "x-default") continue;
      const targetPath = seen(alt.href);
      if (!targetPath) continue;
      const target = byPath.get(targetPath);
      if (!target) {
        // In a sampled run most cluster members were never fetched, so an
        // unknown target says nothing about the site.
        if (!complete) continue;
        r.findings.push({
          id: "hreflang-unknown-target",
          level: "warning",
          label: "hreflang bilinmeyen adrese işaret ediyor",
          detail: `${alt.hreflang} → ${alt.href} (envanterde yok)`,
        });
        continue;
      }
      if (target.finalStatus !== 200) {
        r.findings.push({
          id: "hreflang-dead-target",
          level: "error",
          label: "hreflang ölü adrese işaret ediyor",
          detail: `${alt.hreflang} → ${alt.href} (HTTP ${target.finalStatus})`,
        });
        continue;
      }
      if (target.redirectChain.length > 0) {
        r.findings.push({
          id: "hreflang-redirect-target",
          level: "error",
          label: "hreflang yönlendirilen adrese işaret ediyor",
          detail: `${alt.hreflang} → ${alt.href} → ${target.finalUrl}`,
        });
      }
      if (!isIndexable(target.robots)) {
        r.findings.push({
          id: "hreflang-noindex-target",
          level: "error",
          label: "hreflang noindex adrese işaret ediyor",
          detail: `${alt.hreflang} → ${alt.href}`,
        });
      }
      if (!complete) continue;
      const back = target.alternates.some(
        (a) => a.hreflang.toLowerCase() === r.locale && seen(a.href) === r.path
      );
      if (!back) {
        r.findings.push({
          id: "hreflang-not-reciprocal",
          level: "error",
          label: "hreflang karşılıklı değil",
          detail: `${r.path} → ${targetPath}, ama geri dönüş yok (Google kümeyi yok sayar)`,
        });
      }
    }
  }

  // --- indexable locale left out of its own cluster ---
  //
  // Grouped by "the same page in another language". For a region or static
  // route the route string is the key; blog posts localise their slug, so
  // they are grouped by whichever cluster already names them.
  const clusterOf = new Map<string, Set<string>>();
  for (const r of results) {
    if (r.kind === "blog-post") continue;
    if (r.kind === "private" || r.kind === "utility") continue;
    const key = r.route;
    if (!clusterOf.has(key)) clusterOf.set(key, new Set());
    clusterOf.get(key)!.add(r.path);
  }
  for (const [route, paths] of clusterOf) {
    const members = [...paths].map((p) => byPath.get(p)!).filter(Boolean);
    const indexables = members.filter((m) => m.finalStatus === 200 && isIndexable(m.robots));
    if (indexables.length < 2) continue;
    for (const m of indexables) {
      const declared = new Set(m.alternates.map((a) => a.hreflang.toLowerCase()));
      const missing = indexables.map((o) => o.locale).filter((l) => !declared.has(l));
      if (missing.length) {
        m.findings.push({
          id: "hreflang-incomplete",
          level: "error",
          label: "hreflang kümesi eksik",
          detail: `/${route || "(ana sayfa)"} için indexlenebilir ama bildirilmeyen diller: ${missing.join(", ")}`,
        });
      }
    }
  }

  // --- duplicate title / description / canonical, within a locale ---
  for (const locale of locales) {
    const inLocale = results.filter(
      (r) => r.locale === locale && r.finalStatus === 200 && isIndexable(r.robots)
    );
    for (const [field, get] of [
      ["title", (r: UrlResult) => r.title],
      ["description", (r: UrlResult) => r.description],
    ] as const) {
      const groups = new Map<string, UrlResult[]>();
      for (const r of inLocale) {
        const v = (get(r) ?? "").trim();
        if (!v) continue;
        if (!groups.has(v)) groups.set(v, []);
        groups.get(v)!.push(r);
      }
      for (const [value, rows] of groups) {
        if (rows.length < 2) continue;
        for (const r of rows) {
          r.findings.push({
            id: `duplicate-${field}`,
            level: "error",
            label: `Aynı ${field}`,
            detail: `${rows.length} sayfa aynı değeri kullanıyor (${rows
              .map((x) => x.path)
              .join(", ")}): ${value.slice(0, 80)}`,
          });
        }
      }
    }
  }

  // --- duplicate canonical across the whole site ---
  const canonGroups = new Map<string, UrlResult[]>();
  for (const r of results) {
    if (r.finalStatus !== 200 || !isIndexable(r.robots)) continue;
    const c = seen(r.canonical);
    if (!c) continue;
    if (!canonGroups.has(c)) canonGroups.set(c, []);
    canonGroups.get(c)!.push(r);
  }
  for (const [canonical, rows] of canonGroups) {
    if (rows.length < 2) continue;
    for (const r of rows) {
      r.findings.push({
        id: "duplicate-canonical",
        level: "error",
        label: "Aynı canonical",
        detail: `${rows.length} indexlenebilir sayfa ${canonical} adresini gösteriyor (${rows
          .map((x) => x.path)
          .join(", ")})`,
      });
    }
  }

  // --- untranslated fallback: identical metadata under two languages ---
  const metaByRoute = new Map<string, UrlResult[]>();
  for (const r of results) {
    if (r.finalStatus !== 200 || !isIndexable(r.robots)) continue;
    if (r.kind === "private" || r.kind === "utility" || r.kind === "blog-post") continue;
    if (!metaByRoute.has(r.route)) metaByRoute.set(r.route, []);
    metaByRoute.get(r.route)!.push(r);
  }
  for (const [route, rows] of metaByRoute) {
    for (const r of rows) {
      const twin = rows.find(
        (o) => o !== r && o.title && r.title && o.title === r.title && o.locale !== r.locale
      );
      if (twin) {
        r.findings.push({
          id: "untranslated-metadata",
          level: "warning",
          label: "Çevrilmemiş metadata",
          detail: `/${route || "(ana sayfa)"} — ${r.locale} ve ${twin.locale} aynı title'ı kullanıyor`,
        });
      }
    }
  }

  // --- internal link graph ---
  //
  // Only links from indexable pages count. A link from a noindex page passes
  // no signal worth reporting, and counting them would make an orphaned
  // commercial page look linked because the login screen has a footer.
  for (const r of results) {
    if (r.finalStatus !== 200 || !isIndexable(r.robots)) continue;
    for (const link of r.outboundLinks) {
      if (link === r.path) continue;
      const target = byPath.get(link);
      if (target) target.inboundLinks += 1;
    }
  }
  for (const r of results) {
    if (r.finalStatus !== 200 || !isIndexable(r.robots)) continue;
    const commercial =
      r.kind === "region" || r.kind === "landing" || r.kind === "home" || r.kind === "static";
    if (!commercial) continue;
    if (r.inboundLinks === 0) {
      r.findings.push({
        id: "orphan-page",
        level: "error",
        label: "Hiçbir sayfadan link almıyor",
        detail:
          "Indexlenebilir ticari sayfaya site içinden hiç link yok — Google bir sayfanın önemini iç linklerden okur.",
      });
    } else if (r.inboundLinks < 3 && r.kind === "region") {
      r.findings.push({
        id: "weakly-linked",
        level: "warning",
        label: "Zayıf iç link",
        detail: `Yalnızca ${r.inboundLinks} sayfadan link alıyor.`,
      });
    }
  }

  // The single-page rules and the cross-URL rules can reach the same
  // conclusion (hreflang-incomplete is both), and reporting it twice at two
  // different severities makes the summary unreadable. Keep the strictest.
  const rank = { error: 3, warning: 2, info: 1 } as const;
  for (const r of results) {
    const best = new Map<string, Finding>();
    for (const f of r.findings) {
      const prev = best.get(f.id);
      if (!prev || rank[f.level] > rank[prev.level]) best.set(f.id, f);
      else if (rank[f.level] === rank[prev.level] && f.detail.length > prev.detail.length)
        best.set(f.id, f);
    }
    r.findings = [...best.values()].sort((a, b) => rank[b.level] - rank[a.level]);
    r.pass = !r.findings.some((f) => f.level === "error");
  }
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

interface Totals {
  total: number;
  passed: number;
  failed: number;
  redirects: number;
  noindexExpected: number;
  notFound: number;
  canonicalErrors: number;
  hreflangErrors: number;
  metadataErrors: number;
  blocked: number;
}

function totalsOf(results: UrlResult[], blocked: number): Totals {
  const has = (r: UrlResult, prefix: string) =>
    r.findings.some((f) => f.level === "error" && f.id.startsWith(prefix));
  return {
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    redirects: results.filter((r) => r.redirectChain.length > 0).length,
    noindexExpected: results.filter((r) => r.expect === "noindex").length,
    notFound: results.filter((r) => r.finalStatus === 404).length,
    canonicalErrors: results.filter((r) => has(r, "canonical")).length,
    hreflangErrors: results.filter((r) => has(r, "hreflang")).length,
    metadataErrors: results.filter(
      (r) =>
        has(r, "title") ||
        has(r, "description") ||
        has(r, "placeholder") ||
        has(r, "h1") ||
        has(r, "lang") ||
        has(r, "duplicate") ||
        has(r, "untranslated")
    ).length,
    blocked,
  };
}

function writeReports(
  results: UrlResult[],
  totals: Totals,
  meta: {
    baseUrl: string;
    scope: string;
    orphanSitemapUrls: string[];
    duplicateSitemapUrls: string[];
    sitemapCount: number;
    regionCount: number;
    startedAt: string;
  }
) {
  mkdirSync(OUT_DIR, { recursive: true });

  writeFileSync(
    `${OUT_DIR}/seo-runtime-audit.json`,
    JSON.stringify({ meta, totals, results }, null, 2),
    "utf8"
  );

  const byId = new Map<string, UrlResult[]>();
  for (const r of results)
    for (const f of r.findings) {
      if (!byId.has(f.id)) byId.set(f.id, []);
      byId.get(f.id)!.push(r);
    }

  const lines: string[] = [];
  lines.push("# SEO Runtime Audit");
  lines.push("");
  lines.push(`- **Hedef:** ${meta.baseUrl}`);
  lines.push(`- **Kapsam:** ${meta.scope}`);
  lines.push(`- **Çalıştırma:** ${meta.startedAt}`);
  lines.push(`- **Sitemap girdisi:** ${meta.sitemapCount}`);
  lines.push(`- **Aktif bölge:** ${meta.regionCount}`);
  lines.push("");
  lines.push("## Özet");
  lines.push("");
  lines.push("| Ölçüt | Değer |");
  lines.push("| --- | --- |");
  lines.push(`| TOTAL URLS | ${totals.total} |`);
  lines.push(`| PASSED | ${totals.passed} |`);
  lines.push(`| FAILED | ${totals.failed} |`);
  lines.push(`| BLOCKED | ${totals.blocked} |`);
  lines.push(`| REDIRECTS | ${totals.redirects} |`);
  lines.push(`| NOINDEX EXPECTED | ${totals.noindexExpected} |`);
  lines.push(`| 404 ERRORS | ${totals.notFound} |`);
  lines.push(`| CANONICAL ERRORS | ${totals.canonicalErrors} |`);
  lines.push(`| HREFLANG ERRORS | ${totals.hreflangErrors} |`);
  lines.push(`| METADATA ERRORS | ${totals.metadataErrors} |`);
  lines.push("");

  lines.push("## Dil bazında");
  lines.push("");
  lines.push("| Dil | URL | PASS | FAIL |");
  lines.push("| --- | --- | --- | --- |");
  for (const l of locales) {
    const inLocale = results.filter((r) => r.locale === l);
    lines.push(
      `| ${l} | ${inLocale.length} | ${inLocale.filter((r) => r.pass).length} | ${
        inLocale.filter((r) => !r.pass).length
      } |`
    );
  }
  lines.push("");

  lines.push("## Bulgu türleri");
  lines.push("");
  lines.push("| Bulgu | Seviye | Sayfa |");
  lines.push("| --- | --- | --- |");
  for (const [id, rows] of [...byId.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const level = rows[0].findings.find((f) => f.id === id)!.level;
    lines.push(`| \`${id}\` | ${level} | ${rows.length} |`);
  }
  lines.push("");

  if (meta.duplicateSitemapUrls.length) {
    lines.push("## Sitemap'te tekrar eden URL");
    lines.push("");
    for (const p of meta.duplicateSitemapUrls) lines.push(`- \`${p}\``);
    lines.push("");
  }
  if (meta.orphanSitemapUrls.length) {
    lines.push("## Envanterde karşılığı olmayan sitemap URL'leri");
    lines.push("");
    for (const p of meta.orphanSitemapUrls) lines.push(`- \`${p}\``);
    lines.push("");
  }

  const failed = results.filter((r) => !r.pass);
  lines.push(`## Başarısız URL'ler (${failed.length})`);
  lines.push("");
  if (failed.length === 0) lines.push("_Yok._");
  for (const r of failed) {
    lines.push(`### \`${r.path}\``);
    lines.push("");
    lines.push(`- HTTP ${r.finalStatus}${r.redirectChain.length ? ` (${r.redirectChain.length} yönlendirme)` : ""}`);
    lines.push(`- title: ${r.title ?? "—"}`);
    lines.push(`- canonical: ${r.canonical ?? "—"}`);
    lines.push(`- robots: ${r.robots ?? "—"}`);
    for (const f of r.findings.filter((x) => x.level === "error"))
      lines.push(`- **${f.level.toUpperCase()}** \`${f.id}\` — ${f.label}: ${f.detail}`);
    lines.push("");
  }

  // Internal link distribution — the number that decides which region pages
  // Google thinks matter. Reported per locale because the link graph is
  // per-locale: a Romanian region page is not helped by Turkish links.
  lines.push("## İç link dağılımı (indexlenebilir ticari sayfalar)");
  lines.push("");
  lines.push("| Dil | Sayfa | Ortalama gelen link | En az | Orphan (0) | Zayıf (<3) |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const l of locales) {
    const rows = results.filter(
      (r) =>
        r.locale === l &&
        r.finalStatus === 200 &&
        isIndexable(r.robots) &&
        (r.kind === "region" || r.kind === "landing" || r.kind === "static" || r.kind === "home")
    );
    if (rows.length === 0) continue;
    const total = rows.reduce((n, r) => n + r.inboundLinks, 0);
    const min = Math.min(...rows.map((r) => r.inboundLinks));
    lines.push(
      `| ${l} | ${rows.length} | ${(total / rows.length).toFixed(1)} | ${min} | ${
        rows.filter((r) => r.inboundLinks === 0).length
      } | ${rows.filter((r) => r.inboundLinks < 3).length} |`
    );
  }
  lines.push("");

  const weakest = results
    .filter((r) => r.kind === "region" && r.finalStatus === 200 && isIndexable(r.robots))
    .sort((a, b) => a.inboundLinks - b.inboundLinks)
    .slice(0, 20);
  if (weakest.length) {
    lines.push("### En az link alan bölge sayfaları");
    lines.push("");
    lines.push("| URL | Gelen link |");
    lines.push("| --- | --- |");
    for (const r of weakest) lines.push(`| \`${r.path}\` | ${r.inboundLinks} |`);
    lines.push("");
  }

  lines.push("## Tüm URL'ler");
  lines.push("");
  lines.push("| URL | Tip | HTTP | Index | Sitemap | Gelen link | Sonuç |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const r of results) {
    lines.push(
      `| \`${r.path}\` | ${r.kind} | ${r.finalStatus} | ${isIndexable(r.robots) ? "index" : "noindex"} | ${
        r.inSitemap ? "var" : "yok"
      } | ${r.inboundLinks} | ${r.pass ? "PASS" : "FAIL"} |`
    );
  }
  lines.push("");

  writeFileSync(`${OUT_DIR}/seo-runtime-audit.md`, lines.join("\n"), "utf8");
}

// ---------------------------------------------------------------------------
// Deployment comparison (unchanged contract from the sample-based version)
// ---------------------------------------------------------------------------

async function comparePass(results: UrlResult[]): Promise<number> {
  if (!COMPARE_URL) return 0;
  console.log(`\n${"=".repeat(96)}`);
  console.log(`${B}KONTRAT: override girilmemişken public HTML değişmemeli${X}`);
  console.log(`${D}Her alan iki deployment arasında karşılaştırılıyor. Origin farkı normalize ediliyor.${X}\n`);

  const strip = (v: string | null) =>
    v === null ? null : v.replace(BASE_URL, "").replace(COMPARE_URL!, "");

  let diffs = 0;
  const sample = results.filter((r) => r.finalStatus === 200);
  await pool(sample, CONCURRENCY, async (r) => {
    const other = await fetchWithChain(`${COMPARE_URL}${r.path}`);
    if (other.finalStatus !== 200) {
      console.log(`${Y}${r.path} — karşılaştırma alınamadı (HTTP ${other.finalStatus})${X}`);
      return;
    }
    const o = parseInspection(`${COMPARE_URL}${r.path}`, other.finalStatus, other.html);
    const fields: [string, string | null, string | null][] = [
      ["title", r.title, o.title],
      ["description", r.description, o.description],
      ["canonical", strip(r.canonical), strip(o.canonical)],
      ["robots", r.robots, o.robots],
      ["h1", r.h1s.join("|"), o.h1s.join("|")],
      ["og:title", r.ogTitle, o.ogTitle],
      ["og:description", r.ogDescription, o.ogDescription],
      ["og:image", strip(r.ogImage), strip(o.ogImage)],
      ["twitter:card", r.twitterCard, o.twitterCard],
      [
        "hreflang",
        r.alternates.map((a) => `${a.hreflang}=${strip(a.href)}`).sort().join(","),
        o.alternates.map((a) => `${a.hreflang}=${strip(a.href)}`).sort().join(","),
      ],
      [
        "json-ld tipleri",
        [...new Set(r.schemaTypes)].sort().join(","),
        [...new Set(o.schemas.flatMap((s) => s.types))].sort().join(","),
      ],
    ];
    const changed = fields.filter(([, a, b]) => (a ?? "") !== (b ?? ""));
    if (changed.length === 0) return;
    diffs += changed.length;
    console.log(`${Y}FARKLI${X} ${r.path}`);
    for (const [name, a, b] of changed) {
      console.log(`        ${name}`);
      console.log(`          ${COMPARE_URL}: ${(b ?? "—").slice(0, 90)}`);
      console.log(`          ${BASE_URL}: ${(a ?? "—").slice(0, 90)}`);
    }
  });

  console.log(
    `\n${diffs === 0 ? `${G}Hiçbir alan değişmedi.${X}` : `${Y}${diffs} alan farklı — her biri kasıtlı mı kontrol edilmeli.${X}`}`
  );
  return diffs;
}

// ---------------------------------------------------------------------------

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`\n${B}Hedef:${X} ${BASE_URL}`);
  if (COMPARE_URL) console.log(`${B}Karşılaştırma:${X} ${COMPARE_URL}`);
  console.log(`${B}Kapsam:${X} ${SCOPE}`);

  const inventory = await buildInventory(BASE_URL, inlineCopyLocales);
  let urls = inventory.urls;

  if (SCOPE === "sample") {
    // One URL per (locale, kind) — enough to smoke-test, never enough to
    // conclude anything, which is why it is not the default.
    const picked = new Map<string, InventoryUrl>();
    for (const u of urls) {
      const key = `${u.locale}:${u.kind}`;
      if (!picked.has(key)) picked.set(key, u);
    }
    urls = [...picked.values()];
  }

  console.log(
    `${B}Envanter:${X} ${urls.length} URL  ${D}(sitemap ${inventory.sitemapUrls.length}, aktif bölge ${inventory.regions.length})${X}`
  );
  if (inventory.duplicateSitemapUrls.length)
    console.log(`${R}Sitemap'te tekrar eden ${inventory.duplicateSitemapUrls.length} URL${X}`);
  if (inventory.orphanSitemapUrls.length)
    console.log(`${Y}Envanterde karşılığı olmayan ${inventory.orphanSitemapUrls.length} sitemap URL'si${X}`);
  console.log("=".repeat(96));

  const sitemapPaths = new Set(inventory.sitemapUrls.map((u) => u.replace(BASE_URL, "")));

  let done = 0;
  let blocked = 0;
  const results = await pool(urls, CONCURRENCY, async (inv) => {
    const fetched = await fetchWithChain(`${BASE_URL}${inv.path}`);
    const insp = parseInspection(`${BASE_URL}${inv.path}`, fetched.finalStatus, fetched.html);

    let ogImageStatus: number | null = null;
    if (insp.ogImage) {
      try {
        ogImageStatus = await assetStatus(new URL(insp.ogImage, BASE_URL).toString());
      } catch {
        ogImageStatus = 0;
      }
    }

    const findings = checkUrl(inv, sitemapPaths.has(inv.path), fetched, insp, ogImageStatus);
    // seoAudit's own single-page rules run alongside, so the panel and this
    // script cannot disagree about the same page.
    if (fetched.finalStatus === 200 && inv.kind !== "private" && inv.kind !== "utility") {
      const panelFindings: AuditFinding[] = auditPage(insp, {
        route: inv.route,
        locale: inv.locale,
        // The blog *index* is a listing, not an article: auditing it as a post
        // makes it fail schema-article-missing in all seven locales for not
        // carrying a BlogPosting it should not have.
        pageType:
          inv.kind === "blog-post"
            ? "blog"
            : inv.kind === "legal" || inv.kind === "blog-index"
              ? "static"
              : (inv.kind as "home" | "landing" | "static" | "region"),
        shouldIndex: inv.expect === "index",
      });
      for (const pf of panelFindings) {
        if (findings.some((f) => f.id === pf.id)) continue;
        findings.push({ id: pf.id, level: pf.level, label: pf.label, detail: pf.detail });
      }
    }
    if (insp.blocked) blocked += 1;

    done += 1;
    if (done % 25 === 0) console.log(`${D}  ${done}/${urls.length}${X}`);

    const result: UrlResult = {
      path: inv.path,
      locale: inv.locale,
      route: inv.route,
      kind: inv.kind,
      expect: inv.expect,
      inSitemapExpected: inv.inSitemapExpected,
      inSitemap: sitemapPaths.has(inv.path),
      sources: inv.sources,
      table: inv.table,
      key: inv.key,
      initialStatus: fetched.initialStatus,
      finalStatus: fetched.finalStatus,
      finalUrl: fetched.finalUrl,
      redirectChain: fetched.redirectChain,
      title: insp.title,
      description: insp.description,
      h1s: insp.h1s,
      canonical: insp.canonical,
      robots: insp.robots,
      htmlLang: insp.htmlLang,
      alternates: insp.alternates,
      ogTitle: insp.ogTitle,
      ogDescription: insp.ogDescription,
      ogUrl: insp.ogUrl,
      ogImage: insp.ogImage,
      ogImageStatus,
      twitterCard: insp.twitterCard,
      schemaTypes: [...new Set(insp.schemas.flatMap((s) => s.types))],
      schemaInvalid: insp.schemas.filter((s) => !s.valid).length,
      imagesWithoutAlt: insp.images.filter((i) => i.alt === null).length,
      wordCount: insp.wordCount,
      outboundLinks: collectInternalLinks(fetched.html, BASE_URL),
      inboundLinks: 0,
      findings,
      pass: true,
    };
    return result;
  });

  // `inSitemap` is recomputed here rather than trusted from the inventory so
  // a URL discovered only from the filesystem is still tested against the
  // sitemap it is missing from.
  crossChecks(results, SCOPE === "full");

  const totals = totalsOf(results, blocked);

  // ---- Console summary ---------------------------------------------------
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.log(`\n${B}BAŞARISIZ URL'LER${X}`);
    for (const r of failed) {
      console.log(`\n${R}FAIL${X} ${B}${r.path}${X} ${D}(HTTP ${r.finalStatus} · ${r.kind})${X}`);
      for (const f of r.findings.filter((x) => x.level === "error")) {
        console.log(`   ${R}${f.id}${X} ${f.label}: ${f.detail.slice(0, 140)}`);
      }
    }
  }

  const warnCounts = new Map<string, number>();
  for (const r of results)
    for (const f of r.findings)
      if (f.level === "warning") warnCounts.set(f.id, (warnCounts.get(f.id) ?? 0) + 1);
  if (warnCounts.size) {
    console.log(`\n${B}UYARILAR${X}`);
    for (const [id, n] of [...warnCounts.entries()].sort((a, b) => b[1] - a[1]))
      console.log(`   ${Y}${id}${X} ${D}× ${n}${X}`);
  }

  writeReports(results, totals, {
    baseUrl: BASE_URL,
    scope: SCOPE,
    orphanSitemapUrls: inventory.orphanSitemapUrls,
    duplicateSitemapUrls: inventory.duplicateSitemapUrls,
    sitemapCount: inventory.sitemapUrls.length,
    regionCount: inventory.regions.length,
    startedAt,
  });

  await comparePass(results);

  console.log(`\n${"=".repeat(96)}`);
  console.log(`${B}ÖZET${X}`);
  console.log(`  TOTAL URLS        ${totals.total}`);
  console.log(`  PASSED            ${G}${totals.passed}${X}`);
  console.log(`  FAILED            ${totals.failed ? R : G}${totals.failed}${X}`);
  console.log(`  BLOCKED           ${totals.blocked ? Y : G}${totals.blocked}${X}`);
  console.log(`  REDIRECTS         ${totals.redirects}`);
  console.log(`  NOINDEX EXPECTED  ${totals.noindexExpected}`);
  console.log(`  404 ERRORS        ${totals.notFound ? R : G}${totals.notFound}${X}`);
  console.log(`  CANONICAL ERRORS  ${totals.canonicalErrors ? R : G}${totals.canonicalErrors}${X}`);
  console.log(`  HREFLANG ERRORS   ${totals.hreflangErrors ? R : G}${totals.hreflangErrors}${X}`);
  console.log(`  METADATA ERRORS   ${totals.metadataErrors ? R : G}${totals.metadataErrors}${X}`);
  console.log(`\n  ${D}Rapor: ${OUT_DIR}/seo-runtime-audit.md · ${OUT_DIR}/seo-runtime-audit.json${X}\n`);

  if (totals.failed > 0 && !SOFT) process.exit(1);
}

main().catch((err) => {
  console.error(`${R}Audit çalıştırılamadı:${X}`, err);
  process.exit(2);
});
