import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logEvent } from "@/lib/eventLog";

/**
 * Records that a driver was told about a delay (A9).
 *
 * The message itself goes out over the admin's own WhatsApp — there is nothing
 * to send from here. What this endpoint is for is the trail: without it the
 * only evidence a driver was warned would be in someone's phone.
 */
export async function POST(request: NextRequest) {
  const { error: authError, user } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const reservationId = body?.reservationId;
  const minutes = Number(body?.minutes);

  if (!reservationId || !Number.isFinite(minutes) || minutes <= 0) {
    return NextResponse.json({ error: "reservationId and minutes are required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Read the driver rather than trusting the client for a name that goes into
  // a permanent record.
  let driverName: string | null = null;
  let driverId: string | null = null;
  if (body?.assignmentId) {
    const { data } = await supabase
      .from("driver_assignments")
      .select("driver_id, drivers(full_name)")
      .eq("id", body.assignmentId)
      .single();
    const driver = Array.isArray(data?.drivers) ? data?.drivers[0] : data?.drivers;
    driverId = data?.driver_id ?? null;
    driverName = driver?.full_name ?? null;
  }

  await logEvent(supabase, {
    reservationId,
    driverId,
    action: "delay_notified",
    actor: user?.email ?? "admin",
    detail: {
      minutes,
      leg: body?.leg ?? "outbound",
      new_time: body?.newTime ?? null,
      driver: driverName,
    },
  });

  return NextResponse.json({ ok: true });
}
