import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "./cx";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact,
}: {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Inside a card rather than filling a page. */
  compact?: boolean;
}) {
  return (
    <div className={cx("grid justify-items-center gap-2.5 px-5 text-center", compact ? "py-12" : "py-[90px]")}>
      <span className="grid size-14 place-items-center rounded-2xl border border-adm-line bg-adm-surface shadow-adm-sm">
        <Icon size={24} aria-hidden="true" className="text-adm-muted" />
      </span>
      <h2 className="mt-1.5 text-lg font-semibold text-adm-ink">{title}</h2>
      {description && <p className="max-w-[460px] text-adm-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
