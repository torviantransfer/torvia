import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizardClient from "@/components/booking/BookingWizardClient";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Shield, Clock, CreditCard, Plane, MapPin, Star } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking" });

  const titleByLocale: Record<string, string> = {
    tr: "Antalya Havalimanı Özel Transfer Rezervasyonu | Otel Transferi Belek, Side, Alanya, Kemer",
    en: "Private Transfer Antalya Airport | Book Hotel Transfer to Belek, Side, Alanya, Kemer",
    de: "Privater Transfer Flughafen Antalya buchen | Hotel Transfer Belek, Side, Alanya, Kemer",
    pl: "Prywatny Transfer z Lotniska Antalya | Rezerwacja transferu do hotelu Belek, Side, Alanya, Kemer",
    ru: "Частный Трансфер из Аэропорта Анталии | Бронирование трансфера в отель Белек, Сиде, Аланья, Кемер",
    nl: "Privétransfer Luchthaven Antalya Boeken | Hoteltransfer Belek, Side, Alanya, Kemer",
  };
    tr: "Antalya Havalimanı'ndan Belek, Side, Alanya, Kemer ve tüm tatil bölgelerine otel transferi, özel VIP transfer ve sabit fiyatlı kapıdan kapıya hizmet. Uçuş takibi, çocuk koltuğu seçeneği, hızlı onay.",
    en: "Book your Antalya Airport hotel transfer and private VIP transfer to Belek, Side, Alanya, Kemer and all resorts. Fixed-price door-to-door service with flight tracking, child seat options and instant confirmation.",
    de: "Buchen Sie Ihren Flughafen Antalya Hotel Transfer und privaten VIP-Transfer nach Belek, Side, Alanya, Kemer und allen Resorts. Festpreis, Tür-zu-Tür, Flugverfolgung, Kindersitzoption und schnelle Bestätigung.",
    pl: "Zarezerwuj transfer do hotelu z lotniska Antalya oraz prywatny VIP transfer do Belek, Side, Alanya, Kemer i wszystkich kurortów. Stała cena, usługa od drzwi do drzwi, śledzenie lotu i szybka rezerwacja.",
    ru: "Забронируйте трансфер в отель из аэропорта Анталии и частный VIP-трансфер в Белек, Сиде, Аланью, Кемер и другие курорты. Фиксированная цена, услуга «от двери до двери», отслеживание рейса и мгновенное подтверждение.",
    nl: "Boek uw hoteltransfer vanaf de luchthaven Antalya en privé VIP-transfer naar Belek, Side, Alanya, Kemer en alle resorts. Vaste prijs van deur tot deur, vluchtmonitoring, kinderzitjes en directe bevestiging.",
  };

  const title = titleByLocale[locale] ?? `${t("title")} | Private Airport Transfer Antalya`;
  const description = descriptionByLocale[locale] ?? `${t("subtitle")} Book a private VIP transfer from Antalya Airport to Belek, Side, Alanya, Kemer and all resort destinations with fixed prices and instant confirmation.`;
  return {
    title,
    description,
    alternates: seoAlternates(locale, "/booking"),
    openGraph: seoOpenGraph(locale, "/booking", title, description),
  };
}

export default async function BookingPage({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ locale: string }>;
}) {
  const sp = await searchParams;
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking" });

  const hasRegion = !!sp.region;

  const intentKeywords: Record<string, { label: string; href: string }[]> = {
    tr: [
      { label: "Antalya havalimanı otel transferi", href: "/booking" },
      { label: "Belek VIP transfer", href: "/belek-transfer" },
      { label: "Side otel transferi", href: "/side-transfer" },
      { label: "Alanya özel transfer", href: "/alanya-transfer" },
      { label: "Kemer havalimanı transfer", href: "/kemer-transfer" },
      { label: "Sabit fiyatlı transfer", href: "/booking" },
    ],
    en: [
      { label: "Antalya airport hotel transfer", href: "/booking" },
      { label: "VIP transfer to Belek", href: "/belek-transfer" },
      { label: "Private transfer to Side", href: "/side-transfer" },
      { label: "Alanya airport transfer", href: "/alanya-transfer" },
      { label: "Kemer transfer", href: "/kemer-transfer" },
      { label: "Fixed-price transfer", href: "/booking" },
    ],
    de: [
      { label: "Flughafen Antalya Hotel Transfer", href: "/booking" },
      { label: "VIP Transfer Belek", href: "/belek-transfer" },
      { label: "Privattransfer Side", href: "/side-transfer" },
      { label: "Alanya Flughafentransfer", href: "/alanya-transfer" },
      { label: "Kemer Transfer", href: "/kemer-transfer" },
      { label: "Festpreis Transfer", href: "/booking" },
    ],
    pl: [
      { label: "transfer do hotelu z lotniska Antalya", href: "/booking" },
      { label: "VIP transfer do Belek", href: "/belek-transfer" },
      { label: "prywatny transfer do Side", href: "/side-transfer" },
      { label: "transfer do Alanyi", href: "/alanya-transfer" },
      { label: "transfer do Kemer", href: "/kemer-transfer" },
      { label: "transfer ze stałą ceną", href: "/booking" },
    ],
    ru: [
      { label: "трансфер в отель из аэропорта Анталии", href: "/booking" },
      { label: "VIP трансфер в Белек", href: "/belek-transfer" },
      { label: "частный трансфер в Сиде", href: "/side-transfer" },
      { label: "трансфер в Аланью", href: "/alanya-transfer" },
      { label: "трансфер в Кемер", href: "/kemer-transfer" },
      { label: "трансфер с фиксированной ценой", href: "/booking" },
    ],
    nl: [
      { label: "luchthaven Antalya hoteltransfer", href: "/booking" },
      { label: "VIP transfer naar Belek", href: "/belek-transfer" },
      { label: "privétransfer naar Side", href: "/side-transfer" },
      { label: "transfer naar Alanya", href: "/alanya-transfer" },
      { label: "transfer naar Kemer", href: "/kemer-transfer" },
      { label: "vaste prijs transfer", href: "/booking" },
    ],
  };

  const intentLabel: Record<string, string> = {
    tr: "Sık aranan transferler",
    de: "Häufige Suchanfragen",
    pl: "Popularne wyszukiwania transferów",
    ru: "Часто ищут",
    en: "Common transfer searches",
    nl: "Populaire transferzoekopdrachten",
  };

  return (
    <>
      <Header />

      {/* Hero shown only when no region selected */}
      {!hasRegion && (
        <>
          <section className="relative min-h-[420px] sm:min-h-[480px] flex flex-col items-center justify-center pt-16">
            <Image
              src="/images/havaalani-vip-transfer.jpg"
              alt="Antalya Airport VIP Transfer"
              fill
              className="object-cover"
              priority
              quality={80}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-16 sm:pt-20 pb-10">
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                  {t("title")}
                </h1>
                <p className="text-base sm:text-lg text-white/85 max-w-2xl mx-auto drop-shadow">
                  {t("subtitle")}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-white/80 mr-1">
                    {intentLabel[locale] ?? intentLabel.en}
                  </span>
                  {(intentKeywords[locale] ?? intentKeywords.en).map(({ label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] sm:text-xs text-white/90 backdrop-blur transition-colors hover:bg-white/20 hover:border-white/30"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="max-w-5xl mx-auto">
                <BookingWizardClient />
              </div>
            </div>
          </section>
        </>
      )}

      <main className="flex-1" style={{ backgroundColor: "#FFFFFF" }}>
        {/* Structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "TORVIAN VIP Airport Transfer",
          description: t("subtitle"),
          provider: { "@type": "Organization", name: "TORVIAN Transfer", url: "https://torviantransfer.com" },
          areaServed: { "@type": "Place", name: "Antalya, Turkey" },
          serviceType: "Airport Transfer",
        }) }} />

        {/* When region is selected, keep navbar and show wizard directly */}
        {hasRegion && (
          <section className="pt-20 sm:pt-24 pb-6">
            <div className="max-w-6xl mx-auto px-4">
              <h1 className="sr-only">{t("title")}</h1>
              <BookingWizardClient
                initialRegion={sp.region}
                initialTrip={(sp.trip as "one_way" | "round_trip") ?? "one_way"}
                initialDate={sp.date}
                initialTime={sp.time}
                initialReturnDate={sp.returnDate}
                initialReturnTime={sp.returnTime}
                initialFlight={sp.flight}
                initialAdults={sp.adults ? parseInt(sp.adults) : 2}
                initialChildren={sp.children ? parseInt(sp.children) : 0}
                initialLuggage={sp.luggage ? parseInt(sp.luggage) : 2}
              />
            </div>
          </section>
        )}

        {/* SEO Trust Section */}
        <section className="py-16 border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              {t("seoHeading")}
            </h2>
            <p className="text-gray-500 text-center max-w-2xl mx-auto mb-10">
              {t("seoSubheading")}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
              {[
                { icon: <Plane size={20} />, title: t("seoFlightTracking"), desc: t("seoFlightTrackingDesc") },
                { icon: <Shield size={20} />, title: t("seoInsured"), desc: t("seoInsuredDesc") },
                { icon: <CreditCard size={20} />, title: t("seoSecurePayment"), desc: t("seoSecurePaymentDesc") },
                { icon: <Clock size={20} />, title: t("seo247"), desc: t("seo247Desc") },
                { icon: <MapPin size={20} />, title: t("seoDoorToDoor"), desc: t("seoDoorToDoorDesc") },
                { icon: <Star size={20} />, title: t("seoNoHidden"), desc: t("seoNoHiddenDesc") },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5 transition-all"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 mb-3"
                    style={{ backgroundColor: "rgba(0,122,255,0.08)" }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* SEO FAQ mini */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-5 text-center">
                {t("seoFaqTitle")}
              </h3>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <details
                    key={n}
                    className="group rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <summary className="px-5 py-4 text-sm font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between hover:text-blue-600 transition-colors">
                      {t(`seoFaq${n}Q`)}
                      <span className="text-gray-500 group-open:rotate-45 transition-transform text-lg">+</span>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">
                      {t(`seoFaq${n}A`)}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* SEO text block */}
            <div className="mt-14 max-w-3xl mx-auto">
              <p className="text-sm text-gray-500 leading-relaxed text-center">
                {t("seoTextBlock")}
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
