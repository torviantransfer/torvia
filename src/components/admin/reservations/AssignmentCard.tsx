"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  FileText,
  Mail,
  MessageCircle,
  Pencil,
  RefreshCw,
  UserMinus,
} from "lucide-react";
import { formatBookingDateTime } from "@/lib/datetime";
import {
  type DriverAssignment,
  type Reservation,
  ASSIGNMENT_STEPS,
  assignmentMeta,
  customerName,
  fmtDateTime,
  fmtStamp,
  isCash,
  legDateTime,
  money,
  regionName,
  reservationProfit,
} from "./types";

interface Props {
  reservation: Reservation;
  assignment: DriverAssignment;
  onReplace: () => void;
  onUnassign: () => void;
  unassigning: boolean;
  onToast: (message: string, tone?: "ok" | "error") => void;
}

/** WhatsApp handover message — mirrors what assign-driver sends on first assignment. */
function whatsappUrl(r: Reservation, da: DriverAssignment) {
  if (!da.link_token || !da.drivers?.phone) return null;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const legLabel = da.leg === "return" ? "DÖNÜŞ" : "GİDİŞ";
  const at = new Date(legDateTime(r, da.leg));
  const text = encodeURIComponent(
    `🚗 TORVIAN — Transfer Görevi (${legLabel})\n\n` +
      `📋 Kod: ${r.reservation_code}\n` +
      `👤 Müşteri: ${customerName(r)}\n` +
      `📍 Güzergah: Havalimanı → ${regionName(r)}\n` +
      `📅 Tarih: ${formatBookingDateTime(at)}\n` +
      (da.leg === "return" && da.pickup_time ? `⏰ Alış: ${da.pickup_time}\n` : "") +
      `\n🔗 Şoför Paneli:\n${origin}/driver/${da.link_token}\n\n` +
      `📄 Şoför Voucher:\n${origin}/api/driver-voucher?token=${da.link_token}`
  );
  return `https://wa.me/${da.drivers.phone.replace(/[^0-9]/g, "")}?text=${text}`;
}

/**
 * Secondary actions are icons with tooltips rather than labelled buttons.
 *
 * There are six things you can do to an assignment and only one of them —
 * handing the job to the driver — is the point. Six labelled buttons in three
 * captioned groups made them all look equally urgent and took four lines to
 * say so.
 */
const ICON_BTN =
  "inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40";

export default function AssignmentCard({
  reservation: r,
  assignment: da,
  onReplace,
  onUnassign,
  unassigning,
  onToast,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [editingFee, setEditingFee] = useState(false);
  const [feeInput, setFeeInput] = useState(
    da.driver_fee != null ? String(da.driver_fee) : ""
  );
  const [savingFee, setSavingFee] = useState(false);
  const router = useRouter();

  const meta = assignmentMeta(da.status);
  const isReturn = da.leg === "return";
  const wa = whatsappUrl(r, da);
  const driverPanel =
    typeof window === "undefined" ? "" : `${window.location.origin}/driver/${da.link_token}`;

  /**
   * The furthest point this assignment has actually reached.
   *
   * This replaces a four-step progress bar with timestamps under each node.
   * That bar cost eight lines to say what the status chip already said, and
   * since the drivers do not open their panel it sat on step one essentially
   * always — a progress indicator that never progressed.
   */
  const stamps = [da.assigned_at, da.accepted_at, da.picked_up_at, da.completed_at];
  const lastIndex = stamps.reduce((last, s, i) => (s ? i : last), -1);
  const lastStamp =
    lastIndex >= 0 ? `${ASSIGNMENT_STEPS[lastIndex]} ${fmtStamp(stamps[lastIndex])}` : null;

  // null while any leg of this booking is still unpriced — see reservationProfit.
  const profit = reservationProfit(r);

  /**
   * The fare this driver takes off the passenger in cash, which comes off what
   * we owe him. Outbound only: the passenger pays once, at the airport pickup,
   * and driver_amount is one figure for the whole booking.
   */
  const cashOffset = isCash(r) && !isReturn ? Number(r.driver_amount) || 0 : 0;

  const copyLink = async () => {
    await navigator.clipboard.writeText(driverPanel);
    setCopied(true);
    onToast("Şoför paneli linki kopyalandı.");
    setTimeout(() => setCopied(false), 2000);
  };

  const saveFee = async () => {
    setSavingFee(true);
    const res = await fetch("/api/admin/assignment-fee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: da.id,
        // Empty clears the rate back to "not agreed yet", which the earnings
        // summary counts as unpriced rather than as a free transfer.
        driverFee: feeInput.trim() === "" ? null : feeInput.trim(),
      }),
    });
    setSavingFee(false);

    if (!res.ok) {
      const d = await res.json().catch(() => null);
      onToast(d?.error ?? "Ücret kaydedilemedi.", "error");
      return;
    }

    setEditingFee(false);
    onToast(
      feeInput.trim() === ""
        ? "Şoför ücreti kaldırıldı."
        : "Şoför ücreti kaydedildi, cari hesaba işlendi."
    );
    router.refresh();
  };

  const sendEmail = async () => {
    setEmailing(true);
    const res = await fetch("/api/admin/send-driver-assignment-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: da.id }),
    });
    if (res.ok) {
      onToast("Şoför bilgisi müşteriye e-posta ile gönderildi.");
    } else {
      const d = await res.json().catch(() => null);
      onToast(d?.error ?? "E-posta gönderilemedi.", "error");
    }
    setEmailing(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      {/* Line 1 — who, in what, and where it stands */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
            isReturn ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isReturn ? "DÖNÜŞ" : "GİDİŞ"}
        </span>

        <span className="text-sm font-bold text-slate-900">
          {da.drivers?.full_name ?? "Şoför kaydı silinmiş"}
        </span>

        {da.drivers?.phone && (
          <a
            href={`tel:${da.drivers.phone}`}
            className="text-xs text-sky-700 hover:underline"
          >
            {da.drivers.phone}
          </a>
        )}

        {da.vehicles && (
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-600">
            {da.vehicles.plate_number}
          </span>
        )}

        <span className={`ms-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.chip}`}>
          {meta.label}
        </span>
      </div>

      {/* Line 2 — when, what it costs, what it leaves */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>{fmtDateTime(legDateTime(r, da.leg))}</span>

        {da.pickup_time && (
          <span className="text-orange-600">Otelden {da.pickup_time}</span>
        )}

        {editingFee ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-slate-400">Şoföre $</span>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              autoFocus
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveFee();
                if (e.key === "Escape") setEditingFee(false);
              }}
              placeholder="110"
              className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <button
              onClick={saveFee}
              disabled={savingFee}
              className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingFee ? "…" : "Kaydet"}
            </button>
            <button
              onClick={() => {
                setFeeInput(da.driver_fee != null ? String(da.driver_fee) : "");
                setEditingFee(false);
              }}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700"
            >
              Vazgeç
            </button>
          </span>
        ) : da.driver_fee == null ? (
          <button
            onClick={() => setEditingFee(true)}
            className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
          >
            Ücret girilmedi — gir
          </button>
        ) : (
          <span className="inline-flex items-center gap-1">
            Şoföre <strong className="text-slate-900">{money(da.driver_fee)}</strong>
            <button
              onClick={() => setEditingFee(true)}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Şoför ücretini düzenle"
            >
              <Pencil size={10} />
            </button>
          </span>
        )}

        {da.driver_fee != null && profit !== null && (
          <span>
            Kalan{" "}
            <strong className={profit < 0 ? "text-rose-600" : "text-emerald-700"}>
              {money(profit)}
            </strong>
          </span>
        )}

        {da.driver_fee != null && cashOffset > 0 && (
          <span className="text-amber-700">
            Müşteriden {money(cashOffset)} alacak · borç{" "}
            <strong>{money(Number(da.driver_fee) - cashOffset)}</strong>
          </span>
        )}

        {lastStamp && <span className="text-slate-400">{lastStamp}</span>}
      </div>

      {/* Line 3 — the handover, then everything else at icon weight */}
      {da.link_token && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              <MessageCircle size={13} />
              WhatsApp
            </a>
          )}

          <a
            href={`/api/driver-voucher?token=${da.link_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className={ICON_BTN}
            title="Transfer belgesi"
          >
            <FileText size={14} />
          </a>

          <button onClick={copyLink} className={ICON_BTN} title="Şoför paneli linkini kopyala">
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </button>

          <button
            onClick={sendEmail}
            disabled={emailing}
            className={ICON_BTN}
            title="Müşteriye şoför bilgisini e-postala"
          >
            <Mail size={14} />
          </button>

          <span className="mx-1 h-4 w-px bg-slate-200" />

          <button onClick={onReplace} className={ICON_BTN} title="Şoförü değiştir">
            <RefreshCw size={14} />
          </button>

          <button
            onClick={onUnassign}
            disabled={unassigning}
            className={`${ICON_BTN} hover:bg-amber-50 hover:text-amber-700`}
            title="Atamayı kaldır"
          >
            <UserMinus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
