"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { ChevronDown, Check } from "lucide-react";
import { menuSurface, menuSurfaceStyle, menuItem } from "@/components/navMenuStyles";
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
  const [currency, setCurrency] = useState<Currency>(localeCurrencies[locale] ?? "EUR");

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
        className={`flex h-8 items-center gap-1 rounded-full px-2.5 text-[13px] transition ${darkText ? "text-[#1d1d1f] hover:bg-black/[0.05]" : "text-white/90 hover:bg-white/15 hover:text-white"}`}
      >
        <span className="whitespace-nowrap font-medium">{currencySymbols[currency]} {currency}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute end-0 top-full z-50 mt-2 min-w-[150px] rounded-[14px] p-1 ${menuSurface}`} style={menuSurfaceStyle}>
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => handleSelect(c)}
              className={menuItem}
            >
              <span className="flex-1 text-start">{currencySymbols[c]} {c}</span>
              {c === currency && <Check size={15} className="shrink-0 text-[#007AFF]" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
