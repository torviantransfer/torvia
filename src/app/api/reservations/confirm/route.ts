import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  try {
    const { paymentIntentId, reservationCode } = await request.json();

    if (!paymentIntentId || !reservationCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify payment intent status with Stripe
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Verify the reservation code matches metadata
    if (paymentIntent.metadata?.reservation_code !== reservationCode) {
      return NextResponse.json(
        { error: "Reservation mismatch" },
        { status: 400 }
      );
    }

    /* A pay-at-vehicle booking takes only the deposit by card, and the
       PaymentIntent already carries that fact — it is written into the
       metadata when the intent is created. Writing "paid" for one of those
       marks a cash booking as settled in full, and the driver never collects
       the balance. The webhook writes the right status too, so in normal
       operation this corrects itself within seconds; but this endpoint exists
       for when the webhook is late or lost, which is exactly the case where
       the wrong status would stick. */
    const isDeposit = paymentIntent.metadata?.is_deposit === "true";

    const { error: updateErr } = await supabase
      .from("reservations")
      .update({
        status: isDeposit ? "deposit_paid" : "paid",
        stripe_payment_intent_id: paymentIntent.id,
      })
      .eq("reservation_code", reservationCode)
      .eq("status", "pending");

    if (updateErr) {
      console.error("Confirm update error:", updateErr);
      return NextResponse.json(
        { error: "Failed to confirm reservation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Confirm API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
