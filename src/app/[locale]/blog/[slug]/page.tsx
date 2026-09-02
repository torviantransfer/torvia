import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
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
import { applyOverrides } from "@/lib/seoOverrides";
import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import sanitizeHtml from "sanitize-html";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import BlogStickyBar from "@/components/blog/BlogStickyBar";
import { Link } from "@/i18n/routing";
import { Calendar, ArrowLeft, ArrowRight, MapPin, Clock } from "lucide-react";

type Locale = "tr" | "en" | "de" | "pl" | "ru" | "nl";
const ALL_LOCALES: Locale[] = ["tr", "en", "de", "pl", "ru", "nl"];

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
    .select("slug, title_tr, title_en, title_de, title_pl, title_ru, title_nl, content_tr, content_en, content_de, content_pl, content_ru, content_nl, slug_tr, slug_en, slug_de, slug_pl, slug_ru, slug_nl")
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const supabase = createAdminClient();
  const { locale, slug } = await params;
  const loc = locale as Locale;

  const post = await findPost(supabase, slug);

  if (!post) return { title: "Not Found", robots: { index: false, follow: false } };

  // This locale's own slug — hreflang must point each language at its own URL.
  const canonicalSlug = localizedBlogSlug(post, loc);
  const translatedLocales = getTranslatedLocales(post);
  const isTranslated = translatedLocales.includes(loc);

  const title = post[`title_${loc}`] || post.title_en || "Blog";
  const rawContent = post[`content_${loc}`] || post.content_en || "";
  const rawText = rawContent.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const description = post[`excerpt_${loc}`] || post.excerpt_en || rawText.slice(0, 155) + (rawText.length > 155 ? "..." : "");

  // Primary locale = first locale that has a translation (usually "tr")
  const primaryLocale = translatedLocales[0] ?? "tr";
  const BASE = "https://torviantransfer.com";

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
    openGraph: seoOpenGraph(locale, `/blog/${canonicalSlug}`, title, description, post.image_url || undefined),
    twitter: { card: "summary_large_image" as const, title, description, images: post.image_url ? [post.image_url] : undefined },
    },
    { row: post as Record<string, unknown>, locale: loc, rowOwnsMetaText: true }
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const supabase = createAdminClient();
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "blog" });

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
  const content = sanitizeHtml(rawContent, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "iframe", "video", "source"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height", "loading", "class"],
      iframe: ["src", "width", "height", "frameborder", "allowfullscreen"],
      video: ["src", "controls", "width", "height"],
      source: ["src", "type"],
      "*": ["class", "id", "style"],
    },
    allowedIframeHostnames: ["www.youtube.com", "www.google.com"],
  });

  // Calculate reading time
  const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  // Related posts
  const { data: related } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .neq("slug", slug)
    .order("published_at", { ascending: false })
    .limit(3);

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
      .select("id, slug, duration_minutes, distance_km, name_tr, name_en, name_de, name_pl, name_ru, name_nl")
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

  // Regions to cross-link at the foot of the article.
  //
  // This used to be the same five "popular" regions on every post, which left
  // the smaller region pages (Evrenseki, Kızılağaç, Kargıcak…) with virtually
  // no internal links — they draw almost no impressions as a result. Including
  // the post's own region guarantees every region page that has an article
  // pointing at it receives a link from that article.
  const crossLinkQuery = supabase
    .from("regions")
    .select("slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, duration_minutes, distance_km")
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
    description: content.replace(/<[^>]*>/g, "").slice(0, 160),
    ...(post.image_url ? { image: post.image_url } : {}),
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

  // FAQPage schema — extract Q&A pairs from the HTML content
  const faqItems = (() => {
    // Find FAQ heading in any language
    const faqPattern = /sık sorulan|frequently asked|häufig gestellt|często zadawane|часто задаваемые|veelgestelde vragen/i;
    const faqMatch = faqPattern.exec(content);
    if (!faqMatch || faqMatch.index === undefined) return null;
    // Grab everything after the FAQ section heading's closing tag
    const afterFaq = content.slice(content.indexOf("</h2>", faqMatch.index) + 5);
    const pairs: { question: string; answer: string }[] = [];
    const re = /<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = re.exec(afterFaq)) !== null) {
      const q = m[1].replace(/<[^>]*>/g, "").trim();
      const a = m[2].replace(/<[^>]*>/g, "").trim();
      if (q && a) pairs.push({ question: q, answer: a });
    }
    return pairs.length > 0 ? pairs : null;
  })();

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
        <section
          className="relative pt-24 pb-9 lg:pt-28 lg:pb-12 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)",
          }}
        >
          <div className="absolute inset-0">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]"
              style={{ backgroundColor: "rgba(0,122,255,0.06)" }}
            />
          </div>
          {/* The back link and the meta row were both `inline-flex`, i.e. two
              inline-level boxes with nothing block-level between them. A
              bottom margin on an inline box does not push the next one down,
              so on every width they landed on the same line and the meta pill
              sat on top of "Back to blog". The order is now back link, then a
              block-level h1, then the meta row — and the meta row is a plain
              `flex`, so it can never share a line with anything again. */}
          <div className="relative max-w-3xl mx-auto px-4">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[13px] font-medium text-gray-600 backdrop-blur transition-colors hover:text-blue-600"
              style={{ border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              {t("backToBlog")}
            </Link>

            {/* Which route the article is about, where it has one. Doubles as
                the contextual link to the page that takes the booking — the
                same reasoning as the link under the article body. */}
            {ctaRegionName && ctaRegionSlug && (
              <Link
                href={`/${normalizeRegionPath(ctaRegionSlug)}`}
                className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-700 transition-colors hover:bg-blue-100"
              >
                <MapPin size={11} />
                {ctaRegionName}
              </Link>
            )}

            <h1 className="mt-4 text-[27px] leading-[1.22] sm:text-4xl lg:text-[42px] lg:leading-[1.15] font-bold tracking-tight text-gray-900 text-balance">
              {title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-gray-500">
              {post.published_at && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} className="text-blue-500 shrink-0" />
                  <time dateTime={new Date(post.published_at).toISOString()}>
                    {new Date(post.published_at).toLocaleDateString(loc, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </span>
              )}
              {post.published_at && (
                <span aria-hidden className="h-1 w-1 rounded-full bg-gray-300" />
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="text-blue-500 shrink-0" />
                {t("readingTime", { minutes: readingTime })}
              </span>
            </div>
          </div>
        </section>

        {/* Featured image.
            The negative `-mt-4` used to tuck this under the hero, which read
            as a misalignment rather than an overlap. Posts without an image
            get nothing here at all, and the hero's gradient already resolves
            into the article, so no placeholder is needed. */}
        {post.image_url && (
          <section className="max-w-4xl mx-auto px-4">
            <div
              className="relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[2/1]"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <Image
                src={post.image_url}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
                priority
              />
            </div>
          </section>
        )}

        {/* Content */}
        <section className="py-12 lg:py-16">
          <div className="max-w-3xl mx-auto px-4">
            <article
              className="
                blog-content
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-12 [&_h1]:mb-4 [&_h1]:tracking-tight
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tight [&_h2]:border-l-2 [&_h2]:border-blue-500 [&_h2]:pl-4
                [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-3
                [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-gray-900 [&_h4]:mt-6 [&_h4]:mb-2
                [&_p]:text-gray-600 [&_p]:leading-[1.85] [&_p]:mb-5
                [&_ul]:my-4 [&_ul]:space-y-2 [&_li]:text-gray-600 [&_li]:leading-relaxed [&_li]:pl-5 [&_li]:relative [&_li]:before:content-[''] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[10px] [&_li]:before:w-1.5 [&_li]:before:h-1.5 [&_li]:before:rounded-full [&_li]:before:bg-blue-500
                [&_ol]:my-4 [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol_li]:marker:text-blue-600 [&_ol_li]:marker:font-semibold
                [&_blockquote]:my-6 [&_blockquote]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-500/40 [&_blockquote]:text-gray-500 [&_blockquote]:italic
                [&_strong]:text-gray-900 [&_b]:text-gray-900
                [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2
                [&_hr]:my-10 [&_hr]:border-gray-200
                [&_table]:w-full [&_table]:my-6 [&_table]:text-sm [&_th]:text-left [&_th]:text-gray-900 [&_th]:pb-3 [&_th]:border-b [&_th]:border-gray-200 [&_td]:text-gray-600 [&_td]:py-2.5 [&_td]:border-b [&_td]:border-gray-200
                [&_img]:rounded-xl [&_img]:my-6
              "
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </section>

        {/* Booking CTA — price pulled live from admin panel "Online Tek ($)" column */}
        {(() => {
          const fromWord = locale === "de" ? "ab" : locale === "pl" ? "od" : locale === "ru" ? "от" : locale === "tr" ? "itibaren" : locale === "nl" ? "vanaf" : "from";
          // one_way_price is stored in USD (see supabase/seed.sql) — labeling it
          // with "€" without conversion overstated the EUR price by ~8% (and was
          // wildly wrong for TRY). Server-rendered here, so show the true currency.
          const priceLabel = ctaOneWayPrice ? ` · ${fromWord} $${Math.round(ctaOneWayPrice)}` : "";
          const badgeLabel =
            locale === "de" ? "Privater VIP-Transfer" :
            locale === "pl" ? "Prywatny Transfer VIP" :
            locale === "ru" ? "Частный VIP-Трансфер" :
            locale === "tr" ? "Özel VIP Transfer" :
            locale === "nl" ? "Privé VIP-transfer" :
            "Private VIP Transfer";
          const bookingHref = ctaRegionSlug ? `/booking?region=${ctaRegionSlug}` : "/booking";
          const heading = ctaRegionName
            ? t("ctaHeadingRegion", { name: ctaRegionName })
            : t("ctaHeadingDefault");
          const sub = ctaRegionName
            ? t("ctaSubRegion", { name: ctaRegionName })
            : t("ctaSubDefault");
          const btnLabel = t("ctaButton");

          // Secondary link to the region's own sales page. Blog posts outrank
          // the region pages they cannibalise (Land of Legends: post at pos
          // 8.4, sales page at 39.2), so this contextual link is what passes
          // that authority to the page that actually takes bookings.
          const detailsLabel = ctaRegionName
            ? t("ctaRegionDetails", { name: ctaRegionName })
            : null;
          return (
            <section className="py-12">
              <div className="max-w-3xl mx-auto px-4">
                <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.05) 0%, rgba(0,122,255,0.05) 100%)", border: "1px solid rgba(0,122,255,0.06)" }}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-blue-600 mb-4" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
                    <ArrowRight size={12} />
                    {badgeLabel}{priceLabel}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">{heading}</h3>
                  <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">{sub}</p>
                  <Link
                    href={bookingHref}
                    className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold rounded-full transition-all hover:brightness-110 hover:scale-105"
                    style={{ backgroundColor: "#F97316", color: "#fff" }}
                  >
                    {btnLabel}
                    <ArrowRight size={14} />
                  </Link>
                  {ctaRegionSlug && detailsLabel && (
                    <div className="mt-4">
                      <Link
                        href={`/${normalizeRegionPath(ctaRegionSlug)}`}
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 underline underline-offset-2 hover:text-blue-700"
                      >
                        <MapPin size={13} />
                        {detailsLabel}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })()}

        {/* Related posts */}
        {related && related.length > 0 && (
          <section className="py-14 border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                {t("relatedPosts")}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {related.map((rp) => {
                  const rpTitle =
                    rp[`title_${loc}`] || rp.title_en || "Untitled";
                  const rpContent = rp[`content_${loc}`] || rp.content_en || "";
                  const rpExcerpt = rpContent.replace(/<[^>]*>/g, "").slice(0, 100);
                  return (
                    <Link
                      key={rp.id}
                      href={`/blog/${localizedBlogSlug(
                        rp as Record<string, unknown>,
                        loc
                      )}`}
                      className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.03)",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        {rp.image_url ? (
                          <Image
                            src={rp.image_url}
                            alt={rpTitle}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 50%, #1c1c1e 100%)" }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
                              <ArrowRight size={20} className="text-blue-600" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                          {rpTitle}
                        </h3>
                        {rpExcerpt && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{rpExcerpt}...</p>
                        )}
                        <span className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium">
                          {t("readMore")}
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Popular Transfers Cross-Link */}
        {popularRegions && popularRegions.length > 0 && (
          <section className="py-16 border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t("popularTransfers")}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {popularRegions.map((r) => {
                  const rName = r[`name_${loc}`] || r.name_en;
                  const regionPath = normalizeRegionPath(r.slug);
                  return (
                    <Link
                      key={r.slug}
                      href={`/${regionPath}`}
                      className="group rounded-xl p-4 text-center transition-all hover:-translate-y-0.5"
                      style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
                    >
                      <div className="w-9 h-9 mx-auto mb-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
                        <MapPin size={14} className="text-blue-600" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{rName}</h3>
                      <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
                        <Clock size={10} /> ~{r.duration_minutes} min
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <WhatsAppButton aboveStickyBar />
      <BlogStickyBar regionSlug={ctaRegionSlug} price={ctaOneWayPrice} />
    </>
  );
}
