import type { Currency } from "@/i18n/config";

/**
 * One place for how money is converted and shown.
 *
 * Fares are keyed in and charged in EUR; every other currency on screen is a
 * display conversion. This module holds both halves of that — the direction of
 * the conversion, and the rounding rule — so the booking page, the voucher, the
 * PDF and the emails cannot disagree about what a price is. They did: the site
 * multiplied by the rate and rounded, while the voucher divided by it and kept
 * the cents, so an 85 fare was booked at 73 and vouchered at 98.41.
 *
 * The base currency used to be USD. It changed because the visitors who book
 * are German, Polish, Dutch and Romanian, and quoting them a dollar price they
 * then pay in euro put an exchange spread between the figure on the page and
 * the figure on the statement. Dollars are still offered in the switcher — the
 * Russian and Arabic locales default to them — but they are now the converted
 * side, not the charged one.
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
 * `exchange_rates.rate` is stored from Frankfurter with `base=EUR`, so it is
 * the target currency per ONE euro (USD ≈ 1.16). Converting therefore
 * MULTIPLIES; dividing inverts the rate and deflates every figure.
 */
export function convertFromEUR(amountEUR: number, ratePerEUR: number): number {
  if (!ratePerEUR || !Number.isFinite(ratePerEUR)) return amountEUR;
  return amountEUR * ratePerEUR;
}

/**
 * The same multiplication in the old direction, kept for one reason: every
 * reservation taken before the switch stored `total_price` in dollars together
 * with the `exchange_rate_eur` of its booking day. Those rows are history and
 * are not rewritten, so the account page, the voucher and the emails still need
 * to read them. `reservationMoney` below is what picks the right direction —
 * prefer it to calling this by hand.
 */
export function convertFromUSD(amountUSD: number, ratePerUSD: number): number {
  if (!ratePerUSD || !Number.isFinite(ratePerUSD)) return amountUSD;
  return amountUSD * ratePerUSD;
}

/**
 * Prices are keyed in as whole euros, so any figure with cents on screen is an
 * artefact of converting to another currency. Those get rounded away — dollars
 * to the nearest whole unit, lira to the nearest five, since a lira amount runs
 * to four digits and the last one carries no meaning.
 *
 * Euro is left exactly as it is: that is the currency Stripe charges, so
 * rounding here would put a different number on screen than on the customer's
 * statement. A percentage coupon is the one thing that can put cents on a euro
 * price, and then they are shown rather than hidden.
 */
export function displayAmount(value: number, currency: Currency): string {
  if (currency === "TRY") return groupThousands(roundHalfDown(value, 5));
  if (currency === "USD") return String(roundHalfDown(value));
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

const SYMBOLS: Record<Currency, string> = { USD: "$", EUR: "€", TRY: "₺" };

/** e.g. formatMoney(73.41, "EUR") -> "€73.41" */
export function formatMoney(value: number, currency: Currency): string {
  return `${SYMBOLS[currency]}${displayAmount(value, currency)}`;
}

/** Euro figure, rounded the way prices are shown. */
export function formatEUR(valueEur: number): string {
  return formatMoney(valueEur, "EUR");
}

/**
 * What one stored reservation is worth, and in which currency to print it.
 *
 * A reservation carries the currency it was taken in. Rows written after the
 * euro switch hold euro in `total_price` and must be shown as they are; rows
 * written before it hold dollars plus the `exchange_rate_eur` of that day, and
 * are converted with that day's rate rather than today's — the customer's
 * statement shows what was charged then, and the page has to match it.
 *
 * Reading the column is the whole point. The account page, the tracking page,
 * the voucher and the confirmation email all used to convert unconditionally,
 * which was right while every row was in dollars and becomes a silent 14%
 * understatement the moment one is not.
 *
 * An old row with no stored rate falls back to printing dollars, which is what
 * it actually was, rather than putting a euro sign in front of a dollar figure.
 */
export function reservationMoney(
  amount: number,
  currency: string | null | undefined,
  exchangeRateEur: number | null | undefined
): { value: number; currency: Currency } {
  if (currency === "EUR") return { value: amount, currency: "EUR" };

  if (exchangeRateEur && Number.isFinite(exchangeRateEur)) {
    return { value: convertFromUSD(amount, exchangeRateEur), currency: "EUR" };
  }

  return { value: amount, currency: "USD" };
}

/** The two currencies money is actually settled in — a fare, or a driver's pay. */
export type Settlement = "USD" | "EUR";

/**
 * One amount, moved between the two settlement currencies.
 *
 * This exists because a reservation and a driver are not necessarily settled in
 * the same money: fares are euro, drivers are paid in dollars. Subtracting one
 * from the other without passing through here is how "profit" and "what the
 * driver still owes" come out wrong by the exchange rate while looking
 * perfectly reasonable on screen.
 *
 * Returns null when a conversion is needed and no rate for it was captured, so
 * the caller can show "not calculable" instead of a confident wrong number. The
 * two rates point in opposite directions and are not interchangeable:
 *
 *   usdPerEur — `reservations.exchange_rate_usd`, written since the euro switch
 *   eurPerUsd — `reservations.exchange_rate_eur`, written before it
 *
 * Both are the rate of the booking day, which is the rate the job was agreed
 * at. Rounded to cents: the columns these land in are NUMERIC(10,2), and an
 * unrounded float is stored truncated — off by a fraction on every row and
 * visibly off once a few hundred are summed.
 */
export function convertSettlement(
  amount: number,
  from: Settlement,
  to: Settlement,
  usdPerEur: number | null | undefined,
  eurPerUsd: number | null | undefined
): number | null {
  if (from === to) return amount;

  const rate = from === "EUR" ? usdPerEur : eurPerUsd;
  if (!rate || !Number.isFinite(rate)) return null;

  return Math.round(amount * rate * 100) / 100;
}

/** A reservation's own settlement currency. Anything not EUR is a pre-switch row. */
export function settlementOf(currency: string | null | undefined): Settlement {
  return currency === "EUR" ? "EUR" : "USD";
}

/** `reservationMoney`, already formatted. */
export function formatReservationMoney(
  amount: number,
  currency: string | null | undefined,
  exchangeRateEur: number | null | undefined
): string {
  const m = reservationMoney(amount, currency, exchangeRateEur);
  return formatMoney(m.value, m.currency);
}
