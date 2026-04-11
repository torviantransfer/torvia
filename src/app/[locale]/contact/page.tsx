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
    telephone: "+90-546-940-79-55",
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

        {/* Stats bar */}
        <section style={{ backgroundColor: "#0a0a0b", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Headphones, label: "24/7 Support", sub: "Always available" },
                { icon: Clock, label: "< 30 min", sub: "Response time" },
                { icon: Globe, label: "5 Languages", sub: "TR · EN · DE · PL · RU" },
                { icon: Shield, label: "Fully Insured", sub: "Licensed & secure" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(249,115,22,0.12)" }}>
                    <Icon size={18} className="text-orange-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-xs text-[#86868b]">{sub}</p>
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
                <h2 className="text-2xl font-bold text-white tracking-tight">{t("getInTouch")}</h2>
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
                      <p className="font-bold text-white">{t("whatsapp")}</p>
                      <p className="text-sm text-[#86868b]">{t("whatsappDesc")}</p>
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
                        <p className="font-bold text-white">{t(titleKey)}</p>
                        <p className="text-sm text-[#86868b]">{t(descKey)}</p>
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
                      <p className="font-bold text-white">{t("phoneLabel")} 2</p>
                      <p className="text-sm text-[#86868b]">0850 840 1327</p>
                    </div>
                  </a>

                  {/* Address */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ backgroundColor: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(249,115,22,0.12)" }}>
                      <MapPin size={20} style={{ color: "rgba(249,115,22,1)" }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-bold text-white">{t("locationLabel")}</p>
                      <p className="text-sm text-[#86868b]">Kemerağzı Mah. Antalya Havalimanı Dış Hatlar, 07230 Muratpaşa/Antalya</p>
                    </div>
                  </div>
                </div>

                {/* Response time + FAQ link */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)" }}>
                    <Clock size={16} className="text-emerald-400 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-[#86868b]">{t("responseTime")}</span>
                  </div>
                  <Link href="/faq" className="flex items-center gap-3 px-4 py-3 rounded-xl group transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <HelpCircle size={16} className="text-orange-400 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-[#86868b] group-hover:text-white transition-colors flex-1">{t("checkFaq")}</span>
                    <ArrowRight size={14} className="text-[#555] group-hover:text-orange-400 transition-colors" />
                  </Link>
                </div>
              </div>

              {/* Contact form */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">{t("sendMessage")}</h2>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* Languages section */}
        <section className="py-16" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">Multilingual Team</p>
            <h2 className="text-2xl font-bold text-white mb-2">We Speak Your Language</h2>
            <p className="text-[#86868b] mb-10 max-w-md mx-auto">Our team is fluent in 5 languages so you can communicate comfortably from your first inquiry to arrival.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { flag: "🇹🇷", lang: "Turkish" },
                { flag: "🇬🇧", lang: "English" },
                { flag: "🇩🇪", lang: "German" },
                { flag: "🇵🇱", lang: "Polish" },
                { flag: "🇷🇺", lang: "Russian" },
              ].map(({ flag, lang }) => (
                <div key={lang} className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-xl">{flag}</span>
                  <span>{lang}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Map section */}
        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl font-bold text-white mb-4">Our Location</h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
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
