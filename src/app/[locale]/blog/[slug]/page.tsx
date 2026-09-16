import { createAdminClient } from "@/lib/supabase/admin";
import type { Metadata } from "next";
import {
  seoAlternatesPerLocale,
  seoOpenGraph,
  normalizeSlug,
  localizedBlogSlug,
  allBlogSlugs,
  INDEXABLE_ROBOTS,
  NOINDEX_ROBOTS,
} from "@/lib/seo";
import { applyOverrides, ov } from "@/lib/seoOverrides";
import { notFound, permanentRedirect } from "next/navigation";
import { sanitizeArticleHtml } from "@/lib/richText";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import BlogStickyBar from "@/components/blog/BlogStickyBar";
import BlogPostView from "@/components/blog/BlogPostView";
import PriceTag from "@/components/PriceTag";
import { outlineArticle } from "@/lib/articleOutline";
import { landingHasLocale, localizedLandingSlug } from "@/lib/landingSlug";
import { readHotels } from "@/lib/regionContent";

import type { Locale } from "@/i18n/config";
const ALL_LOCALES: Locale[] = ["tr", "en", "de", "pl", "ru", "nl", "ro", "ar"];

function normalizeRegionPath(slug: string) {
  return slug.endsWith("-transfer") ? slug : `${slug}-transfer`;
}

const blogCtaRegionFallbacks: Record<string, string> = {
  "antalya-havalimani-alanya-transfer-kac-saat": "alanya",
  "antalya-alanya-transfer-suresi": "alanya",
  "antalya-kemer-transfer-mesafe-sure": "kemer",
  "antalya-side-transfer-mesafe-sure": "side",
  "antalya-belek-transfer-mesafe-sure": "belek",
  "land-of-legends-transfer-rehberi": "belek",
  "antalya-havalimani-side-transfer": "side",
  "antalya-havalimani-belek-transfer": "belek",
  "antalya-havalimani-kemer-transfer": "kemer",
  "antalya-havalimani-kemer-vip-transfer": "kemer",
  "antalya-havalimani-lara-beach-transfer": "kundu-lara",
  "antalya-havalimani-kas-transfer": "kas",
  "alanya-airport-transfer": "alanya",
  "side-antik-kent-transfer": "side",
  "belek-golf-otelleri-transfer": "belek",
  "regnum-the-crown-belek-transfer": "belek",
};

function getCtaRegionSlug(post: Record<string, unknown>): string | null {
  const configuredSlug = (post.primary_region_slug as string | null | undefined)?.trim();
  if (configuredSlug) return configuredSlug;

  const postSlug = normalizeSlug((post.slug as string | null | undefined) ?? "");
  return blogCtaRegionFallbacks[postSlug] ?? null;
}

/**
 * Determine which locales actually have a translated title + content.
 * Used to build hreflang alternates only for translated languages,
 * preventing GSC "duplicate without canonical" reports.
 */
function getTranslatedLocales(post: Record<string, unknown>): Locale[] {
  return ALL_LOCALES.filter((l) => {
    const title = (post[`title_${l}`] as string | null | undefined) ?? "";
    const content = (post[`content_${l}`] as string | null | undefined) ?? "";
    return title.trim().length > 0 && content.trim().length > 0;
  });
}

/**
 * Find a blog post by slug.
 *
 * A post is reachable by its shared `slug` *or* by any per-locale
 * `slug_<locale>`. Old Turkish URLs therefore keep resolving after a post
 * gains localized slugs — the page then 301s them to the locale's own slug
 * instead of 404ing, so existing rankings carry over.
 */
async function findPost(
  supabase: ReturnType<typeof createAdminClient>,
  requestedSlug: string
) {
  const { data: direct } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", requestedSlug)
    .eq("is_published", true)
    .maybeSingle();
  if (direct) return direct;

  // Fallback: scan published posts and match against every known slug
  // (shared + all locale variants), normalized to ASCII.
  const { data: all } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true);
  const wanted = normalizeSlug(requestedSlug);
  return (
    (all ?? []).find((p) =>
      allBlogSlugs(p as Record<string, unknown>).includes(wanted)
    ) ?? null
  );
}

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = createAdminClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("is_published", true);

  // Fetch full post data to check which locales have actual translations
  const { data: fullPosts } = await supabase
    .from("blog_posts")
    .select("slug, title_tr, title_en, title_de, title_pl, title_ru, title_nl, title_ro, title_ar, content_tr, content_en, content_de, content_pl, content_ru, content_nl, content_ro, content_ar, slug_tr, slug_en, slug_de, slug_pl, slug_ru, slug_nl, slug_ro")
    .eq("is_published", true);

  const locales: Locale[] = ALL_LOCALES;
  // Only generate static params for locales that have actual translated content.
  // This prevents empty/duplicate pages (e.g. /en/blog/turkish-slug-post) when
  // no English translation exists — those 404 instead of getting flagged as duplicates.
  return (fullPosts ?? []).flatMap((post) =>
    locales
      .filter((l) => {
        const title = ((post as Record<string, unknown>)[`title_${l}`] as string | null) ?? "";
        const content = ((post as Record<string, unknown>)[`content_${l}`] as string | null) ?? "";
        return title.trim().length > 0 && content.trim().length > 0;
      })
      .map((locale) => ({
        locale,
        slug: localizedBlogSlug(post as Record<string, unknown>, locale),
      }))
  );
}

/**
 * Everything `generateMetadata` does once the post has been loaded.
 *
 * Split out so it can be exercised directly by `npm run verify:seo`. That is
 * not a stylistic preference — the defect this file carried was invisible to a
 * unit test of `applyOverrides`, because `applyOverrides` was behaving exactly
 * as documented. The bug was in what this caller passed it, and only a test of
 * the caller can see that. `generateMetadata` below is now a database read and
 * a call to this function, so a test of this function is a test of the page.
 */
export function blogMetadata(
  post: Record<string, unknown>,
  locale: string
): Metadata {
  const loc = locale as Locale;

  // This locale's own slug — hreflang must point each language at its own URL.
  const canonicalSlug = localizedBlogSlug(post, loc);
  const translatedLocales = getTranslatedLocales(post);
  const isTranslated = translatedLocales.includes(loc);

  // The heading a reader sees on the page. Also the SERP title, but only
  // until someone writes a dedicated one.
  const heading =
    (post[`title_${loc}`] as string | null) || (post.title_en as string | null) || "Blog";
  const rawContent =
    (post[`content_${loc}`] as string | null) || (post.content_en as string | null) || "";
  const rawText = rawContent.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const excerpt =
    (post[`excerpt_${loc}`] as string | null) ||
    (post.excerpt_en as string | null) ||
    rawText.slice(0, 155) + (rawText.length > 155 ? "..." : "");

  // ---- Source of truth --------------------------------------------------
  //
  // `meta_title_*` / `meta_description_*` exist precisely so a post's SERP
  // title can differ from its on-page H1 (migration 058), and the SEO panel
  // has been offering both fields in all seven languages ever since. They
  // reached nothing: this function built its metadata from `title_*` and
  // `excerpt_*` and then passed `rowOwnsMetaText: true`, which is the flag
  // that tells applyOverrides "the caller already consumed those columns".
  // It had not. So the flag disabled the only code path that would have
  // applied them, and every blog meta title typed into the admin — in every
  // locale — was written to the database and never served.
  //
  // Resolving them here, before the flag, is what makes the flag true.
  // `rowOwnsMetaText` stays set because it is still doing its real job:
  // stopping applyOverrides from re-applying the raw column over the value
  // resolved below, which is where the region page lost its price suffix.
  const title = ov(post, `meta_title_${loc}`) ?? heading;
  const description = ov(post, `meta_description_${loc}`) ?? excerpt;

  // Primary locale = first locale that has a translation (usually "tr")
  const primaryLocale = translatedLocales[0] ?? "tr";
  const BASE = "https://torviantransfer.com";
  const image = (post.image_url as string | null) || undefined;

  // Admin overrides last. A post with no SEO columns filled in keeps the
  // title/excerpt behaviour it has today.
  return applyOverrides(
    {
    title,
    description,
    alternates: isTranslated
      ? seoAlternatesPerLocale(
          locale,
          (l) => `/blog/${localizedBlogSlug(post, l)}`,
          translatedLocales
        )
      : {
          // Non-translated page: canonical points to the primary locale to
          // eliminate "duplicate without user-selected canonical" GSC errors.
          canonical: `${BASE}/${primaryLocale}/blog/${localizedBlogSlug(
            post,
            primaryLocale
          )}`,
        },
    robots: isTranslated ? INDEXABLE_ROBOTS : NOINDEX_ROBOTS,
    openGraph: seoOpenGraph(locale, `/blog/${canonicalSlug}`, title, description, image),
    twitter: { card: "summary_large_image" as const, title, description, images: image ? [image] : undefined },
    },
    { row: post, locale: loc, rowOwnsMetaText: true }
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const supabase = createAdminClient();
  const { locale, slug } = await params;

  const post = await findPost(supabase, slug);

  if (!post) return { title: "Not Found", robots: { index: false, follow: false } };

  return blogMetadata(post as Record<string, unknown>, locale);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const supabase = createAdminClient();
  const { locale, slug } = await params;
  const loc = locale as Locale;

  const post = await findPost(supabase, slug);

  if (!post) notFound();

  // 301 anything that is not this locale's own slug — the shared Turkish
  // slug, another locale's slug, or a non-ASCII variant — onto the canonical
  // localized URL. `findPost` already matched the post, so old inbound links
  // and existing Google rankings transfer instead of 404ing.
  const canonicalSlug = localizedBlogSlug(post, loc);
  if (normalizeSlug(slug) !== canonicalSlug) {
    permanentRedirect(`/${locale}/blog/${canonicalSlug}`);
  }

  const title = post[`title_${loc}`] || post.title_en || "Untitled";
  const rawContent = post[`content_${loc}`] || post.content_en || "";
  // The allow-list moved to src/lib/richText.ts when admin-created landing
  // pages started rendering typed HTML too. Two copies of a sanitiser drift,
  // and the half that drifts is the half that stops blocking something.
  const content = sanitizeArticleHtml(rawContent);
  // Headings with ids, the FAQ, and the split point for the inline card.
  const outline = outlineArticle(content);
  // Only an excerpt written in this language. The metadata falls back to
  // English and to the body; a "short answer" box in the wrong language, or
  // repeating the first paragraph, would be worse than no box.
  const ownExcerpt = ((post[`excerpt_${loc}`] as string | null) ?? "").trim() || null;

  // Calculate reading time
  const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  // Related posts.
  //
  // This used to be `order(published_at desc).limit(3)` — the three newest
  // posts, site-wide, on every article. Measured on production 2026-09-07 that
  // gave the two most recent posts 28 inbound links each while the posts that
  // actually earn impressions (the Uber article at 6,341, the taxi comparison
  // at 2,894) had exactly one. Internal links were flowing to whatever was
  // published last rather than to what the reader was reading about, and the
  // block was labelled "related posts" while relating to nothing.
  //
  // It also ignored translation: `rp[title_${loc}] || rp.title_en` put English
  // headlines under a Dutch article and linked to URLs that are noindex in that
  // locale, so link equity was being spent on pages Google was told to ignore.
  const { data: relatedPool } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .neq("slug", slug)
    .order("published_at", { ascending: false });

  const related = (() => {
    const pool = (relatedPool ?? []) as Record<string, unknown>[];
    // Only posts a reader of this language can actually read, and that Google
    // indexes in this language.
    const translated = pool.filter((p) => {
      const t = (p[`title_${loc}`] as string | null) ?? "";
      const c = (p[`content_${loc}`] as string | null) ?? "";
      return t.trim().length > 0 && c.trim().length > 0;
    });
    const thisRegion = getCtaRegionSlug(post);
    const scored = translated.map((p) => {
      const region = getCtaRegionSlug(p);
      // Same destination first — someone reading about the Belek route is far
      // more likely to want another Belek page than the newest article.
      let score = thisRegion && region === thisRegion ? 2 : 0;
      // Then a shared topic word from the shared (Turkish) slug, which is the
      // one identifier every translation of a post has in common.
      const words = new Set(normalizeSlug(String(post.slug ?? "")).split("-").filter((w) => w.length > 3));
      const other = normalizeSlug(String(p.slug ?? "")).split("-");
      if (other.some((w) => w.length > 3 && words.has(w))) score += 1;
      return { p, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.p);
  })();

  // The region this post is actually about. Drives both the live CTA price
  // and the in-article link to that region's sales page — blog posts rank far
  // better than the region pages they cannibalize, so the contextual link
  // back is what passes that authority to the page that takes bookings.
  const ctaRegionSlug = getCtaRegionSlug(post);
  let ctaOneWayPrice: number | null = null;
  let ctaRegion: Record<string, unknown> | null = null;
  let ctaRegionName: string | null = null;
  if (ctaRegionSlug) {
    const { data: regionRow } = await supabase
      .from("regions")
      .select("*")
      .eq("slug", ctaRegionSlug)
      .maybeSingle();
    if (regionRow) {
      ctaRegion = regionRow as Record<string, unknown>;
      ctaRegionName =
        (ctaRegion[`name_${loc}`] as string | null)
        ?? (ctaRegion.name_en as string | null)
        ?? null;
      const { data: priceRow } = await supabase
        .from("pricing")
        .select("one_way_price")
        .eq("region_id", regionRow.id)
        .order("one_way_price", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (priceRow) ctaOneWayPrice = Number(priceRow.one_way_price);
    }
  }

  // A post with no region still gets a price: the cheapest route, which is
  // what "airport transfer from" honestly means.
  let fromPrice = ctaOneWayPrice;
  if (fromPrice === null) {
    const { data: cheapest } = await supabase
      .from("pricing")
      .select("one_way_price, vehicle_categories!inner(is_active)")
      .eq("is_active", true)
      .eq("vehicle_categories.is_active", true)
      .order("one_way_price", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (cheapest?.one_way_price) fromPrice = Number(cheapest.one_way_price);
  }

  // Keyword landing pages created in the panel, linked only in a language
  // they are actually written in — the others are noindex there, and a link
  // to them would spend the article's authority on a page Google ignores.
  const { data: landingRows } = await supabase
    .from("landing_pages")
    .select(`slug, slug_${loc}, h1_${loc}, content_${loc}, label`)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  const landings = ((landingRows ?? []) as Record<string, unknown>[])
    .filter((row) => landingHasLocale(row, loc))
    .map((row) => ({
      name: String(row[`h1_${loc}`] ?? row.label ?? "").trim(),
      href: `/${localizedLandingSlug(row, loc)}`,
    }))
    .filter((l) => l.name);

  const regionHotels = ctaRegion ? readHotels(ctaRegion.hotels) ?? [] : [];

  // Regions to cross-link at the foot of the article.
  //
  // This used to be the same five "popular" regions on every post, which left
  // the smaller region pages (Evrenseki, Kızılağaç, Kargıcak…) with virtually
  // no internal links — they draw almost no impressions as a result. Including
  // the post's own region guarantees every region page that has an article
  // pointing at it receives a link from that article.
  const crossLinkQuery = supabase
    .from("regions")
    .select("slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro, name_ar, duration_minutes, distance_km")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(6);

  const { data: popularRegions } = await (ctaRegionSlug
    ? crossLinkQuery.or(`is_popular.eq.true,slug.eq.${ctaRegionSlug}`)
    : crossLinkQuery.eq("is_popular", true));

  const BASE = "https://torviantransfer.com";

  const blogPostSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description:
      ownExcerpt ??
      content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200).replace(/\s+\S*$/, ""),
    // Google resolves schema image URLs as absolute only; the column holds a
    // site-relative path.
    ...(post.image_url
      ? { image: String(post.image_url).startsWith("/") ? `${BASE}${post.image_url}` : post.image_url }
      : {}),
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: {
      "@type": "Organization",
      name: "TORVIAN Transfer",
      url: BASE,
    },
    publisher: {
      "@type": "Organization",
      name: "TORVIAN Transfer",
      logo: { "@type": "ImageObject", url: `${BASE}/images/logo.png` },
    },
    mainEntityOfPage: `${BASE}/${locale}/blog/${canonicalSlug}`,
    wordCount: wordCount,
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TORVIAN Transfer", item: `${BASE}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/${locale}/blog` },
      { "@type": "ListItem", position: 3, name: title, item: `${BASE}/${locale}/blog/${canonicalSlug}` },
    ],
  };

  // FAQPage schema — from the same pairs the accordion renders (lib/articleOutline).
  const faqItems = outline.faq.length > 0 ? outline.faq : null;

  const faqSchema = faqItems ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Header />
      <main>
        <BlogPostView
          locale={locale}
          title={title}
          excerpt={ownExcerpt}
          coverImage={(post.image_url as string | null) ?? null}
          coverAlt={((post.image_alt as string | null) ?? "").trim() || title}
          publishedAt={(post.published_at as string | null) ?? null}
          updatedAt={(post.updated_at as string | null) ?? null}
          readingTime={readingTime}
          outline={outline}
          region={
            ctaRegionName && ctaRegionSlug
              ? { name: ctaRegionName, href: `/${normalizeRegionPath(ctaRegionSlug)}` }
              : null
          }
          price={fromPrice ? <PriceTag amount={fromPrice} showLabel={false} /> : null}
          bookHref={ctaRegionSlug ? `/booking?region=${ctaRegionSlug}` : "/booking"}
          related={(related ?? []).map((rp) => {
            const rpExcerpt =
              ((rp[`excerpt_${loc}`] as string | null) ?? "").trim() ||
              String(rp[`content_${loc}`] ?? "")
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 140)
                .replace(/\s+\S*$/, "…");
            return {
              title: String(rp[`title_${loc}`] ?? ""),
              href: `/blog/${localizedBlogSlug(rp, loc)}`,
              image: (rp.image_url as string | null) ?? null,
              excerpt: rpExcerpt,
            };
          })}
          landings={landings}
          hotels={regionHotels}
          regions={(popularRegions ?? []).map((r) => ({
            name: (r[`name_${loc}`] as string | null) || (r.name_en as string),
            href: `/${normalizeRegionPath(r.slug as string)}`,
            durationMinutes: (r.duration_minutes as number | null) ?? null,
          }))}
        />
      </main>
      <Footer />
      <WhatsAppButton aboveStickyBar />
      <BlogStickyBar regionSlug={ctaRegionSlug} price={fromPrice} />
    </>
  );
}
