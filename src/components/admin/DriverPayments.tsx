"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Users } from "lucide-react";
import DriverPaymentForm from "@/components/admin/DriverPaymentForm";
import {
  balanceStatus,
  fmtDay,
  fmtMoney,
  fmtRate,
  LEDGER_TYPE_LABEL,
  ledgerEffect,
  ledgerWhen,
  type LedgerListRow,
  type LedgerSummary,
} from "@/lib/driverStatement";

interface Driver {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
}

interface Props {
  drivers: Driver[];
  payments: LedgerListRow[];
  balances: Record<string, LedgerSummary>;
  usdRate: { rate: number; updatedAt: string | null } | null;
  today: string;
  adminBase: string;
}

const EMPTY: LedgerSummary = { earnings: 0, payments: 0, adjustments: 0, balance: 0, upcoming: 0, unconvertible: 0 };

/** Zero reads as noise in a money column; a dash says "nothing here". */
const usdOrDash = (v: number) => (v === 0 ? "—" : fmtMoney(v, "USD"));

export default function DriverPayments({ drivers, payments, balances, usdRate, today, adminBase }: Props) {
  const router = useRouter();
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const statementHref = (id: string) => `${adminBase}/driver-payments/${id}`;

  /**
   * Whoever is owed most, first. A ledger read top-to-bottom should answer
   * "who do I need to pay" before anything else; alphabetical order answered
   * a question nobody was asking.
   *
   * Inactive drivers are folded away rather than dropped — one may still be
   * owed money, and hiding a debt is worse than a longer list.
   */
  const rows = useMemo(
    () =>
      drivers
        .filter((d) => d.is_active || showInactive)
        .map((d) => ({ driver: d, b: balances[d.id] ?? EMPTY }))
        .sort((a, b) => b.b.balance - a.b.balance),
    [drivers, balances, showInactive]
  );

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

  return (
    <div className="space-y-8">
      {/* ── Drivers ─────────────────────────────────────────────────────────
          A row per driver, and the row opens that driver's own account: every
          job with its fare and fees, every payment, and the files to send. */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <Users size={16} className="text-slate-400" />
            Şoförler
            <span className="text-xs font-normal text-slate-400">— cari hesabı açmak için şoföre tıklayın</span>
          </h2>
          {inactiveCount > 0 && (
            <button
              onClick={() => setShowInactive((v) => !v)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              {showInactive ? "Pasifleri gizle" : `Pasif ${inactiveCount} şoförü göster`}
            </button>
          )}
        </header>

        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Kayıtlı şoför yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-2.5 text-start font-bold">Şoför</th>
                  <th className="px-3 py-2.5 text-end font-bold">Hak ediş</th>
                  <th className="px-3 py-2.5 text-end font-bold">Ödenen</th>
                  <th className="px-3 py-2.5 text-end font-bold">Bakiye</th>
                  <th className="w-10 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ driver: d, b }) => {
                  const status = balanceStatus(b.balance);
                  return (
                    <tr
                      key={d.id}
                      onClick={() => router.push(statementHref(d.id))}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={statementHref(d.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-slate-900 hover:text-blue-600"
                        >
                          {d.full_name}
                        </Link>
                        {!d.is_active && (
                          <span className="ms-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            pasif
                          </span>
                        )}
                        {d.phone && <span className="ms-2 text-xs text-slate-400">{d.phone}</span>}
                      </td>
                      <td className="px-3 py-3 text-end tabular-nums text-slate-600">{usdOrDash(b.earnings)}</td>
                      <td className="px-3 py-3 text-end tabular-nums text-slate-600">{usdOrDash(b.payments)}</td>
                      <td className="px-3 py-3 text-end">
                        {status.tone === "closed" ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <span
                            className={`font-bold tabular-nums ${status.tone === "owe" ? "text-slate-900" : "text-rose-600"}`}
                            title={status.label}
                          >
                            {fmtMoney(b.balance, "USD")}
                          </span>
                        )}
                        {b.upcoming !== 0 && (
                          <div className="text-[10px] text-slate-400">+{fmtMoney(b.upcoming, "USD")} ileri tarihli</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-end text-slate-300">
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 text-sm font-bold text-slate-900">
                  <td className="px-5 py-3">{rows.length} şoför</td>
                  <td className="px-3 py-3 text-end tabular-nums">{usdOrDash(totals.earnings)}</td>
                  <td className="px-3 py-3 text-end tabular-nums">{usdOrDash(totals.payments)}</td>
                  <td className="px-3 py-3 text-end tabular-nums">{usdOrDash(totals.balance)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="border-t border-slate-100 px-5 py-2.5 text-[11px] text-slate-400">
          Bakiye bugüne kadarki hareketlerden, dolar olarak: artı şoföre borcunuz, eksi şoförün size borcu.
        </p>
      </section>

      {/* ── Ledger ───────────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Son İşlemler</h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={14} />
            İşlem Ekle
          </button>
        </header>

        {showForm && (
          <DriverPaymentForm
            drivers={drivers}
            usdRate={usdRate}
            today={today}
            onDone={() => setShowForm(false)}
          />
        )}

        {payments.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">İşlem bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
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
                {payments.map((p) => {
                  const effect = ledgerEffect(p);
                  const when = ledgerWhen(p);
                  return (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0">
                      <td className="whitespace-nowrap px-5 py-2.5 text-xs text-slate-500">
                        {fmtDay(when.day)} <span className="text-slate-400">{when.time}</span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-700">
                        {p.drivers?.full_name ? (
                          <Link href={statementHref(p.driver_id)} className="hover:text-blue-600">
                            {p.drivers.full_name}
                          </Link>
                        ) : (
                          "—"
                        )}
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
                          {LEDGER_TYPE_LABEL[p.type]}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">
                        {p.reservations?.reservation_code && !p.description?.includes(p.reservations.reservation_code) && (
                          <span className="me-1.5 font-mono font-semibold text-slate-600">
                            {p.reservations.reservation_code}
                          </span>
                        )}
                        {p.description || (p.reservations?.reservation_code ? "" : "—")}
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-2.5 text-end font-bold tabular-nums ${
                          effect.usd === null ? "text-amber-700" : effect.usd < 0 ? "text-emerald-700" : "text-slate-900"
                        }`}
                      >
                        {effect.usd === null ? "kur yok" : `${effect.usd > 0 ? "+" : ""}${fmtMoney(effect.usd, "USD")}`}
                        {effect.original && (
                          <div className="text-[10px] font-normal text-slate-400">
                            {fmtMoney(effect.original.amount, effect.original.currency)}
                            {effect.rate !== null && ` × ${fmtRate(effect.rate)}`}
                          </div>
                        )}
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
