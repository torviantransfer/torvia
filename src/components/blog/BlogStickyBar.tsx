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
    <div
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch gap-2 px-3 py-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="flex items-center justify-center w-14 rounded-xl bg-emerald-500/10 text-emerald-700 active:scale-95 transition"
        >
          <MessageCircle size={20} strokeWidth={2} />
        </a>
        <Link
          href={bookingHref}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md active:scale-[0.99] transition"
          style={{ backgroundColor: "#F97316" }}
        >
          {nav("bookNow")}{fromLabel}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
