"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  pixelPurchase,
  gAdsConversionPurchase,
  hasTrackedPurchase,
  markPurchaseTracked,
} from "@/lib/pixel";
import { trackPaymentSuccess } from "@/lib/analytics";

interface Props {
  reservationCode: string;
  /** Full fare — what Meta has always been sent, left as-is. */
  totalPrice?: number;
  /** Server-verified: the reservation is in a status Stripe payment produced. */
  isPaid?: boolean;
  /** Amount Stripe actually captured (the deposit, for cash bookings). */
  chargedAmount?: number;
  /** Currency of that charge, from the PaymentIntent. */
  chargedCurrency?: string;
}

/** How long to keep waiting for the webhook before giving up (3 × 2s). */
const MAX_STATUS_RETRIES = 3;
const STATUS_RETRY_MS = 2000;

/**
 * Reports one purchase per reservation, and only for reservations that are
 * actually paid.
 *
 * Previously this fired on every render of the success page — which is a plain
 * URL, so a refresh, a back-navigation or a shared link each counted as another
 * sale — and the payment step fired its own copy on top of that.
 */
export default function PixelPurchaseFire({
  reservationCode,
  totalPrice = 0,
  isPaid = false,
  chargedAmount = 0,
  chargedCurrency = "USD",
}: Props) {
  const router = useRouter();
  const retries = useRef(0);

  useEffect(() => {
    if (!reservationCode || reservationCode === "—") return;

    if (!isPaid) {
      // A card sent through 3-D Secure returns here straight from Stripe, so
      // the webhook that marks the reservation paid can still be in flight.
      // Re-render from the server a few times before concluding this visitor
      // simply opened the URL without paying.
      if (retries.current < MAX_STATUS_RETRIES) {
        retries.current += 1;
        const timer = setTimeout(() => router.refresh(), STATUS_RETRY_MS);
        return () => clearTimeout(timer);
      }
      return;
    }

    if (totalPrice <= 0) return;
    if (hasTrackedPurchase(reservationCode)) return;

    // Claim it before sending, so a re-render mid-flight cannot send twice.
    markPurchaseTracked(reservationCode);

    // Meta keeps receiving the full fare in USD, matching what the server-side
    // CAPI event sends, so the two continue to de-duplicate on event_id.
    pixelPurchase(reservationCode, totalPrice, "USD");
    // Google Ads gets what was really captured, so a cash booking reports the
    // deposit rather than the full fare.
    gAdsConversionPurchase(
      chargedAmount > 0 ? chargedAmount : totalPrice,
      chargedCurrency,
      reservationCode
    );
    trackPaymentSuccess({ metadata: { reservationCode } });
  }, [reservationCode, totalPrice, isPaid, chargedAmount, chargedCurrency, router]);

  return null;
}
