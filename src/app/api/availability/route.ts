import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to query params required" }, { status: 400 });
  }

  try {
    // Get max daily bookings setting
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "max_daily_bookings")
      .single();

    const maxDaily = setting ? Number(setting.value) : 3;

    // Get manually blocked dates
    const { data: blockedDates } = await supabase
      .from("blocked_dates")
      .select("blocked_date, reason")
      .gte("blocked_date", from)
      .lte("blocked_date", to);

    const blockedSet = new Set(
      (blockedDates ?? []).map((d) => d.blocked_date)
    );

    // Count reservations per date (only non-cancelled statuses)
    const { data: reservations } = await supabase
      .from("reservations")
      .select("pickup_datetime, status")
      .gte("pickup_datetime", `${from}T00:00:00`)
      .lte("pickup_datetime", `${to}T23:59:59`)
      .not("status", "in", '("cancelled")');

    // Count bookings per date
    const dateCounts: Record<string, number> = {};
    for (const r of reservations ?? []) {
      const date = r.pickup_datetime.split("T")[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    }

    // Also count return dates for round trips
    const { data: returnReservations } = await supabase
      .from("reservations")
      .select("return_datetime, status")
      .not("return_datetime", "is", null)
      .gte("return_datetime", `${from}T00:00:00`)
      .lte("return_datetime", `${to}T23:59:59`)
      .not("status", "in", '("cancelled")');

    for (const r of returnReservations ?? []) {
      if (r.return_datetime) {
        const date = r.return_datetime.split("T")[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    }

    // Build unavailable dates list
    const unavailableDates: { date: string; reason: string }[] = [];

    // Add manually blocked dates
    for (const bd of blockedDates ?? []) {
      unavailableDates.push({
        date: bd.blocked_date,
        reason: bd.reason || "blocked",
      });
    }

    // Add dates that reached max capacity
    for (const [date, count] of Object.entries(dateCounts)) {
      if (count >= maxDaily && !blockedSet.has(date)) {
        unavailableDates.push({
          date,
          reason: "full",
        });
      }
    }

    return NextResponse.json({
      maxDaily,
      dateCounts,
      unavailableDates,
    });
  } catch (err) {
    console.error("Availability API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
