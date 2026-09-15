/**
 * Reporting periods, as Antalya calendar days (`YYYY-MM-DD`).
 *
 * Shared by the driver statements and the finance screen so a "this month" on
 * one means the same days as on the other.
 */

/** Inclusive calendar days; a null end is open. */
export interface DateRange {
  from: string | null;
  to: string | null;
}

export type PeriodKey = "this_month" | "last_month" | "last_3" | "this_year" | "all";

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "this_month", label: "Bu ay" },
  { key: "last_month", label: "Geçen ay" },
  { key: "last_3", label: "Son 3 ay" },
  { key: "this_year", label: "Bu yıl" },
  { key: "all", label: "Tümü" },
];

export const isDay = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

/** Day `day` of month index `month` (overflow allowed), as `YYYY-MM-DD`. */
const utcDay = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const dayCount = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;

/** `YYYY-MM` of a day. */
export const monthKey = (day: string) => day.slice(0, 7);

/** A month key moved by `months`. */
export function addMonths(key: string, months: number): string {
  return utcDay(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1 + months, 1).slice(0, 7);
}

export const monthStart = (key: string) => `${key}-01`;
export const monthEnd = (key: string) => utcDay(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0);

/** Every month key from `from` to `to`, inclusive. */
export function monthsBetween(from: string, to: string): string[] {
  const keys: string[] = [];
  for (let k = from; k <= to; k = addMonths(k, 1)) keys.push(k);
  return keys;
}

/** "Eyl 26" */
export const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString("tr-TR", { month: "short", year: "2-digit", timeZone: "UTC" });

/** `today` is Antalya's `YYYY-MM-DD`, so a month turns over on Antalya's midnight. */
export function periodRange(key: PeriodKey, today: string): DateRange {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1;
  switch (key) {
    case "this_month":
      return { from: utcDay(year, month, 1), to: utcDay(year, month + 1, 0) };
    case "last_month":
      return { from: utcDay(year, month - 1, 1), to: utcDay(year, month, 0) };
    case "last_3":
      return { from: utcDay(year, month - 2, 1), to: utcDay(year, month + 1, 0) };
    case "this_year":
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    case "all":
      return { from: null, to: null };
  }
}

export function matchPeriod(range: DateRange, today: string): PeriodKey | null {
  return (
    PERIODS.find((p) => {
      const r = periodRange(p.key, today);
      return r.from === range.from && r.to === range.to;
    })?.key ?? null
  );
}

/** Reads `?period=` or `?from=&to=`; anything else is this month. */
export function parseRange(
  input: { from?: string | null; to?: string | null; period?: string | null },
  today: string
): { range: DateRange; period: PeriodKey | null } {
  const preset = PERIODS.find((p) => p.key === input.period);
  if (preset) return { range: periodRange(preset.key, today), period: preset.key };

  if (isDay(input.from) || isDay(input.to)) {
    let from = isDay(input.from) ? input.from : null;
    let to = isDay(input.to) ? input.to : null;
    if (from && to && from > to) [from, to] = [to, from];
    const range = { from, to };
    return { range, period: matchPeriod(range, today) };
  }

  return { range: periodRange("this_month", today), period: "this_month" };
}

/** The query string that reproduces a range, for links and downloads. */
export function rangeQuery(range: DateRange, period: PeriodKey | null): string {
  if (period) return `period=${period}`;
  const q = new URLSearchParams();
  if (range.from) q.set("from", range.from);
  if (range.to) q.set("to", range.to);
  return q.toString();
}

/** `2026-09-15` -> `15.09.2026`. */
export const fmtDay = (day: string) =>
  day ? `${day.slice(8, 10)}.${day.slice(5, 7)}.${day.slice(0, 4)}` : "—";

export function rangeLabel(range: DateRange): string {
  if (!range.from && !range.to) return "Tüm kayıtlar";
  if (!range.from) return `${fmtDay(range.to!)} tarihine kadar`;
  if (!range.to) return `${fmtDay(range.from)} tarihinden itibaren`;
  return `${fmtDay(range.from)} – ${fmtDay(range.to)}`;
}

export const inRange = (day: string, range: DateRange) =>
  (!range.from || day >= range.from) && (!range.to || day <= range.to);

/**
 * The period just before `range`, for "compared with" figures. Whole months
 * step back by whole months, so September compares with August rather than
 * with the thirty days before it; any other span steps back by its own length.
 */
export function previousRange(range: DateRange): DateRange | null {
  if (!range.from || !range.to) return null;
  const wholeMonths = range.from.endsWith("-01") && range.to === monthEnd(monthKey(range.to));
  if (wholeMonths) {
    const count = monthsBetween(monthKey(range.from), monthKey(range.to)).length;
    return {
      from: monthStart(addMonths(monthKey(range.from), -count)),
      to: monthEnd(addMonths(monthKey(range.to), -count)),
    };
  }
  const length = dayCount(range.from, range.to);
  const to = addDays(range.from, -1);
  return { from: addDays(to, -(length - 1)), to };
}
