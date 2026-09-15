"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { PERIODS, type DateRange, type PeriodKey } from "@/lib/period";
import { cx } from "./cx";

/**
 * The one filter row a report screen has: presets first, a custom range after.
 * It scopes everything below it — the figures, the charts and the downloads
 * all read the same period from the URL.
 */
export function PeriodBar({
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

  const dateInput =
    "adm-bare h-7 rounded-adm-sm bg-transparent px-2 text-[12.5px] text-adm-ink-2 outline-none focus:bg-adm-surface-2";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <nav aria-label="Dönem" className="flex flex-wrap rounded-adm bg-adm-seg p-[3px]">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`${basePath}?period=${p.key}`}
            scroll={false}
            aria-current={period === p.key ? "page" : undefined}
            className={cx(
              "inline-flex h-7 items-center whitespace-nowrap rounded-adm-sm px-3 text-[12.5px] font-semibold transition-colors",
              period === p.key ? "bg-adm-surface text-adm-ink shadow-adm-sm" : "text-adm-muted hover:text-adm-ink"
            )}
          >
            {p.label}
          </Link>
        ))}
      </nav>
      <div
        className={cx(
          "flex flex-wrap items-center gap-1 rounded-adm border bg-adm-surface p-[3px] shadow-adm-sm",
          period === null ? "border-adm-ink" : "border-adm-line"
        )}
      >
        <CalendarRange size={14} className="ms-2 text-adm-faint" aria-hidden="true" />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Başlangıç tarihi"
          className={dateInput}
        />
        <span className="text-xs text-adm-faint">–</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="Bitiş tarihi"
          className={dateInput}
        />
        <button
          type="button"
          onClick={apply}
          className="h-7 rounded-adm-sm bg-adm-line-2 px-3 text-[12.5px] font-semibold text-adm-ink-2 hover:bg-adm-seg hover:text-adm-ink"
        >
          Uygula
        </button>
      </div>
    </div>
  );
}
