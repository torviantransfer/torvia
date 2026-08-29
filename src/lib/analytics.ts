export interface AnalyticsEventPayload {
  eventType: string;
  page: string;
  step?: string;
  region?: string;
  locale?: string;
  country?: string;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = "analytics_session_id";

function createSessionId() {
  return `sess_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

function getSessionId() {
  if (typeof window === "undefined") return "server";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const sessionId = createSessionId();
    window.localStorage.setItem(STORAGE_KEY, sessionId);
    return sessionId;
  } catch {
    return createSessionId();
  }
}

function getBrowserLocale() {
  if (typeof navigator === "undefined") return "unknown";
  return navigator.language || navigator.languages?.[0] || "unknown";
}

function getBrowserCountry() {
  const locale = getBrowserLocale();
  const match = locale.match(/[-_](\w{2})$/);
  return match ? match[1].toUpperCase() : "unknown";
}

const ATTRIBUTION_KEY = "analytics_attribution";

interface Attribution {
  source: string;
  medium: string;
  campaign: string;
  referrer: string;
}

function detectSourceFromReferrer(referrer: string): string {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (/(^|\.)google\./.test(host)) return "google";
    if (/instagram\.com$/.test(host)) return "instagram";
    if (/(facebook\.com|fb\.com)$/.test(host)) return "facebook";
    if (/(twitter\.com|t\.co|x\.com)$/.test(host)) return "twitter";
    if (/bing\.com$/.test(host)) return "bing";
    if (/yandex\./.test(host)) return "yandex";
    if (/(whatsapp\.com|wa\.me)$/.test(host)) return "whatsapp";
    return host;
  } catch {
    return "referral";
  }
}

/**
 * First-touch attribution for this browser tab session. Captured once (on the
 * landing page) and cached in sessionStorage, so internal navigations keep
 * reporting the original source instead of losing the utm/referrer once the
 * query string is gone or document.referrer points at our own previous page.
 */
function getAttribution(): Attribution {
  if (typeof window === "undefined") {
    return { source: "direct", medium: "", campaign: "", referrer: "" };
  }
  try {
    const stored = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    if (stored) return JSON.parse(stored) as Attribution;
  } catch {
    // fall through and recompute
  }

  const url = new URL(window.location.href);
  const referrer = document.referrer || "";
  const utmSource = url.searchParams.get("utm_source");
  const gclid = url.searchParams.get("gclid");
  const fbclid = url.searchParams.get("fbclid");

  let source = utmSource || detectSourceFromReferrer(referrer);
  if (!utmSource && gclid) source = "google_ads";
  if (!utmSource && fbclid) source = "meta_ads";

  const attribution: Attribution = {
    source,
    medium: url.searchParams.get("utm_medium") || (referrer ? "referral" : "direct"),
    campaign: url.searchParams.get("utm_campaign") || "",
    referrer,
  };

  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // ignore storage failures (private mode, etc.)
  }
  return attribution;
}

export async function trackAnalyticsEvent(
  eventType: string,
  details: Partial<Omit<AnalyticsEventPayload, "eventType" | "sessionId">>
) {
  if (typeof window === "undefined") return;

  const payload: AnalyticsEventPayload = {
    eventType,
    page: window.location.pathname,
    sessionId: getSessionId(),
    locale: getBrowserLocale(),
    country: getBrowserCountry(),
    ...getAttribution(),
    ...details,
  } as AnalyticsEventPayload;

  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Analytics should not block the booking flow.
  }
}

export function trackPageView(details?: Partial<Omit<AnalyticsEventPayload, "eventType" | "sessionId" | "page">>) {
  return trackAnalyticsEvent("page_view", details ?? {});
}

/**
 * Lightweight presence ping sent on a fixed interval while a tab is visible,
 * so the admin "live visitors" view can tell an active session from a stale
 * one without needing a real-time socket connection.
 */
export function trackHeartbeat(details?: Partial<Omit<AnalyticsEventPayload, "eventType" | "sessionId" | "page">>) {
  return trackAnalyticsEvent("heartbeat", details ?? {});
}

export function trackBookingStep(
  step: string,
  details?: Partial<Omit<AnalyticsEventPayload, "eventType" | "sessionId" | "step">>
) {
  return trackAnalyticsEvent("booking_step", { step, ...details });
}

export function trackPaymentSuccess(
  details?: Partial<Omit<AnalyticsEventPayload, "eventType" | "sessionId" | "step">>
) {
  return trackAnalyticsEvent("payment_success", { step: "payment_success", ...details });
}
