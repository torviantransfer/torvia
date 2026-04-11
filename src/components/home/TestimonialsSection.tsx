"use client";

import { useTranslations } from "next-intl";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const testimonials = [
    { nameKey: "review1Name", fromKey: "review1From", textKey: "review1Text", rating: 5 },
    { nameKey: "review2Name", fromKey: "review2From", textKey: "review2Text", rating: 5 },
    { nameKey: "review3Name", fromKey: "review3From", textKey: "review3Text", rating: 5 },
    { nameKey: "review4Name", fromKey: "review4From", textKey: "review4Text", rating: 5 },
    { nameKey: "review5Name", fromKey: "review5From", textKey: "review5Text", rating: 5 },
  ];

  const scrollTo = (idx: number) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const card = el.children[idx] as HTMLElement;
    if (card) {
      el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
      setCurrent(idx);
    }
  };

  // Auto-slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % testimonials.length;
        if (scrollRef.current) {
          const el = scrollRef.current;
          const card = el.children[next] as HTMLElement;
          if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#F5F5F7" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-3">
            {t("heading")}
          </h2>
          <p className="text-gray-500 text-base max-w-2xl mx-auto">
            {t("subheading")}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Nav arrows — desktop only */}
          <button
            type="button"
            onClick={() => scrollTo((current - 1 + testimonials.length) % testimonials.length)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-gray-600 hover:text-gray-900 transition-colors hidden md:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollTo((current + 1) % testimonials.length)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-gray-600 hover:text-gray-900 transition-colors hidden md:flex"
          >
            <ChevronRight size={18} />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-2 px-2"
            style={{ scrollbarWidth: "none" }}
          >
            {testimonials.map((item) => (
              <div
                key={item.nameKey}
                className="snap-center shrink-0 w-[85vw] sm:w-[340px] p-6 rounded-2xl"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  &ldquo;{t(item.textKey)}&rdquo;
                </p>
                <div>
                  <p className="text-gray-900 text-sm font-medium">{t(item.nameKey)}</p>
                  <p className="text-gray-500 text-xs">{t(item.fromKey)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                className={`h-2 rounded-full transition-all ${i === current ? "bg-gray-900 w-6" : "bg-gray-300 w-2"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

