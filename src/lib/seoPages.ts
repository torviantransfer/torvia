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
 * Returns null rather than throwing on any failure. A public page must never
 * 500 because an SEO edit could not be loaded, and the caller's behaviour is
 * the same either way: use the hardcoded values.
 *
 * But "the row is empty" and "the query failed" are not the same fact, and
 * collapsing them was hiding real problems. A missing table, a column the code
 * asks for that a migration never created, a revoked service key — all of them
 * looked exactly like an untouched row, so the site kept serving its fallbacks
 * and nothing anywhere said why. That is how twenty-eight Romanian columns
 * could be absent for months while the admin panel showed seven languages.
 *
 * So the two are separated: an expected miss stays quiet, and an unexpected
 * failure is logged with the page key that triggered it and recorded for
 * `seoReadFailures()` to surface. Neither changes what the visitor gets.
 */
export interface SeoReadFailure {
  pageKey: string;
  message: string;
  at: string;
}

const readFailures = new Map<string, SeoReadFailure>();

/**
 * Unexpected `seo_pages` read failures seen by this server instance.
 *
 * Read by the admin's diagnostics so a schema problem is visible somewhere
 * other than a log nobody opens. Per-instance and in-memory on purpose: this
 * is a health signal, not an audit trail — `seo_audit_log` is the audit trail.
 */
export function seoReadFailures(): SeoReadFailure[] {
  return [...readFailures.values()];
}

function recordFailure(pageKey: string, message: string) {
  readFailures.set(pageKey, { pageKey, message, at: new Date().toISOString() });
  console.error(
    `[seo] seo_pages okunamadı (page_key=${pageKey}): ${message} — sayfa hardcoded değerlerle render edildi.`
  );
}

export const getSeoPage = cache(async (pageKey: string): Promise<SeoPage | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("seo_pages")
      .select("*")
      .eq("page_key", pageKey)
      .maybeSingle();
    if (error) {
      recordFailure(pageKey, error.message);
      return null;
    }
    if (!data) {
      // Expected: the page has no row yet. Nothing to report.
      return null;
    }
    readFailures.delete(pageKey);
    return data as SeoPage;
  } catch (err) {
    recordFailure(pageKey, err instanceof Error ? err.message : String(err));
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
