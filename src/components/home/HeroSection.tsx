"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Shield, Clock, CheckCircle2, Phone, MessageCircle } from "lucide-react";
import BookingFormMini from "@/components/booking/BookingFormMini";

const CONTACT_PHONE = "905469407955";
const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "905469407955";

export default function HeroSection() {
  const t = useTranslations("hero");
  const c = useTranslations("common");
  const whatsappHref = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(c("whatsappMessage"))}`;

  return (
    <section className="relative min-h-[70vh] sm:min-h-[75vh] flex flex-col justify-between -mt-16">
      {/* Full-width background image */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/5312.jpg"
          alt="Antalya airport VIP transfer service - luxury vehicle on highway"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
          quality={80}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      </div>

      {/* Top content — Title + subtitle */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-4 sm:px-6 pt-28 lg:pt-32">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-white text-center mb-4">
          {t("title")}
        </h1>
        <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto text-center mb-6">
          {t("subtitle")}
        </p>
        <p className="text-sm sm:text-base text-white/85 leading-relaxed max-w-2xl mx-auto text-center mb-4">
          {t("promoText")}
        </p>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] sm:text-sm font-medium text-white/90 mb-6 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          {t("badgePill")}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-4xl">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white/80 mr-1">
            {t("searchKeywordsHeading")}
          </span>
          {[
            t("keywordHotelTransfer"),
            t("keywordPrivateHotel"),
            t("keywordVipBelek"),
            t("keywordBelekHotel"),
            t("keywordSideHotel"),
            t("keywordAlanyaPrivate"),
          ].map((keyword) => (
            <span
              key={keyword}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] sm:text-xs text-white/90 backdrop-blur"
            >
              {keyword}
            </span>
          ))}
        </div>

        {/* Mini trust tags */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6">
          <span className="flex items-center gap-1.5 text-[13px] sm:text-sm text-white/90">
            <Shield size={14} className="text-green-400" />
            {t("fixedPrice")}
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-white/40 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-[13px] sm:text-sm text-white/90">
            <Clock size={14} className="text-green-400" />
            {t("service247")}
          </span>
          <span className="w-[3px] h-[3px] rounded-full bg-white/40 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-[13px] sm:text-sm text-white/90">
            <CheckCircle2 size={14} className="text-green-400" />
            {t("trustCancel")}
          </span>
        </div>

        {/* Quick contact CTAs (mobile-first conversion) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
          <a
            href={`tel:${CONTACT_PHONE}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-gray-900 text-sm font-semibold shadow-lg transition"
            aria-label={t("callNow")}
          >
            <Phone size={16} className="text-blue-600" aria-hidden="true" />
            {t("callNow")}
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/95 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg transition"
            aria-label={t("whatsappNow")}
          >
            <MessageCircle size={16} aria-hidden="true" />
            {t("whatsappNow")}
          </a>
        </div>
      </div>

      {/* Bottom — Booking form bar */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-14 sm:pb-16">
        <BookingFormMini />
      </div>
    </section>
  );
}
