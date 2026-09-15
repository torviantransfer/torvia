import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The three currencies money changes hands in: fares in euro, drivers mostly
 * in dollars, some drivers and most bills in lira.
 *
 * `exchange_rates` holds everything against the euro (Frankfurter, base EUR),
 * so any pair is a cross of two euro rates.
 */
export type Cash = "EUR" | "USD" | "TRY";

export const CASH: Cash[] = ["EUR", "USD", "TRY"];

export const CASH_SYMBOL: Record<Cash, string> = { EUR: "€", USD: "$", TRY: "₺" };

export interface Rates {
  /** Dollars per one euro. */
  usdPerEur: number | null;
  /** Lira per one euro. */
  tryPerEur: number | null;
  updatedAt: string | null;
}

/** The rates on the settings screen, which the exchange-rate cron refreshes. */
export async function loadRates(supabase: SupabaseClient): Promise<Rates> {
  const { data } = await supabase
    .from("exchange_rates")
    .select("target_currency, rate, last_updated")
    .eq("base_currency", "EUR")
    .in("target_currency", ["USD", "TRY"]);

  const rows = (data ?? []) as { target_currency: string; rate: number | string; last_updated: string | null }[];
  const rate = (c: string) => {
    const n = Number(rows.find((r) => r.target_currency === c)?.rate);
    return n > 0 ? n : null;
  };
  const updatedAt = rows.map((r) => r.last_updated).filter(Boolean).sort().pop() ?? null;
  return { usdPerEur: rate("USD"), tryPerEur: rate("TRY"), updatedAt };
}

/** Units of `to` per one unit of `from`; null when a rate is missing. */
export function crossRate(from: Cash, to: Cash, rates: Pick<Rates, "usdPerEur" | "tryPerEur">): number | null {
  const perEur = (c: Cash) => (c === "EUR" ? 1 : c === "USD" ? rates.usdPerEur : rates.tryPerEur);
  const f = perEur(from);
  const t = perEur(to);
  return f && t ? t / f : null;
}

// ─── quoting ───
//
// A rate is typed and read the way people say it: one unit of the stronger
// currency in the weaker one. "1 € = 1,16 $", "1 $ = 41,20 ₺", "1 € = 48,10 ₺".
// Nobody types 0,0243 for a lira.

const STRENGTH: Record<Cash, number> = { EUR: 3, USD: 2, TRY: 1 };

export function quotePair(a: Cash, b: Cash): { base: Cash; quote: Cash } {
  return STRENGTH[a] >= STRENGTH[b] ? { base: a, quote: b } : { base: b, quote: a };
}

/** `to` per one `from`, from a rate quoted the spoken way. */
export function perUnit(from: Cash, to: Cash, quoted: number): number {
  if (from === to) return 1;
  return quotePair(from, to).base === from ? quoted : 1 / quoted;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function convertQuoted(amount: number, from: Cash, to: Cash, quoted: number): number {
  return round2(amount * perUnit(from, to, quoted));
}

/** Today's rate for a pair, quoted the spoken way. */
export function defaultQuote(from: Cash, to: Cash, rates: Pick<Rates, "usdPerEur" | "tryPerEur">): number | null {
  if (from === to) return 1;
  const { base, quote } = quotePair(from, to);
  return crossRate(base, quote, rates);
}

/**
 * Where a quoted rate stops being plausible. A value outside is a typo — 11,6
 * for 1,16 — and would write a tenfold figure into an account.
 */
export function quoteBand(from: Cash, to: Cash): [number, number] {
  const { base, quote } = quotePair(from, to);
  if (base === "EUR" && quote === "USD") return [0.5, 3];
  return [5, 500]; // lira against the euro or the dollar
}

export function fmtQuote(from: Cash, to: Cash, quoted: number): string {
  const { base, quote } = quotePair(from, to);
  const digits = quote === "TRY" ? 2 : 4;
  const value = quoted.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `1 ${CASH_SYMBOL[base]} = ${value} ${CASH_SYMBOL[quote]}`;
}

/** "$1.234,50", "−€12,00", "3.500,00 ₺" — Turkish grouping, the lira sign after the figure as it is written here. */
export function fmtCash(value: number, currency: Cash): string {
  const digits = Math.abs(value).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = value < 0 ? "−" : "";
  return currency === "TRY" ? `${sign}${digits} ₺` : `${sign}${CASH_SYMBOL[currency]}${digits}`;
}

export const isCash = (value: unknown): value is Cash => value === "EUR" || value === "USD" || value === "TRY";
