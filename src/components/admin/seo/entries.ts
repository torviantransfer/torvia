import { localizedBlogSlug } from "@/lib/seo";
import { regionImages, ogImageOverrides } from "@/lib/regionImages";

/**
 * One shape for the three tables the panel edits.
 *
 * `seo_pages`, `regions` and `blog_posts` all back an indexable page, and the
 * editor's question — "what does this URL tell Google" — is the same for all
 * three. Where they genuinely differ is which column holds a given concept:
 * a landing page's on-page heading is `h1_tr`, a region's is `h1_tr` too but
 * its body copy is `description_tr` rather than `intro_tr`, and a post has no
 * separate heading at all because `title_tr` is both its H1 and, until
 * `meta_title_tr` is set, its SERP title.
 *
 * `fieldMap` is where that difference lives, so nothing downstream has to
 * branch on the table again.
 */

export type EntryKind = "page" | "region" | "blog";
export type PageType = "home" | "landing" | "static" | "region" | "blog";
export type Table = "seo_pages" | "regions" | "blog_posts";

export interface Entry {
  kind: EntryKind;
  table: Table;
  id: string;
  /** Stable key for messages and dedupe: page_key, region slug or post slug. */
  key: string;
  label: string;
  pageType: PageType;
  /** Path after the locale segment. Locale-dependent for blog posts. */
  routeFor: (locale: string) => string;
  /** False for a deactivated region or an unpublished post. */
  isPublic: boolean;
  /** Whether this page is supposed to be indexed at all. */
  shouldIndex: boolean;
  row: Record<string, unknown>;
  /** Per-locale column names, resolved by `field()`. */
  fieldMap: FieldMap;
  updatedAt: string | null;
}

/**
 * Logical field -> column name template. `{loc}` is substituted with the
 * locale. A null entry means the concept does not exist for that kind.
 */
export interface FieldMap {
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  h1: string | null;
  intro: string | null;
  focusKeyword: string | null;
  keywords: string | null;
  /** Non-locale columns. */
  image: string;
  ogImage: string;
  twitterImage: string;
  twitterCard: string;
  imageAlt: string;
  noindex: string;
  nofollow: string;
}

const SHARED = {
  metaTitle: "meta_title_{loc}",
  metaDescription: "meta_description_{loc}",
  canonical: "canonical_url_{loc}",
  ogTitle: "og_title_{loc}",
  ogDescription: "og_description_{loc}",
  twitterTitle: "twitter_title_{loc}",
  twitterDescription: "twitter_description_{loc}",
  image: "image_url",
  ogImage: "og_image_url",
  twitterImage: "twitter_image_url",
  twitterCard: "twitter_card",
  imageAlt: "image_alt",
  noindex: "noindex",
  nofollow: "nofollow",
} as const;

export const PAGE_FIELDS: FieldMap = {
  ...SHARED,
  h1: "h1_{loc}",
  intro: "intro_{loc}",
  focusKeyword: "focus_keyword_{loc}",
  keywords: "keywords_{loc}",
};

export const REGION_FIELDS: FieldMap = {
  ...SHARED,
  h1: "h1_{loc}",
  // A region's body copy lives in `description_*`, which predates the panel
  // and is also what the region page renders and the sitemap tests for
  // translation completeness.
  intro: "description_{loc}",
  focusKeyword: "focus_keyword_{loc}",
  keywords: "keywords_{loc}",
};

export const BLOG_FIELDS: FieldMap = {
  ...SHARED,
  // A post's H1 is `title_*`. It is edited in the blog editor, not here, so
  // the SEO panel shows it read-only rather than offering a second place to
  // change the same string.
  h1: null,
  intro: "excerpt_{loc}",
  focusKeyword: "focus_keyword_{loc}",
  keywords: "secondary_keywords_{loc}",
};

/** Resolves a logical field to its column name for a locale. */
export function field(map: FieldMap, name: keyof FieldMap, locale: string): string | null {
  const template = map[name];
  if (!template) return null;
  return template.replace("{loc}", locale);
}

export function str(row: Record<string, unknown>, column: string | null): string {
  if (!column) return "";
  const v = row[column];
  return typeof v === "string" ? v : "";
}

/** Convenience: the override value of a logical field. */
export function value(entry: Entry, name: keyof FieldMap, locale: string): string {
  return str(entry.row, field(entry.fieldMap, name, locale));
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function label(row: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return fallback;
}

export function pageEntry(row: Record<string, unknown>): Entry {
  const route = typeof row.route === "string" ? row.route : "";
  const pageType = (typeof row.page_type === "string" ? row.page_type : "static") as PageType;
  return {
    kind: "page",
    table: "seo_pages",
    id: String(row.id),
    key: String(row.page_key ?? ""),
    label: label(row, ["label"], String(row.page_key ?? "")),
    pageType,
    routeFor: () => route,
    isPublic: true,
    // A legal page is public but is not competing for anything; flagging its
    // noindex as an error would be noise. Only the commercial surface is
    // asserted to need indexing.
    shouldIndex: pageType !== "static" || ["regions", "blog", "about", "contact", "faq"].includes(String(row.page_key)),
    row,
    fieldMap: PAGE_FIELDS,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

export function regionEntry(row: Record<string, unknown>): Entry {
  const slug = String(row.slug ?? "");
  const bare = slug.replace(/-transfer$/, "");
  const route = slug.endsWith("-transfer") ? slug : `${slug}-transfer`;
  const isActive = row.is_active !== false;
  return {
    kind: "region",
    table: "regions",
    id: String(row.id),
    key: bare,
    label: label(row, ["name_tr", "name_en"], slug),
    pageType: "region",
    routeFor: () => route,
    isPublic: isActive,
    // An inactive region is not in the sitemap and should not be audited as
    // if a missing index were a fault.
    shouldIndex: isActive,
    row: {
      ...row,
      // The panel's image field should show what the page will actually use,
      // which for an unedited region is still the hardcoded map.
      image_url: row.image_url ?? regionImages[bare] ?? null,
      og_image_url: row.og_image_url ?? ogImageOverrides[bare] ?? null,
    },
    fieldMap: REGION_FIELDS,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

export function blogEntry(row: Record<string, unknown>): Entry {
  const isPublished = row.is_published === true;
  return {
    kind: "blog",
    table: "blog_posts",
    id: String(row.id),
    key: String(row.slug ?? ""),
    label: label(row, ["title_tr", "title_en"], String(row.slug ?? "")),
    pageType: "blog",
    // Posts carry a slug per locale; the route is therefore locale-dependent,
    // which is why `routeFor` is a function rather than a string.
    routeFor: (locale) => `blog/${localizedBlogSlug(row, locale)}`,
    isPublic: isPublished,
    shouldIndex: isPublished,
    row: {
      ...row,
      // A post has no dedicated card image column; `image_url` is both.
      og_image_url: row.og_image_url ?? row.image_url ?? null,
    },
    fieldMap: BLOG_FIELDS,
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : typeof row.published_at === "string"
          ? row.published_at
          : null,
  };
}

/**
 * The locales a row actually has content for.
 *
 * Region and blog pages deliberately noindex a locale they are not translated
 * into, and point its canonical at the primary language. The audit needs to
 * know that so it reports a missing hreflang for an untranslated locale as
 * expected rather than as a defect.
 */
export function translatedLocales(entry: Entry, all: readonly string[]): string[] {
  if (entry.kind === "page") return [...all];
  if (entry.kind === "region") {
    return all.filter((l) => {
      if (l === "tr" || l === "en") return true;
      return (
        str(entry.row, `description_${l}`).trim().length > 0 ||
        str(entry.row, `meta_title_${l}`).trim().length > 0
      );
    });
  }
  return all.filter(
    (l) => str(entry.row, `title_${l}`).trim() && str(entry.row, `content_${l}`).trim()
  );
}
