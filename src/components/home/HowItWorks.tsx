"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

export default function HowItWorks() {
  const t = useTranslations("howItWorks");

  const steps = [
    { number: "1", titleKey: "step1Title", descKey: "step1Desc", color: "#60A5FA" },
    { number: "2", titleKey: "step2Title", descKey: "step2Desc", color: "#F97316" },
    { number: "3", titleKey: "step3Title", descKey: "step3Desc", color: "#34D399" },
  ];

  return (
    <section className="py-24 lg:py-32" style={{ backgroundColor: "#F5F5F7" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900 mb-4">
            {t("heading")}
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            {t("subheading")}
          </p>
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-semibold"
                style={{ color: step.color, backgroundColor: `${step.color}12`, border: `1px solid ${step.color}25` }}
              >
                {step.number}
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute top-7 left-[calc(50%+42px)] w-[calc(100%-84px)] h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
              )}
              <h3 className="text-gray-900 font-semibold text-lg mb-3">{t(step.titleKey)}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{t(step.descKey)}</p>
            </div>
          ))}
        </div>

        {/* Mobile: auto-cycling 1→2→3, no cards */}
        <MobileSteps steps={steps} t={t} />
      </div>
    </section>
  );
}

function MobileSteps({ steps, t }: { steps: { number: string; titleKey: string; descKey: string; color: string }[]; t: (key: string) => string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((a) => (a + 1) % steps.length), 3500);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="md:hidden text-center">
      <div className="relative overflow-hidden" style={{ height: 160 }}>
        {steps.map((step, i) => (
          <div
            key={step.number}
            className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-500"
            style={{
              opacity: i === active ? 1 : 0,
              transform: i === active ? "translateY(0)" : "translateY(12px)",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3 text-lg font-semibold"
              style={{ color: step.color, backgroundColor: `${step.color}12`, border: `1px solid ${step.color}25` }}
            >
              {step.number}
            </div>
            <h3 className="text-gray-900 font-semibold text-base mb-1">{t(step.titleKey)}</h3>
            <p className="text-gray-500 text-sm leading-relaxed px-6">{t(step.descKey)}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === active ? "bg-gray-700" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
