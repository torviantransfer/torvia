import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const checkDate = searchParams.get("checkDate");

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

    // If checkDate is specified and it's unavailable, suggest next available dates
    let suggestedDates: string[] = [];
    let suggestedVehicles: Record<string, { name: string; slug: string; image_url: string | null; max_passengers: number }[]> = {};
    if (checkDate) {
      const unavailableSet = new Set(unavailableDates.map((d) => d.date));
      const isDateUnavailable = unavailableSet.has(checkDate);

      if (isDateUnavailable) {
        const baseDate = new Date(checkDate + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Search forward and backward for available dates
        for (let offset = 1; offset <= 30 && suggestedDates.length < 3; offset++) {
          // Check date after
          const after = new Date(baseDate);
          after.setDate(after.getDate() + offset);
          const afterStr = after.toISOString().split("T")[0];
          if (after >= today && !unavailableSet.has(afterStr)) {
            suggestedDates.push(afterStr);
          }

          // Check date before
          if (suggestedDates.length < 3) {
            const before = new Date(baseDate);
            before.setDate(before.getDate() - offset);
            const beforeStr = before.toISOString().split("T")[0];
            if (before >= today && !unavailableSet.has(beforeStr)) {
              suggestedDates.push(beforeStr);
            }
          }
        }

        // Sort by proximity to checkDate
        suggestedDates.sort((a, b) => {
          const diffA = Math.abs(new Date(a).getTime() - baseDate.getTime());
          const diffB = Math.abs(new Date(b).getTime() - baseDate.getTime());
          return diffA - diffB;
        });
        suggestedDates = suggestedDates.slice(0, 3);

        // Fetch available vehicles for suggested dates
        if (suggestedDates.length > 0) {
          const regionSlug = searchParams.get("region");
          if (regionSlug) {
            // Get all active vehicle categories
            const { data: cats } = await supabase
              .from("vehicle_categories")
              .select("name, slug, image_url, max_passengers")
              .eq("is_active", true)
              .order("sort_order");

            if (cats && cats.length > 0) {
              // For each suggested date, check which vehicles have availability
              for (const sd of suggestedDates) {
                // Count bookings per vehicle category on this date
                const { data: dateReservations } = await supabase
                  .from("reservations")
                  .select("category_slug")
                  .gte("pickup_datetime", `${sd}T00:00:00`)
                  .lte("pickup_datetime", `${sd}T23:59:59`)
                  .not("status", "in", '("cancelled")');

                const bookedSlugs = new Set((dateReservations ?? []).map((r) => r.category_slug));
                suggestedVehicles[sd] = cats
                  .filter((c) => !bookedSlugs.has(c.slug))
                  .map((c) => ({ name: c.name, slug: c.slug, image_url: c.image_url, max_passengers: c.max_passengers }));
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      maxDaily,
      dateCounts,
      unavailableDates,
      ...(checkDate ? { checkDate, isAvailable: !unavailableDates.some((d) => d.date === checkDate), suggestedDates, suggestedVehicles } : {}),
    });
  } catch (err) {
    console.error("Availability API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
