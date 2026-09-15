"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Car,
  FileSpreadsheet,
  FileText,
  Megaphone,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  buttonPrimary,
  buttonSecondary,
  Card,
  Delta,
  Dialog as AdminDialog,
  dropQueryParam,
  PeriodBar,
  StatTile,
} from "@/components/admin/ui";
import { NetProfitChart, RevenueCostChart } from "@/components/admin/finance/FinanceCharts";
import FinanceEntryForm from "@/components/admin/finance/FinanceEntryForm";
import { change, type EntryKind, type FinanceCategory, type FinanceReport } from "@/lib/finance";
import { fmtDay, rangeLabel, rangeQuery, type PeriodKey } from "@/lib/period";
import { fmtCash, fmtQuote, type Rates } from "@/lib/rates";

interface Props {
  report: FinanceReport;
  categories: FinanceCategory[];
  rates: Rates;
  tablesMissing: boolean;
  period: PeriodKey | null;
  /** Open the entry dialog straight away — the Ctrl K palette's "Kasaya gider ekle". */
  openEntry?: EntryKind | null;
  adminBase: string;
}

const TRIP = (t: string) => (t === "round_trip" ? "Gidiş-dönüş" : "Tek yön");
const TRANSFERS_SHOWN = 15;

/**
 * The company's own books: what came in, what went to drivers and elsewhere,
 * and what is left. The net profit leads, because that is the question; the
 * charts, the categories and the per-transfer list are there to answer "why".
 */
export default function FinanceDashboard({
  report: r,
  categories,
  rates,
  tablesMissing,
  period,
  openEntry,
  adminBase,
}: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<EntryKind | null>(tablesMissing ? null : (openEntry ?? null));
  const [allTransfers, setAllTransfers] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const closeDialog = useCallback(() => {
    setDialog(null);
    dropQueryParam("add");
  }, []);

  const base = `${adminBase}/finance`;
  const query = rangeQuery(r.range, period);
  const exportHref = (format: "xlsx" | "pdf") => `/api/admin/finance/export?format=${format}${query ? `&${query}` : ""}`;
  const t = r.totals;
  const p = r.previous;

  const remove = async (id: string) => {
    if (!window.confirm("Bu kayıt silinsin mi?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/finance/entries?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      window.alert(body.error ?? "Silinemedi.");
      return;
    }
    router.refresh();
  };

  const transfers = allTransfers ? r.transfers : r.transfers.slice(0, TRANSFERS_SHOWN);
  const topExpense = r.expenseCategories[0];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kasa</h1>
          <p className="mt-1 text-sm text-slate-500">Kâr / zarar · tutarlar euro · {rangeLabel(r.range)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={exportHref("xlsx")} className={buttonSecondary}>
            <FileSpreadsheet size={16} className="text-emerald-600" />
            Excel
          </a>
          <a href={exportHref("pdf")} className={buttonSecondary}>
            <FileText size={16} className="text-rose-600" />
            PDF
          </a>
          <button type="button" onClick={() => setDialog("expense")} className={buttonPrimary} disabled={tablesMissing}>
            <Plus size={16} />
            Gider / gelir ekle
          </button>
        </div>
      </div>

      {tablesMissing && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            Gider girebilmek için Supabase&apos;de <strong>093 numaralı migration</strong> çalıştırılmalı. Ciro ve şoför
            maliyeti rezervasyonlardan gelmeye devam ediyor.
          </p>
        </div>
      )}

      <PeriodBar key={`${r.range.from}-${r.range.to}`} basePath={base} period={period} range={r.range} />

      {/* ── Figures ── */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className={`rounded-2xl p-5 text-white md:col-span-2 xl:col-span-2 ${t.net < 0 ? "bg-rose-600" : "bg-slate-900"}`}>
          <p className="text-xs font-medium text-white/70">Net kâr</p>
          <p className="mt-2 text-4xl font-bold tracking-tight">{fmtCash(t.net, "EUR")}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/80">
            {t.marginPct !== null && <span>Marj %{t.marginPct.toLocaleString("tr-TR")}</span>}
            {p && <Delta value={change(t.net, p.net)} onDark />}
          </div>
        </div>
        <StatTile
          icon={TrendingUp}
          label="Ciro"
          value={fmtCash(t.revenue, "EUR")}
          sub={p ? <Delta value={change(t.revenue, p.revenue)} suffix="" /> : `${t.transfers} transfer`}
        />
        <StatTile
          icon={Car}
          label="Şoför maliyeti"
          value={fmtCash(t.driverCost, "EUR")}
          sub={`Brüt kâr ${fmtCash(t.grossProfit, "EUR")}`}
        />
        <StatTile
          icon={Megaphone}
          label="Giderler"
          value={fmtCash(t.expenses, "EUR")}
          sub={topExpense ? `En büyük: ${topExpense.name}` : "Reklam vb."}
        />
        <StatTile
          icon={Wallet}
          label="Diğer gelir"
          value={fmtCash(t.otherIncome, "EUR")}
          sub={`${r.entries.filter((e) => e.kind === "income").length} kayıt`}
        />
      </div>

      {(t.missingFees > 0 || t.unconvertible > 0) && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-px shrink-0" />
          <div className="space-y-0.5">
            {t.missingFees > 0 && (
              <p>
                <strong>{t.missingFees} transferde</strong> şoför ücreti eksik; net kâr bu işlerin şoför maliyeti kadar
                yüksek görünüyor. Aşağıdaki listede işaretli.
              </p>
            )}
            {t.unconvertible > 0 && (
              <p>
                <strong>{t.unconvertible} eski transfer</strong> kur kaydı olmadığı için ciroya katılmadı.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Charts ── */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Ciro ve maliyet" subtitle="Aylık, euro">
          <RevenueCostChart months={r.months} />
        </Card>
        <Card title="Net kâr" subtitle="Aylık, euro">
          <NetProfitChart months={r.months} />
        </Card>
      </div>

      <details className="group rounded-2xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-bold text-slate-900">
          Aylık tablo
          <span className="text-xs font-semibold text-slate-400 group-open:hidden">Göster</span>
          <span className="hidden text-xs font-semibold text-slate-400 group-open:inline">Gizle</span>
        </summary>
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-5 py-2.5 text-start font-bold">Ay</th>
                <th className="px-3 py-2.5 text-end font-bold">Transfer</th>
                <th className="px-3 py-2.5 text-end font-bold">Ciro</th>
                <th className="px-3 py-2.5 text-end font-bold">Şoför</th>
                <th className="px-3 py-2.5 text-end font-bold">Gider</th>
                <th className="px-3 py-2.5 text-end font-bold">Diğer gelir</th>
                <th className="px-5 py-2.5 text-end font-bold">Net</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {r.months.map((m) => (
                <tr key={m.key} className="border-t border-slate-50">
                  <td className="px-5 py-2 font-medium text-slate-700">{m.label}</td>
                  <td className="px-3 py-2 text-end text-slate-600">{m.transfers}</td>
                  <td className="px-3 py-2 text-end text-slate-700">{fmtCash(m.revenue, "EUR")}</td>
                  <td className="px-3 py-2 text-end text-slate-600">{fmtCash(m.driverCost, "EUR")}</td>
                  <td className="px-3 py-2 text-end text-slate-600">{fmtCash(m.expenses, "EUR")}</td>
                  <td className="px-3 py-2 text-end text-slate-600">{fmtCash(m.otherIncome, "EUR")}</td>
                  <td className={`px-5 py-2 text-end font-bold ${m.net < 0 ? "text-rose-600" : "text-slate-900"}`}>
                    {fmtCash(m.net, "EUR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* ── Categories and entries ── */}
      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card title="Gider dağılımı" subtitle={`Toplam ${fmtCash(t.expenses, "EUR")}`}>
            {r.expenseCategories.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Bu dönemde gider girilmemiş.</p>
            ) : (
              <ul className="space-y-3.5">
                {r.expenseCategories.map((c) => (
                  <li key={c.name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-700">{c.name}</span>
                      <span className="tabular-nums font-semibold text-slate-900">{fmtCash(c.total, "EUR")}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(2, c.share * 100)}%`, backgroundColor: "#eb6834" }}
                        />
                      </div>
                      <span className="w-20 text-end text-[11px] text-slate-400">
                        %{Math.round(c.share * 100)} · {c.count} kayıt
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {r.incomeCategories.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-semibold text-slate-500">Diğer gelirler</p>
                <ul className="space-y-1.5 text-sm">
                  {r.incomeCategories.map((c) => (
                    <li key={c.name} className="flex justify-between">
                      <span className="text-slate-600">{c.name}</span>
                      <span className="tabular-nums font-semibold text-slate-900">{fmtCash(c.total, "EUR")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card
            title="Gelir ve giderler"
            subtitle="Elle girilen kayıtlar"
            flush
            actions={
              <>
                <button
                  type="button"
                  onClick={() => setDialog("expense")}
                  disabled={tablesMissing}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  + Gider
                </button>
                <button
                  type="button"
                  onClick={() => setDialog("income")}
                  disabled={tablesMissing}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                >
                  + Gelir
                </button>
              </>
            }
          >
            {r.entries.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-400">Bu dönemde kayıt yok.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {r.entries.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        e.kind === "income" ? "bg-sky-50 text-sky-700" : "bg-orange-50 text-orange-700"
                      }`}
                      aria-label={e.kind === "income" ? "Gelir" : "Gider"}
                    >
                      {e.kind === "income" ? "+" : "−"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {e.category}
                        {e.description && <span className="font-normal text-slate-500"> · {e.description}</span>}
                      </p>
                      <p className="text-xs text-slate-400">
                        {fmtDay(e.day)}
                        {e.currency !== "EUR" &&
                          ` · ${fmtCash(e.amount, e.currency)} · ${fmtQuote(e.currency, "EUR", 1 / e.eurPerUnit)}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        e.kind === "income" ? "text-slate-900" : "text-slate-900"
                      }`}
                    >
                      {e.kind === "income" ? "+" : "−"}
                      {fmtCash(e.amountEur, "EUR")}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(e.id)}
                      disabled={deleting === e.id}
                      aria-label="Kaydı sil"
                      className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* ── Transfers ── */}
      <Card
        title="Transfer bazında kâr"
        subtitle={`${r.transfers.length} transfer · transfer tarihine göre`}
        flush
      >
        {r.transfers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Bu dönemde transfer yok.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-2.5 text-start font-bold">Tarih</th>
                    <th className="px-3 py-2.5 text-start font-bold">Kod</th>
                    <th className="px-3 py-2.5 text-start font-bold">Bölge</th>
                    <th className="px-3 py-2.5 text-start font-bold">Şoför</th>
                    <th className="px-3 py-2.5 text-end font-bold">Ciro</th>
                    <th className="px-3 py-2.5 text-end font-bold">Şoför maliyeti</th>
                    <th className="px-5 py-2.5 text-end font-bold">Kâr</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((x) => (
                    <tr key={x.id} className={`border-b border-slate-50 last:border-0 ${x.missingFee ? "bg-amber-50/40" : ""}`}>
                      <td className="whitespace-nowrap px-5 py-2.5 text-xs text-slate-500">
                        {fmtDay(x.day)} <span className="text-slate-400">{x.time}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`${adminBase}/reservations/${encodeURIComponent(x.code)}`}
                          className="font-mono text-xs font-semibold text-slate-700 hover:text-blue-600"
                        >
                          {x.code}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">
                        {x.region}
                        <span className="ms-1.5 text-slate-400">
                          {TRIP(x.tripType)}
                          {x.payment === "cash" && " · nakit"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-600">{x.drivers.join(", ") || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums text-slate-800">
                        {x.fareEur === null ? <span className="text-amber-700">kur yok</span> : fmtCash(x.fareEur, "EUR")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums text-slate-600">
                        {fmtCash(x.driverCostEur, "EUR")}
                        {x.missingFee && <div className="text-[10px] font-semibold text-amber-700">ücret eksik</div>}
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-2.5 text-end font-bold tabular-nums ${
                          (x.profitEur ?? 0) < 0 ? "text-rose-600" : "text-slate-900"
                        }`}
                      >
                        {x.profitEur === null ? "—" : fmtCash(x.profitEur, "EUR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {r.transfers.length > TRANSFERS_SHOWN && (
              <button
                type="button"
                onClick={() => setAllTransfers((v) => !v)}
                className="w-full border-t border-slate-100 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              >
                {allTransfers ? "Daha az göster" : `Tümünü göster (${r.transfers.length})`}
              </button>
            )}
          </>
        )}
      </Card>

      <AdminDialog
        open={dialog !== null}
        onClose={closeDialog}
        title={dialog === "income" ? "Gelir ekle" : "Gider ekle"}
        subtitle="Girildiği para biriminde saklanır, o günün kuruyla euroya çevrilir."
      >
        {dialog && (
          <FinanceEntryForm
            key={dialog}
            kind={dialog}
            categories={categories}
            rates={rates}
            today={r.today}
            onDone={closeDialog}
            onCancel={closeDialog}
          />
        )}
      </AdminDialog>
    </div>
  );
}
