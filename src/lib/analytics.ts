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

function getUtmParams() {
  if (typeof window === "undefined") {
    return { source: "direct", medium: "", campaign: "" };
  }
  const url = new URL(window.location.href);
  return {
    source: url.searchParams.get("utm_source") || "direct",
    medium: url.searchParams.get("utm_medium") || "",
    campaign: url.searchParams.get("utm_campaign") || "",
  };
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
    referrer: document.referrer || "",
    ...getUtmParams(),
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
