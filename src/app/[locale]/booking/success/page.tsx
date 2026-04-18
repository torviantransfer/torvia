import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle, Download, Home, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function BookingSuccessPage({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
  params: Promise<{ locale: string }>;
}) {
  const sp = await searchParams;
  const { locale } = await params;
  const code = sp.code ?? "—";
  const t = await getTranslations("bookingSuccess");

  return (
    <>
      <Header />
      <main className="flex-1 bg-white">
        <div className="max-w-xl mx-auto px-4 py-16 text-center">

          {/* Success icon */}
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(34,197,94,0.1)" }}>
            <CheckCircle size={40} className="text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {t("title")}
          </h1>
          <p className="text-gray-500 text-base mb-10">
            {t("description")}
          </p>

          {/* Reservation code */}
          <div className="rounded-2xl border border-gray-100 p-6 mb-6 text-center" style={{ background: "rgba(0,0,0,0.02)" }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{t("reservationCode")}</p>
            <p className="text-4xl font-bold text-gray-900 tracking-widest font-mono mb-3">
              {code}
            </p>
            <p className="text-xs text-gray-400">
              {t("saveCode")}
            </p>
          </div>

          {/* What happens next */}
          <div className="rounded-2xl border border-gray-100 p-6 mb-8 text-left" style={{ background: "rgba(0,0,0,0.02)" }}>
            <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              {t("whatNext")}
            </h2>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 text-blue-600" style={{ background: "rgba(0,122,255,0.1)" }}>1</span>
                {t("step1")}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 text-blue-600" style={{ background: "rgba(0,122,255,0.1)" }}>2</span>
                {t("step2")}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 text-blue-600" style={{ background: "rgba(0,122,255,0.1)" }}>3</span>
                {t("step3")}
              </li>
            </ol>
          </div>

          {/* Primary action: Download Voucher */}
          <a
            href={`/api/voucher?code=${encodeURIComponent(code)}&locale=${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-base mb-3 transition-all"
            style={{ background: "linear-gradient(135deg, #007AFF, #0056CC)", boxShadow: "0 4px 20px rgba(0,122,255,0.25)" }}
          >
            <Download size={18} />
            {t("downloadVoucher")}
          </a>

          {/* Secondary action: Back to Home */}
          <a
            href={`/${locale}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-medium text-gray-600 text-sm mb-8 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Home size={16} />
            {t("backToHome")}
          </a>

          {/* Support — small & subtle */}
          <p className="text-xs text-gray-400 mb-3">{t("needHelp")}</p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "08508401327"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
          >
            <MessageCircle size={15} />
            {t("whatsappSupport")}
          </a>

        </div>
      </main>
      <Footer />
    </>
  );
}

