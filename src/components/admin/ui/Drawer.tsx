"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Loader2, X, type LucideIcon } from "lucide-react";
import { cx } from "./cx";
import { buttonClass, IconButton } from "./Button";

/**
 * The right-hand detail panel: 460px on a desktop, the whole screen on a phone.
 * The list underneath stays where it was. Escape and a click outside close it.
 */
export function Drawer({
  open,
  onClose,
  label,
  top,
  actions,
  title,
  meta,
  quick,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Read out when the panel opens. */
  label: string;
  /** Left of the header's first line: the code and the status. */
  top?: ReactNode;
  /** Right of it, before the close button: previous / next, open full page. */
  actions?: ReactNode;
  title?: ReactNode;
  meta?: ReactNode;
  /** QuickAction buttons, four to a row. */
  quick?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cx(
          "fixed inset-0 z-40 bg-[rgba(21,23,27,.18)] transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        inert={!open}
        className={cx(
          "fixed inset-y-0 end-0 z-[41] flex w-[460px] max-w-full flex-col bg-adm-surface text-adm-ink shadow-adm-lg outline-none transition-transform duration-[240ms] ease-[cubic-bezier(.2,.8,.2,1)] max-[760px]:w-full",
          open ? "translate-x-0" : "ltr:translate-x-[104%] rtl:-translate-x-[104%]"
        )}
      >
        <div className="border-b border-adm-line-2 px-5 pb-3.5 pt-4">
          <div className="flex items-center gap-2">
            {top}
            <div className="ms-auto flex items-center gap-0.5">
              {actions}
              <IconButton icon={X} label="Kapat" size="sm" onClick={onClose} />
            </div>
          </div>
          {title && <h2 className="mb-0.5 mt-2.5 text-xl font-bold tracking-[-0.01em]">{title}</h2>}
          {meta && <div className="text-[12.5px] text-adm-muted">{meta}</div>}
          {quick && <div className="mt-3.5 grid grid-cols-4 gap-2">{quick}</div>}
        </div>
        <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto px-5 pb-6 pt-4">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center gap-2 border-t border-adm-line-2 bg-adm-surface-2 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

/** One of the four tall buttons under a drawer's title: WhatsApp · Ara · Voucher · Telegram. */
export function QuickAction({
  icon: Icon,
  label,
  href,
  onClick,
  disabled,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const cls = buttonClass({ variant: "outline", size: "tile" });
  if (href && !disabled) {
    const external = /^(https?:|tel:|mailto:)/.test(href);
    return (
      <a href={href} className={cls} {...(external && href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        <Icon size={17} aria-hidden="true" />
        {label}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading} className={cls}>
      {loading ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Icon size={17} aria-hidden="true" />}
      {label}
    </button>
  );
}

export function DrawerSection({
  title,
  action,
  children,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[.06em] text-adm-muted">{title}</h3>
        {action && <div className="ms-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}
