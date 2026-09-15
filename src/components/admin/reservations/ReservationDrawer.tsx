"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Loader2, Maximize2 } from "lucide-react";
import { Drawer, EmptyState, IconButton, IconLink } from "@/components/admin/ui";
import { useReservationPanel } from "./ReservationPanel";
import type { Leg, ReservationDetail } from "./types";

export interface DrawerNav {
  index: number;
  total: number;
  /** Shown before the position, e.g. "Seçim" when stepping through ticked rows. */
  label?: string;
  onPrev?: () => void;
  onNext?: () => void;
}

interface Loaded {
  code: string;
  detail: ReservationDetail | null;
  error?: string;
}

/**
 * The reservation beside the list. Loads the booking by code, keeps the last
 * one on screen while it slides away, and reloads after every change so the
 * list and the drawer never show two versions of the same booking.
 */
export default function ReservationDrawer({
  code,
  initialAssignLeg = null,
  onClose,
  onChanged,
  nav,
  adminBase,
}: {
  code: string | null;
  initialAssignLeg?: Leg | null;
  onClose: () => void;
  onChanged: () => void;
  nav?: DrawerNav;
  adminBase: string;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!code) return;
    const controller = new AbortController();
    fetch(`/api/admin/reservations/${encodeURIComponent(code)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Bu rezervasyon bulunamadı." : "Rezervasyon yüklenemedi.");
        return (await res.json()) as ReservationDetail;
      })
      .then((detail) => setLoaded({ code, detail }))
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setLoaded({ code, detail: null, error: e instanceof Error ? e.message : "Rezervasyon yüklenemedi." });
        }
      });
    return () => controller.abort();
  }, [code, version]);

  // While open, only the booking asked for; while closing, whatever was last shown.
  const current = code ? (loaded?.code === code ? loaded : null) : loaded;

  const changed = () => {
    setVersion((v) => v + 1);
    onChanged();
  };

  const actions = (forCode: string): ReactNode => (
    <>
      {nav && (
        <>
          <span className="me-1 whitespace-nowrap text-xs tabular-nums text-adm-faint max-[760px]:hidden">
            {nav.label ? `${nav.label} · ` : ""}
            {nav.index + 1}/{nav.total}
          </span>
          <IconButton size="sm" icon={ChevronUp} label="Önceki" onClick={nav.onPrev} disabled={!nav.onPrev} />
          <IconButton size="sm" icon={ChevronDown} label="Sonraki" onClick={nav.onNext} disabled={!nav.onNext} />
        </>
      )}
      <IconLink
        size="sm"
        icon={Maximize2}
        label="Tam sayfada aç"
        href={`${adminBase}/reservations/${encodeURIComponent(forCode)}`}
      />
    </>
  );

  if (current?.detail) {
    return (
      <LoadedDrawer
        key={`${current.code}:${initialAssignLeg ?? ""}`}
        open={!!code}
        detail={current.detail}
        initialAssignLeg={initialAssignLeg}
        onClose={onClose}
        onChanged={changed}
        onRemoved={() => {
          onChanged();
          onClose();
        }}
        actions={actions(current.code)}
      />
    );
  }

  const shownCode = code ?? current?.code ?? "";
  return (
    <Drawer
      open={!!code}
      onClose={onClose}
      label="Rezervasyon"
      top={<span className="font-mono text-[13px] font-semibold text-adm-muted">{shownCode}</span>}
      actions={shownCode ? actions(shownCode) : undefined}
    >
      {current?.error ? (
        <EmptyState compact icon={AlertCircle} title={current.error} />
      ) : (
        <div className="grid place-items-center py-16 text-adm-muted">
          <Loader2 size={20} className="animate-spin" aria-label="Yükleniyor" />
        </div>
      )}
    </Drawer>
  );
}

function LoadedDrawer({
  open,
  detail,
  initialAssignLeg,
  onClose,
  onChanged,
  onRemoved,
  actions,
}: {
  open: boolean;
  detail: ReservationDetail;
  initialAssignLeg: Leg | null;
  onClose: () => void;
  onChanged: () => void;
  onRemoved: () => void;
  actions: ReactNode;
}) {
  const p = useReservationPanel(detail, { onChanged, onRemoved, initialAssignLeg });
  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        label={`Rezervasyon ${detail.reservation.reservation_code}`}
        top={p.top}
        actions={actions}
        title={p.title}
        meta={p.meta}
        quick={p.quick}
        footer={p.footer}
      >
        {p.body}
      </Drawer>
      {p.dialogs}
    </>
  );
}
