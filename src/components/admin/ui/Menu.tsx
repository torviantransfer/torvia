"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "./cx";

/**
 * A panel anchored to its trigger. Closes on a click outside and on Escape; on
 * a phone it becomes a sheet along the bottom edge, within reach of a thumb.
 */
export function Popover({
  trigger,
  children,
  align = "start",
  side = "bottom",
  width = "w-60",
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  /** `top` for a trigger near the bottom of its container, such as a drawer footer. */
  side?: "bottom" | "top";
  width?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={root} className={cx("relative inline-flex", className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={cx(
            "absolute z-30 rounded-adm border border-adm-line bg-adm-surface p-1.5 text-adm-ink shadow-adm-md motion-safe:animate-[adm-pop_120ms_ease-out]",
            side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
            align === "end" ? "end-0" : "start-0",
            width,
            "max-[760px]:fixed max-[760px]:inset-x-3 max-[760px]:bottom-3 max-[760px]:top-auto max-[760px]:mb-0 max-[760px]:mt-0 max-[760px]:w-auto max-[760px]:shadow-adm-lg"
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect?: () => void;
  href?: string;
  newTab?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

const rowClass = (danger?: boolean) =>
  cx(
    "flex h-[34px] w-full items-center gap-2 rounded-adm-sm px-2.5 text-start text-[13px] font-medium disabled:pointer-events-none disabled:opacity-50",
    danger ? "text-adm-rose hover:bg-adm-rose-soft" : "text-adm-ink-2 hover:bg-adm-line-2 hover:text-adm-ink"
  );

/** A list of actions behind one button — "Dışa aktar", "Diğer işlemler". */
export function Menu({
  items,
  trigger,
  align = "end",
  side,
  width = "w-56",
}: {
  items: (MenuItem | "separator")[];
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  align?: "start" | "end";
  side?: "bottom" | "top";
  width?: string;
}) {
  return (
    <Popover trigger={trigger} align={align} side={side} width={width}>
      {(close) => (
        <div role="menu">
          {items.map((item, i) => {
            if (item === "separator") return <div key={`sep-${i}`} className="my-1 h-px bg-adm-line-2" />;
            const Icon = item.icon;
            const inner = (
              <>
                {Icon && <Icon size={16} aria-hidden="true" className={item.danger ? undefined : "text-adm-muted"} />}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </>
            );
            return item.href && !item.disabled ? (
              <a
                key={item.label}
                role="menuitem"
                href={item.href}
                target={item.newTab ? "_blank" : undefined}
                rel={item.newTab ? "noopener noreferrer" : undefined}
                onClick={close}
                className={rowClass(item.danger)}
              >
                {inner}
              </a>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  close();
                  item.onSelect?.();
                }}
                className={rowClass(item.danger)}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}
