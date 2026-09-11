import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseUserAgent } from "@/lib/userAgent";

const VALID_EVENTS = ["page_view", "booking_step", "payment_success", "heartbeat"];

/**
 * A heartbeat says nothing except "still here", and one arrives every 25
 * seconds per open tab. Storing them as events buried the real ones: the
 * reports read the newest rows up to PostgREST's row cap, and on a busy day
 * that cap was reached inside an hour of heartbeats.
 *
 * They now only move the session's last_seen forward.
 */
const SESSION_ONLY_EVENTS = new Set(["heartbeat"]);

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Where the visitor actually is, according to the edge.
 *
 * The browser used to supply this, derived from navigator.language, which is
 * the language it was configured with and not a location. Anyone running an
 * English browser outside the US was filed as American, and the header that
 * knew better was only consulted when the browser sent nothing.
 */
function geoFromHeaders(request: Request) {
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    null;

  const rawCity = request.headers.get("x-vercel-ip-city") ?? request.headers.get("cf-ipcity");
  let city: string | null = null;
  if (rawCity) {
    // Vercel percent-encodes it, so "Sankt%20Petersburg" would otherwise be
    // stored and charted verbatim.
    try {
      city = decodeURIComponent(rawCity);
    } catch {
      city = rawCity;
    }
  }

  return {
    country: country && country !== "XX" ? country.toUpperCase() : null,
    city,
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body || typeof body.eventType !== "string" || !VALID_EVENTS.includes(body.eventType)) {
    return NextResponse.json({ error: "Invalid analytics payload" }, { status: 400 });
  }

  const sessionId = str(body.sessionId);
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { country, city } = geoFromHeaders(request);
  const { device, os, browser } = parseUserAgent(request.headers.get("user-agent"));

  const metadata = (body.metadata ?? null) as Record<string, unknown> | null;
  const step = str(body.step);
  const page = str(body.page);

  const { error: sessionError } = await admin.rpc("touch_analytics_session", {
    p_session_id: sessionId,
    p_visitor_id: str(body.visitorId),
    p_page: page,
    p_region: str(body.region),
    p_locale: str(body.locale),
    p_country: country,
    p_city: city,
    p_device: device,
    p_os: os,
    p_browser: browser,
    p_source: str(body.source),
    p_medium: str(body.medium),
    p_campaign: str(body.campaign),
    p_referrer: str(body.referrer),
    p_gclid: str(body.gclid),
    p_fbclid: str(body.fbclid),
    p_event_type: body.eventType,
    p_step: step,
    p_vehicle_slug: str(metadata?.vehicle),
    p_vehicle_price: num(metadata?.price),
    p_revenue: num(metadata?.revenue),
  });

  // Deliberately not fatal. If the session rollup is unavailable — most likely
  // because the app was deployed before migration 081 ran — the funnel events
  // below are still worth keeping, and failing the request would only lose
  // them too.
  if (sessionError) {
    console.error("[analytics] session rollup failed:", sessionError.message);
  }

  if (SESSION_ONLY_EVENTS.has(body.eventType)) {
    return NextResponse.json({ status: "ok", session: sessionError ? "failed" : "ok" });
  }

  const { error } = await admin.from("analytics_events").insert([
    {
      event_type: body.eventType,
      page,
      step,
      region: str(body.region),
      locale: str(body.locale),
      country,
      city,
      device,
      os,
      browser,
      referrer: str(body.referrer),
      source: str(body.source),
      medium: str(body.medium),
      campaign: str(body.campaign),
      session_id: sessionId,
      visitor_id: str(body.visitorId),
      metadata,
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
