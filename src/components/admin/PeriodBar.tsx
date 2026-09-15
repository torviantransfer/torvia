"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { PERIODS, type DateRange, type PeriodKey } from "@/lib/period";

/**
 * The one filter row a report screen has: presets first, a custom range after.
 * It scopes everything below it — the figures, the charts and the downloads
 * all read the same period from the URL.
 */
export default function PeriodBar({
  basePath,
  period,
  range,
}: {
  basePath: string;
  period: PeriodKey | null;
  range: DateRange;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(range.from ?? "");
  const [to, setTo] = useState(range.to ?? "");

  const apply = () => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    router.push(q.toString() ? `${basePath}?${q}` : `${basePath}?period=all`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <nav aria-label="Dönem" className="flex flex-wrap gap-1 rounded-xl bg-white p-1 ring-1 ring-slate-200">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`${basePath}?period=${p.key}`}
            scroll={false}
            aria-current={period === p.key ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              period === p.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      <div
        className={`flex flex-wrap items-center gap-1 rounded-xl bg-white p-1 ring-1 ${
          period === null ? "ring-slate-900" : "ring-slate-200"
        }`}
      >
        <CalendarRange size={14} className="ms-2 text-slate-400" aria-hidden="true" />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Başlangıç tarihi"
          className="rounded-lg px-2 py-1 text-xs text-slate-700 outline-none"
        />
        <span className="text-xs text-slate-300">–</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="Bitiş tarihi"
          className="rounded-lg px-2 py-1 text-xs text-slate-700 outline-none"
        />
        <button
          type="button"
          onClick={apply}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          Uygula
        </button>
      </div>
    </div>
  );
}
