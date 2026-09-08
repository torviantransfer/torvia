import { cache } from "react";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyOverrides } from "@/lib/seoOverrides";
import {
  seoAlternatesPerLocale,
  seoOpenGraph,
  seoTwitter,
  INDEXABLE_ROBOTS,
  NOINDEX_ROBOTS,
} from "@/lib/seo";
import {
  SLUG_RE,
  columnText,
  landingHasLocale,
  localizedLandingSlug,
  allLandingSlugs,
} from "@/lib/landingSlug";
import { locales, type Locale } from "@/i18n/config";

const BASE_URL = "https://torviantransfer.com";

/**
 * Landing pages an admin creates from the panel, stored as rows rather than as
 * React components.
 *
 * They are served by src/app/[locale]/[region]/page.tsx, which is the only
 * dynamic segment directly under the locale and therefore the only place a
 * root-level slug can be resolved. Two dynamic segments cannot coexist at one
 * level in the App Router, so a separate `[landing]` folder is not an option —
 * the region route resolves both, regions first.
 *
 * This module reaches Supabase with the service role, so nothing in it may be
 * imported from a client component. The rules the admin form needs live in
 * `landingSlug.ts`, which is free of that dependency for exactly that reason.
 */
export interface LandingPage {
  id: string;
  slug: string;
  label: string;
  is_published: boolean;
  cta_region_slug: string | null;
  image_url: string | null;
  og_image_url: string | null;
  image_alt: string | null;
  noindex: boolean | null;
  updated_at: string | null;
  [key: string]: unknown;
}

/**
 * Reads one published landing page.
 *
 * Wrapped in React's `cache` because generateMetadata and the page component
 * both need the row, and the region route calls this on every request that
 * reaches it — one query per request rather than two.
 *
 * Returns null on any failure. A landing page that cannot be read has to fall
 * through to the region route's own 404 rather than 500 the request, and an
 * unpublished row is simply not a page yet.
 */
export const getLandingPage = cache(async (slug: string): Promise<LandingPage | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  if (!SLUG_RE.test(slug)) return null;
  try {
    const supabase = createAdminClient();
    // Any of the eight slug columns, in one query rather than a scan of the
    // table: a page has to answer on the address it was linked from, whichever
    // language that address belongs to, so the request can then be 301'd onto
    // this locale's own slug. The API refuses a slug already used by another
    // page in any language, so at most one row can match.
    const columns = ["slug", ...locales.map((l) => `slug_${l}`)];
    const { data, error } = await supabase
      .from("landing_pages")
      .select("*")
      .or(columns.map((c) => `${c}.eq.${slug}`).join(","))
      .eq("is_published", true)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error(`[landing] landing_pages okunamadı (slug=${slug}): ${error.message}`);
      return null;
    }
    return (data as LandingPage | null) ?? null;
  } catch (err) {
    console.error("[landing] landing_pages okunamadı:", err);
    return null;
  }
});

/**
 * The URL this page belongs on in `locale`, and whether the request arrived on
 * it. A request on any other slug the page answers to is 301'd onto this one
 * by the route, so an old or another language's address keeps working.
 */
export function landingCanonicalSlug(row: LandingPage, locale: string): string {
  return localizedLandingSlug(row, locale);
}

/** Every address this page answers on, in any language. */
export function landingSlugs(row: LandingPage): string[] {
  return allLandingSlugs(row);
}

/** Every locale this page is genuinely translated into. */
export function landingLocales(row: Record<string, unknown>): Locale[] {
  return locales.filter((l) => landingHasLocale(row, l));
}

/**
 * The locale whose copy is actually rendered for `locale`: itself when
 * translated, otherwise English, otherwise Turkish, otherwise whichever
 * language has anything at all.
 */
export function landingCopyLocale(row: Record<string, unknown>, locale: string): Locale {
  if (landingHasLocale(row, locale)) return locale as Locale;
  const available = landingLocales(row);
  if (available.includes("en")) return "en";
  if (available.includes("tr")) return "tr";
  return available[0] ?? "en";
}

export interface LandingCopy {
  h1: string;
  intro: string;
  content: string;
  /** The locale the strings above were actually taken from. */
  copyLocale: Locale;
  /** False when `copyLocale` is not the requested locale. */
  translated: boolean;
}

/** The on-page copy for a locale, with the fallback chain already applied. */
export function landingCopy(row: Record<string, unknown>, locale: string): LandingCopy {
  const copyLocale = landingCopyLocale(row, locale);
  return {
    h1: columnText(row, `h1_${copyLocale}`) ?? "",
    intro: columnText(row, `intro_${copyLocale}`) ?? "",
    content: columnText(row, `content_${copyLocale}`) ?? "",
    copyLocale,
    translated: landingHasLocale(row, locale),
  };
}

/** Plain text of an HTML fragment, for a description with nothing else to use. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Absolute URL for a stored path, as og:image and JSON-LD both require. */
export function absoluteUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

/**
 * Metadata for a landing page.
 *
 * Built as a fallback plus `applyOverrides` rather than by reading the SEO
 * columns directly, so a landing page obeys exactly the rules every other
 * table already obeys: the brand is never appended twice, an off-site
 * canonical is dropped, og falls back to meta and twitter falls back to og,
 * and the robots directive is only touched when an admin actually set a flag.
 *
 * `rowOwnsMetaText` stays false because — unlike a region, which builds its
 * own title out of the column plus a price — nothing consumes `meta_title_*`
 * before this point. Applying the column *is* the override.
 */
export function landingMetadata(row: LandingPage, locale: string): Metadata {
  const copy = landingCopy(row, locale);
  const path = `/${localizedLandingSlug(row, locale)}`;

  // hreflang lists only the languages that have their own copy, and an
  // untranslated locale is noindex. Same contract as the region pages.
  const translated = landingLocales(row);
  const available: readonly Locale[] = translated.length > 0 ? translated : (["en"] as Locale[]);
  const isTranslated = landingHasLocale(row, locale);

  const title = copy.h1 || row.label;
  const description = copy.intro || stripHtml(copy.content).slice(0, 160);
  const image = absoluteUrl(row.og_image_url ?? row.image_url);

  return applyOverrides(
    {
      title,
      description,
      // Per-locale, because each language can carry its own slug now. The
      // shared-path helper would have pointed every hreflang at this locale's
      // URL, which is a cluster that does not reciprocate -- exactly what
      // Google drops.
      alternates: seoAlternatesPerLocale(
        locale,
        (l) => `/${localizedLandingSlug(row, l)}`,
        available
      ),
      // The copy locale, not the requested one, for the same reason the five
      // hardcoded landing pages pass theirs: when the text on screen is
      // English, og:locale claiming ro_RO would describe a page that does not
      // exist. Only reachable on a locale this page is noindex in.
      openGraph: seoOpenGraph(
        (isTranslated ? locale : copy.copyLocale) as Locale,
        path,
        title,
        description,
        image
      ),
      twitter: seoTwitter(title, description, image),
      robots: isTranslated ? INDEXABLE_ROBOTS : NOINDEX_ROBOTS,
    },
    { row, locale }
  );
}
