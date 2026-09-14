import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const popularOnly = searchParams.get("popular") === "true";

  let query = supabase
    .from("regions")
    .select(
      "id, slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro, name_ar, distance_km, duration_minutes, is_popular, sort_order, latitude, longitude, pricing(round_trip_price, is_active)"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (popularOnly) {
    query = query.eq("is_popular", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  /**
   * Whether this region can be booked as a round trip at all.
   *
   * We do not run return legs on the long routes — Kaş, Kalkan, Fethiye,
   * Marmaris and the Finike corridor — and those regions carry no
   * `round_trip_price`. The booking form needs to know before it offers a
   * return date, because /api/reservations only rejects the booking at the
   * final step: without this the customer picks a return, is quoted the
   * one-way fare by lib/pricing's fallback, fills in the whole form and is
   * turned away at payment.
   *
   * True when ANY active vehicle can do the return, since the form asks the
   * question before a vehicle has been chosen.
   */
  const rows = (data ?? []).map((region) => {
    const prices = (region.pricing ?? []) as {
      round_trip_price: number | null;
      is_active: boolean | null;
    }[];
    const hasRoundTrip = prices.some(
      (p) => p.is_active !== false && p.round_trip_price != null
    );
    const { pricing: _pricing, ...rest } = region;
    return { ...rest, has_round_trip: hasRoundTrip };
  });

  return NextResponse.json(rows);
}
