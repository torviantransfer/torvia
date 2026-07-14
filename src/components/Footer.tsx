import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import NewsletterForm from "@/components/NewsletterForm";
import { Mail, MessageCircle, Phone, MapPin } from "lucide-react";

type Locale = "tr" | "en" | "de" | "pl" | "ru";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "905469407955";

export default async function Footer() {
  const t = await getTranslations("footer");
  const locale = (await getLocale()) as Locale;
  const currentYear = new Date().getFullYear();

  // Fetch popular regions SERVER-SIDE so the internal links are present in the
  // initial HTML and crawlable by Googlebot (previously loaded via client fetch,
  // so search engines never saw these site-wide internal links).
  let popularRegions: { slug: string; name_tr: string; name_en: string; name_de: string; name_pl: string; name_ru: string }[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("regions")
      .select("slug, name_tr, name_en, name_de, name_pl, name_ru")
      .eq("is_active", true)
      .eq("is_popular", true)
      .order("sort_order", { ascending: true })
      .limit(8);
    if (Array.isArray(data)) popularRegions = data;
  }

  return (
    <footer style={{ backgroundColor: "#F5F5F7", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* Top: Logo + description */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-8 mb-10 md:mb-12 pb-8 md:pb-10" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="max-w-sm">
            <span className="text-2xl font-black tracking-tight mb-3 inline-block" style={{ fontFamily: "var(--font-montserrat), sans-serif", color: "#10B981" }}>TORVIAN</span>
            <p className="text-gray-500 text-sm leading-relaxed">{t("description")}</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://instagram.com/torviantransfer" target="_blank" rel="noopener noreferrer" aria-label="TORVIAN Transfer on Instagram" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors text-gray-500 hover:text-gray-900" style={{ backgroundColor: "rgba(0,0,0,0.04)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
            </a>
            <a href="https://facebook.com/torviantransfer" target="_blank" rel="noopener noreferrer" aria-label="TORVIAN Transfer on Facebook" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors text-gray-500 hover:text-gray-900" style={{ backgroundColor: "rgba(0,0,0,0.04)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" aria-label="Contact TORVIAN Transfer on WhatsApp" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors text-emerald-600 hover:text-emerald-700" style={{ backgroundColor: "rgba(52,211,153,0.1)" }}>
              <MessageCircle size={18} aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mb-10 md:mb-12 pb-8 md:pb-10" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-gray-900 font-semibold text-base mb-1">{t("newsletterTitle")}</h3>
              <p className="text-gray-500 text-sm">{t("newsletterSubtitle")}</p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-10 md:mb-12">
          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-5">{t("company")}</h3>
            <ul className="space-y-3">
              {[
                { href: "/about", label: t("about") },
                { href: "/contact", label: t("contact") },
                { href: "/blog", label: t("blog") },
                { href: "/faq", label: t("faq") },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Destinations — server-rendered, crawlable internal links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-5">{t("destinations")}</h3>
            <ul className="space-y-3">
              {popularRegions.slice(0, 8).map((region) => (
                <li key={region.slug}>
                  <Link href={`/${region.slug.endsWith("-transfer") ? region.slug : `${region.slug}-transfer`}`} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                    {(region[`name_${locale}` as keyof typeof region] as string) || region.name_en} Transfer
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-5">{t("legal")}</h3>
            <ul className="space-y-3">
              {[
                { href: "/privacy", label: t("privacy") },
                { href: "/terms", label: t("terms") },
                { href: "/cookies", label: t("cookies") },
                { href: "/cancellation", label: t("cancellation") },
                { href: "/kvkk", label: t("kvkk") },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-gray-500 hover:text-gray-900 text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-5">{t("support")}</h3>
            <ul className="space-y-3">
              <li>
                <a href="tel:+905469407955" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  <Phone size={14} />
                  0546 940 79 55
                </a>
              </li>
              <li>
                <a href="mailto:torviantransfer@gmail.com" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm transition-colors">
                  <Mail size={14} />
                  torviantransfer@gmail.com
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm transition-colors"
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </a>
              </li>
              <li className="pt-1">
                <div className="flex items-start gap-2 text-gray-500 text-sm">
                  <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                  <span>Kemerağzı Mah. Antalya Havalimanı Dış Hatlar, 07230 Muratpaşa/Antalya</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-gray-500 text-xs">
            © {currentYear} TORVIAN Transfer. {t("allRightsReserved")}
          </p>
          <p className="text-gray-500 text-xs">
            {t("tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
