import type { ReactNode } from "react";
import { cx } from "./cx";

export function Card({
  title,
  subtitle,
  actions,
  children,
  flush,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** No inner padding, for lists and tables that run to the card's edges. */
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-adm-lg border border-adm-line bg-adm-surface shadow-adm-sm",
        className
      )}
    >
      {(title || actions) && <CardHead title={title} subtitle={subtitle} actions={actions} />}
      <div className={cx(!flush && "p-[18px]", bodyClassName)}>{children}</div>
    </section>
  );
}

export function CardHead({
  title,
  subtitle,
  actions,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-b border-adm-line-2 px-[18px] py-3.5">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        {title && <h2 className="text-sm font-semibold text-adm-ink">{title}</h2>}
        {subtitle && <p className="text-[12.5px] text-adm-muted">{subtitle}</p>}
      </div>
      {actions && <div className="ms-auto flex flex-wrap items-center gap-1.5">{actions}</div>}
    </header>
  );
}
