import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MS = 30 * 60 * 1000; // look back 30 min to catch "just left" sessions
const ACTIVE_NOW_MS = 90 * 1000; // heartbeat cadence is 25s, 90s covers a couple of missed beats
const LIVE_MS = 5 * 60 * 1000;

interface EventRow {
  session_id: string | null;
  event_type: string;
  page: string | null;
  step: string | null;
  region: string | null;
  locale: string | null;
  country: string | null;
  referrer: string | null;
  source: string | null;
  medium: string | null;
  created_at: string;
}

interface SessionAgg {
  sessionId: string;
  lastPage: string | null;
  lastSeen: string;
  firstSeen: string;
  source: string;
  medium: string | null;
  region: string | null;
  locale: string | null;
  country: string | null;
  selectedVehicle: boolean;
  reachedCheckout: boolean;
  purchased: boolean;
}

function classifySource(source: string | null): string {
  const s = (source || "").trim().toLowerCase();
  return s || "direct";
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { data, error } = await admin
    .from("analytics_events")
    .select("session_id, event_type, page, step, region, locale, country, referrer, source, medium, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(3000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as EventRow[];
  const sessions = new Map<string, SessionAgg>();

  // Rows are newest-first, so the first time we see a session_id it gives us
  // its current page / last-seen time; every later occurrence pushes firstSeen
  // further back and lets us pick up funnel milestones (vehicle_selected, etc).
  for (const row of rows) {
    if (!row.session_id) continue;
    let agg = sessions.get(row.session_id);
    if (!agg) {
      agg = {
        sessionId: row.session_id,
        lastPage: row.page,
        lastSeen: row.created_at,
        firstSeen: row.created_at,
        source: classifySource(row.source),
        medium: row.medium,
        region: row.region,
        locale: row.locale,
        country: row.country,
        selectedVehicle: false,
        reachedCheckout: false,
        purchased: false,
      };
      sessions.set(row.session_id, agg);
    } else {
      agg.firstSeen = row.created_at;
    }

    if (row.event_type === "booking_step" && row.step === "vehicle_selected") agg.selectedVehicle = true;
    if (row.event_type === "booking_step" && row.step === "checkout_initiated") agg.reachedCheckout = true;
    if (row.event_type === "payment_success") agg.purchased = true;
  }

  const now = Date.now();
  const all = Array.from(sessions.values());
  const withAge = all.map((s) => ({ ...s, ageMs: now - new Date(s.lastSeen).getTime() }));

  const activeNow = withAge.filter((s) => s.ageMs < ACTIVE_NOW_MS);
  const live = withAge.filter((s) => s.ageMs < LIVE_MS);
  const recentlyExited = withAge
    .filter((s) => s.ageMs >= LIVE_MS)
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
    .slice(0, 25);

  const pageCounts = new Map<string, number>();
  for (const s of live) {
    const key = s.lastPage || "(bilinmiyor)";
    pageCounts.set(key, (pageCounts.get(key) ?? 0) + 1);
  }

  const sourceCounts = new Map<string, number>();
  for (const s of live) {
    sourceCounts.set(s.source, (sourceCounts.get(s.source) ?? 0) + 1);
  }

  return NextResponse.json({
    activeNowCount: activeNow.length,
    liveCount: live.length,
    vehicleSelectedCount: live.filter((s) => s.selectedVehicle).length,
    checkoutCount: live.filter((s) => s.reachedCheckout).length,
    purchasedCount: live.filter((s) => s.purchased).length,
    visitors: live
      .sort((a, b) => a.ageMs - b.ageMs)
      .map((s) => ({
        sessionId: s.sessionId,
        page: s.lastPage,
        source: s.source,
        region: s.region,
        locale: s.locale,
        country: s.country,
        lastSeen: s.lastSeen,
        firstSeen: s.firstSeen,
        selectedVehicle: s.selectedVehicle,
        reachedCheckout: s.reachedCheckout,
        purchased: s.purchased,
      })),
    pageDistribution: Array.from(pageCounts.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count),
    sourceDistribution: Array.from(sourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
    recentlyExited: recentlyExited.map((s) => ({
      sessionId: s.sessionId,
      lastPage: s.lastPage,
      source: s.source,
      lastSeen: s.lastSeen,
      selectedVehicle: s.selectedVehicle,
      reachedCheckout: s.reachedCheckout,
      purchased: s.purchased,
    })),
  });
}
