import { cache } from "react";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyOverrides } from "@/lib/seoOverrides";

const BASE_URL = "https://torviantransfer.com";

/**
 * Admin-editable SEO copy for the pages that are not regions and not blog
 * posts: the homepage, the five landing pages and the static pages.
 *
 * The contract with every caller is "override if present, otherwise leave the
 * page exactly as it was". That is what makes this safe to ship against a
 * site that already ranks: an empty `seo_pages` table produces byte-identical
 * metadata to the hardcoded version, and a ranking only moves when someone
 * deliberately types into the admin.
 */
export interface SeoPage {
  page_key: string;
  route: string;
  image_url: string | null;
  og_image_url: string | null;
  image_alt: string | null;
  noindex: boolean | null;
  [key: string]: unknown;
}

/**
 * Reads one page's row.
 *
 * Wrapped in React's `cache` so generateMetadata and the page component,
 * which both need the row, share one query per request rather than issuing
 * two.
 *
 * Returns null rather than throwing on any failure — a missing table (the
 * migration has not been applied yet), a network blip, or a missing row all
 * mean the same thing to the caller: use the hardcoded values. An SEO edit
 * failing to load must never turn into a 500 on a public page.
 */
export const getSeoPage = cache(async (pageKey: string): Promise<SeoPage | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("seo_pages")
      .select("*")
      .eq("page_key", pageKey)
      .maybeSingle();
    if (error || !data) return null;
    return data as SeoPage;
  } catch {
    return null;
  }
});

/** A trimmed string, or undefined if the column is null/blank. */
function value(page: SeoPage | null, field: string): string | undefined {
  if (!page) return undefined;
  const raw = page[field];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function seoTitle(page: SeoPage | null, locale: string): string | undefined {
  return value(page, `meta_title_${locale}`);
}

export function seoDescription(page: SeoPage | null, locale: string): string | undefined {
  return value(page, `meta_description_${locale}`);
}

export function seoH1(page: SeoPage | null, locale: string): string | undefined {
  return value(page, `h1_${locale}`);
}

export function seoIntro(page: SeoPage | null, locale: string): string | undefined {
  return value(page, `intro_${locale}`);
}

/**
 * Absolute URL of the social preview image, preferring the dedicated og
 * image. Relative paths stored by the admin are resolved against the site
 * origin, because og:image must be absolute or crawlers drop it.
 */
export function seoOgImage(page: SeoPage | null): string | undefined {
  const raw = value(page, "og_image_url") ?? value(page, "image_url");
  if (!raw) return undefined;
  return /^https?:\/\//i.test(raw) ? raw : `${BASE_URL}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

/**
 * Merges the admin's copy over a page's existing metadata.
 *
 * `fallback` is what the page produces today, passed in whole so this
 * function never has to know a page's defaults. Only fields the admin has
 * actually filled in are replaced; og:title and twitter:title follow the meta
 * title unless the page set them to something deliberately different.
 */
export function applySeoPage(
  fallback: Metadata,
  page: SeoPage | null,
  locale: string
): Metadata {
  // The whole rule set now lives in seoOverrides, shared with the region and
  // blog pages so all three cannot drift apart. This wrapper stays because
  // sixteen pages import it by name.
  return applyOverrides(fallback, { row: page, locale });
}
