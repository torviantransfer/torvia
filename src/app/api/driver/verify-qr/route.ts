import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  try {
    const { token, qrValue } = await request.json();

    if (!token || !qrValue) {
      return NextResponse.json({ error: "Eksik bilgi." }, { status: 400 });
    }

    // Find the driver assignment by link token
    const { data: assignment } = await supabase
      .from("driver_assignments")
      .select("id, reservation_id, status, completed_at")
      .eq("link_token", token)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: "Görev bulunamadı." }, { status: 404 });
    }

    if (assignment.status === "completed") {
      return NextResponse.json({ error: "Bu transfer tamamlanmış." }, { status: 403 });
    }

    if (assignment.status !== "accepted" && assignment.status !== "picked_up") {
      return NextResponse.json(
        { verified: false, error: "Önce transferi kabul edin." },
        { status: 409 }
      );
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
        { verified: false, error: "Geçersiz QR kod — rezervasyon bulunamadı." },
        { status: 400 }
      );
    }

    // Verify the QR belongs to this driver's assigned reservation
    if (reservation.id !== assignment.reservation_id) {
      return NextResponse.json(
        { verified: false, error: "Bu QR kod size atanan transfere ait değil." },
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
      message: `Doğrulandı: ${reservation.reservation_code}. Yolculuk başlıyor.`,
      reservationCode: reservation.reservation_code,
    });
  } catch (err) {
    console.error("QR verification error:", err);
    return NextResponse.json({ error: "Sunucu hatası. Tekrar deneyin." }, { status: 500 });
  }
}
