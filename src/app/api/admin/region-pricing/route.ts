import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Every vehicle category priced for one region, plus the settings
 * calculatePrice() needs — what "Yeni rezervasyon" reads to show a live quote
 * as the operator fills in the form, the same way the public site's wizard
 * does with /api/pricing. Admin-only, so it skips that endpoint's coupon and
 * active-region gating and just reads the raw pricing rows.
 */
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const regionId = request.nextUrl.searchParams.get("regionId");
  if (!regionId) return NextResponse.json({ error: "regionId is required" }, { status: 400 });

  const supabase = createAdminClient();

  const [{ data: pricing }, { data: settings }] = await Promise.all([
    supabase
      .from("pricing")
      .select(
        "category_id, one_way_price, round_trip_price, one_way_cash_price, round_trip_cash_price, cash_deposit_amount, round_trip_cash_deposit_amount, vehicle_categories!inner(id, name, max_passengers, max_luggage, is_active, sort_order)"
      )
      .eq("region_id", regionId)
      .eq("vehicle_categories.is_active", true),
    supabase
      .from("settings")
      .select("key, value")
      .in("key", [
        "child_seat_fee",
        "welcome_sign_fee",
        "cash_payment_enabled",
        "night_tariff_enabled",
        "night_tariff_start",
        "night_tariff_end",
        "night_tariff_percent",
      ]),
  ]);

  const settingsMap: Record<string, unknown> = {};
  for (const s of settings ?? []) settingsMap[s.key] = s.value;

  const vehicles = (pricing ?? [])
    .map((p) => {
      const cat = p.vehicle_categories as unknown as {
        id: string;
        name: string;
        max_passengers: number;
        max_luggage: number;
        sort_order: number;
      };
      return {
        categoryId: p.category_id as string,
        name: cat.name,
        maxPassengers: cat.max_passengers,
        maxLuggage: cat.max_luggage,
        sortOrder: cat.sort_order,
        oneWayPrice: p.one_way_price as number,
        roundTripPrice: p.round_trip_price as number | null,
        oneWayCashPrice: p.one_way_cash_price as number | null,
        roundTripCashPrice: p.round_trip_cash_price as number | null,
        cashDepositAmount: p.cash_deposit_amount as number | null,
        roundTripCashDepositAmount: p.round_trip_cash_deposit_amount as number | null,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return NextResponse.json({
    vehicles,
    settings: {
      childSeatFee: Number(settingsMap.child_seat_fee ?? 10),
      welcomeSignFee: Number(settingsMap.welcome_sign_fee ?? 5),
      cashPaymentEnabled: settingsMap.cash_payment_enabled === true || settingsMap.cash_payment_enabled === "true",
      nightTariffEnabled: settingsMap.night_tariff_enabled === true || settingsMap.night_tariff_enabled === "true",
      nightTariffStart: String(settingsMap.night_tariff_start ?? "0"),
      nightTariffEnd: String(settingsMap.night_tariff_end ?? "7"),
      nightTariffPercent: Number(settingsMap.night_tariff_percent ?? 0),
    },
  });
}
