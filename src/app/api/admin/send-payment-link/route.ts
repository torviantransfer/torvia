import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { logEvent } from "@/lib/eventLog";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

/**
 * A shareable Stripe Checkout link for a reservation taken by hand
 * (/api/admin/create-reservation) or any other booking still `pending`. The
 * PaymentIntent behind the Checkout Session carries the exact metadata keys
 * /api/stripe/webhook already reads (reservation_id, is_deposit, ...), so the
 * webhook needs no changes at all — a link paid this way is indistinguishable
 * from one paid through the public wizard.
 */
export async function POST(request: NextRequest) {
  const { error: authError, user } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const reservationId = body?.reservationId;
  if (!reservationId) return NextResponse.json({ error: "reservationId is required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: r } = await supabase
    .from("reservations")
    .select(
      "id, reservation_code, status, payment_method, total_price, deposit_amount, locale, customers(email, first_name, last_name)"
    )
    .eq("id", reservationId)
    .single();

  if (!r) return NextResponse.json({ error: "Rezervasyon bulunamadı." }, { status: 404 });
  if (r.status !== "pending") {
    return NextResponse.json({ error: "Bu rezervasyon zaten ödenmiş veya iptal edilmiş." }, { status: 400 });
  }

  const customer = Array.isArray(r.customers) ? r.customers[0] : r.customers;
  const isCash = r.payment_method === "cash";
  const amount = isCash ? Number(r.deposit_amount) || 0 : Number(r.total_price) || 0;
  if (amount <= 0) return NextResponse.json({ error: "Geçersiz tutar." }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const locale = r.locale ?? "tr";
  const trackUrl = `${origin.replace(/\/$/, "")}/${locale}/track`;

  const metadata: Record<string, string> = {
    reservation_id: r.id,
    reservation_code: r.reservation_code,
    locale,
    payment_method: isCash ? "cash" : "online",
    is_deposit: isCash ? "true" : "false",
    cash_total: isCash ? String(r.total_price) : "",
    driver_amount: isCash ? String(0) : "",
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `TORVIAN Transfer — ${r.reservation_code}`,
              description: isCash ? "Kapora" : "Transfer ücreti",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: customer?.email,
      success_url: trackUrl,
      cancel_url: trackUrl,
      metadata,
      payment_intent_data: { metadata },
    });
  } catch (err) {
    console.error("send-payment-link Stripe error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Ödeme linki oluşturulamadı." }, { status: 500 });
  }

  await supabase
    .from("reservations")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    })
    .eq("id", r.id);

  await logEvent(supabase, {
    reservationId: r.id,
    action: "payment_link_sent",
    actor: user?.email ?? "admin",
    detail: { amount, is_deposit: isCash },
  });

  return NextResponse.json({ url: session.url });
}
