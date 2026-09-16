import type { createAdminClient } from "@/lib/supabase/admin";
import type { MiniRegion } from "@/components/booking/BookingFormMini";
import type { RegionPrice } from "@/components/booking/RegionPriceGrid";
import type { ReviewRow } from "@/lib/reviews";
import { vehicleIsActive, type VehicleFlag } from "@/lib/vehicleFlag";

/**
 * What a page that sells a transfer needs on first paint: the route picker's
 * destinations, every bookable fare, today's exchange rates and the approved
 * reviews.
 *
 * Moved out of /booking when the landing pages started showing the same form
 * and the same fares. Two copies of the "is this fare bookable" filter is how
 * a retired vehicle's price got onto a page once already (see vehicleFlag).
 */
export interface BookingData {
  initialRegions: MiniRegion[];
  regionPrices: (RegionPrice & { isPopular: boolean })[];
  initialRates: Record<string, number>;
  reviews: ReviewRow[];
}

type PricingRow = {
  one_way_price: number;
  round_trip_price: number | null;
  is_active: boolean | null;
  vehicle_categories?: VehicleFlag;
};

export async function loadBookingData(
  supabase: ReturnType<typeof createAdminClient>,
  locale: string
): Promise<BookingData> {
  /* Every destination with its online fare. Read on the server so the prices
     are in the HTML the crawler and the first paint both see. */
  const [{ data: regionRows }, { data: rateRows }, { data: reviewRows }] = await Promise.all([
    supabase
      .from("regions")
      .select(
        "id, slug, name_tr, name_en, name_de, name_pl, name_ru, name_nl, name_ro, name_ar, distance_km, duration_minutes, sort_order, is_popular, pricing(one_way_price, round_trip_price, is_active, vehicle_categories(is_active))"
      )
      .eq("is_active", true)
      .order("sort_order"),
    /* Read here for the same reason the fares are: so the first paint already
       carries the price in the currency this locale quotes. Fetched in the
       browser, it made every price on the page change once. */
    supabase
      .from("exchange_rates")
      .select("target_currency, rate")
      .eq("base_currency", "EUR"),
    /* Approved reviews. Read on the server with everything else, so the one
       piece of reassurance on the page costs no extra request and no wait. */
    supabase
      .from("reviews")
      .select(
        "id, rating, comment, created_at, published_at, author_name, author_country, locale, source, customers(first_name)"
      )
      .eq("is_approved", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(50),
  ]);

  const initialRates: Record<string, number> = { USD: 1 };
  for (const r of (rateRows ?? []) as { target_currency: string; rate: number }[]) {
    initialRates[r.target_currency] = Number(r.rate);
  }

  /* The route picker's own list. Same filter and same order as /api/regions,
     which is what the form fetched for itself. Not filtered by pricing the way
     the price cards are: a destination with no fare set should still be
     pickable, and the vehicle step is where a missing price is discovered. */
  const initialRegions: MiniRegion[] = (regionRows ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      slug: String(r.slug),
      name_tr: String(r.name_tr ?? ""),
      name_en: String(r.name_en ?? ""),
      name_de: String(r.name_de ?? ""),
      name_pl: String(r.name_pl ?? ""),
      name_ru: String(r.name_ru ?? ""),
      name_nl: String(r.name_nl ?? ""),
      name_ro: r.name_ro ? String(r.name_ro) : undefined,
      name_ar: r.name_ar ? String(r.name_ar) : undefined,
      /* Whether a return leg is sold here. The long routes carry no
         round_trip_price because we do not run them, and the form has to know
         that before it offers a return date — otherwise the booking is only
         refused at payment. Any active vehicle that can do the return is
         enough: the question is asked before a vehicle is chosen. */
      has_round_trip: ((r.pricing ?? []) as PricingRow[]).some(
        (p) => p.is_active !== false && vehicleIsActive(p.vehicle_categories) && p.round_trip_price != null
      ),
    };
  });

  const regionPrices = (regionRows ?? [])
    .map((row) => {
      const r = row as Record<string, unknown>;
      /* A price row outlives its vehicle being switched off, so the cheapest
         row in the table is not necessarily one anyone can book. */
      const fares = ((r.pricing ?? []) as PricingRow[]).filter(
        (p) => p.is_active !== false && vehicleIsActive(p.vehicle_categories) && Number(p.one_way_price) > 0
      );

      if (fares.length === 0) return null;

      // The entry-level vehicle sets the headline. Its own return fare comes
      // with it rather than the cheapest return of any vehicle, or the two
      // figures would describe different cars.
      const cheapest = fares.reduce((low, p) => (Number(p.one_way_price) < Number(low.one_way_price) ? p : low));

      return {
        slug: r.slug as string,
        name: (r[`name_${locale}`] as string) || (r.name_en as string),
        distanceKm: (r.distance_km as number | null) ?? null,
        durationMin: (r.duration_minutes as number | null) ?? null,
        oneWay: Number(cheapest.one_way_price),
        roundTrip: cheapest.round_trip_price != null ? Number(cheapest.round_trip_price) : null,
        isPopular: r.is_popular === true,
      };
    })
    .filter((r): r is RegionPrice & { isPopular: boolean } => r !== null);

  return {
    initialRegions,
    regionPrices,
    initialRates,
    reviews: (reviewRows ?? []) as unknown as ReviewRow[],
  };
}
