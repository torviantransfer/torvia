"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

interface RegionStickyBarProps {
  /** Region slug (without -transfer suffix) used to deep-link the booking flow. */
  regionSlug: string;
}

/**
 * Mobile sticky booking bar for region pages. Hidden on desktop (>= sm).
 *
 * The bar carries the booking action only. It used to also hold a phone and a
 * WhatsApp button, which duplicated the floating WhatsApp button the same page
 * renders and left three competing targets crammed into one row. WhatsApp now
 * lives solely in that floating button, which is raised above this bar.
 *
 * The bar is fixed, so it takes no space and used to cover the last rows of
 * the footer. The spacer reserves the same height at the end of the flow — it
 * renders after <Footer />, which is where the page mounts this component.
 */
export default function RegionStickyBar({ regionSlug }: RegionStickyBarProps) {
  const t = useTranslations("regionDetail");

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
        <div className="px-3 py-2.5">
          <Link
            href={`/booking?region=${regionSlug}`}
            className="w-full h-[52px] flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-semibold text-[15px] shadow-md active:scale-[0.99] transition"
          >
            <span className="truncate">{t("bookNow")}</span>
            <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
