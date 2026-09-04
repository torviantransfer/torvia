"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { ChevronDown } from "lucide-react";
import {
  currencies,
  currencySymbols,
  localeCurrencies,
  type Currency,
  type Locale,
} from "@/i18n/config";

/**
 * `open` is owned by the Header, not by this component.
 *
 * A popover that only knows about itself cannot close when a sibling popover
 * opens, and that is exactly what went wrong: the language menu and this one
 * could both stand open at once, overlapping. The Header holds every popover's
 * state so opening one closes the rest, and its outside-click handler covers
 * this one too.
 */
export default function CurrencySelector({
  darkText = true,
  open,
  onOpenChange,
}: {
  darkText?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const locale = useLocale() as Locale;
  // Mirrors useCurrency: the locale's currency is the starting point, a stored
  // pick replaces it below. Without this the button would read "$ USD" while
  // the page showed lira.
  const [currency, setCurrency] = useState<Currency>(localeCurrencies[locale] ?? "USD");

  useEffect(() => {
    const stored = localStorage.getItem("TORVIAN_currency") as Currency | null;
    if (stored && (stored === "USD" || stored === "EUR" || stored === "TRY")) {
      setCurrency(stored);
    }
  }, []);

  const handleSelect = (c: Currency) => {
    setCurrency(c);
    onOpenChange(false);
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("TORVIAN_currency", c);
    }
    window.dispatchEvent(new CustomEvent("currency-change", { detail: c }));
  };

  return (
    <div className="relative">
      <button
        onClick={() => onOpenChange(!open)}
        aria-label={`Select currency, current: ${currency}`}
        aria-expanded={open}
        className={`flex items-center gap-1 hover:opacity-100 transition-colors text-xs px-2 py-1.5 rounded-lg ${darkText ? "text-gray-600 hover:text-gray-900" : "text-white/90 hover:text-white"}`}
      >
        <span className="whitespace-nowrap font-medium">{currencySymbols[currency]} {currency}</span>
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 rounded-xl shadow-2xl py-1 min-w-[120px] z-50" style={{ backgroundColor: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)", border: "1px solid rgba(0,0,0,0.08)" }}>
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => handleSelect(c)}
              className={`block w-full text-left px-3.5 py-2 text-xs transition-colors ${
                c === currency ? "text-blue-600 font-medium" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {currencySymbols[c]} {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
