import { createAdminClient } from "@/lib/supabase/admin";
import { BOOKING_TZ, bookingParts, todayInBookingTz } from "@/lib/datetime";
import { ASSIGNABLE_STATUSES, CONFIRMED_STATUSES } from "@/lib/reservation-status";
import { reservationMoney } from "@/lib/currency";
import { addDays, periodRange } from "@/lib/period";
import { change } from "@/lib/finance";
import { loadFinance } from "@/lib/financeData";
import { loadAllLedger } from "@/lib/driverStatementData";
import { summariseLedger, type LedgerListRow } from "@/lib/driverStatement";
import { loadCancelRequests, loadLegsBetween } from "@/lib/adminReservationsData";
import {
  dayKey,
  fareInEur,
  isArrivalLeg,
  isCash,
  legDateTime,
  legsOf,
  liveAssignment,
  LIVE_ASSIGNMENT_STATUSES,
  type Leg,
  type Reservation,
} from "@/components/admin/reservations/types";

type Db = ReturnType<typeof createAdminClient>;

export type TodayScope = "today" | "tomorrow" | "week";

export const parseTodayScope = (value: string | undefined): TodayScope =>
  value === "tomorrow" || value === "week" ? value : "today";

/** One leg of one booking, on the Antalya wall clock (`YYYY-MM-DDTHH:MM`). */
export interface TodayLeg {
  key: string;
  leg: Leg;
  wall: string;
  reservation: Reservation;
}

export interface DriverDay {
  id: string;
  name: string;
  jobs: number;
  /** road: a passenger is in the car; busy: more jobs ahead; free: nothing ahead. */
  state: "road" | "busy" | "free";
  next: string | null;
}

export interface MonthBox {
  net: number;
  change: number | null;
  revenue: number;
  months: { key: string; net: number }[];
  /** Dollars: what the driver accounts add up to in the drivers' favour. */
  owedToDrivers: number;
  ads: number;
  missingFees: number;
}

export interface TodayStats {
  transfers: number;
  arrivals: number;
  departures: number;
  passengers: number;
  bags: number;
  waiting: number;
  nextWaiting: string | null;
  cash: number;
  cashJobs: number;
  revenue: number;
  revenueChange: number | null;
}

export interface TodayData {
  scope: TodayScope;
  from: string;
  to: string;
  today: string;
  now: string;
  legs: TodayLeg[];
  waiting: TodayLeg[];
  pendingPayments: TodayLeg[];
  cancelRequests: Reservation[];
  stats: TodayStats;
  drivers: DriverDay[];
  month: MonthBox | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const wallOf = (value: string) => {
  const { date, time } = bookingParts(value);
  return `${date}T${time}`;
};

/** Antalya's clock now, in the same shape as a stored pickup time. */
function antalyaNow(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOOKING_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Net profit this month and what sits around it; left out if the finance tables are not there. */
async function loadMonth(db: Db, today: string): Promise<MonthBox | null> {
  try {
    const [{ report }, ledger] = await Promise.all([
      loadFinance(db, periodRange("this_month", today), today),
      loadAllLedger(db).catch(() => [] as LedgerListRow[]),
    ]);

    const byDriver = new Map<string, LedgerListRow[]>();
    for (const row of ledger) {
      const rows = byDriver.get(row.driver_id) ?? [];
      rows.push(row);
      byDriver.set(row.driver_id, rows);
    }
    let owed = 0;
    for (const rows of byDriver.values()) {
      const { balance } = summariseLedger(rows, today);
      if (balance > 0.005) owed += balance;
    }

    const ads = report.expenseCategories
      .filter((c) => /reklam|google|meta|ads/i.test(c.name))
      .reduce((sum, c) => sum + c.total, 0);

    return {
      net: report.totals.net,
      change: change(report.totals.net, report.previous?.net),
      revenue: report.totals.revenue,
      months: report.months.slice(-6).map((m) => ({ key: m.key, net: m.net })),
      owedToDrivers: round2(owed),
      ads: round2(ads),
      missingFees: report.totals.missingFees,
    };
  } catch (err) {
    console.error("today, month box:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * The operations screen for a day, tomorrow or the week ahead: who is being
 * driven when, what still needs doing, and where the drivers are.
 */
export async function loadToday(db: Db, scope: TodayScope): Promise<TodayData> {
  const today = todayInBookingTz();
  const now = antalyaNow();
  const from = scope === "tomorrow" ? addDays(today, 1) : today;
  const to = scope === "week" ? addDays(today, 6) : from;
  const span = scope === "week" ? 7 : 1;
  const previousFrom = addDays(from, -span);
  const previousTo = addDays(from, -1);

  const [rows, cancelRequests, driverRows, previous, month] = await Promise.all([
    loadLegsBetween(db, from, to),
    loadCancelRequests(db),
    db.from("drivers").select("id, full_name").eq("is_active", true).order("full_name"),
    db
      .from("reservations")
      .select("total_price, currency, exchange_rate_eur")
      .in("status", CONFIRMED_STATUSES)
      .gte("pickup_datetime", `${previousFrom}T00:00:00`)
      .lte("pickup_datetime", `${previousTo}T23:59:59`),
    loadMonth(db, today),
  ]);

  const legs: TodayLeg[] = rows
    .flatMap((r) =>
      legsOf(r)
        .map((leg) => ({ leg, at: legDateTime(r, leg), reservation: r }))
        .filter(({ at }) => {
          const day = dayKey(at);
          return day >= from && day <= to;
        })
        .map(({ leg, at, reservation }) => ({
          key: `${reservation.reservation_code}:${leg}`,
          leg,
          wall: wallOf(at),
          reservation,
        }))
    )
    .sort((a, b) => a.wall.localeCompare(b.wall));

  const active = legs.filter((l) => l.reservation.status !== "pending");
  const waiting = active.filter(
    (l) => ASSIGNABLE_STATUSES.includes(l.reservation.status) && !liveAssignment(l.reservation, l.leg)
  );
  const pendingPayments = legs.filter((l) => l.reservation.status === "pending" && l.leg === "outbound");

  const cashLegs = active.filter(
    (l) => l.leg === "outbound" && isCash(l.reservation) && Number(l.reservation.driver_amount) > 0
  );

  // Revenue by pickup day, once per booking — the rule the finance screen uses.
  const revenue = rows
    .filter((r) => CONFIRMED_STATUSES.includes(r.status))
    .filter((r) => {
      const day = dayKey(r.pickup_datetime);
      return day >= from && day <= to;
    })
    .reduce((sum, r) => sum + fareInEur(r), 0);
  const previousRevenue = ((previous.data ?? []) as {
    total_price: number;
    currency: string | null;
    exchange_rate_eur: number | null;
  }[]).reduce(
    (sum, r) => sum + reservationMoney(Number(r.total_price) || 0, r.currency, r.exchange_rate_eur).value,
    0
  );

  const stats: TodayStats = {
    transfers: active.length,
    arrivals: active.filter((l) => isArrivalLeg(l.reservation, l.leg)).length,
    departures: active.filter((l) => !isArrivalLeg(l.reservation, l.leg)).length,
    passengers: active.reduce((sum, l) => sum + (l.reservation.adults ?? 0) + (l.reservation.children ?? 0), 0),
    bags: active.reduce((sum, l) => sum + (Number(l.reservation.luggage_count) || 0), 0),
    waiting: waiting.length,
    nextWaiting: (waiting.find((l) => l.wall >= now) ?? waiting[0])?.wall ?? null,
    cash: round2(
      cashLegs.reduce(
        (sum, l) =>
          sum +
          reservationMoney(
            Number(l.reservation.driver_amount) || 0,
            l.reservation.currency,
            l.reservation.exchange_rate_eur
          ).value,
        0
      )
    ),
    cashJobs: cashLegs.length,
    revenue: round2(revenue),
    revenueChange: change(round2(revenue), round2(previousRevenue)),
  };

  const order = { road: 0, busy: 1, free: 2 };
  const drivers: DriverDay[] = ((driverRows.data ?? []) as { id: string; full_name: string }[])
    .map((d) => {
      const jobs = active.flatMap((l) =>
        (l.reservation.driver_assignments ?? [])
          .filter(
            (da) =>
              da.driver_id === d.id &&
              da.leg === l.leg &&
              (LIVE_ASSIGNMENT_STATUSES.includes(da.status) || da.status === "completed")
          )
          .map((da) => ({ wall: l.wall, status: da.status }))
      );
      const next = jobs
        .filter((j) => j.wall >= now && LIVE_ASSIGNMENT_STATUSES.includes(j.status))
        .sort((a, b) => a.wall.localeCompare(b.wall))[0];
      const state: DriverDay["state"] = jobs.some((j) => j.status === "picked_up") ? "road" : next ? "busy" : "free";
      return { id: d.id, name: d.full_name, jobs: jobs.length, state, next: next?.wall ?? null };
    })
    .sort(
      (a, b) =>
        order[a.state] - order[b.state] ||
        (a.next ?? "~").localeCompare(b.next ?? "~") ||
        a.name.localeCompare(b.name, "tr")
    );

  return {
    scope,
    from,
    to,
    today,
    now,
    legs,
    waiting,
    pendingPayments,
    cancelRequests: [...cancelRequests].sort((a, b) => a.pickup_datetime.localeCompare(b.pickup_datetime)),
    stats,
    drivers,
    month,
  };
}
