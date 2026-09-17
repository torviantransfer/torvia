import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** A phone worth recording: digits only, at least 8 of them — same floor lib/pixel.ts uses for advanced matching. */
function isRecordablePhone(v: unknown): v is string {
  return typeof v === "string" && v.replace(/\D/g, "").length >= 8;
}

function isRecordableEmail(v: unknown): v is string {
  return typeof v === "string" && EMAIL_RE.test(v.trim());
}

/**
 * Captures a passenger-info form the visitor never submitted.
 *
 * Fired from BookingWizard as soon as the phone or email field becomes
 * valid — not on every keystroke, and never blocking the form. Nothing here
 * should ever surface to the customer: a failure here is a lost lead, not a
 * broken booking.
 *
 * One row per visit rather than one per keystroke: an existing row from the
 * same phone or email in the last two hours is updated in place, so someone
 * who keeps typing/correcting fields does not fill the admin list with
 * duplicates of themselves.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`booking-lead:${ip}`, { maxRequests: 20, windowMs: 60_000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const phone = isRecordablePhone(body.phone) ? body.phone.trim() : null;
    const email = isRecordableEmail(body.email) ? body.email.trim().toLowerCase() : null;
    if (!phone && !email) {
      return NextResponse.json({ error: "No recordable contact info" }, { status: 400 });
    }

    const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null);
    const row = {
      phone,
      email,
      first_name: text(body.firstName),
      last_name: text(body.lastName),
      region_slug: text(body.regionSlug),
      pickup_date: text(body.pickupDate),
      pickup_time: text(body.pickupTime),
      party_size: Number.isFinite(body.partySize) ? Math.max(1, Math.min(50, Math.round(body.partySize))) : null,
      locale: text(body.locale),
      updated_at: new Date().toISOString(),
    };

    const supabase = createAdminClient();
    const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const orMatch = [phone ? `phone.eq.${phone}` : null, email ? `email.eq.${email}` : null]
      .filter(Boolean)
      .join(",");

    const { data: existing, error: selectErr } = await supabase
      .from("booking_leads")
      .select("id")
      .or(orMatch)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (selectErr) console.error("booking-leads select error:", selectErr.message);

    const writeErr = existing
      ? (await supabase.from("booking_leads").update(row).eq("id", existing.id)).error
      : (await supabase.from("booking_leads").insert(row)).error;
    if (writeErr) console.error("booking-leads write error:", writeErr.message);

    // Never surfaced to the customer — a write failure here is a lost lead,
    // not a broken booking, so the response stays 200/success either way.
    return NextResponse.json({ success: !writeErr });
  } catch (err) {
    console.error("booking-leads capture error:", err instanceof Error ? err.message : String(err));
    // Never surfaced to the customer — see the note above.
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
