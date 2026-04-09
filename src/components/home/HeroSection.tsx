"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Shield, Plane, Clock, Star, CheckCircle2 } from "lucide-react";
import BookingFormMini from "@/components/booking/BookingFormMini";

export default function HeroSection() {
  const t = useTranslations("hero");
  const n = useTranslations("nav");

  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #000 0%, #1d1d1f 100%)" }}>
      {/* Airport background image */}
      <div className="absolute inset-0 opacity-30">
        <Image
          src="/images/hero-travel-world.jpg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
      </div>
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)" }} />

      <div className="relative max-w-6xl mx-auto px-6 py-16 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Mobile: Booking form first, Desktop: second */}
          <div className="order-2 lg:order-1">
            {/* Social proof bar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)" }}>
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span>4.9/5</span>
                <span className="text-gray-400 ml-0.5">— 15,000+ {t("transfers")}</span>
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-orange-400" style={{ backgroundColor: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}>
                <CheckCircle2 size={12} />
                {t("licensedInsured")}
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight text-white mb-5">
              {t("title")}
            </h1>
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed mb-6 max-w-lg">
              {t("subtitle")}
            </p>
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-300">
                <Plane size={13} className="text-orange-400" />
                {t("flightTracking")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-300">
                <Clock size={13} className="text-green-400" />
                {t("service247")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-300">
                <Shield size={13} className="text-orange-400" />
                {t("fixedPrice")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Link
                href="/booking"
                className="inline-flex items-center px-7 py-3 text-sm font-semibold rounded-full transition-all hover:brightness-110"
                style={{ backgroundColor: '#F97316', color: '#fff' }}
              >
                {n("bookNow")}
              </Link>
              <Link
                href="/regions"
                className="inline-flex items-center px-7 py-3 text-sm font-medium rounded-full text-orange-400 hover:text-orange-300 transition-colors"
                style={{ border: "1px solid rgba(249,115,22,0.3)" }}
              >
                {t("exploreRegions")}
              </Link>
            </div>
            {/* Bottom trust strip */}
            <p className="text-xs text-gray-500">
              ✓ {t("trustStripe")} &nbsp;·&nbsp; ✓ {t("trustCancel")} &nbsp;·&nbsp; ✓ {t("trustNoHidden")}
            </p>
          </div>

          {/* Booking form - shows first on mobile */}
          <div className="order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-none">
            <BookingFormMini />
          </div>
        </div>
      </div>
    </section>
  );
}
