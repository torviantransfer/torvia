import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const reservation_code = String(body.reservation_code ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const rating = Number(body.rating);
  const comment = String(body.comment ?? "").trim().slice(0, 1000);

  if (!reservation_code || !email || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find customer
  const { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("email", email)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Find reservation and verify ownership + completed status
  const { data: reservation } = await admin
    .from("reservations")
    .select("id, status, customer_id")
    .eq("reservation_code", reservation_code)
    .eq("customer_id", customer.id)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  if (reservation.status !== "completed") {
    return NextResponse.json({ error: "Can only review completed transfers" }, { status: 400 });
  }

  // Check if already reviewed
  const { data: existing } = await admin
    .from("reviews")
    .select("id")
    .eq("reservation_id", reservation.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
  }

  // Insert review
  const { error: insertError } = await admin.from("reviews").insert({
    reservation_id: reservation.id,
    customer_id: customer.id,
    rating: Math.round(rating),
    comment: comment || null,
    is_approved: false,
  });

  if (insertError) {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
