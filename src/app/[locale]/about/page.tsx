import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { Shield, Users, Star, CheckCircle, Zap, Globe, CreditCard, Plane, Clock, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const title = `${t("heading")} | Antalya Airport VIP Transfer Service`;
  const description = t("subtitle");
  return {
    title,
    description,
    alternates: seoAlternates(locale, "/about"),
    openGraph: seoOpenGraph(locale, "/about", title, description),
    twitter: seoTwitter(title, description),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");

  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TORVIAN Transfer",
    url: "https://torviantransfer.com",
    logo: "https://torviantransfer.com/images/logo.png",
    description: "Professional VIP transfer service from Antalya Airport",
    foundingDate: "2020",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Antalya",
      addressCountry: "TR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+90-850-840-13-27",
      contactType: "customer service",
      availableLanguage: ["Turkish", "English", "German", "Russian", "Polish"],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pb-14 sm:pb-18 pt-24 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(0,122,255,0.06)" }} />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4">{t("title")}</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-gray-900">{t("heading")}</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{t("subtitle")}</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="space-y-5">
              <p className="text-gray-500 text-lg leading-relaxed">{t("paragraph1")}</p>
              <p className="text-gray-500 text-lg leading-relaxed">{t("paragraph2")}</p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 mt-14">
              {[
                { icon: Shield, value: "15,000+", labelKey: "statTransfers", color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
                { icon: Star, value: "4.9", labelKey: "statRating", color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
                { icon: Users, value: "24/7", labelKey: "statSupport", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
              ].map(({ icon: Icon, value, labelKey, color, bg }) => (
                <div key={labelKey} className="text-center p-6 sm:p-8 rounded-2xl" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                    <Icon size={22} style={{ color }} strokeWidth={1.5} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
                  <p className="text-sm text-gray-500 mt-1 font-medium">{t(labelKey)}</p>
                </div>
              ))}
            </div>

            {/* Why Choose Us */}
            <div className="mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">{t("whyChoose")}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: CheckCircle, titleKey: "feature1Title", descKey: "feature1Desc", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
                  { icon: Zap, titleKey: "feature2Title", descKey: "feature2Desc", color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
                  { icon: Globe, titleKey: "feature3Title", descKey: "feature3Desc", color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
                  { icon: Shield, titleKey: "feature4Title", descKey: "feature4Desc", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
                ].map(({ icon: Icon, titleKey, descKey, color, bg }) => (
                  <div key={titleKey} className="flex items-start gap-4 p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                      <Icon size={18} style={{ color }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">{t(titleKey)}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{t(descKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badges Strip */}
            <div className="mt-16 rounded-2xl p-5 sm:p-8" style={{ backgroundColor: "#F9FAFB", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 text-center">
                {[
                  { icon: CreditCard, label: t("trustStripePayments"), color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
                  { icon: Shield, label: t("trustInsured"), color: "#34C759", bg: "rgba(52,199,89,0.08)" },
                  { icon: Plane, label: t("trustFlightTracking"), color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
                  { icon: Clock, label: t("trustFreeCancellation"), color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
                  { icon: Star, label: t("trustSince"), color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
                ].map(({ icon: Icon, label, color, bg }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: bg }}>
                      <Icon size={16} style={{ color }} strokeWidth={1.5} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Image */}
            <div className="mt-16 relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <Image
                src="/images/vehicles/mercedes-vito-vip.png"
                alt="Mercedes Vito VIP Transfer Vehicle"
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-white font-bold text-lg">Mercedes Vito VIP</p>
                <p className="text-white/80 text-sm">{t("vehicleOverlay")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">{t("ourStoryTag")}</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-5 tracking-tight">{t("ourStoryTitle")}</h2>
                <div className="space-y-4 text-gray-500 leading-relaxed">
                  <p>{t("ourStoryP1")}</p>
                  <p>{t("ourStoryP2")}</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { year: "2022", eventKey: "timeline2022" },
                  { year: "2023", eventKey: "timeline2023" },
                  { year: "2024", eventKey: "timeline2024" },
                  { year: "2025", eventKey: "timeline2025" },
                ].map(({ year, eventKey }) => (
                  <div key={year} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600" style={{ backgroundColor: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.15)" }}>{year.slice(2)}</div>
                      <div className="flex-1 w-px mt-1" style={{ backgroundColor: "rgba(0,122,255,0.2)" }} />
                    </div>
                    <div className="pb-4">
                      <p className="text-xs text-blue-600 font-semibold mb-1">{year}</p>
                      <p className="text-gray-500 text-sm">{t(eventKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Fleet section */}
        <section className="py-20" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">{t("fleetTag")}</p>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("fleetTitle")}</h2>
              <p className="text-gray-500 mt-3 max-w-lg mx-auto">{t("fleetDesc")}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  name: "Mercedes Vito VIP",
                  capacityKey: "vitoCapacity",
                  luggageKey: "vitoLuggage",
                  featureKeys: ["featLeather", "featClimate", "featWifi", "featChildSeat"],
                },
                {
                  name: "Mercedes Sprinter VIP",
                  capacityKey: "sprinterCapacity",
                  luggageKey: "sprinterLuggage",
                  featureKeys: ["featPanorama", "featAirCon", "featUsb", "featLegRoom"],
                },
              ].map(({ name, capacityKey, luggageKey, featureKeys }) => (
                <div key={name} className="p-6 rounded-2xl relative overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}><div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #007AFF, #34C759)" }} />
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{name}</h3>
                  <div className="flex gap-3 mb-4">
                    <span className="text-xs px-3 py-1 rounded-full font-medium text-blue-600" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>{t(capacityKey)}</span>
                    <span className="text-xs px-3 py-1 rounded-full font-medium text-gray-500" style={{ backgroundColor: "rgba(0,0,0,0.04)" }}>{t(luggageKey)}</span>
                  </div>
                  <ul className="space-y-2">
                    {featureKeys.map((fKey) => (
                      <li key={fKey} className="flex items-center gap-2 text-sm text-gray-500">
                        <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" strokeWidth={2} />
                        {t(fKey)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Regions covered */}
        <section className="py-20" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", backgroundColor: "#F5F5F7" }}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">{t("coverageTag")}</p>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("coverageTitle")}</h2>
              <p className="text-gray-500 mt-3">{t("coverageDesc")}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {["Antalya City", "Alanya", "Side", "Belek", "Kemer", "Manavgat", "Kaş", "Kalkan", "Lara", "Kundu", "Göynük", "Çamyuva"].map((region) => (
                <span key={region} className="px-4 py-2 rounded-full text-sm text-gray-600 font-medium" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  {region}
                </span>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white transition-colors hover:brightness-110" style={{ backgroundColor: "#FF9500" }}>
                Book Your Transfer
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
