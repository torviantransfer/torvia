"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { EntryKind, FinanceCategory } from "@/lib/finance";
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
  categories: FinanceCategory[];
  rates: Rates;
  today: string;
  kind: EntryKind;
  onDone?: () => void;
  onCancel?: () => void;
}

const label = "mb-1.5 block text-xs font-semibold text-adm-ink-2";
const field =
  "w-full rounded-adm border border-adm-line bg-adm-surface px-3 py-2.5 text-sm text-adm-ink outline-none transition focus:border-[#c9c8c2] focus:ring-4 focus:ring-adm-ink/[0.06]";

function rateInput(currency: Cash, rates: Rates): string {
  const quoted = defaultQuote(currency, "EUR", rates);
  if (!quoted) return "";
  const places = quotePair(currency, "EUR").quote === "TRY" ? 100 : 10000;
  return String(Math.round(quoted * places) / places);
}

/**
 * One income or expense for the finance screen — an advertising invoice, a
 * commission, a one-off income. Paid in lira or dollars, it is shown in euro
 * before it is saved, at the day's rate unless the bank's own is typed in.
 */
export default function FinanceEntryForm({ categories: initial, rates, today, kind: initialKind, onDone, onCancel }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [form, setForm] = useState({
    kind: initialKind,
    categoryId: "",
    amount: "",
    currency: "EUR" as Cash,
    rate: "",
    date: today,
    description: "",
  });
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const options = categories.filter((c) => c.kind === form.kind && c.is_active);
  const pair = quotePair(form.currency, "EUR");
  const todayQuote = form.currency === "EUR" ? null : defaultQuote(form.currency, "EUR", rates);

  const preview = useMemo(() => {
    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) return null;
    if (form.currency === "EUR") return fmtCash(amount, "EUR");
    const quoted = Number(form.rate);
    if (!Number.isFinite(quoted) || quoted <= 0) return null;
    return `${fmtCash(amount, form.currency)} · ${fmtQuote(form.currency, "EUR", quoted)} → ${fmtCash(
      convertQuoted(amount, form.currency, "EUR", quoted),
      "EUR"
    )}`;
  }, [form.amount, form.currency, form.rate]);

  const addCategory = async () => {
    if (!newCategory?.trim()) return;
    setError(null);
    const res = await fetch("/api/admin/finance/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory, kind: form.kind }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Kategori eklenemedi.");
      return;
    }
    const category = body.category as FinanceCategory;
    setCategories((list) => (list.some((c) => c.id === category.id) ? list : [...list, category]));
    set("categoryId", category.id);
    setNewCategory(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/finance/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: form.kind,
          categoryId: form.categoryId || undefined,
          amount: Number(form.amount),
          currency: form.currency,
          exchangeRate: form.currency === "EUR" ? undefined : Number(form.rate),
          date: form.date,
          description: form.description,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Kaydedilemedi.");
        return;
      }
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
      <div className="grid grid-cols-2 gap-1 rounded-adm bg-adm-line-2 p-1">
        {(["expense", "income"] as EntryKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setForm((f) => ({ ...f, kind: k, categoryId: "" }))}
            className={`rounded-adm-sm py-2 text-sm font-semibold transition ${
              form.kind === k ? "bg-adm-surface text-adm-ink shadow-sm" : "text-adm-muted hover:text-adm-ink"
            }`}
          >
            {k === "expense" ? "Gider" : "Gelir"}
          </button>
        ))}
      </div>

      <div>
        <label className={label} htmlFor="fin-category">Kategori</label>
        {newCategory === null ? (
          <div className="flex gap-2">
            <select
              id="fin-category"
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              required
              className={`${field} min-w-0 flex-1`}
            >
              <option value="">Kategori seçin</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setNewCategory("")}
              className="inline-flex shrink-0 items-center gap-1 rounded-adm border border-adm-line px-3 text-xs font-semibold text-adm-ink-2 hover:bg-adm-surface-2"
            >
              <Plus size={14} />
              Yeni
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder={form.kind === "expense" ? "Örn. Yakıt, Muhasebe" : "Örn. Acente komisyonu"}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              className={`${field} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={addCategory}
              className="shrink-0 rounded-adm bg-adm-ink px-3 text-xs font-semibold text-white hover:bg-adm-ink-hover"
            >
              Ekle
            </button>
            <button
              type="button"
              onClick={() => setNewCategory(null)}
              className="shrink-0 rounded-adm px-2 text-xs font-semibold text-adm-muted hover:bg-adm-line-2"
            >
              Vazgeç
            </button>
          </div>
        )}
      </div>

      <div>
        <label className={label} htmlFor="fin-amount">Tutar</label>
        <div className="flex gap-2">
          <input
            id="fin-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
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
                onClick={() => setForm((f) => ({ ...f, currency: c, rate: c === "EUR" ? "" : rateInput(c, rates) }))}
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

      {form.currency !== "EUR" && (
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
          <p className="mt-2 text-[11px] text-adm-muted">
            {todayQuote
              ? `Günlük kur (Ayarlar): ${fmtQuote(form.currency, "EUR", todayQuote)}`
              : "Günlük kur bulunamadı; kuru elle yazın."}
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="fin-date">Tarih</label>
          <input
            id="fin-date"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            required
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="fin-note">Açıklama <span className="font-normal text-adm-muted">(isteğe bağlı)</span></label>
          <input
            id="fin-note"
            type="text"
            placeholder="Örn. Eylül kampanyası"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={field}
          />
        </div>
      </div>

      <div
        aria-live="polite"
        className={`rounded-adm px-3.5 py-3 text-sm ${preview ? "bg-adm-ink text-white" : "bg-adm-surface-2 text-adm-muted"}`}
      >
        {preview ? (
          <>
            <p className="text-xs opacity-70">Kasaya {form.kind === "expense" ? "gider" : "gelir"} olarak yazılacak</p>
            <p className="font-semibold">{preview}</p>
          </>
        ) : (
          "Tutarı yazınca euro karşılığı burada görünür."
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
