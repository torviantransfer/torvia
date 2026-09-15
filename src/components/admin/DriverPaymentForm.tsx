"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Settlement } from "@/lib/currency";
import { ACCOUNT_CURRENCY, fmtMoney, fmtRate, type LedgerType } from "@/lib/driverStatement";

interface Props {
  /** Offer a driver picker. Left out on a driver's own account, where `driverId` is fixed. */
  drivers?: { id: string; full_name: string }[];
  driverId?: string;
  /** Jobs a movement can be tied to. */
  reservations?: { id: string; code: string }[];
  usdRate: { rate: number; updatedAt: string | null } | null;
  today: string;
  onDone?: () => void;
}

const field =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10";

/**
 * One movement on a driver's account, in dollars or in euro.
 *
 * Euro is converted at the day's rate, prefilled from the settings screen and
 * left editable for the times a round rate was agreed with the driver in
 * person. The conversion is spelled out before saving, because a wrong rate is
 * much easier to catch as "€85 × 1,1612 = $98,70" than as a balance that is
 * slightly off a week later.
 */
export default function DriverPaymentForm({ drivers, driverId, reservations, usdRate, today, onDone }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    driverId: driverId ?? "",
    type: "payment" as LedgerType,
    amount: "",
    currency: "USD" as Settlement,
    rate: usdRate ? String(usdRate.rate) : "",
    date: today,
    description: "",
    reservationId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const preview = useMemo(() => {
    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount === 0) return null;
    const signed = form.type === "adjustment" ? amount : Math.abs(amount);

    let usd = signed;
    let conversion = "";
    if (form.currency === "EUR") {
      const rate = Number(form.rate);
      if (!Number.isFinite(rate) || rate <= 0) return { text: "Euro için kur yazılmalı.", warn: true };
      usd = Math.round(signed * rate * 100) / 100;
      conversion = `${fmtMoney(signed, "EUR")} × ${fmtRate(rate)} = ${fmtMoney(usd, "USD")} · `;
    }

    const effect = form.type === "payment" ? -Math.abs(usd) : usd;
    const verb = effect < 0 ? "şoföre borcunuzdan düşülecek" : "şoföre borcunuza eklenecek";
    return { text: `${conversion}${fmtMoney(Math.abs(effect), ACCOUNT_CURRENCY)} ${verb}.`, warn: false };
  }, [form.amount, form.currency, form.rate, form.type]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/driver-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: form.driverId,
          type: form.type,
          amount: Number(form.amount),
          currency: form.currency,
          exchangeRate: form.currency === "EUR" ? Number(form.rate) : undefined,
          paidAt: form.date,
          description: form.description,
          reservationId: form.reservationId || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Kaydedilemedi.");
        return;
      }
      setForm((f) => ({ ...f, amount: "", description: "", reservationId: "" }));
      onDone?.();
      router.refresh();
    } catch {
      setError("Bağlantı hatası, tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {drivers && (
          <select
            value={form.driverId}
            onChange={(e) => set("driverId", e.target.value)}
            required
            className={field}
          >
            <option value="">Şoför seçin</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
        )}

        <select
          value={form.type}
          onChange={(e) => set("type", e.target.value as LedgerType)}
          className={field}
        >
          <option value="payment">Şoföre ödeme</option>
          <option value="earning">Hak ediş (elle)</option>
          <option value="adjustment">Düzeltme (+ / −)</option>
        </select>

        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min={form.type === "adjustment" ? undefined : "0"}
            placeholder={form.type === "adjustment" ? "Tutar (− düşer)" : "Tutar"}
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            required
            className={`${field} min-w-0 flex-1`}
          />
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-semibold">
            {(["USD", "EUR"] as Settlement[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("currency", c)}
                className={`px-3 ${form.currency === c ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                {c === "USD" ? "$" : "€"}
              </button>
            ))}
          </div>
        </div>

        <input
          type="date"
          value={form.date}
          max={today}
          onChange={(e) => set("date", e.target.value)}
          required
          className={field}
          title="İşlem tarihi"
        />

        {form.currency === "EUR" && (
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <span className="shrink-0">1 € =</span>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={form.rate}
              onChange={(e) => set("rate", e.target.value)}
              required
              className={`${field} min-w-0 flex-1`}
            />
            <span className="shrink-0">$</span>
          </label>
        )}

        {reservations && reservations.length > 0 && (
          <select
            value={form.reservationId}
            onChange={(e) => set("reservationId", e.target.value)}
            className={field}
          >
            <option value="">Rezervasyon (isteğe bağlı)</option>
            {reservations.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder="Açıklama"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={`${field} ${form.currency === "EUR" && !(reservations && reservations.length > 0) ? "lg:col-span-2" : ""}`}
        />

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className={preview?.warn ? "text-amber-700" : "text-slate-600"}>
          {preview?.text ?? "Hesap dolar tutulur; euro tutar kurla çevrilip yazılır."}
        </p>
        {form.currency === "EUR" && usdRate && (
          <p className="text-slate-400">
            Günlük kur (Ayarlar): 1 € = {fmtRate(usdRate.rate)} $
            {usdRate.updatedAt &&
              ` · ${new Date(usdRate.updatedAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`}
          </p>
        )}
      </div>
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
    </form>
  );
}
