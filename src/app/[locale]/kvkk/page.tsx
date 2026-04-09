import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "kvkk" });
  const title = `${t("heading")} | TORVIAN Transfer`;
  const description = t("subtitle");
  return {
    title,
    description,
    alternates: seoAlternates(locale, "/kvkk"),
    openGraph: seoOpenGraph(locale, "/kvkk", title, description),
  };
}

export default async function KVKKPage() {
  const t = await getTranslations("kvkk");

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
          className="relative py-24 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #1c1c1e 0%, #111113 100%)",
          }}
        >
          <div className="absolute inset-0">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px]"
              style={{ backgroundColor: "rgba(249,115,22,0.15)" }}
            />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-orange-400 uppercase tracking-widest mb-4">
              {t("title")}
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold mb-5 tracking-tight text-white">
              {t("heading")}
            </h1>
            <p className="text-[#86868b] text-lg max-w-xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16" style={{ backgroundColor: "#111113" }}>
          <div className="max-w-3xl mx-auto px-4">
            <div className="space-y-6 text-sm leading-relaxed text-[#86868b]">
              <p>
                <strong className="text-white">{t("lastUpdated")}</strong>
              </p>

              <h2 className="text-lg font-bold text-white mt-8">{t("s1Title")}</h2>
              <p>{t("s1Text")}</p>

              <h2 className="text-lg font-bold text-white mt-8">{t("s2Title")}</h2>
              <p>{t("s2Text")}</p>
              <ul className="list-disc pl-5 space-y-1">{renderList("s2Items")}</ul>

              <h2 className="text-lg font-bold text-white mt-8">{t("s3Title")}</h2>
              <p>{t("s3Text")}</p>
              <ul className="list-disc pl-5 space-y-1">{renderList("s3Items")}</ul>

              <h2 className="text-lg font-bold text-white mt-8">{t("s4Title")}</h2>
              <p>{t("s4Text")}</p>

              <h2 className="text-lg font-bold text-white mt-8">{t("s5Title")}</h2>
              <p>{t("s5Text")}</p>
              <ul className="list-disc pl-5 space-y-1">{renderList("s5Items")}</ul>

              <h2 className="text-lg font-bold text-white mt-8">{t("s6Title")}</h2>
              <p>{t("s6Text")}</p>

              <h2 className="text-lg font-bold text-white mt-8">{t("s7Title")}</h2>
              <p>{t("s7Text")}</p>
            </div>
          </div>
        </section>
      </main>
      <WhatsAppButton />
      <Footer />
    </>
  );
}
