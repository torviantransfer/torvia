import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { createBalanceCheckout } from "@/lib/balancePayment";

/**
 * "Kalanı tahsil et": the office's way to take the balance of a cash booking by
 * card — when the passenger asks over WhatsApp, or the driver cannot manage it
 * from the panel. Replaces creating a second booking and lowering the region's
 * price for a few minutes to charge the difference.
 */
export async function POST(request: NextRequest) {
  const { error: authError, user } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const reservationId = typeof body?.reservationId === "string" ? body.reservationId : null;
  if (!reservationId) return NextResponse.json({ error: "reservationId is required" }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const result = await createBalanceCheckout(createAdminClient(), reservationId, {
    origin,
    actor: user?.email ?? "admin",
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
