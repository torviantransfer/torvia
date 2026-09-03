import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  capacityFor,
  countBookingsByDate,
  getDateOverrides,
  getGlobalMaxDaily,
} from "@/lib/availability";

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
    const [maxDaily, overrides, dateCounts] = await Promise.all([
      getGlobalMaxDaily(supabase),
      getDateOverrides(supabase, from, to),
      countBookingsByDate(supabase, from, to),
    ]);

    // Effective capacity per date: the override when one exists, else the global.
    const capacities: Record<string, number> = {};
    for (const [date, override] of overrides) {
      capacities[date] = capacityFor(override, maxDaily);
    }

    const unavailableDates: { date: string; reason: string }[] = [];

    // Dates the operator closed outright (override row with no number, or 0).
    for (const [date, override] of overrides) {
      if (capacityFor(override, maxDaily) === 0) {
        unavailableDates.push({ date, reason: override.reason || "blocked" });
      }
    }

    // Dates that hit their capacity — per-date when overridden, else global.
    const closed = new Set(unavailableDates.map((d) => d.date));
    for (const [date, count] of Object.entries(dateCounts)) {
      if (closed.has(date)) continue;
      if (count >= capacityFor(overrides.get(date), maxDaily)) {
        unavailableDates.push({ date, reason: "full" });
      }
    }

    // If checkDate is specified and it's unavailable, suggest next available dates
    let suggestedDates: string[] = [];
    const suggestedVehicles: Record<
      string,
      { name: string; slug: string; image_url: string | null; max_passengers: number }[]
    > = {};

    if (checkDate) {
      const unavailableSet = new Set(unavailableDates.map((d) => d.date));

      if (unavailableSet.has(checkDate)) {
        const baseDate = new Date(checkDate + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Search forward and backward for available dates
        for (let offset = 1; offset <= 30 && suggestedDates.length < 4; offset++) {
          const after = new Date(baseDate);
          after.setDate(after.getDate() + offset);
          const afterStr = after.toISOString().split("T")[0];
          if (after >= today && !unavailableSet.has(afterStr)) {
            suggestedDates.push(afterStr);
          }

          if (suggestedDates.length < 4) {
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
        suggestedDates = suggestedDates.slice(0, 4);

        // Fetch available vehicles for suggested dates
        const regionSlug = searchParams.get("region");
        if (suggestedDates.length > 0 && regionSlug) {
          const { data: cats } = await supabase
            .from("vehicle_categories")
            .select("name, slug, image_url, max_passengers")
            .eq("is_active", true)
            .order("sort_order");

          if (cats && cats.length > 0) {
            for (const sd of suggestedDates) {
              const { data: dateReservations } = await supabase
                .from("reservations")
                .select("category_slug")
                .gte("pickup_datetime", `${sd}T00:00:00`)
                .lte("pickup_datetime", `${sd}T23:59:59`)
                .not("status", "in", '("cancelled")');

              const bookedSlugs = new Set(
                (dateReservations ?? []).map((r) => r.category_slug)
              );
              suggestedVehicles[sd] = cats
                .filter((c) => !bookedSlugs.has(c.slug))
                .map((c) => ({
                  name: c.name,
                  slug: c.slug,
                  image_url: c.image_url,
                  max_passengers: c.max_passengers,
                }));
            }
          }
        }
      }
    }

    return NextResponse.json({
      maxDaily,
      capacities,
      dateCounts,
      unavailableDates,
      ...(checkDate
        ? {
            checkDate,
            isAvailable: !unavailableDates.some((d) => d.date === checkDate),
            suggestedDates,
            suggestedVehicles,
          }
        : {}),
    });
  } catch (err) {
    console.error("Availability API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
