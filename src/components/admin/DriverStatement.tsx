"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, FileSpreadsheet, FileText, Phone, Plus, Trash2 } from "lucide-react";
import {
  Avatar,
  buttonPrimary,
  buttonSecondary,
  Dialog as AdminDialog,
  PeriodBar,
} from "@/components/admin/ui";
import DriverPaymentForm from "@/components/admin/DriverPaymentForm";
import {
  balanceStatus,
  fmtDay,
  fmtMoney,
  LEDGER_TYPE_LABEL,
  rangeLabel,
  rangeQuery,
  rateText,
  TRIP_LABEL,
  type JobRow,
  type LegCell,
  type MovementRow,
  type PeriodKey,
  type Statement,
} from "@/lib/driverStatement";
import type { Rates } from "@/lib/rates";

interface Props {
  statement: Statement;
  period: PeriodKey | null;
  rates: Rates;
  adminBase: string;
}

const HERO = {
  owe: "bg-amber-50 ring-amber-200 text-amber-950",
  owed: "bg-rose-50 ring-rose-200 text-rose-950",
  closed: "bg-emerald-50 ring-emerald-200 text-emerald-950",
};

const TYPE_BADGE = {
  earning: "bg-slate-100 text-slate-700",
  payment: "bg-emerald-50 text-emerald-700",
  adjustment: "bg-amber-50 text-amber-700",
};

type Tab = "jobs" | "movements";

/**
 * One driver's account: who owes whom today, then the period's jobs — every
 * booking with what it brought in and what it cost — and its movements with a
 * running balance. Recording a payment is a dialog, so the page underneath
 * stays put and updates when it closes.
 */
export default function DriverStatement({ statement: s, period, rates, adminBase }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("jobs");
  const [paying, setPaying] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const closeDialog = useCallback(() => setPaying(false), []);

  const base = `${adminBase}/driver-payments/${s.driver.id}`;
  const query = rangeQuery(s.range, period);
  const exportHref = (format: "xlsx" | "pdf") =>
    `/api/admin/driver-statement?driverId=${s.driver.id}&format=${format}${query ? `&${query}` : ""}`;

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
  const reservationOptions = [...s.jobs].reverse().map((j) => ({ id: j.reservationId, code: `${j.code} · ${fmtDay(j.day)}` }));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <Link
          href={`${adminBase}/driver-payments`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={13} />
          Şoför ödemeleri
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={s.driver.name} size="lg" />
            <div className="min-w-0">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
                {s.driver.name}
                {!s.driver.active && (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">pasif</span>
                )}
              </h1>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-slate-500">
                <span>Cari ekstre</span>
                {s.driver.phone && (
                  <a href={`tel:${s.driver.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 hover:text-slate-900">
                    <Phone size={13} />
                    {s.driver.phone}
                  </a>
                )}
              </p>
            </div>
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
            <button type="button" onClick={() => setPaying(true)} className={buttonPrimary}>
              <Plus size={16} />
              Ödeme yap
            </button>
          </div>
        </div>
      </div>

      {/* ── Today's balance ── */}
      <div className={`flex flex-wrap items-end justify-between gap-4 rounded-2xl px-6 py-5 ring-1 ${HERO[status.tone]}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Bugün itibarıyla</p>
          <p className="mt-1 text-sm font-semibold">{status.label}</p>
          <p className="text-4xl font-bold tracking-tight">{fmtMoney(Math.abs(s.current.balance), "USD")}</p>
        </div>
        <div className="space-y-0.5 text-xs opacity-80 sm:text-end">
          {s.current.upcoming !== 0 && <p>İleri tarihli işlerden {fmtMoney(s.current.upcoming, "USD")} daha gelecek</p>}
          {s.current.lastPaymentDay && <p>Son elden ödeme {fmtDay(s.current.lastPaymentDay)}</p>}
          <p>Bu ay {s.current.monthJobs} iş · {fmtMoney(s.current.monthPaid, "USD")} ödendi</p>
        </div>
      </div>

      {/* ── Period ── */}
      <div className="space-y-3">
        <PeriodBar key={`${s.range.from}-${s.range.to}`} basePath={base} period={period} range={s.range} />
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-200 sm:grid-cols-5">
          <Figure label="Devreden" value={fmtMoney(s.opening, "USD")} />
          <Figure label="Hak ediş" value={fmtMoney(s.periodTotals.earnings, "USD")} />
          <Figure label="Ödenen" value={fmtMoney(s.periodTotals.payments, "USD")} />
          <Figure label="Düzeltme" value={fmtMoney(s.periodTotals.adjustments, "USD")} />
          {/* Fifth of five: a whole row on a phone rather than a half with a grey hole beside it. */}
          <div className="col-span-2 sm:col-span-1">
            <Figure label={`Dönem sonu · ${rangeLabel(s.range)}`} value={fmtMoney(s.closing, "USD")} strong />
          </div>
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

      {/* ── Tabs ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 pt-2">
          <div role="tablist" className="flex gap-1">
            {(
              [
                ["jobs", "İşler", s.jobs.length],
                ["movements", "Hareketler", s.movements.length],
              ] as [Tab, string, number][]
            ).map(([key, label, count]) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                  tab === key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                {label} <span className="ms-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">{count}</span>
              </button>
            ))}
          </div>
          {tab === "jobs" ? (
            <p className="px-2 pb-2 text-xs text-slate-500">
              Müşteriden {fmtMoney(s.jobTotals.fareEur, "EUR")} · şoförlere {fmtMoney(s.jobTotals.feesEur, "EUR")} ·{" "}
              <span className="font-semibold text-slate-900">bize kalan {fmtMoney(s.jobTotals.marginEur, "EUR")}</span>
            </p>
          ) : (
            <p className="px-2 pb-2 text-xs text-slate-500">Hesap dolar; € ve ₺ kendi günlerinin kuruyla çevrilir</p>
          )}
        </div>

        {tab === "jobs" ? <Jobs statement={s} adminBase={adminBase} /> : <Movements statement={s} deleting={deleting} onDelete={remove} />}
      </section>

      <AdminDialog
        open={paying}
        onClose={closeDialog}
        title={`Ödeme yap · ${s.driver.name}`}
        subtitle="Hesap dolar tutulur; € ve ₺ günün kuruyla çevrilir."
      >
        {paying && (
          <DriverPaymentForm
            driverId={s.driver.id}
            reservations={reservationOptions}
            rates={rates}
            today={s.today}
            onDone={closeDialog}
            onCancel={closeDialog}
          />
        )}
      </AdminDialog>
    </div>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="bg-white px-4 py-3">
      <p className="truncate text-[11px] font-semibold text-slate-400">{label}</p>
      <p className={`mt-1 text-lg ${strong ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>{value}</p>
    </div>
  );
}

function LegFee({ cell }: { cell: LegCell | null }) {
  if (!cell) return <span className="text-slate-300">—</span>;
  return (
    <span className={cell.mine ? "text-slate-900" : "text-slate-400"}>
      {cell.fee === null ? (
        <span className="text-xs font-semibold text-amber-700">ücret yok</span>
      ) : (
        <span className="tabular-nums">{fmtMoney(cell.fee, cell.currency)}</span>
      )}
      {!cell.mine && <span className="block text-[10px] leading-tight">{cell.driverName}</span>}
    </span>
  );
}

const plates = (j: JobRow) => [...new Set([j.outbound, j.ret].filter((c) => c?.mine && c.plate).map((c) => c!.plate!))];

function Margin({ job: j }: { job: JobRow }) {
  if (j.marginEur === null) return <span className="text-xs font-semibold text-amber-700">eksik</span>;
  return (
    <span className={`font-bold tabular-nums ${j.marginEur < 0 ? "text-rose-600" : "text-slate-900"}`}>
      {fmtMoney(j.marginEur, "EUR")}
    </span>
  );
}

function Jobs({ statement: s, adminBase }: { statement: Statement; adminBase: string }) {
  if (s.jobs.length === 0) return <p className="px-5 py-12 text-center text-sm text-slate-400">Bu dönemde iş yok.</p>;
  const reservationHref = (code: string) => `${adminBase}/reservations/${encodeURIComponent(code)}`;

  return (
    <>
      {/* Phones: a card per job. */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {s.jobs.map((j) => (
          <li key={j.reservationId} className="space-y-2 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={reservationHref(j.code)} className="font-mono text-sm font-bold text-slate-900">
                  {j.code}
                </Link>
                <p className="text-xs text-slate-500">
                  {fmtDay(j.day)} {j.time} · {TRIP_LABEL(j.tripType)}
                </p>
              </div>
              <Margin job={j} />
            </div>
            <p className="text-sm text-slate-700">{j.route}</p>
            <p className="text-xs text-slate-500">
              {[j.hotel, j.flightOut && `Uçuş ${j.flightOut}`, j.flightReturn && `Dönüş ${j.flightReturn}`, plates(j).join(" / ")]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <dl className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
              <div>
                <dt className="text-slate-400">Müşteriden</dt>
                <dd className="font-semibold text-slate-800">{fmtMoney(j.fare.value, j.fare.currency)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Gidiş</dt>
                <dd className="font-semibold"><LegFee cell={j.outbound} /></dd>
              </div>
              <div>
                <dt className="text-slate-400">Dönüş</dt>
                <dd className="font-semibold">{j.tripType === "round_trip" ? <LegFee cell={j.ret} /> : "—"}</dd>
              </div>
            </dl>
            {j.cash && (
              <p className="text-xs text-slate-500">
                Nakit tahsilat {fmtMoney(j.cash.value, j.cash.currency)}
                {!j.cash.collectedByMe && " (diğer şoför)"}
              </p>
            )}
          </li>
        ))}
      </ul>

      {/* Wider screens: the full table. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
              <th className="px-5 py-2.5 text-start font-bold">Tarih</th>
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
              <th className="px-5 py-2.5 text-end font-bold">Şoföre</th>
            </tr>
          </thead>
          <tbody>
            {s.jobs.map((j) => (
              <tr key={j.reservationId} className="border-b border-slate-50 align-top last:border-0 hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                  {fmtDay(j.day)}
                  <div className="text-slate-400">{j.time}</div>
                </td>
                <td className="px-3 py-3">
                  <Link href={reservationHref(j.code)} className="font-mono text-xs font-semibold text-slate-700 hover:text-blue-600">
                    {j.code}
                  </Link>
                </td>
                <td className="px-3 py-3 text-xs">
                  <span className="font-semibold text-slate-800">{TRIP_LABEL(j.tripType)}</span>
                  <div className="text-slate-500">{j.route}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-600">
                  {j.flightOut ?? "—"}
                  {j.flightReturn && <div className="text-slate-400">D: {j.flightReturn}</div>}
                </td>
                <td className="max-w-[180px] px-3 py-3 text-xs text-slate-600">{j.hotel ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-600">
                  {plates(j).length ? plates(j).map((p) => <div key={p}>{p}</div>) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-end tabular-nums text-slate-800">
                  {fmtMoney(j.fare.value, j.fare.currency)}
                  {j.payment === "cash" && <div className="text-[10px] font-semibold text-slate-400">nakit</div>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-end"><LegFee cell={j.outbound} /></td>
                <td className="whitespace-nowrap px-3 py-3 text-end">
                  {j.tripType === "round_trip" ? <LegFee cell={j.ret} /> : <span className="text-slate-300">—</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-end tabular-nums text-slate-700">
                  {j.cash ? (
                    <>
                      {fmtMoney(j.cash.value, j.cash.currency)}
                      {!j.cash.collectedByMe && <div className="text-[10px] text-slate-400">diğer şoför</div>}
                    </>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-end"><Margin job={j} /></td>
                <td className="whitespace-nowrap px-5 py-3 text-end tabular-nums text-slate-800">
                  {j.driverNetUsd === null ? <span className="text-slate-300">—</span> : fmtMoney(j.driverNetUsd, "USD")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
              <td className="px-5 py-3" colSpan={6}>
                {s.jobTotals.count} transfer
              </td>
              <td className="px-3 py-3 text-end tabular-nums">{fmtMoney(s.jobTotals.fareEur, "EUR")}</td>
              <td className="px-3 py-3" colSpan={3} />
              <td className="px-3 py-3 text-end tabular-nums">{fmtMoney(s.jobTotals.marginEur, "EUR")}</td>
              <td className="px-5 py-3 text-end tabular-nums">{fmtMoney(s.jobTotals.driverNetUsd, "USD")}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

function Amount({ m }: { m: MovementRow }) {
  return (
    <span
      className={`font-bold tabular-nums ${
        m.usd === null ? "text-amber-700" : m.usd < 0 ? "text-emerald-700" : "text-slate-900"
      }`}
    >
      {m.usd === null ? "kur yok" : `${m.usd > 0 ? "+" : ""}${fmtMoney(m.usd, "USD")}`}
    </span>
  );
}

function Original({ m }: { m: MovementRow }) {
  if (!m.original) return null;
  return (
    <>
      {fmtMoney(m.original.amount, m.original.currency)}
      {m.rate !== null && <span className="text-slate-400"> · {rateText(m.original.currency, m.rate)}</span>}
    </>
  );
}

function Movements({
  statement: s,
  deleting,
  onDelete,
}: {
  statement: Statement;
  deleting: string | null;
  onDelete: (id: string) => void;
}) {
  const DeleteButton = ({ m }: { m: MovementRow }) =>
    m.manual ? (
      <button
        type="button"
        onClick={() => onDelete(m.id)}
        disabled={deleting === m.id}
        aria-label="Hareketi sil"
        className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
      >
        <Trash2 size={14} />
      </button>
    ) : null;

  return (
    <>
      <div className="flex items-center justify-between bg-slate-50 px-5 py-2.5 text-xs text-slate-500">
        <span>Devreden bakiye</span>
        <span className="font-semibold tabular-nums text-slate-800">{fmtMoney(s.opening, "USD")}</span>
      </div>

      {s.movements.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-400">Bu dönemde hareket yok.</p>
      ) : (
        <>
          {/* Phones */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {s.movements.map((m) => (
              <li key={m.id} className={`flex items-start gap-3 px-4 py-3 ${m.upcoming ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-slate-800">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[m.type]}`}>
                      {LEDGER_TYPE_LABEL[m.type]}
                    </span>
                    <span className="truncate">{m.description}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {fmtDay(m.day)} {m.time}
                    {m.upcoming && " · ileri tarihli"}
                  </p>
                  {m.original && (
                    <p className="text-xs text-slate-500">
                      <Original m={m} />
                    </p>
                  )}
                </div>
                <div className="text-end">
                  <Amount m={m} />
                  <p className="text-[11px] tabular-nums text-slate-400">{fmtMoney(m.balance, "USD")}</p>
                </div>
                <DeleteButton m={m} />
              </li>
            ))}
          </ul>

          {/* Wider screens */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-2.5 text-start font-bold">Tarih</th>
                  <th className="px-3 py-2.5 text-start font-bold">Tür</th>
                  <th className="px-3 py-2.5 text-start font-bold">Açıklama</th>
                  <th className="px-3 py-2.5 text-end font-bold">Asıl tutar</th>
                  <th className="px-3 py-2.5 text-end font-bold">Tutar ($)</th>
                  <th className="px-3 py-2.5 text-end font-bold">Bakiye ($)</th>
                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {s.movements.map((m) => (
                  <tr key={m.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/60 ${m.upcoming ? "text-slate-400" : ""}`}>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                      {fmtDay(m.day)} <span className="text-slate-400">{m.time}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${TYPE_BADGE[m.type]}`}>
                        {LEDGER_TYPE_LABEL[m.type]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      {m.description}
                      {!m.manual && <span className="ms-1.5 text-[10px] text-slate-400">otomatik</span>}
                      {m.upcoming && <span className="ms-1.5 text-[10px] text-slate-400">ileri tarihli</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-end text-xs tabular-nums text-slate-500">
                      <Original m={m} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-end">
                      <Amount m={m} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-end tabular-nums text-slate-700">{fmtMoney(m.balance, "USD")}</td>
                    <td className="px-3 py-3 text-end">
                      <DeleteButton m={m} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-900">
        <span>Dönem sonu bakiye</span>
        <span className="tabular-nums">{fmtMoney(s.closing, "USD")}</span>
      </div>
    </>
  );
}
