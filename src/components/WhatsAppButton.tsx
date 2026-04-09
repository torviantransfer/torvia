"use client";

import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function WhatsAppButton() {
  const t = useTranslations("common");
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "905469407955";
  const message = encodeURIComponent(t("whatsappMessage"));

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:shadow-xl"
    >
      <MessageCircle size={22} aria-hidden="true" />
    </a>
  );
}
