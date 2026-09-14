import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { vehicleIsActive, type VehicleFlag } from "@/lib/vehicleFlag";

type PriceRow = {
  round_trip_price: number | null;
  is_active: boolean | null;
  vehicle_categories?: VehicleFlag;
};

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const popularOnly = searchParams.get("popular") === "true";

  let query = supabase
    .from("regions")
    .select(
      "id, slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro, name_ar, distance_km, duration_minutes, is_popular, sort_order, latitude, longitude, pricing(round_trip_price, is_active, vehicle_categories(is_active))"
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
   * True when ANY bookable vehicle can do the return, since the form asks the
   * question before a vehicle has been chosen.
   *
   * "Bookable" has to include the vehicle's own active flag, not just the price
   * row's. A price survives its vehicle being switched off, and the retired
   * rows still carry the return fares those routes used to sell — so on the
   * row flag alone Kaş, Kalkan, Fethiye and Marmaris all still answered "yes"
   * and the form went on offering a return date that payment would refuse.
   */
  const rows = (data ?? []).map((region) => {
    const prices = (region.pricing ?? []) as unknown as PriceRow[];
    const hasRoundTrip = prices.some(
      (p) =>
        p.is_active !== false &&
        vehicleIsActive(p.vehicle_categories) &&
        p.round_trip_price != null
    );
    const { pricing: _pricing, ...rest } = region;
    return { ...rest, has_round_trip: hasRoundTrip };
  });

  return NextResponse.json(rows);
}
