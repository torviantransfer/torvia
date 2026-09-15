import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildFinanceReport,
  financeWindow,
  type FinanceCategory,
  type FinanceReport,
  type RawFinanceEntry,
  type RawFinanceReservation,
} from "@/lib/finance";
import type { DateRange } from "@/lib/period";
import { loadRates, type Rates } from "@/lib/rates";
import { CONFIRMED_STATUSES } from "@/lib/reservation-status";
import { fetchAll, isMissingTable } from "@/lib/supabaseFetchAll";

const RESERVATION_SELECT = `id, reservation_code, status, trip_type, pickup_datetime,
  total_price, currency, exchange_rate_usd, exchange_rate_eur, payment_method,
  regions(name_tr, name_en),
  driver_assignments(leg, driver_fee, driver_fee_currency, drivers(full_name))`;

export interface FinanceData {
  report: FinanceReport;
  categories: FinanceCategory[];
  rates: Rates;
  /** Migration 093 has not been run: nothing can be entered yet. */
  tablesMissing: boolean;
}

export async function loadFinance(
  supabase: SupabaseClient,
  range: DateRange,
  today: string
): Promise<FinanceData> {
  const window = financeWindow(range, today);

  const reservations = fetchAll((from, to) => {
    // pickup_datetime holds the Antalya wall clock as UTC, so a day's bounds are written in UTC.
    let q = supabase.from("reservations").select(RESERVATION_SELECT).in("status", CONFIRMED_STATUSES);
    if (window.from) q = q.gte("pickup_datetime", `${window.from}T00:00:00Z`);
    if (window.to) q = q.lte("pickup_datetime", `${window.to}T23:59:59Z`);
    return q.order("id").range(from, to);
    // Supabase types a to-one embed as an array; PostgREST returns it as one object.
  }).then((rows) => rows as unknown as RawFinanceReservation[]);

  let tablesMissing = false;
  const entries = fetchAll<RawFinanceEntry>((from, to) => {
    let q = supabase.from("finance_entries").select("*, finance_categories(name)");
    if (window.from) q = q.gte("entry_date", window.from);
    if (window.to) q = q.lte("entry_date", window.to);
    return q.order("id").range(from, to);
  }).catch((err) => {
    if (!isMissingTable(err)) throw err;
    tablesMissing = true;
    return [] as RawFinanceEntry[];
  });

  const categories = supabase
    .from("finance_categories")
    .select("id, name, kind, sort_order, is_active")
    .order("sort_order")
    .order("name")
    .then(({ data, error }) => {
      if (error) {
        if (!isMissingTable(error)) throw new Error(error.message);
        tablesMissing = true;
        return [] as FinanceCategory[];
      }
      return (data ?? []) as FinanceCategory[];
    });

  const [reservationRows, entryRows, categoryRows, rates] = await Promise.all([
    reservations,
    entries,
    categories,
    loadRates(supabase),
  ]);

  return {
    report: buildFinanceReport({ reservations: reservationRows, entries: entryRows, range, today }),
    categories: categoryRows,
    rates,
    tablesMissing,
  };
}
