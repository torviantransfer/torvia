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
  const categorySlug = searchParams.get("category");

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

  // Fetch pricing for this region — all active vehicle categories
  let pricingQuery = supabase
    .from("pricing")
    .select("*, vehicle_categories!inner(id, name, slug, description, image_url, max_passengers, max_luggage, features, is_active, sort_order)")
    .eq("region_id", region.id)
    .eq("vehicle_categories.is_active", true);

  if (categorySlug) {
    pricingQuery = pricingQuery.eq("vehicle_categories.slug", categorySlug);
  }

  const { data: pricingRows, error: pricingErr } = await pricingQuery.order("one_way_price", { ascending: true });

  if (pricingErr || !pricingRows || pricingRows.length === 0) {
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

  // Fetch exchange rates
  const { data: rates } = await supabase
    .from("exchange_rates")
    .select("target_currency, rate")
    .eq("base_currency", "USD");

  const exchangeRates: Record<string, number> = { USD: 1 };
  for (const r of rates ?? []) {
    exchangeRates[r.target_currency] = r.rate;
  }

  // Build vehicles array with price calculation for each
  const vehicles = pricingRows.map((pricing) => {
    const cat = pricing.vehicle_categories as Record<string, unknown>;
    const calculation = calculatePrice({
      oneWayPrice: pricing.one_way_price,
      roundTripPrice: pricing.round_trip_price,
      tripType: tripType ?? "one_way",
      pickupTime,
      childSeat,
      welcomeSign,
      couponDiscountPercent,
      couponDiscountFixed,
      nightSurchargePercent: 0, // Gece tarifesi yok
      childSeatFee: settingsMap.child_seat_fee ?? 10,
      welcomeSignFee: settingsMap.welcome_sign_fee ?? 5,
    });

    return {
      categoryId: pricing.category_id,
      name: cat.name as string,
      slug: cat.slug as string,
      description: cat.description as string | null,
      image_url: cat.image_url as string | null,
      max_passengers: cat.max_passengers as number,
      max_luggage: cat.max_luggage as number,
      features: cat.features as string[],
      sort_order: cat.sort_order as number,
      oneWayPrice: pricing.one_way_price,
      roundTripPrice: pricing.round_trip_price,
      calculation,
    };
  });

  // Sort by sort_order then by price
  vehicles.sort((a, b) => a.sort_order - b.sort_order || a.calculation.totalPrice - b.calculation.totalPrice);

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
      latitude: region.latitude,
      longitude: region.longitude,
    },
    vehicles,
    couponId,
    exchangeRates,
    settings: {
      childSeatFee: settingsMap.child_seat_fee ?? 10,
      welcomeSignFee: settingsMap.welcome_sign_fee ?? 5,
    },
  });
}
