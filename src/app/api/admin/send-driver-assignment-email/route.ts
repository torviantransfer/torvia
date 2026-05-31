import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { sendDriverAssignmentEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const assignmentId = body?.assignmentId;
    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: assignment, error } = await supabase
      .from("driver_assignments")
      .select(
        `id, leg, pickup_time, status,
         drivers(full_name, phone),
         vehicles(plate_number, brand, model),
         reservations(reservation_code, pickup_datetime, return_datetime, locale, regions(name_en, name_tr, name_de, name_pl, name_ru), customers(first_name, last_name, email))`
      )
      .eq("id", assignmentId)
      .single();

    if (error || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const reservation = Array.isArray(assignment.reservations) ? assignment.reservations[0] : assignment.reservations;
    const driver = Array.isArray(assignment.drivers) ? assignment.drivers[0] : assignment.drivers;
    const vehicle = Array.isArray(assignment.vehicles) ? assignment.vehicles[0] : assignment.vehicles;
    const region = Array.isArray(reservation.regions) ? reservation.regions[0] : reservation.regions;

    const locale = reservation.locale ?? "en";
    const customer = Array.isArray(reservation?.customers)
      ? reservation.customers[0]
      : reservation?.customers;

    if (!customer?.email) {
      return NextResponse.json({ error: "Customer email not available" }, { status: 400 });
    }

    await sendDriverAssignmentEmail({
      to: customer.email,
      customerFirstName: customer.first_name ?? "",
      reservationCode: reservation.reservation_code,
      leg: assignment.leg,
      driverName: driver?.full_name ?? "",
      driverPhone: driver?.phone ?? "",
      vehicleInfo: vehicle ? `${vehicle.brand} ${vehicle.model} — ${vehicle.plate_number}` : "—",
      pickupTime: assignment.pickup_time || undefined,
      regionName: (region as any)?.[`name_${locale}`] ?? region?.name_en ?? "",
      pickupDatetime: reservation.pickup_datetime,
      returnDatetime: reservation.return_datetime,
      locale,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-driver-assignment-email error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
