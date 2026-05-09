"use client";

import { useTranslations } from "next-intl";
import { Check, X, AlertTriangle } from "lucide-react";

interface CompareTableProps {
  /** Region display name used in headings. */
  regionName: string;
  /** Torvian one-way price (USD) — already locale-formatted upstream if needed. */
  torvianPrice: number;
}

type Cell = { value: string; tone: "good" | "bad" | "warn" | "neutral" };

/**
 * Conversion-oriented comparison table: Torvian VIP vs Havaş shuttle vs
 * airport taxi vs Uber. Renders a 4-column grid on desktop, a stacked
 * card list on mobile. Numbers are illustrative ranges, not contractual
 * prices. Translation keys live under the `compare` namespace.
 */
export default function RegionCompareTable({ regionName, torvianPrice }: CompareTableProps) {
  const t = useTranslations("compare");

  const rows: { label: string; cells: [Cell, Cell, Cell, Cell] }[] = [
    {
      label: t("rowPrice"),
      cells: [
        { value: `$${torvianPrice} ${t("fixed")}`, tone: "good" },
        { value: t("havasShared"), tone: "warn" },
        { value: t("taxiMeter"), tone: "bad" },
        { value: t("uberSurge"), tone: "bad" },
      ],
    },
    {
      label: t("rowMeetGreet"),
      cells: [
        { value: t("yes"), tone: "good" },
        { value: t("no"), tone: "bad" },
        { value: t("no"), tone: "bad" },
        { value: t("no"), tone: "bad" },
      ],
    },
    {
      label: t("rowFlightTracking"),
      cells: [
        { value: t("yes"), tone: "good" },
        { value: t("no"), tone: "bad" },
        { value: t("no"), tone: "bad" },
        { value: t("no"), tone: "bad" },
      ],
    },
    {
      label: t("rowDoorToDoor"),
      cells: [
        { value: t("yes"), tone: "good" },
        { value: t("havasStops"), tone: "bad" },
        { value: t("yes"), tone: "good" },
        { value: t("yes"), tone: "good" },
      ],
    },
    {
      label: t("rowVehicle"),
      cells: [
        { value: t("torvianVehicle"), tone: "good" },
        { value: t("havasVehicle"), tone: "neutral" },
        { value: t("taxiVehicle"), tone: "neutral" },
        { value: t("uberVehicle"), tone: "neutral" },
      ],
    },
    {
      label: t("rowWaitTime"),
      cells: [
        { value: t("torvianWait"), tone: "good" },
        { value: t("havasWait"), tone: "bad" },
        { value: t("taxiWait"), tone: "warn" },
        { value: t("uberWait"), tone: "warn" },
      ],
    },
    {
      label: t("rowCancellation"),
      cells: [
        { value: t("torvianCancel"), tone: "good" },
        { value: t("naBlank"), tone: "neutral" },
        { value: t("naBlank"), tone: "neutral" },
        { value: t("uberCancel"), tone: "warn" },
      ],
    },
  ];

  const headers = [
    { name: t("torvian"), highlight: true },
    { name: t("havas"), highlight: false },
    { name: t("taxi"), highlight: false },
    { name: t("uber"), highlight: false },
  ];

  function ToneIcon({ tone }: { tone: Cell["tone"] }) {
    if (tone === "good") return <Check size={14} className="text-emerald-600" strokeWidth={2.5} />;
    if (tone === "bad") return <X size={14} className="text-rose-500" strokeWidth={2.5} />;
    if (tone === "warn") return <AlertTriangle size={14} className="text-amber-500" strokeWidth={2.5} />;
    return null;
  }

  return (
    <section
      className="py-16"
      style={{ borderTop: "1px solid rgba(0,0,0,0.03)" }}
      aria-labelledby="compare-heading"
    >
      <div className="max-w-5xl mx-auto px-4">
        <h2
          id="compare-heading"
          className="text-2xl font-bold text-gray-900 mb-2 text-center tracking-tight"
        >
          {t("heading")}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8 max-w-2xl mx-auto">
          {t("subheading", { name: regionName })}
        </p>

        {/* Desktop table */}
        <div className="hidden md:block rounded-2xl overflow-hidden border border-black/10 bg-white">
          <div className="grid grid-cols-5 bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wide">
            <div className="px-4 py-3" />
            {headers.map((h) => (
              <div
                key={h.name}
                className={`px-4 py-3 text-center ${h.highlight ? "bg-blue-600 text-white" : ""}`}
              >
                {h.name}
              </div>
            ))}
          </div>
          {rows.map((row, idx) => (
            <div
              key={row.label}
              className={`grid grid-cols-5 text-sm ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}
            >
              <div className="px-4 py-3 font-medium text-gray-900">{row.label}</div>
              {row.cells.map((cell, j) => (
                <div
                  key={j}
                  className={`px-4 py-3 flex items-center justify-center gap-1.5 text-center text-gray-700 ${j === 0 ? "bg-blue-50/60 font-semibold text-blue-900" : ""}`}
                >
                  <ToneIcon tone={cell.tone} />
                  <span>{cell.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Mobile stacked cards */}
        <div className="md:hidden space-y-3">
          {headers.map((h, i) => (
            <div
              key={h.name}
              className={`rounded-2xl border p-4 ${h.highlight ? "border-blue-300 bg-blue-50/50" : "border-black/10 bg-white"}`}
            >
              <div className={`text-sm font-bold mb-3 ${h.highlight ? "text-blue-700" : "text-gray-900"}`}>
                {h.name}
                {h.highlight && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    {t("recommended")}
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {rows.map((row) => (
                  <li key={row.label} className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="flex items-center gap-1 text-right text-gray-800 font-medium">
                      <ToneIcon tone={row.cells[i].tone} />
                      {row.cells[i].value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
