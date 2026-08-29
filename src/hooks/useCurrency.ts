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

/** Rounds to whole units and dot-groups them, e.g. 3377.4 -> "3.377". */
function groupThousands(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
    (
      usdAmount: number,
      exchangeRates: Record<string, number>,
      opts?: { decimals?: number }
    ): string => {
      const dec = opts?.decimals ?? 2;
      const symbol = currencySymbols[currency];
      if (currency === "USD") {
        return `${symbol}${usdAmount.toFixed(dec)}`;
      }
      const rate = exchangeRates[currency];
      if (!rate) return `$${usdAmount.toFixed(dec)}`;
      const converted = usdAmount * rate;
      // Lira amounts run into the thousands, so group them — "₺3.377" is far
      // quicker to read at a glance than "₺3377".
      if (currency === "TRY") return `${symbol}${groupThousands(converted)}`;
      return `${symbol}${converted.toFixed(dec)}`;
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
          if (c === "USD") return `${symbol}${usdAmount.toFixed(2)}`;
          const rate = exchangeRates[c];
          if (!rate) return "";
          const converted = usdAmount * rate;
          if (c === "TRY") return `${symbol}${groupThousands(converted)}`;
          return `${symbol}${converted.toFixed(2)}`;
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
