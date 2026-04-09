import { getTranslations } from "next-intl/server";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ContactForm from "@/components/ContactForm";
import { Link } from "@/i18n/routing";
import { Phone, Mail, MapPin, MessageCircle, Clock, ArrowRight, HelpCircle } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  const title = `${t("heading")} | TORVIAN Transfer`;
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

        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact info */}
              <div className="space-y-5">
                <h2 className="text-2xl font-bold text-white tracking-tight">{t("getInTouch")}</h2>
                <div className="space-y-3">
                  <a
                    href="https://wa.me/905469407955"
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
                    href="tel:+905415952102"
                    className="flex items-center gap-4 p-4 rounded-2xl transition-colors"
                    style={{ backgroundColor: "rgba(196,181,253,0.06)", border: "1px solid rgba(196,181,253,0.12)" }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(196,181,253,0.12)" }}>
                      <Phone size={20} style={{ color: "rgba(196,181,253,1)" }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-bold text-white">{t("phoneLabel")} 2</p>
                      <p className="text-sm text-[#86868b]">+90 541 595 21 02</p>
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
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
