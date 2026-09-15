import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildStatement,
  type DateRange,
  type LedgerListRow,
  type RawDriver,
  type RawLedgerRow,
  type RawReservation,
  type Statement,
} from "@/lib/driverStatement";

/**
 * Reads what lib/driverStatement.ts works from.
 *
 * Everything is read in full, a page at a time. The payments screen used to
 * take the latest 200 ledger rows and total those, so once a driver's history
 * passed that the oldest rows fell out of his balance without a word.
 */

const PAGE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

async function fetchAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

/** `*` rather than a column list, so the screen still loads before migration 092 has run. */
const LEDGER_SELECT = `*,
  reservations(reservation_code, pickup_datetime, return_datetime, exchange_rate_usd, exchange_rate_eur),
  driver_assignments(leg)`;

const RESERVATION_SELECT = `id, reservation_code, status, trip_type, direction,
  pickup_datetime, return_datetime, flight_code, return_flight_code, hotel_name,
  total_price, currency, exchange_rate_usd, exchange_rate_eur, payment_method, driver_amount,
  regions(name_tr, name_en),
  driver_assignments(id, leg, status, driver_id, driver_fee, driver_fee_currency,
    drivers(full_name), vehicles(plate_number))`;

export interface UsdRate {
  /** Dollars per one euro. */
  rate: number;
  updatedAt: string | null;
}

/** The rate on the settings screen, which the exchange-rate cron refreshes. */
export async function loadUsdRate(supabase: SupabaseClient): Promise<UsdRate | null> {
  const { data } = await supabase
    .from("exchange_rates")
    .select("rate, last_updated")
    .eq("base_currency", "EUR")
    .eq("target_currency", "USD")
    .maybeSingle();
  const rate = Number(data?.rate);
  return rate > 0 ? { rate, updatedAt: data?.last_updated ?? null } : null;
}

export async function loadAllLedger(supabase: SupabaseClient): Promise<LedgerListRow[]> {
  return fetchAll<LedgerListRow>((from, to) =>
    supabase
      .from("driver_payments")
      .select(`${LEDGER_SELECT}, drivers(full_name)`)
      .order("id")
      .range(from, to)
  );
}

export async function loadDriverStatement(
  supabase: SupabaseClient,
  driverId: string,
  range: DateRange,
  today: string
): Promise<{ statement: Statement; usdRate: UsdRate | null } | null> {
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, full_name, phone, is_active")
    .eq("id", driverId)
    .maybeSingle();
  if (!driver) return null;

  const [assignments, ledger, usdRate] = await Promise.all([
    fetchAll<{ reservation_id: string | null }>((from, to) =>
      supabase
        .from("driver_assignments")
        .select("reservation_id")
        .eq("driver_id", driverId)
        .order("id")
        .range(from, to)
    ),
    fetchAll<RawLedgerRow>((from, to) =>
      supabase
        .from("driver_payments")
        .select(LEDGER_SELECT)
        .eq("driver_id", driverId)
        .order("id")
        .range(from, to)
    ),
    loadUsdRate(supabase),
  ]);

  // A hundred ids at a time keeps the `in` filter well inside URL limits.
  const ids = [...new Set(assignments.map((a) => a.reservation_id).filter((id): id is string => !!id))];
  const reservations: RawReservation[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await supabase
      .from("reservations")
      .select(RESERVATION_SELECT)
      .in("id", ids.slice(i, i + 100));
    if (error) throw new Error(error.message);
    reservations.push(...((data ?? []) as unknown as RawReservation[]));
  }

  return {
    statement: buildStatement({ driver: driver as RawDriver, reservations, ledger, range, today }),
    usdRate,
  };
}
