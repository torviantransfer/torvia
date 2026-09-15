import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./cx";

export interface TabItem<K extends string = string> {
  key: K;
  label: ReactNode;
  count?: number;
  /** `warn` for work waiting (amber), `bad` for a problem (rose). */
  tone?: "neutral" | "warn" | "bad";
}

const COUNT_TONE = {
  neutral: "bg-adm-line-2 text-adm-muted",
  warn: "bg-adm-amber-soft text-adm-amber",
  bad: "bg-adm-rose-soft text-adm-rose",
};

/**
 * Underlined tabs. Give `hrefFor` to write the tab into the URL (`?tab=`) so a
 * screen can be linked to and survives a refresh; give `onChange` for a tab
 * that only lives on the page.
 */
export function Tabs<K extends string>({
  items,
  value,
  onChange,
  hrefFor,
  label,
  className,
}: {
  items: TabItem<K>[];
  value: K;
  onChange?: (key: K) => void;
  hrefFor?: (key: K) => string;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx(
        "mb-3.5 flex gap-0.5 overflow-x-auto shadow-[inset_0_-1px_0_#e7e6e1] [scrollbar-width:none]",
        className
      )}
    >
      {items.map((t) => {
        const on = t.key === value;
        const cls = cx(
          "relative inline-flex h-10 shrink-0 items-center gap-[7px] whitespace-nowrap px-3 text-[13.5px] font-semibold transition-colors",
          on
            ? "text-adm-ink after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-adm-ink"
            : "text-adm-muted hover:text-adm-ink"
        );
        const inner = (
          <>
            {t.label}
            {t.count !== undefined && (
              <span className={cx("rounded-[9px] px-1.5 text-[11.5px] tabular-nums", COUNT_TONE[t.tone ?? "neutral"])}>
                {t.count}
              </span>
            )}
          </>
        );
        return hrefFor ? (
          <Link key={t.key} href={hrefFor(t.key)} scroll={false} role="tab" aria-selected={on} className={cls}>
            {inner}
          </Link>
        ) : (
          <button key={t.key} type="button" role="tab" aria-selected={on} onClick={() => onChange?.(t.key)} className={cls}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
