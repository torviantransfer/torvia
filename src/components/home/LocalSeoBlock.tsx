"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MapPin } from "lucide-react";
import Image from "next/image";

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
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left — SEO text content */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-6">
              {t("heading")}
            </h2>
            <div className="space-y-4 text-gray-600 text-[15px] leading-relaxed">
              <p>{t("paragraph1")}</p>
              <p>{t("paragraph2")}</p>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">
              {t("subHeading")}
            </h3>
            <div className="space-y-4 text-gray-600 text-[15px] leading-relaxed">
              <p>{t("paragraph3")}</p>
            </div>

            {/* Read more / Book link */}
            <Link
              href="/booking"
              className="inline-flex items-center gap-1 mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors"
            >
              {t("readMore")}
            </Link>

            {/* Destination tags — SEO internal links */}
            <div className="flex flex-wrap gap-2 mt-8">
              {destinations.map((dest) => (
                <Link
                  key={dest.slug}
                  href={`/${dest.slug}-transfer`}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:text-blue-600 hover:border-blue-400/40 transition-colors"
                  style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <MapPin size={10} className="inline mr-1" />
                  {dest.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right — Photo grid like kalkanvip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src="/images/regions/belek-golf.jpg"
                alt="VIP transfer service"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src="/images/regions/side-ancient.jpg"
                alt="Premium airport transfer"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src="/images/regions/kemer-coast.webp"
                alt="Comfortable transfer vehicles"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src="/images/regions/kas-beach.webp"
                alt="Professional transfer drivers"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
