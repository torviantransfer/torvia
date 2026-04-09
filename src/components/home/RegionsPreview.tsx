import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";
import Image from "next/image";

export default function RegionsPreview() {
  const t = useTranslations("regions");
  const c = useTranslations("common");

  const popularRegions = [
    { slug: "belek", name: "Belek", duration: 30, tagKey: "tagGolf", image: "/images/regions/belek-golf.jpg" },
    { slug: "side", name: "Side", duration: 55, tagKey: "tagHistory", image: "/images/regions/side-ancient.jpg" },
    { slug: "alanya", name: "Alanya", duration: 120, tagKey: "tagCoastal", image: "/images/regions/alanya-castle.jpg" },
    { slug: "kemer", name: "Kemer", duration: 40, tagKey: "tagNature", image: "/images/regions/kemer-coast.webp" },
    { slug: "kundu", name: "Kundu · Lara", duration: 15, tagKey: "tagClosest", image: "/images/regions/kundu-lara.jpg" },
    { slug: "kas", name: "Kaş", duration: 180, tagKey: "tagHidden", image: "/images/regions/kas-beach.webp" },
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
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Image
                src={region.image}
                alt={`${region.name} transfer from Antalya Airport`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white text-xl font-semibold group-hover:text-orange-400 transition-colors">
                    {region.name}
                  </h3>
                  <ArrowUpRight size={16} className="text-gray-400 group-hover:text-orange-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p className="text-gray-300 text-sm mb-3">{t(region.tagKey)}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>~{region.duration} {c("minutes")} {t("fromAirport").toLowerCase()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
