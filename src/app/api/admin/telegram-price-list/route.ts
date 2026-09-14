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
  // Fallback only; the stored EUR->TRY rate below replaces it when present.
  let tlRate = 56; // default EUR->TRY rate
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
    .eq("base_currency", "EUR")
    .eq("target_currency", "TRY")
    .single();
  if (rateData?.rate) tlRate = Number(rateData.rate);

  // Every active region price, for every active vehicle. `pricing` is keyed
  // (region_id, category_id), so this returns one row per region *per vehicle*
  // — the rows have to be grouped by vehicle below or the same region is
  // listed several times at different prices with nothing naming the vehicle.
  const { data: pricing, error } = await supabase
    .from("pricing")
    .select("one_way_price, regions(name_en, name_tr, sort_order), vehicle_categories!inner(name, sort_order, is_active)")
    .eq("is_active", true)
    .eq("vehicle_categories.is_active", true)
    .order("sort_order", { referencedTable: "regions", ascending: true });

  if (error || !pricing) {
    return NextResponse.json({ error: "Failed to fetch pricing" }, { status: 500 });
  }

  type VehicleJoin = { name: string; sort_order: number };
  const byVehicle = new Map<
    string,
    { vehicle: string; sortOrder: number; regions: { name: string; costTL: number; costEUR: number; sortOrder: number }[] }
  >();

  for (const p of pricing) {
    if (!p.regions) continue;
    const region = p.regions as unknown as { name_en: string; name_tr: string; sort_order: number };
    const vehicle = p.vehicle_categories as unknown as VehicleJoin;
    const eur = Number(p.one_way_price);

    let group = byVehicle.get(vehicle.name);
    if (!group) {
      group = { vehicle: vehicle.name, sortOrder: vehicle.sort_order ?? 0, regions: [] };
      byVehicle.set(vehicle.name, group);
    }
    group.regions.push({
      name: (region.name_tr || region.name_en).toUpperCase(),
      costTL: Math.round(eur * tlRate * 100) / 100,
      costEUR: eur,
      sortOrder: region.sort_order,
    });
  }

  // Vehicles in panel order, regions in their own order inside each vehicle.
  const groups = [...byVehicle.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => ({
      vehicle: g.vehicle,
      regions: [...g.regions].sort((a, b) => a.sortOrder - b.sortOrder),
    }));

  await sendPriceListToTelegram(groups, driverName, vehiclePlate);

  return NextResponse.json({
    ok: true,
    count: groups.reduce((sum, g) => sum + g.regions.length, 0),
  });
}
