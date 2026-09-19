import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { logEvent } from "@/lib/eventLog";
import { syncAssignmentLedger } from "@/lib/driverLedger";
import { sendTelegramRaw } from "@/lib/telegram";
import { balanceDue } from "@/lib/balance";

export { balanceDue } from "@/lib/balance";

/**
 * Paying the rest of a "pay in the vehicle" booking by card instead of cash.
 *
 * The deposit was taken online; driver_amount is what the driver would collect.
 * A passenger who picked cash because they did not yet trust us often wants,
 * once the car is in front of them, to pay that balance by card. The driver
 * shows a QR from their panel (or the office sends a link), the passenger pays
 * on their own phone, and the booking becomes an online-paid one:
 *
 *  - payment_method goes to "online" and driver_amount to 0, which is what every
 *    existing reader already understands: the voucher stops saying "collect",
 *    the track page stops saying "pay the driver", and the driver ledger's
 *    "collected cash from the passenger" row disappears on the next sync;
 *  - the deposit's PaymentIntent stays where it is. The balance gets its own
 *    columns (migration 107), because the refund screen refunds whatever
 *    stripe_payment_intent_id points at.
 *
 * The amount is always the booking's own balance and cannot be typed in. A
 * different figure would leave total_price and what was actually collected
 * disagreeing, and both the finance report and the driver ledger read the
 * former.
 */

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(amount);

type Result = { url: string; amount: number; currency: string } | { error: string; status: number };

/** A Stripe Checkout page for the balance, for the passenger to open on their own phone. */
export async function createBalanceCheckout(
  supabase: SupabaseClient,
  reservationId: string,
  opts: { origin: string; actor: string }
): Promise<Result> {
  const { data: r } = await supabase
    .from("reservations")
    .select("*, customers(email)")
    .eq("id", reservationId)
    .single();

  if (!r) return { error: "Rezervasyon bulunamadı.", status: 404 };
  if (!("balance_paid_at" in r)) {
    return { error: "Önce 107_balance_payment migration'ını çalıştırın.", status: 503 };
  }
  if (r.balance_paid_at) return { error: "Kalan tutar zaten ödenmiş.", status: 409 };
  const amount = balanceDue(r);
  if (amount === null) return { error: "Bu rezervasyonda online ödenecek kalan tutar yok.", status: 400 };

  const currency = (r.currency || "EUR").toUpperCase();
  const customer = Array.isArray(r.customers) ? r.customers[0] : r.customers;
  const base = opts.origin.replace(/\/$/, "");
  const back = `${base}/${r.locale ?? "en"}/track`;

  const metadata: Record<string, string> = {
    reservation_id: r.id,
    reservation_code: r.reservation_code,
    kind: "balance",
    balance_amount: String(amount),
  };

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.create({
      mode: "payment",
      // The passenger's phone decides the language, not the booking's: the
      // person scanning in the car may not be the one who booked.
      locale: "auto",
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `TORVIAN Transfer — ${r.reservation_code}`,
              description: "Remaining balance / Kalan tutar",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: customer?.email ?? undefined,
      success_url: back,
      cancel_url: back,
      metadata,
      payment_intent_data: { metadata },
    });
  } catch (err) {
    console.error("[balance] Stripe error:", err instanceof Error ? err.message : err);
    return { error: "Ödeme sayfası oluşturulamadı.", status: 500 };
  }

  await logEvent(supabase, {
    reservationId: r.id,
    action: "balance_link_created",
    actor: opts.actor,
    detail: { amount, currency },
  });

  return { url: session.url!, amount, currency };
}

/**
 * Records a paid balance. Called by the Stripe webhook for a PaymentIntent whose
 * metadata.kind is "balance"; safe to call twice for the same one.
 */
export async function applyBalancePayment(supabase: SupabaseClient, pi: Stripe.PaymentIntent): Promise<void> {
  const reservationId = pi.metadata?.reservation_id;
  const code = pi.metadata?.reservation_code ?? "?";
  if (!reservationId) return;

  const paid = (pi.amount_received || pi.amount || 0) / 100;
  const currency = (pi.currency || "eur").toUpperCase();

  const { data: r } = await supabase
    .from("reservations")
    .select("id, status, balance_payment_intent_id, balance_paid_at")
    .eq("id", reservationId)
    .single();
  if (!r) return;

  // A webhook retry for the payment already on record: nothing to do.
  if (r.balance_payment_intent_id === pi.id) return;

  // Guarded on balance_paid_at so that two checkouts paid for the same balance —
  // the driver's QR and a link from the office, say — cannot both be recorded.
  const { data: updated, error } = await supabase
    .from("reservations")
    .update({
      balance_payment_intent_id: pi.id,
      balance_amount: paid,
      balance_paid_at: new Date().toISOString(),
      payment_method: "online",
      driver_amount: 0,
      ...(r.status === "deposit_paid" ? { status: "paid" } : {}),
    })
    .eq("id", reservationId)
    .is("balance_paid_at", null)
    .select("id");

  if (error) {
    console.error(`[balance] ${code}: could not record the balance payment:`, error.message);
    await sendTelegramRaw(
      `⚠️ <b>Kalan ödeme kaydedilemedi</b>\n${code} · ${money(paid, currency)} kartla ödendi ama sisteme yazılamadı.\nHata: ${error.message}\nŞoföre nakit ALMAMASINI bildirin.`
    );
    return;
  }

  if (!updated || updated.length === 0) {
    // The balance had already been paid by another checkout: this is a second charge.
    await sendTelegramRaw(
      `🚨 <b>ÇİFT ÖDEME — iade gerekli</b>\n${code} için kalan tutar ikinci kez ödendi: ${money(paid, currency)}.\nStripe'ta ${pi.id} ödemesini iade edin.`
    );
    await logEvent(supabase, {
      reservationId,
      action: "balance_paid",
      actor: "system",
      detail: { duplicate: true, amount: paid, currency, payment_intent_id: pi.id },
    });
    return;
  }

  // The "collected cash from the passenger" rows were written from driver_amount;
  // re-running the sync now that it is 0 takes them out.
  const { data: assignments } = await supabase.from("driver_assignments").select("id").eq("reservation_id", reservationId);
  for (const a of assignments ?? []) await syncAssignmentLedger(supabase, a.id);

  await supabase.from("notification_log").insert({
    reservation_id: reservationId,
    type: "balance_received",
    channel: "system",
    recipient: "admin",
    content: `Balance paid online for ${code}: ${paid} ${currency}`,
    metadata: { reservation_id: reservationId, payment_intent_id: pi.id },
  });

  await logEvent(supabase, {
    reservationId,
    action: "balance_paid",
    actor: "system",
    detail: { amount: paid, currency, payment_intent_id: pi.id },
  });

  await sendTelegramRaw(
    `💳 <b>Kalan tutar kartla ödendi</b>\n${code} · ${money(paid, currency)}\nŞoför araçta nakit <b>ALMAYACAK</b>.`
  );
}
