"use client";

import { useEffect } from "react";
import { pixelPurchase } from "@/lib/pixel";

interface Props {
  reservationCode: string;
}

/**
 * Success sayfasına mount edildiğinde Purchase pixel eventini tetikler.
 * StripeCheckoutEmbed redirect durumlarında devreye girer.
 */
export default function PixelPurchaseFire({ reservationCode }: Props) {
  useEffect(() => {
    if (reservationCode && reservationCode !== "—") {
      pixelPurchase(reservationCode, 0, "USD");
    }
  }, [reservationCode]);

  return null;
}
