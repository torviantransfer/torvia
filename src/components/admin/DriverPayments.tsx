"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, X } from "lucide-react";

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  is_active: boolean;
}

interface Payment {
  id: string;
  driver_id: string;
  reservation_id: string | null;
  type: "earning" | "payment" | "adjustment";
  amount: number;
  description: string | null;
  created_at: string;
  drivers: { full_name: string } | null;
  reservations: { reservation_code: string } | null;
}

interface Balance {
  earnings: number;
  payments: number;
  adjustments: number;
  balance: number;
}

interface Props {
  drivers: Driver[];
  payments: Payment[];
  balances: Record<string, Balance>;
}

/** The ledger's three kinds, in Turkish. The table used to print the raw enum. */
const TYPE_LABEL: Record<Payment["type"], string> = {
  earning: "Kazanç",
  payment: "Ödeme",
  adjustment: "Düzeltme",
};

const usd = (v: number) =>
  `$${v.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Zero reads as noise in a money column; a dash says "nothing here". */
const usdOrDash = (v: number) => (v === 0 ? "—" : usd(v));

const fmtStamp = (iso: string) =>
  new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function DriverPayments({ drivers, payments, balances }: Props) {
  const [selectedDriver, setSelectedDriver] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    driverId: "",
    type: "payment" as Payment["type"],
    amount: "",
    description: "",
  });
  const router = useRouter();

  const blank: Balance = { earnings: 0, payments: 0, adjustments: 0, balance: 0 };

  /**
   * Whoever is owed most, first. A ledger read top-to-bottom should answer
   * "who do I need to pay" before anything else; alphabetical order answered
   * a question nobody was asking.
   *
   * Inactive drivers are folded away rather than dropped — one may still be
   * owed money, and hiding a debt is worse than a longer list.
   */
  const rows = useMemo(() => {
    const visible = drivers.filter((d) => d.is_active || showInactive);
    return visible
      .map((d) => ({ driver: d, b: balances[d.id] ?? blank }))
      .sort((a, b) => b.b.balance - a.b.balance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers, balances, showInactive]);

  const inactiveCount = drivers.filter((d) => !d.is_active).length;

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, { b }) => ({
          earnings: acc.earnings + b.earnings,
          payments: acc.payments + b.payments,
          balance: acc.balance + b.balance,
        }),
        { earnings: 0, payments: 0, balance: 0 }
      ),
    [rows]
  );

  const filteredPayments =
    selectedDriver === "all"
      ? payments
      : payments.filter((p) => p.driver_id === selectedDriver);

  const selectedName = drivers.find((d) => d.id === selectedDriver)?.full_name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/driver-payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverId: formData.driverId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setFormData({ driverId: "", type: "payment", amount: "", description: "" });
      router.refresh();
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Drivers ─────────────────────────────────────────────────────────
          A table rather than a grid of cards. One card per driver meant ten
          drivers filled a screen with thirty numbers and still no total, and
          nothing showed that the cards were the filter for the list below. */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <Users size={16} className="text-slate-400" />
            Şoförler
          </h2>
          {inactiveCount > 0 && (
            <button
              onClick={() => setShowInactive((v) => !v)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              {showInactive
                ? "Pasifleri gizle"
                : `Pasif ${inactiveCount} şoförü göster`}
            </button>
          )}
        </header>

        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            Kayıtlı şoför yok.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-2.5 text-start font-bold">Şoför</th>
                  <th className="px-3 py-2.5 text-end font-bold">Kazanç</th>
                  <th className="px-3 py-2.5 text-end font-bold">Ödenen</th>
                  <th className="px-5 py-2.5 text-end font-bold">Kalan borç</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ driver: d, b }) => {
                  const active = selectedDriver === d.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDriver(active ? "all" : d.id)}
                      className={`cursor-pointer border-b border-slate-50 last:border-0 ${
                        active ? "bg-slate-900/[0.04]" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-5 py-3">
                        <span className="font-semibold text-slate-900">
                          {d.full_name}
                        </span>
                        {!d.is_active && (
                          <span className="ms-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            pasif
                          </span>
                        )}
                        {d.phone && (
                          <span className="ms-2 text-xs text-slate-400">{d.phone}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-end tabular-nums text-slate-600">
                        {usdOrDash(b.earnings)}
                      </td>
                      <td className="px-3 py-3 text-end tabular-nums text-slate-600">
                        {usdOrDash(b.payments)}
                      </td>
                      <td className="px-5 py-3 text-end">
                        {b.balance === 0 ? (
                          <span className="text-slate-300">—</span>
                        ) : b.balance > 0 ? (
                          <span className="font-bold tabular-nums text-slate-900">
                            {usd(b.balance)}
                          </span>
                        ) : (
                          <span
                            className="font-bold tabular-nums text-rose-600"
                            title="Anlaşılandan fazla ödenmiş"
                          >
                            {usd(b.balance)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 text-sm font-bold text-slate-900">
                  <td className="px-5 py-3">{rows.length} şoför</td>
                  <td className="px-3 py-3 text-end tabular-nums">
                    {usdOrDash(totals.earnings)}
                  </td>
                  <td className="px-3 py-3 text-end tabular-nums">
                    {usdOrDash(totals.payments)}
                  </td>
                  <td className="px-5 py-3 text-end tabular-nums">
                    {usdOrDash(totals.balance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ── Ledger ───────────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">İşlem Geçmişi</h2>
            {selectedName && (
              <button
                onClick={() => setSelectedDriver("all")}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white"
              >
                {selectedName}
                <X size={11} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={14} />
            İşlem Ekle
          </button>
        </header>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="grid gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <select
              value={formData.driverId}
              onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
              required
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="">Şoför seçin</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as Payment["type"] })
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="payment">Şoföre ödeme</option>
              <option value="earning">Kazanç</option>
              <option value="adjustment">Düzeltme</option>
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Tutar ($)"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Açıklama"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              <button
                type="submit"
                disabled={saving}
                className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "…" : "Kaydet"}
              </button>
            </div>
          </form>
        )}

        {filteredPayments.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            {selectedName ? `${selectedName} için işlem yok.` : "İşlem bulunamadı."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-2.5 text-start font-bold">Tarih</th>
                  <th className="px-3 py-2.5 text-start font-bold">Şoför</th>
                  <th className="px-3 py-2.5 text-start font-bold">Tür</th>
                  <th className="px-3 py-2.5 text-start font-bold">Açıklama</th>
                  <th className="px-5 py-2.5 text-end font-bold">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  // Earnings and adjustments increase what we owe; a payment
                  // settles it. The sign is the whole story of a ledger row.
                  const adds = p.type === "earning" || p.type === "adjustment";
                  return (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0">
                      <td className="whitespace-nowrap px-5 py-2.5 text-xs text-slate-500">
                        {fmtStamp(p.created_at)}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-700">
                        {p.drivers?.full_name ?? "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            p.type === "earning"
                              ? "bg-slate-100 text-slate-700"
                              : p.type === "payment"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {TYPE_LABEL[p.type]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">
                        {p.reservations?.reservation_code && (
                          <span className="me-1.5 font-mono font-semibold text-slate-600">
                            {p.reservations.reservation_code}
                          </span>
                        )}
                        {p.description || (p.reservations?.reservation_code ? "" : "—")}
                      </td>
                      <td
                        className={`px-5 py-2.5 text-end font-bold tabular-nums ${
                          adds ? "text-slate-900" : "text-emerald-700"
                        }`}
                      >
                        {adds ? "+" : "−"}
                        {usd(p.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
