"use client";

import { useState, useEffect, useCallback } from "react";
import { type Currency, currencySymbols } from "@/i18n/config";

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>("USD");

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
      const d = currency === "TRY" ? 0 : dec;
      return `${symbol}${converted.toFixed(d)}`;
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
          if (c === "USD") return `≈ ${symbol}${usdAmount.toFixed(2)}`;
          const rate = exchangeRates[c];
          if (!rate) return "";
          const converted = usdAmount * rate;
          const d = c === "TRY" ? 0 : 2;
          return `≈ ${symbol}${converted.toFixed(d)}`;
        })
        .filter(Boolean);
    },
    [currency]
  );

  return { currency, format, otherCurrencies };
}
