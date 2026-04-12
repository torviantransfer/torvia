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
  nightSurchargePercent: number; // e.g. 15
  childSeatFee: number; // USD, 0 if free
  welcomeSignFee: number; // USD
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
    childSeatFee,
    welcomeSignFee,
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

  // Time-based additional fee calculation (currently set by config)
  const hour = parseInt(pickupTime.split(":")[0], 10);
  const isNight = hour >= 22 || hour < 6;
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

  const totalPrice = Math.round((subtotal - couponDiscount) * 100) / 100;

  return {
    basePrice,
    nightSurcharge,
    childSeatFee: csf,
    welcomeSignFee: wsf,
    roundTripDiscount,
    couponDiscount,
    totalPrice: Math.max(totalPrice, 0),
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
