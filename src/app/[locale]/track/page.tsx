import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import TrackReservation from "@/components/TrackReservation";
import { Shield, Clock, MapPin } from "lucide-react";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "track" });
  const title = t("title");
  const description = t("subtitle");
  return {
    title,
    description,
    alternates: seoAlternates(locale, "/track"),
    openGraph: seoOpenGraph(locale, "/track", title, description),
    twitter: seoTwitter(title, description),
  };
}

export default async function TrackPage() {
  const t = await getTranslations("track");

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pb-14 sm:pb-18 pt-24 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(0,122,255,0.06)" }} />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4">{t("title")}</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-gray-900">{t("title")}</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{t("subtitle")}</p>
            {/* Trust pills */}
            <div className="flex flex-wrap justify-center gap-6 mt-6 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Shield size={13} className="text-emerald-500" />
                <span className="font-medium">{t("secureSearch") ?? "Güvenli Arama"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-blue-500" />
                <span className="font-medium">{t("realTimeStatus") ?? "Anlık Durum"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-orange-500" />
                <span className="font-medium">{t("trackDriver") ?? "Sürücü Takibi"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <section className="py-12">
          <div className="max-w-2xl mx-auto px-4">
            <TrackReservation />
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
