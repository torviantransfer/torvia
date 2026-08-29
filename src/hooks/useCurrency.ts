"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import {
  type Currency,
  type Locale,
  currencySymbols,
  localeCurrencies,
} from "@/i18n/config";

/**
 * Every Stripe PaymentIntent is created in USD (see /api/reservations), so
 * prices in any other currency are a display conversion. Screens showing a
 * converted price should say what is actually charged, or the amount on the
 * card statement won't match what the customer agreed to.
 */
export const BILLING_CURRENCY: Currency = "USD";

/** Dot-groups a whole number, e.g. 3485 -> "3.485". */
function groupThousands(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Rounds to the nearest `step`, with an exact half going down: at step 1,
 * 25.50 -> 25 and 25.51 -> 26. Math.round would send 25.50 up instead.
 */
function roundHalfDown(value: number, step = 1): number {
  return Math.ceil(value / step - 0.5) * step;
}

/**
 * Prices are keyed in as whole dollars, so any figure with cents on screen is
 * an artefact of converting to another currency. Those get rounded away —
 * euro to the nearest whole unit, lira to the nearest five, since a lira
 * amount runs to four digits and the last one carries no meaning.
 *
 * Dollars are left exactly as they are: that is the currency Stripe charges,
 * so rounding it here would put a different number on screen than on the
 * customer's statement. A percentage coupon is the one thing that can put
 * cents on a dollar price, and then they are shown rather than hidden.
 */
function displayAmount(value: number, currency: Currency): string {
  if (currency === "TRY") return groupThousands(roundHalfDown(value, 5));
  if (currency === "EUR") return String(roundHalfDown(value));
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function useCurrency() {
  const locale = useLocale() as Locale;
  // Start from the locale's own currency rather than USD for everyone. This is
  // derived from the URL, so it matches between server and client render; the
  // visitor's explicit pick is applied below once localStorage is readable.
  const [currency, setCurrency] = useState<Currency>(
    localeCurrencies[locale] ?? "USD"
  );

  useEffect(() => {
    const stored = localStorage.getItem("TORVIAN_currency") as Currency | null;
    if (stored && (stored === "USD" || stored === "EUR" || stored === "TRY")) {
      setCurrency(stored);
    }

    const handler = (e: Event) => {
      const c = (e as CustomEvent).detail as Currency;
      setCurrency(c);
    };
    window.addEventListener("currency-change", handler);
    return () => window.removeEventListener("currency-change", handler);
  }, []);

  const format = useCallback(
    (usdAmount: number, exchangeRates: Record<string, number>): string => {
      const symbol = currencySymbols[currency];
      if (currency === "USD") {
        return `${symbol}${displayAmount(usdAmount, "USD")}`;
      }
      const rate = exchangeRates[currency];
      // No rate yet — fall back to the dollar figure rather than a wrong one.
      if (!rate) return `${currencySymbols.USD}${displayAmount(usdAmount, "USD")}`;
      return `${symbol}${displayAmount(usdAmount * rate, currency)}`;
    },
    [currency]
  );

  const otherCurrencies = useCallback(
    (
      usdAmount: number,
      exchangeRates: Record<string, number>
    ): string[] => {
      const others: Currency[] = (["USD", "EUR", "TRY"] as Currency[]).filter(
        (c) => c !== currency
      );
      return others
        .map((c) => {
          const symbol = currencySymbols[c];
          if (c === "USD") return `${symbol}${displayAmount(usdAmount, "USD")}`;
          const rate = exchangeRates[c];
          if (!rate) return "";
          return `${symbol}${displayAmount(usdAmount * rate, c)}`;
        })
        .filter(Boolean);
    },
    [currency]
  );

  /**
   * The amount exactly as Stripe will charge it. Show this next to a converted
   * price so the card statement can't surprise the customer.
   */
  const formatBilling = useCallback(
    (usdAmount: number) => `${currencySymbols[BILLING_CURRENCY]}${usdAmount.toFixed(2)}`,
    []
  );

  return {
    currency,
    format,
    otherCurrencies,
    formatBilling,
    /** True when `format` is showing a conversion rather than the charged amount. */
    isConverted: currency !== BILLING_CURRENCY,
  };
}
