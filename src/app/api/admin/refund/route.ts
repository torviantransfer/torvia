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

/** Zero-decimal currencies hold no minor unit — ¥500 is 500, not 50000. */
const ZERO_DECIMAL = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
  "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

function minorFactor(currency: string) {
  return ZERO_DECIMAL.has(currency.toLowerCase()) ? 1 : 100;
}

/**
 * What can still be refunded on a booking, read from Stripe rather than from us.
 *
 * Our own columns cannot answer this. `total_price` is what the booking costs,
 * not what was captured — a cash booking only ever charged the deposit, an
 * older row may have been charged in USD while the row now reads EUR, and a
 * partial refund may already have gone out from the Stripe dashboard. Asking
 * Stripe is the only way the figure on screen is the figure that exists.
 */
async function readCharge(stripe: Stripe, paymentIntentId: string) {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"],
  });
  const charge = pi.latest_charge as Stripe.Charge | null;
  if (!charge || typeof charge === "string") return null;
  if (charge.status !== "succeeded") return null;
  return {
    id: charge.id,
    currency: charge.currency,
    captured: charge.amount_captured ?? charge.amount,
    refunded: charge.amount_refunded ?? 0,
  };
}

/** GET — what the drawer shows before anyone presses anything. */
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const reservationId = request.nextUrl.searchParams.get("reservationId");
  if (!reservationId) {
    return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: r } = await supabase
    .from("reservations")
    .select("id, stripe_payment_intent_id")
    .eq("id", reservationId)
    .single();

  if (!r) return NextResponse.json({ error: "Rezervasyon bulunamadı." }, { status: 404 });
  if (!r.stripe_payment_intent_id) {
    return NextResponse.json({ refundable: false, reason: "no_payment" });
  }

  try {
    const charge = await readCharge(getStripe(), r.stripe_payment_intent_id);
    if (!charge) return NextResponse.json({ refundable: false, reason: "no_charge" });
    const factor = minorFactor(charge.currency);
    return NextResponse.json({
      refundable: charge.captured > charge.refunded,
      currency: charge.currency.toUpperCase(),
      captured: charge.captured / factor,
      refunded: charge.refunded / factor,
      remaining: (charge.captured - charge.refunded) / factor,
    });
  } catch (err) {
    console.error("refund read error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Stripe okunamadı." }, { status: 502 });
  }
}

/**
 * POST — sends money back.
 *
 * `amount` is in the charge's own currency and is optional: leaving it out
 * refunds everything still refundable. Whatever is asked for is clamped by what
 * Stripe says is left, so a stale screen can never over-refund.
 */
export async function POST(request: NextRequest) {
  const { error: authError, user } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const reservationId = body?.reservationId;
  if (!reservationId) {
    return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
  }

  const requested = body?.amount === undefined || body?.amount === null ? null : Number(body.amount);
  if (requested !== null && (!Number.isFinite(requested) || requested <= 0)) {
    return NextResponse.json({ error: "Geçersiz iade tutarı." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: r } = await supabase
    .from("reservations")
    .select("id, reservation_code, stripe_payment_intent_id")
    .eq("id", reservationId)
    .single();

  if (!r) return NextResponse.json({ error: "Rezervasyon bulunamadı." }, { status: 404 });
  if (!r.stripe_payment_intent_id) {
    return NextResponse.json(
      { error: "Bu rezervasyon için alınmış bir online ödeme yok." },
      { status: 400 }
    );
  }

  const stripe = getStripe();

  let charge: Awaited<ReturnType<typeof readCharge>>;
  try {
    charge = await readCharge(stripe, r.stripe_payment_intent_id);
  } catch (err) {
    console.error("refund read error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Stripe okunamadı." }, { status: 502 });
  }

  if (!charge) {
    return NextResponse.json({ error: "İade edilebilir bir tahsilat bulunamadı." }, { status: 400 });
  }

  const factor = minorFactor(charge.currency);
  const remaining = charge.captured - charge.refunded;
  if (remaining <= 0) {
    return NextResponse.json({ error: "Bu ödemenin tamamı zaten iade edilmiş." }, { status: 400 });
  }

  const amountMinor = requested === null ? remaining : Math.round(requested * factor);
  if (amountMinor > remaining) {
    return NextResponse.json(
      {
        error: `Kalan iade edilebilir tutar ${(remaining / factor).toFixed(2)} ${charge.currency.toUpperCase()} — daha fazlası iade edilemez.`,
      },
      { status: 400 }
    );
  }

  let refund: Stripe.Refund;
  try {
    refund = await stripe.refunds.create(
      {
        charge: charge.id,
        amount: amountMinor,
        metadata: {
          reservation_id: r.id,
          reservation_code: r.reservation_code,
          refunded_by: user?.email ?? "admin",
        },
      },
      // The admin can press twice, or the request can be retried; without this
      // the second attempt would send the money a second time.
      { idempotencyKey: `refund_${r.id}_${charge.refunded}_${amountMinor}` }
    );
  } catch (err) {
    const message =
      err instanceof Stripe.errors.StripeError
        ? (err.message ?? "İade yapılamadı.")
        : "İade yapılamadı.";
    console.error("refund create error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const totalRefunded = (charge.refunded + amountMinor) / factor;
  const isFull = charge.refunded + amountMinor >= charge.captured;

  // Mirrored onto the row so the drawer can show the state without calling
  // Stripe every time it opens. Stripe stays the source of truth.
  const { error: updateError } = await supabase
    .from("reservations")
    .update({
      refunded_amount: totalRefunded,
      refunded_currency: charge.currency.toUpperCase(),
      refunded_at: new Date().toISOString(),
    })
    .eq("id", r.id);

  if (updateError) {
    // The money has already gone out; failing the request here would invite a
    // second refund. Report success and leave a loud trail instead.
    console.error("refund saved at Stripe but not on the row:", updateError.message);
  }

  await logEvent(supabase, {
    reservationId: r.id,
    action: "refunded",
    actor: user?.email ?? "admin",
    detail: {
      amount: amountMinor / factor,
      currency: charge.currency.toUpperCase(),
      total_refunded: totalRefunded,
      full: isFull,
      refund_id: refund.id,
      row_updated: !updateError,
    },
  });

  return NextResponse.json({
    ok: true,
    amount: amountMinor / factor,
    currency: charge.currency.toUpperCase(),
    totalRefunded,
    full: isFull,
  });
}
