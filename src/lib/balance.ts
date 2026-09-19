/**
 * Whether a cash booking still has a balance that can be paid by card, kept
 * apart from lib/balancePayment so screens can ask without pulling Stripe and
 * the Telegram client into the browser bundle.
 */

/** A balance can be paid from the deposit until the trip is over. */
const OPEN_STATUSES = ["deposit_paid", "driver_assigned", "passenger_picked_up"];

export interface BalanceRow {
  status: string;
  payment_method?: string | null;
  driver_amount?: number | string | null;
  balance_paid_at?: string | null;
}

/** What is still owed, or null when there is nothing to pay online. */
export function balanceDue(r: BalanceRow): number | null {
  if (r.payment_method !== "cash" || r.balance_paid_at) return null;
  if (!OPEN_STATUSES.includes(r.status)) return null;
  const amount = Number(r.driver_amount);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}
