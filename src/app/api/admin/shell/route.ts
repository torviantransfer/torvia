import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ASSIGNABLE_STATUSES } from "@/lib/reservation-status";
import { bookingDayKey, todayInBookingTz } from "@/lib/datetime";
import { LIVE_ASSIGNMENT_STATUSES } from "@/components/admin/reservations/types";
import type { ShellCounts } from "@/components/admin/nav";

/** Same window as the live visitors screen's "şu an sitede". */
const ACTIVE_NOW_MS = 90_000;

interface AssignableRow {
  trip_type: string | null;
  pickup_datetime: string | null;
  return_datetime: string | null;
  driver_assignments: { leg: string; status: string }[] | null;
}

/**
 * The few numbers every admin screen shows around its edges: the sidebar
 * badges and the visitor pill in the top bar. Polled by AdminShell.
 */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = createAdminClient();
  const today = todayInBookingTz();
  // Pickup times are stored as the Antalya wall clock in UTC (lib/datetime),
  // so midnight "today" is written without an offset.
  const midnight = `${today}T00:00:00`;

  const [assignable, cancels, reviews, live] = await Promise.all([
    db
      .from("reservations")
      .select("trip_type, pickup_datetime, return_datetime, driver_assignments(leg, status)")
      .in("status", ASSIGNABLE_STATUSES)
      .or(`pickup_datetime.gte."${midnight}",return_datetime.gte."${midnight}"`),
    db.from("reservations").select("id", { count: "exact", head: true }).eq("status", "cancel_requested"),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("is_approved", false),
    // Rows, not a count: the pill says "kişi sitede", and a person reading the
    // site in two tabs owns two sessions here — sessionStorage gives each tab
    // its own id. The visitor id is shared across a browser's tabs, so the
    // people are counted by folding the rows onto it below.
    db
      .from("analytics_sessions")
      .select("session_id, visitor_id")
      .or("device.is.null,device.neq.bot")
      .gte("last_seen", new Date(Date.now() - ACTIVE_NOW_MS).toISOString())
      .limit(1000),
  ]);

  // A transfer waits for a driver while one of its legs still ahead of us has
  // no live assignment — the rule the reservations list uses, limited to legs
  // that have not already happened.
  const upcoming = (value: string | null) => !!value && bookingDayKey(value) >= today;
  const covered = (row: AssignableRow, leg: string) =>
    (row.driver_assignments ?? []).some((a) => a.leg === leg && LIVE_ASSIGNMENT_STATUSES.includes(a.status));

  const needsDriver = ((assignable.data ?? []) as AssignableRow[]).filter((row) => {
    if (upcoming(row.pickup_datetime) && !covered(row, "outbound")) return true;
    return (
      row.trip_type === "round_trip" &&
      upcoming(row.return_datetime ?? row.pickup_datetime) &&
      !covered(row, "return")
    );
  }).length;

  const counts: ShellCounts = {
    needsDriver,
    cancelRequests: cancels.count ?? 0,
    pendingReviews: reviews.count ?? 0,
    liveNow: new Set(
      ((live.data ?? []) as { session_id: string; visitor_id: string | null }[]).map(
        (s) => s.visitor_id || `session:${s.session_id}`
      )
    ).size,
  };

  return NextResponse.json(counts, { headers: { "Cache-Control": "no-store" } });
}
