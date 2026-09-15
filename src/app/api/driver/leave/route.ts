import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/eventLog";

/**
 * A driver marking (or clearing) their own leave day, from the permanent
 * panel at /driver/panel/[token]. No admin session involved — the portal
 * token itself is the credential, the same way a per-assignment link_token
 * already authorises status updates in /api/driver/update-status.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = body?.token;
  const date = body?.date;
  const action = body?.action;
  if (!token || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !["add", "remove"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: driver } = await supabase.from("drivers").select("id, full_name").eq("portal_token", token).single();
  if (!driver) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "add") {
    const { error } = await supabase
      .from("driver_leave_days")
      .upsert({ driver_id: driver.id, leave_date: date, set_by: "driver" }, { onConflict: "driver_id,leave_date" });
    if (error) return NextResponse.json({ error: "Kaydedilemedi." }, { status: 500 });
    await logEvent(supabase, { driverId: driver.id, action: "leave_added", actor: driver.full_name, detail: { date } });
  } else {
    const { error } = await supabase
      .from("driver_leave_days")
      .delete()
      .eq("driver_id", driver.id)
      .eq("leave_date", date)
      .eq("set_by", "driver");
    if (error) return NextResponse.json({ error: "Kaldırılamadı." }, { status: 500 });
    await logEvent(supabase, { driverId: driver.id, action: "leave_removed", actor: driver.full_name, detail: { date } });
  }

  return NextResponse.json({ ok: true });
}
