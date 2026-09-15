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
  PageHeader,
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
      <PageHeader
        title="Kasa"
        description={`Kâr / zarar · tutarlar euro · ${rangeLabel(r.range)}`}
        actions={
          <>
            <a href={exportHref("xlsx")} className={buttonSecondary}>
              <FileSpreadsheet size={16} className="text-adm-green" />
              Excel
            </a>
            <a href={exportHref("pdf")} className={buttonSecondary}>
              <FileText size={16} className="text-adm-rose" />
              PDF
            </a>
            <button type="button" onClick={() => setDialog("expense")} className={buttonPrimary} disabled={tablesMissing}>
              <Plus size={16} />
              Gider / gelir ekle
            </button>
          </>
        }
      />

      {tablesMissing && (
        <div className="flex items-start gap-2 rounded-adm border border-adm-amber-line bg-adm-amber-soft px-4 py-3 text-sm text-adm-amber">
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
        <div className={`rounded-adm-lg p-5 text-white md:col-span-2 xl:col-span-2 ${t.net < 0 ? "bg-adm-rose" : "bg-adm-ink"}`}>
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
        <div className="flex items-start gap-2 rounded-adm border border-adm-amber-line bg-adm-amber-soft px-4 py-3 text-xs text-adm-amber">
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

      <details className="group rounded-adm-lg border border-adm-line bg-adm-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3.5 text-sm font-bold text-adm-ink">
          Aylık tablo
          <span className="text-xs font-semibold text-adm-muted group-open:hidden">Göster</span>
          <span className="hidden text-xs font-semibold text-adm-muted group-open:inline">Gizle</span>
        </summary>
        <div className="overflow-x-auto border-t border-adm-line-2">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-adm-muted">
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
                <tr key={m.key} className="border-t border-adm-line-2">
                  <td className="px-5 py-2 font-medium text-adm-ink-2">{m.label}</td>
                  <td className="px-3 py-2 text-end text-adm-ink-2">{m.transfers}</td>
                  <td className="px-3 py-2 text-end text-adm-ink-2">{fmtCash(m.revenue, "EUR")}</td>
                  <td className="px-3 py-2 text-end text-adm-ink-2">{fmtCash(m.driverCost, "EUR")}</td>
                  <td className="px-3 py-2 text-end text-adm-ink-2">{fmtCash(m.expenses, "EUR")}</td>
                  <td className="px-3 py-2 text-end text-adm-ink-2">{fmtCash(m.otherIncome, "EUR")}</td>
                  <td className={`px-5 py-2 text-end font-bold ${m.net < 0 ? "text-adm-rose" : "text-adm-ink"}`}>
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
              <p className="py-6 text-center text-sm text-adm-muted">Bu dönemde gider girilmemiş.</p>
            ) : (
              <ul className="space-y-3.5">
                {r.expenseCategories.map((c) => (
                  <li key={c.name}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-adm-ink-2">{c.name}</span>
                      <span className="tabular-nums font-semibold text-adm-ink">{fmtCash(c.total, "EUR")}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-adm-line-2">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(2, c.share * 100)}%`, backgroundColor: "#eb6834" }}
                        />
                      </div>
                      <span className="w-20 text-end text-[11px] text-adm-muted">
                        %{Math.round(c.share * 100)} · {c.count} kayıt
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {r.incomeCategories.length > 0 && (
              <div className="mt-5 border-t border-adm-line-2 pt-4">
                <p className="mb-2 text-xs font-semibold text-adm-muted">Diğer gelirler</p>
                <ul className="space-y-1.5 text-sm">
                  {r.incomeCategories.map((c) => (
                    <li key={c.name} className="flex justify-between">
                      <span className="text-adm-ink-2">{c.name}</span>
                      <span className="tabular-nums font-semibold text-adm-ink">{fmtCash(c.total, "EUR")}</span>
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
                  className="rounded-adm-sm px-2.5 py-1.5 text-xs font-semibold text-adm-ink-2 hover:bg-adm-line-2 disabled:opacity-40"
                >
                  + Gider
                </button>
                <button
                  type="button"
                  onClick={() => setDialog("income")}
                  disabled={tablesMissing}
                  className="rounded-adm-sm px-2.5 py-1.5 text-xs font-semibold text-adm-ink-2 hover:bg-adm-line-2 disabled:opacity-40"
                >
                  + Gelir
                </button>
              </>
            }
          >
            {r.entries.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-adm-muted">Bu dönemde kayıt yok.</p>
            ) : (
              <ul className="divide-y divide-adm-line-2">
                {r.entries.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        e.kind === "income" ? "bg-adm-green-soft text-adm-green" : "bg-adm-amber-soft text-adm-amber"
                      }`}
                      aria-label={e.kind === "income" ? "Gelir" : "Gider"}
                    >
                      {e.kind === "income" ? "+" : "−"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-adm-ink">
                        {e.category}
                        {e.description && <span className="font-normal text-adm-muted"> · {e.description}</span>}
                      </p>
                      <p className="text-xs text-adm-muted">
                        {fmtDay(e.day)}
                        {e.currency !== "EUR" &&
                          ` · ${fmtCash(e.amount, e.currency)} · ${fmtQuote(e.currency, "EUR", 1 / e.eurPerUnit)}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        e.kind === "income" ? "text-adm-ink" : "text-adm-ink"
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
                      className="shrink-0 rounded-adm-sm p-1.5 text-adm-faint hover:bg-adm-rose-soft hover:text-adm-rose disabled:opacity-40"
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
          <p className="px-5 py-10 text-center text-sm text-adm-muted">Bu dönemde transfer yok.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-adm-line-2 text-[11px] uppercase tracking-wider text-adm-muted">
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
                    <tr key={x.id} className={`border-b border-adm-line-2 last:border-0 ${x.missingFee ? "bg-adm-amber-soft/40" : ""}`}>
                      <td className="whitespace-nowrap px-5 py-2.5 text-xs text-adm-muted">
                        {fmtDay(x.day)} <span className="text-adm-muted">{x.time}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`${adminBase}/reservations/${encodeURIComponent(x.code)}`}
                          className="font-mono text-xs font-semibold text-adm-ink-2 hover:text-adm-brand-ink"
                        >
                          {x.code}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-adm-ink-2">
                        {x.region}
                        <span className="ms-1.5 text-adm-muted">
                          {TRIP(x.tripType)}
                          {x.payment === "cash" && " · nakit"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-adm-ink-2">{x.drivers.join(", ") || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums text-adm-ink">
                        {x.fareEur === null ? <span className="text-adm-amber">kur yok</span> : fmtCash(x.fareEur, "EUR")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums text-adm-ink-2">
                        {fmtCash(x.driverCostEur, "EUR")}
                        {x.missingFee && <div className="text-[10px] font-semibold text-adm-amber">ücret eksik</div>}
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-2.5 text-end font-bold tabular-nums ${
                          (x.profitEur ?? 0) < 0 ? "text-adm-rose" : "text-adm-ink"
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
                className="w-full border-t border-adm-line-2 py-3 text-xs font-semibold text-adm-muted hover:bg-adm-surface-2 hover:text-adm-ink"
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
