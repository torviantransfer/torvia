"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { MessageCircle, ArrowRight } from "lucide-react";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "905469407955";

interface BlogStickyBarProps {
  /** Region slug to deep-link the booking flow (from the post's primary region). */
  regionSlug?: string | null;
  /** Lowest one-way price for that region, shown as a "from $X" hook. */
  price?: number | null;
}

/**
 * Mobile sticky booking bar for blog posts. Blog articles pull large volumes of
 * informational traffic (e.g. the Uber post ~4,470 impressions/quarter) that
 * never scrolls to the mid-article CTA. This keeps a one-tap "Book" + WhatsApp
 * action in view so that traffic can convert into reservations.
 */
export default function BlogStickyBar({ regionSlug, price }: BlogStickyBarProps) {
  const nav = useTranslations("nav");
  const c = useTranslations("common");
  const waHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(c("whatsappMessage"))}`;
  const bookingHref = regionSlug ? `/booking?region=${regionSlug}` : "/booking";
  // price is the DB's one_way_price, stored in USD (see supabase/seed.sql) —
  // labeling it with "€" without conversion misstated the price.
  const fromLabel = price ? ` · $${Math.round(price)}` : "";

  return (
    <>
      {/* The bar is fixed and takes no space, so without this it covered the
          last rows of the footer. It renders after <Footer /> because that is
          where the post page mounts this component. */}
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
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex items-center justify-center w-[52px] h-[52px] shrink-0 rounded-xl bg-emerald-500/10 text-emerald-700 active:scale-95 transition"
          >
            <MessageCircle size={20} strokeWidth={2} aria-hidden="true" />
          </a>
          {/* Orange matches the in-article CTA on the same page. The element
              used to carry both `bg-blue-600` and an inline orange, where the
              inline style silently won — the dead class is gone. */}
          <Link
            href={bookingHref}
            className="flex-1 min-w-0 h-[52px] flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 text-white font-semibold text-[15px] shadow-md active:scale-[0.99] transition"
          >
            <span className="truncate">{nav("bookNow")}{fromLabel}</span>
            <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
