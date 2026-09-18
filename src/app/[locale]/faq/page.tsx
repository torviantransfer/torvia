import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Link } from "@/i18n/routing";
import { ArrowRight, MessageCircle, HelpCircle, ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { getSeoPage, applySeoPage, seoH1, seoIntro } from "@/lib/seoPages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Admin-editable overrides. Null when the row is empty or the
  // table is missing, in which case the values below are used verbatim.
  const seoRow = await getSeoPage("faq");
  const t = await getTranslations({ locale, namespace: "faq" });
  const title = t("title");
  const description = t("subtitle");
  return applySeoPage({
    title,
    description,
    alternates: seoAlternates(locale, "/faq"),
    openGraph: seoOpenGraph(locale, "/faq", title, description),
    twitter: seoTwitter(title, description),
  }, seoRow, locale);
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // The locale was only needed by generateMetadata until the admin
  // gained editable H1 and intro copy, which is per language.
  const { locale } = await params;
  const seoRow = await getSeoPage("faq");
  const t = await getTranslations("faq");

  const faqKeys = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative pb-14 sm:pb-18 pt-24 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(0,122,255,0.06)" }} />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4">{t("title")}</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-gray-900">{seoH1(seoRow, locale) ?? t("heading")}</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{seoIntro(seoRow, locale) ?? t("subtitle")}</p>
          </div>
        </section>

        {/* Category header */}
        <section className="py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4">
            {/* No search box here. There was a search-shaped panel — magnifier,
                grey field — that searched nothing: it only repeated the
                subtitle, and a visitor who tapped it to type got no keyboard.

                The questions are one grouped list with hairlines, matching the
                FAQ on the booking page, instead of separate outlined cards with
                numbers coloured blue for 1–4 and orange for 5–8. */}
            <div className="divide-y divide-black/[0.06] overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.06]">
              {faqKeys.map((i) => (
                <details key={i} className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 text-[15px] font-medium text-[#1d1d1f] transition active:bg-black/[0.03] sm:px-5">
                    <span className="flex-1">{t(`q${i}`)}</span>
                    <ChevronDown size={17} className="shrink-0 text-[#c7c7cc] transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="px-4 pb-4 text-[14px] leading-relaxed text-[#6e6e73] sm:px-5">
                    {t(`a${i}`)}
                  </div>
                </details>
              ))}
            </div>

            {/* Still need help */}
            <div className="mt-8 rounded-[22px] bg-white p-6 text-center ring-1 ring-black/[0.06] sm:p-8">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#E8F7EE]">
                <MessageCircle size={22} className="text-[#248A3D]" strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-[19px] font-semibold text-[#1d1d1f]">{t("stillNeedHelp")}</h3>
              <p className="mx-auto mb-6 max-w-md text-[14px] text-[#6e6e73]">{t("stillNeedHelpDesc")}</p>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#007AFF] px-6 text-[15px] font-semibold text-white transition hover:bg-[#0062CC] active:scale-[0.98]"
              >
                {t("contactUs")} <ArrowRight size={16} className="rtl:rotate-180" />
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
