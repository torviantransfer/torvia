"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, ChevronRight, HandCoins, Plus, Search, TrendingDown, Wallet } from "lucide-react";
import AdminDialog from "@/components/admin/AdminDialog";
import { Avatar, buttonPrimary, buttonSecondary, Card, StatTile } from "@/components/admin/AdminUi";
import DriverPaymentForm from "@/components/admin/DriverPaymentForm";
import {
  balanceStatus,
  fmtDay,
  fmtMoney,
  LEDGER_TYPE_LABEL,
  ledgerEffect,
  ledgerWhen,
  rateText,
  type LedgerListRow,
  type LedgerSummary,
} from "@/lib/driverStatement";
import type { Rates } from "@/lib/rates";

interface Driver {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
}

interface Props {
  drivers: Driver[];
  balances: Record<string, LedgerSummary>;
  recent: LedgerListRow[];
  rates: Rates;
  today: string;
  adminBase: string;
}

const EMPTY: LedgerSummary = {
  earnings: 0,
  payments: 0,
  adjustments: 0,
  balance: 0,
  upcoming: 0,
  unconvertible: 0,
  monthPaid: 0,
  monthJobs: 0,
  lastPaymentDay: null,
};

type Filter = "all" | "owe" | "owed" | "closed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "owe", label: "Borcunuz var" },
  { key: "owed", label: "Size borçlu" },
  { key: "closed", label: "Kapalı" },
];

const CHIP = {
  owe: "bg-amber-50 text-amber-800 ring-amber-200",
  owed: "bg-rose-50 text-rose-700 ring-rose-200",
  closed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

/**
 * Every driver's account on one screen, ordered by who is owed most. The
 * screen answers two things before anything else — how much is owed in total,
 * and to whom — and puts "record a payment" one click from each name. The
 * detail of any account is its own page.
 */
export default function DriverPayments({ drivers, balances, recent, rates, today, adminBase }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [paying, setPaying] = useState<string | null>(null); // driver id, or "" for the picker
  const closeDialog = useCallback(() => setPaying(null), []);

  const statementHref = (id: string) => `${adminBase}/driver-payments/${id}`;

  const all = useMemo(
    () =>
      drivers.map((d) => {
        const b = balances[d.id] ?? EMPTY;
        return { driver: d, b, status: balanceStatus(b.balance) };
      }),
    [drivers, balances]
  );

  const totals = useMemo(() => {
    const t = { owe: 0, oweCount: 0, owed: 0, owedCount: 0, monthPaid: 0, upcoming: 0 };
    for (const { b, status } of all) {
      if (status.tone === "owe") {
        t.owe += b.balance;
        t.oweCount += 1;
      } else if (status.tone === "owed") {
        t.owed += -b.balance;
        t.owedCount += 1;
      }
      t.monthPaid += b.monthPaid;
      t.upcoming += b.upcoming;
    }
    return t;
  }, [all]);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    const digits = q.replace(/\s/g, "");
    return all
      .filter(({ driver }) => driver.is_active || showInactive)
      .filter(({ status }) => filter === "all" || status.tone === filter)
      .filter(
        ({ driver }) =>
          !q ||
          driver.full_name.toLocaleLowerCase("tr-TR").includes(q) ||
          (digits && (driver.phone ?? "").replace(/\s/g, "").includes(digits))
      )
      .sort((a, b) => b.b.balance - a.b.balance);
  }, [all, query, filter, showInactive]);

  const inactiveCount = drivers.filter((d) => !d.is_active).length;
  const payingName = paying ? drivers.find((d) => d.id === paying)?.full_name : null;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Şoför Ödemeleri</h1>
          <p className="mt-1 text-sm text-slate-500">Şoförlerle cari hesaplar · bakiyeler dolar, bugün itibarıyla</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`${adminBase}/finance`} className={buttonSecondary}>
            Kasa
            <ArrowRight size={15} />
          </Link>
          <button type="button" onClick={() => setPaying("")} className={buttonPrimary}>
            <Plus size={16} />
            Ödeme yap
          </button>
        </div>
      </div>

      {/* ── Totals ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile
          icon={Wallet}
          label="Şoförlere borcunuz"
          value={fmtMoney(totals.owe, "USD")}
          sub={totals.oweCount ? `${totals.oweCount} şoföre` : "Borcunuz yok"}
        />
        <StatTile
          icon={TrendingDown}
          label="Size borçlu şoförler"
          value={fmtMoney(totals.owed, "USD")}
          sub={totals.owedCount ? `${totals.owedCount} şoför · genelde nakit tahsilattan` : "Kimse borçlu değil"}
        />
        <StatTile icon={HandCoins} label="Bu ay ödenen" value={fmtMoney(totals.monthPaid, "USD")} sub="Elden, havale ve nakit tahsilat" />
        <StatTile
          icon={CalendarClock}
          label="Yaklaşan işlerden"
          value={fmtMoney(totals.upcoming, "USD")}
          sub="Ücreti belli, günü gelmemiş"
        />
      </div>

      {/* ── Drivers ── */}
      <Card
        title="Şoförler"
        subtitle={`${rows.length} şoför gösteriliyor`}
        flush
        actions={
          inactiveCount > 0 ? (
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-500">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              Pasifleri de göster ({inactiveCount})
            </label>
          ) : undefined
        }
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
            <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="İsim veya telefon ara"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 ps-9 pe-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
          {/* One row that scrolls sideways on a phone, rather than a second line of filters. */}
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400">Bu filtreye uyan şoför yok.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map(({ driver: d, b, status }) => (
              <li
                key={d.id}
                className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 hover:bg-slate-50/70 sm:px-5"
              >
                {/* The name takes a whole line on a phone; balance and actions go under it. */}
                <Link href={statementHref(d.id)} className="flex min-w-0 basis-full items-center gap-3 sm:flex-1 sm:basis-0">
                  <Avatar name={d.full_name} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-semibold text-slate-900 group-hover:text-blue-700">
                      {d.full_name}
                      {!d.is_active && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">pasif</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 sm:truncate">
                      {[
                        d.phone,
                        b.monthJobs ? `Bu ay ${b.monthJobs} iş` : "Bu ay iş yok",
                        b.lastPaymentDay ? `Son ödeme ${fmtDay(b.lastPaymentDay)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </Link>

                <div className="ps-[52px] sm:ms-auto sm:ps-0 sm:text-end">
                  <p className={`text-lg font-bold tabular-nums ${status.tone === "owed" ? "text-rose-600" : "text-slate-900"}`}>
                    {status.tone === "closed" ? "$0,00" : fmtMoney(Math.abs(b.balance), "USD")}
                  </p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${CHIP[status.tone]}`}>
                    {status.label}
                  </span>
                  {b.upcoming !== 0 && (
                    <p className="mt-0.5 text-[10px] text-slate-400">+{fmtMoney(b.upcoming, "USD")} yaklaşan</p>
                  )}
                </div>

                <div className="ms-auto flex items-center gap-1 sm:ms-0">
                  <button
                    type="button"
                    onClick={() => setPaying(d.id)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Ödeme yap
                  </button>
                  <Link
                    href={statementHref(d.id)}
                    aria-label={`${d.full_name} carisi`}
                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ── Recent ── */}
      <Card title="Son hareketler" subtitle="Bütün hareketler şoförlerin kendi carisinde" flush>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Henüz hareket yok.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((p) => {
              const effect = ledgerEffect(p);
              const when = ledgerWhen(p);
              return (
                <li key={p.id} className="flex items-start gap-3 px-4 py-3 sm:items-center sm:px-5">
                  <span
                    className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-center text-[11px] font-semibold sm:mt-0 sm:w-20 ${
                      p.type === "earning"
                        ? "bg-slate-100 text-slate-700"
                        : p.type === "payment"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {LEDGER_TYPE_LABEL[p.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800 sm:truncate">
                      {p.drivers?.full_name ? (
                        <Link href={statementHref(p.driver_id)} className="font-semibold hover:text-blue-700">
                          {p.drivers.full_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                      <span className="text-slate-500"> · {p.description || p.reservations?.reservation_code || LEDGER_TYPE_LABEL[p.type]}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {fmtDay(when.day)}
                      {effect.original &&
                        ` · ${fmtMoney(effect.original.amount, effect.original.currency)}${
                          effect.rate !== null ? ` · ${rateText(effect.original.currency, effect.rate)}` : ""
                        }`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      effect.usd === null ? "text-amber-700" : effect.usd < 0 ? "text-emerald-700" : "text-slate-900"
                    }`}
                  >
                    {effect.usd === null ? "kur yok" : `${effect.usd > 0 ? "+" : ""}${fmtMoney(effect.usd, "USD")}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <AdminDialog
        open={paying !== null}
        onClose={closeDialog}
        title={payingName ? `Ödeme yap · ${payingName}` : "Ödeme yap"}
        subtitle="Hesap dolar tutulur; € ve ₺ günün kuruyla çevrilir."
      >
        {paying !== null && (
          <DriverPaymentForm
            key={paying || "picker"}
            drivers={paying ? undefined : drivers.filter((d) => d.is_active)}
            driverId={paying || undefined}
            rates={rates}
            today={today}
            onDone={closeDialog}
            onCancel={closeDialog}
          />
        )}
      </AdminDialog>
    </div>
  );
}
