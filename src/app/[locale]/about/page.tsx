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
        <section className="relative py-24 overflow-hidden" style={{ background: "linear-gradient(180deg, #1c1c1e 0%, #111113 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(249,115,22,0.15)" }} />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-orange-400 uppercase tracking-widest mb-4">{t("title")}</p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-5 tracking-tight text-white">{t("heading")}</h1>
            <p className="text-[#86868b] text-lg max-w-xl mx-auto">{t("subtitle")}</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="space-y-5">
              <p className="text-[#86868b] text-lg leading-relaxed">{t("paragraph1")}</p>
              <p className="text-[#86868b] text-lg leading-relaxed">{t("paragraph2")}</p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 mt-14">
              {[
                { icon: Shield, value: "15,000+", labelKey: "statTransfers" },
                { icon: Star, value: "4.9", labelKey: "statRating" },
                { icon: Users, value: "24/7", labelKey: "statSupport" },
              ].map(({ icon: Icon, value, labelKey }) => (
                <div key={labelKey} className="text-center p-6 sm:p-8 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(249,115,22,0.1)" }}>
                    <Icon size={22} className="text-orange-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
                  <p className="text-sm text-[#86868b] mt-1 font-medium">{t(labelKey)}</p>
                </div>
              ))}
            </div>

            {/* Why Choose Us */}
            <div className="mt-20">
              <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">{t("whyChoose")}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: CheckCircle, titleKey: "feature1Title", descKey: "feature1Desc" },
                  { icon: Zap, titleKey: "feature2Title", descKey: "feature2Desc" },
                  { icon: Globe, titleKey: "feature3Title", descKey: "feature3Desc" },
                  { icon: Shield, titleKey: "feature4Title", descKey: "feature4Desc" },
                ].map(({ icon: Icon, titleKey, descKey }) => (
                  <div key={titleKey} className="flex items-start gap-4 p-5 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(249,115,22,0.1)" }}>
                      <Icon size={18} className="text-orange-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm mb-1">{t(titleKey)}</h3>
                      <p className="text-[#86868b] text-sm leading-relaxed">{t(descKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badges Strip */}
            <div className="mt-16 rounded-2xl p-5 sm:p-8" style={{ backgroundColor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 text-center">
                {[
                  { icon: CreditCard, label: t("trustStripePayments") },
                  { icon: Shield, label: t("trustInsured") },
                  { icon: Plane, label: t("trustFlightTracking") },
                  { icon: Clock, label: t("trustFreeCancellation") },
                  { icon: Star, label: t("trustSince") },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(249,115,22,0.1)" }}>
                      <Icon size={16} className="text-orange-400" strokeWidth={1.5} />
                    </div>
                    <span className="text-xs text-[#86868b] font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Image */}
            <div className="mt-16 relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <Image
                src="/images/vehicles/mercedes-vito-vip.png"
                alt="Mercedes Vito VIP Transfer Vehicle"
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111113]/80 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-white font-bold text-lg">Mercedes Vito VIP</p>
                <p className="text-gray-400 text-sm">{t("vehicleOverlay")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">{t("ourStoryTag")}</p>
                <h2 className="text-2xl font-bold text-white mb-5 tracking-tight">{t("ourStoryTitle")}</h2>
                <div className="space-y-4 text-[#86868b] leading-relaxed">
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
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-orange-400" style={{ backgroundColor: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)" }}>{year.slice(2)}</div>
                      <div className="flex-1 w-px mt-1" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                    </div>
                    <div className="pb-4">
                      <p className="text-xs text-orange-400 font-semibold mb-1">{year}</p>
                      <p className="text-[#86868b] text-sm">{t(eventKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Fleet section */}
        <section className="py-20" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">{t("fleetTag")}</p>
              <h2 className="text-2xl font-bold text-white tracking-tight">{t("fleetTitle")}</h2>
              <p className="text-[#86868b] mt-3 max-w-lg mx-auto">{t("fleetDesc")}</p>
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
                <div key={name} className="p-6 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 className="font-bold text-white text-lg mb-1">{name}</h3>
                  <div className="flex gap-3 mb-4">
                    <span className="text-xs px-3 py-1 rounded-full font-medium text-orange-400" style={{ backgroundColor: "rgba(249,115,22,0.1)" }}>{t(capacityKey)}</span>
                    <span className="text-xs px-3 py-1 rounded-full font-medium text-[#86868b]" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>{t(luggageKey)}</span>
                  </div>
                  <ul className="space-y-2">
                    {featureKeys.map((fKey) => (
                      <li key={fKey} className="flex items-center gap-2 text-sm text-[#86868b]">
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
        <section className="py-20" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)" }}>
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">Coverage</p>
              <h2 className="text-2xl font-bold text-white tracking-tight">Where We Operate</h2>
              <p className="text-[#86868b] mt-3">We cover all major tourist destinations in the Antalya region.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {["Antalya City", "Alanya", "Side", "Belek", "Kemer", "Manavgat", "Kaş", "Kalkan", "Lara", "Kundu", "Göynük", "Çamyuva"].map((region) => (
                <span key={region} className="px-4 py-2 rounded-full text-sm text-[#c7c7cc] font-medium" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {region}
                </span>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white transition-colors" style={{ backgroundColor: "rgba(249,115,22,1)" }}>
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
