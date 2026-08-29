"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView, trackHeartbeat } from "@/lib/analytics";

const HEARTBEAT_INTERVAL_MS = 25_000;

/**
 * Mounted once in the root locale layout. Fires a page_view on every route
 * change and a periodic heartbeat while the tab is visible, so the admin
 * "live visitors" view can tell who is currently on the site and where.
 * Skips /admin routes so staff browsing their own panel don't get counted
 * as site visitors.
 */
export default function PresenceTracker() {
  const pathname = usePathname();
  const isAdminRoute = /^\/[a-z]{2}\/admin(\/|$)/.test(pathname ?? "");

  useEffect(() => {
    if (isAdminRoute) return;
    trackPageView();
  }, [pathname, isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute) return;

    const ping = () => {
      if (document.visibilityState === "visible") trackHeartbeat();
    };

    ping();
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", ping);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [isAdminRoute]);

  return null;
}
