import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function RegionsPreview() {
  const t = useTranslations("regions");
  const tNav = useTranslations("nav");

  const popularRegions = [
    { slug: "belek", name: "Belek", descKey: "belekDesc", image: "/images/regions/belek-golf.jpg" },
    { slug: "side", name: "Side", descKey: "sideDesc", image: "/images/regions/side-ancient.jpg" },
    { slug: "alanya", name: "Alanya", descKey: "alanyaDesc", image: "/images/regions/alanya-castle.jpg" },
    { slug: "kemer", name: "Kemer", descKey: "kemerDesc", image: "/images/regions/kemer-coast.webp" },
    { slug: "kundu-lara", name: "Kundu-Lara", descKey: "kunduDesc", image: "/images/regions/kundu-lara.jpg" },
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
            {t("introText")}
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
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
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
                  /* Tinted, not filled. Six solid navy buttons in one grid were
                     six equal calls to action and a third button colour on the
                     site; a pale-blue tint keeps each one findable without the
                     grid shouting. Centred and allowed to wrap as a block, so a
                     long name like "Kundu-Lara" breaks onto two tidy lines. */
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-[#EAF4FF] px-3 py-2.5 text-center text-[14px] font-semibold leading-snug text-[#007AFF] transition hover:bg-[#D6E9FF]"
                >
                  <span>{t("bookRegionTransfer", { name: region.name })}</span>
                  <ArrowRight size={14} className="shrink-0 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <Link
            href="/booking"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#007AFF] px-6 text-[15px] font-semibold text-white transition hover:bg-[#0062CC]"
          >
            {tNav("bookNow")}
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/regions"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-6 text-[15px] font-semibold text-[#007AFF] ring-1 ring-black/[0.1] transition hover:bg-black/[0.03]"
          >
            {t("allRegions")}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
