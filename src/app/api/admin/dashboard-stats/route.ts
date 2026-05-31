import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // All non-cancelled reservations for aggregation
  const { data: reservations } = await admin
    .from("reservations")
    .select("id, status, total_price, created_at, pickup_datetime, trip_type, region_id, regions(name_en)")
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: true });

  const all = reservations ?? [];

  // --- Monthly Revenue (last 12 months) ---
  const now = new Date();
  const monthlyRevenue: { month: string; revenue: number; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en", { month: "short", year: "2-digit" });
    const month = d.getMonth();
    const year = d.getFullYear();
    const inMonth = all.filter((r) => {
      const rd = new Date(r.created_at);
      return rd.getMonth() === month && rd.getFullYear() === year;
    });
    const paidInMonth = inMonth.filter((r) =>
      ["paid", "driver_assigned", "passenger_picked_up", "completed"].includes(r.status)
    );
    monthlyRevenue.push({
      month: label,
      revenue: Math.round(paidInMonth.reduce((s, r) => s + r.total_price, 0) * 100) / 100,
      count: inMonth.length,
    });
  }

  // --- Status Distribution ---
  const statusMap: Record<string, number> = {};
  for (const r of all) {
    statusMap[r.status] = (statusMap[r.status] ?? 0) + 1;
  }
  const statusDistribution = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // --- Top Regions (by reservation count) ---
  const regionMap: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const r of all) {
    const rn = Array.isArray(r.regions) ? r.regions[0] : r.regions;
    const name = (rn as { name_en: string } | null)?.name_en ?? "Unknown";
    if (!regionMap[name]) regionMap[name] = { name, count: 0, revenue: 0 };
    regionMap[name].count++;
    if (["paid", "driver_assigned", "passenger_picked_up", "completed"].includes(r.status)) {
      regionMap[name].revenue += r.total_price;
    }
  }
  const topRegions = Object.values(regionMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((r) => ({ ...r, revenue: Math.round(r.revenue * 100) / 100 }));

  // --- Trip Type Distribution ---
  const oneWay = all.filter((r) => r.trip_type === "one_way").length;
  const roundTrip = all.filter((r) => r.trip_type === "round_trip").length;
  const tripTypes = [
    { name: "One Way", value: oneWay },
    { name: "Round Trip", value: roundTrip },
  ];

  // --- Daily bookings (last 30 days) ---
  const dailyBookings: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en", { day: "2-digit", month: "short" });
    const count = all.filter((r) => r.created_at?.slice(0, 10) === dayStr).length;
    dailyBookings.push({ date: label, count });
  }

  // --- Summary stats ---
  const totalRevenue = all
    .filter((r) => ["paid", "driver_assigned", "passenger_picked_up", "completed"].includes(r.status))
    .reduce((s, r) => s + r.total_price, 0);

  const thisMonth = all.filter((r) => {
    const rd = new Date(r.created_at);
    return rd.getMonth() === now.getMonth() && rd.getFullYear() === now.getFullYear();
  });
  const thisMonthRevenue = thisMonth
    .filter((r) => ["paid", "driver_assigned", "passenger_picked_up", "completed"].includes(r.status))
    .reduce((s, r) => s + r.total_price, 0);

  const cancelRequested = all.filter((r) => r.status === "cancel_requested").length;

  return NextResponse.json({
    monthlyRevenue,
    statusDistribution,
    topRegions,
    tripTypes,
    dailyBookings,
    summary: {
      totalReservations: all.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      thisMonthCount: thisMonth.length,
      thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
      cancelRequested,
    },
  });
}
