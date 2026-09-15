/**
 * A driver's account ("cari"), worked out from what the database holds.
 *
 * Two sources, kept apart on purpose:
 *  - the jobs: every reservation this driver has a leg on, with the fare, both
 *    legs' fees, the cash the passenger handed over, and what the company kept;
 *  - the ledger (`driver_payments`): what the driver has earned, what he has
 *    been paid, and corrections. The balance comes from here and only here, so
 *    a payment typed in by hand counts even when it is tied to no job.
 *
 * The account is kept in dollars, because that is what drivers are paid in.
 * Money in any other currency — a fee agreed in euro, a payment handed over in
 * euro or in lira — is converted at its own rate: a job at the rate of its
 * booking day, a payment at the rate of the day it was made. Nothing is re-read
 * at today's rate, which would move a settled balance every time the rate moved.
 *
 * Pure: no database and no Next. The page, the export route and the payment
 * form all read the same figures from here, so the screen, the Excel file and
 * the PDF cannot disagree.
 */
import { convertSettlement, reservationMoney, settlementOf, type Settlement } from "@/lib/currency";
import { BOOKING_TZ, bookingParts } from "@/lib/datetime";
import { inRange, type DateRange } from "@/lib/period";
import { fmtCash, fmtQuote, isCash, quotePair, type Cash } from "@/lib/rates";
import { CONFIRMED_STATUSES } from "@/lib/reservation-status";
import { legStartsAtAirport } from "@/lib/transfer-route";

export {
  PERIODS,
  fmtDay,
  matchPeriod,
  parseRange,
  periodRange,
  rangeLabel,
  rangeQuery,
} from "@/lib/period";
export type { DateRange, PeriodKey } from "@/lib/period";

/** Drivers are paid in dollars, so that is what a balance is kept in. */
export const ACCOUNT_CURRENCY: Settlement = "USD";

export type LedgerType = "earning" | "payment" | "adjustment";

export const LEDGER_TYPE_LABEL: Record<LedgerType, string> = {
  earning: "Hak ediş",
  payment: "Ödeme",
  adjustment: "Düzeltme",
};

// ─── rows as they come out of Supabase ───

export interface RawDriver {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean | null;
}

export interface RawAssignment {
  id: string;
  leg: string | null;
  status: string | null;
  driver_id: string | null;
  driver_fee: number | string | null;
  driver_fee_currency: string | null;
  drivers: { full_name: string | null } | null;
  vehicles: { plate_number: string | null } | null;
}

export interface RawReservation {
  id: string;
  reservation_code: string;
  status: string;
  trip_type: string;
  direction: string | null;
  pickup_datetime: string;
  return_datetime: string | null;
  flight_code: string | null;
  return_flight_code: string | null;
  hotel_name: string | null;
  total_price: number | string;
  currency: string | null;
  exchange_rate_usd: number | string | null;
  exchange_rate_eur: number | string | null;
  payment_method: string | null;
  driver_amount: number | string | null;
  regions: { name_tr: string | null; name_en: string | null } | null;
  driver_assignments: RawAssignment[] | null;
}

export interface RawLedgerRow {
  id: string;
  driver_id?: string;
  type: LedgerType;
  amount: number | string;
  currency: string | null;
  description: string | null;
  created_at: string;
  reservation_id: string | null;
  assignment_id: string | null;
  // From migrations 092/093; absent until they have run.
  paid_at?: string | null;
  original_amount?: number | string | null;
  original_currency?: string | null;
  /** Dollars per one unit of `original_currency`. */
  exchange_rate?: number | string | null;
  reservations: {
    reservation_code: string | null;
    pickup_datetime: string | null;
    return_datetime: string | null;
    exchange_rate_usd: number | string | null;
    exchange_rate_eur: number | string | null;
  } | null;
  driver_assignments: { leg: string | null } | null;
}

/** A ledger row on the all-drivers screen, which names whose it is. */
export type LedgerListRow = RawLedgerRow & {
  driver_id: string;
  drivers: { full_name: string | null } | null;
};

// ─── numbers ───

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** "$1.234,50", "−€12,00", "3.500,00 ₺". */
export const fmtMoney = (value: number, currency: Cash) => fmtCash(value, currency);

/** The rate a row was converted into dollars at, said the usual way: "1 € = 1,1600 $", "1 $ = 41,20 ₺". */
export function rateText(currency: Cash, usdPerUnit: number): string {
  const quoted = quotePair(currency, ACCOUNT_CURRENCY).base === currency ? usdPerUnit : 1 / usdPerUnit;
  return fmtQuote(currency, ACCOUNT_CURRENCY, quoted);
}

export const TRIP_LABEL = (tripType: string) =>
  tripType === "round_trip" ? "Gidiş-dönüş" : "Tek yön";

/** Half a cent either way is rounding, not a debt. */
export function balanceStatus(balance: number): {
  label: string;
  tone: "owe" | "owed" | "closed";
} {
  if (balance > 0.005) return { label: "Şoföre borcunuz", tone: "owe" };
  if (balance < -0.005) return { label: "Şoförün size borcu", tone: "owed" };
  return { label: "Hesap kapalı", tone: "closed" };
}

// ─── the ledger ───

export interface LedgerEffect {
  /** Signed, in dollars: positive is owed to the driver. null when no rate exists to convert with. */
  usd: number | null;
  /** What was actually agreed or handed over, when that was not dollars. */
  original: { amount: number; currency: Cash } | null;
  /** Dollars per one unit of the original currency. */
  rate: number | null;
}

export function ledgerEffect(row: RawLedgerRow): LedgerEffect {
  const amount = num(row.amount) ?? 0;
  const currency = settlementOf(row.currency);
  const storedRate = num(row.exchange_rate);
  const originalCurrency = isCash(row.original_currency) ? row.original_currency : null;

  // A stored rate belongs to the original currency. On a euro row it also
  // converts `amount`; on a lira row `amount` is already dollars.
  const usdPerEur = originalCurrency === "EUR" && storedRate ? storedRate : num(row.reservations?.exchange_rate_usd);
  const converted = convertSettlement(
    amount,
    currency,
    ACCOUNT_CURRENCY,
    usdPerEur,
    num(row.reservations?.exchange_rate_eur)
  );

  // Earnings and payments are stored as sizes and take their sign from their
  // kind; an adjustment carries its own, so it can take money off as well.
  const signed =
    converted === null
      ? null
      : row.type === "payment"
      ? -Math.abs(converted)
      : row.type === "earning"
      ? Math.abs(converted)
      : converted;
  const usd = signed === null ? null : round2(signed);

  const originalAmount = num(row.original_amount);
  if (originalAmount !== null && originalCurrency && originalCurrency !== ACCOUNT_CURRENCY) {
    return {
      usd,
      original: {
        amount: row.type === "adjustment" ? originalAmount : Math.abs(originalAmount),
        currency: originalCurrency,
      },
      rate: storedRate,
    };
  }
  if (currency !== ACCOUNT_CURRENCY) {
    return { usd, original: { amount: Math.abs(amount), currency }, rate: usdPerEur };
  }
  return { usd, original: null, rate: null };
}

/**
 * When a ledger row happened, as an Antalya day and time.
 *
 * A row generated from a fee belongs to the day of the transfer, not the day
 * someone typed the fee in — a job driven on the 30th and priced on the 2nd is
 * last month's work. A hand-entered row belongs to the day it was paid.
 */
export function ledgerWhen(row: RawLedgerRow): { day: string; time: string } {
  const res = row.reservations;
  if (row.assignment_id && res) {
    const at =
      row.driver_assignments?.leg === "return"
        ? res.return_datetime ?? res.pickup_datetime
        : res.pickup_datetime;
    const parts = bookingParts(at);
    if (parts.date) return { day: parts.date, time: parts.time };
  }
  const at = new Date(row.paid_at ?? row.created_at);
  return {
    day: at.toLocaleDateString("en-CA", { timeZone: BOOKING_TZ }),
    time: at.toLocaleTimeString("en-GB", {
      timeZone: BOOKING_TZ,
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export interface LedgerSummary {
  earnings: number;
  /** A positive total of what has been paid out. */
  payments: number;
  adjustments: number;
  /** Everything dated up to and including today. */
  balance: number;
  /** Fees for transfers still to come: agreed, not yet earned. */
  upcoming: number;
  /** Rows that could not be converted for want of a rate — left out, not guessed. */
  unconvertible: number;
  /** Paid out so far this calendar month. */
  monthPaid: number;
  /** Transfer legs driven so far this calendar month. */
  monthJobs: number;
  /** The last day money was handed to the driver by hand. */
  lastPaymentDay: string | null;
}

export function summariseLedger(rows: RawLedgerRow[], today: string): LedgerSummary {
  const month = today.slice(0, 7);
  const s: LedgerSummary = {
    earnings: 0,
    payments: 0,
    adjustments: 0,
    balance: 0,
    upcoming: 0,
    unconvertible: 0,
    monthPaid: 0,
    monthJobs: 0,
    lastPaymentDay: null,
  };
  for (const row of rows) {
    const { usd } = ledgerEffect(row);
    const { day } = ledgerWhen(row);
    const manual = row.assignment_id === null;

    if (row.type === "payment" && manual && day <= today && (!s.lastPaymentDay || day > s.lastPaymentDay)) {
      s.lastPaymentDay = day;
    }
    if (row.type === "earning" && !manual && day <= today && day.startsWith(month)) s.monthJobs += 1;

    if (usd === null) {
      s.unconvertible += 1;
      continue;
    }
    if (day > today) {
      s.upcoming = round2(s.upcoming + usd);
      continue;
    }
    if (row.type === "earning") s.earnings = round2(s.earnings + usd);
    else if (row.type === "payment") {
      s.payments = round2(s.payments - usd);
      if (day.startsWith(month)) s.monthPaid = round2(s.monthPaid - usd);
    } else s.adjustments = round2(s.adjustments + usd);
    s.balance = round2(s.balance + usd);
  }
  return s;
}

// ─── the jobs ───

export interface LegCell {
  driverName: string;
  /** This leg is the statement's own driver's. */
  mine: boolean;
  fee: number | null;
  currency: Settlement;
  plate: string | null;
}

export interface JobRow {
  reservationId: string;
  code: string;
  status: string;
  /** The day and time of this driver's first leg on the booking. */
  day: string;
  time: string;
  tripType: string;
  route: string;
  flightOut: string | null;
  flightReturn: string | null;
  hotel: string | null;
  payment: "cash" | "online";
  fare: { value: number; currency: Settlement };
  outbound: LegCell | null;
  ret: LegCell | null;
  /** Cash the passenger paid the outbound driver on the day. */
  cash: { value: number; currency: Settlement; collectedByMe: boolean } | null;
  /** Fare less every driver on the job, in euro; null while a fee is missing or cannot be converted. */
  marginEur: number | null;
  feesEur: number | null;
  /** What this job adds to this driver's balance, in dollars; null while it cannot be worked out. */
  driverNetUsd: number | null;
}

function routeText(r: RawReservation): string {
  const region = r.regions?.name_tr || r.regions?.name_en || "—";
  const fromAirport = legStartsAtAirport(r.direction, "outbound");
  if (r.trip_type === "round_trip") {
    return fromAirport ? `AYT → ${region} → AYT` : `${region} → AYT → ${region}`;
  }
  return fromAirport ? `AYT → ${region}` : `${region} → AYT`;
}

function buildJob(r: RawReservation, driverId: string): JobRow | null {
  const assignments = r.driver_assignments ?? [];
  if (!assignments.some((a) => a.driver_id === driverId)) return null;

  const legOf = (a: RawAssignment) => (a.leg === "return" ? "return" : "outbound");
  // Should a leg carry two assignments, the statement's own driver's is the one to show.
  const pick = (leg: "outbound" | "return") => {
    const forLeg = assignments.filter((a) => legOf(a) === leg);
    return forLeg.find((a) => a.driver_id === driverId) ?? forLeg[0] ?? null;
  };
  const cell = (a: RawAssignment | null): LegCell | null =>
    a && {
      driverName: a.drivers?.full_name ?? "Şoför silinmiş",
      mine: a.driver_id === driverId,
      fee: num(a.driver_fee),
      currency: settlementOf(a.driver_fee_currency),
      plate: a.vehicles?.plate_number ?? null,
    };

  const roundTrip = r.trip_type === "round_trip";
  const outbound = cell(pick("outbound"));
  const ret = roundTrip ? cell(pick("return")) : null;

  const outAt = bookingParts(r.pickup_datetime);
  const retAt = bookingParts(r.return_datetime ?? r.pickup_datetime);
  const first = outbound?.mine || !ret?.mine ? outAt : retAt;

  const usdPerEur = num(r.exchange_rate_usd);
  const eurPerUsd = num(r.exchange_rate_eur);
  const fare = reservationMoney(num(r.total_price) ?? 0, r.currency, eurPerUsd);
  const fareCurrency: Settlement = fare.currency === "EUR" ? "EUR" : "USD";

  const cashAmount = num(r.driver_amount) ?? 0;
  const cash =
    r.payment_method === "cash" && cashAmount > 0
      ? { value: cashAmount, currency: settlementOf(r.currency), collectedByMe: outbound?.mine ?? false }
      : null;

  const legs = [outbound, ret].filter((c): c is LegCell => c !== null);
  const complete = outbound !== null && (!roundTrip || ret !== null) && legs.every((l) => l.fee !== null);

  let feesEur: number | null = null;
  let marginEur: number | null = null;
  if (complete && fareCurrency === "EUR") {
    const converted = legs.map((l) => convertSettlement(l.fee!, l.currency, "EUR", usdPerEur, eurPerUsd));
    if (converted.every((v) => v !== null)) {
      feesEur = round2(converted.reduce((sum, v) => sum + v!, 0));
      marginEur = round2(fare.value - feesEur);
    }
  }

  // The same sum lib/driverLedger.ts writes: each of this driver's fees, less
  // the passenger's cash on the outbound leg.
  let driverNetUsd: number | null = 0;
  for (const leg of legs.filter((l) => l.mine)) {
    const usd = leg.fee === null ? null : convertSettlement(leg.fee, leg.currency, ACCOUNT_CURRENCY, usdPerEur, eurPerUsd);
    if (usd === null) {
      driverNetUsd = null;
      break;
    }
    driverNetUsd += usd;
  }
  if (driverNetUsd !== null && cash?.collectedByMe) {
    const collected = convertSettlement(cash.value, cash.currency, ACCOUNT_CURRENCY, usdPerEur, eurPerUsd);
    driverNetUsd = collected === null ? null : driverNetUsd - collected;
  }

  return {
    reservationId: r.id,
    code: r.reservation_code,
    status: r.status,
    day: first.date,
    time: first.time,
    tripType: r.trip_type,
    route: routeText(r),
    flightOut: r.flight_code || null,
    flightReturn: roundTrip ? r.return_flight_code || null : null,
    hotel: r.hotel_name || null,
    payment: r.payment_method === "cash" ? "cash" : "online",
    fare: { value: round2(fare.value), currency: fareCurrency },
    outbound,
    ret,
    cash,
    marginEur,
    feesEur,
    driverNetUsd: driverNetUsd === null ? null : round2(driverNetUsd),
  };
}

// ─── the statement ───

export interface MovementRow {
  id: string;
  day: string;
  time: string;
  type: LedgerType;
  /** Typed in by hand; generated rows follow their fee and cannot be deleted here. */
  manual: boolean;
  description: string;
  code: string | null;
  original: { amount: number; currency: Cash } | null;
  /** Dollars per one unit of the original currency. */
  rate: number | null;
  usd: number | null;
  /** Running balance after this row. */
  balance: number;
  upcoming: boolean;
}

export interface Statement {
  driver: { id: string; name: string; phone: string | null; active: boolean };
  range: DateRange;
  today: string;
  jobs: JobRow[];
  jobTotals: {
    count: number;
    fareEur: number;
    feesEur: number;
    marginEur: number;
    driverNetUsd: number;
    /** Jobs left out of the euro totals because a fee is missing. */
    incomplete: number;
  };
  /** Balance carried in from before the period. */
  opening: number;
  movements: MovementRow[];
  periodTotals: { earnings: number; payments: number; adjustments: number };
  /** Balance at the end of the period, future-dated rows in it included. */
  closing: number;
  /** The account as of today, whatever period is on screen. */
  current: LedgerSummary;
}

export function buildStatement(input: {
  driver: RawDriver;
  reservations: RawReservation[];
  ledger: RawLedgerRow[];
  range: DateRange;
  today: string;
}): Statement {
  const { driver, reservations, ledger, range, today } = input;

  // Cancelled and unpaid bookings are not work done. Their ledger rows, if any
  // were left behind, still show below and still count.
  const jobs = reservations
    .map((r) => buildJob(r, driver.id))
    .filter((j): j is JobRow => j !== null && CONFIRMED_STATUSES.includes(j.status) && inRange(j.day, range))
    .sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`));

  const priced = jobs.filter((j) => j.marginEur !== null);
  const jobTotals = {
    count: jobs.length,
    fareEur: round2(priced.reduce((s, j) => s + j.fare.value, 0)),
    feesEur: round2(priced.reduce((s, j) => s + (j.feesEur ?? 0), 0)),
    marginEur: round2(priced.reduce((s, j) => s + (j.marginEur ?? 0), 0)),
    driverNetUsd: round2(jobs.reduce((s, j) => s + (j.driverNetUsd ?? 0), 0)),
    incomplete: jobs.length - priced.length,
  };

  const entries = ledger
    .map((row) => ({ row, when: ledgerWhen(row), effect: ledgerEffect(row) }))
    .sort(
      (a, b) =>
        `${a.when.day} ${a.when.time}`.localeCompare(`${b.when.day} ${b.when.time}`) ||
        a.row.created_at.localeCompare(b.row.created_at)
    );

  let opening = 0;
  for (const e of entries) {
    if (range.from && e.when.day < range.from && e.effect.usd !== null) {
      opening = round2(opening + e.effect.usd);
    }
  }

  const periodTotals = { earnings: 0, payments: 0, adjustments: 0 };
  let balance = opening;
  const movements: MovementRow[] = entries
    .filter((e) => inRange(e.when.day, range))
    .map(({ row, when, effect }) => {
      if (effect.usd !== null) {
        balance = round2(balance + effect.usd);
        if (row.type === "earning") periodTotals.earnings = round2(periodTotals.earnings + effect.usd);
        else if (row.type === "payment") periodTotals.payments = round2(periodTotals.payments - effect.usd);
        else periodTotals.adjustments = round2(periodTotals.adjustments + effect.usd);
      }
      return {
        id: row.id,
        day: when.day,
        time: when.time,
        type: row.type,
        manual: row.assignment_id === null,
        description: row.description || LEDGER_TYPE_LABEL[row.type],
        code: row.reservations?.reservation_code ?? null,
        original: effect.original,
        rate: effect.rate,
        usd: effect.usd,
        balance,
        upcoming: when.day > today,
      };
    });

  return {
    driver: {
      id: driver.id,
      name: driver.full_name,
      phone: driver.phone,
      active: driver.is_active !== false,
    },
    range,
    today,
    jobs,
    jobTotals,
    opening,
    movements,
    periodTotals,
    closing: balance,
    current: summariseLedger(ledger, today),
  };
}
