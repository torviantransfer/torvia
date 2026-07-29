/**
 * Single source of truth for whether a coupon may be applied.
 *
 * This logic used to be duplicated in /api/pricing and /api/reservations, and
 * both copies had the same defect: `new Date(coupon.valid_until)` on a NULL
 * column yields 1970-01-01, so `now <= validUntil` was false and every coupon
 * created without an end date — which the admin form explicitly allows, see
 * CouponsManager's `valid_until: form.valid_until || null` — was silently
 * rejected. Keeping one implementation means that class of bug can only ever
 * exist in one place.
 *
 * NULL semantics, matching what the admin UI implies:
 *   valid_from  NULL → already active
 *   valid_until NULL → never expires
 *   max_uses    NULL → unlimited uses
 */

export type CouponRow = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number | string;
  min_order?: number | string | null;
  max_uses?: number | null;
  used_count?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean | null;
};

export type CouponRejection =
  | "not_found"
  | "inactive"
  | "not_started"
  | "expired"
  | "exhausted"
  | "min_order";

export type CouponResult =
  | {
      valid: true;
      id: string;
      code: string;
      discountType: "percent" | "fixed";
      /** Percentage off, 0 when the coupon is a fixed-amount one. */
      discountPercent: number;
      /** Absolute amount off, 0 when the coupon is a percentage one. */
      discountFixed: number;
    }
  | { valid: false; reason: CouponRejection };

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/**
 * @param coupon    Row from `coupons`, or null when the code matched nothing.
 * @param orderTotal Pre-discount total, used only for the `min_order` check.
 *                   Omit to skip that check (e.g. before a vehicle is chosen).
 */
export function evaluateCoupon(
  coupon: CouponRow | null | undefined,
  orderTotal?: number
): CouponResult {
  if (!coupon) return { valid: false, reason: "not_found" };
  if (coupon.is_active === false) return { valid: false, reason: "inactive" };

  const now = Date.now();

  // NULL / unparseable dates mean "no bound", never "the epoch".
  const from = coupon.valid_from ? Date.parse(coupon.valid_from) : NaN;
  if (Number.isFinite(from) && now < from) {
    return { valid: false, reason: "not_started" };
  }

  const until = coupon.valid_until ? Date.parse(coupon.valid_until) : NaN;
  if (Number.isFinite(until) && now > until) {
    return { valid: false, reason: "expired" };
  }

  // NULL max_uses means unlimited.
  if (coupon.max_uses != null && num(coupon.used_count) >= num(coupon.max_uses)) {
    return { valid: false, reason: "exhausted" };
  }

  if (
    orderTotal != null &&
    coupon.min_order != null &&
    orderTotal < num(coupon.min_order)
  ) {
    return { valid: false, reason: "min_order" };
  }

  const value = num(coupon.discount_value);
  return {
    valid: true,
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discount_type,
    discountPercent: coupon.discount_type === "percent" ? value : 0,
    discountFixed: coupon.discount_type === "fixed" ? value : 0,
  };
}
