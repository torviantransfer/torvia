"use client";

import { useState, useEffect } from "react";
import { type Currency, currencySymbols } from "@/i18n/config";

export default function PriceTag({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  const [currency, setCurrency] = useState<Currency>("USD");

  useEffect(() => {
    const stored = localStorage.getItem("TORVIAN_currency") as Currency | null;
    if (stored && (stored === "USD" || stored === "EUR" || stored === "TRY")) {
      setCurrency(stored);
    }
    const handler = (e: Event) => {
      setCurrency((e as CustomEvent).detail as Currency);
    };
    window.addEventListener("currency-change", handler);
    return () => window.removeEventListener("currency-change", handler);
  }, []);

  const symbol = currencySymbols[currency] ?? "$";
  return (
    <span className={className}>
      From {symbol}{amount}
    </span>
  );
}
