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
import { loadRates, type Rates } from "@/lib/rates";
import { fetchAll } from "@/lib/supabaseFetchAll";

/**
 * Reads what lib/driverStatement.ts works from, every row of it: a balance
 * totalled from a truncated history is wrong without looking wrong.
 */

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
): Promise<{ statement: Statement; rates: Rates } | null> {
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, full_name, phone, is_active")
    .eq("id", driverId)
    .maybeSingle();
  if (!driver) return null;

  const [assignments, ledger, rates] = await Promise.all([
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
    loadRates(supabase),
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
    rates,
  };
}
