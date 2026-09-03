"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Shield, Clock, CheckCircle2, Phone, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
import BookingFormMini from "@/components/booking/BookingFormMini";

const CONTACT_PHONE = "905469407955";
const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "905469407955";

/* The section below the hero (TrustBadges) paints #FAFAFA. The phone hero
   dissolves into exactly that value so the two meet with no visible seam. */
const PAGE = "#FAFAFA";

export default function HeroSection() {
  const t = useTranslations("hero");
  const c = useTranslations("common");
  const whatsappHref = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(c("whatsappMessage"))}`;

  return (
    <section className="relative flex flex-col bg-[#FAFAFA] lg:min-h-[75vh] lg:justify-between -mt-16">
      {/* BACKDROP.
          On phones the photo is a band across the top rather than a full
          bleed: it darkens as it falls, then dissolves into the page colour,
          so the booking card lands on the boundary with white underneath it
          and nothing has a hard edge. Desktop keeps the original full-height
          image and its single wash. */}
      <div className="absolute inset-x-0 top-0 h-[300px] lg:h-full overflow-hidden">
        {/* One picture on both sides, framed differently.

            5312.jpg is a 2.37:1 panorama, so in a phone-width band `cover`
            scales it to the band's height and crops the sides. Centred, that
            window lands on open water and empty sky; the subject — the
            bungalows and the palms — sits in the left third of the frame.
            Pulling the focal point to 35% brings them into the strip the
            visitor actually sees. Desktop is wide enough to keep the frame
            centred, as it was. */}
        <Image
          src="/images/5312.jpg"
          alt="Antalya airport VIP transfer service - luxury vehicle on highway"
          fill
          className="object-cover object-[35%_50%] lg:object-center"
          sizes="100vw"
          priority
          quality={80}
        />
        {/* Legibility wash. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/15 lg:from-black/50 lg:via-black/30 lg:to-black/70" />
        {/* The dissolve, run long and weighted late. Its stops matter as much
            as its height: most of the whitening is packed into the last third,
            so the extra length buys a softer landing without hazing over the
            strip of photograph the visitor actually sees above the card. */}
        <div
          className="absolute inset-x-0 bottom-0 h-40 lg:hidden"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(250,250,250,0) 0%, rgba(250,250,250,0.10) 45%, rgba(250,250,250,0.45) 72%, rgba(250,250,250,0.85) 90%, ${PAGE} 100%)`,
          }}
        />
      </div>

      {/* HEADLINE.
          Nothing is printed over the photo on a phone — the picture and the
          card carry the whole hero there. The h1 and its subtitle are still
          in the markup, just `sr-only`, so screen readers and crawlers keep
          the page's heading and its keywords; `sr-only` also takes them out
          of flow, so they cost the layout no height. Desktop, where there is
          room for it, prints the same heading normally. */}
      <div className="order-1 relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:pt-32 lg:flex-1 lg:flex lg:flex-col lg:justify-center">
        <h1 className="sr-only lg:not-sr-only lg:block text-white text-center lg:text-5xl xl:text-6xl lg:font-extrabold lg:leading-[1.1] lg:tracking-tight">
          {t("title")}
        </h1>
        <p className="sr-only lg:not-sr-only lg:block lg:mt-4 lg:text-lg text-white/80 lg:leading-relaxed lg:max-w-2xl lg:mx-auto lg:text-center">
          {t("subtitle")}
        </p>
      </div>

      {/* BOOKING CARD.
          Second on phones — straight under the headline, sitting across the
          photo's dissolve — and third on desktop, below the trust block that
          fits above the fold there anyway.

          z-30, not z-10 like its siblings: each of these blocks opens its own
          stacking context, so at equal z-index the keyword block below wins on
          DOM order and paints over this one — which put the location list and
          the calendar underneath the promo text, where they could not be
          clicked. */}
      {/* pt is measured from the section's own top, which `-mt-16` has pulled
          64px above the viewport, and the fixed header covers the first 64px
          below that. So the photograph the visitor actually sees between the
          navbar and the card is pt − 128: 90px here, matching /booking. */}
      <div className="order-2 lg:order-3 relative z-30 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-[218px] lg:pt-10 xl:pt-12">
        <BookingFormMini />
      </div>

      {/* BADGE + TRUST TAGS + QUICK CONTACT.
          Below the card on phones, so nothing pushes the form off the first
          screen; above it on desktop, where the original stacking reads
          better in the wider frame. Everything here carries a dark variant
          for the phone, because on that side of the dissolve the ground is
          white, not photograph. */}
      <div className="order-3 lg:order-2 relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 mt-8 lg:mt-0">
        <div className="flex w-full items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-[12px] sm:text-sm font-medium text-[#4B5563] text-center lg:border-white/20 lg:bg-white/10 lg:text-white/90 lg:backdrop-blur">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#0e8a61] lg:bg-emerald-400" />
            {t("badgePill")}
          </span>
        </div>

        {/* Mini trust tags */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 mb-6">
          <span className="flex items-center gap-1.5 text-[13px] sm:text-sm text-[#4B5563] lg:text-white/90">
            <Shield size={14} className="text-[#0e8a61] lg:text-green-400" />
            {t("fixedPrice")}
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-black/20 lg:bg-white/40 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-[13px] sm:text-sm text-[#4B5563] lg:text-white/90">
            <Clock size={14} className="text-[#0e8a61] lg:text-green-400" />
            {t("service247")}
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-black/20 lg:bg-white/40 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-[13px] sm:text-sm text-[#4B5563] lg:text-white/90">
            <CheckCircle2 size={14} className="text-[#0e8a61] lg:text-green-400" />
            {t("trustCancel")}
          </span>
        </div>

        {/* Quick contact CTAs (mobile-first conversion) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <a
            href={`tel:${CONTACT_PHONE}`}
            className="inline-flex min-h-[44px] items-center gap-2 px-4 py-2 rounded-full border border-black/10 bg-white text-gray-900 text-sm font-semibold shadow-sm hover:bg-gray-50 transition lg:border-transparent lg:bg-white/95 lg:shadow-lg lg:hover:bg-white"
            aria-label={t("callNow")}
          >
            <Phone size={16} className="text-[#0e8a61] lg:text-blue-600" aria-hidden="true" />
            {t("callNow")}
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold shadow-sm lg:bg-emerald-500/95 lg:shadow-lg lg:hover:bg-emerald-500 transition"
            aria-label={t("whatsappNow")}
          >
            <MessageCircle size={16} aria-hidden="true" />
            {t("whatsappNow")}
          </a>
        </div>
      </div>

      {/* SEO promo + internal-link keyword chips — kept last on every size so
          the widget stays high on the page (better conversion) while keeping
          the keyword relevance and internal links for search. */}
      <div className="order-4 relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-14 sm:pb-16">
        <p className="text-sm sm:text-base text-[#4B5563] lg:text-white/85 leading-relaxed max-w-2xl mx-auto text-center mt-8 mb-4">
          {t("promoText")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#6B7280] lg:text-white/80 mr-1">
            {t("searchKeywordsHeading")}
          </span>
          {[
            { label: t("keywordHotelTransfer"), href: "/booking" },
            { label: t("keywordPrivateHotel"), href: "/booking" },
            { label: t("keywordVipBelek"), href: "/belek-transfer" },
            { label: t("keywordBelekHotel"), href: "/belek-transfer" },
            { label: t("keywordSideHotel"), href: "/side-transfer" },
            { label: t("keywordAlanyaPrivate"), href: "/alanya-transfer" },
          ].map(({ label, href }) => (
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
    </section>
  );
}
