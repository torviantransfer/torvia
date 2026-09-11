import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOKING_TZ } from "@/lib/datetime";

/**
 * Visitor reports, counted in people rather than in events.
 *
 * Every distribution here used to be built by tallying rows of
 * analytics_events. Since the presence tracker wrote a row every 25 seconds,
 * that tallied time-on-site: the country whose visitors read the most slowly
 * came first. Worse, the query had no limit, so PostgREST returned only its
 * max-rows page of the newest events and the "last 30 days" panel was really
 * showing the last hour or two.
 *
 * Both go away by reading analytics_sessions, which holds one row per visit.
 */

const RANGES = {
  today: 0,
  "7d": 6,
  "30d": 29,
  "90d": 89,
} as const;

type RangeKey = keyof typeof RANGES;

/**
 * Midnight in Antalya, `daysAgo` days back, as a real instant.
 *
 * "Today" has to mean the Turkish day or the morning's bookings land in
 * yesterday's column for anyone reading the panel before 03:00. Istanbul has
 * been on a fixed UTC+3 with no daylight saving since 2016, so the day starts
 * at 21:00 UTC the evening before.
 */
function dayStart(daysAgo: number): Date {
  const shifted = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const day = shifted.toLocaleDateString("en-CA", { timeZone: BOOKING_TZ });
  return new Date(`${day}T00:00:00+03:00`);
}

interface SessionRow {
  session_id: string;
  visitor_id: string | null;
  first_seen: string;
  entry_page: string | null;
  country: string | null;
  device: string | null;
  os: string | null;
  browser: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  selected_vehicle: boolean;
  form_started: boolean;
  reached_checkout: boolean;
  purchased: boolean;
  revenue: number | null;
}

const COLUMNS =
  "session_id, visitor_id, first_seen, entry_page, country, device, os, browser, source, medium, campaign, selected_vehicle, form_started, reached_checkout, purchased, revenue";

const PAGE_SIZE = 1000;
/** Enough for a very busy quarter; past this the panel says so rather than lying. */
const MAX_ROWS = 50_000;

/** Aggregate of one slice of visits — the shape every breakdown table returns. */
interface Bucket {
  name: string;
  visitors: number;
  vehicle: number;
  form: number;
  checkout: number;
  purchased: number;
  revenue: number;
}

function emptyBucket(name: string): Bucket {
  return { name, visitors: 0, vehicle: 0, form: 0, checkout: 0, purchased: 0, revenue: 0 };
}

function breakdown(rows: SessionRow[], key: (row: SessionRow) => string | null, limit = 10): Bucket[] {
  const buckets = new Map<string, Bucket>();

  for (const row of rows) {
    const name = key(row);
    if (name === null) continue;
    let bucket = buckets.get(name);
    if (!bucket) {
      bucket = emptyBucket(name);
      buckets.set(name, bucket);
    }
    bucket.visitors += 1;
    if (row.selected_vehicle) bucket.vehicle += 1;
    if (row.form_started) bucket.form += 1;
    if (row.reached_checkout) bucket.checkout += 1;
    if (row.purchased) {
      bucket.purchased += 1;
      bucket.revenue += Number(row.revenue ?? 0);
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, limit);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requested = new URL(request.url).searchParams.get("range");
  const range: RangeKey = requested && requested in RANGES ? (requested as RangeKey) : "30d";
  const since = dayStart(RANGES[range]);

  const admin = createAdminClient();
  const rows: SessionRow[] = [];

  // PostgREST caps every response at its max-rows setting, so a single
  // unbounded select silently returns a partial answer — which is exactly how
  // the "last 30 days" panel came to be showing the last couple of hours.
  //
  // Paging on its own would not be enough: a short page can mean either the
  // end of the data or a server cap below what was asked for, and the two are
  // indistinguishable by length. The exact count settles it, and doubles as
  // the check for whether the ceiling below was reached.
  let total: number | null = null;

  while (rows.length < MAX_ROWS) {
    const { data, error, count } = await admin
      .from("analytics_sessions")
      .select(COLUMNS, { count: "exact" })
      .gte("first_seen", since.toISOString())
      .or("device.is.null,device.neq.bot")
      .order("first_seen", { ascending: false })
      .range(rows.length, rows.length + PAGE_SIZE - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (count !== null && count !== undefined) total = count;

    const page = (data ?? []) as SessionRow[];
    rows.push(...page);

    // An empty page always ends it, whatever the count claimed.
    if (page.length === 0) break;
    if (total !== null && rows.length >= total) break;
  }

  const truncated = total !== null && total > rows.length;

  const visitors = rows.length;
  const uniqueVisitors = new Set(rows.map((r) => r.visitor_id ?? r.session_id)).size;
  const returning = visitors - uniqueVisitors;

  const vehicleSessions = rows.filter((r) => r.selected_vehicle).length;
  const formSessions = rows.filter((r) => r.form_started).length;
  const checkoutSessions = rows.filter((r) => r.reached_checkout).length;
  const purchasedSessions = rows.filter((r) => r.purchased).length;
  const revenue = rows.reduce((sum, r) => sum + (r.purchased ? Number(r.revenue ?? 0) : 0), 0);

  // Every stage is a share of the visits that reached it, so the drop-off
  // between two bars is readable without doing the arithmetic by hand.
  const funnel = [
    { name: "Siteye Girdi", value: visitors },
    { name: "Araç Seçti", value: vehicleSessions },
    { name: "Form Doldurdu", value: formSessions },
    { name: "Ödeme Başlattı", value: checkoutSessions },
    { name: "Satın Aldı", value: purchasedSessions },
  ];

  return NextResponse.json({
    range,
    since: since.toISOString(),
    truncated,
    funnel,
    countries: breakdown(rows, (r) => r.country ?? "unknown"),
    sources: breakdown(rows, (r) => (r.source || "direct").toLowerCase()),
    // An empty campaign is the overwhelming majority of organic traffic and
    // would bury the paid ones it exists to compare.
    campaigns: breakdown(rows, (r) => r.campaign?.trim() || null),
    devices: breakdown(rows, (r) => r.device ?? "unknown", 6),
    browsers: breakdown(rows, (r) => r.browser ?? "unknown", 6),
    landingPages: breakdown(rows, (r) => r.entry_page ?? "(bilinmiyor)"),
    summary: {
      visitors,
      uniqueVisitors,
      returning,
      vehicleSessions,
      formSessions,
      checkoutSessions,
      purchasedSessions,
      revenue: Math.round(revenue * 100) / 100,
      conversionRate: visitors > 0 ? Math.round((purchasedSessions / visitors) * 1000) / 10 : 0,
    },
  });
}
