"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { formatBookingDate, formatBookingTime } from "@/lib/datetime";
import { Button, Dialog, Field, Input, Segmented, buttonClass } from "@/components/admin/ui";
import {
  type DriverAssignment,
  type Reservation,
  customerName,
  legDateTime,
  legFlight,
  routeFor,
} from "./types";

const PRESETS = ["15", "30", "45", "60", "90", "custom"] as const;
type Preset = (typeof PRESETS)[number];

const PRESET_LABEL: Record<Preset, string> = {
  "15": "15 dk",
  "30": "30 dk",
  "45": "45 dk",
  "60": "1 saat",
  "90": "1,5 saat",
  custom: "Başka",
};

/** The wall-clock time a leg moves to once it slips by `minutes`. */
function shift(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

/**
 * Tells the driver a job is running late.
 *
 * The message goes out over the driver's WhatsApp rather than from us, because
 * that is where the drivers already read their jobs, and a link the admin
 * clicks needs no delivery infrastructure of its own. Once flight data arrives
 * (A1) the same message is what gets sent automatically.
 */
export default function DelayDialog({
  reservation: r,
  assignment: da,
  onClose,
  onSent,
}: {
  reservation: Reservation;
  assignment: DriverAssignment;
  onClose: () => void;
  onSent: () => void;
}) {
  const [preset, setPreset] = useState<Preset>("30");
  const [custom, setCustom] = useState("");

  const minutes = preset === "custom" ? Number(custom.replace(",", ".")) : Number(preset);
  const valid = Number.isFinite(minutes) && minutes > 0 && minutes <= 24 * 60;

  const legLabel = da.leg === "return" ? "DÖNÜŞ" : "GİDİŞ";
  const leg = da.leg === "return" ? "return" : "outbound";
  const planned = legDateTime(r, da.leg);
  const moved = valid ? shift(planned, minutes) : planned;
  const flight = legFlight(r, leg);
  const phone = (da.drivers?.phone ?? "").replace(/[^0-9]/g, "");

  const message =
    `⏱ TORVIAN — Rötar bildirimi (${legLabel})\n\n` +
    `📋 Kod: ${r.reservation_code}\n` +
    `👤 Müşteri: ${customerName(r)}\n` +
    (flight ? `✈️ Uçuş: ${flight}\n` : "") +
    `📍 Güzergah: ${routeFor(r, leg)}\n` +
    `📅 Tarih: ${formatBookingDate(planned)}\n\n` +
    `🕐 Planlanan: ${formatBookingTime(planned)}\n` +
    `🕐 Yeni saat: ${formatBookingTime(moved)}  (${minutes || 0} dk rötar)\n\n` +
    `Lütfen yeni saate göre planla. Değişiklik olursa tekrar yazacağız.`;

  const href = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : undefined;

  /* Logged as the admin clicks through to WhatsApp, not before: the record
     should say a notification was sent, and it is this click that sends it.
     A failed write must not stand between the admin and the driver, so it is
     fire-and-forget. */
  const record = () => {
    fetch("/api/admin/notify-delay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId: r.id,
        assignmentId: da.id,
        minutes,
        leg: da.leg,
        newTime: moved,
      }),
    }).catch(() => {});
    onSent();
  };

  return (
    <Dialog
      open
      title="Rötar bildir"
      subtitle={`${r.reservation_code} · ${da.drivers?.full_name ?? "Şoför"}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          {href && valid ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={record}
              className={buttonClass({ variant: "brand" })}
            >
              <MessageCircle size={15} aria-hidden="true" />
              WhatsApp&apos;tan gönder
            </a>
          ) : (
            <Button variant="brand" icon={MessageCircle} disabled>
              WhatsApp&apos;tan gönder
            </Button>
          )}
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Ne kadar rötar var?">
          <Segmented
            options={PRESETS.map((p) => ({ value: p, label: PRESET_LABEL[p] }))}
            value={preset}
            onChange={setPreset}
            label="Rötar süresi"
          />
        </Field>

        {preset === "custom" && (
          <Field
            label="Dakika"
            htmlFor="delay-minutes"
            error={custom && !valid ? "1 ile 1440 arasında bir dakika girin." : undefined}
          >
            <Input
              id="delay-minutes"
              type="number"
              min="1"
              max="1440"
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="120"
              autoFocus
            />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-adm border border-adm-line bg-adm-line-2">
          <div className="bg-adm-surface px-3 py-2.5">
            <p className="text-[11.5px] text-adm-muted">Planlanan</p>
            <p className="mt-0.5 text-[17px] font-bold tabular-nums text-adm-muted line-through">
              {formatBookingTime(planned)}
            </p>
          </div>
          <div className="bg-adm-surface px-3 py-2.5">
            <p className="text-[11.5px] text-adm-muted">Yeni saat</p>
            <p className="mt-0.5 text-[17px] font-bold tabular-nums text-adm-amber">
              {valid ? formatBookingTime(moved) : "—"}
            </p>
          </div>
        </div>

        <Field label="Gidecek mesaj" hint="WhatsApp açıldığında bu metin hazır gelir.">
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-adm-sm border border-adm-line bg-adm-surface-2 px-3 py-2.5 font-sans text-[12.5px] leading-relaxed text-adm-ink-2">
            {message}
          </pre>
        </Field>

        {!phone && (
          <p className="rounded-adm-sm border border-adm-amber-line bg-adm-amber-soft px-3 py-2 text-[12.5px] text-adm-amber">
            Bu şoförün telefon numarası kayıtlı değil — mesaj gönderilemez. Şoförler ekranından
            numarayı ekleyin.
          </p>
        )}

        <p className="text-[11.5px] leading-relaxed text-adm-muted">
          Bu bildirim rezervasyonun saatini <b>değiştirmez</b>; yalnızca şoförü haberdar eder.
          Alış saati kalıcı olarak değişecekse rezervasyonu ayrıca düzenleyin.
        </p>
      </div>
    </Dialog>
  );
}
