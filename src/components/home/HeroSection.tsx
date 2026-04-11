"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Shield, Clock, CheckCircle2 } from "lucide-react";
import BookingFormMini from "@/components/booking/BookingFormMini";

export default function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden -mt-16">
      {/* Full-width background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-travel-world.webp"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16 lg:pt-36 lg:pb-20 text-center">
        {/* Booking search form */}
        <BookingFormMini />

        {/* Main headline BELOW form */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight text-white mt-10 mb-4">
          {t("title")}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
          {t("subtitle")}
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-5">
          <span className="flex items-center gap-1.5 text-sm text-white/80">
            <Shield size={14} className="text-orange-400" />
            {t("fixedPrice")}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/30 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-sm text-white/80">
            <Clock size={14} className="text-green-400" />
            {t("service247")}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/30 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-sm text-white/80">
            <CheckCircle2 size={14} className="text-blue-400" />
            {t("trustCancel")}
          </span>
        </div>
      </div>
    </section>
  );
}
