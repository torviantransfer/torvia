/**
 * Whether a price row belongs to a vehicle that is still being sold.
 *
 * A row in `pricing` outlives its vehicle category being switched off — the
 * prices are not deleted, they just stop being reachable through the booking
 * flow, which filters on the category. Everything else that reads the table
 * took the cheapest row without asking, so a retired vehicle could set the
 * price shown on a region page, in its schema.org offers, and in the route
 * picker's "from" figure.
 *
 * It stayed invisible while every category held the same fares. Moving to euro
 * broke the tie: only the active category was converted, so the retired rows
 * kept their dollar figures, and being the smaller number they won. Marmaris
 * advertised 280 against a real fare of 318, and offered Google a 530 round
 * trip on a route where we run no return leg at all.
 *
 * The array case is the part worth keeping: PostgREST returns an embedded
 * to-one relation as an object but types it as an array, and the shape varies
 * across these queries. Reading `.is_active` off an array yields undefined,
 * `!== false` passes, and the filter silently stops filtering — so it fails
 * open, which is the worst way for a guard like this to be wrong.
 */
export type VehicleFlag =
  | { is_active: boolean | null }
  | { is_active: boolean | null }[]
  | null;

export function vehicleIsActive(vc: VehicleFlag | undefined): boolean {
  const one = Array.isArray(vc) ? vc[0] : vc;
  return one?.is_active !== false;
}
