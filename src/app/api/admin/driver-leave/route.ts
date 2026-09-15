import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logEvent } from "@/lib/eventLog";

/** Admin setting or clearing a driver's leave day, from the Şoförler drawer. */
export async function POST(request: NextRequest) {
  const { error: authError, user } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const driverId = body?.driverId;
  const date = body?.date;
  const action = body?.action;
  if (!driverId || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !["add", "remove"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (action === "add") {
    const { error } = await supabase
      .from("driver_leave_days")
      .upsert({ driver_id: driverId, leave_date: date, set_by: "admin" }, { onConflict: "driver_id,leave_date" });
    if (error) return NextResponse.json({ error: "Kaydedilemedi." }, { status: 500 });
  } else {
    const { error } = await supabase.from("driver_leave_days").delete().eq("driver_id", driverId).eq("leave_date", date);
    if (error) return NextResponse.json({ error: "Kaldırılamadı." }, { status: 500 });
  }

  await logEvent(supabase, {
    driverId,
    action: action === "add" ? "leave_added" : "leave_removed",
    actor: user?.email ?? "admin",
    detail: { date },
  });

  return NextResponse.json({ ok: true });
}
