import { locales } from "@/i18n/config";
import { buildRedirects } from "@/lib/redirects";

/**
 * The parts of the landing-page model that are safe in a browser bundle.
 *
 * Split out of `landingPages.ts` because that module reaches Supabase through
 * `createAdminClient`, which reads `SUPABASE_SERVICE_ROLE_KEY`. The admin
 * editor is a client component and needs these rules to validate a slug while
 * the field is still focused — importing them from the server module would
 * pull the service-role client into the browser bundle with them.
 *
 * Nothing here touches the network or the environment. The same functions run
 * on the server, in /api/admin/crud, which is where the answer actually
 * counts: the copy in the form exists to explain the refusal, not to be
 * trusted.
 */

/** Lowercase ASCII, digits, single hyphens, no leading or trailing hyphen. */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Slugs a landing page may never claim.
 *
 * A file route under src/app/[locale] always beats the `[region]` dynamic
 * segment in the App Router, so a landing page created on one of these names
 * would save cleanly, show as published in the panel, sit in the sitemap — and
 * serve the hardcoded page instead, with no error anywhere. That is the exact
 * failure `FILE_ROUTE_SHADOWED` documents for the land-of-legends region, and
 * it is worth refusing at the point of creation rather than explaining after.
 *
 * A literal list rather than a filesystem read: this has to be usable from the
 * browser, and a route disappearing from disk should not quietly make its slug
 * available while Google still has the URL.
 */
export const RESERVED_SLUGS: readonly string[] = [
  // File routes under src/app/[locale].
  "about",
  "account",
  "admin",
  "antalya-airport-transfer",
  "blog",
  "booking",
  "cancellation",
  "contact",
  "cookies",
  "faq",
  "hotel-transfer-antalya",
  "kvkk",
  "land-of-legends-transfer",
  "lara-beach-transfer",
  "privacy",
  "regions",
  "terms",
  "track",
  "vip-transfer-antalya",
  // Routes outside the locale tree that the proxy matcher excludes. A page
  // here would be unreachable for a different reason, which is no better.
  "api",
  "auth",
  "driver",
  // Locale codes: /tr/en reads as a locale switch, and next-intl's own routing
  // is entitled to that shape.
  ...locales,
];

/**
 * Slugs that `next.config.ts` already 308s somewhere else.
 *
 * A redirect declared there runs *before* routing, so a landing page created
 * on one of these slugs never gets to render: /tr/olympos would 308 to
 * /tr/olympos-transfer, find no region there, and 404 — while the panel showed
 * the page as published and the sitemap submitted the redirecting URL. That is
 * Search Console's "Submitted URL has redirect", which is the exact error the
 * comment at the top of `redirects.ts` exists to prevent.
 *
 * Derived from `buildRedirects()` rather than from a second copy of the slug
 * lists, because the two lists it is built from do not agree with the regions
 * table: `LEGACY_REGION_SLUGS` deliberately holds thirteen historical slugs —
 * `lara`, `kundu`, `olympos`, `demre`, `manavgat` and others — that no active
 * region has. Checking the regions table alone let every one of them through.
 * Reading the rules themselves also means a redirect added later is covered
 * without anyone remembering this file exists.
 */
const REDIRECTED_SLUGS: ReadonlySet<string> = (() => {
  const set = new Set<string>();
  const localeSet = new Set<string>(locales);
  for (const rule of buildRedirects()) {
    const parts = rule.source.split("/").filter(Boolean);
    // `/<locale>/<slug>` only. Deeper sources (blog posts) and the locale-less
    // forms cannot collide with a single-segment landing slug.
    if (parts.length === 2 && localeSet.has(parts[0])) set.add(parts[1]);
  }
  return set;
})();

/**
 * Unicode combining marks. Built from a string rather than written as a regex
 * literal so the range stays legible — as literal characters these are
 * zero-width and the class reads as an empty box in most editors.
 */
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

/**
 * Turns typed text into a slug, transliterating Turkish characters the way
 * `normalizeSlug` does for blog posts — so "Kayak Transferi" cannot become
 * "kayak-transferı" and produce a non-ASCII URL that Search Console reports as
 * a duplicate.
 */
export function slugifyLanding(value: string): string {
  const map: Record<string, string> = {
    ı: "i",
    İ: "i",
    ğ: "g",
    Ğ: "g",
    ü: "u",
    Ü: "u",
    ş: "s",
    Ş: "s",
    ö: "o",
    Ö: "o",
    ç: "c",
    Ç: "c",
    â: "a",
    î: "i",
    û: "u",
  };
  return value
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    // The combining-mark block. NFD has just split "é" into "e" plus its
    // accent; dropping the accent here keeps the letter, where the next rule
    // would have turned it into a hyphen and lost it.
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Both URL forms a region slug occupies. */
export function regionSlugForms(slug: string): string[] {
  const bare = slug.replace(/-transfer$/, "");
  return [bare, `${bare}-transfer`];
}

/**
 * Why a slug cannot be used, in Turkish, or null when it can.
 *
 * `regionSlugs` is every region slug in both its bare and `-transfer` forms.
 * Regions win a collision unconditionally: they carry the pricing rows the
 * booking flow reads and the rankings the site already has, so the landing
 * page is the one that has to move.
 */
export function landingSlugProblem(
  slug: string,
  regionSlugs: readonly string[],
  takenSlugs: readonly string[]
): string | null {
  const s = slug.trim();
  if (!s) return "URL adresi (slug) boş olamaz.";
  if (!SLUG_RE.test(s)) {
    return "Slug yalnızca küçük harf, rakam ve tek tire içerebilir (örnek: antalya-kayak-transfer).";
  }
  if (s.length > 80) return "Slug 80 karakterden kısa olmalı.";
  if (RESERVED_SLUGS.includes(s)) {
    return `"${s}" adresi kodla yazılmış bir sayfaya ait. Bu adresle açılan landing sayfası hiçbir zaman görünmez.`;
  }
  if (regionSlugs.includes(s)) {
    return `"${s}" bir bölge sayfasının adresi. Bölge sayfaları bu adresi kazanır, landing sayfası açılmaz.`;
  }
  if (REDIRECTED_SLUGS.has(s)) {
    return `"${s}" adresi site genelinde başka bir sayfaya yönlendiriliyor (301). Bu adresle açılan sayfa hiçbir zaman görünmez.`;
  }
  if (takenSlugs.includes(s)) {
    return `"${s}" adresinde başka bir landing sayfası var.`;
  }
  return null;
}

/** A trimmed string, or undefined when the column is null, absent or blank. */
export function columnText(
  row: Record<string, unknown> | null,
  column: string
): string | undefined {
  if (!row) return undefined;
  const raw = row[column];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Whether this locale has its own copy.
 *
 * The panel asks for all seven languages, but a page is saved and published
 * long before the last translation is written. A locale without copy renders
 * the English text — the same thing the five hardcoded landing pages do
 * outside `inlineCopyLocales` — and must therefore be noindex and absent from
 * the sitemap, or the site submits one English page to Google seven times
 * under seven hreflang tags claiming seven languages.
 *
 * Read by the page, by the sitemap and by the SEO panel's audit. All three
 * have to agree, which is why it is one function.
 */
export function landingHasLocale(row: Record<string, unknown>, locale: string): boolean {
  return Boolean(columnText(row, `h1_${locale}`) && columnText(row, `content_${locale}`));
}
