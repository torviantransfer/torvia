import crypto from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "970302365960353";
const API_VERSION = "v21.0";
const CAPI_URL = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function hashPhone(phone: string): string {
  return sha256(phone.replace(/\D/g, ""));
}

export interface CAPIUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  /** _fbp cookie — the pixel's own id for this browser. Sent raw, never hashed. */
  fbp?: string | null;
  /** _fbc cookie, or one derived from an fbclid. Sent raw, never hashed. */
  fbc?: string | null;
}

interface CAPIEvent {
  event_name: string;
  event_time: number;
  event_id?: string;
  action_source: "website";
  event_source_url?: string;
  user_data: Record<string, unknown>;
  custom_data?: Record<string, unknown>;
}

let missingTokenReported = false;

async function send(event: CAPIEvent): Promise<void> {
  const token = process.env.FB_CAPI_ACCESS_TOKEN;
  if (!token) {
    // Without this the whole module is a no-op, and Events Manager simply
    // reports 0% Conversions API coverage with nothing in the logs to explain
    // it. Say it once per process rather than once per event.
    if (!missingTokenReported) {
      missingTokenReported = true;
      console.error(
        "[CAPI] FB_CAPI_ACCESS_TOKEN is not set — no server-side events are reaching Meta."
      );
    }
    return;
  }

  const payload: Record<string, unknown> = { data: [event] };
  // Set this to the code shown in Events Manager › Test Events to watch events
  // arrive live; leave it unset in production or the events stay in test.
  const testEventCode = process.env.FB_CAPI_TEST_EVENT_CODE;
  if (testEventCode) payload.test_event_code = testEventCode;

  try {
    const res = await fetch(`${CAPI_URL}?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Meta answers 200 for accepted events and describes the problem in the
      // body for everything else — an expired token, a wrong pixel id, a
      // malformed field. Dropping that response is how a pixel goes weeks
      // reporting no server events at all.
      console.error(
        `[CAPI] ${event.event_name} rejected (${res.status}): ${await res.text()}`
      );
    }
  } catch (err) {
    console.error(`[CAPI] ${event.event_name} send error:`, err);
  }
}

function buildUserData(u: CAPIUserData): Record<string, unknown> {
  const ud: Record<string, unknown> = {};
  if (u.email) ud.em = [sha256(u.email)];
  if (u.phone) ud.ph = [hashPhone(u.phone)];
  if (u.firstName) ud.fn = [sha256(u.firstName)];
  if (u.lastName) ud.ln = [sha256(u.lastName)];
  if (u.clientIp) ud.client_ip_address = u.clientIp;
  if (u.clientUserAgent) ud.client_user_agent = u.clientUserAgent;
  // fbp/fbc are Meta's own identifiers and are matched verbatim — hashing them
  // makes them useless.
  if (u.fbp) ud.fbp = u.fbp;
  if (u.fbc) ud.fbc = u.fbc;
  return ud;
}

/* ─── The browser's identity, read off the request ───────────────────────────
 * fbp and fbc are the strongest signals a server event can carry: an event
 * without them is matched on hashed contact details alone, and a PageView has
 * none of those to offer. Any event sent from a route the browser itself
 * called should start from here.
 */

function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const value = part.slice(eq + 1).trim();
    return value ? decodeURIComponent(value) : undefined;
  }
  return undefined;
}

/**
 * The fbc value Meta expects, built from a click id.
 *
 * Needed for the first pageview of an ad click: the pixel writes the _fbc
 * cookie in the browser, but the request reporting that pageview can leave
 * before the cookie exists — which is exactly the visit that came from an ad.
 */
export function fbcFromClickId(fbclid: string, timestamp = Date.now()): string {
  return `fb.1.${timestamp}.${fbclid}`;
}

/**
 * Event ids arrive from the browser, so hold them to the shape newPixelEventId
 * produces — a UUID, or its short fallback.
 */
export function isEventId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._-]{8,64}$/.test(value);
}

/** IP, user agent and Meta's cookies, as far as this request reveals them. */
export function identityFromRequest(request: Request): CAPIUserData {
  const cookieHeader = request.headers.get("cookie");
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return {
    clientIp: forwardedFor || request.headers.get("x-real-ip") || undefined,
    clientUserAgent: request.headers.get("user-agent") || undefined,
    fbp: readCookie(cookieHeader, "_fbp"),
    fbc: readCookie(cookieHeader, "_fbc"),
  };
}

/* ─── Events ────────────────────────────────────────────────────────────────*/

/**
 * The server's copy of a browser PageView.
 *
 * `eventId` must be the id the pixel used for the same pageview, or Meta
 * counts the visit twice instead of merging the two into one better-matched
 * event.
 */
export function capiPageView(
  userData: CAPIUserData,
  eventSourceUrl: string,
  eventId: string,
  eventTime = Math.floor(Date.now() / 1000)
) {
  return send({
    event_name: "PageView",
    event_time: eventTime,
    event_id: eventId,
    action_source: "website",
    event_source_url: eventSourceUrl,
    user_data: buildUserData(userData),
  });
}

export function capiInitiateCheckout(
  value: number,
  currency: string,
  userData: CAPIUserData,
  eventSourceUrl?: string,
  eventId?: string
) {
  return send({
    event_name: "InitiateCheckout",
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: eventSourceUrl,
    user_data: buildUserData(userData),
    custom_data: { value, currency, content_type: "product", content_ids: ["transfer"] },
  });
}

export function capiPurchase(
  value: number,
  currency: string,
  orderId: string,
  userData: CAPIUserData,
  eventSourceUrl?: string,
  eventId?: string
) {
  return send({
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId ?? `purchase_${orderId}`,
    action_source: "website",
    event_source_url: eventSourceUrl,
    user_data: buildUserData(userData),
    custom_data: { value, currency, content_type: "product", content_ids: ["transfer"], order_id: orderId },
  });
}

export function capiContact(
  userData: CAPIUserData,
  eventSourceUrl?: string,
  eventId?: string
) {
  return send({
    event_name: "Contact",
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: eventSourceUrl,
    user_data: buildUserData(userData),
  });
}
