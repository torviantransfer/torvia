"use client";

import { useState } from "react";
import { Button, Dialog, Field, Input, RESERVATION_STATUS, Select, Textarea, cx, useToast } from "@/components/admin/ui";
import { DIRECTIONS, legRoute, normalizeDirection, type Direction } from "@/lib/transfer-route";
import { regionName, type Reservation } from "./types";

// Statuses an operator may set by hand. `cancel_requested` is deliberately absent:
// it is customer-initiated and is resolved through the approve/reject buttons.
const EDITABLE_STATUSES = [
  "pending",
  "paid",
  "deposit_paid",
  "driver_assigned",
  "passenger_picked_up",
  "completed",
  "cancelled",
];

/**
 * Read and write the stored wall-clock time verbatim rather than routing it
 * through the browser's timezone. A Date round-trip here would re-anchor it to
 * the operator's offset and shift every edited reservation by hours.
 */
function toDatetimeInput(stored: string | null | undefined): string {
  if (!stored) return "";
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(stored);
  return match ? `${match[1]}T${match[2]}` : "";
}

/** Back to the exact shape the booking flow writes. */
const fromDatetimeInput = (value: string) => (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00` : null);

export default function EditReservationDialog({
  reservation: r,
  onClose,
  onSaved,
}: {
  reservation: Reservation;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    pickup_datetime: toDatetimeInput(r.pickup_datetime),
    return_datetime: toDatetimeInput(r.return_datetime),
    flight_code: r.flight_code ?? "",
    return_flight_code: r.return_flight_code ?? "",
    hotel_name: r.hotel_name ?? "",
    hotel_address: r.hotel_address ?? "",
    notes: r.notes ?? "",
    status: r.status,
    direction: normalizeDirection(r.direction) as string,
  });
  const [saving, setSaving] = useState(false);
  const roundTrip = r.trip_type === "round_trip";
  const id = (key: string) => `edit-${r.id}-${key}`;

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    const body: Record<string, unknown> = {
      reservationId: r.id,
      flight_code: form.flight_code.trim() || null,
      return_flight_code: form.return_flight_code.trim() || null,
      hotel_name: form.hotel_name.trim() || null,
      hotel_address: form.hotel_address.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
      direction: form.direction,
    };
    const pickup = fromDatetimeInput(form.pickup_datetime);
    if (pickup) body.pickup_datetime = pickup;
    if (roundTrip) body.return_datetime = fromDatetimeInput(form.return_datetime);

    setSaving(true);
    const res = await fetch("/api/admin/edit-reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (res.ok) {
      toast("Rezervasyon güncellendi.");
      onSaved();
    } else {
      const d = await res.json().catch(() => null);
      toast(d?.error ?? "Güncellenemedi.", "error");
    }
  };

  const statuses = EDITABLE_STATUSES.includes(r.status) ? EDITABLE_STATUSES : [r.status, ...EDITABLE_STATUSES];

  return (
    <Dialog
      open
      title="Rezervasyonu düzenle"
      subtitle={r.reservation_code}
      onClose={onClose}
      width="sm:max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button variant="primary" loading={saving} onClick={save}>
            Kaydet
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Gidiş tarih ve saat" htmlFor={id("pickup")}>
            <Input
              id={id("pickup")}
              type="datetime-local"
              value={form.pickup_datetime}
              onChange={(e) => set("pickup_datetime", e.target.value)}
            />
          </Field>
          {roundTrip && (
            <Field label="Dönüş tarih ve saat" htmlFor={id("return")}>
              <Input
                id={id("return")}
                type="datetime-local"
                value={form.return_datetime}
                onChange={(e) => set("return_datetime", e.target.value)}
              />
            </Field>
          )}
          <Field label="Uçuş kodu" htmlFor={id("flight")}>
            <Input
              id={id("flight")}
              value={form.flight_code}
              onChange={(e) => set("flight_code", e.target.value)}
              placeholder="TK123"
            />
          </Field>
          <Field label="Dönüş uçuş kodu" htmlFor={id("return-flight")}>
            <Input
              id={id("return-flight")}
              value={form.return_flight_code}
              onChange={(e) => set("return_flight_code", e.target.value)}
              placeholder="TK124"
            />
          </Field>
          <Field label="Durum" htmlFor={id("status")}>
            <Select id={id("status")} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {RESERVATION_STATUS[value]?.label ?? value}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Transfer yönü">
          <div className="grid gap-2 sm:grid-cols-2">
            {DIRECTIONS.map((d) => {
              const active = form.direction === d;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set("direction", d)}
                  className={cx(
                    "rounded-adm border px-3 py-2.5 text-start transition-colors",
                    active
                      ? "border-adm-ink bg-adm-surface-2 ring-1 ring-inset ring-adm-ink"
                      : "border-adm-line hover:border-adm-line-strong hover:bg-adm-surface-2"
                  )}
                >
                  <span className="block text-[13px] font-semibold">{legRoute(d, "outbound", regionName(r))}</span>
                  <span className="mt-0.5 block text-[11.5px] text-adm-muted">
                    {d === "airport_to_region"
                      ? "Uçuşla gelen misafir, havalimanında karşılama"
                      : "Otelden alıp havalimanına bırakma"}
                  </span>
                </button>
              );
            })}
          </div>
          {roundTrip && (
            <p className="mt-1.5 text-[11.5px] text-adm-muted">
              Dönüş bacağı ters yönde: {legRoute(form.direction as Direction, "return", regionName(r))}
            </p>
          )}
        </Field>

        <Field label="Otel adı" htmlFor={id("hotel")}>
          <Input id={id("hotel")} value={form.hotel_name} onChange={(e) => set("hotel_name", e.target.value)} />
        </Field>
        <Field label="Otel adresi" htmlFor={id("address")}>
          <Input id={id("address")} value={form.hotel_address} onChange={(e) => set("hotel_address", e.target.value)} />
        </Field>
        <Field label="Notlar" htmlFor={id("notes")}>
          <Textarea id={id("notes")} rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>

        <p className="rounded-adm-sm bg-adm-surface-2 px-3 py-2 text-[11.5px] text-adm-muted">
          Saat değişikliği mevcut şoför atamalarını güncellemez. Saati değiştirdiyseniz şoförü ayrıca bilgilendirin.
        </p>
      </div>
    </Dialog>
  );
}
