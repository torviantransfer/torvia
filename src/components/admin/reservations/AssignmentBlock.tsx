"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, FileText, Mail, MessageCircle, Pencil, RefreshCw, UserMinus } from "lucide-react";
import { formatBookingDateTime } from "@/lib/datetime";
// The passenger pays in euro, the driver is owed dollars — anything that puts
// the two in one sum converts first, through the same helper as the ledger.
import { convertSettlement, settlementOf } from "@/lib/currency";
import {
  AssignmentStatusChip,
  Avatar,
  Button,
  ConfirmDialog,
  IconButton,
  IconLink,
  Input,
  Select,
  buttonClass,
  cx,
  useToast,
} from "@/components/admin/ui";
import {
  type DriverAssignment,
  type Reservation,
  customerName,
  fmtStamp,
  isCash,
  legDateTime,
  LIVE_ASSIGNMENT_STATUSES,
  moneyText,
  reservationProfit,
  routeFor,
} from "./types";

const STEPS = ["Atandı", "Kabul etti", "Yolcu alındı", "Tamamlandı"];

const noSubscription = () => () => {};
const browserOrigin = () => window.location.origin;
const serverOrigin = () => "";

/** The handover message — mirrors what assign-driver prepares on first assignment. */
function driverWhatsapp(r: Reservation, da: DriverAssignment, origin: string) {
  if (!da.link_token || !da.drivers?.phone || !origin) return null;
  const legLabel = da.leg === "return" ? "DÖNÜŞ" : "GİDİŞ";
  const leg = da.leg === "return" ? "return" : "outbound";
  const text = encodeURIComponent(
    `🚗 TORVIAN — Transfer Görevi (${legLabel})\n\n` +
      `📋 Kod: ${r.reservation_code}\n` +
      `👤 Müşteri: ${customerName(r)}\n` +
      `📍 Güzergah: ${routeFor(r, leg)}\n` +
      `📅 Tarih: ${formatBookingDateTime(legDateTime(r, da.leg))}\n` +
      (da.leg === "return" && da.pickup_time ? `⏰ Alış: ${da.pickup_time}\n` : "") +
      `\n🔗 Şoför Paneli:\n${origin}/driver/${da.link_token}\n\n` +
      `📄 Şoför Voucher:\n${origin}/api/driver-voucher?token=${da.link_token}`
  );
  return `https://wa.me/${da.drivers.phone.replace(/[^0-9]/g, "")}?text=${text}`;
}

/**
 * One driver on one leg: who, in what, for how much, and the handover. The two
 * things that leave the building — the WhatsApp to the driver and the e-mail to
 * the passenger — carry labels; the rest sits at icon weight.
 */
export default function AssignmentBlock({
  reservation: r,
  assignment: da,
  onReplace,
  onChanged,
}: {
  reservation: Reservation;
  assignment: DriverAssignment;
  onReplace: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [editingFee, setEditingFee] = useState(false);
  const [feeInput, setFeeInput] = useState(da.driver_fee != null ? String(da.driver_fee) : "");
  const [feeCurrency, setFeeCurrency] = useState<"USD" | "EUR">(da.driver_fee_currency === "EUR" ? "EUR" : "USD");
  const [savingFee, setSavingFee] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  const live = LIVE_ASSIGNMENT_STATUSES.includes(da.status);
  const isReturn = da.leg === "return";
  const name = da.drivers?.full_name ?? "Şoför kaydı silinmiş";
  const phone = da.drivers?.phone ?? "";
  // Read after hydration, so the server's HTML and the first client render agree.
  const origin = useSyncExternalStore(noSubscription, browserOrigin, serverOrigin);
  const wa = driverWhatsapp(r, da, origin);
  const fareCurrency = settlementOf(r.currency);
  const storedCurrency = da.driver_fee_currency === "EUR" ? "EUR" : "USD";

  // The furthest point the job has reached, with its time.
  const stamps = [da.assigned_at, da.accepted_at, da.picked_up_at, da.completed_at];
  const lastIndex = stamps.reduce((last, s, i) => (s ? i : last), -1);
  const lastStamp = lastIndex >= 0 ? `${STEPS[lastIndex]} ${fmtStamp(stamps[lastIndex])}` : null;

  // null while any leg of this booking is still unpriced — see reservationProfit.
  const profit = reservationProfit(r);

  /*
   * The fare this driver takes off the passenger in cash comes off what we owe
   * him — outbound only, converted into his currency at the booking's rate so
   * the card and his account cannot disagree. null: no rate to convert with.
   */
  const cashFromPassenger = isCash(r) && !isReturn ? Number(r.driver_amount) || 0 : 0;
  const cashInFeeCurrency =
    cashFromPassenger > 0
      ? convertSettlement(cashFromPassenger, fareCurrency, storedCurrency, r.exchange_rate_usd, r.exchange_rate_eur)
      : 0;

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/driver/${da.link_token}`);
    setCopied(true);
    toast("Şoför paneli linki kopyalandı.");
    window.setTimeout(() => setCopied(false), 2000);
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
        driverFeeCurrency: feeCurrency,
      }),
    });
    setSavingFee(false);
    if (!res.ok) {
      const d = await res.json().catch(() => null);
      toast(d?.error ?? "Ücret kaydedilemedi.", "error");
      return;
    }
    setEditingFee(false);
    toast(feeInput.trim() === "" ? "Şoför ücreti kaldırıldı." : "Şoför ücreti kaydedildi, cari hesaba işlendi.");
    onChanged();
  };

  const cancelFee = () => {
    setFeeInput(da.driver_fee != null ? String(da.driver_fee) : "");
    setFeeCurrency(storedCurrency);
    setEditingFee(false);
  };

  const sendEmail = async () => {
    setEmailing(true);
    const res = await fetch("/api/admin/send-driver-assignment-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: da.id }),
    });
    setEmailing(false);
    if (res.ok) {
      setEmailSent(true);
      window.setTimeout(() => setEmailSent(false), 4000);
      toast("Şoför bilgisi müşteriye e-postayla gönderildi.");
    } else {
      const d = await res.json().catch(() => null);
      toast(d?.error ?? "E-posta gönderilemedi.", "error");
    }
  };

  const unassign = async () => {
    setUnassigning(true);
    const res = await fetch("/api/admin/unassign-driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: da.id }),
    });
    setUnassigning(false);
    if (res.ok) {
      setConfirmOpen(false);
      toast("Şoför ataması kaldırıldı.");
      onChanged();
    } else {
      const d = await res.json().catch(() => null);
      toast(d?.error ?? "Atama kaldırılamadı.", "error");
    }
  };

  return (
    <div
      className={cx(
        "rounded-adm border px-3 py-2.5",
        live ? "border-adm-line bg-adm-surface" : "border-adm-line-2 bg-adm-surface-2"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold">{name}</div>
          <div className="flex flex-wrap gap-x-2 text-[11.5px] text-adm-muted">
            {phone && (
              <a href={`tel:${phone}`} className="hover:text-adm-ink">
                {phone}
              </a>
            )}
            {da.vehicles && <span className="font-mono">{da.vehicles.plate_number}</span>}
            {da.vehicles && (
              <span className="truncate">
                {da.vehicles.brand} {da.vehicles.model}
              </span>
            )}
          </div>
        </div>
        <AssignmentStatusChip status={da.status} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-adm-muted">
        {da.pickup_time && <span className="font-medium text-adm-amber">Otelden {da.pickup_time}</span>}

        {editingFee ? (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <Select
              inputSize="sm"
              aria-label="Şoför ücretinin para birimi"
              value={feeCurrency}
              onChange={(e) => setFeeCurrency(e.target.value === "EUR" ? "EUR" : "USD")}
              className="w-16"
            >
              <option value="USD">$</option>
              <option value="EUR">€</option>
            </Select>
            <Input
              inputSize="sm"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              autoFocus
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveFee();
                if (e.key === "Escape") {
                  e.stopPropagation();
                  cancelFee();
                }
              }}
              placeholder="110"
              aria-label="Şoför ücreti"
              className="w-20"
            />
            <Button size="sm" variant="primary" loading={savingFee} onClick={saveFee}>
              Kaydet
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelFee}>
              Vazgeç
            </Button>
          </span>
        ) : da.driver_fee == null ? (
          live && (
            <button
              type="button"
              onClick={() => setEditingFee(true)}
              className="rounded-md bg-adm-amber-soft px-2 py-0.5 text-[11.5px] font-semibold text-adm-amber ring-1 ring-inset ring-adm-amber-line hover:bg-[#fbe8b8]"
            >
              Ücret girilmedi · gir
            </button>
          )
        ) : (
          <span className="inline-flex items-center gap-1">
            Şoföre <b className="font-semibold text-adm-ink">{moneyText(da.driver_fee, storedCurrency)}</b>
            {live && (
              <button
                type="button"
                aria-label="Şoför ücretini düzenle"
                title="Şoför ücretini düzenle"
                onClick={() => setEditingFee(true)}
                className="grid size-5 place-items-center rounded text-adm-faint hover:text-adm-ink"
              >
                <Pencil size={11} aria-hidden="true" />
              </button>
            )}
          </span>
        )}

        {live && da.driver_fee != null && profit !== null && (
          <span>
            Kalan{" "}
            <b className={cx("font-semibold", profit < 0 ? "text-adm-rose" : "text-adm-green")}>
              {moneyText(profit, fareCurrency)}
            </b>
          </span>
        )}

        {live && da.driver_fee != null && cashFromPassenger > 0 && cashInFeeCurrency !== null && (
          <span className="text-adm-amber">
            Müşteriden {moneyText(cashFromPassenger, fareCurrency)} alacak · borç{" "}
            <b className="font-semibold">
              {moneyText(Number(da.driver_fee) - cashInFeeCurrency, storedCurrency)}
            </b>
          </span>
        )}

        {lastStamp && <span className="text-adm-faint">{lastStamp}</span>}
      </div>

      {live && da.link_token && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: "brand", size: "sm" })}>
              <MessageCircle size={14} aria-hidden="true" />
              Şoföre WhatsApp
            </a>
          )}
          <Button
            size="sm"
            icon={emailSent ? Check : Mail}
            loading={emailing}
            onClick={sendEmail}
            title="Şoför ve araç bilgisini müşteriye e-postala. Son dakika değişebildiği için kendiliğinden gönderilmez."
          >
            {emailSent ? "Gönderildi" : "Müşteriye mail"}
          </Button>
          <IconLink
            size="sm"
            icon={FileText}
            label="Transfer belgesi"
            href={`/api/driver-voucher?token=${da.link_token}`}
            newTab
          />
          <IconButton size="sm" icon={copied ? Check : Copy} label="Şoför paneli linkini kopyala" onClick={copyLink} />
          <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-adm-line" />
          <Button size="sm" variant="ghost" icon={RefreshCw} onClick={onReplace}>
            Değiştir
          </Button>
          <Button
            size="sm"
            variant="danger-ghost"
            icon={UserMinus}
            onClick={() => setConfirmOpen(true)}
            disabled={da.status === "picked_up"}
            title={da.status === "picked_up" ? "Yolculuk başlamış bir atama kaldırılamaz." : undefined}
          >
            Kaldır
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Şoför atamasını kaldır"
        message={`${name} bu bacaktan çıkarılacak ve şoförün linki geçersiz olacak.`}
        confirmLabel="Kaldır"
        danger
        busy={unassigning}
        onConfirm={unassign}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
