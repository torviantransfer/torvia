import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { seoAlternates, seoOpenGraph } from "@/lib/seo";
import { notFound } from "next/navigation";
import Image from "next/image";
import sanitizeHtml from "sanitize-html";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { Calendar, ArrowLeft, ArrowRight, MapPin, Clock } from "lucide-react";

type Locale = "tr" | "en" | "de" | "pl" | "ru";

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = createAdminClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("is_published", true);

  const locales: Locale[] = ["tr", "en", "de", "pl", "ru"];
  return (posts ?? []).flatMap((post) =>
    locales.map((locale) => ({ locale, slug: post.slug }))
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

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!post) return { title: "Not Found" };

  const title = post[`title_${loc}`] || post.title_en || "Blog";
  const content = post[`content_${loc}`] || post.content_en || "";
  const description = content.replace(/<[^>]*>/g, "").slice(0, 160);

  return {
    title: `${title} | TORVIAN Transfer Blog`,
    description,
    alternates: seoAlternates(locale, `/blog/${slug}`),
    openGraph: seoOpenGraph(locale, `/blog/${slug}`, title, description, post.image_url || undefined),
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

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!post) notFound();

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
      url: "https://torviantransfer.com",
    },
    publisher: {
      "@type": "Organization",
      name: "TORVIAN Transfer",
      logo: { "@type": "ImageObject", url: "https://torviantransfer.com/images/logo.png" },
    },
    mainEntityOfPage: `https://torviantransfer.com/${locale}/blog/${slug}`,
    wordCount: wordCount,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostSchema) }}
      />
      <Header />
      <main>
        <section
          className="relative py-16 lg:py-20 overflow-hidden"
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
                  return (
                    <Link
                      key={r.slug}
                      href={`/${r.slug}-transfer`}
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
