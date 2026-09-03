import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Capacity rules live here so the customer-facing calendar (/api/availability)
 * and the booking guard (/api/reservations) can never disagree about whether a
 * date is bookable — they used to default to 2 and 3 respectively, and only one
 * of them counted return legs.
 */

export const DEFAULT_MAX_DAILY = 3;

export interface DateOverride {
  blocked_date: string;
  /** NULL (or 0) means the date is closed; a number replaces the global limit. */
  max_bookings: number | null;
  reason: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

/** Global fallback capacity, from the `max_daily_bookings` setting. */
export async function getGlobalMaxDaily(supabase: Client): Promise<number> {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "max_daily_bookings")
    .maybeSingle();

  const parsed = Number(data?.value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_MAX_DAILY;
}

/** Per-date overrides in [from, to], keyed by YYYY-MM-DD. */
export async function getDateOverrides(
  supabase: Client,
  from: string,
  to: string
): Promise<Map<string, DateOverride>> {
  const { data } = await supabase
    .from("blocked_dates")
    .select("blocked_date, max_bookings, reason")
    .gte("blocked_date", from)
    .lte("blocked_date", to);

  return new Map(
    (data ?? []).map((row: DateOverride) => [row.blocked_date, row])
  );
}

/** A single date's override, or null when the date follows the global setting. */
export async function getDateOverride(
  supabase: Client,
  date: string
): Promise<DateOverride | null> {
  const { data } = await supabase
    .from("blocked_dates")
    .select("blocked_date, max_bookings, reason")
    .eq("blocked_date", date)
    .maybeSingle();

  return (data as DateOverride) ?? null;
}

/**
 * Effective capacity for a date. 0 means closed — an override row without a
 * number is the "fully closed" case that `blocked_dates` originally expressed.
 */
export function capacityFor(
  override: DateOverride | null | undefined,
  globalMax: number
): number {
  if (!override) return globalMax;
  return override.max_bookings == null ? 0 : override.max_bookings;
}

/**
 * Transfers already booked per date across [from, to]. A round trip occupies a
 * slot on both its outbound day and its return day.
 */
export async function countBookingsByDate(
  supabase: Client,
  from: string,
  to: string
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  const [{ data: outbound }, { data: returns }] = await Promise.all([
    supabase
      .from("reservations")
      .select("pickup_datetime")
      .gte("pickup_datetime", `${from}T00:00:00`)
      .lte("pickup_datetime", `${to}T23:59:59`)
      .not("status", "in", '("cancelled")'),
    supabase
      .from("reservations")
      .select("return_datetime")
      .not("return_datetime", "is", null)
      .gte("return_datetime", `${from}T00:00:00`)
      .lte("return_datetime", `${to}T23:59:59`)
      .not("status", "in", '("cancelled")'),
  ]);

  for (const r of outbound ?? []) {
    const date = String(r.pickup_datetime).split("T")[0];
    counts[date] = (counts[date] ?? 0) + 1;
  }
  for (const r of returns ?? []) {
    if (!r.return_datetime) continue;
    const date = String(r.return_datetime).split("T")[0];
    counts[date] = (counts[date] ?? 0) + 1;
  }

  return counts;
}

/** Booked transfers on one date, counting outbound and return legs alike. */
export async function countBookingsOnDate(
  supabase: Client,
  date: string
): Promise<number> {
  const counts = await countBookingsByDate(supabase, date, date);
  return counts[date] ?? 0;
}
