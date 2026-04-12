import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  const title = `${t("heading")} | TORVIAN Transfer`;
  const description = t("subtitle");
  return {
    title,
    description,
    alternates: seoAlternates(locale, "/privacy"),
    openGraph: seoOpenGraph(locale, "/privacy", title, description),
    twitter: seoTwitter(title, description),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");

  const renderList = (key: string) =>
    t(key)
      .split("|")
      .map((item, i) => <li key={i}>{item}</li>);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative pb-14 sm:pb-18 pt-24 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)",
          }}
        >
          <div className="absolute inset-0">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px]"
              style={{ backgroundColor: "rgba(0,122,255,0.06)" }}
            />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4">
              {t("title")}
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-gray-900">
              {t("heading")}
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-3xl mx-auto px-4">
            <div className="space-y-8 text-sm leading-relaxed text-gray-600">
              <p>
                <strong className="text-gray-900">{t("lastUpdated")}</strong>
              </p>

              <div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>1</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s1Title")}</h2>
              </div>
              <p>{t("s1Text")}</p>
              <ul className="list-disc pl-5 space-y-1">{renderList("s1Items")}</ul>

              <div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>2</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s2Title")}</h2>
              </div>
              <p>{t("s2Text")}</p>
              <ul className="list-disc pl-5 space-y-1">{renderList("s2Items")}</ul>

              <div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>3</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s3Title")}</h2>
              </div>
              <p>{t("s3Text")}</p>
              <ul className="list-disc pl-5 space-y-1">{renderList("s3Items")}</ul>
              <p>{t("s3Extra")}</p>

              <div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>4</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s4Title")}</h2>
              </div>
              <p>{t("s4Text")}</p>

              <div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>5</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s5Title")}</h2>
              </div>
              <p>{t("s5Text")}</p>

              <div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>6</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s6Title")}</h2>
              </div>
              <p>{t("s6Text")}</p>
              <ul className="list-disc pl-5 space-y-1">{renderList("s6Items")}</ul>

              <div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>7</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s7Title")}</h2>
              </div>
              <p>{t("s7Text")}</p>

              <div className="flex items-center gap-3 mt-10 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#007AFF" }}>8</div>
                <h2 className="text-lg font-bold text-gray-900">{t("s8Title")}</h2>
              </div>
              <p>
                {t("s8Text")}{" "}
                <a href="mailto:torviantransfer@gmail.com" className="text-blue-600 hover:underline">
                  torviantransfer@gmail.com
                </a>
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
