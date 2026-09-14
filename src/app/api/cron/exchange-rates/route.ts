import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Refreshes the rates the site quotes in, called by Vercel CRON or by hand.
 *
 * The base is EUR because that is what fares are stored and charged in. It used
 * to be USD; the rows written under that base are left in place rather than
 * deleted, because they are what reservations taken before the switch were
 * converted with, and `exchange_rates` is the only record of those days' rates
 * outside the reservations themselves. Nothing reads them any more — every
 * caller now filters on `base_currency = 'EUR'`.
 *
 * A failed fetch writes nothing at all. Half-updating the pair would leave the
 * site quoting a fresh dollar price next to a stale lira one.
 */
export async function GET() {
  const supabase = createAdminClient();
  try {
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,TRY"
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Frankfurter API" },
        { status: 502 }
      );
    }
    const data = await res.json();
    const rates = data.rates as Record<string, number>;

    // A missing or zero rate would be written as-is and then divide the site's
    // prices to nothing, so it is rejected before it reaches the table.
    if (!rates?.USD || !rates?.TRY) {
      console.error("Exchange rate response missing USD or TRY:", rates);
      return NextResponse.json(
        { error: "Incomplete rates from Frankfurter API" },
        { status: 502 }
      );
    }

    const now = new Date().toISOString();

    // Upsert USD rate (dollars per one euro, ≈ 1.16)
    await supabase
      .from("exchange_rates")
      .upsert(
        {
          base_currency: "EUR",
          target_currency: "USD",
          rate: rates.USD,
          last_updated: now,
        },
        { onConflict: "base_currency,target_currency" }
      );

    // Upsert TRY rate (lira per one euro)
    await supabase
      .from("exchange_rates")
      .upsert(
        {
          base_currency: "EUR",
          target_currency: "TRY",
          rate: rates.TRY,
          last_updated: now,
        },
        { onConflict: "base_currency,target_currency" }
      );

    return NextResponse.json({
      success: true,
      base: "EUR",
      rates: { USD: rates.USD, TRY: rates.TRY },
      updatedAt: now,
    });
  } catch (err) {
    console.error("Exchange rate update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
