import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { sendPriceListToTelegram } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();

  // Read optional body for driver info and TL exchange rate
  let driverName: string | undefined;
  let vehiclePlate: string | undefined;
  let tlRate = 45; // default USD->TRY rate
  try {
    const body = await req.json();
    driverName = body.driverName;
    vehiclePlate = body.vehiclePlate;
    if (body.tlRate) tlRate = Number(body.tlRate);
  } catch { /* no body is fine */ }

  // Try to get actual exchange rate from DB
  const { data: rateData } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("base_currency", "USD")
    .eq("target_currency", "TRY")
    .single();
  if (rateData?.rate) tlRate = Number(rateData.rate);

  // Fetch all active regions with pricing
  const { data: pricing, error } = await supabase
    .from("pricing")
    .select("one_way_price, regions(name_en, name_tr, sort_order)")
    .eq("is_active", true)
    .order("sort_order", { referencedTable: "regions", ascending: true });

  if (error || !pricing) {
    return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 });
  }

  const regions = pricing
    .filter((p) => p.regions)
    .map((p) => {
      const region = p.regions as unknown as { name_en: string; name_tr: string; sort_order: number };
      const usd = Number(p.one_way_price);
      return {
        name: (region.name_tr || region.name_en).toUpperCase(),
        costTL: Math.round(usd * tlRate * 100) / 100,
        costUSD: usd,
        sortOrder: region.sort_order,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  await sendPriceListToTelegram(regions, driverName, vehiclePlate);

  return NextResponse.json({ ok: true, count: regions.length });
}
