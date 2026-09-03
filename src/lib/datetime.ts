/**
 * How reservation times are stored, and how to read them back.
 *
 * THE INVARIANT
 * -------------
 * `reservations.pickup_datetime` / `return_datetime` hold the **Antalya wall
 * clock the customer picked**. The booking API writes it without an offset
 * (`2026-09-04T15:00:00`), so Postgres resolves it in the database's timezone —
 * UTC. The stored instant's UTC clock therefore *is* the Antalya clock.
 *
 * Reading such a value with `new Date(...)` and formatting it in local time, or
 * worse in `Europe/Istanbul`, shifts it by the offset: a 15:00 pickup showed as
 * 18:00 in the admin panel, in the driver panel and in the emails. Read them
 * with `timeZone: "UTC"` instead — `formatBookingTime` and friends below.
 *
 * Columns written by the database itself (`created_at`, `assigned_at`,
 * `accepted_at`, `picked_up_at`, `completed_at`) are genuine UTC instants, not
 * wall clocks. Those must be shown in `Europe/Istanbul` — use `formatInstant`.
 * Mixing the two up is what made some vouchers right and others wrong.
 */

export const BOOKING_TZ = "Europe/Istanbul";

/** Formatting options that recover the stored wall clock rather than converting it. */
const WALL: Intl.DateTimeFormatOptions = { timeZone: "UTC" };

const asDate = (value: string | Date) =>
  value instanceof Date ? value : new Date(value);

// ─── booking wall-clock values (pickup_datetime, return_datetime) ───

export function formatBookingDate(value: string | Date, locale = "tr-TR"): string {
  return asDate(value).toLocaleDateString(locale, {
    ...WALL,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatBookingTime(value: string | Date, locale = "tr-TR"): string {
  return asDate(value).toLocaleTimeString(locale, {
    ...WALL,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBookingDateTime(value: string | Date, locale = "tr-TR"): string {
  return `${formatBookingDate(value, locale)} ${formatBookingTime(value, locale)}`;
}

/** e.g. "Cuma, 4 Eylül 2026" — for vouchers and driver sheets. */
export function formatBookingDateLong(value: string | Date, locale = "tr-TR"): string {
  return asDate(value).toLocaleDateString(locale, {
    ...WALL,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatBookingDateShort(value: string | Date, locale = "tr-TR"): string {
  return asDate(value).toLocaleDateString(locale, {
    ...WALL,
    day: "2-digit",
    month: "short",
  });
}

/**
 * The stored wall clock split into the `YYYY-MM-DD` / `HH:mm` halves the email
 * and voucher builders expect. Read textually so no Date parsing can re-anchor
 * it, and so a value already in that shape survives untouched.
 */
export function bookingParts(value: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!value) return { date: "", time: "" };
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(value);
  if (match) return { date: match[1], time: match[2] };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toISOString().slice(11, 16),
  };
}

/** Local calendar day of a booking value, as `YYYY-MM-DD`. */
export const bookingDayKey = (value: string) => bookingParts(value).date;

// ─── real instants (created_at, assigned_at, …) ───

export function formatInstant(value: string | Date, locale = "tr-TR"): string {
  return asDate(value).toLocaleString(locale, {
    timeZone: BOOKING_TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatInstantDate(value: string | Date, locale = "tr-TR"): string {
  return asDate(value).toLocaleDateString(locale, {
    timeZone: BOOKING_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Today in Antalya, as `YYYY-MM-DD` — the reference for "is this today?". */
export function todayInBookingTz(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: BOOKING_TZ });
}

/** `YYYY-MM-DD` for today ± `days`, in Antalya. */
export function bookingDayOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toLocaleDateString("en-CA", { timeZone: BOOKING_TZ });
}

/** BCP-47 tag for one of the site's locales. */
export function intlLocale(locale = "en"): string {
  const map: Record<string, string> = {
    tr: "tr-TR",
    en: "en-GB",
    de: "de-DE",
    pl: "pl-PL",
    ru: "ru-RU",
    nl: "nl-NL",
  };
  return map[locale] ?? "en-GB";
}

/**
 * A `YYYY-MM-DD` wall-clock date rendered for a reader, e.g. "4 Eylül 2026".
 * Vouchers used to print the raw ISO string while every other screen showed a
 * local format, so the same booking looked like two different dates.
 */
export function formatDateOnly(date: string, locale = "en"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(intlLocale(locale), {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
