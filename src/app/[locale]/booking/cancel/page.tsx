import { getTranslations } from "next-intl/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { XCircle } from "lucide-react";
import { Link } from "@/i18n/routing";

export default async function BookingCancelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const code = sp.code ?? "";
  const t = await getTranslations("bookingCancel");

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#111113]">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <XCircle size={40} className="text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">
            {t("title")}
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            {t("description")}
          </p>

          {code && (
            <p className="text-sm text-gray-500 mb-8">
              {t("reference")}: <span className="font-medium text-gray-300">{code}</span>
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              {t("tryAgain")}
            </Link>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "905469407955"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/10 font-medium rounded-lg hover:bg-white/5 transition-colors text-gray-300"
            >
              {t("whatsappSupport")}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
