import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ContactForm from "@/components/ContactForm";
import { Link } from "@/i18n/routing";
import { Phone, Mail, MapPin, MessageCircle, Clock, ArrowRight, HelpCircle, Globe, Shield, Headphones } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const title = t("title");
  const description = t("subtitle");
  return {
    title,
    description,
    alternates: seoAlternates(locale, "/contact"),
    openGraph: seoOpenGraph(locale, "/contact", title, description),
    twitter: seoTwitter(title, description),
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "TORVIAN Transfer",
    url: "https://torviantransfer.com",
    telephone: "+90-850-840-13-27",
    email: "torviantransfer@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kemerağzı Mah. Antalya Havalimanı Dış Hatlar Terminali",
      addressLocality: "Muratpaşa",
      addressRegion: "Antalya",
      postalCode: "07230",
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 36.8987,
      longitude: 30.8005,
    },
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(0,122,255,0.06)" }} />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4">{t("tag")}</p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight text-gray-900">{t("heading")}</h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{t("subtitle")}</p>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-b" style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(0,0,0,0.06)" }}>
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Headphones, labelKey: "stat1Label", subKey: "stat1Sub", color: "#007AFF", bg: "rgba(0,122,255,0.1)" },
                { icon: Clock, labelKey: "stat2Label", subKey: "stat2Sub", color: "#FF9500", bg: "rgba(255,149,0,0.1)" },
                { icon: Globe, labelKey: "stat3Label", subKey: "stat3Sub", color: "#34C759", bg: "rgba(52,199,89,0.1)" },
                { icon: Shield, labelKey: "stat4Label", subKey: "stat4Sub", color: "#007AFF", bg: "rgba(0,122,255,0.1)" },
              ].map(({ icon: Icon, labelKey, subKey, color, bg }) => (
                <div key={labelKey} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: bg }}>
                  <Icon size={18} style={{ color }} strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{t(labelKey)}</p>
                    <p className="text-[10px] text-gray-500 truncate">{t(subKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main content: info + form */}
        <section className="py-20" style={{ backgroundColor: "#f8fafc" }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid lg:grid-cols-5 gap-8">

              {/* LEFT: Contact info cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="mb-6">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">{t("tag")}</p>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("getInTouch")}</h2>
                </div>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/08508401327"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 rounded-xl bg-white group transition-all hover:shadow-md"
                  style={{ border: "1px solid #e2e8f0" }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#dcfce7" }}>
                    <MessageCircle size={22} className="text-emerald-600" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">WhatsApp</p>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">{t("whatsapp")}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t("whatsappDesc")}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 flex-shrink-0 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                </a>

                {/* Email */}
                <div className="flex items-center gap-4 p-5 rounded-xl bg-white" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#dbeafe" }}>
                    <Mail size={22} className="text-blue-600" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">E-posta</p>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">{t("emailLabel")}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t("emailDesc")}</p>
                  </div>
                </div>

                {/* Phone */}
                <a
                  href="tel:+908508401327"
                  className="flex items-center gap-4 p-5 rounded-xl bg-white group transition-all hover:shadow-md"
                  style={{ border: "1px solid #e2e8f0" }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#ede9fe" }}>
                    <Phone size={22} className="text-violet-600" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("phoneLabel")}</p>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">0850 840 1327</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t("responseTime")}</p>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 flex-shrink-0 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                </a>

                {/* Address */}
                <div className="flex items-start gap-4 p-5 rounded-xl bg-white" style={{ border: "1px solid #e2e8f0" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f1f5f9" }}>
                    <MapPin size={22} className="text-slate-500" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("locationLabel")}</p>
                    <p className="font-semibold text-gray-900 text-sm mt-0.5">Antalya Havalimanı Dış Hatlar</p>
                    <p className="text-xs text-gray-500 mt-0.5">Kemerağzı Mah., 07230 Muratpaşa / Antalya</p>
                  </div>
                </div>

                {/* FAQ link */}
                <Link
                  href="/faq"
                  className="flex items-center gap-3 px-5 py-4 rounded-xl bg-white group transition-all hover:shadow-md"
                  style={{ border: "1px solid #e2e8f0" }}
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
                <p className="text-gray-500 text-sm mb-8">Antalya Havalimanı Dış Hatlar Terminali, Muratpaşa</p>
                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3189.784!2d30.8005!3d36.8987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14c385a94efb0e15%3A0x7aae38d6b3e6fbe4!2sAntalya+Airport!5e0!3m2!1sen!2str!4v1700000000000"
                    width="100%"
                    height="320"
                    style={{ border: 0, display: "block" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Antalya Airport - TORVIAN Transfer Location"
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
