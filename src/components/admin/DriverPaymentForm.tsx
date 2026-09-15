"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCOUNT_CURRENCY, type LedgerType } from "@/lib/driverStatement";
import {
  CASH,
  CASH_SYMBOL,
  convertQuoted,
  defaultQuote,
  fmtCash,
  fmtQuote,
  quotePair,
  type Cash,
  type Rates,
} from "@/lib/rates";

interface Props {
  /** Offer a driver picker. Left out on a driver's own account, where `driverId` is fixed. */
  drivers?: { id: string; full_name: string }[];
  driverId?: string;
  /** Jobs a movement can be tied to. */
  reservations?: { id: string; code: string }[];
  rates: Rates | null;
  today: string;
  onDone?: () => void;
  onCancel?: () => void;
}

const TYPES: { key: LedgerType; label: string; hint: string }[] = [
  { key: "payment", label: "Ödeme yaptım", hint: "Şoföre verdiğiniz para; borcunuzdan düşer." },
  { key: "earning", label: "Hak ediş", hint: "Rezervasyona bağlı olmayan bir iş için şoföre borç yazar." },
  { key: "adjustment", label: "Düzeltme", hint: "Artı borcu artırır, eksi (ceza, avans) borçtan düşer." },
];

const label = "mb-1.5 block text-xs font-semibold text-adm-ink-2";
const field =
  "w-full rounded-adm border border-adm-line bg-adm-surface px-3 py-2.5 text-sm text-adm-ink outline-none transition focus:border-[#c9c8c2] focus:ring-4 focus:ring-adm-ink/5";

/** Today's rate as the input wants it: a dot decimal, to the places the pair is quoted in. */
function rateInput(currency: Cash, rates: Rates | null): string {
  const quoted = rates ? defaultQuote(currency, ACCOUNT_CURRENCY, rates) : null;
  if (!quoted) return "";
  const places = quotePair(currency, ACCOUNT_CURRENCY).quote === "TRY" ? 100 : 10000;
  return String(Math.round(quoted * places) / places);
}

/**
 * One movement on a driver's account, in dollars, euro or lira.
 *
 * A foreign amount is converted at the day's rate, prefilled from the settings
 * screen and left editable for the times a round rate was agreed with the
 * driver in person. The conversion is spelled out before saving, because a
 * wrong rate is much easier to catch as "3.500,00 ₺ ÷ 41,20 = $84,95" than as a
 * balance that is slightly off a week later.
 */
export default function DriverPaymentForm({ drivers, driverId, reservations, rates, today, onDone, onCancel }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    driverId: driverId ?? "",
    type: "payment" as LedgerType,
    amount: "",
    currency: "USD" as Cash,
    rate: "",
    date: today,
    description: "",
    reservationId: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const pickCurrency = (currency: Cash) =>
    setForm((f) => ({ ...f, currency, rate: currency === ACCOUNT_CURRENCY ? "" : rateInput(currency, rates) }));

  const pair = quotePair(form.currency, ACCOUNT_CURRENCY);
  const todayQuote = form.currency === ACCOUNT_CURRENCY || !rates ? null : defaultQuote(form.currency, ACCOUNT_CURRENCY, rates);

  const preview = useMemo(() => {
    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount === 0) return null;
    const signed = form.type === "adjustment" ? amount : Math.abs(amount);

    let usd = signed;
    let conversion = "";
    if (form.currency !== ACCOUNT_CURRENCY) {
      const quoted = Number(form.rate);
      if (!Number.isFinite(quoted) || quoted <= 0) return { text: "Kur yazılmalı.", warn: true };
      usd = convertQuoted(signed, form.currency, ACCOUNT_CURRENCY, quoted);
      conversion = `${fmtCash(signed, form.currency)} · ${fmtQuote(form.currency, ACCOUNT_CURRENCY, quoted)} → ${fmtCash(usd, "USD")}`;
    }
    const effect = form.type === "payment" ? -Math.abs(usd) : usd;
    return {
      conversion,
      text: `${fmtCash(Math.abs(effect), ACCOUNT_CURRENCY)} ${effect < 0 ? "şoföre borcunuzdan düşülecek" : "şoföre borcunuza eklenecek"}`,
      warn: false,
    };
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
          exchangeRate: form.currency === ACCOUNT_CURRENCY ? undefined : Number(form.rate),
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
    <form onSubmit={submit} className="space-y-4">
      {drivers && (
        <div>
          <label className={label} htmlFor="pay-driver">Şoför</label>
          <select
            id="pay-driver"
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
        </div>
      )}

      <div>
        <span className={label}>İşlem</span>
        <div className="grid grid-cols-3 gap-1 rounded-adm bg-adm-line-2 p-1">
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => set("type", t.key)}
              className={`rounded-adm-sm px-2 py-2 text-xs font-semibold transition ${
                form.type === t.key ? "bg-adm-surface text-adm-ink shadow-sm" : "text-adm-muted hover:text-adm-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-adm-muted">{TYPES.find((t) => t.key === form.type)?.hint}</p>
      </div>

      <div>
        <label className={label} htmlFor="pay-amount">Tutar</label>
        <div className="flex gap-2">
          <input
            id="pay-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={form.type === "adjustment" ? undefined : "0"}
            placeholder="0,00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            required
            className={`${field} min-w-0 flex-1 text-lg font-semibold`}
          />
          <div className="flex shrink-0 rounded-adm bg-adm-line-2 p-1">
            {CASH.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pickCurrency(c)}
                aria-pressed={form.currency === c}
                className={`w-10 rounded-adm-sm text-sm font-bold transition ${
                  form.currency === c ? "bg-adm-ink text-white" : "text-adm-muted hover:text-adm-ink"
                }`}
              >
                {CASH_SYMBOL[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {form.currency !== ACCOUNT_CURRENCY && (
        <div className="rounded-adm border border-adm-line bg-adm-surface-2 p-3">
          <div className="flex items-center gap-2 text-sm text-adm-ink-2">
            <span className="shrink-0 font-semibold">1 {CASH_SYMBOL[pair.base]} =</span>
            <input
              type="number"
              inputMode="decimal"
              step={pair.quote === "TRY" ? "0.01" : "0.0001"}
              min="0"
              value={form.rate}
              onChange={(e) => set("rate", e.target.value)}
              required
              aria-label="Kur"
              className={`${field} min-w-0 flex-1 py-2`}
            />
            <span className="shrink-0 font-semibold">{CASH_SYMBOL[pair.quote]}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-adm-muted">
            <span>
              {todayQuote
                ? `Günlük kur (Ayarlar): ${fmtQuote(form.currency, ACCOUNT_CURRENCY, todayQuote)}`
                : "Günlük kur bulunamadı; kuru elle yazın."}
            </span>
            {todayQuote && (
              <button
                type="button"
                onClick={() => set("rate", rateInput(form.currency, rates))}
                className="font-semibold text-adm-ink-2 hover:text-adm-ink"
              >
                Günlük kura dön
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="pay-date">Tarih</label>
          <input
            id="pay-date"
            type="date"
            value={form.date}
            max={today}
            onChange={(e) => set("date", e.target.value)}
            required
            className={field}
          />
        </div>
        {reservations && reservations.length > 0 && (
          <div>
            <label className={label} htmlFor="pay-reservation">Rezervasyon <span className="font-normal text-adm-muted">(isteğe bağlı)</span></label>
            <select
              id="pay-reservation"
              value={form.reservationId}
              onChange={(e) => set("reservationId", e.target.value)}
              className={field}
            >
              <option value="">Bağlama</option>
              {reservations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className={label} htmlFor="pay-note">Açıklama <span className="font-normal text-adm-muted">(isteğe bağlı)</span></label>
        <input
          id="pay-note"
          type="text"
          placeholder="Örn. elden ödeme, havale"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={field}
        />
      </div>

      <div
        className={`rounded-adm px-3.5 py-3 text-sm ${
          preview?.warn ? "bg-adm-amber-soft text-adm-amber" : preview ? "bg-adm-ink text-white" : "bg-adm-surface-2 text-adm-muted"
        }`}
        aria-live="polite"
      >
        {preview ? (
          <>
            {preview.conversion && <p className="text-xs opacity-70">{preview.conversion}</p>}
            <p className="font-semibold">{preview.text}</p>
          </>
        ) : (
          "Tutarı yazınca hesaba etkisi burada görünür. Hesap dolar tutulur."
        )}
      </div>

      {error && <p className="text-sm font-semibold text-adm-rose">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-adm px-4 py-2.5 text-sm font-semibold text-adm-ink-2 hover:bg-adm-line-2"
          >
            Vazgeç
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-adm bg-adm-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-adm-ink-hover disabled:opacity-50"
        >
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
