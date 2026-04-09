"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { currencies, currencySymbols, type Currency } from "@/i18n/config";

export default function CurrencySelector() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("TORVIAN_currency") as Currency | null;
    if (stored && (stored === "USD" || stored === "EUR" || stored === "TRY")) {
      setCurrency(stored);
    }
  }, []);

  const handleSelect = (c: Currency) => {
    setCurrency(c);
    setOpen(false);
    // Store in localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("TORVIAN_currency", c);
    }
    window.dispatchEvent(new CustomEvent("currency-change", { detail: c }));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Select currency, current: ${currency}`}
        aria-expanded={open}
        className="flex items-center gap-1 hover:text-orange-300 transition-colors"
      >
        <span className="whitespace-nowrap">{currencySymbols[currency]} {currency}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 rounded-lg shadow-lg border py-1 min-w-[100px] z-50">
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => handleSelect(c)}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                c === currency ? "font-semibold text-orange-500" : ""
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
