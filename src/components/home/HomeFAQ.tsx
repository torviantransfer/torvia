"use client";

import { useTranslations } from "next-intl";
import { HelpCircle } from "lucide-react";

export default function HomeFAQ() {
  const t = useTranslations("homeFaq");

  const faqs = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
    { q: t("q6"), a: t("a6") },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <section className="py-24 lg:py-32" style={{ backgroundColor: "#FFFFFF" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-blue-600 mb-4" style={{ backgroundColor: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.15)" }}>
            <HelpCircle size={14} />
            {t("badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900 mb-4">
            {t("heading")}
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            {t("subheading")}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-2xl overflow-hidden"
              style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <summary className="flex items-center justify-between cursor-pointer p-5 text-gray-900 font-medium text-sm sm:text-base hover:text-blue-600 transition-colors list-none [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl ml-4 shrink-0">+</span>
              </summary>
              <div className="px-5 pb-5 text-gray-500 text-sm leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
