"use client";

import { useTranslations } from "next-intl";
import { Shield, Clock, Plane, Headset } from "lucide-react";
import { useState, useEffect } from "react";

export default function TrustBadges() {
  const t = useTranslations("trust");
  const [active, setActive] = useState(0);

  const badges = [
    { icon: Shield, titleKey: "licensedTitle", descKey: "licensedDesc", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
    { icon: Headset, titleKey: "conciergeTitle", descKey: "conciergeDesc", color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
    { icon: Plane, titleKey: "flightTitle", descKey: "flightDesc", color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
    { icon: Clock, titleKey: "punctualTitle", descKey: "punctualDesc", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActive((a) => (a + 1) % badges.length), 3000);
    return () => clearInterval(timer);
  }, [badges.length]);

  return (
    <section
      className="py-8 sm:py-10 border-b"
      style={{ backgroundColor: "#FAFAFA", borderColor: "rgba(0,0,0,0.06)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Desktop: 4-column grid */}
        <div className="hidden md:grid grid-cols-4 gap-8">
          {badges.map(({ icon: Icon, titleKey, descKey, color, bg }) => (
            <div key={titleKey} className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: bg, border: `1px solid ${color}20` }}
              >
                <Icon size={20} style={{ color }} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 leading-tight">{t(titleKey)}</p>
                <p className="text-xs text-gray-500 leading-snug mt-0.5">{t(descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: single item, auto-cycling */}
        <div className="md:hidden">
          <div className="relative overflow-hidden" style={{ height: 72 }}>
            {badges.map(({ icon: Icon, titleKey, descKey, color, bg }, i) => (
              <div
                key={titleKey}
                className="absolute inset-0 flex items-center justify-center gap-3 px-4 transition-all duration-500"
                style={{
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? "translateY(0)" : "translateY(8px)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: bg, border: `1px solid ${color}20` }}
                >
                  <Icon size={18} style={{ color }} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{t(titleKey)}</p>
                  <p className="text-xs text-gray-500 leading-snug mt-0.5">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {badges.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === active ? "bg-gray-700" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

