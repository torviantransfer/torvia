import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { Calendar, ArrowRight, BookOpen, Plane } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Locale = "tr" | "en" | "de" | "pl" | "ru";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const title = `${t("heading")} | TORVIAN Transfer`;
  const description = t("subtitle");
  return {
    title,
    description,
    alternates: seoAlternates(locale, "/blog"),
    openGraph: seoOpenGraph(locale, "/blog", title, description),
    twitter: seoTwitter(title, description),
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const loc = locale as Locale;

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative py-24 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #1c1c1e 0%, #111113 100%)",
          }}
        >
          <div className="absolute inset-0">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[100px]"
              style={{ backgroundColor: "rgba(249,115,22,0.15)" }}
            />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-orange-400 uppercase tracking-widest mb-4">
              {t("title")}
            </p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-5 tracking-tight text-white">
              {t("heading")}
            </h1>
            <p className="text-[#86868b] text-lg max-w-xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4">
            {!posts || posts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[#86868b] text-lg">{t("noPosts")}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => {
                  const title =
                    post[`title_${loc}`] || post.title_en || "Untitled";
                  const content =
                    post[`content_${loc}`] || post.content_en || "";
                  const excerpt =
                    content.replace(/<[^>]*>/g, "").slice(0, 160) + "...";

                  return (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        {post.image_url ? (
                          <Image
                            src={post.image_url}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 50%, #1c1c1e 100%)" }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(249,115,22,0.1)" }}>
                              <BookOpen size={20} className="text-orange-400" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        {post.published_at && (
                          <div className="flex items-center gap-2 text-xs text-[#86868b] mb-3">
                            <Calendar size={14} />
                            <time>
                              {new Date(
                                post.published_at
                              ).toLocaleDateString(loc, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </time>
                          </div>
                        )}
                        <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-orange-400 transition-colors line-clamp-2">
                          {title}
                        </h2>
                        <p className="text-[#86868b] text-sm leading-relaxed line-clamp-3 mb-4">
                          {excerpt}
                        </p>
                        <span className="inline-flex items-center gap-2 text-orange-400 text-sm font-medium">
                          {t("readMore")}
                          <ArrowRight
                            size={14}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20" style={{ backgroundColor: "#1d1d1f" }}>
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-orange-400 mb-6" style={{ backgroundColor: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
              <Plane size={14} />
              {locale === "tr" ? "VIP Transfer" : locale === "de" ? "VIP Transfer" : locale === "ru" ? "VIP Трансфер" : "VIP Transfer"}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white mb-4">
              {locale === "tr" ? "Antalya Havalimanı VIP Transfer Rezervasyonu" : locale === "de" ? "VIP Flughafen Transfer Buchen" : locale === "ru" ? "Забронировать VIP Трансфер" : locale === "pl" ? "Zarezerwuj VIP Transfer" : "Book Your VIP Airport Transfer"}
            </h2>
            <p className="text-gray-400 text-base mb-8 max-w-xl mx-auto">
              {locale === "tr" ? "Profesyonel şoförler, lüks araçlar ve sabit fiyat garantisi ile konforlu transfer." : locale === "de" ? "Professionelle Fahrer, Luxusfahrzeuge und Festpreisgarantie." : locale === "ru" ? "Профессиональные водители, роскошные автомобили и гарантия фиксированной цены." : locale === "pl" ? "Profesjonalni kierowcy, luksusowe pojazdy i gwarancja stałej ceny." : "Professional drivers, luxury vehicles and fixed price guarantee."}
            </p>
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-full transition-all hover:brightness-110 hover:scale-105"
              style={{ backgroundColor: "#F97316", color: "#fff" }}
            >
              {locale === "tr" ? "Hemen Rezervasyon Yap" : locale === "de" ? "Jetzt Buchen" : locale === "ru" ? "Забронировать" : locale === "pl" ? "Zarezerwuj Teraz" : "Book Now"}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
