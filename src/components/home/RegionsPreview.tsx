import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function RegionsPreview() {
  const t = useTranslations("regions");

  const popularRegions = [
    { slug: "belek", name: "Belek", descKey: "belekDesc", image: "/images/regions/belek-golf.jpg" },
    { slug: "side", name: "Side", descKey: "sideDesc", image: "/images/regions/side-ancient.jpg" },
    { slug: "alanya", name: "Alanya", descKey: "alanyaDesc", image: "/images/regions/alanya-castle.jpg" },
    { slug: "kemer", name: "Kemer", descKey: "kemerDesc", image: "/images/regions/kemer-coast.webp" },
    { slug: "kundu", name: "Kundu", descKey: "kunduDesc", image: "/images/regions/kundu-lara.jpg" },
    { slug: "kas", name: "Kaş", descKey: "kasDesc", image: "/images/regions/kas-beach.webp" },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-3">
            {t("popularHeading")}
          </h2>
          <p className="text-gray-500 text-base max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularRegions.map((region) => (
            <div
              key={region.slug}
              className="group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}
            >
              {/* Photo */}
              <div className="relative h-48 sm:h-52 overflow-hidden">
                <Image
                  src={region.image}
                  alt={`${region.name} transfer from Antalya Airport`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {region.name}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">
                  {t(region.descKey)}
                </p>
                <Link
                  href={`/${region.slug}-transfer`}
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: "#1B3A5C" }}
                >
                  {t("viewDetails")}
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* All regions link */}
        <div className="text-center mt-10">
          <Link
            href="/regions"
            className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors group"
          >
            {t("allRegions")}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
