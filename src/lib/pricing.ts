import type { PriceCalculation } from "@/types";

interface PriceCalcInput {
  oneWayPrice: number;
  roundTripPrice: number | null;
  tripType: "one_way" | "round_trip";
  pickupTime: string; // HH:mm
  childSeat: boolean;
  welcomeSign: boolean;
  couponDiscountPercent: number; // 0-100
  couponDiscountFixed: number; // USD
  nightSurchargePercent: number; // e.g. 4
  nightTariffEnabled?: boolean;  // if false, nightSurchargePercent is ignored
  nightTariffStart?: number;     // hour 0-23, e.g. 0 for 00:00
  nightTariffEnd?: number;       // hour 0-23, e.g. 7 for 07:00
  childSeatFee: number; // USD, 0 if free
  welcomeSignFee: number; // USD
  onlineDiscountPercent?: number; // e.g. 3 for 3% off when paying online
}

export function calculatePrice(input: PriceCalcInput): PriceCalculation {
  const {
    oneWayPrice,
    roundTripPrice,
    tripType,
    pickupTime,
    childSeat,
    welcomeSign,
    couponDiscountPercent,
    couponDiscountFixed,
    nightSurchargePercent,
    nightTariffEnabled = true,
    nightTariffStart = 22,
    nightTariffEnd = 6,
    childSeatFee,
    welcomeSignFee,
    onlineDiscountPercent = 0,
  } = input;

  // Base price
  let basePrice: number;
  let roundTripDiscount = 0;
  if (tripType === "round_trip" && roundTripPrice) {
    basePrice = roundTripPrice;
    // Discount is the difference between 2x one-way and the actual round-trip price
    roundTripDiscount = oneWayPrice * 2 - roundTripPrice;
  } else {
    basePrice = oneWayPrice;
  }

  // Night tariff: supports ranges that cross midnight (e.g. 22-06) or same-day (e.g. 00-07)
  const hour = parseInt(pickupTime.split(":")[0], 10);
  const isNightHour = nightTariffStart > nightTariffEnd
    ? (hour >= nightTariffStart || hour < nightTariffEnd)   // crosses midnight
    : (hour >= nightTariffStart && hour < nightTariffEnd);  // same day
  const isNight = nightTariffEnabled && isNightHour;
  const nightSurcharge = isNight
    ? Math.round(basePrice * (nightSurchargePercent / 100) * 100) / 100
    : 0;

  // Optional extras
  const csf = childSeat ? childSeatFee : 0;
  const wsf = welcomeSign ? welcomeSignFee : 0;

  // Subtotal before coupon
  const subtotal = basePrice + nightSurcharge + csf + wsf;

  // Coupon discount
  let couponDiscount = 0;
  if (couponDiscountPercent > 0) {
    couponDiscount = Math.round(subtotal * (couponDiscountPercent / 100) * 100) / 100;
  } else if (couponDiscountFixed > 0) {
    couponDiscount = Math.min(couponDiscountFixed, subtotal);
  }

  const afterCoupon = Math.round((subtotal - couponDiscount) * 100) / 100;

  // Online payment discount applied on top of coupon discount
  const onlineDiscount = onlineDiscountPercent > 0
    ? Math.round(afterCoupon * (onlineDiscountPercent / 100) * 100) / 100
    : 0;

  const totalPrice = Math.max(Math.round((afterCoupon - onlineDiscount) * 100) / 100, 0);

  return {
    basePrice,
    nightSurcharge,
    childSeatFee: csf,
    welcomeSignFee: wsf,
    roundTripDiscount,
    couponDiscount,
    onlineDiscount,
    totalPrice,
  };
}

export function isNightTime(time: string): boolean {
  const hour = parseInt(time.split(":")[0], 10);
  return hour >= 22 || hour < 6;
}

export function formatPrice(
  amount: number,
  currency: "USD" | "EUR" | "TRY"
): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    TRY: "₺",
  };
  const formatted = amount.toFixed(2);
  return `${symbols[currency]}${formatted}`;
}

export function convertPrice(
  amountUSD: number,
  targetCurrency: "USD" | "EUR" | "TRY",
  rates: { EUR: number; TRY: number }
): number {
  if (targetCurrency === "USD") return amountUSD;
  return Math.round(amountUSD * rates[targetCurrency] * 100) / 100;
}
