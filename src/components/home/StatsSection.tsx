"use client";

import { useTranslations } from "next-intl";

export default function StatsSection() {
  const t = useTranslations("stats");

  const stats = [
    { value: "15,000+", labelKey: "transfers" },
    { value: "98%", labelKey: "satisfaction" },
    { value: "25+", labelKey: "destinations" },
    { value: "4.9", labelKey: "rating" },
  ];

  return (
    <section className="py-20" style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat) => (
            <div key={stat.labelKey} className="text-center">
              <p className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-gray-900 mb-2">
                {stat.value}
              </p>
              <p className="text-gray-500 text-sm">{t(stat.labelKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
