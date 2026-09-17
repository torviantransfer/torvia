import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_MS = 30 * 60 * 1000; // look back 30 min to catch "just left" sessions
const ACTIVE_NOW_MS = 90 * 1000; // heartbeat cadence is 25s, 90s covers a couple of missed beats
const LIVE_MS = 5 * 60 * 1000;

/**
 * One row per visit, already merged by the database.
 *
 * This used to read raw events and fold them into sessions here, which meant
 * pulling every heartbeat of the last half hour across the wire and hoping the
 * row cap did not cut the window short. The rollup happens on write now.
 */
interface SessionRow {
  session_id: string;
  visitor_id: string | null;
  first_seen: string;
  last_seen: string;
  last_page: string | null;
  region: string | null;
  locale: string | null;
  country: string | null;
  city: string | null;
  /** Only ever read to keep crawlers out of the live view. */
  device: string | null;
  source: string | null;
  selected_vehicle: boolean;
  form_started: boolean;
  reached_checkout: boolean;
  purchased: boolean;
  vehicle_slug: string | null;
  vehicle_price: number | null;
  page_views: number;
}

/**
 * Where this visitor has got to, as one value rather than four booleans the
 * client has to unpick. The order is the funnel's own, so the first match
 * walking down is always the furthest point reached.
 */
type Stage = "browsing" | "vehicle" | "form" | "payment" | "purchased";

function stageOf(s: SessionRow): Stage {
  if (s.purchased) return "purchased";
  if (s.reached_checkout) return "payment";
  if (s.form_started) return "form";
  if (s.selected_vehicle) return "vehicle";
  return "browsing";
}

function classifySource(source: string | null): string {
  return (source || "").trim().toLowerCase() || "direct";
}

const STAGE_RANK: Record<Stage, number> = {
  browsing: 0,
  vehicle: 1,
  form: 2,
  payment: 3,
  purchased: 4,
};

/**
 * One row per person rather than per browser tab.
 *
 * The session id lives in sessionStorage, which every tab gets its own copy
 * of, so somebody comparing two routes in two tabs was three rows in this
 * table and three people on the "kişi sitede" pill. The visitor id is in
 * localStorage and is shared across the tabs of one browser, so it is what
 * actually answers "how many people".
 *
 * Of a person's sessions we keep the one furthest down the funnel, not merely
 * the most recent: a second tab opened on the home page must not hide the
 * first one sitting on the payment step, which is the row worth seeing. Page
 * views are summed, since they were all made by the same person.
 */
function oneRowPerVisitor<T extends { visitor_id: string | null; session_id: string; page_views: number; last_seen: string }>(
  rows: T[],
  stage: (row: T) => Stage
): T[] {
  const best = new Map<string, T>();
  for (const row of rows) {
    // A session with no visitor id cannot be merged with anything, so it
    // stands on its own rather than being folded into a shared bucket.
    const key = row.visitor_id || `session:${row.session_id}`;
    const held = best.get(key);
    if (!held) {
      best.set(key, { ...row });
      continue;
    }
    held.page_views += row.page_views;
    const better =
      STAGE_RANK[stage(row)] > STAGE_RANK[stage(held)] ||
      (STAGE_RANK[stage(row)] === STAGE_RANK[stage(held)] && row.last_seen > held.last_seen);
    if (better) best.set(key, { ...row, page_views: held.page_views });
  }
  return [...best.values()];
}

function countBy<T>(rows: T[], key: (row: T) => string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = key(row);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
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
    .from("analytics_sessions")
    .select(
      "session_id, visitor_id, first_seen, last_seen, last_page, region, locale, country, city, device, source, selected_vehicle, form_started, reached_checkout, purchased, vehicle_slug, vehicle_price, page_views"
    )
    // Automated traffic keeps its rows but stays out of the live view, so a
    // crawler cannot show up as somebody standing on the payment page.
    .or("device.is.null,device.neq.bot")
    .gte("last_seen", since)
    .order("last_seen", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const rows = oneRowPerVisitor(((data ?? []) as SessionRow[]), stageOf)
    .map((s) => ({ ...s, ageMs: now - new Date(s.last_seen).getTime() }))
    .sort((a, b) => a.ageMs - b.ageMs);

  const activeNow = rows.filter((s) => s.ageMs < ACTIVE_NOW_MS);
  const live = rows.filter((s) => s.ageMs < LIVE_MS);
  const recentlyExited = rows.filter((s) => s.ageMs >= LIVE_MS).slice(0, 25);

  const shape = (s: SessionRow) => ({
    sessionId: s.session_id,
    page: s.last_page,
    source: classifySource(s.source),
    region: s.region,
    locale: s.locale,
    country: s.country,
    city: s.city,
    pageViews: s.page_views,
    firstSeen: s.first_seen,
    lastSeen: s.last_seen,
    selectedVehicle: s.selected_vehicle,
    formStarted: s.form_started,
    reachedCheckout: s.reached_checkout,
    purchased: s.purchased,
    vehicleName: s.vehicle_slug,
    vehiclePrice: s.vehicle_price,
    stage: stageOf(s),
  });

  return NextResponse.json({
    activeNowCount: activeNow.length,
    liveCount: live.length,
    vehicleSelectedCount: live.filter((s) => s.selected_vehicle).length,
    formStartedCount: live.filter((s) => s.form_started).length,
    checkoutCount: live.filter((s) => s.reached_checkout).length,
    purchasedCount: live.filter((s) => s.purchased).length,
    visitors: live
      .slice()
      .sort((a, b) => a.ageMs - b.ageMs)
      .map(shape),
    pageDistribution: countBy(live, (s) => s.last_page || "(bilinmiyor)")
      .map(([page, count]) => ({ page, count })),
    sourceDistribution: countBy(live, (s) => classifySource(s.source))
      .map(([source, count]) => ({ source, count })),
    countryDistribution: countBy(live, (s) => s.country || "unknown")
      .map(([country, count]) => ({ country, count })),
    recentlyExited: recentlyExited.map((s) => ({
      ...shape(s),
      lastPage: s.last_page,
    })),
  });
}
