import { useTranslations } from "next-intl";
import {
  Shield,
  Clock,
  MapPin,
  Headset,
  CreditCard,
  Plane,
} from "lucide-react";

export default function TrustBadges() {
  const t = useTranslations("trust");

  const features = [
    { icon: Shield, titleKey: "licensedTitle", descKey: "licensedDesc", color: "#34D399" },
    { icon: Clock, titleKey: "punctualTitle", descKey: "punctualDesc", color: "#60A5FA" },
    { icon: MapPin, titleKey: "doorToDoorTitle", descKey: "doorToDoorDesc", color: "#F97316" },
    { icon: Headset, titleKey: "conciergeTitle", descKey: "conciergeDesc", color: "#A78BFA" },
    { icon: CreditCard, titleKey: "pricingTitle", descKey: "pricingDesc", color: "#FBBF24" },
    { icon: Plane, titleKey: "flightTitle", descKey: "flightDesc", color: "#F472B6" },
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, titleKey, descKey, color }) => (
            <div
              key={titleKey}
              className="group p-7 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon size={20} style={{ color }} strokeWidth={1.5} />
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{t(titleKey)}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
