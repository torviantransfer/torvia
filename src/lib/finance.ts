/**
 * The company's profit and loss, in euro.
 *
 * Revenue and driver cost are not typed in: they come from the reservations,
 * each counted on the day of its transfer, so a month's fares are set against
 * that same month's drivers. Everything else — advertising, other costs, other
 * income — is entered by hand on the finance screen, in whatever currency it
 * was paid, with its euro value fixed on the day it was entered.
 *
 * Pure: the page, the export and the tests read the same figures from here.
 */
import { convertSettlement, settlementOf } from "@/lib/currency";
import { bookingParts } from "@/lib/datetime";
import {
  addMonths,
  inRange,
  monthEnd,
  monthKey,
  monthLabel,
  monthsBetween,
  monthStart,
  previousRange,
  type DateRange,
} from "@/lib/period";
import { isCash, type Cash } from "@/lib/rates";
import { CONFIRMED_STATUSES } from "@/lib/reservation-status";

export type EntryKind = "income" | "expense";

export interface FinanceCategory {
  id: string;
  name: string;
  kind: EntryKind;
  sort_order: number;
  is_active: boolean;
}

export interface RawFinanceEntry {
  id: string;
  entry_date: string;
  kind: EntryKind;
  category_id: string | null;
  amount: number | string;
  currency: string;
  /** Euro per one unit of `currency`. */
  exchange_rate: number | string;
  amount_eur: number | string;
  description: string | null;
  created_at: string;
  finance_categories: { name: string | null } | null;
}

export interface RawFinanceReservation {
  id: string;
  reservation_code: string;
  status: string;
  trip_type: string;
  pickup_datetime: string;
  total_price: number | string;
  currency: string | null;
  exchange_rate_usd: number | string | null;
  exchange_rate_eur: number | string | null;
  payment_method: string | null;
  regions: { name_tr: string | null; name_en: string | null } | null;
  driver_assignments:
    | {
        leg: string | null;
        driver_fee: number | string | null;
        driver_fee_currency: string | null;
        drivers: { full_name: string | null } | null;
      }[]
    | null;
}

const num = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// ─── one transfer ───

export interface TransferProfit {
  id: string;
  code: string;
  day: string;
  time: string;
  region: string;
  tripType: string;
  payment: "cash" | "online";
  /** null when a pre-euro booking carries no rate to convert its fare with. */
  fareEur: number | null;
  /** The fees that are known, in euro. */
  driverCostEur: number;
  /** No driver yet, a leg with no fee, or a fee that cannot be converted. */
  missingFee: boolean;
  profitEur: number | null;
  drivers: string[];
}

export function transferProfit(r: RawFinanceReservation): TransferProfit {
  const usdPerEur = num(r.exchange_rate_usd);
  const eurPerUsd = num(r.exchange_rate_eur);
  const total = num(r.total_price) ?? 0;
  const fareEur =
    r.currency === "EUR" ? round2(total) : convertSettlement(total, settlementOf(r.currency), "EUR", usdPerEur, eurPerUsd);

  const assignments = r.driver_assignments ?? [];
  let cost = 0;
  let missingFee = assignments.length === 0 || (r.trip_type === "round_trip" && assignments.length < 2);
  for (const a of assignments) {
    const fee = num(a.driver_fee);
    const inEur = fee === null ? null : convertSettlement(fee, settlementOf(a.driver_fee_currency), "EUR", usdPerEur, eurPerUsd);
    if (inEur === null) missingFee = true;
    else cost += inEur;
  }

  const at = bookingParts(r.pickup_datetime);
  return {
    id: r.id,
    code: r.reservation_code,
    day: at.date,
    time: at.time,
    region: r.regions?.name_tr || r.regions?.name_en || "—",
    tripType: r.trip_type,
    payment: r.payment_method === "cash" ? "cash" : "online",
    fareEur,
    driverCostEur: round2(cost),
    missingFee,
    profitEur: fareEur === null ? null : round2(fareEur - cost),
    drivers: [...new Set(assignments.map((a) => a.drivers?.full_name).filter((n): n is string => !!n))],
  };
}

// ─── the report ───

export interface FinanceTotals {
  revenue: number;
  driverCost: number;
  grossProfit: number;
  otherIncome: number;
  expenses: number;
  net: number;
  /** Net profit as a share of revenue, in percent. */
  marginPct: number | null;
  transfers: number;
  /** Transfers whose driver cost is incomplete, so net profit is overstated by it. */
  missingFees: number;
  /** Transfers left out of revenue for want of a rate. */
  unconvertible: number;
}

export interface MonthRow {
  key: string;
  label: string;
  revenue: number;
  driverCost: number;
  expenses: number;
  otherIncome: number;
  /** Driver cost and expenses together: everything that went out. */
  costs: number;
  net: number;
  transfers: number;
}

export interface CategoryTotal {
  name: string;
  total: number;
  count: number;
  /** Share of its kind's total, 0-1. */
  share: number;
}

export interface EntryRow {
  id: string;
  day: string;
  kind: EntryKind;
  category: string;
  amount: number;
  currency: Cash;
  amountEur: number;
  /** Euro per one unit of `currency`. */
  eurPerUnit: number;
  description: string | null;
}

export interface FinanceReport {
  range: DateRange;
  today: string;
  totals: FinanceTotals;
  previousRange: DateRange | null;
  previous: FinanceTotals | null;
  months: MonthRow[];
  expenseCategories: CategoryTotal[];
  incomeCategories: CategoryTotal[];
  transfers: TransferProfit[];
  entries: EntryRow[];
}

const entryDay = (e: RawFinanceEntry) => e.entry_date.slice(0, 10);

function totalsOf(transfers: TransferProfit[], entries: RawFinanceEntry[]): FinanceTotals {
  let revenue = 0;
  let driverCost = 0;
  let unconvertible = 0;
  let missingFees = 0;
  for (const t of transfers) {
    if (t.fareEur === null) {
      unconvertible += 1;
      continue;
    }
    revenue += t.fareEur;
    driverCost += t.driverCostEur;
    if (t.missingFee) missingFees += 1;
  }
  let otherIncome = 0;
  let expenses = 0;
  for (const e of entries) {
    const eur = num(e.amount_eur) ?? 0;
    if (e.kind === "income") otherIncome += eur;
    else expenses += eur;
  }
  const net = revenue - driverCost + otherIncome - expenses;
  return {
    revenue: round2(revenue),
    driverCost: round2(driverCost),
    grossProfit: round2(revenue - driverCost),
    otherIncome: round2(otherIncome),
    expenses: round2(expenses),
    net: round2(net),
    marginPct: revenue > 0 ? Math.round((net / revenue) * 1000) / 10 : null,
    transfers: transfers.length - unconvertible,
    missingFees,
    unconvertible,
  };
}

/**
 * The months the trend chart shows. The months of the period itself when it
 * spans at least six; otherwise the six months that end with it, so a single
 * month still has something to be compared with. Never more than two years,
 * and never months that have not started.
 */
export function chartMonths(range: DateRange, today: string): string[] {
  const lastDay = range.to && range.to < today ? range.to : today;
  let end = monthKey(lastDay);
  if (range.from && range.from > today) end = monthKey(range.to ?? range.from);
  let start = range.from ? monthKey(range.from) : addMonths(end, -11);
  if (start > end) start = end;
  let months = monthsBetween(start, end);
  if (months.length < 6) months = monthsBetween(addMonths(end, -5), end);
  if (months.length > 24) months = monthsBetween(addMonths(end, -23), end);
  return months;
}

/** The days that have to be loaded to build the report: the period, the one before it, and the chart. */
export function financeWindow(range: DateRange, today: string): DateRange {
  const months = chartMonths(range, today);
  const prev = previousRange(range);
  const starts = [range.from, prev?.from, monthStart(months[0])];
  const ends = [range.to, prev?.to, monthEnd(months[months.length - 1])];
  return {
    from: starts.some((d) => d === null) ? null : (starts as string[]).sort()[0],
    to: ends.some((d) => d === null) ? null : (ends as string[]).sort().pop()!,
  };
}

function categoryTotals(entries: RawFinanceEntry[], kind: EntryKind): CategoryTotal[] {
  const byName = new Map<string, { total: number; count: number }>();
  for (const e of entries.filter((x) => x.kind === kind)) {
    const name = e.finance_categories?.name || "Kategorisiz";
    const row = byName.get(name) ?? { total: 0, count: 0 };
    row.total += num(e.amount_eur) ?? 0;
    row.count += 1;
    byName.set(name, row);
  }
  const all = [...byName.values()].reduce((s, r) => s + r.total, 0);
  return [...byName.entries()]
    .map(([name, r]) => ({ name, total: round2(r.total), count: r.count, share: all > 0 ? r.total / all : 0 }))
    .sort((a, b) => b.total - a.total);
}

export function buildFinanceReport(input: {
  reservations: RawFinanceReservation[];
  entries: RawFinanceEntry[];
  range: DateRange;
  today: string;
}): FinanceReport {
  const { range, today } = input;

  // Only bookings that are going to happen, and only once: a cancelled or
  // unpaid booking is not revenue.
  const allTransfers = input.reservations
    .filter((r) => CONFIRMED_STATUSES.includes(r.status))
    .map(transferProfit);

  const transfers = allTransfers
    .filter((t) => inRange(t.day, range))
    .sort((a, b) => `${b.day} ${b.time}`.localeCompare(`${a.day} ${a.time}`));
  const entries = input.entries.filter((e) => inRange(entryDay(e), range));

  const prevRange = previousRange(range);
  const previous = prevRange
    ? totalsOf(
        allTransfers.filter((t) => inRange(t.day, prevRange)),
        input.entries.filter((e) => inRange(entryDay(e), prevRange))
      )
    : null;

  const months: MonthRow[] = chartMonths(range, today).map((key) => {
    const monthRange = { from: monthStart(key), to: monthEnd(key) };
    const t = totalsOf(
      allTransfers.filter((x) => inRange(x.day, monthRange)),
      input.entries.filter((e) => inRange(entryDay(e), monthRange))
    );
    return {
      key,
      label: monthLabel(key),
      revenue: t.revenue,
      driverCost: t.driverCost,
      expenses: t.expenses,
      otherIncome: t.otherIncome,
      costs: round2(t.driverCost + t.expenses),
      net: t.net,
      transfers: t.transfers,
    };
  });

  return {
    range,
    today,
    totals: totalsOf(transfers, entries),
    previousRange: prevRange,
    previous,
    months,
    expenseCategories: categoryTotals(entries, "expense"),
    incomeCategories: categoryTotals(entries, "income"),
    transfers,
    entries: entries
      .map((e) => ({
        id: e.id,
        day: entryDay(e),
        kind: e.kind,
        category: e.finance_categories?.name || "Kategorisiz",
        amount: num(e.amount) ?? 0,
        currency: isCash(e.currency) ? e.currency : "EUR",
        amountEur: num(e.amount_eur) ?? 0,
        eurPerUnit: num(e.exchange_rate) ?? 1,
        description: e.description,
      }))
      .sort((a, b) => b.day.localeCompare(a.day)),
  };
}

/** Percent change from `before` to `after`; null when there is nothing to compare with. */
export function change(after: number, before: number | undefined | null): number | null {
  if (before === null || before === undefined || before === 0) return null;
  return Math.round(((after - before) / Math.abs(before)) * 1000) / 10;
}
