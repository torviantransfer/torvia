import type { ButtonHTMLAttributes, ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";
import { cx } from "./cx";

/** The dark bar that rises from the bottom once rows are ticked. */
export function SelectionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: ReactNode;
}) {
  const show = count > 0;
  return (
    <div
      role="toolbar"
      aria-label="Seçili satırlar"
      inert={!show}
      className={cx(
        "fixed bottom-[22px] left-1/2 z-[25] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-adm-lg bg-adm-ink py-2 pe-2 ps-4 text-white shadow-adm-lg transition-[opacity,translate] duration-200",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"
      )}
    >
      <span className="whitespace-nowrap text-[13px]">
        <b className="font-semibold tabular-nums">{count}</b> seçili
      </span>
      <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-white/20" />
      {children}
      <button
        type="button"
        onClick={onClear}
        aria-label="Seçimi temizle"
        className="grid size-[34px] shrink-0 place-items-center rounded-[9px] hover:bg-white/12"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function SelectionAction({
  icon: Icon,
  children,
  type = "button",
  className,
  ...rest
}: { icon?: LucideIcon; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex h-[34px] shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[9px] px-[13px] text-[13px] font-semibold text-white hover:bg-white/12 disabled:opacity-50",
        className
      )}
      {...rest}
    >
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </button>
  );
}
