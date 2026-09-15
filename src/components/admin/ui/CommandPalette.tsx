"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Receipt, Search, Ticket, Wallet, type LucideIcon } from "lucide-react";
import { formatBookingDateTime } from "@/lib/datetime";
import { ADMIN_NAV, navHref } from "../nav";
import { ReservationStatusChip } from "./Chip";
import { cx } from "./cx";

/** One reservation as /api/admin/search returns it. */
export interface SearchHit {
  code: string;
  name: string;
  pickup: string | null;
  status: string;
  flight: string | null;
  hotel: string | null;
}

interface Item {
  id: string;
  icon: LucideIcon;
  /** What the query is matched against. */
  text: string;
  label?: ReactNode;
  hint?: ReactNode;
  run: () => void;
}

/** Case- and accent-blind, so "sofor" finds "Şoför". */
const fold = (s: string) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const SEARCH_DELAY_MS = 220;

/** Ctrl K / ⌘ K from any admin screen. docs/admin-tasarim.md, bölüm 3.3. */
export default function CommandPalette({
  open,
  onClose,
  base,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  base: string;
  locale: string;
}) {
  // Mounted afresh on every open, so the query and results never linger.
  if (!open) return null;
  return <Palette onClose={onClose} base={base} locale={locale} />;
}

function Palette({ onClose, base, locale }: { onClose: () => void; base: string; locale: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searchedFor, setSearchedFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const term = query.trim();
  const searching = term.length >= 2;

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const data = res.ok ? ((await res.json()) as { results?: SearchHit[] }) : {};
        setHits(data.results ?? []);
        setSearchedFor(term);
      } catch {
        // Superseded by a newer keystroke, or offline; the next search tries again.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, SEARCH_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const folded = fold(term);
  const matches = (item: Item) => !folded || fold(item.text).includes(folded);

  const quick: Item[] = [
    {
      id: "new-reservation",
      icon: Plus,
      text: "Yeni rezervasyon",
      hint: "Site rezervasyon sayfası",
      run: () => {
        onClose();
        window.open(`/${locale}/booking`, "_blank", "noopener");
      },
    },
    { id: "driver-payment", icon: Wallet, text: "Şoföre ödeme yap", run: () => go(`${base}/driver-payments?pay=1`) },
    { id: "expense", icon: Receipt, text: "Kasaya gider ekle", run: () => go(`${base}/finance?add=expense`) },
  ];

  const reservations: Item[] = searching
    ? hits.map((h) => ({
        id: `r-${h.code}`,
        icon: Ticket,
        text: h.code,
        label: (
          <span className="block min-w-0">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-medium">{h.name || "İsimsiz"}</span>
              <span className="shrink-0 whitespace-nowrap font-mono text-xs text-adm-muted">{h.code}</span>
            </span>
            <span className="block truncate text-xs text-adm-muted">
              {[h.pickup ? formatBookingDateTime(h.pickup) : null, h.flight, h.hotel].filter(Boolean).join(" · ")}
            </span>
          </span>
        ),
        hint: <ReservationStatusChip status={h.status} />,
        run: () => go(`${base}/reservations/${encodeURIComponent(h.code)}`),
      }))
    : [];

  const pages: Item[] = ADMIN_NAV.flatMap((group) =>
    group.items.map((item) => ({
      id: `p-${item.path || "home"}`,
      icon: item.icon,
      text: item.label,
      hint: group.title,
      run: () => go(navHref(base, item)),
    }))
  );

  const sections = [
    { title: "Hızlı işlemler", items: quick.filter(matches) },
    { title: "Rezervasyonlar", items: reservations },
    { title: "Sayfalar", items: pages.filter(matches) },
  ].filter((s) => s.items.length > 0);

  const flat = sections.flatMap((s) => s.items);
  const active = flat.length ? Math.min(index, flat.length - 1) : -1;

  useEffect(() => {
    list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === "ArrowDown" && flat.length) {
      e.preventDefault();
      setIndex((active + 1) % flat.length);
    } else if (e.key === "ArrowUp" && flat.length) {
      e.preventDefault();
      setIndex((active - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      flat[active].run();
    }
  };

  const nothing = flat.length === 0 && (!searching || (searchedFor === term && !loading));

  return (
    <div
      className="fixed inset-0 z-[60] grid items-start justify-items-center bg-[rgba(21,23,27,.28)] px-3 pt-[12vh] motion-safe:animate-[adm-fade_150ms_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ara veya komut"
        onKeyDown={onKeyDown}
        className="w-full max-w-[600px] overflow-hidden rounded-2xl bg-adm-surface text-adm-ink shadow-adm-lg motion-safe:animate-[adm-pop_150ms_ease-out]"
      >
        <div className="flex items-center gap-2.5 border-b border-adm-line-2 px-4 py-3.5">
          {loading && searching ? (
            <Loader2 size={16} aria-hidden="true" className="shrink-0 animate-spin text-adm-muted" />
          ) : (
            <Search size={16} aria-hidden="true" className="shrink-0 text-adm-muted" />
          )}
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder="Kod, müşteri, telefon, uçuş, otel ya da sayfa…"
            role="combobox"
            aria-expanded="true"
            aria-controls="adm-palette-list"
            aria-activedescendant={active >= 0 ? `adm-palette-${flat[active].id}` : undefined}
            className="adm-bare min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-adm-faint"
          />
          <kbd className="rounded-md border border-adm-line bg-adm-surface-2 px-1.5 font-sans text-[11px] font-semibold text-adm-faint">
            Esc
          </kbd>
        </div>

        <div ref={list} id="adm-palette-list" role="listbox" className="max-h-[360px] overflow-y-auto p-2">
          {sections.map((section) => (
            <div key={section.title} role="group" aria-label={section.title}>
              <div className="px-2.5 pb-1 pt-2 text-[11.5px] font-semibold uppercase tracking-[.05em] text-adm-faint">
                {section.title}
              </div>
              {section.items.map((item) => {
                const i = flat.indexOf(item);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`adm-palette-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    data-active={i === active}
                    onMouseMove={() => i !== active && setIndex(i)}
                    onClick={item.run}
                    className={cx(
                      "flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-[9px] text-start text-[13.5px]",
                      i === active && "bg-adm-line-2"
                    )}
                  >
                    <Icon size={16} aria-hidden="true" className="shrink-0 text-adm-muted" />
                    <span className="min-w-0 flex-1">{item.label ?? item.text}</span>
                    {item.hint && (
                      <span className="ms-auto shrink-0 text-xs text-adm-faint max-[760px]:hidden">{item.hint}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          {nothing && (
            <p className="px-3 py-8 text-center text-[13px] text-adm-muted">
              “{term}” için bir şey bulunamadı
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-adm-line-2 px-4 py-2 text-[11.5px] text-adm-faint max-[760px]:hidden">
          <span>↑ ↓ gezin</span>
          <span>Enter aç</span>
          <span>Esc kapat</span>
        </div>
      </div>
    </div>
  );
}
