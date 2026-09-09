"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import { formatBookingDateShort } from "@/lib/datetime";

/** Assignment statuses that represent a job still standing. */
const LIVE = ["assigned", "accepted", "picked_up", "completed"];

export interface EarningsAssignment {
  id: string;
  leg: string;
  status: string;
  driver_fee: number | null;
  drivers: { full_name: string } | null;
}

export interface EarningsReservation {
  id: string;
  reservation_code: string;
  pickup_datetime: string;
  total_price: number;
  trip_type: string;
  payment_method: string | null;
  regions: { name_tr: string | null; name_en: string | null } | null;
  driver_assignments: EarningsAssignment[];
}

type PeriodKey = "this_month" | "last_month" | "last_3" | "this_year" | "all";

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "this_month", label: "Bu ay" },
  { key: "last_month", label: "Geçen ay" },
  { key: "last_3", label: "Son 3 ay" },
  { key: "this_year", label: "Bu yıl" },
  { key: "all", label: "Tümü" },
];

/** Inclusive start, exclusive end. `null` end means "up to now and beyond". */
function periodRange(key: PeriodKey): { from: Date | null; to: Date | null } {
  const now = new Date();
  const monthStart = (offset: number) =>
    new Date(now.getFullYear(), now.getMonth() + offset, 1);

  switch (key) {
    case "this_month":
      return { from: monthStart(0), to: monthStart(1) };
    case "last_month":
      return { from: monthStart(-1), to: monthStart(0) };
    case "last_3":
      return { from: monthStart(-2), to: monthStart(1) };
    case "this_year":
      return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear() + 1, 0, 1) };
    case "all":
      return { from: null, to: null };
  }
}

const usd = (v: number) =>
  `$${v.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

interface Row {
  r: EarningsReservation;
  region: string;
  drivers: { name: string; fee: number | null }[];
  fare: number;
  driverCost: number;
  /** null while any leg on the booking still has no agreed rate. */
  profit: number | null;
}

/**
 * What the company keeps, transfer by transfer.
 *
 * The driver ledger below this answers "what do I owe each driver"; it cannot
 * answer "what did I make", because it never sees the fare the customer paid.
 * This does: fare minus every driver on the job.
 *
 * A booking with a leg still unpriced is deliberately left out of the totals
 * rather than counted at its full fare. Counting it would report the whole
 * fare as profit and quietly overstate the month — so it is excluded and
 * shown as a number to go and fix.
 */
export default function DriverEarnings({
  reservations,
}: {
  reservations: EarningsReservation[];
}) {
  const [period, setPeriod] = useState<PeriodKey>("this_month");

  // The admin lives under /{locale}/admin; read the prefix off the current URL
  // rather than hard-coding a language into a link.
  const pathname = usePathname();
  const adminBase = pathname?.match(/^\/[a-z]{2}\/admin/)?.[0] ?? "/tr/admin";

  const { rows, unpriced, totals } = useMemo(() => {
    const { from, to } = periodRange(period);

    const inPeriod = reservations.filter((r) => {
      if (!from || !to) return true;
      const at = new Date(r.pickup_datetime);
      return at >= from && at < to;
    });

    const built: Row[] = inPeriod.map((r) => {
      const live = (r.driver_assignments ?? []).filter((da) => LIVE.includes(da.status));
      const drivers = live
        .slice()
        .sort((a, b) => (a.leg === "return" ? 1 : 0) - (b.leg === "return" ? 1 : 0))
        .map((da) => ({
          name: da.drivers?.full_name ?? "Şoför silinmiş",
          fee: da.driver_fee == null ? null : Number(da.driver_fee),
        }));

      const anyUnpriced = drivers.length === 0 || drivers.some((d) => d.fee == null);
      const driverCost = drivers.reduce((sum, d) => sum + (d.fee ?? 0), 0);
      const fare = Number(r.total_price) || 0;

      return {
        r,
        region: r.regions?.name_tr || r.regions?.name_en || "—",
        drivers,
        fare,
        driverCost,
        profit: anyUnpriced ? null : fare - driverCost,
      };
    });

    built.sort(
      (a, b) =>
        new Date(b.r.pickup_datetime).getTime() - new Date(a.r.pickup_datetime).getTime()
    );

    const pricedRows = built.filter((row) => row.profit !== null);
    const unpricedRows = built.filter((row) => row.profit === null);

    return {
      rows: built,
      unpriced: unpricedRows,
      totals: {
        count: pricedRows.length,
        fare: pricedRows.reduce((s, row) => s + row.fare, 0),
        driverCost: pricedRows.reduce((s, row) => s + row.driverCost, 0),
        profit: pricedRows.reduce((s, row) => s + (row.profit ?? 0), 0),
      },
    };
  }, [reservations, period]);

  const marginPct =
    totals.fare > 0 ? Math.round((totals.profit / totals.fare) * 100) : null;

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
          <TrendingUp size={16} className="text-emerald-600" />
          Kazanç
        </h2>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === p.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {/* Summary */}
      <div className="grid gap-px bg-slate-100 sm:grid-cols-4">
        <Tile label="Transfer" value={String(totals.count)} />
        <Tile label="Ciro (müşteriden)" value={usd(totals.fare)} />
        <Tile label="Şoföre giden" value={usd(totals.driverCost)} tone="cost" />
        <Tile
          label="Sana kalan"
          value={usd(totals.profit)}
          hint={marginPct !== null ? `%${marginPct}` : undefined}
          tone={totals.profit < 0 ? "loss" : "profit"}
        />
      </div>

      {unpriced.length > 0 && (
        <div className="flex items-start gap-2 border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-px shrink-0" />
          <p>
            <strong>{unpriced.length} transferin</strong> şoför ücreti
            girilmemiş. Bu transferler yukarıdaki toplamlara katılmadı — ücreti
            girilmeden kâr olduğundan yüksek görünürdü. Aşağıdaki listede
            turuncu işaretli satırlar.
          </p>
        </div>
      )}

      {/* Breakdown */}
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-400">
          Bu dönemde şoför atanmış transfer yok.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-5 py-2.5 text-start font-bold">Kod</th>
                <th className="px-3 py-2.5 text-start font-bold">Tarih</th>
                <th className="px-3 py-2.5 text-start font-bold">Güzergah</th>
                <th className="px-3 py-2.5 text-end font-bold">Müşteri</th>
                <th className="px-3 py-2.5 text-start font-bold">Şoför(ler)</th>
                <th className="px-3 py-2.5 text-end font-bold">Şoföre</th>
                <th className="px-5 py-2.5 text-end font-bold">Kazancın</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.r.id}
                  className={`border-b border-slate-50 last:border-0 ${
                    row.profit === null ? "bg-amber-50/40" : ""
                  }`}
                >
                  <td className="px-5 py-2.5 font-mono text-xs font-semibold text-slate-700">
                    {row.r.reservation_code}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">
                    {formatBookingDateShort(row.r.pickup_datetime)}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    {row.region}
                    {row.r.trip_type === "round_trip" && (
                      <span className="ms-1.5 text-[11px] text-slate-400">gidiş-dönüş</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-end tabular-nums text-slate-700">
                    {usd(row.fare)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">
                    {row.drivers.length === 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      row.drivers.map((d, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-slate-300"> / </span>}
                          {d.name}
                          {d.fee !== null && (
                            <span className="text-slate-400"> {usd(d.fee)}</span>
                          )}
                        </span>
                      ))
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-end tabular-nums text-slate-700">
                    {row.profit === null ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      usd(row.driverCost)
                    )}
                  </td>
                  <td className="px-5 py-2.5 text-end">
                    {row.profit === null ? (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-amber-700">
                        <AlertTriangle size={11} />
                        ücret girilmedi
                      </span>
                    ) : (
                      <span
                        className={`font-bold tabular-nums ${
                          row.profit < 0 ? "text-rose-600" : "text-emerald-700"
                        }`}
                      >
                        {usd(row.profit)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 text-sm font-bold text-slate-900">
                <td className="px-5 py-3" colSpan={3}>
                  {totals.count} transfer
                </td>
                <td className="px-3 py-3 text-end tabular-nums">{usd(totals.fare)}</td>
                <td />
                <td className="px-3 py-3 text-end tabular-nums">{usd(totals.driverCost)}</td>
                <td
                  className={`px-5 py-3 text-end tabular-nums ${
                    totals.profit < 0 ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {usd(totals.profit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <footer className="border-t border-slate-100 px-5 py-3">
        <Link
          href={`${adminBase}/reservations`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          Rezervasyonlara git
          <ArrowRight size={12} />
        </Link>
      </footer>
    </section>
  );
}

function Tile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "cost" | "profit" | "loss";
}) {
  const colour =
    tone === "profit"
      ? "text-emerald-700"
      : tone === "loss"
      ? "text-rose-600"
      : tone === "cost"
      ? "text-slate-500"
      : "text-slate-900";

  return (
    <div className="bg-white px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className={`mt-1 flex items-baseline gap-1.5 text-xl font-bold tabular-nums ${colour}`}>
        {tone === "cost" && value !== "$0" && <span className="text-slate-300">−</span>}
        {value}
        {hint && <span className="text-xs font-semibold text-slate-400">{hint}</span>}
      </p>
    </div>
  );
}
