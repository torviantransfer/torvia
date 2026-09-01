"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";

interface BlogStickyBarProps {
  /** Region slug to deep-link the booking flow (from the post's primary region). */
  regionSlug?: string | null;
  /** Lowest one-way price for that region, shown as a "from $X" hook. */
  price?: number | null;
}

/**
 * Mobile sticky booking bar for blog posts. Blog articles pull large volumes of
 * informational traffic (e.g. the Uber post ~4,470 impressions/quarter) that
 * never scrolls to the mid-article CTA. This keeps a one-tap "Book" action in
 * view so that traffic can convert into reservations.
 *
 * The bar carries the booking action only. It used to also hold a WhatsApp
 * button, which duplicated the floating WhatsApp button the same page renders
 * a few pixels away. WhatsApp now lives solely in that floating button, which
 * is raised above this bar.
 *
 * The bar is fixed, so it takes no space and used to cover the last rows of
 * the footer. The spacer reserves the same height at the end of the flow — it
 * renders after <Footer />, which is where the post page mounts this component.
 */
export default function BlogStickyBar({ regionSlug, price }: BlogStickyBarProps) {
  const nav = useTranslations("nav");
  const bookingHref = regionSlug ? `/booking?region=${regionSlug}` : "/booking";
  // price is the DB's one_way_price, stored in USD (see supabase/seed.sql) —
  // labeling it with "€" without conversion misstated the price.
  const fromLabel = price ? ` · $${Math.round(price)}` : "";

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
          {/* Orange matches the in-article CTA on the same page. The element
              used to carry both `bg-blue-600` and an inline orange, where the
              inline style silently won — the dead class is gone. */}
          <Link
            href={bookingHref}
            className="w-full h-[52px] flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 text-white font-semibold text-[15px] shadow-md active:scale-[0.99] transition"
          >
            <span className="truncate">{nav("bookNow")}{fromLabel}</span>
            <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
