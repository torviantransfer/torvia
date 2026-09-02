/**
 * Reads the full SEO surface of a list of URLs and prints it as a table,
 * plus the contract checks the admin panel depends on.
 *
 * Runs the panel's own `seoInspect` parser and `seoAudit` rules, so what this
 * prints is exactly what the admin screen would show for the same page. That
 * is the point: verifying the panel by reading the panel proves nothing, and
 * this can be pointed at any deployment.
 *
 *   BASE_URL=https://<preview>.vercel.app npm run audit:seo
 *
 * Optionally compares two deployments field by field, which is how the
 * "nothing changed for a crawler" contract is actually demonstrated rather
 * than argued:
 *
 *   BASE_URL=https://<preview>.vercel.app \
 *   COMPARE_URL=https://torviantransfer.com npm run audit:seo
 *
 * Supabase credentials, if present in the environment, are used to read the
 * override columns so the Override/Fallback/Effective/Source breakdown is
 * measured rather than assumed. Without them the script says so instead of
 * guessing.
 */
import { parseInspection, type PageInspection } from "../src/lib/seoInspect";
import { auditPage, type AuditFinding } from "../src/lib/seoAudit";

const BASE_URL = (process.env.BASE_URL ?? "https://torviantransfer.com").replace(/\/+$/, "");
const COMPARE_URL = process.env.COMPARE_URL?.replace(/\/+$/, "") ?? null;

const R = "\x1b[31m";
const G = "\x1b[32m";
const Y = "\x1b[33m";
const B = "\x1b[1m";
const D = "\x1b[2m";
const X = "\x1b[0m";

interface Target {
  path: string;
  locale: string;
  route: string;
  type: "home" | "landing" | "static" | "region" | "blog";
  /** Which table and key the overrides would live under. */
  table: "seo_pages" | "regions" | "blog_posts";
  key: string;
}

const TARGETS: Target[] = [
  { path: "/en", locale: "en", route: "", type: "home", table: "seo_pages", key: "home" },
  { path: "/en/antalya-airport-transfer", locale: "en", route: "antalya-airport-transfer", type: "landing", table: "seo_pages", key: "antalya-airport-transfer" },
  { path: "/en/booking", locale: "en", route: "booking", type: "landing", table: "seo_pages", key: "booking" },
  { path: "/en/belek-transfer", locale: "en", route: "belek-transfer", type: "region", table: "regions", key: "belek" },
  { path: "/pl/side-transfer", locale: "pl", route: "side-transfer", type: "region", table: "regions", key: "side" },
  { path: "/ru/alanya-transfer", locale: "ru", route: "alanya-transfer", type: "region", table: "regions", key: "alanya" },
  { path: "/en/privacy", locale: "en", route: "privacy", type: "static", table: "seo_pages", key: "privacy" },
];

/** Column names the panel treats as overrides, per logical field. */
const OVERRIDE_COLUMNS: Record<string, (loc: string) => string> = {
  title: (l) => `meta_title_${l}`,
  description: (l) => `meta_description_${l}`,
  canonical: (l) => `canonical_url_${l}`,
  ogTitle: (l) => `og_title_${l}`,
  ogDescription: (l) => `og_description_${l}`,
  ogImage: () => "og_image_url",
  twitterCard: () => "twitter_card",
  h1: (l) => `h1_${l}`,
};

type Overrides = Record<string, string | null> | null;

async function fetchOverrides(target: Target): Promise<Overrides> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const column = target.table === "seo_pages" ? "page_key" : "slug";
  try {
    const res = await fetch(
      `${url}/rest/v1/${target.table}?${column}=eq.${encodeURIComponent(target.key)}&select=*`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const rows = await res.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : {};
  } catch {
    return null;
  }
}

async function inspect(base: string, path: string): Promise<PageInspection> {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "TorvianSeoInspector/1.0", accept: "text/html" },
  });
  return parseInspection(url, res.status, await res.text());
}

function show(v: string | null | undefined, max = 74): string {
  if (v == null || v === "") return `${R}— YOK —${X}`;
  return v.length > max ? `${v.slice(0, max - 1)}…` : v;
}

function row(label: string, value: string) {
  console.log(`   ${D}${label.padEnd(16)}${X} ${value}`);
}

/**
 * The Override / Fallback / Effective / Source breakdown for one field.
 *
 * `fallback` is the value the deployment serves. When no override is set the
 * two are the same by definition, and the point of printing both is to make
 * that visible rather than leaving an editor to guess.
 */
function breakdown(
  name: string,
  live: string | null | undefined,
  overrides: Overrides,
  locale: string
) {
  const column = OVERRIDE_COLUMNS[name]?.(locale);
  const raw = overrides && column ? overrides[column] : undefined;
  const override = typeof raw === "string" && raw.trim() ? raw.trim() : "";
  const source = override ? "admin override" : live ? "page code / default" : "none";
  const effective = override || live || "";

  console.log(
    `   ${D}${name.padEnd(16)}${X} ${show(effective, 60)}  ${D}[${
      overrides === null ? "override: bilinmiyor" : override ? "override" : "fallback"
    } · ${source}]${X}`
  );
  return { override, fallback: live ?? "", effective, source };
}

interface Result {
  target: Target;
  inspection: PageInspection;
  findings: AuditFinding[];
  overrides: Overrides;
}

async function main() {
  // Pick a real published post from the sitemap rather than hardcoding a slug
  // that may be unpublished by the time this runs.
  try {
    const sm = await fetch(`${BASE_URL}/sitemap.xml`).then((r) => r.text());
    const slug = sm.match(/<loc>[^<]*\/en\/blog\/([^<]+)<\/loc>/)?.[1];
    if (slug) {
      TARGETS.push({
        path: `/en/blog/${slug}`,
        locale: "en",
        route: `blog/${slug}`,
        type: "blog",
        table: "blog_posts",
        key: slug,
      });
    } else {
      console.log(`${Y}sitemap'te blog yazısı bulunamadı${X}`);
    }
  } catch {
    console.log(`${Y}sitemap okunamadı — blog örneği atlandı${X}`);
  }

  console.log(`\n${B}Hedef:${X} ${BASE_URL}`);
  if (COMPARE_URL) console.log(`${B}Karşılaştırma:${X} ${COMPARE_URL}`);
  console.log(
    process.env.SUPABASE_SERVICE_ROLE_KEY
      ? `${B}Override kaynağı:${X} Supabase (ölçülüyor)`
      : `${Y}Supabase anahtarı yok — override sütunları okunamıyor, "bilinmiyor" olarak raporlanır${X}`
  );
  console.log("=".repeat(96));

  const results: Result[] = [];

  for (const t of TARGETS) {
    let insp: PageInspection;
    try {
      insp = await inspect(BASE_URL, t.path);
    } catch (e) {
      console.log(`\n${R}${t.path} — FETCH HATASI: ${e}${X}`);
      continue;
    }
    const overrides = await fetchOverrides(t);

    console.log(`\n${B}${t.path}${X}  ${D}(HTTP ${insp.status} · ${t.type})${X}`);

    breakdown("title", insp.title, overrides, t.locale);
    breakdown("description", insp.description, overrides, t.locale);
    breakdown("h1", insp.h1s[0], overrides, t.locale);
    breakdown("canonical", insp.canonical, overrides, t.locale);
    row("robots", show(insp.robots));
    row("googlebot", show(insp.googlebot, 90));
    row(
      "hreflang",
      insp.alternates.length
        ? insp.alternates.map((a) => a.hreflang).join(", ")
        : `${R}— YOK —${X}`
    );
    breakdown("ogTitle", insp.ogTitle, overrides, t.locale);
    breakdown("ogDescription", insp.ogDescription, overrides, t.locale);
    breakdown("ogImage", insp.ogImage, overrides, t.locale);
    breakdown("twitterCard", insp.twitterCard, overrides, t.locale);
    row("twitter:image", show(insp.twitterImage));
    row(
      "json-ld",
      insp.schemas.length
        ? [...new Set(insp.schemas.flatMap((s) => s.types))].join(", ")
        : `${Y}— yok —${X}`
    );
    row("html lang", show(insp.htmlLang));
    row(
      "görsel",
      `${insp.images.length} adet, ${insp.images.filter((i) => i.alt === null).length} tanesi alt'sız`
    );
    row("kelime", String(insp.wordCount));

    const findings = auditPage(insp, {
      route: t.route,
      locale: t.locale,
      pageType: t.type,
      shouldIndex: t.type !== "static" || ["blog", "regions"].includes(t.route),
    });
    const errors = findings.filter((f) => f.level === "error");
    const warnings = findings.filter((f) => f.level === "warning");
    row(
      "denetim",
      `${errors.length ? R : G}${errors.length} hata${X}, ${warnings.length ? Y : G}${warnings.length} uyarı${X}`
    );
    for (const f of [...errors, ...warnings]) {
      console.log(
        `      ${f.level === "error" ? R : Y}${f.level.toUpperCase()}${X} ${f.label}: ${f.detail.slice(0, 100)}`
      );
    }

    results.push({ target: t, inspection: insp, findings, overrides });
  }

  // ---- Contract: the crawler-visible surface is unchanged ----------------
  if (COMPARE_URL) {
    console.log(`\n${"=".repeat(96)}`);
    console.log(`${B}KONTRAT: override girilmemişken public HTML değişmemeli${X}`);
    console.log(
      `${D}Her alan iki deployment arasında karşılaştırılıyor. Origin farkı normalize ediliyor.${X}\n`
    );

    let diffs = 0;
    for (const r of results) {
      let other: PageInspection;
      try {
        other = await inspect(COMPARE_URL, r.target.path);
      } catch {
        console.log(`${Y}${r.target.path} — karşılaştırma alınamadı${X}`);
        continue;
      }

      // Origins differ between a preview host and production, so URLs are
      // compared with the origin stripped; anything else would report every
      // canonical as a difference.
      const strip = (v: string | null) =>
        v === null ? null : v.replace(BASE_URL, "").replace(COMPARE_URL, "");

      const fields: [string, string | null, string | null][] = [
        ["title", r.inspection.title, other.title],
        ["description", r.inspection.description, other.description],
        ["canonical", strip(r.inspection.canonical), strip(other.canonical)],
        ["robots", r.inspection.robots, other.robots],
        ["googlebot", r.inspection.googlebot, other.googlebot],
        ["h1", r.inspection.h1s.join("|"), other.h1s.join("|")],
        ["og:title", r.inspection.ogTitle, other.ogTitle],
        ["og:description", r.inspection.ogDescription, other.ogDescription],
        ["og:image", strip(r.inspection.ogImage), strip(other.ogImage)],
        ["og:image:alt", r.inspection.ogImageAlt, other.ogImageAlt],
        ["twitter:card", r.inspection.twitterCard, other.twitterCard],
        ["twitter:image", strip(r.inspection.twitterImage), strip(other.twitterImage)],
        [
          "hreflang",
          r.inspection.alternates.map((a) => `${a.hreflang}=${strip(a.href)}`).sort().join(","),
          other.alternates.map((a) => `${a.hreflang}=${strip(a.href)}`).sort().join(","),
        ],
        [
          "json-ld tipleri",
          [...new Set(r.inspection.schemas.flatMap((s) => s.types))].sort().join(","),
          [...new Set(other.schemas.flatMap((s) => s.types))].sort().join(","),
        ],
      ];

      const changed = fields.filter(([, a, b]) => (a ?? "") !== (b ?? ""));
      if (changed.length === 0) {
        console.log(`${G}AYNI${X}  ${r.target.path}`);
      } else {
        diffs += changed.length;
        console.log(`${Y}FARKLI${X} ${r.target.path}`);
        for (const [name, a, b] of changed) {
          console.log(`        ${name}`);
          console.log(`          ${COMPARE_URL}: ${show(b, 80)}`);
          console.log(`          ${BASE_URL}: ${show(a, 80)}`);
        }
      }
    }
    console.log(
      `\n${diffs === 0 ? `${G}Hiçbir alan değişmedi.${X}` : `${Y}${diffs} alan farklı — her biri kasıtlı mı kontrol edilmeli.${X}`}`
    );
  }

  // ---- Summary ----------------------------------------------------------
  console.log(`\n${"=".repeat(96)}`);
  const totalErrors = results.reduce(
    (n, r) => n + r.findings.filter((f) => f.level === "error").length,
    0
  );
  const totalWarnings = results.reduce(
    (n, r) => n + r.findings.filter((f) => f.level === "warning").length,
    0
  );
  const emptyFields = results.reduce((n, r) => {
    const i = r.inspection;
    return (
      n +
      [i.title, i.description, i.canonical, i.h1s[0], i.ogTitle, i.ogImage].filter((v) => !v).length
    );
  }, 0);

  console.log(`${B}ÖZET${X}`);
  console.log(`  Sayfa            ${results.length}`);
  console.log(`  Teknik hata      ${totalErrors ? R : G}${totalErrors}${X}`);
  console.log(`  Uyarı            ${totalWarnings ? Y : G}${totalWarnings}${X}`);
  console.log(`  Boş SEO alanı    ${emptyFields ? Y : G}${emptyFields}${X}  ${D}(panelde "değer yok" görünecek olanlar)${X}\n`);
}

main();
