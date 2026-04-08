import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TrackReservation from "@/components/TrackReservation";
import { Search } from "lucide-react";

export default async function TrackPage() {
  const t = await getTranslations("track");

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#111113]">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center mb-5">
              <Search size={28} className="text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              {t("title")}
            </h1>
            <p className="text-gray-400">
              {t("subtitle")}
            </p>
          </div>
          <TrackReservation />
        </div>
      </main>
      <Footer />
    </>
  );
}
