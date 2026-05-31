import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { seoAlternates, seoOpenGraph, normalizeSlug, hasNonAsciiSlug } from "@/lib/seo";
import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import sanitizeHtml from "sanitize-html";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { Calendar, ArrowLeft, ArrowRight, MapPin, Clock } from "lucide-react";

type Locale = "tr" | "en" | "de" | "pl" | "ru";
const ALL_LOCALES: Locale[] = ["tr", "en", "de", "pl", "ru"];

function normalizeRegionPath(slug: string) {
  return slug.endsWith("-transfer") ? slug : `${slug}-transfer`;
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
 * Find a blog post by slug. Falls back to a normalized-slug match so
 * that ASCII URLs work even if the DB row stores a Turkish-char slug.
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

  // Fallback: scan published posts and match by normalized slug.
  const { data: all } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true);
  const wanted = normalizeSlug(requestedSlug);
  return (all ?? []).find((p) => normalizeSlug(p.slug as string) === wanted) ?? null;
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
    .select("slug, title_tr, title_en, title_de, title_pl, title_ru, content_tr, content_en, content_de, content_pl, content_ru")
    .eq("is_published", true);

  const locales: Locale[] = ["tr", "en", "de", "pl", "ru"];
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
      .map((locale) => ({ locale, slug: normalizeSlug(post.slug as string) }))
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

  const canonicalSlug = normalizeSlug(post.slug as string);
  const translatedLocales = getTranslatedLocales(post);
  const isTranslated = translatedLocales.includes(loc);

  const title = post[`title_${loc}`] || post.title_en || "Blog";
  const rawContent = post[`content_${loc}`] || post.content_en || "";
  const rawText = rawContent.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const description = post[`excerpt_${loc}`] || post.excerpt_en || rawText.slice(0, 155) + (rawText.length > 155 ? "..." : "");

  // Primary locale = first locale that has a translation (usually "tr")
  const primaryLocale = translatedLocales[0] ?? "tr";
  const BASE = "https://torviantransfer.com";

  return {
    title,
    description,
    alternates: isTranslated
      ? seoAlternates(locale, `/blog/${canonicalSlug}`, translatedLocales)
      : {
          // Non-translated page: canonical points to the primary locale to
          // eliminate "duplicate without user-selected canonical" GSC errors.
          canonical: `${BASE}/${primaryLocale}/blog/${canonicalSlug}`,
        },
    robots: isTranslated ? undefined : { index: false, follow: true },
    openGraph: seoOpenGraph(locale, `/blog/${canonicalSlug}`, title, description, post.image_url || undefined),
    twitter: { card: "summary_large_image" as const, title, description, images: post.image_url ? [post.image_url] : undefined },
  };
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

  // 301 redirect non-ASCII URLs to the clean canonical slug.
  const canonicalSlug = normalizeSlug(post.slug as string);
  if (slug !== canonicalSlug && (hasNonAsciiSlug(slug) || slug !== canonicalSlug)) {
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

  // Popular regions for cross-linking
  const { data: popularRegions } = await supabase
    .from("regions")
    .select("slug, name_tr, name_en, name_de, name_pl, name_ru, duration_minutes, distance_km")
    .eq("is_active", true)
    .eq("is_popular", true)
    .order("sort_order", { ascending: true })
    .limit(5);

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
    const faqPattern = /sık sorulan|frequently asked|häufig gestellt|często zadawane|часто задаваемые/i;
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
          className="relative pt-28 pb-16 lg:py-20 overflow-hidden"
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
          <div className="relative max-w-3xl mx-auto px-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-8 text-sm"
            >
              <ArrowLeft size={16} />
              {t("backToBlog")}
            </Link>

            <div className="flex items-center gap-3 text-sm text-gray-500 mb-5">
              {post.published_at && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <time>
                    {new Date(post.published_at).toLocaleDateString(loc, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              )}
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>{readingTime} min</span>
              </div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 leading-snug">
              {title}
            </h1>
          </div>
        </section>

        {/* Featured image */}
        {post.image_url && (
          <section className="max-w-4xl mx-auto px-4 -mt-4">
            <div className="relative rounded-2xl overflow-hidden aspect-[2/1]">
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

        {/* Booking CTA */}
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4">
            <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.05) 0%, rgba(0,122,255,0.05) 100%)", border: "1px solid rgba(0,122,255,0.06)" }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-blue-600 mb-4" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
                <ArrowRight size={12} />
                {locale === "tr" ? "VIP Transfer" : "VIP Transfer"}
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                {locale === "tr" ? "Antalya Havalimanı VIP Transfer" : locale === "de" ? "VIP Flughafen Transfer Buchen" : locale === "ru" ? "Забронировать VIP Трансфер" : locale === "pl" ? "Zarezerwuj VIP Transfer" : "Book Your VIP Airport Transfer"}
              </h3>
              <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
                {locale === "tr" ? "Profesyonel şoför, lüks araç, sabit fiyat. Hemen online rezervasyon yapın." : locale === "de" ? "Professioneller Fahrer, Luxusfahrzeug, Festpreis. Jetzt online buchen." : locale === "ru" ? "Профессиональный водитель, люкс авто, фиксированная цена." : locale === "pl" ? "Profesjonalny kierowca, luksusowy pojazd, stała cena." : "Professional driver, luxury vehicle, fixed price. Book online now."}
              </p>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold rounded-full transition-all hover:brightness-110 hover:scale-105"
                style={{ backgroundColor: "#F97316", color: "#fff" }}
              >
                {locale === "tr" ? "Hemen Rezervasyon Yap" : locale === "de" ? "Jetzt Buchen" : locale === "ru" ? "Забронировать" : locale === "pl" ? "Zarezerwuj Teraz" : "Book Now"}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

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
                      href={`/blog/${rp.slug}`}
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
      <WhatsAppButton />
    </>
  );
}
