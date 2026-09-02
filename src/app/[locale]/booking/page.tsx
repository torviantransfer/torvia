import type { Metadata } from "next";
import { getSeoPage, applySeoPage } from "@/lib/seoPages";
import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizardClient from "@/components/booking/BookingWizardClient";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Shield, Clock, CreditCard, Plane, MapPin, Star } from "lucide-react";

/**
 * Which `seoFaqNQ`/`seoFaqNA` pairs to render and to mark up.
 *
 * One list drives both the visible accordion and the FAQPage JSON-LD. They
 * must not drift: marking up an answer the page does not show is a structured
 * data violation, and showing one that is not marked up wastes it.
 */
const SEO_FAQ_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** The `guideNTitle` / `guideNBody` pairs rendered in the guide section. */
const GUIDE_SECTIONS = [1, 2, 3, 4] as const;

/**
 * Destinations linked from the guide, as slug -> label.
 *
 * Every one is an active region with its own page, so these are real internal
 * links from the page that takes the booking to the pages that sell the
 * routes. The labels are the place names themselves, which are proper nouns
 * and read the same in all six locales.
 */
const GUIDE_DESTINATIONS: [slug: string, label: string][] = [
  ["belek", "Belek"],
  ["side", "Side"],
  ["alanya", "Alanya"],
  ["kemer", "Kemer"],
  ["kundu-lara", "Kundu & Lara"],
  ["kadriye", "Kadriye"],
  ["bogazkent", "Boğazkent"],
  ["evrenseki", "Evrenseki"],
  ["tekirova", "Tekirova"],
  ["kas", "Kaş"],
  ["kalkan", "Kalkan"],
  ["fethiye", "Fethiye"],
];

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

  const descriptionByLocale: Record<string, string> = {
    tr: "Antalya Havalimanı'ndan Belek, Side, Alanya, Kemer ve tüm tatil bölgelerine otel transferi, özel VIP transfer ve sabit fiyatlı kapıdan kapıya hizmet. Uçuş takibi, çocuk koltuğu seçeneği, hızlı onay.",
    en: "Book your Antalya Airport hotel transfer and private VIP transfer to Belek, Side, Alanya, Kemer and all resorts. Fixed-price door-to-door service with flight tracking, child seat options and instant confirmation.",
    de: "Buchen Sie Ihren Flughafen Antalya Hotel Transfer und privaten VIP-Transfer nach Belek, Side, Alanya, Kemer und allen Resorts. Festpreis, Tür-zu-Tür, Flugverfolgung, Kindersitzoption und schnelle Bestätigung.",
    pl: "Zarezerwuj transfer do hotelu z lotniska Antalya oraz prywatny VIP transfer do Belek, Side, Alanya, Kemer i wszystkich kurortów. Stała cena, usługa od drzwi do drzwi, śledzenie lotu i szybka rezerwacja.",
    ru: "Забронируйте трансфер в отель из аэропорта Анталии и частный VIP-трансфер в Белек, Сиде, Аланью, Кемер и другие курорты. Фиксированная цена, услуга «от двери до двери», отслеживание рейса и мгновенное подтверждение.",
    nl: "Boek uw hoteltransfer vanaf de luchthaven Antalya en privé VIP-transfer naar Belek, Side, Alanya, Kemer en alle resorts. Vaste prijs van deur tot deur, vluchtmonitoring, kinderzitjes en directe bevestiging.",
  };

  const title = titleByLocale[locale] ?? `${t("title")} | Private Airport Transfer Antalya`;
  const description = descriptionByLocale[locale] ?? `${t("subtitle")} Book a private VIP transfer from Antalya Airport to Belek, Side, Alanya, Kemer and all resort destinations with fixed prices and instant confirmation.`;
  const seoRow = await getSeoPage("booking");
  return applySeoPage(
    {
      title,
      description,
      alternates: seoAlternates(locale, "/booking"),
      openGraph: seoOpenGraph(locale, "/booking", title, description),
    },
    seoRow,
    locale
  );
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

  // The full wizard (step 1 = vehicle selection) has no date picker, so it
  // only renders once we actually have a date. A region without a date
  // (arriving via a region page's "Book Now" CTA) still falls back to the
  // hero + mini form below, just with the destination pre-filled.
  const hasDate = !!sp.region && !!sp.date;

  const intentKeywords: Record<string, { label: string; href: string }[]> = {
    tr: [
      { label: "Antalya havalimanı otel transferi", href: "/antalya-airport-transfer" },
      { label: "Belek VIP transfer", href: "/belek-transfer" },
      { label: "Side otel transferi", href: "/side-transfer" },
      { label: "Alanya özel transfer", href: "/alanya-transfer" },
      { label: "Kemer havalimanı transfer", href: "/kemer-transfer" },
      { label: "Antalya VIP transfer", href: "/vip-transfer-antalya" },
      { label: "Otel transferi (her otel)", href: "/hotel-transfer-antalya" },
      { label: "Sabit fiyatlı transfer", href: "/regions" },
    ],
    en: [
      { label: "Antalya airport hotel transfer", href: "/antalya-airport-transfer" },
      { label: "VIP transfer to Belek", href: "/belek-transfer" },
      { label: "Private transfer to Side", href: "/side-transfer" },
      { label: "Alanya airport transfer", href: "/alanya-transfer" },
      { label: "Kemer transfer", href: "/kemer-transfer" },
      { label: "VIP transfer Antalya", href: "/vip-transfer-antalya" },
      { label: "Hotel transfer (any hotel)", href: "/hotel-transfer-antalya" },
      { label: "Fixed-price transfer", href: "/regions" },
    ],
    de: [
      { label: "Flughafen Antalya Hotel Transfer", href: "/antalya-airport-transfer" },
      { label: "VIP Transfer Belek", href: "/belek-transfer" },
      { label: "Privattransfer Side", href: "/side-transfer" },
      { label: "Alanya Flughafentransfer", href: "/alanya-transfer" },
      { label: "Kemer Transfer", href: "/kemer-transfer" },
      { label: "VIP Transfer Antalya", href: "/vip-transfer-antalya" },
      { label: "Hotel Transfer (jedes Hotel)", href: "/hotel-transfer-antalya" },
      { label: "Festpreis Transfer", href: "/regions" },
    ],
    pl: [
      { label: "transfer do hotelu z lotniska Antalya", href: "/antalya-airport-transfer" },
      { label: "VIP transfer do Belek", href: "/belek-transfer" },
      { label: "prywatny transfer do Side", href: "/side-transfer" },
      { label: "transfer do Alanyi", href: "/alanya-transfer" },
      { label: "transfer do Kemer", href: "/kemer-transfer" },
      { label: "VIP transfer Antalya", href: "/vip-transfer-antalya" },
      { label: "Transfer do hotelu (każdy hotel)", href: "/hotel-transfer-antalya" },
      { label: "transfer ze stałą ceną", href: "/regions" },
    ],
    ru: [
      { label: "трансфер в отель из аэропорта Анталии", href: "/antalya-airport-transfer" },
      { label: "VIP трансфер в Белек", href: "/belek-transfer" },
      { label: "частный трансфер в Сиде", href: "/side-transfer" },
      { label: "трансфер в Аланью", href: "/alanya-transfer" },
      { label: "трансфер в Кемер", href: "/kemer-transfer" },
      { label: "VIP трансфер Анталия", href: "/vip-transfer-antalya" },
      { label: "Трансфер в отель (любой отель)", href: "/hotel-transfer-antalya" },
      { label: "трансфер с фиксированной ценой", href: "/regions" },
    ],
    nl: [
      { label: "luchthaven Antalya hoteltransfer", href: "/antalya-airport-transfer" },
      { label: "VIP transfer naar Belek", href: "/belek-transfer" },
      { label: "privétransfer naar Side", href: "/side-transfer" },
      { label: "transfer naar Alanya", href: "/alanya-transfer" },
      { label: "transfer naar Kemer", href: "/kemer-transfer" },
      { label: "VIP transfer Antalya", href: "/vip-transfer-antalya" },
      { label: "Hoteltransfer (elk hotel)", href: "/hotel-transfer-antalya" },
      { label: "vaste prijs transfer", href: "/regions" },
    ],
  };

  // The hero photo is the page's LCP element. Its alt text used to be English
  // in all six locales, which is dead weight in image search for the ru/de/pl
  // markets the site actually sells into.
  const heroAlt: Record<string, string> = {
    tr: "Antalya Havalimanı VIP transfer aracı",
    en: "Antalya Airport VIP transfer vehicle",
    de: "VIP-Transferfahrzeug am Flughafen Antalya",
    pl: "Pojazd transferu VIP na lotnisku Antalya",
    ru: "Автомобиль VIP-трансфера в аэропорту Анталии",
    nl: "VIP-transfervoertuig op de luchthaven Antalya",
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

      {/* Hero shown until we have both a region and a date */}
      {!hasDate && (
        <>
          <section className="relative min-h-[420px] sm:min-h-[480px] flex flex-col items-center justify-center pt-16">
            <Image
              src="/images/havaalani-vip-transfer.jpg"
              alt={heroAlt[locale] ?? heroAlt.en}
              fill
              className="object-cover"
              priority
              quality={80}
              // `fill` without `sizes` makes Next assume the image is as wide
              // as the viewport at every breakpoint, so phones pull a far
              // larger variant than they can show. This is the LCP element, so
              // that lands directly on Core Web Vitals.
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
            {/* Flex column so phones can put the booking widget above the
                headline and keyword chips without reordering the DOM — the h1
                stays first in the markup for search engines and screen
                readers, only the visual order changes. */}
            <div className="relative z-10 flex flex-col w-full max-w-6xl mx-auto px-4 pt-16 sm:pt-20 pb-10">
              <div className="order-2 lg:order-1 text-center mt-8 lg:mt-0 lg:mb-8">
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
              <div className="order-1 lg:order-2 w-full max-w-5xl mx-auto">
                <BookingWizardClient initialRegion={sp.region} />
              </div>
            </div>
          </section>
        </>
      )}

      <main className="flex-1" style={{ backgroundColor: "#FFFFFF" }}>
        {/* Structured data.

            This used to be a bare `Service` with a one-line `areaServed`.
            Region pages already publish the richer `TaxiService` shape, so the
            page that actually takes the booking was the weakest marked-up page
            on the site. It now names the destinations it serves and the
            languages it is sold in — all facts the page already states in
            prose. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TaxiService",
          name: "TORVIAN VIP Airport Transfer",
          description: t("subtitle"),
          provider: {
            "@type": "Organization",
            name: "TORVIAN Transfer",
            url: "https://torviantransfer.com",
            areaServed: "Antalya, Turkey",
          },
          serviceType: "Airport Transfer",
          availableLanguage: ["tr", "en", "de", "pl", "ru", "nl"],
          areaServed: [
            "Antalya", "Belek", "Side", "Alanya", "Kemer", "Lara", "Kundu",
            "Kadriye", "Manavgat", "Konyaaltı", "Kaş", "Kalkan", "Fethiye",
          ].map((n) => ({ "@type": "Place", name: n })),
        }) }} />

        {/* Breadcrumb — the booking page had none, so Google had no path to
            show above the result. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "TORVIAN Transfer", item: `https://torviantransfer.com/${locale}` },
            { "@type": "ListItem", position: 2, name: t("title"), item: `https://torviantransfer.com/${locale}/booking` },
          ],
        }) }} />

        {/* FAQPage. The questions below were rendered as plain <details> with
            no markup at all, so they could never surface as a rich result.
            Built from the same translation keys the visible accordion uses —
            marking up text Google cannot see in the DOM is a violation, so the
            two must stay in lockstep. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: SEO_FAQ_NUMBERS.map((n) => ({
            "@type": "Question",
            name: t(`seoFaq${n}Q`),
            acceptedAnswer: { "@type": "Answer", text: t(`seoFaq${n}A`) },
          })),
        }) }} />

        {/* When region + date are both known, keep navbar and show wizard directly */}
        {hasDate && (
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

            {/* ── Guide ──
                The page's only prose used to be one ~50-word paragraph at the
                very bottom, which is nothing to rank on for a head term like
                "private transfer antalya airport". This answers the questions
                people actually search around that term — how the transfer
                works, how the price is set, why not a taxi, where we go — and
                sits below the booking widget so it never pushes the form or
                the price down the page.

                Everything asserted here is something the site already
                supports: flight tracking, per-vehicle pricing, a fixed price
                at booking time, a round-trip discount the calculation
                actually applies. No meeting points, no waiting policy, no
                surcharge claims. */}
            <div className="max-w-3xl mx-auto mb-14">
              <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
                {t("guideHeading")}
              </h3>
              <div className="space-y-6">
                {GUIDE_SECTIONS.map((n) => (
                  <article key={n}>
                    <h4 className="text-[15px] font-semibold text-gray-900 mb-1.5">{t(`guide${n}Title`)}</h4>
                    <p className="text-sm text-gray-500 leading-[1.85]">{t(`guide${n}Body`)}</p>
                  </article>
                ))}
              </div>

              <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  {t("guideDestinations")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {GUIDE_DESTINATIONS.map(([slug, label]) => (
                    <Link
                      key={slug}
                      href={`/${slug}-transfer`}
                      className="rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-gray-600 transition-colors hover:border-blue-200 hover:text-blue-600"
                      style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* SEO FAQ mini */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-5 text-center">
                {t("seoFaqTitle")}
              </h3>
              <div className="space-y-3">
                {SEO_FAQ_NUMBERS.map((n) => (
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
