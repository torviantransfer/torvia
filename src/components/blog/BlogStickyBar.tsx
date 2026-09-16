"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowRight } from "lucide-react";
import PriceTag from "@/components/PriceTag";

interface BlogStickyBarProps {
  /** Region slug to deep-link the booking flow (from the post's primary region). */
  regionSlug?: string | null;
  /** Lowest one-way price — the post's region, or the cheapest route. */
  price?: number | null;
}

/** How far the reader scrolls before the bar appears — roughly past the title. */
const SHOW_AFTER_PX = 420;

/**
 * Mobile booking bar for blog posts.
 *
 * Blog articles pull large volumes of informational traffic that never scrolls
 * to the in-article card, so a one-tap booking action stays in reach. It is not
 * there on arrival, though: someone who searched a question and landed on the
 * answer should see the answer first, not a button over its opening lines.
 *
 * Same look as the region page's bar. The price goes through PriceTag — it used
 * to print the number with a "$" while prices are in euro, and it ignored the
 * currency switcher.
 *
 * The bar is fixed, so it takes no space; the spacer after the footer reserves
 * its height so it never covers the last rows of the page.
 */
export default function BlogStickyBar({ regionSlug, price }: BlogStickyBarProps) {
  const nav = useTranslations("nav");
  const bookingHref = regionSlug ? `/booking?region=${regionSlug}` : "/booking";
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const update = () => setShown(window.scrollY > SHOW_AFTER_PX);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <>
      <div aria-hidden className="sm:hidden" style={{ height: "calc(72px + env(safe-area-inset-bottom))" }} />
      <div
        className={`fixed bottom-0 start-0 end-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur transition-transform duration-300 supports-[backdrop-filter]:bg-white/85 motion-reduce:transition-none sm:hidden ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-hidden={!shown}
        inert={!shown}
      >
        <div className="px-3 py-2.5">
          <Link
            href={bookingHref}
            className="flex h-[52px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#007AFF] text-[15px] font-semibold text-white shadow-md transition active:scale-[0.99]"
          >
            <span className="truncate">
              {nav("bookNow")}
              {price ? (
                <>
                  {" · "}
                  <PriceTag amount={price} showLabel={false} />
                </>
              ) : null}
            </span>
            <ArrowRight size={16} className="shrink-0 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
