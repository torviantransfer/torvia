"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface WhatsAppButtonProps {
  /**
   * Lift the button clear of the mobile sticky bar.
   *
   * Region and blog pages render a sticky bottom bar on phones. The bar is
   * 72px tall plus the home-indicator inset, and this button is z-50 against
   * its z-40 — so at the default offset it lands on top of the booking
   * button. Those pages pass `aboveStickyBar`, which raises it just above the
   * bar on mobile and leaves the desktop position untouched, since the bar is
   * not rendered there at all.
   */
  aboveStickyBar?: boolean;
}

export default function WhatsAppButton({ aboveStickyBar = false }: WhatsAppButtonProps = {}) {
  const t = useTranslations("common");
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "905469407955";
  const message = encodeURIComponent(t("whatsappMessage"));

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className={`fixed right-4 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:shadow-xl ${
        aboveStickyBar
          ? "bottom-[calc(84px+env(safe-area-inset-bottom))] sm:bottom-6"
          : "bottom-5 sm:bottom-6"
      }`}
    >
      <MessageCircle size={22} aria-hidden="true" />
    </a>
  );
}
