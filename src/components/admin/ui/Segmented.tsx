import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./cx";

export interface SegmentOption<V extends string> {
  value: V;
  label: ReactNode;
  href?: string;
}

/** A small grey switch: Bugün / Yarın / Bu hafta, Liste / Takvim. */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegmentOption<V>[];
  value: V;
  onChange?: (value: V) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cx("inline-flex rounded-adm bg-adm-seg p-[3px]", className)}>
      {options.map((o) => {
        const on = o.value === value;
        const cls = cx(
          "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-adm-sm px-3 text-[12.5px] font-semibold transition-colors",
          on ? "bg-adm-surface text-adm-ink shadow-adm-sm" : "text-adm-muted hover:text-adm-ink"
        );
        return o.href ? (
          <Link key={o.value} href={o.href} scroll={false} aria-current={on ? "true" : undefined} className={cls}>
            {o.label}
          </Link>
        ) : (
          <button key={o.value} type="button" aria-pressed={on} onClick={() => onChange?.(o.value)} className={cls}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
