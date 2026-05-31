import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_EVENTS = ["page_view", "booking_step", "payment_success"];

export async function POST(request: Request) {
  const body = await request.json();
  if (!body || typeof body.eventType !== "string" || !VALID_EVENTS.includes(body.eventType)) {
    return NextResponse.json({ error: "Invalid analytics payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const countryHeader = request.headers.get("x-vercel-ip-country") ?? undefined;

  const insertPayload = {
    event_type: body.eventType,
    page: body.page ?? null,
    step: body.step ?? null,
    region: body.region ?? null,
    locale: body.locale ?? null,
    country: body.country || countryHeader || null,
    referrer: body.referrer ?? null,
    source: body.source ?? null,
    medium: body.medium ?? null,
    campaign: body.campaign ?? null,
    session_id: body.sessionId ?? null,
    metadata: body.metadata ?? null,
  };

  const { error } = await admin.from("analytics_events").insert([insertPayload]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
