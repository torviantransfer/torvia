import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const since = new Date(now);
  since.setDate(now.getDate() - 30);

  const { data: analytics, error } = await admin
    .from("analytics_events")
    .select(
      "session_id, event_type, page, step, region, locale, country, referrer, source, medium, campaign, metadata, created_at"
    )
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = analytics ?? [];
  const uniqueSessionSet = new Set<string>();
  const countryMap: Record<string, number> = {};
  const pageMap: Record<string, number> = {};
  const sourceMap: Record<string, number> = {};
  const sessionProgress = new Map<string, { started: boolean; converted: boolean }>();

  for (const row of rows) {
    const sessionId = row.session_id ?? "unknown";
    uniqueSessionSet.add(sessionId);

    const country = (row.country || "unknown") as string;
    countryMap[country] = (countryMap[country] ?? 0) + 1;

    const page = (row.page || "/unknown") as string;
    pageMap[page] = (pageMap[page] ?? 0) + 1;

    const source = (row.source || "direct") as string;
    sourceMap[source] = (sourceMap[source] ?? 0) + 1;

    const progress = sessionProgress.get(sessionId) ?? { started: false, converted: false };
    if (row.event_type === "page_view" && typeof row.page === "string" && row.page.includes("/booking")) {
      progress.started = true;
    }
    if (row.event_type === "payment_success") {
      progress.converted = true;
    }
    sessionProgress.set(sessionId, progress);
  }

  const topCountries = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const topPages = Object.entries(pageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const topSources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const bookingSessions = Array.from(sessionProgress.values()).filter((session) => session.started).length;
  const convertedSessions = Array.from(sessionProgress.values()).filter((session) => session.converted).length;
  const conversionRate = bookingSessions > 0 ? Math.round((convertedSessions / bookingSessions) * 100) : 0;

  const funnel = [
    { name: "Booking Açılışları", value: rows.filter((e) => e.event_type === "page_view" && typeof e.page === "string" && e.page.includes("/booking")).length },
    { name: "Araç Seçimi", value: rows.filter((e) => e.event_type === "booking_step" && e.step === "vehicle_selected").length },
    { name: "Ödeme Başlatıldı", value: rows.filter((e) => e.event_type === "booking_step" && e.step === "checkout_initiated").length },
    { name: "Ödeme Tamamlandı", value: rows.filter((e) => e.event_type === "payment_success").length },
  ];

  return NextResponse.json({
    funnel,
    topCountries,
    topPages,
    topSources,
    summary: {
      eventsLast30Days: rows.length,
      uniqueSessions: uniqueSessionSet.size,
      bookingSessions,
      paymentSuccessSessions: convertedSessions,
      conversionRate,
    },
  });
}
