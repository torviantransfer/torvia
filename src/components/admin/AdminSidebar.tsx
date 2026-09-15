"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { LogOut, PanelLeft, Search, X } from "lucide-react";
import { ADMIN_NAV, navHref, type NavItem, type ShellCounts } from "./nav";
import { Avatar } from "./ui/Avatar";
import { cx } from "./ui/cx";

const noSubscription = () => () => {};
const onApple = () => /Mac|iPhone|iPad/.test(navigator.platform);

function badgeFor(item: NavItem, counts: ShellCounts | null) {
  if (!counts || !item.counter) return null;
  switch (item.counter) {
    case "reservations": {
      const n = counts.needsDriver + counts.cancelRequests;
      return n > 0
        ? { n, alert: true, title: `${counts.needsDriver} şoför bekleyen · ${counts.cancelRequests} iptal talebi` }
        : null;
    }
    case "reviews":
      return counts.pendingReviews > 0
        ? { n: counts.pendingReviews, alert: false, title: "Onay bekleyen değerlendirme" }
        : null;
    case "live":
      return counts.liveNow > 0 ? { n: counts.liveNow, alert: false, title: "Şu an sitede" } : null;
    default:
      return null;
  }
}

export default function AdminSidebar({
  base,
  locale,
  current,
  counts,
  userEmail,
  userName,
  collapsed,
  menuOpen,
  onCloseMenu,
  onToggleCollapsed,
  onOpenPalette,
}: {
  base: string;
  locale: string;
  current: NavItem | null;
  counts: ShellCounts | null;
  userEmail: string;
  userName: string | null;
  collapsed: boolean;
  menuOpen: boolean;
  onCloseMenu: () => void;
  onToggleCollapsed: () => void;
  onOpenPalette: () => void;
}) {
  const router = useRouter();
  const apple = useSyncExternalStore(noSubscription, onApple, () => false);
  const [meOpen, setMeOpen] = useState(false);
  const me = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!meOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!me.current?.contains(e.target as Node)) setMeOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMeOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [meOpen]);

  const signOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push(`/${locale}`);
  };

  // Collapsing is a desktop state; the phone drawer always shows the labels.
  const c = collapsed;
  const hideCollapsed = c ? "min-[901px]:hidden" : "";

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onCloseMenu}
        className={cx(
          "fixed inset-0 z-30 bg-[rgba(21,23,27,.28)] transition-opacity duration-200 min-[901px]:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        aria-label="Ana menü"
        className={cx(
          "fixed inset-y-0 start-0 z-40 flex w-64 flex-col border-e border-adm-line bg-adm-side transition-[width,translate] duration-200 ease-out",
          "max-[900px]:shadow-adm-lg",
          c && "min-[901px]:w-[68px]",
          !menuOpen && "max-[900px]:ltr:-translate-x-full max-[900px]:rtl:translate-x-full"
        )}
      >
        <div className={cx("relative flex h-[60px] shrink-0 items-center gap-2.5 px-4", c && "min-[901px]:justify-center min-[901px]:px-0")}>
          <Link href={base} onClick={onCloseMenu} className="flex items-center gap-2.5 rounded-[9px]">
            <span className="grid size-[30px] place-items-center rounded-[9px] bg-adm-ink text-[13px] font-bold text-white">T</span>
            <span className={cx("font-bold tracking-[.02em]", hideCollapsed)}>TORVIAN</span>
            <span
              className={cx(
                "rounded-md bg-adm-brand-soft px-1.5 py-px text-[10.5px] font-semibold text-adm-brand-ink",
                hideCollapsed
              )}
            >
              Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={c ? "Menüyü genişlet" : "Menüyü daralt"}
            title={c ? "Menüyü genişlet" : "Menüyü daralt"}
            className={cx(
              "grid size-7 place-items-center rounded-adm-sm text-adm-muted hover:bg-adm-line-2 hover:text-adm-ink max-[900px]:hidden",
              c
                ? "absolute -end-3.5 top-4 border border-adm-line bg-adm-surface shadow-adm-sm"
                : "ms-auto"
            )}
          >
            <PanelLeft size={16} aria-hidden="true" className="rtl:-scale-x-100" />
          </button>
          <button
            type="button"
            onClick={onCloseMenu}
            aria-label="Menüyü kapat"
            className="ms-auto grid size-8 place-items-center rounded-adm-sm text-adm-muted hover:bg-adm-line-2 hover:text-adm-ink min-[901px]:hidden"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenPalette}
          title={c ? "Ara veya komut" : undefined}
          className={cx(
            "mx-3 mb-2.5 mt-1 flex h-9 shrink-0 items-center gap-2 rounded-adm border border-adm-line bg-adm-surface px-2.5 text-[13px] text-adm-muted shadow-adm-sm transition-colors hover:border-[#d6d5cf] hover:text-adm-ink-2",
            c && "min-[901px]:justify-center min-[901px]:px-0"
          )}
        >
          <Search size={16} aria-hidden="true" />
          <span className={hideCollapsed}>Ara veya komut…</span>
          <kbd
            className={cx(
              "ms-auto rounded-md border border-adm-line bg-adm-surface-2 px-1.5 font-sans text-[11px] font-semibold text-adm-faint max-[900px]:hidden",
              hideCollapsed
            )}
          >
            {apple ? "⌘ K" : "Ctrl K"}
          </kbd>
        </button>

        <nav className="flex-1 overflow-y-auto px-2.5 pb-3 pt-1">
          {ADMIN_NAV.map((group, gi) => (
            <div key={group.title} className="mt-3.5 first:mt-1">
              <div className={cx("px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[.06em] text-adm-faint", hideCollapsed)}>
                {group.title}
              </div>
              {c && gi > 0 && <div aria-hidden="true" className="mx-3 mb-2 hidden h-px bg-adm-line min-[901px]:block" />}
              <ul className="grid gap-px">
                {group.items.map((item) => {
                  const active = item === current;
                  const badge = badgeFor(item, counts);
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link
                        href={navHref(base, item)}
                        onClick={onCloseMenu}
                        aria-current={active ? "page" : undefined}
                        title={c ? item.label : undefined}
                        className={cx(
                          "relative flex h-[34px] items-center gap-2.5 rounded-[9px] px-2.5 text-[13.5px] transition-colors",
                          active
                            ? "bg-adm-surface font-semibold text-adm-ink shadow-adm-sm ring-1 ring-inset ring-adm-line"
                            : "font-medium text-adm-ink-2 hover:bg-adm-line-2 hover:text-adm-ink",
                          c && "min-[901px]:justify-center min-[901px]:px-0"
                        )}
                      >
                        <Icon size={16} aria-hidden="true" className={active ? "text-adm-brand" : "text-adm-faint"} />
                        <span className={cx("truncate", hideCollapsed)}>{item.label}</span>
                        {badge && (
                          <span
                            title={badge.title}
                            className={cx(
                              "ms-auto min-w-5 rounded-[10px] px-1.5 text-center text-[11px] font-semibold tabular-nums",
                              badge.alert ? "bg-adm-amber-soft text-adm-amber" : "bg-adm-line-2 text-adm-muted",
                              hideCollapsed
                            )}
                          >
                            {badge.n}
                          </span>
                        )}
                        {badge?.alert && c && (
                          <span
                            aria-hidden="true"
                            className="absolute end-3 top-1.5 hidden size-2 rounded-full border-2 border-adm-side bg-adm-amber min-[901px]:block"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div ref={me} className="relative shrink-0 border-t border-adm-line p-3">
          {meOpen && (
            <div
              role="menu"
              className="absolute bottom-full start-3 z-10 mb-1.5 w-56 rounded-adm border border-adm-line bg-adm-surface p-1.5 shadow-adm-md motion-safe:animate-[adm-pop_120ms_ease-out]"
            >
              <p className="truncate px-2.5 pb-1.5 pt-1 text-xs text-adm-muted">{userEmail}</p>
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                className="flex h-[34px] w-full items-center gap-2 rounded-adm-sm px-2.5 text-[13px] font-semibold text-adm-rose hover:bg-adm-rose-soft"
              >
                <LogOut size={16} aria-hidden="true" />
                Çıkış yap
              </button>
            </div>
          )}
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={meOpen}
            onClick={() => setMeOpen((open) => !open)}
            title={c ? userEmail : undefined}
            className={cx(
              "flex w-full items-center gap-2.5 rounded-adm p-1.5 text-start hover:bg-adm-line-2",
              c && "min-[901px]:justify-center"
            )}
          >
            <Avatar name={userName ?? userEmail} />
            <span className={cx("min-w-0", hideCollapsed)}>
              <span className="block truncate text-[13px] font-semibold leading-tight">{userName ?? "Yönetici"}</span>
              <span className="block truncate text-[11.5px] text-adm-muted">{userEmail}</span>
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
