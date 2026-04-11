const fs = require("fs");
const path = require("path");

const base = __dirname;

function readFile(rel) {
  return fs.readFileSync(path.join(base, rel), "utf8");
}

function writeFile(rel, content) {
  fs.writeFileSync(path.join(base, rel), content, "utf8");
  console.log(`✅ ${rel}`);
}

// ===== 1. HeroSection — title ABOVE form, booking bar at bottom like kalkanvip =====
{
  const file = "src/components/home/HeroSection.tsx";
  const content = `"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Shield, Clock, CheckCircle2 } from "lucide-react";
import BookingFormMini from "@/components/booking/BookingFormMini";

export default function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex flex-col justify-between overflow-hidden -mt-16">
      {/* Full-width background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-travel-world.webp"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      </div>

      {/* Top content — Title + subtitle */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-4 sm:px-6 pt-28 lg:pt-32">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-white text-center mb-4">
          {t("title")}
        </h1>
        <p className="text-base sm:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto text-center mb-6">
          {t("subtitle")}
        </p>

        {/* Mini trust tags */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <span className="flex items-center gap-1.5 text-sm text-white/80">
            <Shield size={14} className="text-blue-400" />
            {t("fixedPrice")}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/30 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-sm text-white/80">
            <Clock size={14} className="text-green-400" />
            {t("service247")}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/30 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-sm text-white/80">
            <CheckCircle2 size={14} className="text-blue-400" />
            {t("trustCancel")}
          </span>
        </div>
      </div>

      {/* Bottom — Booking form bar */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        <BookingFormMini />
      </div>
    </section>
  );
}
`;
  writeFile(file, content);
}

// ===== 2. TrustBadges — 4 items, single row, minimal like kalkanvip =====
{
  const file = "src/components/home/TrustBadges.tsx";
  const content = `import { useTranslations } from "next-intl";
import { Shield, Clock, Plane, Headset } from "lucide-react";

export default function TrustBadges() {
  const t = useTranslations("trust");

  const badges = [
    { icon: Shield, titleKey: "licensedTitle", descKey: "licensedDesc", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
    { icon: Headset, titleKey: "conciergeTitle", descKey: "conciergeDesc", color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
    { icon: Plane, titleKey: "flightTitle", descKey: "flightDesc", color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
    { icon: Clock, titleKey: "punctualTitle", descKey: "punctualDesc", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
  ];

  return (
    <section className="py-8 sm:py-10 border-b" style={{ backgroundColor: "#FAFAFA", borderColor: "rgba(0,0,0,0.06)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {badges.map(({ icon: Icon, titleKey, descKey, color, bg }) => (
            <div key={titleKey} className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: bg, border: \`1px solid \${color}20\` }}
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
      </div>
    </section>
  );
}
`;
  writeFile(file, content);
}

// ===== 3. RegionsPreview — Card with photo TOP, title + desc + button BELOW like kalkanvip =====
{
  const file = "src/components/home/RegionsPreview.tsx";
  const content = `import { useTranslations } from "next-intl";
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
    { slug: "kundu", name: "Kundu · Lara", descKey: "kunduDesc", image: "/images/regions/kundu-lara.jpg" },
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
                  alt={\`\${region.name} transfer from Antalya Airport\`}
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
                  href={\`/\${region.slug}-transfer\`}
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
`;
  writeFile(file, content);
}

// ===== 4. LocalSeoBlock — Text left + Photo grid right like kalkanvip =====
{
  const file = "src/components/home/LocalSeoBlock.tsx";
  const content = `"use client";

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
                  href={\`/\${dest.slug}-transfer\`}
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
`;
  writeFile(file, content);
}

// ===== 5. Add missing translation keys to all 5 locale files =====
const localeDir = path.join(base, "src/messages");

const regionDescs = {
  tr: {
    belekDesc: "Antalya Havalimanı'ndan Belek'e özel VIP transfer. Golf otelleri, lüks resort'lar ve sahil bölgelerine kapıdan kapıya hizmet.",
    sideDesc: "Antik kent Side'ye konforlu ve güvenli transfer hizmeti. Tarihi kalıntılar, sahil şeridi ve hareketli gece hayatı sizi bekliyor.",
    alanyaDesc: "Alanya'ya Antalya Havalimanı'ndan özel transfer. Kale, Kleopatra Plajı ve çevresindeki tatil beldelerine ulaşım.",
    kemerDesc: "Kemer'e doğa ve deniz arasında huzurlu bir transfer deneyimi. Çamyuva, Göynük, Beldibi, Tekirova bölgelerine hizmet.",
    kunduDesc: "Antalya'nın en yakın tatil bölgesi Kundu-Lara'ya hızlı ve ekonomik havalimanı transferi. Her şey dahil otellere kolay erişim.",
    kasDesc: "Akdeniz'in saklı cenneti Kaş'a özel transfer. Turkuaz koylar, dalış noktaları ve otantik kasaba atmosferi.",
    viewDetails: "Detayları Gör",
  },
  en: {
    belekDesc: "Private VIP transfer from Antalya Airport to Belek. Door-to-door service to golf resorts, luxury hotels, and beachfront properties.",
    sideDesc: "Comfortable and safe transfer to ancient Side. Explore historic ruins, sandy beaches, and vibrant nightlife along the coast.",
    alanyaDesc: "Private transfer from Antalya Airport to Alanya. Easy access to Alanya Castle, Cleopatra Beach, and surrounding resorts.",
    kemerDesc: "Peaceful transfer to Kemer between mountains and sea. Service to Çamyuva, Göynük, Beldibi, and Tekirova areas.",
    kunduDesc: "Fast and affordable airport transfer to Kundu-Lara, the closest resort area. Easy access to all-inclusive hotels.",
    kasDesc: "Private transfer to Kaş, the hidden gem of the Mediterranean. Turquoise bays, diving spots, and authentic town charm.",
    viewDetails: "View Details",
  },
  de: {
    belekDesc: "Privater VIP-Transfer vom Flughafen Antalya nach Belek. Tür-zu-Tür-Service zu Golfresorts, Luxushotels und Strandanlagen.",
    sideDesc: "Komfortabler und sicherer Transfer in die antike Stadt Side. Historische Ruinen, Sandstrände und lebendiges Nachtleben.",
    alanyaDesc: "Privattransfer vom Flughafen Antalya nach Alanya. Einfacher Zugang zur Burg, Kleopatra-Strand und umliegenden Resorts.",
    kemerDesc: "Entspannter Transfer nach Kemer zwischen Bergen und Meer. Service nach Çamyuva, Göynük, Beldibi und Tekirova.",
    kunduDesc: "Schneller und günstiger Flughafentransfer nach Kundu-Lara, dem nächstgelegenen Feriengebiet. Zugang zu All-Inclusive-Hotels.",
    kasDesc: "Privattransfer nach Kaş, dem Geheimtipp am Mittelmeer. Türkisfarbene Buchten, Tauchspots und authentischer Charme.",
    viewDetails: "Details Ansehen",
  },
  pl: {
    belekDesc: "Prywatny transfer VIP z lotniska Antalya do Belek. Transport od drzwi do drzwi do kurortów golfowych i luksusowych hoteli.",
    sideDesc: "Komfortowy i bezpieczny transfer do starożytnego Side. Historyczne ruiny, piaszczyste plaże i tętniące życiem nocnym wybrzeże.",
    alanyaDesc: "Prywatny transfer z lotniska Antalya do Alanya. Łatwy dostęp do zamku, plaży Kleopatry i okolicznych kurortów.",
    kemerDesc: "Spokojny transfer do Kemer między górami a morzem. Obsługa regionów Çamyuva, Göynük, Beldibi i Tekirova.",
    kunduDesc: "Szybki i przystępny cenowo transfer z lotniska do Kundu-Lara, najbliższego regionu wypoczynkowego. Dostęp do hoteli all-inclusive.",
    kasDesc: "Prywatny transfer do Kaş, ukrytej perły Morza Śródziemnego. Turkusowe zatoki, nurkowanie i autentyczny urok miasteczka.",
    viewDetails: "Zobacz Szczegóły",
  },
  ru: {
    belekDesc: "Частный VIP-трансфер из аэропорта Анталии в Белек. Услуга от двери до двери до гольф-курортов, роскошных отелей и пляжных комплексов.",
    sideDesc: "Комфортный и безопасный трансфер в античный Сиде. Исторические руины, песчаные пляжи и оживлённая ночная жизнь.",
    alanyaDesc: "Частный трансфер из аэропорта Анталии в Аланью. Лёгкий доступ к крепости, пляжу Клеопатры и окрестным курортам.",
    kemerDesc: "Спокойный трансфер в Кемер между горами и морем. Обслуживание районов Чамьюва, Гёйнюк, Бельдиби и Текирова.",
    kunduDesc: "Быстрый и доступный трансфер из аэропорта в Кунду-Лару, ближайший курортный район. Лёгкий доступ к отелям всё включено.",
    kasDesc: "Частный трансфер в Каш — скрытую жемчужину Средиземноморья. Бирюзовые бухты, дайвинг и подлинное очарование городка.",
    viewDetails: "Подробнее",
  },
};

const localSeoExtra = {
  tr: {
    subHeading: "Profesyonel ve Güvenilir Transfer Deneyimi",
    readMore: "Hemen Rezervasyon Yap →",
  },
  en: {
    subHeading: "Professional and Reliable Transfer Experience",
    readMore: "Book Your Transfer Now →",
  },
  de: {
    subHeading: "Professionelles und Zuverlässiges Transfer-Erlebnis",
    readMore: "Jetzt Transfer Buchen →",
  },
  pl: {
    subHeading: "Profesjonalne i Niezawodne Usługi Transferowe",
    readMore: "Zarezerwuj Transfer Teraz →",
  },
  ru: {
    subHeading: "Профессиональный и Надёжный Трансфер",
    readMore: "Забронировать Трансфер →",
  },
};

for (const lang of ["tr", "en", "de", "pl", "ru"]) {
  const filePath = path.join(localeDir, `${lang}.json`);
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // Add region descriptions
  Object.assign(json.regions, regionDescs[lang]);

  // Add localSeo extra keys
  Object.assign(json.localSeo, localSeoExtra[lang]);

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`✅ ${lang}.json — translation keys added`);
}

console.log("\\n🎉 All redesigns applied!");
