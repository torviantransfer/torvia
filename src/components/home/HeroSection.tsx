"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Shield, Clock, CheckCircle2 } from "lucide-react";
import BookingFormMini from "@/components/booking/BookingFormMini";

export default function HeroSection() {
  const t = useTranslations("hero");

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

        {/* Mini trust tags */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8">
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
      </div>

      {/* Bottom — Booking form bar */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-14 sm:pb-16">
        <BookingFormMini />
      </div>
    </section>
  );
}
