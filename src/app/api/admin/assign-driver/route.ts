import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import { requireAdmin } from "@/lib/admin-auth";
import { assignDriverSchema } from "@/lib/validations";
import { syncAssignmentLedger } from "@/lib/driverLedger";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const parsed = assignDriverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { reservationId, driverId, vehicleId, leg, pickupTime, driverFee } = parsed.data;

    // Verify reservation exists and is paid
    const { data: reservation } = await supabase
      .from("reservations")
      .select("id, reservation_code, status, total_price, pickup_datetime, return_datetime, trip_type, regions(name_en), customers(first_name, last_name, phone, email)")
      .eq("id", reservationId)
      .single();

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Verify driver exists and is active
    const { data: driverCheck } = await supabase
      .from("drivers")
      .select("id, is_active")
      .eq("id", driverId)
      .single();

    if (!driverCheck) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Verify vehicle exists
    const { data: vehicleCheck } = await supabase
      .from("vehicles")
      .select("id, plate_number, brand, model")
      .eq("id", vehicleId)
      .single();

    if (!vehicleCheck) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Check for existing active assignment on this reservation FOR THIS LEG
    const { data: existingAssignment } = await supabase
      .from("driver_assignments")
      .select("id")
      .eq("reservation_id", reservationId)
      .eq("leg", leg)
      .in("status", ["assigned", "accepted", "picked_up"])
      .single();

    if (existingAssignment) {
      return NextResponse.json(
        { error: `This reservation already has an active ${leg} driver assignment` },
        { status: 409 }
      );
    }

    // Generate one-time driver link token
    const linkToken = crypto.randomUUID();

    // Create driver assignment
    const { data: assignment, error } = await supabase
      .from("driver_assignments")
      .insert({
        reservation_id: reservationId,
        driver_id: driverId,
        vehicle_id: vehicleId,
        link_token: linkToken,
        status: "assigned",
        leg,
        pickup_time: pickupTime || null,
        driver_fee: driverFee ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Assignment error:", error?.message);
      return NextResponse.json(
        { error: "Failed to assign driver" },
        { status: 500 }
      );
    }

    // Update reservation status
    await supabase
      .from("reservations")
      .update({ status: "driver_assigned" })
      .eq("id", reservationId);

    // What the driver is owed, and — on a cash booking — the fare he collects
    // from the passenger against it. A no-op while the rate is still unset.
    await syncAssignmentLedger(supabase, assignment.id);

    // Generate the one-time driver link. Prefer NEXT_PUBLIC_SITE_URL, fallback to request host/proto.
    const proto = (request.headers.get("x-forwarded-proto") || request.headers.get("referer")?.split(":")[0] || "https");
    const host = request.headers.get("host") || "";
    const origin = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : undefined);
    const driverLink = origin ? `${origin.replace(/\/$/, "")}/driver/${linkToken}` : `/driver/${linkToken}`;

    // Fetch driver details for WhatsApp message
    const { data: driver } = await supabase
      .from("drivers")
      .select("full_name, phone")
      .eq("id", driverId)
      .single();

    // Build WhatsApp message for driver
    const region = Array.isArray(reservation.regions)
      ? reservation.regions[0]
      : reservation.regions;
    const customer = Array.isArray(reservation.customers)
      ? reservation.customers[0]
      : reservation.customers;
    const pickupDate = new Date(reservation.pickup_datetime);
    const legLabel = leg === "return" ? "DÖNÜŞ" : "GİDİŞ";
    // Driver voucher link
    const voucherLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/driver-voucher?token=${linkToken}`;

    const waMessage = encodeURIComponent(
      `🚗 TORVIAN — New Transfer Assignment (${legLabel})\n\n` +
        `📋 Code: ${reservation.reservation_code}\n` +
        `👤 Customer: ${customer?.first_name} ${customer?.last_name}\n` +
        `📍 Destination: ${region?.name_en}\n` +
        `📅 Date: ${pickupDate.toLocaleDateString()} ${pickupDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n` +
        (leg === "return" && pickupTime ? `⏰ Pickup Time: ${pickupTime}\n` : "") +
        `\n🔗 Driver Panel:\n${driverLink}\n\n` +
        `📄 Voucher:\n${voucherLink}`
    );

    const whatsappUrl = `https://wa.me/${driver?.phone?.replace(/[^0-9]/g, "")}?text=${waMessage}`;

    /* No Telegram message from here.
     *
     * Assigning a driver used to fire one automatically, so the group saw a
     * job the moment it was booked to someone -- including the reassignments
     * and corrections that never reached a driver, and a second message when
     * the return leg followed. The group is the pool the work is offered to,
     * not a log of admin activity.
     *
     * Telegram now has exactly two senders: a booking arriving (the webhook),
     * and the "Telegram'a gönder" action on the reservation, pressed
     * deliberately when the job is actually ready to be handed out.
     */

    return NextResponse.json({
      assignment,
      driverLink,
      whatsappUrl,
    });
  } catch (err) {
    console.error("Assign driver error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
