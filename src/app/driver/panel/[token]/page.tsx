import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { todayInBookingTz, bookingDayKey } from "@/lib/datetime";
import { legRoute } from "@/lib/transfer-route";
import DriverHome, { type DriverHomeJob } from "@/components/driver/DriverHome";

const LIVE_STATUSES = ["assigned", "accepted", "picked_up"];

type AssignmentRow = {
  id: string;
  leg: string;
  status: string;
  link_token: string;
  reservations: {
    reservation_code: string;
    trip_type: string;
    direction: string | null;
    pickup_datetime: string;
    return_datetime: string | null;
    regions: { name_tr: string | null; name_en: string | null } | null;
  } | null;
};

const legWall = (r: NonNullable<AssignmentRow["reservations"]>, leg: string) =>
  leg === "return" ? r.return_datetime ?? r.pickup_datetime : r.pickup_datetime;

function toJob(a: AssignmentRow): DriverHomeJob | null {
  if (!a.reservations) return null;
  const region = a.reservations.regions?.name_tr || a.reservations.regions?.name_en || "";
  const wall = legWall(a.reservations, a.leg);
  return {
    linkToken: a.link_token,
    code: a.reservations.reservation_code,
    wall,
    route: legRoute(a.reservations.direction, a.leg === "return" ? "return" : "outbound", region),
    status: a.status,
  };
}

/**
 * The driver's own, permanent link — unlike /driver/[token] (one-time, per
 * assignment, dead the moment that job is done), this one lives for as long
 * as the driver does and lists everything they have on. portal_token is the
 * credential; nothing else gates this page (migration 095).
 */
export default async function DriverPanelPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, full_name, phone")
    .eq("portal_token", token)
    .single();
  if (!driver) notFound();

  const today = todayInBookingTz();
  const thirtyOut = new Date();
  thirtyOut.setDate(thirtyOut.getDate() + 30);
  const horizon = thirtyOut.toISOString().slice(0, 10);

  const [{ data: assignments }, { data: leave }] = await Promise.all([
    supabase
      .from("driver_assignments")
      .select(
        `id, leg, status, link_token,
         reservations(reservation_code, trip_type, direction, pickup_datetime, return_datetime, regions(name_tr, name_en))`
      )
      .eq("driver_id", driver.id)
      .in("status", [...LIVE_STATUSES, "completed"])
      .order("assigned_at", { ascending: false })
      .limit(200),
    supabase
      .from("driver_leave_days")
      .select("leave_date, set_by")
      .eq("driver_id", driver.id)
      .gte("leave_date", today)
      .lte("leave_date", horizon),
  ]);

  const jobs = ((assignments ?? []) as unknown as AssignmentRow[]).map(toJob).filter((j): j is DriverHomeJob => !!j);
  const upcoming = jobs
    .filter((j) => LIVE_STATUSES.includes(j.status) && bookingDayKey(j.wall) >= today)
    .sort((a, b) => a.wall.localeCompare(b.wall));
  const recent = jobs
    .filter((j) => j.status === "completed")
    .sort((a, b) => b.wall.localeCompare(a.wall))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <DriverHome
          driverName={driver.full_name}
          phone={driver.phone}
          upcoming={upcoming}
          recent={recent}
          leaveDays={(leave ?? []).map((l) => l.leave_date as string)}
          token={token}
          today={today}
        />
      </div>
    </div>
  );
}
