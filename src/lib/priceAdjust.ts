/**
 * Bulk price arithmetic for /admin/pricing.
 *
 * Lives here rather than in the panel or the route because both need it: the
 * table previews every new price before anything is written, and the route
 * recomputes it server-side rather than trusting numbers from the browser. Two
 * copies of the rounding would eventually disagree, and the disagreement would
 * show up as a preview that lied about what got saved.
 */

/** Columns a bulk adjustment may touch. Nothing else in `pricing` is money. */
export const ADJUSTABLE_FIELDS = [
  "one_way_price",
  "round_trip_price",
  "one_way_cash_price",
  "round_trip_cash_price",
  "cash_deposit_amount",
] as const;

export type AdjustField = (typeof ADJUSTABLE_FIELDS)[number];

export type AdjustMode = "amount" | "percent";

export interface AdjustInput {
  mode: AdjustMode;
  /** Negative lowers the price — the panel offers + and − over the same field. */
  value: number;
  fields: AdjustField[];
}

/** The money columns of one pricing row, as the panel and the route both see them. */
export type PriceFields = { [K in AdjustField]?: number | null };

export function isAdjustField(value: string): value is AdjustField {
  return (ADJUSTABLE_FIELDS as readonly string[]).includes(value);
}

/**
 * One price after the adjustment, or null when there was no price to adjust.
 *
 * A null column means "this vehicle does not offer that price here" — a region
 * with no cash price, say. Turning that into `0 + 20` would invent a price the
 * operator never set, so nulls are carried through untouched.
 *
 * Percent lands on a whole dollar because the panel and the booking cards both
 * render prices with no decimals; a 3% bump that shows as $103 but charges
 * $102.91 is a number nobody can reconcile against Stripe. A flat amount keeps
 * whatever precision the price already had.
 */
export function adjustPrice(
  base: number | null | undefined,
  mode: AdjustMode,
  value: number
): number | null {
  if (base == null) return null;
  const next =
    mode === "percent"
      ? Math.round(base * (1 + value / 100))
      : Math.round((base + value) * 100) / 100;
  return Math.max(0, next);
}

/** The adjusted money columns of one row — only the fields that were asked for. */
export function adjustFields(source: PriceFields, input: AdjustInput): PriceFields {
  const out: PriceFields = {};
  for (const field of input.fields) {
    out[field] = adjustPrice(source[field], input.mode, input.value);
  }
  return out;
}

/**
 * Why this adjustment cannot be applied to this row, or null when it can.
 *
 * `one_way_price` is NOT NULL and is the price every other number is quoted
 * against, so a discount deep enough to zero it out has to be refused rather
 * than saved — a free transfer is never what was meant, and nothing downstream
 * would catch it.
 */
export function adjustProblem(result: PriceFields, fields: AdjustField[]): string | null {
  if (!fields.includes("one_way_price")) return null;
  const oneWay = result.one_way_price;
  if (oneWay == null || oneWay <= 0) {
    return "Online tek yön fiyatı sıfırın altına iniyor";
  }
  return null;
}
