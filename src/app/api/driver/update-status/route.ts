import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyDriverStatus } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  try {
    const { token, status } = await request.json();

    if (!token || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validStatuses = ["accepted", "picked_up", "completed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Find assignment by token with driver & vehicle info
    const { data: assignment } = await supabase
      .from("driver_assignments")
      .select("id, reservation_id, status, completed_at, drivers(full_name), vehicles(brand, model, plate_number)")
      .eq("link_token", token)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Reject if link is expired (2h after completion)
    if (assignment.status === "completed" && assignment.completed_at) {
      const elapsed = Date.now() - new Date(assignment.completed_at as string).getTime();
      if (elapsed > 2 * 60 * 60 * 1000) {
        return NextResponse.json({ error: "This link has expired" }, { status: 403 });
      }
    }

    // Update assignment status + timestamps
    const updateData: Record<string, unknown> = { status };
    if (status === "accepted") updateData.accepted_at = new Date().toISOString();
    if (status === "picked_up") updateData.picked_up_at = new Date().toISOString();
    if (status === "completed") updateData.completed_at = new Date().toISOString();

    await supabase
      .from("driver_assignments")
      .update(updateData)
      .eq("id", assignment.id);

    // Update reservation status to match
    const resStatusMap: Record<string, string> = {
      accepted: "driver_assigned",
      picked_up: "passenger_picked_up",
      completed: "completed",
    };

    await supabase
      .from("reservations")
      .update({ status: resStatusMap[status] })
      .eq("id", assignment.reservation_id);

    // Fetch reservation + customer for notifications
    const { data: res } = await supabase
      .from("reservations")
      .select("reservation_code, customers(first_name, phone, email)")
      .eq("id", assignment.reservation_id)
      .single();

    // Log status change in notification_log
    const cust = Array.isArray(res?.customers) ? res.customers[0] : res?.customers;
    await supabase.from("notification_log").insert({
      type: "driver_status_update",
      channel: "system",
      recipient: cust?.email ?? "unknown",
      content: `Driver status changed to ${status} for reservation ${res?.reservation_code}`,
      metadata: {
        assignment_id: assignment.id,
        reservation_id: assignment.reservation_id,
        new_status: status,
        timestamp: new Date().toISOString(),
      },
    });

    // Send Telegram notification to admin
    const rawDriver = assignment.drivers;
    const driverObj = Array.isArray(rawDriver) ? rawDriver[0] : rawDriver;
    const driverName = (driverObj as { full_name: string } | null)?.full_name ?? "Unknown";
    notifyDriverStatus({
      code: res?.reservation_code ?? "?",
      driver: driverName,
      status,
    }).catch(() => {});

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error("Driver status update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
