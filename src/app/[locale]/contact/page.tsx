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
        <section className="relative py-14 sm:py-18 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.04) 0%, rgba(255,149,0,0.03) 50%, #FFFFFF 100%)" }}>
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px]" style={{ backgroundColor: "rgba(0,122,255,0.06)" }} />
          </div>
          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4">{t("title")}</p>
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

        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact info */}
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t("getInTouch")}</h2>
                <div className="space-y-3">
                  <a
                    href="https://wa.me/908508401327"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl transition-colors"
                    style={{ backgroundColor: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(52,211,153,0.15)" }}>
                      <MessageCircle size={20} className="text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t("whatsapp")}</p>
                      <p className="text-sm text-gray-500">{t("whatsappDesc")}</p>
                    </div>
                  </a>

                  {[
                    { icon: Mail, titleKey: "emailLabel", descKey: "emailDesc", color: "rgba(129,140,248" },
                    { icon: Phone, titleKey: "phoneLabel", descKey: "phoneDesc", color: "rgba(196,181,253" },
                  ].map(({ icon: Icon, titleKey, descKey, color }) => (
                    <div key={titleKey} className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: `${color},0.06)`, border: `1px solid ${color},0.12)` }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color},0.12)` }}>
                        <Icon size={20} style={{ color: `${color},1)` }} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{t(titleKey)}</p>
                        <p className="text-sm text-gray-500">{t(descKey)}</p>
                      </div>
                    </div>
                  ))}

                  {/* Second phone */}
                  <a
                    href="tel:+908508401327"
                    className="flex items-center gap-4 p-4 rounded-2xl transition-colors"
                    style={{ backgroundColor: "rgba(196,181,253,0.06)", border: "1px solid rgba(196,181,253,0.12)" }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(196,181,253,0.12)" }}>
                      <Phone size={20} style={{ color: "rgba(196,181,253,1)" }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t("phoneLabel")} 2</p>
                      <p className="text-sm text-gray-500">0850 840 1327</p>
                    </div>
                  </a>

                  {/* Address */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.12)" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,122,255,0.12)" }}>
                      <MapPin size={20} style={{ color: "#007AFF" }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t("locationLabel")}</p>
                      <p className="text-sm text-gray-500">Kemerağzı Mah. Antalya Havalimanı Dış Hatlar, 07230 Muratpaşa/Antalya</p>
                    </div>
                  </div>
                </div>

                {/* Response time + FAQ link */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(52,199,89,0.06)", border: "1px solid rgba(52,199,89,0.12)" }}>
                    <Clock size={16} className="text-emerald-400 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-gray-500">{t("responseTime")}</span>
                  </div>
                  <Link href="/faq" className="flex items-center gap-3 px-4 py-3 rounded-xl group transition-colors" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <HelpCircle size={16} className="text-blue-600 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-gray-500 group-hover:text-gray-900 transition-colors flex-1">{t("checkFaq")}</span>
                    <ArrowRight size={14} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                  </Link>
                </div>
              </div>

              {/* Contact form */}
              <div>
                <div className="p-6 sm:p-8 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
                  <h2 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">{t("sendMessage")}</h2>
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Languages section */}
        <section className="py-16" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">{t("langTag")}</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t("langTitle")}</h2>
            <p className="text-gray-500 mb-10 max-w-md mx-auto">{t("langDesc")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { flag: "🇹🇷", langKey: "langTurkish" },
                { flag: "🇬🇧", langKey: "langEnglish" },
                { flag: "🇩🇪", langKey: "langGerman" },
                { flag: "🇵🇱", langKey: "langPolish" },
                { flag: "🇷🇺", langKey: "langRussian" },
              ].map(({ flag, langKey }) => (
                <div key={langKey} className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-gray-900" style={{ backgroundColor: "#F5F5F7", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="text-xl">{flag}</span>
                  <span>{t(langKey)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Map section */}
        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t("mapTitle")}</h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3189.784!2d30.8005!3d36.8987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14c385a94efb0e15%3A0x7aae38d6b3e6fbe4!2sAntalya+Airport!5e0!3m2!1sen!2str!4v1700000000000"
                width="100%"
                height="320"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Antalya Airport - TORVIAN Transfer Location"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
