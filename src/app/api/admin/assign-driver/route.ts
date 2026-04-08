import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { notifyDriverAssigned } from "@/lib/telegram";
import { requireAdmin } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const { reservationId, driverId, vehicleId } = await request.json();

    if (!reservationId || !driverId || !vehicleId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify reservation exists and is paid
    const { data: reservation } = await supabase
      .from("reservations")
      .select("id, reservation_code, status, total_price, pickup_datetime, regions(name_en), customers(first_name, last_name, phone)")
      .eq("id", reservationId)
      .single();

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
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
      })
      .select()
      .single();

    if (error) {
      console.error("Assignment error:", error);
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

    // Generate the one-time driver link
    const driverLink = `${process.env.NEXT_PUBLIC_SITE_URL}/driver/${linkToken}`;

    // Fetch driver details for WhatsApp message
    const { data: driver } = await supabase
      .from("drivers")
      .select("full_name, phone")
      .eq("id", driverId)
      .single();

    // Build WhatsApp message for driver
    const region = reservation.regions as unknown as Record<string, string> | null;
    const customer = reservation.customers as unknown as Record<string, string> | null;
    const pickupDate = new Date(reservation.pickup_datetime);
    // Driver voucher link
    const voucherLink = `${process.env.NEXT_PUBLIC_SITE_URL}/api/driver-voucher?token=${linkToken}`;

    const waMessage = encodeURIComponent(
      `🚗 VELORA — New Transfer Assignment\n\n` +
        `📋 Code: ${reservation.reservation_code}\n` +
        `👤 Customer: ${customer?.first_name} ${customer?.last_name}\n` +
        `📍 Destination: ${region?.name_en}\n` +
        `📅 Date: ${pickupDate.toLocaleDateString()} ${pickupDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n\n` +
        `🔗 Driver Panel:\n${driverLink}\n\n` +
        `📄 Voucher:\n${voucherLink}`
    );

    const whatsappUrl = `https://wa.me/${driver?.phone?.replace(/[^0-9]/g, "")}?text=${waMessage}`;

    // Send Telegram notification to admin
    notifyDriverAssigned({
      code: reservation.reservation_code,
      driver: driver?.full_name ?? "?",
      destination: region?.name_en ?? "?",
      date: pickupDate.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }),
    }).catch(() => {});

    return NextResponse.json({
      assignment,
      driverLink,
      whatsappUrl,
    });
  } catch (err) {
    console.error("Assign driver error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
