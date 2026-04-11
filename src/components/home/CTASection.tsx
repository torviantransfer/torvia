"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  const t = useTranslations("cta");

  return (
    <section className="py-24 lg:py-32" style={{ backgroundColor: "#F5F5F7" }}>
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900 mb-5">
          {t("heading")}
        </h2>
        <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
          {t("subheading")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold rounded-full transition-all hover:brightness-110"
            style={{ backgroundColor: '#007AFF', color: '#fff' }}
          >
            {t("bookTransfer")}
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-3.5 text-sm font-medium rounded-full text-gray-500 hover:text-gray-900 transition-colors"
            style={{ border: "1px solid rgba(0,0,0,0.15)" }}
          >
            {t("contactUs")}
          </Link>
        </div>
      </div>
    </section>
  );
}
