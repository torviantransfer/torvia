"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

/**
 * The overflow menu, built so that no ancestor can hide it.
 *
 * The previous one was absolutely positioned inside the header card, and the
 * card clipped its own contents — so the menu opened *underneath* the card's
 * bottom edge and was cut in half. Any ancestor with overflow, a transform or
 * a stacking context could do the same again, which is why the panel is fixed
 * on a phone rather than positioned against the button: fixed elements are
 * laid out against the viewport and cannot be clipped by a parent.
 *
 * On a phone it is a sheet at the bottom of the screen, where a thumb reaches
 * and where a long list has room. From `sm:` up it becomes an ordinary
 * dropdown anchored to the button — the card no longer clips, so that is safe.
 */
export default function ActionMenu({
  label = "Diğer işlemler",
  children,
}: {
  label?: string;
  /** Receives `close`, so each item can dismiss the menu when it acts. */
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
          open
            ? "border-slate-300 bg-slate-100 text-slate-700"
            : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700"
        }`}
      >
        <MoreHorizontal size={18} />
      </button>

      {open && (
        <>
          {/* Dim on a phone so the sheet reads as a layer; invisible on desktop,
              where it only exists to catch the click that dismisses. */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 sm:bg-transparent"
            onClick={close}
          />

          <div
            role="menu"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-slate-200 bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:end-0 sm:top-full sm:mt-1.5 sm:w-60 sm:rounded-xl sm:border sm:pb-1.5 sm:shadow-lg"
          >
            {/* The grab handle is the affordance that says "this slides"; it has
                no meaning on a dropdown, so it stops at the breakpoint. */}
            <div className="mx-auto mb-1.5 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
            {children(close)}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Menu rows are deliberately taller on a phone than a desktop pointer needs —
 * a thumb is about 9mm across, and these sit next to a destructive action.
 */
export const MENU_ITEM =
  "flex w-full items-center gap-3 px-4 py-3 text-start text-sm font-medium text-slate-700 hover:bg-slate-50 sm:gap-2.5 sm:px-3.5 sm:py-2 sm:text-xs";

export const MENU_ITEM_DANGER =
  "flex w-full items-center gap-3 px-4 py-3 text-start text-sm font-medium text-rose-600 hover:bg-rose-50 sm:gap-2.5 sm:px-3.5 sm:py-2 sm:text-xs";

export function MenuSeparator() {
  return <div className="my-1 h-px bg-slate-100" />;
}
