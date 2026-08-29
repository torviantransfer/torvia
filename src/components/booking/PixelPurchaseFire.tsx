"use client";

import { useEffect } from "react";
import { pixelPurchase, gAdsConversionPurchase } from "@/lib/pixel";
import { trackPaymentSuccess } from "@/lib/analytics";

interface Props {
  reservationCode: string;
  totalPrice?: number;
}

export default function PixelPurchaseFire({ reservationCode, totalPrice = 0 }: Props) {
  useEffect(() => {
    if (reservationCode && reservationCode !== "—") {
      // Meta requires custom_data.value to be a number greater than 0 —
      // skip the Purchase event entirely rather than reporting a bad value.
      if (totalPrice > 0) {
        pixelPurchase(reservationCode, totalPrice, "USD");
        gAdsConversionPurchase(totalPrice, "USD", reservationCode);
      }
      trackPaymentSuccess({ metadata: { reservationCode } });
    }
  }, [reservationCode, totalPrice]);

  return null;
}
