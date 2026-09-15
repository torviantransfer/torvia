"use client";

import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button, IconButton } from "./Button";
import { cx } from "./cx";

/**
 * A dialog for short admin tasks — recording a payment, adding an expense —
 * so the page the admin is reading stays where it was underneath.
 *
 * Centred on a desktop; on a phone it rises from the bottom edge as a sheet,
 * within reach of the thumb. Escape and a click outside both close it.
 */
export function Dialog({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "sm:max-w-lg",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Buttons pinned under the scrolling body. */
  footer?: ReactNode;
  /** Tailwind max-width class. */
  width?: string;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      // A drawer underneath leaves Escape to the dialog on top.
      data-adm-dialog=""
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(21,23,27,.28)] motion-safe:animate-[adm-fade_150ms_ease-out] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-adm-surface text-adm-ink shadow-adm-lg motion-safe:animate-[adm-rise_180ms_ease-out] sm:rounded-adm-lg",
          width
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-adm-line-2 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-bold">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-[12.5px] text-adm-muted">{subtitle}</p>}
          </div>
          <IconButton icon={X} label="Kapat" size="sm" onClick={onClose} className="-me-1.5 -mt-0.5" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-adm-line-2 bg-adm-surface-2 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** "Are you sure?" for anything that removes, cancels or sends in bulk. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  danger,
  busy,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={busy ? () => {} : onClose}
      width="sm:max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[13.5px] text-adm-ink-2">{message}</div>
    </Dialog>
  );
}
