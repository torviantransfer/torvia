import { locales, localeOgTags, type Locale } from "@/i18n/config";

const BASE_URL = "https://torviantransfer.com";
type AppLocale = Locale;

/**
 * Build canonical + hreflang alternates.
 * If `availableLocales` is provided, only those locales are emitted as
 * hreflang alternates (prevents duplicate-content reports when a page is
 * not actually translated in every language).
 */
export function seoAlternates(
  locale: string,
  path: string,
  availableLocales?: readonly string[]
) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const allowed = (availableLocales && availableLocales.length > 0
    ? locales.filter((l) => availableLocales.includes(l))
    : [...locales]) as AppLocale[];

  // Canonical points to the current locale if it's available, otherwise
  // to the first available locale (English preferred).
  const canonicalLocale =
    allowed.includes(locale as AppLocale)
      ? (locale as AppLocale)
      : allowed.includes("en")
      ? "en"
      : allowed[0] ?? "en";

  const xDefaultLocale = allowed.includes("en") ? "en" : canonicalLocale;

  return {
    canonical: `${BASE_URL}/${canonicalLocale}${cleanPath}`,
    languages: {
      ...Object.fromEntries(
        allowed.map((l) => [l, `${BASE_URL}/${l}${cleanPath}`])
      ),
      "x-default": `${BASE_URL}/${xDefaultLocale}${cleanPath}`,
    },
  };
}

/**
 * Like `seoAlternates`, but for pages whose path differs per locale
 * (localized blog slugs). `pathFor` must return the locale's own path,
 * e.g. `/blog/transfer-lotnisko-antalya-belek` for "pl".
 */
export function seoAlternatesPerLocale(
  locale: string,
  pathFor: (l: AppLocale) => string,
  availableLocales?: readonly string[]
) {
  const allowed = (availableLocales && availableLocales.length > 0
    ? locales.filter((l) => availableLocales.includes(l))
    : [...locales]) as AppLocale[];

  const canonicalLocale =
    allowed.includes(locale as AppLocale)
      ? (locale as AppLocale)
      : allowed.includes("en")
      ? "en"
      : allowed[0] ?? "en";

  const xDefaultLocale = allowed.includes("en") ? "en" : canonicalLocale;
  const norm = (p: string) => (p.startsWith("/") ? p : `/${p}`);

  return {
    canonical: `${BASE_URL}/${canonicalLocale}${norm(pathFor(canonicalLocale))}`,
    languages: {
      ...Object.fromEntries(
        allowed.map((l) => [l, `${BASE_URL}/${l}${norm(pathFor(l))}`])
      ),
      "x-default": `${BASE_URL}/${xDefaultLocale}${norm(pathFor(xDefaultLocale))}`,
    },
  };
}

/**
 * Normalize a slug to lowercase ASCII (removes Turkish/diacritic
 * characters such as ı, ğ, ü, ş, ö, ç, İ). Returns a Google-friendly
 * slug. Used to fix duplicate-canonical reports caused by non-ASCII
 * URLs in Search Console.
 */
export function normalizeSlug(slug: string): string {
  if (!slug) return slug;
  const map: Record<string, string> = {
    ı: "i", İ: "i", ğ: "g", Ğ: "g",
    ü: "u", Ü: "u", ş: "s", Ş: "s",
    ö: "o", Ö: "o", ç: "c", Ç: "c",
  };
  return slug
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, (ch) => map[ch] ?? ch)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function hasNonAsciiSlug(slug: string): boolean {
  return /[^\x00-\x7F]/.test(slug);
}

/**
 * The URL slug a blog post should use in a given locale.
 *
 * Historically every locale shared one Turkish slug, so a Polish reader saw
 * `/pl/blog/antalya-havalimani-belek-transfer` in the SERP — an unreadable URL
 * next to a Polish title, which suppressed CTR on page-1 rankings. Posts now
 * carry a per-locale `slug_<locale>` column; the shared `slug` stays as the
 * fallback and as the permanent identifier for old inbound links.
 */
export function localizedBlogSlug(
  post: Record<string, unknown>,
  locale: string
): string {
  const localized = (post[`slug_${locale}`] as string | null | undefined) ?? "";
  if (localized.trim()) return normalizeSlug(localized.trim());
  return normalizeSlug((post.slug as string) ?? "");
}

/**
 * Every slug a post can be reached by, in any locale. Used to resolve an
 * incoming request to the right post before deciding whether to redirect.
 */
export function allBlogSlugs(post: Record<string, unknown>): string[] {
  const out = new Set<string>();
  const base = (post.slug as string | null) ?? "";
  if (base) out.add(normalizeSlug(base));
  for (const l of locales) {
    const s = (post[`slug_${l}`] as string | null | undefined) ?? "";
    if (s.trim()) out.add(normalizeSlug(s.trim()));
  }
  return [...out];
}

export function seoOpenGraph(
  locale: string,
  path: string,
  title: string,
  description: string,
  image?: string
) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const ogLocale = localeOgTags[locale as AppLocale] ?? localeOgTags.en;

  return {
    title,
    description,
    url: `${BASE_URL}/${locale}${cleanPath}`,
    siteName: "TORVIAN Transfer",
    type: "website" as const,
    locale: ogLocale,
    images: [
      {
        url: image || `${BASE_URL}/images/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  };
}

export function seoTwitter(title: string, description: string, image?: string) {
  return {
    card: "summary_large_image" as const,
    title,
    description,
    images: [image || `${BASE_URL}/images/og-default.jpg`],
    creator: "@torviantransfer",
    site: "@torviantransfer",
  };
}
