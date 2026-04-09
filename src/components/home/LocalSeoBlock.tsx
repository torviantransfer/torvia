"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MapPin, Plane, Shield, Star } from "lucide-react";

export default function LocalSeoBlock() {
  const t = useTranslations("localSeo");

  const destinations = [
    { label: "Belek Transfer", slug: "belek" },
    { label: "Side Transfer", slug: "side" },
    { label: "Alanya Transfer", slug: "alanya" },
    { label: "Kemer Transfer", slug: "kemer" },
    { label: "Kundu-Lara Transfer", slug: "kundu-lara" },
    { label: "Kaş Transfer", slug: "kas" },
    { label: "Fethiye Transfer", slug: "fethiye" },
    { label: "Marmaris Transfer", slug: "marmaris" },
    { label: "Manavgat Transfer", slug: "manavgat" },
    { label: "Beldibi Transfer", slug: "beldibi" },
    { label: "Kalkan Transfer", slug: "kalkan" },
    { label: "Tekirova Transfer", slug: "tekirova" },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#000" }}>
      <div className="max-w-4xl mx-auto px-6">
        {/* SEO heading */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-4">
            {t("heading")}
          </h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-3xl mx-auto">
            {t("paragraph1")}
          </p>
        </div>

        {/* Destination tags — internal links for SEO */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {destinations.map((dest) => (
            <Link
              key={dest.slug}
              href={`/${dest.slug}-transfer`}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-400 hover:text-orange-400 hover:border-orange-400/30 transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <MapPin size={10} className="inline mr-1" />
              {dest.label}
            </Link>
          ))}
        </div>

        {/* SEO paragraphs */}
        <div className="space-y-5 text-gray-500 text-sm leading-relaxed">
          <p>{t("paragraph2")}</p>
          <p>{t("paragraph3")}</p>
        </div>

        {/* Mini feature icons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
          {[
            { icon: Plane, label: t("feat1") },
            { icon: Shield, label: t("feat2") },
            { icon: Star, label: t("feat3") },
            { icon: MapPin, label: t("feat4") },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-gray-500 text-xs">
              <Icon size={14} className="text-orange-400 shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
