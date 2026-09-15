"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useReservationPanel } from "./ReservationPanel";
import type { ReservationDetail } from "./types";

/**
 * One reservation on its own page, laid out like the drawer: an address that
 * can be sent to someone, with the same header, sections and actions.
 */
export default function ReservationDetailPage({ detail, adminBase }: { detail: ReservationDetail; adminBase: string }) {
  const router = useRouter();
  const listHref = `${adminBase}/reservations`;
  const p = useReservationPanel(detail, {
    onChanged: () => router.refresh(),
    onRemoved: () => {
      router.push(listHref);
      router.refresh();
    },
  });

  return (
    <div className="mx-auto max-w-[760px] pb-10">
      <Link
        href={listHref}
        className="mb-3 mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-adm-muted hover:text-adm-ink"
      >
        <ArrowLeft size={14} aria-hidden="true" className="rtl:rotate-180" />
        Rezervasyonlar
      </Link>

      <article className="rounded-adm-lg border border-adm-line bg-adm-surface shadow-adm-sm">
        <header className="border-b border-adm-line-2 px-5 pb-3.5 pt-4">
          <div className="flex flex-wrap items-center gap-2">{p.top}</div>
          <h1 className="mb-0.5 mt-2.5 text-xl font-bold tracking-[-0.01em]">{p.title}</h1>
          <div className="text-[12.5px] text-adm-muted">{p.meta}</div>
          <div className="mt-3.5 grid grid-cols-4 gap-2">{p.quick}</div>
        </header>
        <div className="grid gap-4 px-5 pb-6 pt-4">{p.body}</div>
        <footer className="flex flex-wrap items-center gap-2 rounded-b-adm-lg border-t border-adm-line-2 bg-adm-surface-2 px-5 py-3">
          {p.footer}
        </footer>
      </article>

      {p.dialogs}
    </div>
  );
}
