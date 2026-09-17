import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import NewsletterForm from "@/components/NewsletterForm";
import PaymentMethodsStrip from "@/components/PaymentMethodsStrip";
import Image from "next/image";
import { Mail, MessageCircle, Phone, MapPin, ChevronDown } from "lucide-react";

import type { Locale } from "@/i18n/config";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "902426060763";

export default async function Footer() {
  const t = await getTranslations("footer");
  const locale = (await getLocale()) as Locale;
  const currentYear = new Date().getFullYear();

  // Fetch popular regions SERVER-SIDE so the internal links are present in the
  // initial HTML and crawlable by Googlebot (previously loaded via client fetch,
  // so search engines never saw these site-wide internal links).
  let popularRegions: ({ slug: string } & Record<string, string>)[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("regions")
      .select("slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro")
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
            <Image
              src="/images/logo.png"
              alt="TORVIAN Transfer"
              width={720}
              height={170}
              className="h-10 w-auto mb-3"
            />
            <p className="text-[13.5px] leading-relaxed text-[#6e6e73]">{t("description")}</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://instagram.com/torviantransfer" target="_blank" rel="noopener noreferrer" aria-label="TORVIAN Transfer on Instagram" className="grid size-10 place-items-center rounded-full bg-black/[0.04] text-[#6e6e73] transition hover:bg-black/[0.07] hover:text-[#1d1d1f]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>
            </a>
            <a href="https://facebook.com/torviantransfer" target="_blank" rel="noopener noreferrer" aria-label="TORVIAN Transfer on Facebook" className="grid size-10 place-items-center rounded-full bg-black/[0.04] text-[#6e6e73] transition hover:bg-black/[0.07] hover:text-[#1d1d1f]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" aria-label="Contact TORVIAN Transfer on WhatsApp" className="grid size-10 place-items-center rounded-full bg-[#E8F7EE] text-[#248A3D] transition hover:bg-[#d8f0e2]">
              <MessageCircle size={18} aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mb-10 md:mb-12 pb-8 md:pb-10" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="mb-1 text-[15px] font-semibold text-[#1d1d1f]">{t("newsletterTitle")}</h3>
              <p className="text-[13.5px] text-[#6e6e73]">{t("newsletterSubtitle")}</p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        {/* Site map.
            Measured on production 2026-09-07: /en/hotel-transfer-antalya and
            /en/vip-transfer-antalya each had exactly one internal link on the
            whole site (from /en/booking), and /en/lara-beach-transfer had one
            (from /en/kundu-lara-transfer). Meanwhile /en/about, /en/contact
            and /en/faq had seventy-four each, because they are in this footer
            and the landing pages were not. Internal links are how Google
            decides which pages matter, and the three pages that sell were the
            least linked indexable pages on the site.

            Two renderings of one list. A phone got the desktop's five columns
            squeezed into two, where "Antalya Havalimanı Transfer" wrapped onto
            three lines and the whole map ran past two screens; here it
            collapses into tappable sections the way a phone settings screen
            does. Both are plain markup with no JavaScript, so every link stays
            in the HTML for a crawler whichever one is on screen. */}
        {(() => {
          const sections = [
            {
              heading: t("servicesHeading"),
              links: [
                { href: "/antalya-airport-transfer", label: t("linkAirportTransfer") },
                { href: "/vip-transfer-antalya", label: t("linkVipTransfer") },
                { href: "/hotel-transfer-antalya", label: t("linkHotelTransfer") },
                { href: "/lara-beach-transfer", label: t("linkLaraBeach") },
              ],
            },
            {
              heading: t("company"),
              links: [
                { href: "/about", label: t("about") },
                { href: "/contact", label: t("contact") },
                { href: "/blog", label: t("blog") },
                { href: "/faq", label: t("faq") },
              ],
            },
            {
              heading: t("destinations"),
              links: popularRegions.slice(0, 8).map((region) => ({
                href: `/${region.slug.endsWith("-transfer") ? region.slug : `${region.slug}-transfer`}`,
                label: `${(region[`name_${locale}` as keyof typeof region] as string) || region.name_en} Transfer`,
              })),
            },
            {
              heading: t("legal"),
              links: [
                { href: "/privacy", label: t("privacy") },
                { href: "/terms", label: t("terms") },
                { href: "/cookies", label: t("cookies") },
                { href: "/cancellation", label: t("cancellation") },
                { href: "/kvkk", label: t("kvkk") },
              ],
            },
          ];

          const linkClass = "text-[13.5px] text-[#6e6e73] transition-colors hover:text-[#1d1d1f]";
          const rowClass = "flex items-center gap-2 text-[13.5px] text-[#6e6e73] transition-colors hover:text-[#1d1d1f]";

          const supportItems = (
            <>
              <li>
                <a href="tel:+902426060763" className={rowClass}>
                  <Phone size={14} className="shrink-0" />
                  0242 606 07 63
                </a>
              </li>
              <li>
                <a href="mailto:torviantransfer@gmail.com" className={rowClass}>
                  <Mail size={14} className="shrink-0" />
                  <span className="break-all">torviantransfer@gmail.com</span>
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className={rowClass}>
                  <MessageCircle size={14} className="shrink-0" />
                  WhatsApp
                </a>
              </li>
              <li className="pt-1">
                <div className="flex items-start gap-2 text-[13.5px] leading-relaxed text-[#6e6e73]">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span>Yenigöl Mah. Lavanta Sk. No:22, 07200 Muratpaşa/Antalya</span>
                </div>
              </li>
            </>
          );

          return (
            <>
              {/* Phone: collapsed sections */}
              <div className="mb-8 divide-y divide-black/[0.06] overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.06] lg:hidden">
                {sections.map((section) => (
                  <details key={section.heading} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-[14px] font-medium text-[#1d1d1f] transition active:bg-black/[0.03]">
                      {section.heading}
                      <ChevronDown size={16} className="shrink-0 text-[#c7c7cc] transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <ul className="space-y-2.5 px-4 pb-4">
                      {section.links.map((item) => (
                        <li key={item.href}>
                          <Link href={item.href} className={linkClass}>{item.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-[14px] font-medium text-[#1d1d1f] transition active:bg-black/[0.03]">
                    {t("support")}
                    <ChevronDown size={16} className="shrink-0 text-[#c7c7cc] transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <ul className="space-y-2.5 px-4 pb-4">{supportItems}</ul>
                </details>
              </div>

              {/* Desktop: the five columns side by side */}
              <div className="mb-10 hidden gap-8 lg:mb-12 lg:grid lg:grid-cols-5">
                {sections.map((section) => (
                  <div key={section.heading}>
                    <h3 className="mb-4 text-[13px] font-semibold text-[#1d1d1f]">{section.heading}</h3>
                    <ul className="space-y-2.5">
                      {section.links.map((item) => (
                        <li key={item.href}>
                          <Link href={item.href} className={linkClass}>{item.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div>
                  <h3 className="mb-4 text-[13px] font-semibold text-[#1d1d1f]">{t("support")}</h3>
                  <ul className="space-y-2.5">{supportItems}</ul>
                </div>
              </div>
            </>
          );
        })()}

        {/* Accepted payment methods. On every page, not just checkout: a
            visitor comparing transfer sites decides whether this one is real
            long before they reach a payment form, and the wallet marks answer
            "can I pay the way I always pay" without them having to start a
            booking to find out. */}
        <div className="flex justify-center pb-6 pt-2 lg:hidden">
          <PaymentMethodsStrip maxWidth={460} />
        </div>

        {/* Bottom. On a wide screen the strip sits in the middle of this row,
            between the copyright and the tagline, so the three smallest things
            on the page share one line instead of the logos taking a band of
            their own above it. A phone has no middle column to give it, so
            there it stays stacked above. */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-[12px] text-[#86868b] sm:flex-1">
            © {currentYear} TORVIAN Transfer. {t("allRightsReserved")}
          </p>
          <div className="hidden justify-center lg:flex">
            <PaymentMethodsStrip maxWidth={390} />
          </div>
          <p className="text-[12px] text-[#86868b] sm:flex-1 sm:text-end">
            {t("tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
