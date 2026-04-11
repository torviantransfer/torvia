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
        className="flex items-center gap-1 text-white/90 hover:text-white transition-colors text-xs px-2 py-1.5 rounded-lg"
      >
        <span className="whitespace-nowrap font-medium">{currencySymbols[currency]} {currency}</span>
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 rounded-xl shadow-2xl py-1 min-w-[120px] z-50" style={{ backgroundColor: "rgba(29,29,31,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {currencies.map((c) => (
            <button
              key={c}
              onClick={() => handleSelect(c)}
              className={`block w-full text-left px-3.5 py-2 text-xs transition-colors ${
                c === currency ? "text-orange-400 font-medium" : "text-gray-400 hover:text-white"
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
