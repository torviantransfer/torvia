import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { ArrowRight, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const title = `${t("title")} | TORVIAN Transfer`;
  const description = t("subtitle");
  return {
    title,
    description,
    alternates: seoAlternates(locale, "/faq"),
    openGraph: seoOpenGraph(locale, "/faq", title, description),
    twitter: seoTwitter(title, description),
  };
}

export default async function FAQPage() {
  const t = await getTranslations("faq");

  const faqKeys = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <>
      <Header />
      <main className="flex-1">
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

        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 space-y-3">
            {faqKeys.map((i) => (
              <details key={i} className="rounded-2xl overflow-hidden group" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <summary className="px-6 py-5 cursor-pointer font-semibold text-white text-sm flex items-center justify-between transition-colors">
                  {t(`q${i}`)}
                  <span className="text-[#555] group-open:rotate-180 transition-transform ml-4 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm text-[#86868b] leading-relaxed pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  {t(`a${i}`)}
                </div>
              </details>
            ))}

            {/* Still need help CTA */}
            <div className="mt-12 rounded-2xl p-8 text-center" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(52,211,153,0.1)" }}>
                <MessageCircle size={22} className="text-emerald-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t("stillNeedHelp")}</h3>
              <p className="text-[#86868b] text-sm mb-6 max-w-md mx-auto">{t("stillNeedHelpDesc")}</p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all hover:brightness-110 text-sm"
                style={{ backgroundColor: '#F97316' }}
              >
                {t("contactUs")} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Schema.org FAQ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqKeys.map((i) => ({
                "@type": "Question",
                name: t(`q${i}`),
                acceptedAnswer: { "@type": "Answer", text: t(`a${i}`) },
              })),
            }),
          }}
        />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
