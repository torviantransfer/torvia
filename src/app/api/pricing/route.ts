import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePrice } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = request.nextUrl;
  const regionSlug = searchParams.get("region");
  const tripType = searchParams.get("trip") as "one_way" | "round_trip" | null;
  const pickupTime = searchParams.get("time") ?? "12:00";
  const childSeat = searchParams.get("childSeat") === "true";
  const welcomeSign = searchParams.get("welcomeSign") === "true";
  const couponCode = searchParams.get("coupon");

  if (!regionSlug) {
    return NextResponse.json({ error: "region is required" }, { status: 400 });
  }

  // Fetch region
  const { data: region, error: regionErr } = await supabase
    .from("regions")
    .select("*")
    .eq("slug", regionSlug)
    .eq("is_active", true)
    .single();

  if (regionErr || !region) {
    return NextResponse.json({ error: "Region not found" }, { status: 404 });
  }

  // Fetch pricing for this region (first active category)
  const { data: pricing, error: pricingErr } = await supabase
    .from("pricing")
    .select("*, vehicle_categories!inner(name, slug, description, image_url, max_passengers, max_luggage, features, is_active)")
    .eq("region_id", region.id)
    .eq("vehicle_categories.is_active", true)
    .single();

  if (pricingErr || !pricing) {
    return NextResponse.json({ error: "Pricing not found" }, { status: 404 });
  }

  // Fetch settings
  const { data: settings } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", [
      "night_surcharge_percent",
      "child_seat_fee",
      "welcome_sign_fee",
    ]);

  const settingsMap: Record<string, number> = {};
  for (const s of settings ?? []) {
    settingsMap[s.key] = typeof s.value === "number" ? s.value : Number(s.value);
  }

  // Check coupon
  let couponDiscountPercent = 0;
  let couponDiscountFixed = 0;
  let couponId: string | null = null;
  if (couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (coupon) {
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validUntil = new Date(coupon.valid_until);
      if (now >= validFrom && now <= validUntil && coupon.used_count < coupon.max_uses) {
        couponId = coupon.id;
        if (coupon.discount_type === "percent") {
          couponDiscountPercent = coupon.discount_value;
        } else {
          couponDiscountFixed = coupon.discount_value;
        }
      }
    }
  }

  // Calculate price
  const calculation = calculatePrice({
    oneWayPrice: pricing.one_way_price,
    roundTripPrice: pricing.round_trip_price,
    tripType: tripType ?? "one_way",
    pickupTime,
    childSeat,
    welcomeSign,
    couponDiscountPercent,
    couponDiscountFixed,
    nightSurchargePercent: settingsMap.night_surcharge_percent ?? 0,
    childSeatFee: settingsMap.child_seat_fee ?? 10,
    welcomeSignFee: settingsMap.welcome_sign_fee ?? 5,
  });

  // Fetch exchange rates
  const { data: rates } = await supabase
    .from("exchange_rates")
    .select("target_currency, rate")
    .eq("base_currency", "USD");

  const exchangeRates: Record<string, number> = { USD: 1 };
  for (const r of rates ?? []) {
    exchangeRates[r.target_currency] = r.rate;
  }

  return NextResponse.json({
    region: {
      id: region.id,
      slug: region.slug,
      name_en: region.name_en,
      name_tr: region.name_tr,
      name_de: region.name_de,
      name_pl: region.name_pl,
      name_ru: region.name_ru,
      distance_km: region.distance_km,
      duration_minutes: region.duration_minutes,
    },
    pricing: {
      id: pricing.id,
      one_way_price: pricing.one_way_price,
      round_trip_price: pricing.round_trip_price,
      category_id: pricing.category_id,
    },
    vehicle: {
      name: (pricing.vehicle_categories as Record<string, unknown>).name,
      slug: (pricing.vehicle_categories as Record<string, unknown>).slug,
      description: (pricing.vehicle_categories as Record<string, unknown>).description,
      image_url: (pricing.vehicle_categories as Record<string, unknown>).image_url,
      max_passengers: (pricing.vehicle_categories as Record<string, unknown>).max_passengers,
      max_luggage: (pricing.vehicle_categories as Record<string, unknown>).max_luggage,
      features: (pricing.vehicle_categories as Record<string, unknown>).features,
    },
    calculation,
    couponId,
    exchangeRates,
  });
}
