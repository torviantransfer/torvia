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

async function send(event: CAPIEvent): Promise<void> {
  const token = process.env.FB_CAPI_ACCESS_TOKEN;
  if (!token) return;

  try {
    await fetch(`${CAPI_URL}?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [event] }),
    });
  } catch (err) {
    console.error("[CAPI] send error:", err);
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
  return ud;
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
