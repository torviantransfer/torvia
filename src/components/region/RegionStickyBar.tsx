"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Phone, MessageCircle, ArrowRight } from "lucide-react";

const PHONE = "905469407955";
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "905469407955";

interface RegionStickyBarProps {
  /** Region slug (without -transfer suffix) used to deep-link the booking flow. */
  regionSlug: string;
  /** Pre-filled WhatsApp message (already translated by parent). */
  whatsappMessage: string;
}

/**
 * Mobile-first sticky bottom action bar shown on region pages. Provides
 * one-tap access to phone, WhatsApp, and the booking flow without forcing
 * the user to scroll back to the hero. Hidden on desktop (>= sm).
 *
 * The bar is fixed, so it takes no space in the document and used to sit on
 * top of the last rows of the footer. The spacer below reserves the same
 * height at the end of the flow — it renders after <Footer /> because that is
 * where the page mounts this component — so nothing ends up underneath it.
 */
export default function RegionStickyBar({
  regionSlug,
  whatsappMessage,
}: RegionStickyBarProps) {
  const t = useTranslations("regionDetail");
  const waHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      <div
        aria-hidden
        className="sm:hidden"
        style={{ height: "calc(72px + env(safe-area-inset-bottom))" }}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch gap-2 px-3 py-2.5">
          <a
            href={`tel:${PHONE}`}
            aria-label={t("callNow")}
            className="flex flex-col items-center justify-center gap-0.5 w-[52px] h-[52px] shrink-0 rounded-xl bg-blue-600/10 text-blue-700 active:scale-95 transition"
          >
            <Phone size={19} strokeWidth={2} aria-hidden="true" />
            <span className="text-[10px] leading-none font-medium">{t("callNow")}</span>
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("whatsappNow")}
            className="flex flex-col items-center justify-center gap-0.5 w-[52px] h-[52px] shrink-0 rounded-xl bg-emerald-500/10 text-emerald-700 active:scale-95 transition"
          >
            <MessageCircle size={19} strokeWidth={2} aria-hidden="true" />
            <span className="text-[10px] leading-none font-medium">{t("whatsappNow")}</span>
          </a>
          <Link
            href={`/booking?region=${regionSlug}`}
            className="flex-1 min-w-0 h-[52px] flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-semibold text-[15px] shadow-md active:scale-[0.99] transition"
          >
            <span className="truncate">{t("bookNow")}</span>
            <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
