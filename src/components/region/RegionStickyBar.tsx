"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Phone, MessageCircle, ArrowRight } from "lucide-react";

const PHONE = "08508401327";
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "908508401327";

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
 */
export default function RegionStickyBar({
  regionSlug,
  whatsappMessage,
}: RegionStickyBarProps) {
  const t = useTranslations("regionDetail");
  const waHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch gap-2 px-3 py-2">
        <a
          href={`tel:${PHONE}`}
          aria-label={t("callNow")}
          className="flex flex-col items-center justify-center w-14 rounded-xl bg-blue-600/10 text-blue-700 active:scale-95 transition"
        >
          <Phone size={18} strokeWidth={2} />
          <span className="text-[10px] mt-0.5 font-medium">{t("callNow")}</span>
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("whatsappNow")}
          className="flex flex-col items-center justify-center w-14 rounded-xl bg-emerald-500/10 text-emerald-700 active:scale-95 transition"
        >
          <MessageCircle size={18} strokeWidth={2} />
          <span className="text-[10px] mt-0.5 font-medium">{t("whatsappNow")}</span>
        </a>
        <Link
          href={`/booking?region=${regionSlug}`}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md active:scale-[0.99] transition"
        >
          {t("bookNow")}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
