import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getSeoPage, applySeoPage, seoH1, seoIntro } from "@/lib/seoPages";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PriceTag from "@/components/PriceTag";
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

import type { Locale } from "@/i18n/config";
import { vehicleIsActive, type VehicleFlag } from "@/lib/vehicleFlag";

function normalizeRegionPath(slug: string) {
  return slug.endsWith("-transfer") ? slug : `${slug}-transfer`;
}

function stripTransferSuffix(regionPath: string) {
  return regionPath.replace(/-transfer$/, "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const supabase = createAdminClient();
  const { locale } = await params;
  // Admin-editable overrides. Null when the row is empty or the
  // table is missing, in which case the values below are used verbatim.
  const seoRow = await getSeoPage("regions");
  const t = await getTranslations({ locale, namespace: "regions" });
  const title = locale === "tr"
    ? "Antalya Havalimanı Transfer Bölgeleri | Belek, Side, Alanya, Kemer"
    : locale === "de"
      ? "Antalya Flughafen Transferziele | Belek, Side, Alanya, Kemer"
      : locale === "pl"
        ? "Transfery z lotniska Antalya | Belek, Side, Alanya, Kemer"
        : locale === "ru"
          ? "Трансферы из аэропорта Антальи | Белек, Сиде, Аланья, Кемер"
          : locale === "nl"
            ? "Antalya Luchthaven Transferbestemmingen | Belek, Side, Alanya, Kemer"
            : locale === "ro"
              ? "Destinații transfer Aeroportul Antalya | Belek, Side, Alanya, Kemer"
              : locale === "ar"
                ? "وجهات النقل من مطار أنطاليا | بيليك، سيده، ألانيا، كيمر"
                : "Antalya Airport Transfers | Belek, Side, Alanya, Kemer";
  const description = locale === "tr"
    ? "Antalya Havalimanı'ndan Belek, Side, Alanya, Kemer ve 25+ destinasyona sabit fiyatlı VIP özel transfer rezervasyonu yapın."
    : locale === "de"
      ? "Buchen Sie Ihren VIP-Privattransfer vom Flughafen Antalya nach Belek, Side, Alanya, Kemer und über 25 Zielen."
      : locale === "pl"
        ? "Zarezerwuj prywatny transfer VIP z lotniska Antalya do Belek, Side, Alanya, Kemer i ponad 25 destynacji."
        : locale === "ru"
          ? "Забронируйте VIP-трансфер из аэропорта Антальи в Белек, Сиде, Аланью, Кемер и более 25 направлений."
          : locale === "nl"
            ? "Boek uw privé VIP-transfer van de luchthaven Antalya naar Belek, Side, Alanya, Kemer en meer dan 25 bestemmingen."
            : locale === "ro"
              ? "Rezervă un transfer privat VIP de la Aeroportul Antalya către Belek, Side, Alanya, Kemer și peste 25 de destinații."
              : locale === "ar"
                ? "احجز نقلاً خاصاً VIP من مطار أنطاليا إلى بيليك وسيده وألانيا وكيمر وأكثر من 25 وجهة بسعر ثابت."
                : "Book a private VIP transfer from Antalya Airport to Belek, Side, Alanya, Kemer and 25+ destinations.";
  return applySeoPage({
    title,
    description,
    alternates: seoAlternates(locale, "/regions"),
    openGraph: seoOpenGraph(locale, "/regions", title, description),
    twitter: seoTwitter(title, description),
  }, seoRow, locale);
}

export default async function RegionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const supabase = createAdminClient();
  const { locale } = await params;
  // Admin-editable page copy. Every getter returns undefined when the
  // field is blank, so the existing expression stays the fallback.
  const seoRow = await getSeoPage("regions");
  const t = await getTranslations({ locale, namespace: "regions" });
  const c = await getTranslations({ locale, namespace: "common" });

  const { data: regions } = await supabase
    .from("regions")
    .select("*, pricing(one_way_price, round_trip_price, is_active, vehicle_categories(is_active))")
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
            url: `https://torviantransfer.com/${locale}/${normalizeRegionPath(r.slug as string)}`,
            name: `${(r as Record<string, string>)[`name_${locale}`] || r.name_en} Transfer`,
          })),
        }) }} />
        <section className="relative pb-14 sm:pb-18 pt-24 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(0,122,255,0.06)" }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-[#007AFF] uppercase tracking-widest mb-4">{t("destinations")}</p>
            <h1 className="text-balance hyphens-auto text-[24px] font-bold leading-[1.2] tracking-tight text-gray-900 sm:text-[28px] lg:text-[38px] lg:leading-[1.14] mb-4">{seoH1(seoRow, locale) ?? t("title")}</h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">{seoIntro(seoRow, locale) ?? t("subtitle")}</p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#007AFF] px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0062CC]"
              >
                {locale === "tr" ? "Hemen Rezervasyon Yap" : locale === "de" ? "Jetzt Buchen" : locale === "ru" ? "Забронировать" : locale === "pl" ? "Zarezerwuj Teraz" : locale === "nl" ? "Nu Boeken" : locale === "ro" ? "Rezervă acum" : locale === "ar" ? "احجز الآن" : "Book Now"}
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            {/* SEO Intro */}
            <p className="text-gray-500 text-base leading-relaxed text-center max-w-3xl mx-auto mb-10">
              {t("seoIntro")}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(regions ?? []).map((region: Record<string, unknown>) => {
                const name = (region[`name_${locale}`] ?? region.name_en) as string;
                const slug = region.slug as string;
                const regionPath = normalizeRegionPath(slug);
                const img = regionImages[stripTransferSuffix(regionPath)];
                // An embedded select returns an object while a region has one
                // pricing row and an ARRAY once it has several — one per
                // vehicle. Reading `.one_way_price` off the array yields
                // undefined and the price badge disappears, so normalise to a
                // list and take the cheapest. "Fiyat" here is a starting
                // price; the per-vehicle prices live in the booking flow.
                const pricingRows = (
                  Array.isArray(region.pricing)
                    ? region.pricing
                    : region.pricing
                      ? [region.pricing]
                      : []
                ) as {
                  one_way_price?: number;
                  is_active?: boolean | null;
                  vehicle_categories?: VehicleFlag;
                }[];
                // Only rows anyone can actually book. A price outlives its
                // vehicle being switched off, and a retired vehicle's figure
                // undercuts the real one — which after the move to euro meant
                // advertising a dollar amount with a euro sign on it.
                const lowestOneWay = pricingRows.reduce<number | null>(
                  (min, row) =>
                    typeof row.one_way_price === "number" &&
                    row.is_active !== false &&
                    vehicleIsActive(row.vehicle_categories) &&
                    (min === null || row.one_way_price < min)
                      ? row.one_way_price
                      : min,
                  null
                );

                return (
                  <Link
                    key={region.id as string}
                    href={`/${regionPath}`}
                    className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    {img && (
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={img}
                          alt={`${name} Transfer`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        {lowestOneWay !== null && (
                          <div className="absolute bottom-3 end-3 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-900" style={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", color: "#1d1d1f" }}>
                            <PriceTag amount={lowestOneWay} />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
                          <MapPin size={16} className="text-[#007AFF]" strokeWidth={1.5} />
                        </div>
                        <div>
                          <h2 className="font-bold text-gray-900 group-hover:text-[#007AFF] transition-colors">{name}</h2>
                          <p className="text-[11px] text-gray-500 font-medium">{t("fromAirport")}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-500" />~{region.duration_minutes as number} {c("minutes")}
                        </span>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.1)" }} />
                        <span>{region.distance_km as number} {c("km")}</span>
                      </div>
                    </div>
                    <div className="px-5 py-3 text-[13px] font-medium text-gray-500 flex items-center justify-between transition-colors group-hover:text-[#007AFF]" style={{ backgroundColor: "#F9FAFB", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                      {t("bookTransfer")}
                      <ArrowUpRight size={14} className="text-gray-500 group-hover:text-[#007AFF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
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
