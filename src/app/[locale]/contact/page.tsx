import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ContactForm from "@/components/ContactForm";
import { Link } from "@/i18n/routing";
import { Phone, Mail, MapPin, MessageCircle, Clock, ArrowRight, HelpCircle, Globe, Shield, Headphones, ChevronRight } from "lucide-react";
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
  const seoRow = await getSeoPage("contact");
  const t = await getTranslations({ locale, namespace: "contact" });
  const title = t("title");
  const description = t("subtitle");
  return applySeoPage({
    title,
    description,
    alternates: seoAlternates(locale, "/contact"),
    openGraph: seoOpenGraph(locale, "/contact", title, description),
    twitter: seoTwitter(title, description),
  }, seoRow, locale);
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // The locale was only needed by generateMetadata until the admin
  // gained editable H1 and intro copy, which is per language.
  const { locale } = await params;
  const seoRow = await getSeoPage("contact");
  const t = await getTranslations("contact");

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "TORVIAN Transfer",
    url: "https://torviantransfer.com",
    telephone: "+90-242-606-07-63",
    email: "torviantransfer@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Yenigöl Mah. Lavanta Sk. No:22",
      addressLocality: "Muratpaşa",
      addressRegion: "Antalya",
      postalCode: "07200",
      addressCountry: "TR",
    },
    // No `geo` until the Yenigöl office has real coordinates. The ones here
    // pointed at Antalya Airport, the old address — beside a Muratpaşa street
    // address that told Google the business was in two places at once, which
    // is worse than giving it no pin at all.
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pb-14 sm:pb-18 pt-24 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(0,122,255,0.06)" }} />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4">{t("tag")}</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-gray-900">{seoH1(seoRow, locale) ?? t("heading")}</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{seoIntro(seoRow, locale) ?? t("subtitle")}</p>
          </div>
        </section>

        {/* Stats bar — one neutral fill for all four. They used to be tinted
            blue, orange, green and blue, which gave four equal facts four
            different weights. */}
        <section className="border-b border-black/[0.06] bg-white">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { icon: Headphones, labelKey: "stat1Label", subKey: "stat1Sub" },
                { icon: Clock, labelKey: "stat2Label", subKey: "stat2Sub" },
                { icon: Globe, labelKey: "stat3Label", subKey: "stat3Sub" },
                { icon: Shield, labelKey: "stat4Label", subKey: "stat4Sub" },
              ].map(({ icon: Icon, labelKey, subKey }) => (
                <div key={labelKey} className="flex items-center gap-3 rounded-[14px] bg-[#F5F5F7] p-3">
                  <Icon size={18} className="shrink-0 text-[#007AFF]" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#1d1d1f]">{t(labelKey)}</p>
                    <p className="truncate text-[11.5px] text-[#86868b]">{t(subKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main content: info + form */}
        <section className="py-16 sm:py-20" style={{ backgroundColor: "#F5F5F7" }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid lg:grid-cols-5 gap-8">

              {/* LEFT: contact channels as one grouped list, the way a phone's
                  settings screen lists them — a small solid tile with a white
                  glyph per row, hairlines between, a chevron where the row
                  does something. Four separately-outlined cards with pastel
                  tiles read as four unrelated widgets. */}
              <div className="lg:col-span-2">
                <div className="mb-5">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">{t("tag")}</p>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("getInTouch")}</h2>
                </div>

                <div className="divide-y divide-black/[0.06] overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.06]">
                  <a
                    href="https://wa.me/902426060763"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 px-4 py-3.5 transition active:bg-black/[0.03] hover:bg-black/[0.02]"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#34C759]">
                      <MessageCircle size={18} className="text-white" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-[#1d1d1f]">{t("whatsapp")}</span>
                      <span className="block text-[13px] text-[#86868b]">{t("whatsappDesc")}</span>
                    </span>
                    <ChevronRight size={17} className="shrink-0 text-[#c7c7cc] rtl:rotate-180" />
                  </a>

                  <a
                    href="tel:+902426060763"
                    className="flex items-center gap-3.5 px-4 py-3.5 transition active:bg-black/[0.03] hover:bg-black/[0.02]"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#007AFF]">
                      <Phone size={17} className="text-white" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-[#1d1d1f]">0242 606 07 63</span>
                      <span className="block text-[13px] text-[#86868b]">{t("responseTime")}</span>
                    </span>
                    <ChevronRight size={17} className="shrink-0 text-[#c7c7cc] rtl:rotate-180" />
                  </a>

                  <a
                    href="mailto:torviantransfer@gmail.com"
                    className="flex items-center gap-3.5 px-4 py-3.5 transition active:bg-black/[0.03] hover:bg-black/[0.02]"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#5856D6]">
                      <Mail size={17} className="text-white" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-[#1d1d1f]">{t("emailLabel")}</span>
                      <span className="block truncate text-[13px] text-[#86868b]">torviantransfer@gmail.com</span>
                    </span>
                    <ChevronRight size={17} className="shrink-0 text-[#c7c7cc] rtl:rotate-180" />
                  </a>

                  <div className="flex items-start gap-3.5 px-4 py-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#FF3B30]">
                      <MapPin size={17} className="text-white" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-[#1d1d1f]">Muratpaşa, Antalya</span>
                      <span className="block text-[13px] leading-snug text-[#86868b]">Yenigöl Mah. Lavanta Sk. No:22, 07200 Muratpaşa / Antalya</span>
                    </span>
                  </div>
                </div>

                {/* FAQ link */}
                <Link
                  href="/faq"
                  className="group mt-3 flex items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 ring-1 ring-black/[0.06] transition hover:bg-black/[0.02] active:bg-black/[0.03]"
                >
                  <HelpCircle size={18} className="text-blue-500 flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1 transition-colors">{t("checkFaq")}</span>
                  <ArrowRight size={15} className="text-gray-300 flex-shrink-0 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>

              {/* RIGHT: Contact form */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl p-8 sm:p-10" style={{ border: "1px solid #e2e8f0", boxShadow: "0 4px 40px rgba(0,0,0,0.05)" }}>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("sendMessage")}</h2>
                    <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
                  </div>
                  <ContactForm />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Languages + Map */}
        <section className="py-20 bg-white" style={{ borderTop: "1px solid #e2e8f0" }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-start">

              {/* Languages */}
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">{t("langTag")}</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">{t("langTitle")}</h2>
                <p className="text-gray-500 text-sm mb-8 max-w-sm">{t("langDesc")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { flag: "🇹🇷", langKey: "langTurkish" },
                    { flag: "🇬🇧", langKey: "langEnglish" },
                    { flag: "🇩🇪", langKey: "langGerman" },
                    { flag: "🇵🇱", langKey: "langPolish" },
                    { flag: "🇷🇺", langKey: "langRussian" },
                    { flag: "🇳🇱", langKey: "langDutch" },
                    { flag: "🇷🇴", langKey: "langRomanian" },
                  ].map(({ flag, langKey }) => (
                    <div key={langKey} className="flex items-center gap-3 px-4 py-3.5 rounded-xl" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <span className="text-2xl">{flag}</span>
                      <span className="text-sm font-semibold text-gray-800">{t(langKey)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">{t("langTag")}</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">{t("mapTitle")}</h2>
                <p className="text-gray-500 text-sm mb-8">Yenigöl Mah. Lavanta Sk. No:22, 07200 Muratpaşa / Antalya</p>
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                  <iframe
                    src="https://www.google.com/maps?q=Yenig%C3%B6l+Mah.+Lavanta+Sk.+No%3A22,+07200+Muratpa%C5%9Fa,+Antalya&output=embed"
                    width="100%"
                    height="320"
                    style={{ border: 0, display: "block" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="TORVIAN Transfer - Muratpaşa, Antalya"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
