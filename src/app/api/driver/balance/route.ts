import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { balanceDue, createBalanceCheckout } from "@/lib/balancePayment";

/**
 * The driver's side of taking the balance by card, authenticated by the
 * assignment's link token like the rest of the driver panel.
 *
 * Only the outbound leg's driver may take it: the passenger settles once, at the
 * pickup, and driver_amount is a single figure for the whole booking (the same
 * rule the driver ledger applies).
 *
 * GET  — the balance state, polled while the QR is on screen so the driver sees
 *        the payment land instead of guessing.
 * POST — a Stripe Checkout page for the passenger to open on their own phone.
 */

async function load(token: string | null) {
  if (!token) return { error: "Missing token", status: 400 } as const;
  const supabase = createAdminClient();
  const { data: a } = await supabase
    .from("driver_assignments")
    .select("id, leg, status, reservation_id")
    .eq("link_token", token)
    .single();
  if (!a) return { error: "Assignment not found", status: 404 } as const;

  const { data: r } = await supabase
    .from("reservations")
    .select("*") // not the balance columns by name: this keeps answering before migration 107 is applied
    .eq("id", a.reservation_id)
    .single();
  if (!r) return { error: "Reservation not found", status: 404 } as const;
  return { supabase, a, r } as const;
}

export async function GET(request: NextRequest) {
  const loaded = await load(request.nextUrl.searchParams.get("token"));
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  const { a, r } = loaded;

  return NextResponse.json({
    paid: !!r.balance_paid_at,
    paidAmount: r.balance_amount === null ? null : Number(r.balance_amount),
    due: a.leg === "return" ? null : balanceDue(r),
    currency: (r.currency || "EUR").toUpperCase(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const loaded = await load(typeof body?.token === "string" ? body.token : null);
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: loaded.status });
  const { supabase, a } = loaded;

  if (a.leg === "return") {
    return NextResponse.json({ error: "Kalan tutar gidiş transferinde alınır." }, { status: 400 });
  }
  if (a.status === "completed") {
    return NextResponse.json({ error: "Transfer tamamlanmış." }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const result = await createBalanceCheckout(supabase, a.reservation_id, { origin, actor: `driver:${a.id}` });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
