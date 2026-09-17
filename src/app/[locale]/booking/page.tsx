import type { Metadata } from "next";
import { getSeoPage, applySeoPage } from "@/lib/seoPages";
import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizardClient from "@/components/booking/BookingWizardClient";
import WhatsAppButton from "@/components/WhatsAppButton";
import LandingPriceTable from "@/components/landing/LandingPriceTable";
import SocialProofStrip from "@/components/booking/SocialProofStrip";
import { loadBookingData } from "@/lib/bookingData";
import { readBookingContent } from "@/lib/bookingContent";
import { createAdminClient } from "@/lib/supabase/admin";
import { Link } from "@/i18n/routing";
import { getImageProps } from "next/image";
import { Shield, Clock, CreditCard, Plane, MapPin, Star } from "lucide-react";
import { localeDirection } from "@/i18n/config";

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

/** The `-transfer` form a region page is always served on. */
function regionPath(slug: string) {
  return `/${slug.endsWith("-transfer") ? slug : `${slug}-transfer`}`;
}

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
  const lt = await getTranslations({ locale, namespace: "landing" });

  // The full wizard (step 1 = vehicle selection) has no date picker, so it
  // only renders once we actually have a date. A region without a date
  // (arriving via a region page's "Book Now" CTA) still falls back to the
  // hero + mini form below, just with the destination pre-filled.
  const hasDate = !!sp.region && !!sp.date;

  /* Which way round the transfer runs.
     The search form has always written its pickup into `from`, and this page
     has always ignored it, so a guest in Alanya asking to be taken to the
     airport was booked, vouchered and driven from the airport to Alanya. The
     column and every screen that prints a route have understood direction
     since migration 060; only the booking path was dropping it. */
  const direction: "airport_to_region" | "region_to_airport" =
    sp.from && sp.from !== "antalya-airport" ? "region_to_airport" : "airport_to_region";

  /* Destinations, fares, exchange rates and reviews: lib/bookingData, shared
     with the landing pages so both quote the same bookable fares. */
  const supabase = createAdminClient();
  const { initialRegions, regionPrices, initialRates, reviews } = await loadBookingData(supabase, locale);

  // Trust cards, guide, FAQ and the closing paragraph below are editable from
  // Admin → Booking Sayfası İçeriği (settings row "booking_page_content",
  // migration 105); an empty field falls back to the translation-file text
  // used here, same "auto text with override" contract as region pages.
  const { data: bookingContentRow } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "booking_page_content")
    .maybeSingle();
  const bc = readBookingContent(bookingContentRow?.value, [locale]).locales[locale];
  const pick = (override: string, auto: string) => override.trim() || auto;
  const faqItems = SEO_FAQ_NUMBERS.map((n) => ({
    q: pick(bc.faq[n - 1]?.question ?? "", t(`seoFaq${n}Q`)),
    a: pick(bc.faq[n - 1]?.answer ?? "", t(`seoFaq${n}A`)),
  }));

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
    tr: "Antalya'da deniz kenarındaki otelin önünde bekleyen VIP transfer aracı",
    en: "VIP transfer vehicle waiting outside a seafront hotel in Antalya",
    de: "VIP-Transferfahrzeug vor einem Hotel am Meer in Antalya",
    pl: "Pojazd transferu VIP przed hotelem nad morzem w Antalyi",
    ru: "Автомобиль VIP-трансфера у отеля на побережье Анталии",
    nl: "VIP-transfervoertuig bij een hotel aan zee in Antalya",
  };

  /* Both only matter to the phone hero, where the headline sits beside the
     car. Arabic lays out right-to-left, which moves the headline onto the
     car's side, so the darkening follows the copy and the photograph is
     mirrored to put the car back opposite it. Nothing in the frame reads as
     text, so there is nothing for the flip to spoil. Desktop is untouched by
     either: it keeps the centred headline above a full-bleed photograph. */
  const heroIsRtl = localeDirection(locale) === "rtl";
  const heroScrimTo = heroIsRtl ? "left" : "right";

  /* Two photographs of the same forecourt, picked per width by a <picture>
     so a visitor downloads only the one they will see. The phone band is a
     narrow window, so it gets the close shot, which fills it with the car.
     Desktop gets the wide shot: its car stands higher in the frame, above a
     deep strip of pavement the booking bar can cover without covering the
     car. The switch is at Tailwind's `lg`, where the <img>'s crop classes
     change too.

     Not preloaded. With a different LCP image on each side of the
     breakpoint, a preload fetches the wrong one on half the visits, so the
     <img> asks for high fetch priority instead. `sizes` stays: without it
     Next assumes the image is as wide as the viewport at every breakpoint
     and phones pull a far larger variant than they can show. */
  const heroImage = {
    alt: heroAlt[locale] ?? heroAlt.en,
    fill: true,
    sizes: "100vw",
    quality: 80,
  };
  const {
    props: { srcSet: heroWideSrcSet },
  } = getImageProps({ ...heroImage, src: "/images/antalya-hotel-vip-transfer-hero-wide.jpg" });
  const {
    props: { srcSet: heroCloseSrcSet, ...heroImgProps },
  } = getImageProps({
    ...heroImage,
    src: "/images/antalya-hotel-vip-transfer-hero.jpg",
    loading: "eager",
    fetchPriority: "high",
  });

  /* The headline doubles as the SEO title, so every locale hands it over as
     "<offer> | <promise>". Both widths set the two halves apart — the offer
     in white, the promise in gold on the line below — because the whole
     string in one colour is a block of bold text rather than a headline:
     nothing in it is louder than anything else. Split, never shortened: the
     full string stays inside the h1. */
  const [heroTitleLead, heroTitleTail] = (() => {
    const raw = t("title");
    const at = raw.indexOf("|");
    if (at === -1) return [raw, ""] as const;
    return [raw.slice(0, at).trim(), raw.slice(at + 1).trim()] as const;
  })();

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
          {/* Same backdrop treatment as the home hero: on phones the photo is
              a band across the top that darkens as it falls and then dissolves
              into the white the page below paints, so the booking card lands
              on the boundary with nothing showing a hard edge. Desktop keeps
              the original full-bleed image and its single wash.

              The phone band is deep enough to hold the car clear of both the
              header above it and the booking card below, which at 240px it
              was not — the car was showing as a strip between the two. */}
          <section className="relative bg-white lg:min-h-[480px] flex flex-col items-center justify-center pt-16 lg:pt-16">
            <div className="absolute inset-x-0 top-0 h-[276px] lg:h-[560px] overflow-hidden bg-[#775F5C]">
              {/* The close shot's car sits in the lower half of its frame, and
                  the phone's booking card starts two thirds of the way down
                  the band — hung from the top, the card covered all of the car
                  but its roof. Lifted 56px, the wheels end at 187px, and the
                  h1's minimum height keeps the card from starting above
                  202px, so there is clear ground under the car in every
                  language rather than a card edge running into the tyres.
                  The strip that opens at the bottom lies under the card and
                  the white dissolve, on a ground the colour of the photo's
                  pavement so the gutters beside the card show no seam.
                  Desktop hangs from the top. */}
              <div className="absolute inset-x-0 -top-14 h-full lg:top-0">
                <picture>
                  <source media="(min-width: 64rem)" srcSet={heroWideSrcSet} />
                  <img
                    {...heroImgProps}
                    alt={heroImage.alt}
                    srcSet={heroCloseSrcSet}
                    // A band on a phone is a narrow window on the photograph,
                    // and centred it cuts the back of the car off. Pinning the
                    // crop to the right edge keeps the whole car in frame; the
                    // sky it gives up on the left is the part the headline
                    // covers anyway. From about 490px the band is wider than
                    // the photograph, the crop turns vertical, and centred it
                    // dropped the car behind the card on tablets; anchored to
                    // the bottom it stays above. Desktop's crop is vertical
                    // too: 65% of the way down puts the wide shot's wheels at
                    // 390-414px from 1024px to 1920px, above the booking bar
                    // even under the Arabic title, which raises the bar most.
                    className={`object-cover object-[right_bottom] lg:object-[center_65%] ${heroIsRtl ? "-scale-x-100 lg:scale-x-100" : ""}`}
                  />
                </picture>
              </div>
              {/* Barely there on a phone. It used to carry the headline as
                  well, which meant darkening the whole frame — and the car
                  with it, until the thing the photograph is for looked washed
                  out. The side scrim below carries the headline now, so this
                  is left to do nothing but settle the top edge. */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/5 lg:from-black/50 lg:via-black/40 lg:to-black/70" />
              {/* Phones only, and only across the side the headline sits on.
                  The photograph opens on a lit sunset that white type cannot
                  survive, but darkening the whole frame to fix that also
                  buries the car the picture was chosen for. This runs out
                  before the car, so the headline reads and the subject stays
                  lit. Mirrored for Arabic, where the headline is on the right. */}
              <div
                className="absolute inset-0 lg:hidden"
                // Spent by 42% of the width, which is where the front of the
                // car sits once the crop is pinned right — so the headline
                // gets its dark ground and the car keeps its own light.
                style={{ backgroundImage: `linear-gradient(to ${heroScrimTo}, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.70) 24%, rgba(0,0,0,0.34) 40%, rgba(0,0,0,0.08) 56%, rgba(0,0,0,0) 70%)` }}
              />
              {/* Run long and weighted late, so the extra length softens the
                  landing without hazing the strip of photograph above the
                  card. Same curve as the home hero, onto white. */}
              <div
                className="absolute inset-x-0 bottom-0 h-24 lg:h-44"
                style={{ backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.45) 72%, rgba(255,255,255,0.85) 90%, #FFFFFF 100%)" }}
              />
            </div>
            {/* Flex column so phones can put the booking widget above the
                subtitle and keyword chips without reordering the DOM — the h1
                stays first in the markup for search engines and screen
                readers, only the visual order changes.

                The phone padding is what clears the fixed header and sets the
                headline against the car; the card follows the headline down
                rather than being pushed to a fixed offset of its own — which
                is why the headline is raised by moving its breathing room
                below it (see its mb) rather than by trimming this, and the
                two have to be changed together or the card walks up with it
                and covers the car again. */}
            <div className="relative z-10 flex flex-col w-full max-w-6xl mx-auto px-3 sm:px-4 pt-2 lg:pt-20 pb-10">
              {/* The headline is its own flex child so the phone can lift it
                  out of the block at the bottom and stand it beside the car,
                  in the half of the frame the scrim darkens, while the
                  subtitle and the chips stay where they were — below the card,
                  on white. Capped at 42% of the column so it never reaches the
                  bonnet, which is what decides the type size here: the
                  headline doubles as the SEO title and the Polish and Russian
                  ones are half again as long as the English.

                  Set in Montserrat with both halves at the same size, so the
                  colour alone carries the step from offer to promise. Balanced,
                  so a long title breaks into even lines instead of leaving one
                  word on a line of its own. Desktop stays centred above the card.

                  Below `lg` it never stands shorter than 94px, the height of
                  the Turkish title. The card follows the headline down, so a
                  shorter title — English and German take three lines, Arabic
                  two — lifted the card into the car's wheels. */}
              <h1 className="order-1 lg:order-1 max-w-[42%] lg:max-w-none min-h-[94px] lg:min-h-0 font-display text-[15px] leading-[1.2] sm:text-xl lg:text-5xl lg:leading-[1.08] font-extrabold tracking-tight text-balance text-white lg:text-center mb-9 lg:mb-3 drop-shadow-lg">
                <span className="block">{heroTitleLead}</span>
                {heroTitleTail && (
                  <>
                    {/* Never shown, but left in the markup so the h1 still
                        reads as the whole "<offer> | <promise>" title. */}
                    <span className="hidden"> | </span>
                    {/* The gradient sits on the inner, inline box, which is
                        cloned per line — a promise that wraps is lit top to
                        bottom on every line, not once across the block. */}
                    <span className="mt-1 block lg:mt-1.5">
                      <span className="text-gold-gradient">{heroTitleTail}</span>
                    </span>
                  </>
                )}
              </h1>
              {/* Below the card on phones, so it reads on the white side of
                  the dissolve rather than on the photograph — hence the dark
                  variants, which `lg:` puts straight back to white. */}
              <div className="order-5 lg:order-2 text-center mt-8 lg:mt-0 lg:mb-8">
                <p className="text-[15px] sm:text-lg text-[#4B5563] lg:text-white/85 max-w-2xl mx-auto lg:drop-shadow">
                  {t("subtitle")}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-[#6B7280] lg:text-white/80 me-1">
                    {intentLabel[locale] ?? intentLabel.en}
                  </span>
                  {(intentKeywords[locale] ?? intentKeywords.en).map(({ label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] sm:text-xs text-[#4B5563] transition-colors hover:bg-black/[0.06] lg:border-white/15 lg:bg-white/10 lg:text-white/90 lg:backdrop-blur lg:hover:bg-white/20 lg:hover:border-white/30"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="order-2 lg:order-3 w-full max-w-5xl mx-auto">
                <BookingWizardClient initialRegion={sp.region} initialRegions={initialRegions} />
              </div>
              {/* Immediately under the form, both on a phone and on a desktop.
                  This is where someone decides whether to trust us with a card,
                  and until now the page gave them nothing to decide on. */}
              <div className="order-3 lg:order-4 w-full max-w-5xl mx-auto mt-4 lg:mt-6">
                <SocialProofStrip
                  reviews={reviews}
                  locale={locale}
                />
              </div>
              {/* Directly under the form on a phone, where the thumb already
                  is; on desktop it keeps its place after the headline and the
                  form, below where the photograph ends. */}
              <div className="order-4 lg:order-5 w-full max-w-5xl mx-auto mt-6 lg:mt-10">
                <div className="mb-5">
                  <div className="text-[11.5px] font-bold uppercase leading-snug tracking-[0.1em] text-[#007AFF]">{lt("pricesKicker")}</div>
                  <h2 className="mt-2 text-balance break-words text-[19px] font-extrabold leading-[1.2] tracking-tight text-gray-900 sm:text-[22px]">{lt("pricesTitle")}</h2>
                  <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-gray-500">{lt("pricesSub")}</p>
                </div>
                <LandingPriceTable
                  rows={regionPrices.map((r) => ({
                    slug: r.slug,
                    name: r.name,
                    href: regionPath(r.slug),
                    distanceKm: r.distanceKm,
                    durationMin: r.durationMin,
                    oneWay: r.oneWay,
                    roundTrip: r.roundTrip,
                  }))}
                  initialRates={initialRates}
                />
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
          availableLanguage: ["tr", "en", "de", "pl", "ru", "nl", "ro", "ar"],
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
          mainEntity: faqItems.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
        }) }} />

        {/* When region + date are both known, keep navbar and show wizard directly */}
        {hasDate && (
          <section className="pt-20 sm:pt-24 pb-6">
            <div className="max-w-6xl mx-auto px-4">
              <h1 className="sr-only">{t("title")}</h1>
              {/* Keyed on the trip. Editing it from the route card pushes new
                  search params onto this same page, and without a new key React
                  would keep the mounted wizard — its passenger counts and its
                  vehicle list still belonging to the old search. */}
              <BookingWizardClient
                key={[sp.from, sp.region, sp.trip, sp.date, sp.time, sp.returnDate, sp.returnTime, sp.adults, sp.children].join("|")}
                initialRegions={initialRegions}
                initialRegion={sp.region}
                initialDirection={direction}
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
                { icon: <Plane size={20} />, title: pick(bc.trustCards[0]?.title ?? "", t("seoFlightTracking")), desc: pick(bc.trustCards[0]?.desc ?? "", t("seoFlightTrackingDesc")) },
                { icon: <Shield size={20} />, title: pick(bc.trustCards[1]?.title ?? "", t("seoInsured")), desc: pick(bc.trustCards[1]?.desc ?? "", t("seoInsuredDesc")) },
                { icon: <CreditCard size={20} />, title: pick(bc.trustCards[2]?.title ?? "", t("seoSecurePayment")), desc: pick(bc.trustCards[2]?.desc ?? "", t("seoSecurePaymentDesc")) },
                { icon: <Clock size={20} />, title: pick(bc.trustCards[3]?.title ?? "", t("seo247")), desc: pick(bc.trustCards[3]?.desc ?? "", t("seo247Desc")) },
                { icon: <MapPin size={20} />, title: pick(bc.trustCards[4]?.title ?? "", t("seoDoorToDoor")), desc: pick(bc.trustCards[4]?.desc ?? "", t("seoDoorToDoorDesc")) },
                { icon: <Star size={20} />, title: pick(bc.trustCards[5]?.title ?? "", t("seoNoHidden")), desc: pick(bc.trustCards[5]?.desc ?? "", t("seoNoHiddenDesc")) },
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
                    <h4 className="text-[15px] font-semibold text-gray-900 mb-1.5">
                      {pick(bc.guideSections[n - 1]?.title ?? "", t(`guide${n}Title`))}
                    </h4>
                    <p className="text-sm text-gray-500 leading-[1.85]">
                      {pick(bc.guideSections[n - 1]?.body ?? "", t(`guide${n}Body`))}
                    </p>
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
                {faqItems.map(({ q, a }, i) => (
                  <details
                    key={i}
                    className="group rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <summary className="px-5 py-4 text-sm font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between hover:text-blue-600 transition-colors">
                      {q}
                      <span className="text-gray-500 group-open:rotate-45 transition-transform text-lg">+</span>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">
                      {a}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* SEO text block */}
            <div className="mt-14 max-w-3xl mx-auto">
              <p className="text-sm text-gray-500 leading-relaxed text-center">
                {pick(bc.closingText, t("seoTextBlock"))}
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
