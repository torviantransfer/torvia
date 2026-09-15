"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import CommandPalette from "./ui/CommandPalette";
import { ToastProvider } from "./ui/Toast";
import { cx } from "./ui/cx";
import { matchNav, SIDEBAR_COOKIE, type ShellCounts } from "./nav";

const COUNTS_EVERY_MS = 30_000;

/**
 * The sidebar badges and the visitor pill. Fetched from the client rather than
 * in the layout: a layout is not re-rendered when moving between admin pages,
 * so counts read there would go stale the moment a driver is assigned.
 */
function useShellCounts(pathname: string) {
  const [counts, setCounts] = useState<ShellCounts | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/admin/shell", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as ShellCounts;
        if (!cancelled) setCounts(data);
      } catch {
        // Offline for a moment; the next tick tries again.
      }
    };
    load();
    const timer = window.setInterval(load, COUNTS_EVERY_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [pathname]);

  return counts;
}

export default function AdminShell({
  userEmail,
  userName,
  initialCollapsed,
  children,
}: {
  userEmail: string;
  userName: string | null;
  initialCollapsed: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const base = `/${locale}/admin`;
  const current = matchNav(pathname, base);
  const counts = useShellCounts(pathname);

  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMenuOpen(false);
        setPaletteOpen((open) => !open);
      } else if (e.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };

  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openPalette = useCallback(() => {
    setMenuOpen(false);
    setPaletteOpen(true);
  }, []);

  return (
    <ToastProvider>
      <div className="adm-root min-h-screen w-full bg-adm-bg text-adm-ink" style={{ colorScheme: "light" }}>
        <AdminSidebar
          base={base}
          locale={locale}
          current={current}
          counts={counts}
          userEmail={userEmail}
          userName={userName}
          collapsed={collapsed}
          menuOpen={menuOpen}
          onCloseMenu={() => setMenuOpen(false)}
          onToggleCollapsed={toggleCollapsed}
          onOpenPalette={openPalette}
        />
        <div
          className={cx(
            "min-w-0 transition-[margin] duration-200 ease-out",
            collapsed ? "min-[901px]:ms-[68px]" : "min-[901px]:ms-64"
          )}
        >
          <AdminTopbar
            crumb={current?.label ?? null}
            liveNow={counts?.liveNow ?? null}
            base={base}
            locale={locale}
            onMenu={() => setMenuOpen(true)}
            onSearch={openPalette}
          />
          <main className="max-w-[1440px] px-4 pb-[90px] pt-1 min-[901px]:px-7 min-[901px]:pb-14 min-[901px]:pt-2">
            {children}
          </main>
        </div>
        <CommandPalette open={paletteOpen} onClose={closePalette} base={base} locale={locale} />
      </div>
    </ToastProvider>
  );
}
