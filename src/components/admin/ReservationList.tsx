"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  Search,
  UserPlus,
} from "lucide-react";
import {
  type Reservation,
  customerName,
  dayKey,
  dayLabel,
  fmtDate,
  fmtTime,
  isCash,
  liveAssignment,
  money,
  offsetDayKey,
  regionName,
  shortRouteFor,
  statusMeta,
  todayKey,
} from "./reservations/types";

interface Props {
  reservations: Reservation[];
  /** "/tr/admin" — passed from the server so a row link never guesses a locale. */
  adminBase: string;
}
type DateScope = "all" | "today" | "tomorrow" | "week" | "past";
type SortKey = "pickup" | "created";

const DATE_SCOPES: Array<{ key: DateScope; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "today", label: "Bugün" },
  { key: "tomorrow", label: "Yarın" },
  { key: "week", label: "7 Gün" },
  { key: "past", label: "Geçmiş" },
];

/** A paid transfer with any leg still missing a driver needs operator attention. */
function missingDriver(r: Reservation) {
  if (!["paid", "driver_assigned"].includes(r.status)) return false;
  if (!liveAssignment(r, "outbound")) return true;
  return r.trip_type === "round_trip" && !liveAssignment(r, "return");
}
function inScope(r: Reservation, scope: DateScope) {
  if (scope === "all") return true;
  const key = dayKey(r.pickup_datetime);
  const today = todayKey();
  if (scope === "today") return key === today;
  if (scope === "tomorrow") return key === offsetDayKey(1);
  if (scope === "past") return key < today;
  return key >= today && key <= offsetDayKey(7);
}

export default function ReservationList({ reservations, adminBase }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [dateScope, setDateScope] = useState<DateScope>("all");
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("pickup");
  // ─── stats (over everything loaded, not the current filter) ───
  const stats = useMemo(() => {
    const today = todayKey();
    const active = reservations.filter(
      (r) => !["cancelled", "pending"].includes(r.status)
    );
    return {
      today: reservations.filter(
        (r) => dayKey(r.pickup_datetime) === today && r.status !== "cancelled"
      ).length,
      tomorrow: reservations.filter(
        (r) => dayKey(r.pickup_datetime) === offsetDayKey(1) && r.status !== "cancelled"
      ).length,
      unassigned: reservations.filter(missingDriver).length,
      pending: reservations.filter((r) => r.status === "pending").length,
      cancelRequests: reservations.filter((r) => r.status === "cancel_requested").length,
      revenue: active.reduce((sum, r) => sum + (Number(r.total_price) || 0), 0),
    };
  }, [reservations]);

  // ─── filtering + sorting ───
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = reservations.filter((r) => {
      const matchesSearch =
        q === "" ||
        r.reservation_code.toLowerCase().includes(q) ||
        customerName(r).toLowerCase().includes(q) ||
        (r.customers?.email ?? "").toLowerCase().includes(q) ||
        (r.customers?.phone ?? "").includes(q) ||
        (r.flight_code ?? "").toLowerCase().includes(q) ||
        (r.return_flight_code ?? "").toLowerCase().includes(q) ||
        (r.hotel_name ?? "").toLowerCase().includes(q) ||
        regionName(r).toLowerCase().includes(q) ||
        r.driver_assignments?.some((da) =>
          (da.drivers?.full_name ?? "").toLowerCase().includes(q)
        );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !["pending", "cancelled"].includes(r.status)) ||
        r.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        inScope(r, dateScope) &&
        (!onlyUnassigned || missingDriver(r))
      );
    });

    return list.sort((a, b) =>
      sortKey === "pickup"
        ? new Date(a.pickup_datetime).getTime() - new Date(b.pickup_datetime).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [reservations, search, statusFilter, dateScope, onlyUnassigned, sortKey]);

  /** Day buckets, so the operator reads the list as a schedule rather than a feed. */
  const groups = useMemo(() => {
    if (sortKey !== "pickup") return [{ key: "", items: filtered }];
    const map = new Map<string, Reservation[]>();
    for (const r of filtered) {
      const key = dayKey(r.pickup_datetime);
      (map.get(key) ?? map.set(key, []).get(key)!).push(r);
    }
    return [...map.entries()].map(([key, items]) => ({ key, items }));
  }, [filtered, sortKey]);

  return (
    <div className="pb-16">
      {/* ─── Stat tiles ─── */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Bugün" value={stats.today} hint="transfer" tone="slate" />
        <StatTile label="Yarın" value={stats.tomorrow} hint="transfer" tone="slate" />
        <StatTile
          label="Şoför Bekliyor"
          value={stats.unassigned}
          hint="atama gerekli"
          tone={stats.unassigned > 0 ? "amber" : "slate"}
          onClick={() => {
            setOnlyUnassigned(true);
            setStatusFilter("active");
            setDateScope("all");
          }}
        />
        <StatTile
          label="Ödeme Bekliyor"
          value={stats.pending}
          hint="tahsil edilmedi"
          tone={stats.pending > 0 ? "rose" : "slate"}
          onClick={() => {
            setStatusFilter("pending");
            setOnlyUnassigned(false);
          }}
        />
        <StatTile
          label="Aktif Ciro"
          value={money(stats.revenue)}
          hint="iptal/bekleyen hariç"
          tone="emerald"
        />
      </div>

      {stats.cancelRequests > 0 && (
        <button
          onClick={() => {
            setStatusFilter("cancel_requested");
            setDateScope("all");
            setOnlyUnassigned(false);
          }}
          className="mb-4 flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-start text-sm font-medium text-rose-700 hover:bg-rose-100"
        >
          <AlertTriangle size={15} />
          {stats.cancelRequests} iptal talebi yanıt bekliyor — görüntülemek için tıklayın
        </button>
      )}

      {/* ─── Filters ─── */}
      <div className="mb-5 space-y-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kod, müşteri, telefon, uçuş, otel, bölge veya şoför ara..."
              className="w-full rounded-lg border border-slate-200 py-2 ps-9 pe-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="active">Aktif rezervasyonlar</option>
            <option value="all">Tüm durumlar</option>
            <option value="pending">Ödeme bekliyor</option>
            <option value="paid">Ödendi</option>
            <option value="driver_assigned">Şoför atandı</option>
            <option value="passenger_picked_up">Yolcu alındı</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancel_requested">İptal talebi</option>
            <option value="cancelled">İptal edildi</option>
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="pickup">Transfer saatine göre</option>
            <option value="created">Kayıt tarihine göre</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {DATE_SCOPES.map((s) => (
              <button
                key={s.key}
                onClick={() => setDateScope(s.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  dateScope === s.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setOnlyUnassigned((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              onlyUnassigned
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <UserPlus size={13} />
            Sadece şoför bekleyenler
          </button>
          <span className="ms-auto text-xs text-slate-400">
            {filtered.length} kayıt gösteriliyor
          </span>
        </div>
      </div>

      {/* ─── List ─── */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.key || "all"}>
            {group.key && (
              <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-center gap-3 bg-slate-100/95 px-1 py-2 backdrop-blur">
                <h2
                  className={`text-sm font-bold ${
                    group.key === todayKey() ? "text-amber-600" : "text-slate-700"
                  }`}
                >
                  {dayLabel(group.key)}
                </h2>
                <span className="text-xs text-slate-400">
                  {group.items.length} transfer ·{" "}
                  {money(
                    group.items.reduce((s, r) => s + (Number(r.total_price) || 0), 0)
                  )}
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            )}

            <div className="space-y-2.5">
              {group.items.map((r) => {
                const meta = statusMeta(r.status);
                const cash = isCash(r);
                const needsDriver = missingDriver(r);

                return (
                  <Link
                    key={r.id}
                    href={`${adminBase}/reservations/${encodeURIComponent(r.reservation_code)}`}
                    className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-white px-3.5 py-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:px-4 ${
                      needsDriver ? "border-amber-200 bg-amber-50/20" : "border-slate-200"
                    }`}
                  >
                    <span className={`absolute inset-y-0 start-0 w-1 ${meta.rail}`} />

                    <div className="w-[3.75rem] shrink-0 ps-1 text-center sm:w-16">
                      <p className="text-lg font-bold leading-tight tracking-tight text-slate-900">
                        {fmtTime(r.pickup_datetime)}
                      </p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {fmtDate(r.pickup_datetime).slice(0, 5)}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[13px] font-bold text-slate-900">
                          {r.reservation_code}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.chip}`}
                        >
                          {meta.label}
                        </span>
                        {needsDriver && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                            Şoför bekliyor
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm font-bold text-slate-900">
                        {customerName(r)}
                      </p>
                      <p className="truncate text-xs font-medium text-slate-500">
                        {shortRouteFor(r).from}
                        <span className="mx-1 text-slate-300">→</span>
                        {shortRouteFor(r).to}
                      </p>
                      <p className="mt-1 truncate text-[10px] font-medium text-slate-400">
                        {r.flight_code || "Uçuş bilgisi yok"}
                        <span className="mx-1.5 text-slate-300">·</span>
                        {r.adults}+{r.children} yolcu
                        <span className="mx-1.5 text-slate-300">·</span>
                        {cash ? "Nakit" : "Online"}
                      </p>
                    </div>

                    <div className="shrink-0 text-end">
                      <p className="text-base font-bold tracking-tight text-slate-900">
                        {money(r.total_price)}
                      </p>
                      <span className="mt-1 block text-[10px] font-semibold text-slate-400 group-hover:text-slate-600">
                        Aç
                      </span>
                    </div>

                    <ChevronRight size={17} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-sm font-medium text-slate-500">
              Bu filtrelerle eşleşen rezervasyon yok
            </p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setDateScope("all");
                setOnlyUnassigned(false);
              }}
              className="mt-3 text-xs font-semibold text-slate-900 underline underline-offset-4"
            >
              Filtreleri temizle
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

// ─── small presentational pieces ───

function StatTile({
  label,
  value,
  hint,
  tone,
  onClick,
}: {
  label: string;
  value: number | string;
  hint: string;
  tone: "slate" | "amber" | "rose" | "emerald";
  onClick?: () => void;
}) {
  const tones = {
    slate: "text-slate-900",
    amber: "text-amber-600",
    rose: "text-rose-600",
    emerald: "text-emerald-600",
  };
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white p-3.5 text-start shadow-sm ${
        onClick ? "transition hover:border-slate-300 hover:shadow" : ""
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold leading-none ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
    </Tag>
  );
}

