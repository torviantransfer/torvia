"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { statusMeta, type Reservation } from "./types";

// Statuses an operator may set by hand. `cancel_requested` is deliberately absent:
// it is customer-initiated and is resolved through the approve/reject buttons.
const EDITABLE_STATUSES = [
  "pending",
  "paid",
  "driver_assigned",
  "passenger_picked_up",
  "completed",
  "cancelled",
];

/** ISO timestamp → the `YYYY-MM-DDTHH:mm` a datetime-local input expects, in local time. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fromLocalInput = (value: string) =>
  value ? new Date(value).toISOString() : null;

interface Props {
  reservation: Reservation;
  onClose: () => void;
  onSaved: () => void;
  onToast: (message: string, tone?: "ok" | "error") => void;
}

export default function EditReservationModal({
  reservation: r,
  onClose,
  onSaved,
  onToast,
}: Props) {
  // Prefilled from the current record, so the operator edits what is actually stored.
  const [form, setForm] = useState({
    pickup_datetime: toLocalInput(r.pickup_datetime),
    return_datetime: toLocalInput(r.return_datetime),
    flight_code: r.flight_code ?? "",
    hotel_name: r.hotel_name ?? "",
    hotel_address: r.hotel_address ?? "",
    notes: r.notes ?? "",
    status: r.status,
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    // Send every field the API accepts in one request — the previous version could
    // only ever persist the last field that was touched.
    const body: Record<string, unknown> = {
      reservationId: r.id,
      flight_code: form.flight_code.trim() || null,
      hotel_name: form.hotel_name.trim() || null,
      hotel_address: form.hotel_address.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    };
    const pickup = fromLocalInput(form.pickup_datetime);
    if (pickup) body.pickup_datetime = pickup;
    if (r.trip_type === "round_trip") {
      body.return_datetime = fromLocalInput(form.return_datetime);
    }

    setSaving(true);
    const res = await fetch("/api/admin/edit-reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (res.ok) {
      onToast("Rezervasyon güncellendi.");
      onSaved();
    } else {
      const d = await res.json().catch(() => null);
      onToast(d?.error ?? "Güncelleme başarısız.", "error");
    }
  };

  const field = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10";
  const label = "block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Rezervasyonu Düzenle</h3>
            <p className="mt-0.5 font-mono text-xs text-slate-500">{r.reservation_code}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Gidiş tarih & saat</label>
              <input
                type="datetime-local"
                value={form.pickup_datetime}
                onChange={(e) => set("pickup_datetime", e.target.value)}
                className={field}
              />
            </div>
            {r.trip_type === "round_trip" && (
              <div>
                <label className={label}>Dönüş tarih & saat</label>
                <input
                  type="datetime-local"
                  value={form.return_datetime}
                  onChange={(e) => set("return_datetime", e.target.value)}
                  className={field}
                />
              </div>
            )}
            <div>
              <label className={label}>Uçuş kodu</label>
              <input
                type="text"
                value={form.flight_code}
                onChange={(e) => set("flight_code", e.target.value)}
                placeholder="TK123"
                className={field}
              />
            </div>
            <div>
              <label className={label}>Durum</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className={field}
              >
                {/* Keep the current value selectable even if it is not operator-settable. */}
                {(EDITABLE_STATUSES.includes(r.status)
                  ? EDITABLE_STATUSES
                  : [r.status, ...EDITABLE_STATUSES]
                ).map((value) => (
                  <option key={value} value={value}>
                    {statusMeta(value).label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={label}>Otel adı</label>
            <input
              type="text"
              value={form.hotel_name}
              onChange={(e) => set("hotel_name", e.target.value)}
              placeholder="REGNUM CARYA"
              className={field}
            />
          </div>

          <div>
            <label className={label}>Otel adresi</label>
            <input
              type="text"
              value={form.hotel_address}
              onChange={(e) => set("hotel_address", e.target.value)}
              placeholder="Kadriye Mah. Belek / Antalya"
              className={field}
            />
          </div>

          <div>
            <label className={label}>Notlar</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Şoför için operasyon notu"
              className={`${field} resize-none`}
            />
          </div>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            Saat değişikliği mevcut şoför atamalarını otomatik güncellemez — saati
            değiştirdiyseniz şoförü tekrar bilgilendirin.
          </p>
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-5 py-3.5">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
