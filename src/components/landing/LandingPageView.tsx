import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight, BadgeCheck, Check, ChevronDown, List, MapPin, PlaneLanding, ShieldCheck, Star, Users,
  type LucideIcon,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PriceTag from "@/components/PriceTag";
import BookingFormMini from "@/components/booking/BookingFormMini";
import BlogStickyBar from "@/components/blog/BlogStickyBar";
import { ARTICLE_PROSE } from "@/components/blog/BlogPostView";
import LandingPriceTable, { type LandingPriceRow } from "@/components/landing/LandingPriceTable";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeArticleHtml, stripTableStyles, unwrapTableWrappers } from "@/lib/richText";
import { outlineArticle } from "@/lib/articleOutline";
import { loadBookingData } from "@/lib/bookingData";
import { aggregate, authorName, forLocale, markupEligible, MIN_REVIEWS_FOR_SCHEMA } from "@/lib/reviews";
import { landingHasLocale, localizedLandingSlug } from "@/lib/landingSlug";
import { landingCopy, landingLocales, absoluteUrl, stripHtml, type LandingPage } from "@/lib/landingPages";

const BASE_URL = "https://torviantransfer.com";
const LOCALE_NAME: Record<string, string> = {
  tr: "Turkish", en: "English", de: "German", pl: "Polish",
  ru: "Russian", nl: "Dutch", ro: "Romanian", ar: "Arabic",
};
const HAIRLINE = "1px solid rgba(0,0,0,0.06)";
const CTA =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[#007AFF] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0062CC]";

/** The `-transfer` form a region page is always served on. */
function regionPath(slug: string) {
  return `/${slug.endsWith("-transfer") ? slug : `${slug}-transfer`}`;
}

/* The keyword pages that live in code, labelled with footer strings every
   language already has. */
const CODE_LANDINGS = [
  { href: "/antalya-airport-transfer", key: "linkAirportTransfer" },
  { href: "/vip-transfer-antalya", key: "linkVipTransfer" },
  { href: "/hotel-transfer-antalya", key: "linkHotelTransfer" },
  { href: "/lara-beach-transfer", key: "linkLaraBeach" },
] as const;

/**
 * An admin-created landing page — a page built for one search phrase.
 *
 * The visitor has already typed what they want, so the first screen answers
 * the three questions that decide a booking: what does it cost, how do I book,
 * can I trust them. The heading, the price, the rating and the booking form
 * come first; the fares from the pricing table, the steps, the vehicle and the
 * reviews follow; the page's own written copy comes after that, whole and in
 * the HTML, with its FAQ lifted into an accordion and FAQPage markup.
 *
 * Rendered from a `landing_pages` row by src/app/[locale]/[region]/page.tsx.
 * Same visual language as the region and blog pages.
 */
export default async function LandingPageView({ page, locale }: { page: LandingPage; locale: string }) {
  const copy = landingCopy(page, locale);
  const [t, nav, rd, hw, cta, ft, bt] = await Promise.all([
    getTranslations({ locale, namespace: "landing" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "regionDetail" }),
    getTranslations({ locale, namespace: "howItWorks" }),
    getTranslations({ locale, namespace: "cta" }),
    getTranslations({ locale, namespace: "footer" }),
    getTranslations({ locale, namespace: "blog" }),
  ]);

  const supabase = createAdminClient();
  const [booking, { data: landingRows }] = await Promise.all([
    loadBookingData(supabase, locale),
    (supabase
      .from("landing_pages")
      .select(`id, slug, slug_${locale}, h1_${locale}, content_${locale}, label`)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }) as unknown as Promise<{ data: Record<string, unknown>[] | null }>),
  ]);

  const heading = copy.h1 || page.label;
  const content = stripTableStyles(unwrapTableWrappers(sanitizeArticleHtml(copy.content)));
  // The writer's own opening paragraph(s) — everything before their first H2 —
  // read as the page's natural-language SEO intro and are shown above the
  // price table, ahead of the trust badges. The rest of the article (from the
  // first H2 on) is the "deep content" further down; outlineArticle only ever
  // sees that part, so its heading ids, FAQ split and inline booking card are
  // unaffected by where the intro ends.
  const firstH2 = content.search(/<h2/i);
  const leadHtml = firstH2 > 0 ? content.slice(0, firstH2) : "";
  const bodyHtml = firstH2 > 0 ? content.slice(firstH2) : content;
  const outline = outlineArticle(bodyHtml);
  const path = `/${localizedLandingSlug(page, locale)}`;

  // ── The page's destination, and the fares ────────────────────────────
  const featured = booking.regionPrices.find((r) => r.slug === page.cta_region_slug) ?? null;
  const fromPrice = featured?.oneWay ?? (booking.regionPrices.length ? Math.min(...booking.regionPrices.map((r) => r.oneWay)) : null);
  const highPrice = booking.regionPrices.length ? Math.max(...booking.regionPrices.map((r) => r.oneWay)) : null;

  // The page's own destination first, then the popular ones, then the rest in
  // the admin's order — the rows most visitors came for are above the fold.
  const priceRows: LandingPriceRow[] = [
    ...(featured ? [featured] : []),
    ...booking.regionPrices.filter((r) => r !== featured && r.isPopular),
    ...booking.regionPrices.filter((r) => r !== featured && !r.isPopular),
  ].map((r) => ({
    slug: r.slug,
    name: r.name,
    href: regionPath(r.slug),
    distanceKm: r.distanceKm,
    durationMin: r.durationMin,
    oneWay: r.oneWay,
    roundTrip: r.roundTrip,
    featured: r === featured,
  }));

  const bookHref = featured ? `/booking?region=${featured.slug}` : "/booking";

  // ── Reviews ───────────────────────────────────────────────────────────
  const reviews = forLocale(booking.reviews, locale).filter((r) => (r.comment ?? "").trim());
  const rating = aggregate(markupEligible(reviews));
  const showRating = rating.value !== null && rating.count >= MIN_REVIEWS_FOR_SCHEMA;

  // ── Other keyword pages in this language ──────────────────────────────
  const otherLandings = (landingRows ?? [])
    .filter((row) => row.id !== page.id && landingHasLocale(row, locale))
    .map((row) => ({
      name: String(row[`h1_${locale}`] ?? row.label ?? "").trim(),
      href: `/${localizedLandingSlug(row, locale)}`,
    }))
    .filter((l) => l.name);
  const serviceLinks = [...CODE_LANDINGS.map((l) => ({ name: ft(l.key), href: l.href })), ...otherLandings];
  const popularRegions = booking.regionPrices.filter((r) => r.isPopular).slice(0, 8);

  const promises: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: BadgeCheck, title: rd("fixedPriceTitle"), text: rd("fixedPriceDesc") },
    { icon: PlaneLanding, title: rd("flightTrackTitle"), text: rd("flightTrackDesc") },
    { icon: Users, title: rd("proDriversTitle"), text: rd("proDriversDesc") },
    { icon: ShieldCheck, title: rd("securePayTitle"), text: rd("securePayDesc") },
  ];
  const included = [rd("inclHighway"), rd("inclMeet"), rd("inclRoundTrip"), rd("inclChildSeat"), rd("inclPayment")];
  const specs = [rd("specPassengers"), rd("specLeather"), rd("specClimate"), rd("specWifi")];
  const steps = [1, 2, 3].map((n) => ({ title: hw(`step${n}Title`), text: hw(`step${n}Desc`) }));

  // ── Structured data ───────────────────────────────────────────────────
  const description = copy.intro || stripHtml(copy.content).slice(0, 200);
  const image = absoluteUrl(page.image_url ?? page.og_image_url);
  const url = `${BASE_URL}/${locale}${path}`;

  const schemas: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: heading,
      description,
      url,
      inLanguage: locale,
      isPartOf: { "@type": "WebSite", name: "TORVIAN Transfer", url: BASE_URL },
      ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: image } } : {}),
      availableLanguage: landingLocales(page),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "TORVIAN Transfer", item: `${BASE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: heading, item: url },
      ],
    },
    // TaxiService, matching the region pages this page sells into rather
    // than a generic Service — Google already understands that type for
    // every other transfer page the site has, and staying on it here means
    // a search engine reads this page as more of the same business, not a
    // different one that happens to share a domain.
    ...(fromPrice && highPrice
      ? [
          {
            "@context": "https://schema.org",
            "@type": "TaxiService",
            name: heading,
            serviceType: "Airport Transfer",
            description,
            url,
            image,
            areaServed: { "@type": "Place", name: featured ? featured.name : "Antalya" },
            provider: {
              "@type": "Organization",
              name: "TORVIAN Transfer",
              url: BASE_URL,
              telephone: "+90-242-606-07-63",
              logo: `${BASE_URL}/images/logo.png`,
              image: `${BASE_URL}/images/logo.png`,
            },
            availableChannel: {
              "@type": "ServiceChannel",
              serviceUrl: url,
              servicePhone: "+90-242-606-07-63",
              availableLanguage: landingLocales(page).map((l) => LOCALE_NAME[l] ?? l),
            },
            // AggregateOffer, not one Offer per destination: this page sells
            // every route in the price table, and Google's guidance for a
            // range of prices on one entity is exactly this shape.
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "EUR",
              lowPrice: fromPrice,
              highPrice,
              offerCount: booking.regionPrices.length,
              url,
            },
          },
        ]
      : []),
    ...(outline.faq.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: outline.faq.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          },
        ]
      : []),
  ];

  const priceNode = fromPrice ? <PriceTag amount={fromPrice} showLabel={false} /> : null;

  const bookingCard = (
    <aside
      className="my-10 grid gap-5 rounded-3xl bg-[#F5F5F7] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-7"
      aria-label={bt("cardKicker")}
    >
      <div className="min-w-0">
        <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#007AFF]">{bt("cardKicker")}</div>
        <p className="mt-2 text-balance text-[19px] font-bold leading-snug tracking-tight text-gray-900 sm:text-[21px]">{cta("heading")}</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-gray-500">{rd("freeCancellation")}</p>
      </div>
      <div className="grid gap-2.5 sm:min-w-[200px] sm:justify-items-end sm:text-end">
        {priceNode && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">{bt("priceFrom")}</div>
            <div className="text-[30px] font-extrabold leading-tight tracking-tight text-gray-900">{priceNode}</div>
          </div>
        )}
        <Link href={bookHref} className={`${CTA} w-full sm:w-auto`}>
          {nav("bookNow")}
          <ArrowRight size={16} aria-hidden="true" className="rtl:rotate-180" />
        </Link>
      </div>
    </aside>
  );

  const tocItems = outline.faqSeparated && outline.faq.length ? [...outline.headings, { id: "sss", text: bt("faqHeading") }] : outline.headings;

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <Header />
      <main>
        {/* ── Hero: heading, price, rating, form ───────────────────────── */}
        <section style={{ background: "linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)" }}>
          {/* pt-20, not pt-6: the header is `fixed` and opaque white on every
              page but the homepage (Header.tsx's `isHeroPage`), so nothing
              reserves its 64px in normal flow — the breadcrumb and badge sat
              under it on a phone until this cleared it. */}
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-20 lg:px-6 lg:pb-14 lg:pt-24">
            <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-gray-500">
              <Link href="/" className="transition-colors hover:text-gray-900">{nav("home")}</Link>
              <span aria-hidden="true">/</span>
              <span className="text-gray-900">{heading}</span>
            </nav>

            <div className={`mt-6 grid items-center gap-10 ${page.image_url ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
              <div className={page.image_url ? "" : "max-w-3xl"}>
                {featured && (
                  <Link
                    href={regionPath(featured.slug)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#007AFF]/[0.08] px-3 py-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#0062CC] transition-colors hover:bg-[#007AFF]/[0.14]"
                  >
                    <MapPin size={11} aria-hidden="true" />
                    {featured.name}
                  </Link>
                )}
                <h1 className={`${featured ? "mt-4" : ""} text-balance hyphens-auto break-words text-[24px] font-bold leading-[1.2] tracking-tight text-gray-900 sm:text-[28px] lg:text-[38px] lg:leading-[1.14]`}>
                  {heading}
                </h1>
                {copy.intro && (
                  <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-gray-600 lg:text-[16.5px]">{copy.intro}</p>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                  {priceNode && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">{bt("priceFrom")}</div>
                      <div className="text-[28px] font-extrabold leading-tight tracking-tight text-gray-900">
                        {priceNode}
                        <span className="ms-2 text-[13px] font-medium text-gray-500">{bt("priceNote")}</span>
                      </div>
                    </div>
                  )}
                  {showRating && (
                    <div className="flex items-center gap-2.5 sm:ps-6" style={{ borderInlineStart: HAIRLINE }}>
                      <span className="text-[26px] font-extrabold leading-none tracking-tight text-gray-900">{rating.value!.toFixed(1)}</span>
                      <span>
                        <span className="block text-[13px] tracking-[0.12em] text-[#FF9500]" aria-hidden="true">★★★★★</span>
                        <span className="block text-[12.5px] text-gray-500">{t("reviewsCount", { count: rating.count })}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {page.image_url && (
                <div className="relative hidden aspect-[5/4] overflow-hidden rounded-3xl lg:block">
                  <Image
                    src={page.image_url}
                    alt={page.image_alt || heading}
                    fill
                    sizes="(min-width: 1024px) 45vw, 1px"
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            {/* The form, full width under both columns. z-30 so its pickers
                open over the sections below. */}
            <div className="relative z-30 mt-8 lg:mt-10">
              <p className="mb-3 text-[14px] font-semibold text-gray-900">{t("formTitle")}</p>
              <BookingFormMini presetRegion={featured?.slug} initialRegions={booking.initialRegions} />
            </div>
          </div>
        </section>

        {/* ── Promises ─────────────────────────────────────────────────── */}
        <section style={{ borderTop: HAIRLINE }}>
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-2.5 px-4 py-6 lg:grid-cols-4 lg:gap-4 lg:px-6 lg:py-10">
            {promises.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl bg-white px-4 py-3.5 lg:px-5 lg:py-5" style={{ border: HAIRLINE }}>
                <span className="flex items-start gap-2">
                  <Icon size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[#007AFF]" aria-hidden="true" />
                  <b className="min-w-0 break-words text-[13.5px] font-semibold leading-snug tracking-tight text-gray-900 lg:text-[14.5px]">{title}</b>
                </span>
                <span className="mt-1.5 line-clamp-3 block text-[12.5px] leading-snug text-gray-500 lg:text-[13.5px]">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Short SEO intro — the writer's own opening paragraph(s) ──── */}
        {leadHtml && (
          <section className="py-10" style={{ borderTop: HAIRLINE }}>
            <div className="mx-auto max-w-6xl px-4 lg:px-6">
              <div className={`${ARTICLE_PROSE} max-w-[70ch]`} dangerouslySetInnerHTML={{ __html: leadHtml }} />
            </div>
          </section>
        )}

        {/* ── Prices ───────────────────────────────────────────────────── */}
        {priceRows.length > 0 && (
          <section id="fiyatlar" className="scroll-mt-24 bg-[#FBFBFD] py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
            <div className="mx-auto max-w-6xl px-4 lg:px-6">
              <SectionHead kicker={t("pricesKicker")} title={t("pricesTitle")} sub={t("pricesSub")} />
              <LandingPriceTable rows={priceRows} initialRates={booking.initialRates} />
              <p className="mt-4 text-[13px] text-gray-500">{rd("freeCancellation")}</p>
            </div>
          </section>
        )}

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section className="py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <SectionHead kicker={t("stepsKicker")} title={hw("heading")} sub={hw("subheading")} />
            <ol className="grid gap-4 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="rounded-3xl bg-white p-6" style={{ border: HAIRLINE }}>
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#007AFF] text-[15px] font-bold text-white">{i + 1}</span>
                  <b className="mt-4 block text-[17px] font-bold tracking-tight text-gray-900">{s.title}</b>
                  <span className="mt-2 block text-[14.5px] leading-relaxed text-gray-500">{s.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Vehicle and what the price covers ────────────────────────── */}
        <section className="bg-[#FBFBFD] py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <SectionHead kicker={t("includedKicker")} title={t("includedTitle")} />
            <div className="grid overflow-hidden rounded-3xl bg-white lg:grid-cols-[0.9fr_1.1fr]" style={{ border: HAIRLINE }}>
              <div className="relative grid place-items-center bg-[#F5F5F7] px-3 py-5 lg:px-4 lg:py-6">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 inset-y-[18%]"
                  style={{ background: "radial-gradient(52% 54% at 50% 50%, rgba(0,122,255,0.07), transparent 74%)" }}
                />
                {/* The PNG carries a white ground; multiply keeps it off the grey. */}
                <div className="relative aspect-[2/1] w-full max-w-[520px] mix-blend-multiply">
                  <Image src="/images/vehicles/mercedes-vito-vip.png" alt={rd("mercedesVito")} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-contain" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2">
                <div className="px-6 py-6 lg:px-8 lg:py-8">
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">{rd("includedHeading")}</h3>
                  <ul className="grid gap-3">
                    {included.map((label) => (
                      <li key={label} className="flex items-start gap-2.5 text-[14px] leading-snug text-gray-600">
                        <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[#34C759]" aria-hidden="true" />
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-6 py-6 sm:border-s lg:px-8 lg:py-8" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">{rd("vehicleLabel")}</h3>
                  <ul className="grid gap-3">
                    {specs.map((label) => (
                      <li key={label} className="flex items-start gap-2.5 text-[14px] leading-snug text-gray-600">
                        <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                        {label}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[12.5px] leading-snug text-gray-400">{rd("vehicleExtraNote")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Reviews ──────────────────────────────────────────────────── */}
        {reviews.length > 0 && (
          <section className="py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
            <div className="mx-auto max-w-6xl px-4 lg:px-6">
              <SectionHead kicker={rd("kickerReviews")} title={rd("customerReviews")} />
              {showRating && (
                <div className="mb-7 flex flex-wrap items-center gap-4">
                  <b className="text-[38px] font-extrabold leading-none tracking-tight text-gray-900">{rating.value!.toFixed(1)}</b>
                  <span className="text-[15px] tracking-[0.14em] text-[#FF9500]" aria-hidden="true">★★★★★</span>
                  <span className="text-[14px] text-gray-500">{t("reviewsCount", { count: rating.count })}</span>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                {reviews.slice(0, 3).map((r, i) => (
                  <figure key={r.id ?? i} className="rounded-3xl bg-white px-6 py-6" style={{ border: HAIRLINE }}>
                    <span className="flex gap-0.5 text-[#FF9500]" aria-label={`${r.rating}/5`}>
                      {Array.from({ length: Math.max(1, Math.min(5, r.rating)) }, (_, k) => (
                        <Star key={k} size={14} fill="currentColor" aria-hidden="true" />
                      ))}
                    </span>
                    <blockquote className="mt-3.5 line-clamp-6 text-[14.5px] leading-relaxed text-gray-600">{r.comment}</blockquote>
                    <figcaption className="mt-5 flex items-center gap-2 pt-4 text-[13px] text-gray-500" style={{ borderTop: HAIRLINE }}>
                      {authorName(r, rd("guest"))}
                      {r.source === "google" && (
                        <span className="rounded bg-[#F0F0F2] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-gray-600">Google</span>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── The page's own copy — one centered column, no persistent
               sidebar. The price and the booking form are already on screen
               three times by this point (hero, price table, inline cards);
               a fourth, sticky one next to the reading column duplicated
               itself rather than adding anything. */}
        {content && (
          <section className="py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
            <div className="mx-auto max-w-3xl px-4 lg:px-6">
              {outline.showToc && (
                <details className="group mb-8 rounded-2xl bg-white" style={{ border: HAIRLINE }}>
                  <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
                    <List size={16} aria-hidden="true" className="text-[#007AFF]" />
                    <span className="text-[14.5px] font-semibold text-gray-900">{bt("onThisPage")}</span>
                    <ChevronDown size={16} aria-hidden="true" className="ms-auto text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <Toc items={tocItems} />
                </details>
              )}

              <div className={`${ARTICLE_PROSE} max-w-none`} dangerouslySetInnerHTML={{ __html: outline.before }} />
              {outline.after && (
                <>
                  {bookingCard}
                  <div className={`${ARTICLE_PROSE} max-w-none`} dangerouslySetInnerHTML={{ __html: outline.after }} />
                </>
              )}

              {outline.faqSeparated && outline.faq.length > 0 && (
                <section id="sss" className="mt-12 scroll-mt-28">
                  <h2 className="text-[22px] font-bold tracking-tight text-gray-900 lg:text-[26px]">{bt("faqHeading")}</h2>
                  <div className="mt-5 grid gap-2.5">
                    {outline.faq.map((f, i) => (
                      <details key={i} open={i === 0} className="group rounded-2xl bg-white" style={{ border: HAIRLINE }}>
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-[15px] font-semibold leading-snug text-gray-900 [&::-webkit-details-marker]:hidden">
                          <span className="min-w-0">{f.question}</span>
                          <ChevronDown size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                        </summary>
                        <p className="px-5 pb-5 text-[15px] leading-relaxed text-gray-600">{f.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              {bookingCard}
            </div>
          </section>
        )}

        {/* ── Other keyword pages and popular regions ──────────────────── */}
        <section className="bg-[#FBFBFD] py-12 lg:py-16" style={{ borderTop: HAIRLINE }}>
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <h2 className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-gray-400">{t("relatedKicker")}</h2>
            <ul className="mt-3.5 flex flex-wrap gap-2.5">
              {serviceLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex rounded-full bg-white px-4 py-2 text-[14px] text-gray-700 transition-colors hover:text-[#007AFF]" style={{ border: HAIRLINE }}>
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
            {popularRegions.length > 0 && (
              <>
                <h2 className="mt-10 text-[11.5px] font-bold uppercase tracking-[0.1em] text-gray-400">{bt("popularTransfers")}</h2>
                <ul className="mt-3.5 flex flex-wrap gap-2.5">
                  {popularRegions.map((r) => (
                    <li key={r.slug}>
                      <Link href={regionPath(r.slug)} className="inline-flex rounded-full bg-[#F5F5F7] px-4 py-2 text-[14px] text-gray-700 transition-colors hover:text-[#007AFF]">
                        {r.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        {/* ── Closing ──────────────────────────────────────────────────── */}
        <section className="bg-[#1D1D1F]">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 lg:grid-cols-[1fr_auto] lg:px-6 lg:py-20">
            <div>
              <div className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0A84FF]">{t("closingKicker")}</div>
              <h2 className="mt-3.5 text-balance text-[23px] font-extrabold leading-tight tracking-tight text-white lg:text-[34px]">{cta("heading")}</h2>
              <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-white/60">{cta("subheading")}</p>
            </div>
            <div className="grid justify-items-stretch gap-3 lg:justify-items-center">
              <Link href={bookHref} className={`${CTA} px-8 py-4 text-[16px]`}>
                {nav("bookNow")}
                {priceNode && <span className="font-normal opacity-80">· {priceNode}</span>}
                <ArrowRight size={17} aria-hidden="true" className="rtl:rotate-180" />
              </Link>
              <small className="text-center text-[13px] text-white/45">{rd("freeCancellation")}</small>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton aboveStickyBar />
      <BlogStickyBar regionSlug={featured?.slug ?? null} price={fromPrice} />
    </>
  );
}

function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-7 lg:mb-10">
      <div className="text-[11.5px] font-bold uppercase leading-snug tracking-[0.1em] text-[#007AFF]">{kicker}</div>
      <h2 className="mt-3 text-balance break-words text-[22px] font-extrabold leading-[1.2] tracking-tight text-gray-900 lg:text-[32px]">{title}</h2>
      {sub && <p className="mt-2.5 max-w-[62ch] text-[15px] leading-relaxed text-gray-500 lg:text-[16px]">{sub}</p>}
    </div>
  );
}

function Toc({ items }: { items: { id: string; text: string }[] }) {
  return (
    <ol className="grid gap-1 px-1 pb-2">
      {items.map((h) => (
        <li key={h.id}>
          <a href={`#${h.id}`} className="block rounded-lg px-3 py-1.5 text-[14px] leading-snug text-gray-600 transition-colors hover:bg-[#F5F5F7] hover:text-gray-900">
            {h.text}
          </a>
        </li>
      ))}
    </ol>
  );
}
