import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { ArrowRight, MessageCircle, HelpCircle, Search } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const title = t("title");
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
        <section className="relative pb-14 sm:pb-18 pt-24 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(0,122,255,0.06)" }} />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4">{t("title")}</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-gray-900">{t("heading")}</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{t("subtitle")}</p>
          </div>
        </section>

        {/* Category header */}
        <section className="py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4">
            {/* Search-like visual hint */}
            <div className="flex items-center gap-3 mb-8 px-4 py-3 rounded-xl" style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}>
              <Search size={16} className="text-gray-400" />
              <span className="text-sm text-gray-400">{t("subtitle")}</span>
            </div>

            <div className="space-y-3">
            {faqKeys.map((i) => (
              <details key={i} className="rounded-2xl overflow-hidden group transition-all hover:shadow-md" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                <summary className="px-5 sm:px-6 py-4 sm:py-5 cursor-pointer font-semibold text-gray-900 text-sm flex items-center gap-3 transition-colors">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: i <= 4 ? "#007AFF" : i <= 8 ? "#FF9500" : "#34C759" }}>{i}</span>
                  <span className="flex-1">{t(`q${i}`)}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform ml-4 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </summary>
                <div className="px-5 sm:px-6 pb-5 text-sm text-gray-600 leading-relaxed pt-2 ml-10" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                  {t(`a${i}`)}
                </div>
              </details>
            ))}

            </div>
            
            {/* Still need help CTA */}
            <div className="mt-10 rounded-2xl p-6 sm:p-8 text-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(52,211,153,0.1)" }}>
                <MessageCircle size={22} className="text-emerald-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("stillNeedHelp")}</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">{t("stillNeedHelpDesc")}</p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all hover:brightness-110 text-sm"
                style={{ backgroundColor: '#FF9500' }}
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
