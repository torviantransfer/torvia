import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import TrackReservation from "@/components/TrackReservation";
import { Search, Shield, Clock, MapPin } from "lucide-react";

export default async function TrackPage() {
  const t = await getTranslations("track");

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-14 sm:py-18 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(0,122,255,0.06)" }} />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,122,255,0.08)" }}>
              <Search size={24} className="text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-gray-900">
              {t("title")}
            </h1>
            <p className="text-gray-500 text-base max-w-xl mx-auto">{t("subtitle")}</p>
          </div>
        </section>

        {/* Trust pills */}
        <section className="border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Shield size={13} className="text-green-500" />
                <span>{t("secureSearch") ?? "Güvenli Arama"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-blue-500" />
                <span>{t("realTimeStatus") ?? "Anlık Durum"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-orange-500" />
                <span>{t("trackDriver") ?? "Sürücü Takibi"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <section className="py-10 sm:py-16">
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
