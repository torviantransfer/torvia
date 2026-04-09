import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWizard from "@/components/booking/BookingWizard";
import WhatsAppButton from "@/components/WhatsAppButton";
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

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#111113" }}>
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
        <BookingWizard
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

        {/* SEO Trust Section */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              {t("seoHeading")}
            </h2>
            <p className="text-[#86868b] text-center max-w-2xl mx-auto mb-10">
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
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-orange-400 mb-3"
                    style={{ backgroundColor: "rgba(249,115,22,0.1)" }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-[#86868b] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* SEO FAQ mini */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-lg font-bold text-white mb-5 text-center">
                {t("seoFaqTitle")}
              </h3>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <details
                    key={n}
                    className="group rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <summary className="px-5 py-4 text-sm font-medium text-white cursor-pointer list-none flex items-center justify-between hover:text-orange-400 transition-colors">
                      {t(`seoFaq${n}Q`)}
                      <span className="text-[#555] group-open:rotate-45 transition-transform text-lg">+</span>
                    </summary>
                    <div className="px-5 pb-4 text-sm text-[#86868b] leading-relaxed">
                      {t(`seoFaq${n}A`)}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* SEO text block */}
            <div className="mt-14 max-w-3xl mx-auto">
              <p className="text-sm text-[#555] leading-relaxed text-center">
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
