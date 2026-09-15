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
  locale,
  onMenu,
  onSearch,
}: {
  /** The current menu entry; null on a screen the menu does not list. */
  crumb: string | null;
  /** Null until the first count arrives. */
  liveNow: number | null;
  base: string;
  locale: string;
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

      <nav aria-label="Konum" className="flex min-w-0 items-center gap-1.5 text-[13px] text-adm-muted">
        {crumb && (
          <>
            <span className="max-[760px]:hidden">Admin</span>
            <ChevronRight size={14} aria-hidden="true" className="shrink-0 max-[760px]:hidden rtl:rotate-180" />
          </>
        )}
        <strong className="truncate font-semibold text-adm-ink">{crumb ?? "Admin"}</strong>
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
        {/* Until the admin can create a booking itself (A3), this opens the
            site's booking page, which is where one is made today. */}
        <ButtonLink
          href={`/${locale}/booking`}
          target="_blank"
          rel="noopener"
          variant="primary"
          icon={Plus}
          compact
          title="Site rezervasyon sayfası yeni sekmede açılır"
        >
          Yeni rezervasyon
        </ButtonLink>
      </div>
    </header>
  );
}
