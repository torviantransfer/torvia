"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  FileText,
  Hotel,
  MessageCircle,
  Plane,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import AssignDriverModal from "./reservations/AssignDriverModal";
import ReservationDetail from "./reservations/ReservationDetail";
import EditReservationModal from "./reservations/EditReservationModal";
import {
  type Driver,
  type Leg,
  type Reservation,
  type Vehicle,
  customerName,
  dayKey,
  dayLabel,
  fmtDate,
  fmtDateTime,
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
  drivers: Driver[];
  vehicles: Vehicle[];
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

export default function ReservationList({ reservations, drivers, vehicles }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [dateScope, setDateScope] = useState<DateScope>("all");
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("pickup");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [assignTarget, setAssignTarget] = useState<{ r: Reservation; leg: Leg } | null>(null);
  const [editTarget, setEditTarget] = useState<Reservation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);
  const [telegramSendingId, setTelegramSendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "ok" | "error" } | null>(null);
  const [linkModal, setLinkModal] = useState<{
    driverLink: string;
    whatsappUrl: string;
    driverName: string;
  } | null>(null);

  const showToast = (message: string, tone: "ok" | "error" = "ok") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const refresh = () => router.refresh();

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

  const deleteReservation = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/admin/delete-reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: deleteTarget.id }),
    });
    setDeleting(false);
    if (res.ok) {
      showToast(
        ["pending", "cancelled"].includes(deleteTarget.status)
          ? "Rezervasyon silindi."
          : "Rezervasyon iptal edildi."
      );
      setDeleteTarget(null);
      refresh();
    } else {
      showToast("Rezervasyon silinemedi.", "error");
    }
  };

  const unassignDriver = async (assignmentId: string) => {
    if (!window.confirm("Bu şoför ataması kaldırılsın mı? Şoförün linki geçersiz olacak.")) {
      return;
    }
    setUnassigningId(assignmentId);
    const res = await fetch("/api/admin/unassign-driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId }),
    });
    setUnassigningId(null);
    if (res.ok) {
      showToast("Şoför ataması kaldırıldı.");
      refresh();
    } else {
      const d = await res.json().catch(() => null);
      showToast(d?.error ?? "Atama kaldırılamadı.", "error");
    }
  };

  const cancelAction = async (r: Reservation, action: "approve" | "reject") => {
    const res = await fetch("/api/admin/cancel-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: r.id, action }),
    });
    if (res.ok) {
      showToast(action === "approve" ? "İptal onaylandı." : "İptal talebi reddedildi.");
      refresh();
    } else {
      showToast("İşlem başarısız.", "error");
    }
  };

  /** Posts the transfer into the driver group so whoever is free can take it. */
  const sendToTelegram = async (r: Reservation) => {
    setTelegramSendingId(r.id);
    const res = await fetch("/api/admin/send-to-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: r.id }),
    });
    setTelegramSendingId(null);
    if (res.ok) {
      showToast("Transfer Telegram grubuna gönderildi.");
    } else {
      const d = await res.json().catch(() => null);
      showToast(d?.error ?? "Telegram'a gönderilemedi.", "error");
    }
  };

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
                const outbound = liveAssignment(r, "outbound");
                const ret = liveAssignment(r, "return");
                const expanded = expandedId === r.id;
                const cash = isCash(r);

                return (
                  <div
                    key={r.id}
                    className={`relative overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                      missingDriver(r)
                        ? "border-amber-200"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className={`absolute inset-y-0 start-0 w-1 ${meta.rail}`} />

                    {/* Summary */}
                    <button
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                      className="w-full ps-5 pe-4 py-3.5 text-start hover:bg-slate-50/70"
                    >
                      <div className="flex items-start gap-4">
                        {/* Time block */}
                        <div className="hidden w-16 shrink-0 text-center sm:block">
                          <p className="text-lg font-bold leading-tight text-slate-900">
                            {fmtTime(r.pickup_datetime)}
                          </p>
                          <p className="text-[11px] font-medium text-slate-400">
                            {fmtDate(r.pickup_datetime).slice(0, 5)}
                          </p>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-sm font-bold tracking-wide text-slate-900">
                              {r.reservation_code}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.chip}`}
                            >
                              {meta.label}
                            </span>
                            {r.trip_type === "round_trip" && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                Gidiş-Dönüş
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                cash
                                  ? "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {cash ? <Banknote size={11} /> : <CreditCard size={11} />}
                              {cash ? "Nakit" : "Online"}
                            </span>
                          </div>

                          <p className="truncate text-[15px] font-semibold text-slate-900">
                            {customerName(r)}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">
                            {shortRouteFor(r).from}
                            <span className="mx-1.5 text-slate-300">→</span>
                            {shortRouteFor(r).to}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1 sm:hidden">
                              <CalendarClock size={12} />
                              {fmtDateTime(r.pickup_datetime)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users size={12} />
                              {r.adults}+{r.children}
                            </span>
                            {r.flight_code && (
                              <span className="inline-flex items-center gap-1">
                                <Plane size={12} />
                                {r.flight_code}
                                {r.return_flight_code && ` / ${r.return_flight_code}`}
                              </span>
                            )}
                            {r.hotel_name && (
                              <span className="inline-flex min-w-0 items-center gap-1">
                                <Hotel size={12} />
                                <span className="truncate max-w-[160px]">{r.hotel_name}</span>
                              </span>
                            )}
                          </div>

                          {/* Per-leg driver state at a glance */}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <LegBadge
                              leg="Gidiş"
                              driver={outbound?.drivers?.full_name}
                              plate={outbound?.vehicles?.plate_number}
                              needed={["paid", "driver_assigned"].includes(r.status)}
                            />
                            {r.trip_type === "round_trip" && (
                              <LegBadge
                                leg="Dönüş"
                                driver={ret?.drivers?.full_name}
                                plate={ret?.vehicles?.plate_number}
                                needed={["paid", "driver_assigned"].includes(r.status)}
                              />
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="shrink-0 text-end">
                          <p className="text-lg font-bold text-slate-900">
                            {money(r.total_price)}
                          </p>
                          {cash && Number(r.driver_amount) > 0 ? (
                            <p className="text-[11px] font-semibold text-orange-600">
                              Şoförde {money(r.driver_amount)}
                            </p>
                          ) : (
                            <p className="text-[11px] font-medium text-slate-400">
                              {r.status === "pending" ? "Tahsilat bekliyor" : "Tahsil edildi"}
                            </p>
                          )}
                          <ChevronDown
                            size={16}
                            className={`ms-auto mt-1.5 text-slate-400 transition-transform ${
                              expanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </button>

                    {/* Expanded */}
                    {expanded && (
                      <ReservationDetail
                        reservation={r}
                        onAssign={(leg) => setAssignTarget({ r, leg })}
                        onReplaceAssignment={(leg) => setAssignTarget({ r, leg })}
                        onUnassign={unassignDriver}
                        unassigningId={unassigningId}
                        onEdit={() => setEditTarget(r)}
                        onDelete={() => setDeleteTarget(r)}
                        onCancelAction={(action) => cancelAction(r, action)}
                        onSendTelegram={() => sendToTelegram(r)}
                        telegramSending={telegramSendingId === r.id}
                        onToast={showToast}
                      />
                    )}
                  </div>
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

      {/* ─── Modals ─── */}
      {assignTarget && (
        <AssignDriverModal
          reservation={assignTarget.r}
          allReservations={reservations}
          drivers={drivers}
          vehicles={vehicles}
          initialLeg={assignTarget.leg}
          onClose={() => setAssignTarget(null)}
          onAssigned={(result) => {
            setAssignTarget(null);
            setLinkModal(result);
          }}
        />
      )}

      {editTarget && (
        <EditReservationModal
          reservation={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            refresh();
          }}
          onToast={showToast}
        />
      )}

      {linkModal && (
        <DriverLinkModal
          {...linkModal}
          onClose={() => {
            setLinkModal(null);
            refresh();
          }}
          onToast={showToast}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              {["pending", "cancelled"].includes(deleteTarget.status)
                ? "Rezervasyon kaydını sil"
                : "Rezervasyonu iptal et"}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-mono font-semibold">{deleteTarget.reservation_code}</span>{" "}
              — {customerName(deleteTarget)}.{" "}
              {["pending", "cancelled"].includes(deleteTarget.status)
                ? "Kayıt kalıcı olarak silinecek, geri alınamaz."
                : "Ödenmiş rezervasyon silinmez; iptal olarak işaretlenir ve kayıt izi korunur."}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={deleteReservation}
                disabled={deleting}
                className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "İşleniyor…" : "Evet, devam et"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <div
          className={`fixed bottom-5 start-1/2 z-[60] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg ${
            toast.tone === "error" ? "bg-rose-600 text-white" : "bg-slate-900 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
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

function LegBadge({
  leg,
  driver,
  plate,
  needed,
}: {
  leg: string;
  driver?: string;
  plate?: string;
  needed: boolean;
}) {
  if (!driver) {
    if (!needed) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
        {leg}: şoför bekliyor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      <span className="font-semibold text-slate-500">{leg}:</span>
      {driver}
      {plate && <span className="font-mono text-slate-400">· {plate}</span>}
    </span>
  );
}

function DriverLinkModal({
  driverLink,
  whatsappUrl,
  driverName,
  onClose,
  onToast,
}: {
  driverLink: string;
  whatsappUrl: string;
  driverName: string;
  onClose: () => void;
  onToast: (message: string, tone?: "ok" | "error") => void;
}) {
  const [copied, setCopied] = useState(false);
  const token = driverLink.split("/driver/")[1] ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Şoför atandı</h3>
            <p className="mt-1 text-sm text-slate-600">
              <strong>{driverName}</strong> için görev linki hazır.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-50 p-2.5">
          <input
            readOnly
            value={driverLink}
            className="flex-1 truncate bg-transparent text-xs text-slate-600 outline-none"
          />
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(driverLink);
              setCopied(true);
              onToast("Link kopyalandı.");
              setTimeout(() => setCopied(false), 2000);
            }}
            className="rounded-lg p-2 hover:bg-slate-200"
            title="Linki kopyala"
          >
            {copied ? (
              <Check size={15} className="text-emerald-600" />
            ) : (
              <Copy size={15} className="text-slate-500" />
            )}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            <MessageCircle size={15} />
            WhatsApp ile gönder
          </a>
          {token && (
            <a
              href={`/api/driver-voucher?token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FileText size={15} />
              Şoför voucher&apos;ını önizle
            </a>
          )}
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
