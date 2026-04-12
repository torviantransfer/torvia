import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizardClient from "@/components/booking/BookingWizardClient";
import WhatsAppButton from "@/components/WhatsAppButton";
import Image from "next/image";
import { Shield, Clock, CreditCard, Plane, MapPin, Star } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking" });
  const title = `${t("title")} | TORVIAN Transfer`;
  const description = t("subtitle");
  return {
    title,
    description,
    alternates: seoAlternates(locale, "/booking"),
    openGraph: seoOpenGraph(locale, "/booking", title, description),
  };
}

export default async function BookingPage({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ locale: string }>;
}) {
  const sp = await searchParams;
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking" });

  const hasRegion = !!sp.region;

  return (
    <>
      <Header />

      {/* Hero shown only when no region selected */}
      {!hasRegion && (
        <>
          <section className="relative min-h-[420px] sm:min-h-[480px] flex flex-col items-center justify-center pt-16">
            <Image
              src="/images/havaalani-vip-transfer.jpg"
              alt="Antalya Airport VIP Transfer"
              fill
              className="object-cover"
              priority
              quality={80}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-16 sm:pt-20 pb-10">
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                  {t("title")}
                </h1>
                <p className="text-base sm:text-lg text-white/85 max-w-2xl mx-auto drop-shadow">
                  {t("subtitle")}
                </p>
              </div>
              <div className="max-w-5xl mx-auto">
                <BookingWizardClient />
              </div>
            </div>
          </section>
        </>
      )}

      <main className="flex-1" style={{ backgroundColor: "#FFFFFF" }}>
        {/* Structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "TORVIAN VIP Airport Transfer",
          description: t("subtitle"),
          provider: { "@type": "Organization", name: "TORVIAN Transfer", url: "https://torviantransfer.com" },
          areaServed: { "@type": "Place", name: "Antalya, Turkey" },
          serviceType: "Airport Transfer",
        }) }} />

        {/* When region is selected, keep navbar and show wizard directly */}
        {hasRegion && (
          <section className="pt-20 sm:pt-24 pb-6">
            <div className="max-w-6xl mx-auto px-4">
              <BookingWizardClient
                initialRegion={sp.region}
                initialTrip={(sp.trip as "one_way" | "round_trip") ?? "one_way"}
                initialDate={sp.date}
                initialTime={sp.time}
                initialReturnDate={sp.returnDate}
                initialReturnTime={sp.returnTime}
                initialFlight={sp.flight}
                initialAdults={sp.adults ? parseInt(sp.adults) : 2}
                initialChildren={sp.children ? parseInt(sp.children) : 0}
                initialLuggage={sp.luggage ? parseInt(sp.luggage) : 2}
              />
            </div>
          </section>
        )}

        {/* SEO Trust Section */}
        <section className="py-16 border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              {t("seoHeading")}
            </h2>
            <p className="text-gray-500 text-center max-w-2xl mx-auto mb-10">
              {t("seoSubheading")}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
              {[
                { icon: <Plane size={20} />, title: t("seoFlightTracking"), desc: t("seoFlightTrackingDesc") },
                { icon: <Shield size={20} />, title: t("seoInsured"), desc: t("seoInsuredDesc") },
                { icon: <CreditCard size={20} />, title: t("seoSecurePayment"), desc: t("seoSecurePaymentDesc") },
                { icon: <Clock size={20} />, title: t("seo247"), desc: t("seo247Desc") },
                { icon: <MapPin size={20} />, title: t("seoDoorToDoor"), desc: t("seoDoorToDoorDesc") },
                { icon: <Star size={20} />, title: t("seoNoHidden"), desc: t("seoNoHiddenDesc") },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5 transition-all"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 mb-3"
                    style={{ backgroundColor: "rgba(0,122,255,0.08)" }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* SEO FAQ mini */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-5 text-center">
                {t("seoFaqTitle")}
              </h3>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <details
                    key={n}
                    className="group rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <summary className="px-5 py-4 text-sm font-medium text-gray-900 cursor-pointer list-none flex items-center justify-between hover:text-blue-600 transition-colors">
                      {t(`seoFaq${n}Q`)}
                      <span className="text-gray-500 group-open:rotate-45 transition-transform text-lg">+</span>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">
                      {t(`seoFaq${n}A`)}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* SEO text block */}
            <div className="mt-14 max-w-3xl mx-auto">
              <p className="text-sm text-gray-500 leading-relaxed text-center">
                {t("seoTextBlock")}
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
