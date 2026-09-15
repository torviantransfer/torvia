import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cx } from "./cx";

export interface StatItem {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  /** A figure that needs attention — drivers still to assign — is set in amber. */
  warn?: boolean;
}

// Written out in full so the class names survive Tailwind's scan. The 1px gap
// over a line-coloured ground draws the dividers, whichever way the cells wrap;
// the last cell stretches so a short final row leaves no grey hole.
const LAYOUT: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3 max-[760px]:grid-cols-2 max-[760px]:[&>*:last-child]:col-span-2",
  4: "grid-cols-4 max-[1180px]:grid-cols-2",
  5: "grid-cols-5 max-[1180px]:grid-cols-3 max-[1180px]:[&>*:last-child]:col-span-2 max-[760px]:grid-cols-2",
  6: "grid-cols-6 max-[1180px]:grid-cols-3 max-[760px]:grid-cols-2",
};

/** One card split into figures: label, a big number, a line of explanation. */
export function StatStrip({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <div
      className={cx(
        "mb-5 grid gap-px overflow-hidden rounded-adm-lg border border-adm-line bg-adm-line-2 shadow-adm-sm",
        LAYOUT[Math.min(Math.max(items.length, 1), 6)],
        className
      )}
    >
      {items.map((s, i) => {
        const Icon = s.icon;
        return (
          <div key={i} className="min-w-0 bg-adm-surface px-[18px] py-4">
            <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-adm-muted">
              {Icon && <Icon size={14} aria-hidden="true" className="text-adm-faint" />}
              {s.label}
            </p>
            <p
              className={cx(
                "mt-1.5 text-[26px] font-bold leading-[1.1] tracking-[-0.02em]",
                s.warn ? "text-adm-amber" : "text-adm-ink"
              )}
            >
              {s.value}
            </p>
            {s.hint && <div className="mt-[3px] text-xs text-adm-muted">{s.hint}</div>}
          </div>
        );
      })}
    </div>
  );
}

/** A labelled figure in a card of its own. The value keeps proportional digits: it stands alone. */
export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  negative,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  icon?: LucideIcon;
  negative?: boolean;
}) {
  return (
    <div className="rounded-adm-lg border border-adm-line bg-adm-surface p-4 shadow-adm-sm">
      <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-adm-muted">
        {Icon && <Icon size={14} aria-hidden="true" className="text-adm-faint" />}
        {label}
      </p>
      <p
        className={cx(
          "mt-2 text-2xl font-bold tracking-[-0.02em]",
          negative ? "text-adm-rose" : "text-adm-ink"
        )}
      >
        {value}
      </p>
      {sub && <div className="mt-1 text-xs text-adm-muted">{sub}</div>}
    </div>
  );
}

/**
 * A change against the previous period, signed and worded. Colour follows
 * whether the move is good — revenue up is good, cost up is not — and never
 * carries the meaning alone: the arrow and the figure say it too.
 */
export function Delta({
  value,
  goodWhenUp = true,
  onDark = false,
  suffix = "önceki döneme göre",
}: {
  value: number | null;
  goodWhenUp?: boolean;
  onDark?: boolean;
  suffix?: string;
}) {
  if (value === null) {
    return <span className={onDark ? "text-white/60" : "text-adm-faint"}>Karşılaştırma yok</span>;
  }
  const Icon = value === 0 ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  const good = value === 0 ? null : value > 0 === goodWhenUp;
  const colour =
    good === null
      ? onDark
        ? "text-white/80"
        : "text-adm-muted"
      : good
        ? onDark
          ? "text-emerald-300"
          : "text-adm-green"
        : onDark
          ? "text-rose-200"
          : "text-adm-rose";
  return (
    <span className={cx("inline-flex items-center gap-1 font-semibold", colour)}>
      <Icon size={13} aria-hidden="true" />%{Math.abs(value).toLocaleString("tr-TR")}
      <span className={cx("font-normal", onDark ? "text-white/60" : "text-adm-faint")}>{suffix}</span>
    </span>
  );
}
