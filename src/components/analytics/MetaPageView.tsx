"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { newPixelEventId, pixelPageView } from "@/lib/pixel";

/**
 * Mounted once in the root locale layout, next to PresenceTracker.
 *
 * Does two things the pixel snippet alone cannot:
 *
 *  - reports every pageview to the Conversions API as well, under the same
 *    event id the browser used, so Meta merges the two instead of counting the
 *    visit twice. Server-side coverage is what Events Manager asks for when it
 *    offers a lower cost per result for PageView;
 *  - fires a PageView on client-side navigations. The snippet runs once per
 *    full page load, so every route change after that used to go unreported.
 *
 * The first pageview of a load is already sent by the snippet — before React
 * has hydrated, which is the whole point — and leaves its id on the window for
 * this component to pick up.
 */
export default function MetaPageView() {
  const pathname = usePathname();
  const reportedPath = useRef<string | null>(null);

  useEffect(() => {
    // Guards a repeated render of the same route, and the effect that React
    // runs twice in development.
    if (reportedPath.current === pathname) return;
    reportedPath.current = pathname;

    const handedOver = window.__fbPageViewId;
    if (handedOver) {
      // Claim it, so a remount cannot report this pageview a second time.
      delete window.__fbPageViewId;
      reportToServer(handedOver);
      return;
    }

    const eventId = newPixelEventId();
    pixelPageView(eventId);
    reportToServer(eventId);
  }, [pathname]);

  return null;
}

function reportToServer(eventId: string) {
  fetch("/api/meta/pageview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId,
      url: window.location.href,
      // The pixel writes _fbc from this, but not in time for the first
      // pageview of an ad click — the one visit where it matters most.
      fbclid: new URLSearchParams(window.location.search).get("fbclid") ?? undefined,
    }),
    // Survives the navigation that a link click starts moments later.
    keepalive: true,
  }).catch(() => {
    // The browser pixel already reported this pageview; the server copy is an
    // improvement on it, not a replacement, so a failure is not worth surfacing.
  });
}
