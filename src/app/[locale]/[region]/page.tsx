import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PriceTag from "@/components/PriceTag";
import { Link } from "@/i18n/routing";
import {
  MapPin,
  Clock,
  ArrowRight,
  Shield,
  Star,
  Users,
  Plane,
  CreditCard,
  CheckCircle,
  Zap,
  Navigation,
  CalendarCheck,
} from "lucide-react";

const regionImages: Record<string, string> = {
  belek: "/images/regions/belek-golf.jpg",
  kemer: "/images/regions/kemer-coast.webp",
  "kundu-lara": "/images/regions/kundu-lara.jpg",
  sehirici: "/images/regions/sehirici.jpg",
  alanya: "/images/regions/alanya-castle.jpg",
  side: "/images/regions/side-ancient.jpg",
  kadriye: "/images/regions/kadriye.jpg",
  bogazkent: "/images/regions/bogazkent.jpg",
  evrenseki: "/images/regions/evrenseki.jpg",
  kizilagac: "/images/regions/kizilagac.jpg",
  okurcalar: "/images/regions/okurcalar.jpg",
  turkler: "/images/regions/turkler.jpg",
  mahmutlar: "/images/regions/mahmutlar.jpg",
  kargicak: "/images/regions/kargicak.jpg",
  beldibi: "/images/regions/beldibi.jpg",
  goynuk: "/images/regions/goynuk-canyon.jpg",
  tekirova: "/images/regions/tekirova.jpg",
  camyuva: "/images/regions/camyuva.jpg",
  kiris: "/images/regions/kiris.jpg",
  adrasan: "/images/regions/adrasan.jpg",
  kas: "/images/regions/kas-beach.webp",
  kalkan: "/images/regions/kalkan.jpg",
  fethiye: "/images/regions/fethiye.jpg",
  marmaris: "/images/regions/marmaris.jpg",
};

type Locale = "tr" | "en" | "de" | "pl" | "ru";

export async function generateStaticParams() {
  const supabase = createAdminClient();
  const { data: regions } = await supabase
    .from("regions")
    .select("slug")
    .eq("is_active", true);

  const locales: Locale[] = ["tr", "en", "de", "pl", "ru"];
  const params: { locale: string; region: string }[] = [];

  for (const locale of locales) {
    for (const region of regions ?? []) {
      params.push({ locale, region: `${region.slug}-transfer` });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}): Promise<Metadata> {
  const supabase = createAdminClient();
  const { locale, region: regionParam } = await params;
  const slug = regionParam.replace("-transfer", "");

  const { data: region } = await supabase
    .from("regions")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!region) return {};

  const name = region[`name_${locale}`] || region.name_en;
  const metaTitle =
    region[`meta_title_${locale}`] ||
    `${name} Transfer | TORVIAN Antalya Airport VIP Transfer`;

  const fallbackDesc: Record<string, string> = {
    tr: `Antalya Havalimanı'ndan ${name}'a VIP özel transfer. Sabit fiyat, profesyonel şoförler, 7/24 hizmet. Online rezervasyon.`,
    en: `VIP private transfer from Antalya Airport to ${name}. Fixed price, professional drivers, 24/7 service. Book online.`,
    de: `VIP Privattransfer vom Flughafen Antalya nach ${name}. Festpreis, professionelle Fahrer, 24/7 Service.`,
    pl: `Prywatny transfer VIP z lotniska Antalya do ${name}. Stała cena, profesjonalni kierowcy, serwis 24/7.`,
    ru: `ВИП трансфер из аэропорта Анталья в ${name}. Фиксированная цена, профессиональные водители, круглосуточный сервис.`,
  };
  const metaDesc =
    region[`meta_description_${locale}`] || fallbackDesc[locale] || fallbackDesc.en;

  const regionImg = `https://torviantransfer.com/images/regions/${slug}.jpg`;

  return {
    title: metaTitle,
    description: metaDesc,
    alternates: {
      canonical: `https://torviantransfer.com/${locale}/${slug}-transfer`,
      languages: {
        "x-default": `https://torviantransfer.com/en/${slug}-transfer`,
        tr: `https://torviantransfer.com/tr/${slug}-transfer`,
        en: `https://torviantransfer.com/en/${slug}-transfer`,
        de: `https://torviantransfer.com/de/${slug}-transfer`,
        pl: `https://torviantransfer.com/pl/${slug}-transfer`,
        ru: `https://torviantransfer.com/ru/${slug}-transfer`,
      },
    },
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: `https://torviantransfer.com/${locale}/${slug}-transfer`,
      type: "website",
      siteName: "TORVIAN Transfer",
      images: [{ url: regionImg, width: 1200, height: 630, alt: `${name} Transfer` }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: metaTitle,
      description: metaDesc,
      images: [regionImg],
    },
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}) {
  const supabase = createAdminClient();
  const { locale, region: regionParam } = await params;
  const slug = regionParam.replace("-transfer", "");
  const t = await getTranslations({ locale, namespace: "regionDetail" });
  const bt = await getTranslations({ locale, namespace: "booking" });
  const nt = await getTranslations({ locale, namespace: "nav" });

  const { data: region } = await supabase
    .from("regions")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!region) notFound();

  // Fetch pricing
  const { data: pricing } = await supabase
    .from("pricing")
    .select("one_way_price, round_trip_price")
    .eq("region_id", region.id)
    .single();

  // Fetch reviews for this region
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at, customers(first_name)")
    .eq("is_approved", true)
    .limit(6);

  // Fetch other popular regions for cross-linking
  const { data: otherRegions } = await supabase
    .from("regions")
    .select("slug, name_tr, name_en, name_de, name_pl, name_ru, duration_minutes, distance_km, is_popular")
    .eq("is_active", true)
    .neq("slug", slug)
    .eq("is_popular", true)
    .order("sort_order", { ascending: true })
    .limit(6);

  const name = region[`name_${locale as Locale}`] || region.name_en;
  const description =
    region[`description_${locale as Locale}`] || region.description_en;
  const regionImage = regionImages[slug] || null;

  // Schema.org structured data
  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating as number), 0) / reviews.length).toFixed(1)
    : null;

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `TORVIAN ${name} Transfer`,
    description: t("defaultDesc", { name }),
    provider: {
      "@type": "Organization",
      name: "TORVIAN Transfer",
      url: "https://torviantransfer.com",
    },
    areaServed: {
      "@type": "Place",
      name: name,
    },
    offers: pricing
      ? {
          "@type": "Offer",
          price: pricing.one_way_price,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
        }
      : undefined,
    ...(avgRating && reviews ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount: reviews.length,
        bestRating: 5,
      },
    } : {}),
  };

  const price = pricing?.one_way_price ?? 0;

  return (
    <>
      <Header />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />

        {/* Hero */}
        <section className="relative py-20 overflow-hidden" style={{ background: "linear-gradient(180deg, #1c1c1e 0%, #111113 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(249,115,22,0.15)" }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-[#555] mb-6">
              <Link href="/" className="hover:text-white transition-colors">{t("home")}</Link>
              <span>/</span>
              <Link href="/regions" className="hover:text-white transition-colors">{nt("regions")}</Link>
              <span>/</span>
              <span className="text-white">{name}</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
              <div>
                <h1 className="text-3xl lg:text-5xl font-bold mb-4 lg:mb-5 tracking-tight text-white">
                  {t("airportTo", { name })}
                </h1>
                <p className="text-base lg:text-lg text-[#86868b] mb-6 lg:mb-8 leading-relaxed">
                  {description || t("defaultDesc", { name })}
                </p>

                <div className="flex flex-wrap gap-3 mb-6 lg:mb-8">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Clock size={16} className="text-orange-400" strokeWidth={1.5} />
                    <span className="text-sm text-white">~{region.duration_minutes} {t("min")}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <MapPin size={16} className="text-orange-400" strokeWidth={1.5} />
                    <span className="text-sm text-white">{region.distance_km} km</span>
                  </div>
                </div>

                {/* Pricing Display */}
                {pricing && (
                  <div className="flex flex-wrap gap-4 mb-5">
                    <div className="rounded-xl px-5 py-4" style={{ backgroundColor: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
                      <div className="text-xs text-gray-400 mb-1">{t("fromPrice")}</div>
                      <div className="text-2xl font-bold text-white"><PriceTag amount={pricing.one_way_price} /></div>
                      <div className="text-xs text-gray-500">{t("oneWay")} · {t("perVehicle")}</div>
                    </div>
                  </div>
                )}
                {/* Trust strip */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                    <CheckCircle size={12} className="text-emerald-400" />
                    {t("freeCancellation")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                    <Shield size={12} className="text-orange-400" />
                    {t("securePayTitle")}
                  </span>
                </div>
              </div>

              {/* Region Image */}
              {regionImage && (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Image
                    src={regionImage}
                    alt={t("imageAlt", { name })}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Why Choose + CTA */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">{t("whyChoose")}</h2>
                <div className="space-y-3">
                  {[
                    { icon: Shield, title: t("fixedPriceTitle"), desc: t("fixedPriceDesc") },
                    { icon: Users, title: t("proDriversTitle"), desc: t("proDriversDesc") },
                    { icon: Plane, title: t("flightTrackTitle"), desc: t("flightTrackDesc") },
                    { icon: CreditCard, title: t("securePayTitle"), desc: t("securePayDesc") },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-4 p-5 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(249,115,22,0.1)" }}>
                        <Icon size={18} className="text-orange-400" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
                        <p className="text-[#86868b] text-sm leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book CTA Card */}
              <div className="rounded-2xl p-8" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">
                  {t("bookYourTransfer", { name })}
                </h2>
                <p className="text-[#86868b] mb-8 leading-relaxed">
                  {t("bookDesc")}
                </p>

                <div className="space-y-4 mb-8">
                  {[
                    t("driveFromAirport", { duration: region.duration_minutes }),
                    t("mercedesVito"),
                    t("freeFlightMonitoring"),
                    t("freeCancellation"),
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-sm text-[#86868b]">{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/booking?region=${slug}`}
                  className="w-full py-4 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 hover:brightness-110 shadow-lg"
                  style={{ backgroundColor: '#F97316', boxShadow: '0 8px 25px rgba(249,115,22,0.25)' }}
                >
                  {bt("title")} <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Vehicle Features */}
        <section className="py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">{t("vehicleHeading")}</h2>
            <div className="grid sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { label: t("specPassengers"), icon: Users },
                { label: t("specWifi"), icon: Zap },
                { label: t("specClimate"), icon: Shield },
                { label: t("specLeather"), icon: Star },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-xl p-5 text-center" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(249,115,22,0.1)" }}>
                    <Icon size={18} className="text-orange-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-xs font-medium text-[#86868b]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Region - SEO Content */}
        <section className="py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-5 gap-10">
              <div className="lg:col-span-3">
                <h2 className="text-2xl font-bold text-white mb-5 tracking-tight">{t("aboutRegion", { name })}</h2>
                <p className="text-[#86868b] leading-relaxed mb-6">
                  {t("aboutDescDefault", { name, duration: region.duration_minutes })}
                </p>
                {description && (
                  <p className="text-[#86868b] leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-2xl p-6" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="space-y-4">
                    {[
                      { icon: Navigation, text: t("highlightDistance", { distance: region.distance_km }) },
                      { icon: Clock, text: t("highlightDuration", { duration: region.duration_minutes }) },
                      { icon: CalendarCheck, text: t("highlightAvailable") },
                      { icon: Users, text: t("highlightMeetGreet") },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(249,115,22,0.1)" }}>
                          <Icon size={14} className="text-orange-400" strokeWidth={1.5} />
                        </div>
                        <span className="text-sm text-[#86868b]">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <section className="py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-white mb-8 text-center tracking-tight">{t("customerReviews")}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((review: Record<string, unknown>, i: number) => {
                  const cust = review.customers as Record<string, string> | null;
                  return (
                    <div key={i} className="rounded-xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} size={14} className={j < (review.rating as number) ? "text-amber-400 fill-amber-400" : "text-[#333]"} />
                        ))}
                      </div>
                      {typeof review.comment === "string" && review.comment && (
                        <p className="text-sm text-[#86868b] mb-2">&ldquo;{review.comment}&rdquo;</p>
                      )}
                      <p className="text-xs text-[#555]">{cust?.first_name ?? t("guest")}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-white mb-8 text-center tracking-tight">{t("faqHeading", { name })}</h2>
            <div className="space-y-3">
              {[
                { q: t("faqQ1", { name }), a: t("faqA1", { name, duration: region.duration_minutes, distance: region.distance_km }) },
                { q: t("faqQ2", { name }), a: t("faqA2") },
                { q: t("faqQ3", { name }), a: t("faqA3") },
                { q: t("faqQ4"), a: t("faqA4") },
                { q: t("faqQ5", { name }), a: t("faqA5", { price }) },
                { q: t("faqQ6", { name }), a: t("faqA6") },
                { q: t("faqQ7", { name }), a: t("faqA7") },
                { q: t("faqQ8", { name }), a: t("faqA8") },
              ].map(({ q, a }) => (
                <details key={q} className="rounded-xl overflow-hidden group" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <summary className="px-5 py-4 cursor-pointer font-medium text-white text-sm flex items-center justify-between">
                    {q}
                    <span className="text-[#555] group-open:rotate-180 transition-transform">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-[#86868b]" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>{a}</div>
                </details>
              ))}
            </div>

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
              "@context": "https://schema.org", "@type": "FAQPage",
              mainEntity: [
                { "@type": "Question", name: t("faqQ1", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA1", { name, duration: region.duration_minutes, distance: region.distance_km }) } },
                { "@type": "Question", name: t("faqQ2", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA2") } },
                { "@type": "Question", name: t("faqQ3", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA3") } },
                { "@type": "Question", name: t("faqQ4"), acceptedAnswer: { "@type": "Answer", text: t("faqA4") } },
                { "@type": "Question", name: t("faqQ5", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA5", { price }) } },
                { "@type": "Question", name: t("faqQ6", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA6") } },
                { "@type": "Question", name: t("faqQ7", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA7") } },
                { "@type": "Question", name: t("faqQ8", { name }), acceptedAnswer: { "@type": "Answer", text: t("faqA8") } },
              ],
            }) }} />
          </div>
        </section>

        {/* Other Popular Destinations */}
        {otherRegions && otherRegions.length > 0 && (
          <section className="py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-white mb-8 text-center tracking-tight">{t("otherDestinations")}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherRegions.map((r) => {
                  const rName = r[`name_${locale as Locale}`] || r.name_en;
                  const rImage = regionImages[r.slug];
                  return (
                    <Link
                      key={r.slug}
                      href={`/${r.slug}-transfer`}
                      className="group rounded-xl overflow-hidden transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {rImage && (
                        <div className="relative h-36 overflow-hidden">
                          <Image
                            src={rImage}
                            alt={t("imageAlt", { name: rName })}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-white text-sm mb-2 group-hover:text-orange-400 transition-colors">{rName} Transfer</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Clock size={12} /> ~{r.duration_minutes} {t("min")}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} /> {r.distance_km} km</span>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-orange-400 group-hover:gap-2 transition-all">
                          {t("viewTransfer")} <ArrowRight size={12} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">{t("readyToBook", { name })}</h2>
            <p className="text-[#86868b] mb-8">{t("readyDesc")}</p>
            <Link
              href={`/booking?region=${slug}`}
              className="inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-xl transition-all hover:brightness-110 shadow-lg"
              style={{ backgroundColor: '#F97316', boxShadow: '0 8px 25px rgba(249,115,22,0.25)' }}
            >
              {t("bookNow")} <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
