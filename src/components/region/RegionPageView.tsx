import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Armchair,
  BadgeCheck,
  Check,
  PlaneLanding,
  ShieldCheck,
  Snowflake,
  Star,
  Users,
  Wifi,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * The region page, laid out.
 *
 * Kept apart from `[locale]/[region]/page.tsx` — which reads the tables, builds
 * the schema and resolves the SEO overrides — so the layout can be worked on
 * without a database behind it, and so a preview route can feed it anything.
 *
 * It resolves its own wording from `regionDetail` and `compare` rather than
 * taking three dozen label props. Both namespaces are written natively in each
 * language, so nothing here stitches a sentence together out of fragments.
 *
 * The visual language is the site's own — iOS blue on white, Apple's greys and
 * near-black. What changed against the old page is the order of the sections
 * and which ones earn their place.
 */

export interface RegionHighlight {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

export interface RegionReviewItem {
  author: string;
  rating: number;
  text: string;
  /** Reviews copied from Google are shown, but never fed to schema. */
  fromGoogle?: boolean;
}

export interface RegionFaqItem {
  question: string;
  answer: string;
}

export interface RegionPageViewProps {
  locale: string;
  /** Ana sayfa / Bölgeler / {bölge} — hero'nun içinde durur. */
  breadcrumb?: ReactNode;
  name: string;
  /** The H1, exactly as the page composed it. Never shortened here. */
  heading: string;
  intro: string;
  /**
   * The rendered price — a node, not a string, because the site's currency
   * switcher converts it live. See PriceTag.
   */
  price: ReactNode;
  distanceKm: number | null;
  durationMinutes: number | null;
  heroImage: string;
  heroImageAlt: string;
  regionImage?: string | null;
  regionImageAlt?: string;
  about: string[];
  /** "D400" and the like. Left out when the road is not recorded. */
  routeName?: string | null;
  highlights?: RegionHighlight[];
  hotels: string[];
  hotelsIntro?: string;
  reviews: RegionReviewItem[];
  ratingAverage?: string;
  ratingLine?: string;
  faq: RegionFaqItem[];
  otherRegions: { name: string; href: string }[];
  searchPhrases?: string[];
  searchPhrasesLabel?: string;
  bookHref: string;
}

const HAIRLINE = "1px solid rgba(0,0,0,0.06)";
const CTA =
  "inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#007AFF] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0062CC]";

export default async function RegionPageView({
  locale,
  breadcrumb,
  name,
  heading,
  intro,
  price,
  distanceKm,
  durationMinutes,
  heroImage,
  heroImageAlt,
  regionImage,
  regionImageAlt,
  about,
  routeName,
  highlights = [],
  hotels,
  hotelsIntro,
  reviews,
  ratingAverage,
  ratingLine,
  faq,
  otherRegions,
  searchPhrases,
  searchPhrasesLabel,
  bookHref,
}: RegionPageViewProps) {
  const t = await getTranslations({ locale, namespace: "regionDetail" });
  const c = await getTranslations({ locale, namespace: "compare" });

  /* The four promises are the old "Why choose us" block, moved into the hero.
     Nothing was rewritten — these strings already existed in every language. */
  const promises: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: BadgeCheck, title: t("fixedPriceTitle"), text: t("fixedPriceDesc") },
    { icon: PlaneLanding, title: t("flightTrackTitle"), text: t("flightTrackDesc") },
    { icon: Users, title: t("proDriversTitle"), text: t("proDriversDesc") },
    { icon: ShieldCheck, title: t("securePayTitle"), text: t("securePayDesc") },
  ];

  const vehicleSpecs: { icon: LucideIcon; label: string }[] = [
    { icon: Users, label: t("specPassengers") },
    { icon: Armchair, label: t("specLeather") },
    { icon: Snowflake, label: t("specClimate") },
    { icon: Wifi, label: t("specWifi") },
  ];

  const included = [
    t("inclHighway"),
    t("inclMeet"),
    t("inclRoundTrip"),
    t("inclChildSeat"),
    t("inclPayment"),
  ];

  /* The four options carry the old comparison table's data, re-laid-out as
     cards so the row we sell can be recommended. Every string here already
     exists in `compare`; none of it is new copy. */
  const options = [
    {
      key: "torvian",
      name: c("torvian"),
      note: c("fixed"),
      recommended: true,
      rows: [
        { label: c("rowMeetGreet"), value: c("yes"), ok: true },
        { label: c("rowFlightTracking"), value: c("yes"), ok: true },
        { label: c("rowDoorToDoor"), value: c("yes"), ok: true },
        { label: c("rowVehicle"), value: c("torvianVehicle"), ok: true },
        { label: c("rowWaitTime"), value: c("torvianWait"), ok: true },
        { label: c("rowCancellation"), value: c("torvianCancel"), ok: true },
      ],
    },
    {
      key: "taxi",
      name: c("taxi"),
      note: c("taxiMeter"),
      rows: [
        { label: c("rowMeetGreet"), value: c("no"), ok: false },
        { label: c("rowFlightTracking"), value: c("no"), ok: false },
        { label: c("rowDoorToDoor"), value: c("yes"), ok: true },
        { label: c("rowVehicle"), value: c("taxiVehicle"), ok: false },
        { label: c("rowWaitTime"), value: c("taxiWait"), ok: false },
      ],
    },
    {
      key: "havas",
      name: c("havas"),
      note: c("havasShared"),
      rows: [
        { label: c("rowMeetGreet"), value: c("no"), ok: false },
        { label: c("rowFlightTracking"), value: c("no"), ok: false },
        { label: c("rowDoorToDoor"), value: c("havasStops"), ok: false },
        { label: c("rowVehicle"), value: c("havasVehicle"), ok: false },
        { label: c("rowWaitTime"), value: c("havasWait"), ok: false },
      ],
    },
    {
      key: "uber",
      name: c("uber"),
      note: c("uberSurge"),
      rows: [
        { label: c("rowMeetGreet"), value: c("no"), ok: false },
        { label: c("rowFlightTracking"), value: c("no"), ok: false },
        { label: c("rowVehicle"), value: c("uberVehicle"), ok: false },
        { label: c("rowWaitTime"), value: c("uberWait"), ok: false },
        { label: c("rowCancellation"), value: c("uberCancel"), ok: false },
      ],
    },
  ];

  const promiseCards = (
    <ul className="grid grid-cols-2 gap-2.5">
      {promises.map(({ icon: Icon, title, text }) => (
        <li key={title} className="rounded-2xl bg-white px-4 py-3.5" style={{ border: HAIRLINE }}>
          <span className="flex items-start gap-2">
            <Icon size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-[#007AFF]" aria-hidden="true" />
            <b className="min-w-0 break-words text-[13px] font-semibold leading-snug tracking-tight text-gray-900">{title}</b>
          </span>
          <span className="mt-1.5 line-clamp-3 block text-[12px] leading-snug text-gray-500">{text}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}
      >
        <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
          {/* Masaüstünde hero'nun tepesinde; telefonda fotoğraf başlık çubuğuna
              yapışık kalsın diye metnin başına iniyor. */}
          {breadcrumb && <div className="hidden pt-6 lg:block">{breadcrumb}</div>}

          <div className="grid items-center gap-8 pb-12 pt-0 lg:grid-cols-2 lg:gap-14 lg:pb-20 lg:pt-10">
          <div className="order-2 lg:order-1">
            {breadcrumb && <div className="mb-4 lg:hidden">{breadcrumb}</div>}
            <div className="text-[11.5px] font-semibold uppercase leading-snug tracking-[0.1em] text-[#007AFF]">
              {t("airportTo", { name })}
            </div>
            {/*
              The heading keeps the whole search phrase the page has always
              carried. Some of these pages sit in the top ten for it, and
              trimming the airport out of the H1 to tidy it up is exactly the
              edit that loses those places.
            */}
            <h1 className="mt-4 text-balance hyphens-auto break-words text-[24px] font-bold leading-[1.2] tracking-tight text-gray-900 sm:text-[28px] lg:text-[38px] lg:leading-[1.14]">
              {heading}
            </h1>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-gray-600 lg:text-[16.5px]">
              {intro}
            </p>
            <div className="mt-7 hidden lg:block">{promiseCards}</div>
          </div>

          {/* Full-bleed on a phone — a cover under the header, not a card. */}
          <div className="order-1 -mx-4 lg:order-2 lg:mx-0">
            <div className="relative aspect-[4/3] overflow-hidden lg:aspect-[5/4] lg:rounded-3xl">
              <Image
                src={heroImage}
                alt={heroImageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ── Spec plate ─────────────────────────────────────────────────── */}
      <div className="bg-[#1D1D1F]">
        <dl className="mx-auto flex max-w-7xl flex-wrap px-4 lg:px-6">
          <PlateCell label={t("labelFixedPrice")} value={price} />
          <PlateCell
            label={t("labelDuration")}
            value={durationMinutes ? String(durationMinutes) : "—"}
            unit={durationMinutes ? t("unitMin") : undefined}
          />
          <PlateCell
            label={t("labelDistance")}
            value={distanceKm ? String(distanceKm) : "—"}
            unit={distanceKm ? t("unitKm") : undefined}
          />
          <PlateCell label={t("labelCapacity")} value="5" unit={t("unitPax")} last />
          {/* A phone has the sticky bar at the foot of the page for this. */}
          <div className="ms-auto hidden items-center py-5 sm:flex">
            <a href={bookHref} className={CTA}>
              <ArrowRight size={16} aria-hidden="true" /> {t("ctaBookPrice")}
            </a>
          </div>
        </dl>
      </div>

      {/* Phones get the promises here instead, under the plate. */}
      <div className="lg:hidden" style={{ borderBottom: HAIRLINE }}>
        <div className="mx-auto max-w-7xl px-4 py-5">{promiseCards}</div>
      </div>

      {/* ── Price and vehicle ──────────────────────────────────────────── */}
      <section className="py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionHead kicker={t("kickerPrice")} title={t("headingPrice")} sub={t("subPrice")} />

          <div
            className="grid overflow-hidden rounded-3xl bg-white lg:grid-cols-[0.82fr_1.18fr]"
            style={{ border: HAIRLINE }}
          >
            <div className="relative grid place-items-center bg-[#F5F5F7] px-3 py-5 lg:px-4 lg:py-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 inset-y-[18%]"
                style={{ background: "radial-gradient(52% 54% at 50% 50%, rgba(0,122,255,0.07), transparent 74%)" }}
              />
              {/* The PNG carries a white ground; multiply keeps it off the grey. */}
              <div className="relative aspect-[2/1] w-full max-w-[520px] mix-blend-multiply">
                <Image
                  src="/images/vehicles/mercedes-vito-vip.png"
                  alt={t("mercedesVito")}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="px-5 py-5 lg:px-8 lg:py-6" style={{ borderBottom: HAIRLINE }}>
                {/* Route and what the figure covers read as one two-line label;
                    the number sits under both. */}
                <div className="text-[11px] font-bold uppercase leading-snug tracking-[0.08em] text-gray-400">
                  {t("airportTo", { name })}
                </div>
                <div className="mt-1 max-w-[36ch] text-[11px] font-bold uppercase leading-snug tracking-[0.08em] text-gray-400">
                  {t("priceNote")}
                </div>
                <div className="mt-3 text-[30px] font-extrabold leading-none tracking-tight text-[#007AFF] lg:text-[38px]">
                  {price}
                </div>
              </div>

              <div className="grid flex-1 sm:grid-cols-2">
                <div className="px-5 py-5 lg:px-8 lg:py-6" style={{ borderBottom: HAIRLINE }}>
                  <h3 className="mb-3.5 text-[11px] font-bold uppercase leading-snug tracking-[0.1em] text-gray-400">
                    {t("includedHeading")}
                  </h3>
                  <ul className="grid gap-3">
                    {included.map((label) => (
                      <li key={label} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-gray-600">
                        <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-[#34C759]" aria-hidden="true" />
                        <span className="min-w-0 break-words">{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="px-5 py-5 lg:px-8 lg:py-6"
                  style={{ borderBottom: HAIRLINE, borderInlineStart: HAIRLINE }}
                >
                  <h3 className="mb-3.5 text-[11px] font-bold uppercase leading-snug tracking-[0.1em] text-gray-400">
                    {t("vehicleLabel")}
                  </h3>
                  <ul className="grid gap-3">
                    {vehicleSpecs.map(({ icon: Icon, label }) => (
                      <li key={label} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-gray-600">
                        <Icon size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                        <span className="min-w-0 break-words">{label}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Tam cümle; etiket olarak değil, listenin altında not olarak. */}
                  <p className="mt-3.5 text-[12.5px] leading-snug text-gray-400">{t("mercedesVito")}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 px-5 py-5 lg:px-8 lg:py-6">
                <p className="min-w-[240px] flex-1 text-[13px] leading-relaxed text-gray-500">
                  {t("vehicleExtraNote")}
                </p>
                <a href={bookHref} className={`${CTA} w-full sm:w-auto`}>
                  <ArrowRight size={16} aria-hidden="true" /> {t("bookNow")}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Options ────────────────────────────────────────────────────── */}
      <section className="bg-[#FBFBFD] py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionHead kicker={t("kickerOptions")} title={t("headingOptions", { name })} sub={t("subOptions")} />

          <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr_1fr]">
            {options.map((opt) => (
              <div
                key={opt.key}
                className={
                  opt.recommended
                    ? "relative rounded-3xl bg-white px-5 py-7 shadow-[0_18px_44px_rgba(0,122,255,0.14)] ring-2 ring-[#007AFF] lg:px-6"
                    : "relative rounded-3xl bg-white/70 px-5 py-7 lg:px-6"
                }
                style={opt.recommended ? undefined : { border: HAIRLINE }}
              >
                {opt.recommended && (
                  <span className="absolute -top-3 start-5 inline-flex max-w-[calc(100%-2.5rem)] items-center gap-1.5 rounded-full bg-[#007AFF] px-3 py-1 text-[11px] font-bold uppercase leading-snug tracking-[0.05em] text-white lg:start-6">
                    <Star size={12} fill="currentColor" aria-hidden="true" /> {c("recommended")}
                  </span>
                )}
                <h3 className={`break-words text-[15.5px] font-bold leading-snug tracking-tight ${opt.recommended ? "text-gray-900" : "text-gray-600"}`}>
                  {opt.name}
                </h3>
                <div
                  className={`mt-3 font-extrabold leading-none tracking-tight ${
                    opt.recommended ? "text-[32px] text-[#007AFF]" : "text-[26px] text-gray-400"
                  }`}
                >
                  {opt.recommended ? price : c("naBlank")}
                </div>
                <div className="mt-2 break-words text-[12.5px] leading-snug text-gray-500">{opt.note}</div>
                <ul className="mt-5 grid gap-2.5 pt-5" style={{ borderTop: HAIRLINE }}>
                  {opt.rows.map((row) => (
                    <li
                      key={row.label}
                      className={`flex items-start gap-2.5 text-[13px] leading-snug ${row.ok ? "text-gray-600" : "text-gray-400"}`}
                    >
                      {row.ok ? (
                        <Check size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-[#34C759]" aria-hidden="true" />
                      ) : (
                        <X size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-[#FF3B30]" aria-hidden="true" />
                      )}
                      <span className="min-w-0 break-words">
                        <span className="text-gray-400">{row.label}: </span>
                        {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
                {opt.recommended && (
                  <a href={bookHref} className={`${CTA} mt-6 w-full`}>
                    <ArrowRight size={16} aria-hidden="true" /> {t("bookNow")}
                  </a>
                )}
              </div>
            ))}
          </div>

          <p className="mt-5 text-[12.5px] text-gray-400">{t("optionsNote")}</p>
        </div>
      </section>

      {/* ── About the region ───────────────────────────────────────────── */}
      <section className="py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionHead kicker={t("kickerRegion")} title={t("aboutRegion", { name })} />

          <dl className="flex flex-wrap gap-x-10 gap-y-1 pb-6" style={{ borderBottom: HAIRLINE }}>
            <Fact
              label={t("labelDistance")}
              value={distanceKm ? String(distanceKm) : "—"}
              unit={distanceKm ? t("unitKm") : undefined}
            />
            <Fact
              label={t("labelDuration")}
              value={durationMinutes ? String(durationMinutes) : "—"}
              unit={durationMinutes ? t("unitMin") : undefined}
            />
            {routeName && <Fact label={t("labelRoute")} value={routeName} />}
            <Fact label={t("labelStops")} value={t("valueNoStops")} />
          </dl>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.45fr_1fr]">
            <div>
              {about.map((para, i) => (
                <p key={i} className="mb-5 text-[15.5px] leading-[1.75] text-gray-600 last:mb-0 lg:text-[16px]">
                  {para}
                </p>
              ))}
            </div>
            {regionImage && (
              <div className="relative aspect-[16/10] overflow-hidden rounded-3xl lg:aspect-[4/5]">
                <Image
                  src={regionImage}
                  alt={regionImageAlt ?? name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {hotels.length > 0 && (
            <div className="mt-10">
              <p className="text-[14.5px] text-gray-600">{hotelsIntro}</p>
              <ul className="mt-3.5 flex flex-wrap gap-2.5">
                {hotels.map((h) => (
                  <li
                    key={h}
                    className="rounded-full bg-white px-4 py-2 text-[13.5px] text-gray-600"
                    style={{ border: HAIRLINE }}
                  >
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ── Highlights — filled from the panel, per region ─────────────── */}
      {highlights.length > 0 && (
        <section className="bg-[#FBFBFD] py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <SectionHead kicker={t("kickerRegion")} title={name} />
            <ul className="grid gap-5 md:grid-cols-3">
              {highlights.map((h) => (
                <li key={h.title} className="overflow-hidden rounded-3xl bg-white" style={{ border: HAIRLINE }}>
                  <div className="relative aspect-[4/3]">
                    <Image src={h.image} alt={h.imageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                  </div>
                  <div className="px-6 py-5">
                    <b className="block text-[17px] font-bold tracking-tight text-gray-900">{h.title}</b>
                    <span className="mt-2 block text-[14px] leading-relaxed text-gray-500">{h.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Reviews ────────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="bg-[#FBFBFD] py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <SectionHead kicker={t("kickerReviews")} title={t("customerReviews")} />

            {ratingAverage && (
              <div className="flex flex-wrap items-center gap-4 pb-7" style={{ borderBottom: HAIRLINE }}>
                <b className="text-[38px] font-extrabold leading-none tracking-tight text-gray-900">{ratingAverage}</b>
                <span className="text-[15px] tracking-[0.14em] text-[#FF9500]">★★★★★</span>
                {ratingLine && <span className="text-[14px] text-gray-500">{ratingLine}</span>}
              </div>
            )}

            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {reviews.map((r, i) => (
                <div key={i} className="rounded-3xl bg-white px-6 py-6" style={{ border: HAIRLINE }}>
                  <span className="text-[15px] tracking-[0.14em] text-[#FF9500]">
                    {"★".repeat(Math.max(1, Math.min(5, r.rating)))}
                  </span>
                  <p className="mt-3.5 text-[14.5px] leading-relaxed text-gray-600">{r.text}</p>
                  <div
                    className="mt-5 flex flex-wrap items-center gap-2.5 pt-4 text-[13px] text-gray-500"
                    style={{ borderTop: HAIRLINE }}
                  >
                    {r.author}
                    {r.fromGoogle && (
                      <span className="rounded bg-[#F0F0F2] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-gray-600">
                        Google
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionHead kicker={t("kickerFaq")} title={t("faqHeading", { name })} centered />
          <div className="mx-auto grid max-w-3xl gap-2.5">
            {faq.map((item, i) => (
              <details
                key={item.question}
                open={i === 0}
                className="group rounded-2xl bg-white"
                style={{ border: HAIRLINE }}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-[14.5px] font-semibold leading-snug text-gray-900 lg:px-6 lg:py-5 lg:text-[15px] [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 break-words">{item.question}</span>
                  <span
                    aria-hidden="true"
                    className="mt-1 size-2.5 shrink-0 rotate-45 border-b-[1.5px] border-e-[1.5px] border-gray-400 transition-transform group-open:-rotate-[135deg]"
                  />
                </summary>
                <p className="px-5 pb-4 text-[14px] leading-relaxed text-gray-500 lg:px-6 lg:pb-5 lg:text-[14.5px]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nearby regions, and the phrases this route answers ─────────── */}
      {(otherRegions.length > 0 || (searchPhrases && searchPhrases.length > 0)) && (
        <section className="bg-[#FBFBFD] py-12 lg:py-20" style={{ borderTop: HAIRLINE }}>
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            {otherRegions.length > 0 && (
              <>
                <SectionHead kicker={t("kickerNearby")} title={t("otherDestinations")} />
                <div className="flex flex-wrap gap-2.5">
                  {otherRegions.map((r) => (
                    <a
                      key={r.href}
                      href={r.href}
                      className="rounded-full bg-white px-5 py-2.5 text-[14px] text-gray-600 transition-colors hover:text-[#007AFF]"
                      style={{ border: HAIRLINE }}
                    >
                      {r.name}
                    </a>
                  ))}
                </div>
              </>
            )}

            {/*
              The phrases this route is written to answer. They used to sit in
              the hero, where on a phone they pushed the price below the fold
              and told a reader nothing. They carry the same weight here.
            */}
            {searchPhrases && searchPhrases.length > 0 && (
              <div
                className={otherRegions.length > 0 ? "mt-12 pt-10" : ""}
                style={otherRegions.length > 0 ? { borderTop: HAIRLINE } : undefined}
              >
                <h3 className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  {searchPhrasesLabel}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {searchPhrases.map((phrase) => (
                    <li
                      key={phrase}
                      className="rounded-full bg-white px-3.5 py-1.5 text-[12.5px] text-gray-500"
                      style={{ border: HAIRLINE }}
                    >
                      {phrase}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Closing ────────────────────────────────────────────────────── */}
      <section className="bg-[#1D1D1F]">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 lg:grid-cols-[1fr_auto] lg:px-6 lg:py-20">
          <div>
            <div className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0A84FF]">
              {t("airportTo", { name })}
            </div>
            <h2 className="mt-3.5 text-[23px] font-extrabold leading-tight tracking-tight text-white lg:text-[34px]">
              {t("readyToBook", { name })}
            </h2>
            <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-white/60">{t("readyDesc")}</p>
          </div>
          <div className="grid justify-items-stretch gap-3 lg:justify-items-center">
            <a href={bookHref} className={`${CTA} px-8 py-4 text-[16px]`}>
              <ArrowRight size={17} aria-hidden="true" /> {t("ctaBookPrice")}
            </a>
            <small className="text-center text-[13px] text-white/45">{t("freeCancellation")}</small>
          </div>
        </div>
      </section>
    </>
  );
}

function PlateCell({
  label,
  value,
  unit,
  last,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex w-full items-baseline justify-between gap-4 py-3.5 sm:me-8 sm:block sm:w-auto sm:border-e sm:py-6 sm:pe-8 sm:last:border-e-0 ${
        last ? "" : "border-b sm:border-b-0"
      }`}
      style={{ borderColor: "rgba(255,255,255,0.12)" }}
    >
      <dt className="min-w-0 break-words text-[11px] font-bold uppercase leading-snug tracking-[0.09em] text-white/45">
        {label}
      </dt>
      <dd className="m-0 whitespace-nowrap text-[20px] font-extrabold leading-none tracking-tight text-white sm:mt-2 sm:text-[28px]">
        {value}
        {unit && <span className="ms-1 text-[13px] font-semibold text-white/55">{unit}</span>}
      </dd>
    </div>
  );
}

function Fact({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="py-1">
      <dt className="break-words text-[11px] font-bold uppercase leading-snug tracking-[0.09em] text-gray-400">
        {label}
      </dt>
      <dd className="m-0 mt-1.5 whitespace-nowrap text-[20px] font-extrabold leading-none tracking-tight text-gray-900 lg:text-[26px]">
        {value}
        {unit && <span className="ms-1 text-[13px] font-semibold text-gray-500">{unit}</span>}
      </dd>
    </div>
  );
}

function SectionHead({
  kicker,
  title,
  sub,
  centered,
}: {
  kicker: string;
  title: string;
  sub?: string;
  centered?: boolean;
}) {
  return (
    <div className={`mb-7 lg:mb-10 ${centered ? "text-center" : ""}`}>
      <div className="text-[11.5px] font-bold uppercase leading-snug tracking-[0.1em] text-[#007AFF]">{kicker}</div>
      <h2 className="mt-3 text-balance hyphens-auto break-words text-[20px] font-extrabold leading-[1.2] tracking-tight text-gray-900 lg:text-[29px]">
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-2.5 max-w-[58ch] text-[15px] leading-relaxed text-gray-500 lg:text-[15.5px] ${
            centered ? "mx-auto" : ""
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
