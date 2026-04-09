"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

export default function TestimonialsSection() {
  const t = useTranslations("testimonials");

  const testimonials = [
    { nameKey: "review1Name", fromKey: "review1From", textKey: "review1Text", rating: 5 },
    { nameKey: "review2Name", fromKey: "review2From", textKey: "review2Text", rating: 5 },
    { nameKey: "review3Name", fromKey: "review3From", textKey: "review3Text", rating: 5 },
    { nameKey: "review4Name", fromKey: "review4From", textKey: "review4Text", rating: 5 },
    { nameKey: "review5Name", fromKey: "review5From", textKey: "review5Text", rating: 5 },
  ];

  return (
    <section className="py-24 lg:py-32" style={{ backgroundColor: "#000" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
            {t("heading")}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t("subheading")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {testimonials.slice(0, 3).map((item) => (
            <div
              key={item.nameKey}
              className="p-6 sm:p-7 rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-0.5 mb-4" aria-label={`${item.rating} out of 5 stars`}>
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} size={14} className="text-orange-400 fill-orange-400" aria-hidden="true" />
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-5">
                &ldquo;{t(item.textKey)}&rdquo;
              </p>
              <div>
                <p className="text-white text-sm font-medium">{t(item.nameKey)}</p>
                <p className="text-gray-400 text-xs">{t(item.fromKey)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-5 mt-5 md:max-w-[66%] mx-auto">
          {testimonials.slice(3).map((item) => (
            <div
              key={item.nameKey}
              className="p-6 sm:p-7 rounded-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-0.5 mb-4" aria-label={`${item.rating} out of 5 stars`}>
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} size={14} className="text-orange-400 fill-orange-400" aria-hidden="true" />
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-5">
                &ldquo;{t(item.textKey)}&rdquo;
              </p>
              <div>
                <p className="text-white text-sm font-medium">{t(item.nameKey)}</p>
                <p className="text-gray-400 text-xs">{t(item.fromKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
