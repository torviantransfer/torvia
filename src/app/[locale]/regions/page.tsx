import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { seoAlternates, seoOpenGraph } from "@/lib/seo";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { MapPin, Clock, ArrowUpRight } from "lucide-react";

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
  const t = await getTranslations({ locale, namespace: "regions" });
  const title = `${t("title")} | VELORA Transfer`;
  const description = t("subtitle");
  return {
    title,
    description,
    alternates: seoAlternates(locale, "/regions"),
    openGraph: seoOpenGraph(locale, "/regions", title, description),
  };
}

export default async function RegionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "regions" });
  const c = await getTranslations({ locale, namespace: "common" });

  const { data: regions } = await supabase
    .from("regions")
    .select("*, pricing(one_way_price, round_trip_price)")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <>
      <Header />
      <main className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t("title"),
          description: t("subtitle"),
          numberOfItems: regions?.length ?? 0,
          itemListElement: (regions ?? []).map((r: Record<string, unknown>, i: number) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://veloratransfer.com/${locale}/${r.slug}-transfer`,
            name: `${(r as Record<string, string>)[`name_${locale}`] || r.name_en} Transfer`,
          })),
        }) }} />
        <section className="relative py-24 overflow-hidden" style={{ background: "linear-gradient(180deg, #1c1c1e 0%, #111113 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(249,115,22,0.15)" }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-orange-400 uppercase tracking-widest mb-4">{t("destinations")}</p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-4 tracking-tight text-white">{t("title")}</h1>
            <p className="text-[#86868b] text-lg max-w-2xl mx-auto">{t("subtitle")}</p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(regions ?? []).map((region: Record<string, unknown>) => {
                const name = (region[`name_${locale}`] ?? region.name_en) as string;
                const slug = region.slug as string;
                const img = regionImages[slug];
                const pricingData = region.pricing as { one_way_price?: number } | null;

                return (
                  <Link
                    key={region.id as string}
                    href={`/${slug}-transfer`}
                    className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {img && (
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={img}
                          alt={`${name} Transfer`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {pricingData?.one_way_price && (
                          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
                            ${pricingData.one_way_price}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(249,115,22,0.1)" }}>
                          <MapPin size={16} className="text-orange-400" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h2 className="font-bold text-white group-hover:text-orange-400 transition-colors">{name}</h2>
                          <p className="text-[11px] text-[#555] font-medium">{t("fromAirport")}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[#86868b]">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-[#555]" />~{region.duration_minutes as number} {c("minutes")}
                        </span>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
                        <span>{region.distance_km as number} {c("km")}</span>
                      </div>
                    </div>
                    <div className="px-5 py-3 text-[13px] font-medium text-[#86868b] flex items-center justify-between transition-colors group-hover:text-orange-400" style={{ backgroundColor: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      {t("bookTransfer")}
                      <ArrowUpRight size={14} className="text-[#555] group-hover:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
