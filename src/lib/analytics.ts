export interface AnalyticsEventPayload {
  eventType: string;
  page: string;
  step?: string;
  region?: string;
  locale?: string;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  gclid?: string;
  fbclid?: string;
  sessionId: string;
  visitorId: string;
  metadata?: Record<string, unknown>;
}

const SESSION_KEY = "analytics_session";
const VISITOR_KEY = "analytics_visitor_id";

/**
 * How long a visit may sit idle before the next event starts a new one.
 *
 * The session id used to live in localStorage with no expiry at all, so one
 * browser was one session forever: "unique visitors" counted browsers, and a
 * customer who booked in May was still the same open session in September.
 */
const SESSION_IDLE_MS = 30 * 60 * 1000;

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

/** Stable across visits, so a returning customer can be told from a new one. */
function getVisitorId() {
  if (typeof window === "undefined") return "server";
  try {
    const stored = window.localStorage.getItem(VISITOR_KEY);
    if (stored) return stored;
    const id = randomId("vis");
    window.localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return randomId("vis");
  }
}

interface Attribution {
  source: string;
  medium: string;
  campaign: string;
  referrer: string;
  gclid: string;
  fbclid: string;
}

interface StoredSession {
  id: string;
  lastActivity: number;
  attribution: Attribution;
}

const EMPTY_ATTRIBUTION: Attribution = {
  source: "direct",
  medium: "direct",
  campaign: "",
  referrer: "",
  gclid: "",
  fbclid: "",
};

function detectSourceFromReferrer(referrer: string): string {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host === window.location.hostname) return "direct";
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

/** What brought this visit here, read off the landing URL and the referrer. */
function computeAttribution(): Attribution {
  const url = new URL(window.location.href);
  const referrer = document.referrer || "";
  const utmSource = url.searchParams.get("utm_source");
  const gclid = url.searchParams.get("gclid") || "";
  const fbclid = url.searchParams.get("fbclid") || "";

  let source = utmSource || detectSourceFromReferrer(referrer);
  if (!utmSource && gclid) source = "google_ads";
  if (!utmSource && fbclid) source = "meta_ads";

  return {
    source,
    medium: url.searchParams.get("utm_medium") || (referrer ? "referral" : "direct"),
    campaign: url.searchParams.get("utm_campaign") || "",
    referrer,
    gclid,
    fbclid,
  };
}

/**
 * The current visit, rolled over after {@link SESSION_IDLE_MS} of silence.
 *
 * Attribution is stored alongside the id rather than under a key of its own,
 * so the two can never disagree: a new visit always gets the source that
 * actually brought it back, and internal navigation within a visit keeps
 * reporting the original one after the query string is gone.
 */
function getSession(): { id: string; attribution: Attribution } {
  if (typeof window === "undefined") {
    return { id: "server", attribution: EMPTY_ATTRIBUTION };
  }

  const now = Date.now();
  let session: StoredSession | null = null;

  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredSession;
      if (parsed?.id && now - parsed.lastActivity < SESSION_IDLE_MS) session = parsed;
    }
  } catch {
    // Unreadable or unavailable storage: fall through and start a fresh visit.
  }

  if (!session) {
    session = { id: randomId("sess"), lastActivity: now, attribution: computeAttribution() };
  }

  session.lastActivity = now;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Private mode and the like — the visit still reports, it just cannot be
    // stitched together across page loads.
  }

  return { id: session.id, attribution: session.attribution };
}

function getBrowserLocale() {
  if (typeof navigator === "undefined") return "unknown";
  return navigator.language || navigator.languages?.[0] || "unknown";
}

export async function trackAnalyticsEvent(
  eventType: string,
  details: Partial<Omit<AnalyticsEventPayload, "eventType" | "sessionId" | "visitorId">>
) {
  if (typeof window === "undefined") return;

  const session = getSession();

  // Country is deliberately not sent. It used to be guessed from
  // navigator.language, which reports the browser's language and not where the
  // visitor is: an English-language browser in Germany was filed under the US.
  // The tracking route reads it from the edge geo headers instead.
  const payload: AnalyticsEventPayload = {
    eventType,
    page: window.location.pathname,
    sessionId: session.id,
    visitorId: getVisitorId(),
    locale: getBrowserLocale(),
    ...session.attribution,
    ...details,
  } as AnalyticsEventPayload;

  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics should not block the booking flow.
  }
}

export function trackPageView(
  details?: Partial<Omit<AnalyticsEventPayload, "eventType" | "sessionId" | "visitorId" | "page">>
) {
  return trackAnalyticsEvent("page_view", details ?? {});
}

/**
 * Lightweight presence ping sent on a fixed interval while a tab is visible,
 * so the admin "live visitors" view can tell an active session from a stale
 * one without needing a real-time socket connection.
 *
 * These no longer become rows of their own — the tracking route uses them only
 * to push the session's last_seen forward.
 */
export function trackHeartbeat(
  details?: Partial<Omit<AnalyticsEventPayload, "eventType" | "sessionId" | "visitorId" | "page">>
) {
  return trackAnalyticsEvent("heartbeat", details ?? {});
}

export function trackBookingStep(
  step: string,
  details?: Partial<Omit<AnalyticsEventPayload, "eventType" | "sessionId" | "visitorId" | "step">>
) {
  return trackAnalyticsEvent("booking_step", { step, ...details });
}

export function trackPaymentSuccess(
  details?: Partial<Omit<AnalyticsEventPayload, "eventType" | "sessionId" | "visitorId" | "step">>
) {
  return trackAnalyticsEvent("payment_success", { step: "payment_success", ...details });
}
