import type { Currency } from "@/i18n/config";

/**
 * One place for how money is converted and shown.
 *
 * Fares are keyed in and charged in USD; every other currency on screen is a
 * display conversion. This module holds both halves of that — the direction of
 * the conversion, and the rounding rule — so the booking page, the voucher, the
 * PDF and the emails cannot disagree about what a price is. They did: the site
 * multiplied by the rate and rounded, while the voucher divided by it and kept
 * the cents, so a $85 transfer was booked at €73 and vouchered at €98.41.
 */

/** Dot-groups a whole number, e.g. 3485 -> "3.485". */
export function groupThousands(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Rounds to the nearest `step`, with an exact half going down: at step 1,
 * 25.50 -> 25 and 25.51 -> 26. Math.round would send 25.50 up instead.
 */
export function roundHalfDown(value: number, step = 1): number {
  return Math.ceil(value / step - 0.5) * step;
}

/**
 * `exchange_rates.rate` is stored from Frankfurter with `base=USD`, so it is
 * the target currency per ONE dollar (EUR ≈ 0.86). Converting therefore
 * MULTIPLIES; dividing inverts the rate and inflates every figure.
 */
export function convertFromUSD(amountUSD: number, ratePerUSD: number): number {
  if (!ratePerUSD || !Number.isFinite(ratePerUSD)) return amountUSD;
  return amountUSD * ratePerUSD;
}

/**
 * Prices are keyed in as whole dollars, so any figure with cents on screen is
 * an artefact of converting to another currency. Those get rounded away — euro
 * to the nearest whole unit, lira to the nearest five, since a lira amount runs
 * to four digits and the last one carries no meaning.
 *
 * Dollars are left exactly as they are: that is the currency Stripe charges, so
 * rounding here would put a different number on screen than on the customer's
 * statement. A percentage coupon is the one thing that can put cents on a
 * dollar price, and then they are shown rather than hidden.
 */
export function displayAmount(value: number, currency: Currency): string {
  if (currency === "TRY") return groupThousands(roundHalfDown(value, 5));
  if (currency === "EUR") return String(roundHalfDown(value));
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

const SYMBOLS: Record<Currency, string> = { USD: "$", EUR: "€", TRY: "₺" };

/** e.g. formatMoney(73.41, "EUR") -> "€73" */
export function formatMoney(value: number, currency: Currency): string {
  return `${SYMBOLS[currency]}${displayAmount(value, currency)}`;
}

/** Euro figure for a USD amount, already rounded the way prices are shown. */
export function formatEUR(valueEur: number): string {
  return formatMoney(valueEur, "EUR");
}
