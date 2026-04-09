import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { token, qrValue } = await request.json();

    if (!token || !qrValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the driver assignment by link token
    const { data: assignment } = await supabase
      .from("driver_assignments")
      .select("id, reservation_id, status, completed_at")
      .eq("link_token", token)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Reject if link is expired (2h after completion)
    if (assignment.status === "completed" && assignment.completed_at) {
      const elapsed = Date.now() - new Date(assignment.completed_at).getTime();
      if (elapsed > 2 * 60 * 60 * 1000) {
        return NextResponse.json({ error: "This link has expired" }, { status: 403 });
      }
    }

    // Extract QR token from the scanned value
    // QR value might be a full URL like "https://torviantransfer.com/verify/UUID" or just the UUID
    let qrToken = qrValue;
    const urlMatch = qrValue.match(/\/verify\/([a-f0-9-]+)/i);
    if (urlMatch) {
      qrToken = urlMatch[1];
    }

    // Find the reservation by QR token
    const { data: reservation } = await supabase
      .from("reservations")
      .select("id, reservation_code, qr_code_token, status")
      .eq("qr_code_token", qrToken)
      .single();

    if (!reservation) {
      return NextResponse.json(
        { verified: false, error: "Invalid QR code — no matching reservation found." },
        { status: 400 }
      );
    }

    // Verify the QR belongs to this driver's assigned reservation
    if (reservation.id !== assignment.reservation_id) {
      return NextResponse.json(
        { verified: false, error: "This QR code does not match your assigned transfer." },
        { status: 400 }
      );
    }

    // Verified successfully — log it
    await supabase.from("notification_log").insert({
      type: "qr_verified",
      channel: "system",
      recipient: "driver",
      content: `QR verified for reservation ${reservation.reservation_code}`,
      metadata: {
        assignment_id: assignment.id,
        reservation_id: reservation.id,
        verified_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      verified: true,
      message: `Verified! Reservation ${reservation.reservation_code} confirmed.`,
      reservationCode: reservation.reservation_code,
    });
  } catch (err) {
    console.error("QR verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
