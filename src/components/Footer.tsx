"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Mail, MessageCircle, Phone, MapPin } from "lucide-react";

type Locale = "tr" | "en" | "de" | "pl" | "ru";
type RegionItem = {
  slug: string;
  name_tr: string;
  name_en: string;
  name_de: string;
  name_pl: string;
  name_ru: string;
  is_popular?: boolean;
};

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale() as Locale;
  const currentYear = new Date().getFullYear();

  const [popularRegions, setPopularRegions] = useState<RegionItem[]>([]);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<
    "idle" | "loading" | "success" | "duplicate" | "error"
  >("idle");

  useEffect(() => {
    fetch("/api/regions?popular=true")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPopularRegions(data);
      })
      .catch(() => {});
  }, []);

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newsletterEmail || newsletterStatus === "loading") return;
    setNewsletterStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewsletterStatus("success");
        setNewsletterEmail("");
      } else if (res.status === 409 || data?.error === "duplicate") {
        setNewsletterStatus("duplicate");
      } else {
        setNewsletterStatus("error");
      }
    } catch {
      setNewsletterStatus("error");
    }
  }

  return (
    <footer style={{ backgroundColor: "#000", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* Top: Logo + description */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-8 mb-10 md:mb-12 pb-8 md:pb-10" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-sm">
            <img
              src="/images/logo.webp"
              alt="TORVIAN Transfer"
              width={200}
              height={52}
              style={{ height: "36px", width: "auto", maxWidth: "160px", objectFit: "contain", marginBottom: "12px" }}
            />
            <p className="text-gray-400 text-sm leading-relaxed">{t("description")}</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://instagram.com/torviantransfer" target="_blank" rel="noopener noreferrer" aria-label="TORVIAN Transfer on Instagram" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors text-gray-400 hover:text-white" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
            </a>
            <a href="https://facebook.com/torviantransfer" target="_blank" rel="noopener noreferrer" aria-label="TORVIAN Transfer on Facebook" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors text-gray-400 hover:text-white" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "908508401327"}`} target="_blank" rel="noopener noreferrer" aria-label="Contact TORVIAN Transfer on WhatsApp" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors text-emerald-500 hover:text-emerald-400" style={{ backgroundColor: "rgba(52,211,153,0.1)" }}>
              <MessageCircle size={18} aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mb-10 md:mb-12 pb-8 md:pb-10" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-semibold text-base mb-1">{t("newsletterTitle")}</h3>
              <p className="text-gray-400 text-sm">{t("newsletterSubtitle")}</p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 w-full md:w-auto md:min-w-[360px]">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterStatus("idle"); }}
                placeholder={t("newsletterPlaceholder")}
                required
                disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-700 disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: "#C2410C" }}
              >
                {newsletterStatus === "loading" ? "..." : t("newsletterButton")}
              </button>
            </form>
          </div>
          {newsletterStatus === "success" && (
            <p className="mt-3 text-emerald-400 text-sm">{t("newsletterSuccess")}</p>
          )}
          {newsletterStatus === "duplicate" && (
            <p className="mt-3 text-yellow-400 text-sm">{t("newsletterDuplicate")}</p>
          )}
          {newsletterStatus === "error" && (
            <p className="mt-3 text-red-400 text-sm">{t("newsletterError")}</p>
          )}
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-10 md:mb-12">
          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-5">{t("company")}</h3>
            <ul className="space-y-3">
              {[
                { href: "/about", label: t("about") },
                { href: "/contact", label: t("contact") },
                { href: "/blog", label: t("blog") },
                { href: "/faq", label: t("faq") },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Destinations */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-5">{t("destinations")}</h3>
            <ul className="space-y-3">
              {popularRegions.slice(0, 8).map((region) => (
                <li key={region.slug}>
                  <Link href={`/${region.slug}-transfer`} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {region[`name_${locale}`] || region.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-5">{t("legal")}</h3>
            <ul className="space-y-3">
              {[
                { href: "/privacy", label: t("privacy") },
                { href: "/terms", label: t("terms") },
                { href: "/cookies", label: t("cookies") },
                { href: "/cancellation", label: t("cancellation") },
                { href: "/kvkk", label: t("kvkk") },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-5">{t("support")}</h3>
            <ul className="space-y-3">
              <li>
                <a href="tel:+908508401327" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                  <Phone size={14} />
                  0850 840 1327
                </a>
              </li>
              <li>
                <a href="mailto:torviantransfer@gmail.com" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
                  <Mail size={14} />
                  torviantransfer@gmail.com
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "908508401327"}`}
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </a>
              </li>
              <li className="pt-1">
                <div className="flex items-start gap-2 text-gray-400 text-sm">
                  <MapPin size={14} className="flex-shrink-0 mt-0.5" />
                  <span>Kemerağzı Mah. Antalya Havalimanı Dış Hatlar, 07230 Muratpaşa/Antalya</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-gray-400 text-xs">
            © {currentYear} TORVIAN Transfer. {t("allRightsReserved")}
          </p>
          <p className="text-gray-400 text-xs">
            {t("tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
