import type { SupabaseClient } from "@supabase/supabase-js";
import { bookingDayKey } from "@/lib/datetime";
import { LIVE_ASSIGNMENT_STATUSES } from "@/components/admin/reservations/types";
import { summariseLedger, type LedgerListRow, type LedgerSummary } from "@/lib/driverStatement";
import { loadAllLedger } from "@/lib/driverStatementData";
import { legRoute } from "@/lib/transfer-route";

export interface DriverRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  portal_token: string | null;
  balance: LedgerSummary;
  todayJobs: number;
  onLeaveToday: boolean;
}

export interface DriverJob {
  key: string;
  code: string;
  wall: string;
  leg: "outbound" | "return";
  route: string;
  status: string;
}

interface AssignmentRow {
  driver_id: string | null;
  leg: string | null;
  status: string | null;
  reservations: {
    reservation_code: string;
    pickup_datetime: string;
    return_datetime: string | null;
    trip_type: string;
    direction: string | null;
    regions: { name_tr: string | null; name_en: string | null } | null;
  } | null;
}

const legDate = (r: NonNullable<AssignmentRow["reservations"]>, leg: string) =>
  leg === "return" ? (r.return_datetime ?? r.pickup_datetime) : r.pickup_datetime;

/** Every driver, with their balance (dollars) and how many legs they have today. */
export async function loadDriversOverview(
  db: SupabaseClient,
  today: string
): Promise<DriverRow[]> {
  const [{ data: drivers }, ledger, { data: assignments }, { data: leave }] = await Promise.all([
    db.from("drivers").select("id, full_name, phone, email, is_active, portal_token").order("full_name"),
    loadAllLedger(db),
    db
      .from("driver_assignments")
      .select("driver_id, leg, status, reservations(reservation_code, pickup_datetime, return_datetime, trip_type, direction, regions(name_tr, name_en))")
      .in("status", LIVE_ASSIGNMENT_STATUSES),
    db.from("driver_leave_days").select("driver_id").eq("leave_date", today),
  ]);

  const byDriverLedger = new Map<string, LedgerListRow[]>();
  for (const row of ledger) {
    const rows = byDriverLedger.get(row.driver_id) ?? [];
    rows.push(row);
    byDriverLedger.set(row.driver_id, rows);
  }

  const todayCount = new Map<string, number>();
  for (const a of (assignments ?? []) as unknown as AssignmentRow[]) {
    if (!a.driver_id || !a.reservations || !a.leg) continue;
    if (bookingDayKey(legDate(a.reservations, a.leg)) !== today) continue;
    todayCount.set(a.driver_id, (todayCount.get(a.driver_id) ?? 0) + 1);
  }

  const onLeaveToday = new Set((leave ?? []).map((l: { driver_id: string }) => l.driver_id));

  return ((drivers ?? []) as Omit<DriverRow, "balance" | "todayJobs" | "onLeaveToday">[]).map((d) => ({
    ...d,
    balance: summariseLedger(byDriverLedger.get(d.id) ?? [], today),
    todayJobs: todayCount.get(d.id) ?? 0,
    onLeaveToday: onLeaveToday.has(d.id),
  }));
}

/** A driver's next handful of jobs, today and beyond, for the drawer. */
export async function loadDriverUpcoming(db: SupabaseClient, driverId: string, today: string, limit = 8): Promise<DriverJob[]> {
  const { data } = await db
    .from("driver_assignments")
    .select("leg, status, reservations(reservation_code, pickup_datetime, return_datetime, trip_type, direction, regions(name_tr, name_en))")
    .eq("driver_id", driverId)
    .in("status", LIVE_ASSIGNMENT_STATUSES);

  const jobs: DriverJob[] = [];
  for (const a of (data ?? []) as unknown as AssignmentRow[]) {
    if (!a.reservations || !a.leg || !a.status) continue;
    const wall = legDate(a.reservations, a.leg);
    if (bookingDayKey(wall) < today) continue;
    const region = a.reservations.regions?.name_tr || a.reservations.regions?.name_en || "";
    jobs.push({
      key: `${a.reservations.reservation_code}:${a.leg}`,
      code: a.reservations.reservation_code,
      wall,
      leg: a.leg === "return" ? "return" : "outbound",
      route: legRoute(a.reservations.direction, a.leg === "return" ? "return" : "outbound", region),
      status: a.status,
    });
  }
  return jobs.sort((a, b) => a.wall.localeCompare(b.wall)).slice(0, limit);
}

/** A driver's leave days from today out to `days` ahead, for the drawer's grid. */
export async function loadDriverLeaveDays(db: SupabaseClient, driverId: string, today: string, days = 30): Promise<string[]> {
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + days);
  const { data } = await db
    .from("driver_leave_days")
    .select("leave_date")
    .eq("driver_id", driverId)
    .gte("leave_date", today)
    .lte("leave_date", horizon.toISOString().slice(0, 10));
  return (data ?? []).map((r: { leave_date: string }) => r.leave_date);
}
