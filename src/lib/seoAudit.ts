import type { PageInspection } from "@/lib/seoInspect";
import { locales } from "@/i18n/config";

/**
 * Technical SEO checks over what a page actually serves.
 *
 * Separate from `scoreSeo`, and deliberately so. That one grades editorial
 * quality — is the title the right length, does it carry the focus keyword —
 * and produces a percentage. These are pass/fail facts about the delivered
 * HTML: the canonical points somewhere else, there are two H1s, the same
 * schema type is emitted twice. A percentage is the wrong shape for those,
 * because one broken canonical is not "83% fine".
 *
 * Every finding names the observed value. "Canonical mismatch" without
 * showing which URL it points at is not actionable.
 */

export type AuditLevel = "error" | "warning" | "info";

export interface AuditFinding {
  id: string;
  level: AuditLevel;
  label: string;
  detail: string;
  /** Field to focus in the editor, when there is one. */
  field?: string;
}

const SITE_ORIGIN = "https://torviantransfer.com";

export interface AuditContext {
  /** Path after the locale segment; "" for the homepage. */
  route: string;
  locale: string;
  /** The locales this page is genuinely translated into, when known. */
  translatedLocales?: string[];
  /** Region/blog rows that are not published should not be audited as if they were. */
  isActive?: boolean;
  /** Pages that are meant to be indexed; a noindex here is an error, not a note. */
  shouldIndex?: boolean;
  /** Titles seen elsewhere in the set, for duplicate detection. */
  duplicateTitleWith?: string[];
  /** Slugs colliding with this one. */
  duplicateSlugWith?: string[];
  pageType: "home" | "landing" | "static" | "region" | "blog";
}

function normaliseUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // Trailing slashes and a default port are not meaningful differences;
    // reporting them as a canonical mismatch would be noise.
    u.hash = "";
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.origin}${u.pathname}${u.search}`;
  } catch {
    return raw;
  }
}

export function auditPage(inspection: PageInspection, ctx: AuditContext): AuditFinding[] {
  const f: AuditFinding[] = [];
  const add = (
    id: string,
    level: AuditLevel,
    label: string,
    detail: string,
    field?: string
  ) => f.push({ id, level, label, detail, field });

  // ---- Reachability -----------------------------------------------------
  if (inspection.error || inspection.status === 0) {
    add("fetch-failed", "error", "Sayfa okunamadı", inspection.error ?? "Bilinmeyen hata");
    return f;
  }
  if (inspection.status === 404) {
    add("404", "error", "Sayfa 404 dönüyor", `${inspection.url} bulunamadı.`);
    return f;
  }
  if (inspection.status >= 400) {
    add("http-error", "error", `HTTP ${inspection.status}`, `${inspection.url} hata döndürüyor.`);
    return f;
  }

  const expected = `${SITE_ORIGIN}/${ctx.locale}${ctx.route ? `/${ctx.route}` : ""}`;

  // A redirect is not a defect in itself, but it means the panel's idea of
  // the URL differs from the live one, which changes what canonical should
  // say — so it is surfaced rather than hidden.
  if (normaliseUrl(inspection.url) !== normaliseUrl(expected)) {
    add(
      "redirected",
      "info",
      "Sayfa yönlendiriliyor",
      `${expected} → ${inspection.url}`
    );
  }

  // ---- Title ------------------------------------------------------------
  if (!inspection.title?.trim()) {
    add("title-missing", "error", "Title etiketi yok", "Sayfada <title> bulunamadı.", "meta_title");
  } else if (ctx.duplicateTitleWith?.length) {
    add(
      "title-duplicate",
      "warning",
      "Title başka sayfayla aynı",
      `Aynı başlık: ${ctx.duplicateTitleWith.slice(0, 3).join(", ")}. Google genelde birini sonuçlardan düşürür.`,
      "meta_title"
    );
  }

  // ---- Description ------------------------------------------------------
  if (!inspection.description?.trim()) {
    add(
      "description-missing",
      "warning",
      "Meta description yok",
      "Google sayfa metninden rastgele bir bölüm seçer.",
      "meta_description"
    );
  }

  // ---- H1 ---------------------------------------------------------------
  if (inspection.h1s.length === 0) {
    add("h1-missing", "error", "H1 yok", "Sayfada hiç <h1> yok.", "h1");
  } else if (inspection.h1s.length > 1) {
    add(
      "h1-multiple",
      "warning",
      `${inspection.h1s.length} adet H1`,
      `Sayfada birden fazla H1 var: "${inspection.h1s.slice(0, 3).join('", "')}". Tek bir H1 olmalı.`,
      "h1"
    );
  }

  // ---- Canonical --------------------------------------------------------
  if (!inspection.canonical) {
    add(
      "canonical-missing",
      "error",
      "Canonical yok",
      "rel=canonical etiketi bulunamadı. Aynı içeriğin farklı URL'leri birbiriyle yarışır.",
      "canonical_url"
    );
  } else {
    let canonicalHost = "";
    try {
      canonicalHost = new URL(inspection.canonical).origin;
    } catch {
      add(
        "canonical-malformed",
        "error",
        "Canonical geçersiz URL",
        `"${inspection.canonical}" ayrıştırılamıyor.`,
        "canonical_url"
      );
    }

    if (canonicalHost && canonicalHost !== SITE_ORIGIN) {
      add(
        "canonical-offsite",
        "error",
        "Canonical başka alan adına gidiyor",
        `${inspection.canonical} — bu sayfa indeksten çıkar ve trafiği o adrese devreder.`,
        "canonical_url"
      );
    } else if (canonicalHost) {
      const self = normaliseUrl(inspection.canonical) === normaliseUrl(inspection.url);
      if (!self) {
        // Not automatically wrong: region and blog pages deliberately point a
        // non-translated locale at the primary one. It still has to be
        // visible, because a canonical pointing elsewhere means this URL will
        // not rank on its own.
        add(
          "canonical-mismatch",
          "warning",
          "Canonical kendine işaret etmiyor",
          `${inspection.canonical} adresine işaret ediyor. Bu sayfa kendi başına sıralanmaz — çevirisi olmayan diller için bu kasıtlıdır.`,
          "canonical_url"
        );
      }
    }
  }

  // ---- Robots -----------------------------------------------------------
  const robotsText = `${inspection.robots ?? ""} ${inspection.googlebot ?? ""}`.toLowerCase();
  const isNoindex = /\bnoindex\b/.test(robotsText);
  const isNofollow = /\bnofollow\b/.test(robotsText);

  if (isNoindex) {
    add(
      ctx.shouldIndex ? "noindex-unexpected" : "noindex",
      ctx.shouldIndex ? "error" : "info",
      ctx.shouldIndex ? "İndekslenmemesi gerekmiyor ama noindex" : "Sayfa noindex",
      ctx.shouldIndex
        ? `Bu sayfanın Google'da çıkması gerekiyor ama robots "${inspection.robots ?? inspection.googlebot}" diyor.`
        : `robots: ${inspection.robots ?? inspection.googlebot}`,
      "noindex"
    );
  }
  if (isNofollow) {
    add(
      "nofollow",
      "warning",
      "Sayfa nofollow",
      "Bu sayfadaki linkler taranmıyor — iç link gücü aktarılmıyor.",
      "nofollow"
    );
  }
  if (!inspection.robots && !inspection.googlebot) {
    add(
      "robots-missing",
      "warning",
      "Robots direktifi yok",
      "Ne robots ne googlebot etiketi var. max-image-preview:large olmadan Google büyük görsel önizleme göstermez."
    );
  } else if (!/max-image-preview\s*:\s*large/i.test(robotsText) && !isNoindex) {
    add(
      "no-large-preview",
      "warning",
      "max-image-preview:large yok",
      "Bu direktif olmadan arama sonucunda büyük görsel çıkmaz."
    );
  }

  // ---- Hreflang ---------------------------------------------------------
  const expectedLocales = ctx.translatedLocales?.length
    ? ctx.translatedLocales
    : [...locales];
  const seen = new Map(inspection.alternates.map((a) => [a.hreflang.toLowerCase(), a.href]));

  if (inspection.alternates.length === 0) {
    if (!isNoindex) {
      add(
        "hreflang-missing",
        "warning",
        "Hreflang yok",
        "Sayfanın dil alternatifleri bildirilmiyor. Diller birbirinin kopyası olarak değerlendirilebilir."
      );
    }
  } else {
    const missing = expectedLocales.filter((l) => !seen.has(l));
    if (missing.length) {
      add(
        "hreflang-incomplete",
        "warning",
        "Eksik hreflang",
        `Şu diller bildirilmemiş: ${missing.map((l) => l.toUpperCase()).join(", ")}.`
      );
    }
    if (!seen.has("x-default")) {
      add(
        "hreflang-no-xdefault",
        "info",
        "x-default yok",
        "Hangi dilin varsayılan olduğu bildirilmemiş."
      );
    }
    // Self-reference: the set must include this page's own locale, or Google
    // treats the whole cluster as inconsistent and ignores it.
    const own = seen.get(ctx.locale);
    if (!own) {
      add(
        "hreflang-no-self",
        "error",
        "Hreflang kendini içermiyor",
        `${ctx.locale.toUpperCase()} kendi hreflang listesinde yok. Google karşılıklı olmayan hreflang kümesini tamamen yok sayar.`
      );
    } else if (normaliseUrl(own) !== normaliseUrl(inspection.url)) {
      add(
        "hreflang-self-mismatch",
        "warning",
        "Hreflang kendi adresini yanlış gösteriyor",
        `${ctx.locale.toUpperCase()} → ${own}, ama sayfa ${inspection.url}.`
      );
    }
    // A locale pointing at another locale's path is the classic copy-paste
    // failure and silently breaks the whole cluster.
    for (const [lang, href] of seen) {
      if (lang === "x-default") continue;
      if (!locales.includes(lang as (typeof locales)[number])) continue;
      if (!href.includes(`/${lang}/`) && !href.endsWith(`/${lang}`)) {
        add(
          `hreflang-wrong-${lang}`,
          "error",
          `${lang.toUpperCase()} hreflang yanlış adrese gidiyor`,
          `${lang} → ${href} — bu adres ${lang} diline ait değil.`
        );
      }
    }
  }

  // ---- Open Graph / Twitter --------------------------------------------
  if (!inspection.ogImage) {
    add(
      "og-image-missing",
      "warning",
      "OG görseli yok",
      "Bu sayfanın linki paylaşıldığında görselsiz düz bir kart çıkar.",
      "og_image_url"
    );
  }
  if (!inspection.ogTitle) {
    add("og-title-missing", "info", "og:title yok", "Paylaşımlarda <title> kullanılır.", "og_title");
  }
  if (inspection.twitterCard && inspection.twitterCard !== "summary_large_image" && inspection.ogImage) {
    add(
      "twitter-card-small",
      "info",
      "Twitter kartı küçük",
      `card="${inspection.twitterCard}" — görsel varken summary_large_image daha iyi görünür.`,
      "twitter_card"
    );
  }

  // ---- Images -----------------------------------------------------------
  // alt="" is a valid decorative marker; only a missing attribute counts.
  const noAlt = inspection.images.filter((i) => i.alt === null);
  if (noAlt.length > 0) {
    add(
      "image-alt-missing",
      "warning",
      `${noAlt.length} görselde alt metni yok`,
      `Örnek: ${noAlt.slice(0, 2).map((i) => i.src.split("/").pop()).join(", ")}. Google Görseller'de çıkmak için gerekli.`,
      "image_alt"
    );
  }

  // ---- Content ----------------------------------------------------------
  if (inspection.wordCount < 200 && !isNoindex) {
    add(
      "thin-content",
      "warning",
      "İçerik kısa",
      `${inspection.wordCount} kelime. Aynı terime çıkan rakiplerle yarışmak için genelde 300+ gerekir.`
    );
  }

  // ---- Schema -----------------------------------------------------------
  const invalid = inspection.schemas.filter((s) => !s.valid);
  for (const s of invalid) {
    add("schema-invalid", "error", "Geçersiz JSON-LD", s.error ?? "Ayrıştırılamadı.");
  }

  const typeCounts = new Map<string, number>();
  for (const s of inspection.schemas) {
    for (const t of s.types) typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  for (const [type, count] of typeCounts) {
    // Repeatable node types are the building blocks of other schemas, not
    // page-level entities, so seeing many is correct.
    if (REPEATABLE_TYPES.has(type)) continue;
    if (count > 1) {
      add(
        `schema-duplicate-${type}`,
        "warning",
        `${type} şeması ${count} kez basılıyor`,
        "Aynı varlığın iki kez tanımlanması Google'ın hangisini kullanacağını belirsizleştirir."
      );
    }
  }

  if (ctx.pageType === "blog") {
    const article = inspection.schemas.find((s) =>
      s.types.some((t) => t === "BlogPosting" || t === "Article" || t === "NewsArticle")
    );
    if (!article) {
      add(
        "schema-article-missing",
        "warning",
        "Article/BlogPosting şeması yok",
        "Blog yazıları için Google'ın beklediği şema tipi bu."
      );
    } else {
      for (const [key, label] of [
        ["headline", "headline"],
        ["datePublished", "datePublished"],
        ["author", "author"],
        ["image", "image"],
      ] as const) {
        if (!article.fields[key]) {
          add(
            `schema-article-${key}`,
            "warning",
            `Article şemasında ${label} eksik`,
            `Google zengin sonuç için ${label} alanını bekler.`
          );
        }
      }
    }
  }

  if (ctx.pageType === "region") {
    // The region query intentionally includes reviews with a NULL region_id,
    // which are genuine but not about this destination. Marking them up as if
    // they were is the "global review data attached as region review" case,
    // and it is worth naming explicitly.
    const rated = inspection.schemas.find((s) => s.fields.aggregateRating);
    if (rated) {
      add(
        "region-rating-source",
        "info",
        "Bölge puanı genel yorumları içeriyor",
        "Bölgeye atanmamış yorumlar bu sayfada da sayılıyor. Değerlendirmeler ekranından yorumları bölgelere atayarak ayırabilirsiniz."
      );
    }
  }

  if (ctx.duplicateSlugWith?.length) {
    add(
      "slug-duplicate",
      "error",
      "Slug çakışması",
      `Aynı URL yolu: ${ctx.duplicateSlugWith.join(", ")}.`
    );
  }

  // ---- Locale consistency ----------------------------------------------
  if (inspection.htmlLang && !inspection.htmlLang.toLowerCase().startsWith(ctx.locale)) {
    add(
      "locale-mismatch",
      "error",
      "html lang yanlış",
      `Sayfa ${ctx.locale.toUpperCase()} olmalı ama <html lang="${inspection.htmlLang}">.`
    );
  }

  return f;
}

/**
 * Schema types that legitimately appear many times on one page: they are
 * components of a larger structure (a breadcrumb's items, an FAQ's questions)
 * rather than page-level entities.
 */
const REPEATABLE_TYPES = new Set([
  "ListItem",
  "Question",
  "Answer",
  "Offer",
  "HowToStep",
  "PostalAddress",
  "GeoCoordinates",
  "ContactPoint",
  "OpeningHoursSpecification",
  "ImageObject",
  "Person",
  "Rating",
  "Review",
  "Brand",
  "Place",
  "City",
  "ServiceChannel",
  "AggregateOffer",
  "AggregateRating",
  "SearchAction",
]);

/** Rolls findings up into the one word the list column needs. */
export function auditSummary(findings: AuditFinding[]): {
  level: "error" | "warning" | "ok";
  errors: number;
  warnings: number;
} {
  const errors = findings.filter((x) => x.level === "error").length;
  const warnings = findings.filter((x) => x.level === "warning").length;
  return { level: errors > 0 ? "error" : warnings > 0 ? "warning" : "ok", errors, warnings };
}
