import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Called by Vercel CRON or manually to refresh exchange rates
export async function GET() {
  const supabase = createAdminClient();
  try {
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,TRY"
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Frankfurter API" },
        { status: 502 }
      );
    }
    const data = await res.json();
    const rates = data.rates as Record<string, number>;

    const now = new Date().toISOString();

    // Upsert EUR rate
    await supabase
      .from("exchange_rates")
      .upsert(
        {
          base_currency: "USD",
          target_currency: "EUR",
          rate: rates.EUR,
          last_updated: now,
        },
        { onConflict: "base_currency,target_currency" }
      );

    // Upsert TRY rate
    await supabase
      .from("exchange_rates")
      .upsert(
        {
          base_currency: "USD",
          target_currency: "TRY",
          rate: rates.TRY,
          last_updated: now,
        },
        { onConflict: "base_currency,target_currency" }
      );

    return NextResponse.json({
      success: true,
      rates: { EUR: rates.EUR, TRY: rates.TRY },
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
