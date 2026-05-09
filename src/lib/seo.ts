const BASE_URL = "https://torviantransfer.com";
const locales = ["tr", "en", "de", "pl", "ru"] as const;
type AppLocale = (typeof locales)[number];

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

export function seoOpenGraph(
  locale: string,
  path: string,
  title: string,
  description: string,
  image?: string
) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const ogLocale =
    locale === "tr" ? "tr_TR" :
    locale === "de" ? "de_DE" :
    locale === "pl" ? "pl_PL" :
    locale === "ru" ? "ru_RU" : "en_US";

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
