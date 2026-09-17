"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Menu, Plus, Search } from "lucide-react";
import { ButtonLink, IconButton } from "./ui/Button";
import { cx } from "./ui/cx";

export default function AdminTopbar({
  crumb,
  liveNow,
  base,
  onMenu,
  onSearch,
}: {
  /** The current menu entry; null on a screen the menu does not list. */
  crumb: string | null;
  /** Null until the first count arrives. */
  liveNow: number | null;
  base: string;
  onMenu: () => void;
  onSearch: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cx(
        "sticky top-0 z-20 flex h-[60px] items-center gap-3 border-b bg-[rgba(245,245,242,.86)] px-4 backdrop-blur-[10px] transition-colors min-[901px]:px-7",
        scrolled ? "border-adm-line" : "border-transparent"
      )}
    >
      <IconButton icon={Menu} label="Menüyü aç" onClick={onMenu} className="-ms-1.5 min-[901px]:hidden" />

      {/* The screen prints its own title, so naming it here too put the same
          words on the page twice. It is only worth repeating once that title
          has scrolled away — which is exactly when the sticky bar stops being
          decoration and becomes the only thing saying where you are. */}
      <nav aria-label="Konum" className="flex min-w-0 items-center gap-1.5 text-[13px] text-adm-muted">
        <span className={cx("shrink-0 transition-colors", !scrolled && "font-semibold text-adm-ink")}>Admin</span>
        {crumb && (
          <span
            className={cx(
              "flex min-w-0 items-center gap-1.5 transition-[opacity,transform] duration-200 ease-out",
              scrolled ? "translate-y-0 opacity-100" : "-translate-y-0.5 opacity-0"
            )}
          >
            <ChevronRight size={14} aria-hidden="true" className="shrink-0 rtl:rotate-180" />
            <strong className="truncate font-semibold text-adm-ink">{crumb}</strong>
          </span>
        )}
      </nav>

      <div className="ms-auto flex items-center gap-2">
        {liveNow !== null && (
          <Link
            href={`${base}/live-visitors`}
            title={`${liveNow} kişi şu an sitede`}
            className="inline-flex h-8 items-center gap-[7px] rounded-[9px] px-2.5 text-[12.5px] font-medium text-adm-ink-2 transition-colors hover:bg-adm-line-2 max-[760px]:hidden"
          >
            <span
              aria-hidden="true"
              className={cx(
                "size-[7px] rounded-full",
                liveNow > 0 ? "bg-[#16a34a] shadow-[0_0_0_3px_rgba(22,163,74,.15)]" : "bg-adm-faint"
              )}
            />
            <span className="whitespace-nowrap max-[900px]:sr-only">
              <span className="tabular-nums">{liveNow}</span> kişi sitede
            </span>
          </Link>
        )}
        <IconButton icon={Search} label="Ara" onClick={onSearch} />
        <ButtonLink href={`${base}/reservations/new`} variant="primary" icon={Plus} compact>
          Yeni rezervasyon
        </ButtonLink>
      </div>
    </header>
  );
}
