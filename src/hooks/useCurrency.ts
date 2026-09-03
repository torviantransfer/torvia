"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import {
  type Currency,
  type Locale,
  currencySymbols,
  localeCurrencies,
} from "@/i18n/config";
// The conversion direction and the rounding rule live in lib/currency so the
// voucher, the PDF and the emails apply exactly what the site shows.
import { convertFromUSD, displayAmount } from "@/lib/currency";

/**
 * Every Stripe PaymentIntent is created in USD (see /api/reservations), so
 * prices in any other currency are a display conversion. Screens showing a
 * converted price should say what is actually charged, or the amount on the
 * card statement won't match what the customer agreed to.
 */
export const BILLING_CURRENCY: Currency = "USD";

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
      return `${symbol}${displayAmount(convertFromUSD(usdAmount, rate), currency)}`;
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
          return `${symbol}${displayAmount(convertFromUSD(usdAmount, rate), c)}`;
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
