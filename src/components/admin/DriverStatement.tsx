"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, FileSpreadsheet, FileText, Plus, Trash2 } from "lucide-react";
import DriverPaymentForm from "@/components/admin/DriverPaymentForm";
import {
  balanceStatus,
  fmtDay,
  fmtMoney,
  fmtRate,
  LEDGER_TYPE_LABEL,
  PERIODS,
  rangeLabel,
  rangeQuery,
  TRIP_LABEL,
  type JobRow,
  type LegCell,
  type PeriodKey,
  type Statement,
} from "@/lib/driverStatement";

interface Props {
  statement: Statement;
  period: PeriodKey | null;
  usdRate: { rate: number; updatedAt: string | null } | null;
  adminBase: string;
}

const TONE = {
  owe: "border-amber-200 bg-amber-50 text-amber-900",
  owed: "border-rose-200 bg-rose-50 text-rose-900",
  closed: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

/**
 * One driver's account: every job with what it brought in and what it cost,
 * then every movement on the account with a running balance, and at the top
 * the one answer the screen exists for — who owes whom, and how much.
 */
export default function DriverStatement({ statement: s, period, usdRate, adminBase }: Props) {
  const router = useRouter();
  const base = `${adminBase}/driver-payments/${s.driver.id}`;
  const [from, setFrom] = useState(s.range.from ?? "");
  const [to, setTo] = useState(s.range.to ?? "");
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const query = rangeQuery(s.range, period);
  const exportHref = (format: "xlsx" | "pdf") =>
    `/api/admin/driver-statement?driverId=${s.driver.id}&format=${format}${query ? `&${query}` : ""}`;

  const applyCustom = () => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    router.push(q.toString() ? `${base}?${q}` : `${base}?period=all`);
  };

  const remove = async (id: string) => {
    if (!window.confirm("Bu hareket silinsin mi?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/driver-payments?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      window.alert(body.error ?? "Silinemedi.");
      return;
    }
    router.refresh();
  };

  const status = balanceStatus(s.current.balance);
  const reservationOptions = [...s.jobs]
    .reverse()
    .map((j) => ({ id: j.reservationId, code: `${j.code} · ${fmtDay(j.day)}` }));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={`${adminBase}/driver-payments`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft size={13} />
            Şoför ödemeleri
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {s.driver.name}
            {!s.driver.active && (
              <span className="ms-2 align-middle rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                pasif
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500">
            Cari ekstre · {rangeLabel(s.range)}
            {s.driver.phone && ` · ${s.driver.phone}`}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={exportHref("xlsx")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            Excel indir
          </a>
          <a
            href={exportHref("pdf")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileText size={14} className="text-rose-600" />
            PDF indir
          </a>
        </div>
      </div>

      {/* ── Period ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`${base}?period=${p.key}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              period === p.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {p.label}
          </Link>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
        />
        <span className="text-xs text-slate-400">–</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
        />
        <button
          onClick={applyCustom}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
            period === null ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Uygula
        </button>
      </div>

      {/* ── Balance ── */}
      <div className="grid gap-3 lg:grid-cols-[1.3fr_2fr]">
        <div className={`rounded-2xl border px-5 py-4 ${TONE[status.tone]}`}>
          <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">Bugün itibarıyla</p>
          <p className="mt-1 text-sm font-semibold">{status.label}</p>
          <p className="text-3xl font-bold tabular-nums">{fmtMoney(Math.abs(s.current.balance), "USD")}</p>
          {s.current.upcoming !== 0 && (
            <p className="mt-1 text-xs opacity-80">
              İleri tarihli işlerden {fmtMoney(s.current.upcoming, "USD")} daha var; iş günü gelince bakiyeye girer.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:grid-cols-5">
          <Tile label="Devreden" value={fmtMoney(s.opening, "USD")} />
          <Tile label="Hak ediş" value={fmtMoney(s.periodTotals.earnings, "USD")} />
          <Tile label="Ödenen" value={fmtMoney(s.periodTotals.payments, "USD")} />
          <Tile label="Düzeltme" value={fmtMoney(s.periodTotals.adjustments, "USD")} />
          <Tile label="Dönem sonu" value={fmtMoney(s.closing, "USD")} strong />
        </div>
      </div>

      {(s.current.unconvertible > 0 || s.jobTotals.incomplete > 0) && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-px shrink-0" />
          <div className="space-y-0.5">
            {s.jobTotals.incomplete > 0 && (
              <p>
                <strong>{s.jobTotals.incomplete} işte</strong> şoför ücreti eksik; bu işler euro toplamlarına katılmadı.
              </p>
            )}
            {s.current.unconvertible > 0 && (
              <p>
                <strong>{s.current.unconvertible} harekette</strong> dolara çevirecek kur yok; bakiyeye katılmadı.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Jobs ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">İşler</h2>
          <p className="text-xs text-slate-500">
            {s.jobTotals.count} transfer · müşteriden {fmtMoney(s.jobTotals.fareEur, "EUR")} · şoförlere{" "}
            {fmtMoney(s.jobTotals.feesEur, "EUR")} ·{" "}
            <span className="font-semibold text-emerald-700">bize kalan {fmtMoney(s.jobTotals.marginEur, "EUR")}</span>
          </p>
        </header>
        {s.jobs.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Bu dönemde iş yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-2.5 text-start font-bold">Tarih</th>
                  <th className="px-3 py-2.5 text-start font-bold">Kod</th>
                  <th className="px-3 py-2.5 text-start font-bold">Tür / güzergah</th>
                  <th className="px-3 py-2.5 text-start font-bold">Uçuş</th>
                  <th className="px-3 py-2.5 text-start font-bold">Otel</th>
                  <th className="px-3 py-2.5 text-start font-bold">Plaka</th>
                  <th className="px-3 py-2.5 text-end font-bold">Müşteriden</th>
                  <th className="px-3 py-2.5 text-end font-bold">Gidiş</th>
                  <th className="px-3 py-2.5 text-end font-bold">Dönüş</th>
                  <th className="px-3 py-2.5 text-end font-bold">Nakit</th>
                  <th className="px-3 py-2.5 text-end font-bold">Bize kalan</th>
                  <th className="px-4 py-2.5 text-end font-bold">Şoföre</th>
                </tr>
              </thead>
              <tbody>
                {s.jobs.map((j) => (
                  <JobLine key={j.reservationId} job={j} adminBase={adminBase} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                  <td className="px-4 py-3" colSpan={6}>
                    {s.jobTotals.count} transfer
                  </td>
                  <td className="px-3 py-3 text-end tabular-nums">{fmtMoney(s.jobTotals.fareEur, "EUR")}</td>
                  <td className="px-3 py-3" colSpan={3} />
                  <td className="px-3 py-3 text-end tabular-nums text-emerald-700">
                    {fmtMoney(s.jobTotals.marginEur, "EUR")}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">{fmtMoney(s.jobTotals.driverNetUsd, "USD")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ── Movements ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">Hareketler</h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={14} />
            Ödeme / düzeltme ekle
          </button>
        </header>

        {showForm && (
          <DriverPaymentForm
            driverId={s.driver.id}
            reservations={reservationOptions}
            usdRate={usdRate}
            today={s.today}
            onDone={() => setShowForm(false)}
          />
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-2.5 text-start font-bold">Tarih</th>
                <th className="px-3 py-2.5 text-start font-bold">Tür</th>
                <th className="px-3 py-2.5 text-start font-bold">Açıklama</th>
                <th className="px-3 py-2.5 text-end font-bold">Asıl tutar</th>
                <th className="px-3 py-2.5 text-end font-bold">Tutar ($)</th>
                <th className="px-3 py-2.5 text-end font-bold">Bakiye ($)</th>
                <th className="w-10 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50 bg-slate-50/60 text-xs italic text-slate-500">
                <td className="px-4 py-2" colSpan={5}>
                  Devreden bakiye
                </td>
                <td className="px-3 py-2 text-end font-semibold not-italic tabular-nums text-slate-700">
                  {fmtMoney(s.opening, "USD")}
                </td>
                <td />
              </tr>
              {s.movements.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-400">
                    Bu dönemde hareket yok.
                  </td>
                </tr>
              )}
              {s.movements.map((m) => (
                <tr
                  key={m.id}
                  className={`border-b border-slate-50 last:border-0 ${m.upcoming ? "text-slate-400" : ""}`}
                >
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">
                    {fmtDay(m.day)} <span className="text-slate-400">{m.time}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        m.type === "earning"
                          ? "bg-slate-100 text-slate-700"
                          : m.type === "payment"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {LEDGER_TYPE_LABEL[m.type]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">
                    {m.description}
                    {!m.manual && <span className="ms-1.5 text-[10px] text-slate-400">otomatik</span>}
                    {m.upcoming && <span className="ms-1.5 text-[10px] text-slate-400">ileri tarihli</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-end text-xs tabular-nums text-slate-500">
                    {m.original && (
                      <>
                        {fmtMoney(m.original.amount, m.original.currency)}
                        {m.rate !== null && <span className="text-slate-400"> × {fmtRate(m.rate)}</span>}
                      </>
                    )}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 text-end font-bold tabular-nums ${
                      m.usd === null ? "text-amber-700" : m.usd < 0 ? "text-emerald-700" : "text-slate-900"
                    }`}
                  >
                    {m.usd === null ? "kur yok" : `${m.usd > 0 ? "+" : ""}${fmtMoney(m.usd, "USD")}`}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums text-slate-700">
                    {fmtMoney(m.balance, "USD")}
                  </td>
                  <td className="px-3 py-2.5 text-end">
                    {m.manual && (
                      <button
                        onClick={() => remove(m.id)}
                        disabled={deleting === m.id}
                        title="Sil"
                        className="text-slate-300 hover:text-rose-600 disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                <td className="px-4 py-3" colSpan={5}>
                  Dönem sonu bakiye
                </td>
                <td className="px-3 py-3 text-end tabular-nums">{fmtMoney(s.closing, "USD")}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
          Hesap dolar tutulur. Euro tutarlar kendi günlerinin kuruyla çevrilir: şoför ücreti rezervasyon gününün,
          ödeme ödeme gününün kuruyla. Otomatik satırlar rezervasyondaki şoför ücretinden gelir ve oradan değişir.
        </p>
      </section>
    </div>
  );
}

function Tile({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-lg tabular-nums ${strong ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
        {value}
      </p>
    </div>
  );
}

function LegFee({ cell }: { cell: LegCell | null }) {
  if (!cell) return <span className="text-slate-300">—</span>;
  return (
    <div className={cell.mine ? "text-slate-900" : "text-slate-400"}>
      {cell.fee === null ? (
        <span className="text-xs font-semibold text-amber-700">ücret yok</span>
      ) : (
        <span className="tabular-nums">{fmtMoney(cell.fee, cell.currency)}</span>
      )}
      {!cell.mine && <div className="text-[10px] leading-tight">{cell.driverName}</div>}
    </div>
  );
}

function JobLine({ job: j, adminBase }: { job: JobRow; adminBase: string }) {
  const plates = [...new Set([j.outbound, j.ret].filter((c) => c?.mine && c.plate).map((c) => c!.plate))];
  return (
    <tr className="border-b border-slate-50 align-top last:border-0">
      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-600">
        {fmtDay(j.day)}
        <div className="text-slate-400">{j.time}</div>
      </td>
      <td className="px-3 py-2.5">
        <Link
          href={`${adminBase}/reservations/${encodeURIComponent(j.code)}`}
          className="font-mono text-xs font-semibold text-slate-700 hover:text-blue-600"
        >
          {j.code}
        </Link>
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-600">
        <span className="font-semibold text-slate-800">{TRIP_LABEL(j.tripType)}</span>
        <div className="text-slate-500">{j.route}</div>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-600">
        {j.flightOut ?? "—"}
        {j.flightReturn && <div className="text-slate-400">D: {j.flightReturn}</div>}
      </td>
      <td className="max-w-[180px] px-3 py-2.5 text-xs text-slate-600">{j.hotel ?? "—"}</td>
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-600">
        {plates.length ? plates.map((p) => <div key={p}>{p}</div>) : "—"}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums text-slate-800">
        {fmtMoney(j.fare.value, j.fare.currency)}
        {j.payment === "cash" && <div className="text-[10px] font-semibold text-slate-400">nakit</div>}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-end">
        <LegFee cell={j.outbound} />
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-end">
        {j.tripType === "round_trip" ? <LegFee cell={j.ret} /> : <span className="text-slate-300">—</span>}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-end tabular-nums text-slate-700">
        {j.cash ? (
          <>
            {fmtMoney(j.cash.value, j.cash.currency)}
            {!j.cash.collectedByMe && <div className="text-[10px] text-slate-400">diğer şoför</div>}
          </>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-end">
        {j.marginEur === null ? (
          <span className="text-xs font-semibold text-amber-700">eksik</span>
        ) : (
          <span className={`font-bold tabular-nums ${j.marginEur < 0 ? "text-rose-600" : "text-emerald-700"}`}>
            {fmtMoney(j.marginEur, "EUR")}
          </span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-2.5 text-end tabular-nums text-slate-800">
        {j.driverNetUsd === null ? <span className="text-slate-300">—</span> : fmtMoney(j.driverNetUsd, "USD")}
      </td>
    </tr>
  );
}
