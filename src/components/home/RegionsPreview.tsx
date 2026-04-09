import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";

export default function RegionsPreview() {
  const t = useTranslations("regions");
  const c = useTranslations("common");

  const popularRegions = [
    { slug: "belek", name: "Belek", duration: 30, tagKey: "tagGolf" },
    { slug: "side", name: "Side", duration: 55, tagKey: "tagHistory" },
    { slug: "alanya", name: "Alanya", duration: 120, tagKey: "tagCoastal" },
    { slug: "kemer", name: "Kemer", duration: 40, tagKey: "tagNature" },
    { slug: "kundu", name: "Kundu · Lara", duration: 15, tagKey: "tagClosest" },
    { slug: "kas", name: "Kaş", duration: 180, tagKey: "tagHidden" },
  ];

  return (
    <section className="py-24 lg:py-32" style={{ backgroundColor: "#1d1d1f" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-3">
              {t("popularHeading")}
            </h2>
            <p className="text-gray-400 text-lg">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="/regions"
            className="inline-flex items-center gap-1.5 text-orange-400 text-sm font-medium hover:text-orange-300 transition-colors group shrink-0"
          >
            {t("allRegions")}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularRegions.map((region) => (
            <Link
              key={region.slug}
              href={`/${region.slug}-transfer`}
              className="group relative flex flex-col justify-end p-6 rounded-2xl overflow-hidden min-h-[200px] transition-all duration-300 hover:scale-[1.02]"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white text-xl font-semibold group-hover:text-orange-400 transition-colors">
                  {region.name}
                </h3>
                <ArrowUpRight size={16} className="text-gray-600 group-hover:text-orange-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <p className="text-gray-500 text-sm mb-3">{t(region.tagKey)}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} />
                <span>~{region.duration} {c("minutes")} {t("fromAirport").toLowerCase()}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
