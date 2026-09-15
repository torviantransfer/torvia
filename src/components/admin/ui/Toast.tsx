"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cx } from "./cx";

type ToastTone = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

/** `const toast = useToast(); toast("Kaydedildi")` — or `toast("Olmadı", "error")`. */
export function useToast() {
  return useContext(ToastContext);
}

const VISIBLE_MS = 3200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const push = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++seq.current;
    setItems((list) => [...list.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), VISIBLE_MS);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => {
          const Icon = t.tone === "error" ? AlertCircle : CheckCircle;
          return (
            <div
              key={t.id}
              role="status"
              className={cx(
                "pointer-events-auto flex max-w-[480px] items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white shadow-adm-lg motion-safe:animate-[adm-rise_180ms_ease-out]",
                t.tone === "error" ? "bg-adm-rose" : "bg-adm-ink"
              )}
            >
              <Icon size={16} aria-hidden="true" className="shrink-0" />
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
