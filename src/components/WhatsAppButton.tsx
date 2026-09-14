"use client";

import Image from "next/image";
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
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "902426060763";
  const message = encodeURIComponent(t("whatsappMessage"));

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className={`fixed end-4 sm:end-6 z-50 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-transform hover:scale-105 ${
        aboveStickyBar
          ? "bottom-[calc(84px+env(safe-area-inset-bottom))] sm:bottom-6"
          : "bottom-5 sm:bottom-6"
      }`}
    >
      {/* The mark brings its own green disc and white ring, so the button is
          the artwork itself rather than a tinted square around a line icon.
          The depth is a drop-shadow on the image and not a box-shadow on the
          link: a box-shadow traces the link's own square-ish box, which sits
          outside the disc and read as a second faint circle behind it. */}
      <Image
        src="/images/whatsapp.png"
        alt=""
        width={128}
        height={128}
        className="w-full h-full drop-shadow-[0_3px_8px_rgba(0,0,0,0.28)]"
        aria-hidden="true"
      />
    </a>
  );
}
