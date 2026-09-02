import type { Metadata } from "next";
import { INDEXABLE_ROBOTS, NOINDEX_ROBOTS } from "@/lib/seo";

/**
 * Applies a row's SEO overrides onto the metadata a page already produces.
 *
 * Shared by the three tables that back an indexable page — `seo_pages`,
 * `regions` and `blog_posts` — because the rule is the same everywhere and
 * writing it three times is how the three would end up behaving differently.
 *
 * The contract every caller depends on: a NULL or blank column means "leave
 * the page exactly as it was". That is what makes this safe against a site
 * that already ranks. An untouched row produces byte-identical output to the
 * hardcoded version, so nothing moves in Google until someone deliberately
 * types into the admin.
 *
 * The fallback chain for social tags is ordered, not arbitrary:
 *
 *   og:title       -> og_title  -> meta_title -> whatever the page set
 *   og:description -> og_desc   -> meta_desc  -> whatever the page set
 *   og:image       -> og_image  -> image_url  -> whatever the page set
 *   twitter:*      -> twitter_* -> the og value resolved above
 *
 * Twitter falls through to Open Graph rather than to the page title because
 * that is what X itself does when a twitter: tag is absent; making the admin
 * fill both in to get one consistent card would be busywork.
 */

const BASE_URL = "https://torviantransfer.com";

export type SeoRow = Record<string, unknown>;

/** A trimmed string, or undefined when the column is null, absent or blank. */
export function ov(row: SeoRow | null | undefined, field: string): string | undefined {
  if (!row) return undefined;
  const raw = row[field];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Reads a tri-state boolean column: true, false, or "not set". */
export function flag(row: SeoRow | null | undefined, field: string): boolean | undefined {
  if (!row) return undefined;
  const raw = row[field];
  return typeof raw === "boolean" ? raw : undefined;
}

/** Resolves a stored path or URL to an absolute one, as og:image requires. */
export function absolute(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

/**
 * Whether an admin-entered canonical is safe to emit.
 *
 * A canonical is the one field in this panel that can remove a page from
 * Google on its own, so a malformed or off-site value is dropped rather than
 * shipped. The admin UI refuses to save these in the first place; this is the
 * second line, for a value written directly to the database or left over from
 * before a validation rule tightened.
 */
export function safeCanonical(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let url: URL;
  try {
    url = new URL(raw, BASE_URL);
  } catch {
    return undefined;
  }
  if (url.origin !== BASE_URL) return undefined;
  // Trailing slashes create a second URL for the same page, which is exactly
  // what a canonical exists to prevent.
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  url.hash = "";
  return url.toString();
}

export interface RobotsOverride {
  noindex?: boolean;
  nofollow?: boolean;
}

/**
 * Builds the robots directive from the page's own decision plus the admin's.
 *
 * `base` is what the page would emit on its own. Each override is tri-state:
 * undefined leaves that half alone, so an admin can force nofollow without
 * touching whether the page is indexed.
 */
export function resolveRobots(
  base: Metadata["robots"],
  override: RobotsOverride
): Metadata["robots"] {
  if (override.noindex === undefined && override.nofollow === undefined) return base;

  // Read the page's current stance so an override of one half preserves the
  // other. Falling back to index/follow matches the root layout's default.
  const current =
    typeof base === "object" && base !== null && !Array.isArray(base)
      ? (base as { index?: boolean; follow?: boolean })
      : {};
  const index = override.noindex !== undefined ? !override.noindex : current.index !== false;
  const follow = override.nofollow !== undefined ? !override.nofollow : current.follow !== false;

  if (index) {
    return follow
      ? INDEXABLE_ROBOTS
      : { ...INDEXABLE_ROBOTS, follow: false, googleBot: { ...INDEXABLE_ROBOTS.googleBot, follow: false } };
  }
  return follow
    ? NOINDEX_ROBOTS
    : { ...NOINDEX_ROBOTS, follow: false, googleBot: { ...NOINDEX_ROBOTS.googleBot, follow: false } };
}

export interface ApplyOptions {
  /** The row holding the overrides. Null disables everything below. */
  row: SeoRow | null;
  locale: string;
  /**
   * Column holding the page image, which differs by table: `image_url`
   * everywhere, but blog posts also use it as the article's hero.
   */
  imageField?: string;
  /**
   * Set when the caller has already read `meta_title_*` / `meta_description_*`
   * from this row and built its own value from them.
   *
   * Region and blog pages do exactly that, and they do not just copy the
   * column: a region appends the cheapest price to it, so
   * `meta_title_tr` = "… | VIP · 30 Dk. · Sabit Fiyat" becomes
   * "… · Sabit Fiyat · $55'den". Re-applying the raw column here overwrote
   * that with the unprocessed string and stripped the price out of every
   * region title, in every locale, the moment this shipped.
   *
   * `seo_pages` rows are different: those pages never look at their row, so
   * for them applying the column IS the override and this stays false.
   */
  rowOwnsMetaText?: boolean;
}

/**
 * The one entry point pages call. Returns `fallback` untouched when there is
 * no row or nothing is overridden.
 */
export function applyOverrides(fallback: Metadata, options: ApplyOptions): Metadata {
  const { row, locale, imageField = "image_url", rowOwnsMetaText = false } = options;
  if (!row) return fallback;

  const next: Metadata = { ...fallback };

  // Skipped entirely when the caller already consumed these columns; see
  // `rowOwnsMetaText`. `undefined` here also stops them leaking into the
  // Open Graph chain below, which would reintroduce the same loss on og:title.
  const title = rowOwnsMetaText ? undefined : ov(row, `meta_title_${locale}`);
  const description = rowOwnsMetaText ? undefined : ov(row, `meta_description_${locale}`);
  if (title) next.title = title;
  if (description) next.description = description;

  // ---- Canonical --------------------------------------------------------
  const canonical = safeCanonical(ov(row, `canonical_url_${locale}`));
  if (canonical) {
    // Only the canonical is replaced. `languages` -- the hreflang cluster --
    // is left exactly as the page computed it, because a hand-edited
    // canonical is usually a one-page fix and rewriting the whole cluster
    // around it would break the reciprocity Google requires.
    next.alternates = { ...(fallback.alternates ?? {}), canonical };
  }

  // ---- Open Graph -------------------------------------------------------
  const ogTitle = ov(row, `og_title_${locale}`) ?? title;
  const ogDescription = ov(row, `og_description_${locale}`) ?? description;
  const ogImage = absolute(ov(row, "og_image_url") ?? ov(row, imageField));
  const imageAlt = ov(row, "image_alt");

  if (ogTitle || ogDescription || ogImage) {
    const og = { ...(fallback.openGraph ?? {}) } as Record<string, unknown>;
    if (ogTitle) og.title = ogTitle;
    if (ogDescription) og.description = ogDescription;
    if (ogImage) {
      // The alt text the page already set has to survive. Region and blog
      // pages both pass a descriptive alt into seoOpenGraph, and replacing
      // the images array without carrying it over would silently drop it --
      // the same class of regression as an explicit `robots: undefined`:
      // rewriting a whole object to change one part of it.
      const existing = Array.isArray(fallback.openGraph?.images)
        ? (fallback.openGraph.images[0] as { alt?: string } | string | undefined)
        : undefined;
      const inheritedAlt =
        typeof existing === "object" && existing !== null ? existing.alt : undefined;
      const alt = imageAlt ?? inheritedAlt;
      og.images = [{ url: ogImage, width: 1200, height: 630, ...(alt ? { alt } : {}) }];
    }
    next.openGraph = og as Metadata["openGraph"];
  }

  // ---- Twitter ----------------------------------------------------------
  const twTitle = ov(row, `twitter_title_${locale}`) ?? ogTitle;
  const twDescription = ov(row, `twitter_description_${locale}`) ?? ogDescription;
  const twImage = absolute(ov(row, "twitter_image_url")) ?? ogImage;
  const twCard = ov(row, "twitter_card");

  if (twTitle || twDescription || twImage || twCard) {
    const tw = { ...(fallback.twitter ?? {}) } as Record<string, unknown>;
    if (twTitle) tw.title = twTitle;
    if (twDescription) tw.description = twDescription;
    if (twImage) tw.images = [twImage];
    if (twCard) tw.card = twCard;
    next.twitter = tw as Metadata["twitter"];
  }

  // ---- Robots -----------------------------------------------------------
  // Only assigned when the admin has actually set one of the flags. Writing
  // `next.robots = fallback.robots` unconditionally would put an explicit
  // `robots: undefined` on every page that does not declare one -- and Next.js
  // reads that as "unset this field", not "inherit", which is the exact bug
  // that stripped max-image-preview:large from the region and blog pages and
  // cost them their search thumbnails. Leaving the key absent is not the same
  // as setting it to undefined.
  const noindex = flag(row, "noindex");
  const nofollow = flag(row, "nofollow");
  if (noindex !== undefined || nofollow !== undefined) {
    next.robots = resolveRobots(fallback.robots, { noindex, nofollow });
  }

  return next;
}
