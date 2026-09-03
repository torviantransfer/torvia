"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Settings2,
  Unlock,
  X,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  code: string;
  status: string;
  pickup: string;
  region: string;
  route: string;
  customer: string;
  phone: string;
  adults: number;
  children: number;
  vehicle: string;
  driver: string;
  hotel: string | null;
  price: number;
  tripType: string;
  leg: "outbound" | "return";
  returnDate: string | null;
}

interface DateOverride {
  date: string;
  /** null = the date is closed outright; a number = that date's own capacity. */
  maxBookings: number | null;
  reason: string | null;
}

const STATUS_COLOR: Record<string, { bg: string; dot: string; text: string }> = {
  pending:            { bg: "bg-amber-50",   dot: "bg-amber-400",   text: "text-amber-700" },
  paid:               { bg: "bg-blue-50",    dot: "bg-blue-400",    text: "text-blue-700" },
  driver_assigned:    { bg: "bg-violet-50",  dot: "bg-violet-400",  text: "text-violet-700" },
  passenger_picked_up:{ bg: "bg-indigo-50",  dot: "bg-indigo-400",  text: "text-indigo-700" },
  completed:          { bg: "bg-emerald-50", dot: "bg-emerald-400", text: "text-emerald-700" },
  cancelled:          { bg: "bg-red-50",     dot: "bg-red-400",     text: "text-red-700" },
  cancel_requested:   { bg: "bg-orange-50",  dot: "bg-orange-400",  text: "text-orange-700" },
};

const STATUS_TR: Record<string, string> = {
  pending: "Beklemede", paid: "Ödendi", driver_assigned: "Şoför Atandı",
  passenger_picked_up: "Alındı", completed: "Tamamlandı",
  cancelled: "İptal", cancel_requested: "İptal Talep",
};

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const MAX_CAPACITY = 100;

export default function AdminCalendarAvailability() {
  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth() + 1);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [globalMax, setGlobalMax] = useState(3);
  const [loading, setLoading] = useState(true);

  const [selectedDay, setSelectedDay]     = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Day panel form state
  const [draftCapacity, setDraftCapacity] = useState(3);
  const [draftReason, setDraftReason]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  // Global default form state
  const [draftGlobal, setDraftGlobal] = useState(3);
  const [savingGlobal, setSavingGlobal] = useState(false);

  const pad = (n: number) => String(n).padStart(2, "0");
  const monthStart = `${year}-${pad(month)}-01`;
  const monthEnd = `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [calRes, capRes] = await Promise.all([
      fetch(`/api/admin/calendar?year=${year}&month=${month}`),
      fetch(`/api/admin/date-capacity?from=${monthStart}&to=${monthEnd}`),
    ]);
    const [calData, capData] = await Promise.all([calRes.json(), capRes.json()]);

    setEvents(calData.events ?? []);
    setOverrides(capData.overrides ?? []);
    setCounts(capData.counts ?? {});
    if (typeof capData.globalMax === "number") setGlobalMax(capData.globalMax);
    setLoading(false);
  }, [year, month, monthStart, monthEnd]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Keep the default-capacity stepper in sync with whatever the server reports.
  useEffect(() => { setDraftGlobal(globalMax); }, [globalMax]);

  const dateStr = (day: number) => `${year}-${pad(month)}-${pad(day)}`;
  const overrideFor = (ds: string) => overrides.find((o) => o.date === ds) ?? null;

  /** Effective capacity for a date: its override when set, otherwise the default. */
  const capacityOf = (ds: string) => {
    const o = overrideFor(ds);
    if (!o) return globalMax;
    return o.maxBookings ?? 0;
  };
  const bookedOn = (ds: string) => counts[ds] ?? 0;

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1);
    setSelectedDay(null);
  };
  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    selectDay(now.getDate());
  };

  const selectDay = (day: number | null) => {
    setSelectedDay(day);
    setMsg(null);
    if (day === null) return;
    const ds = `${year}-${pad(month)}-${pad(day)}`;
    const o = overrides.find((x) => x.date === ds) ?? null;
    // Seed the stepper with what the date effectively allows today.
    setDraftCapacity(o ? (o.maxBookings ?? 0) : globalMax);
    setDraftReason(o?.reason ?? "");
  };

  const eventsForDay = (day: number) =>
    events.filter((e) => new Date(e.pickup).getDate() === day);

  const isToday = (day: number) =>
    day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

  // ─── mutations ───

  const saveOverride = async (day: number, maxBookings: number | null) => {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/date-capacity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr(day), maxBookings, reason: draftReason || null }),
    });
    if (res.ok) {
      setMsg({
        ok: true,
        text:
          maxBookings === null || maxBookings === 0
            ? "Tarih kapatıldı, yeni rezervasyon alınmayacak."
            : `Bu güne özel kapasite ${maxBookings} olarak kaydedildi.`,
      });
      await fetchAll();
    } else {
      const d = await res.json().catch(() => null);
      setMsg({ ok: false, text: d?.error ?? "Kaydedilemedi." });
    }
    setSaving(false);
  };

  const clearOverride = async (day: number) => {
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/admin/date-capacity?date=${dateStr(day)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMsg({ ok: true, text: `Tarih varsayılana döndü (${globalMax} rezervasyon).` });
      setDraftReason("");
      setDraftCapacity(globalMax);
      await fetchAll();
    } else {
      setMsg({ ok: false, text: "Varsayılana döndürülemedi." });
    }
    setSaving(false);
  };

  const saveGlobal = async () => {
    setSavingGlobal(true);
    const res = await fetch("/api/admin/date-capacity", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ globalMax: draftGlobal }),
    });
    if (res.ok) {
      setMsg({ ok: true, text: `Varsayılan günlük kapasite ${draftGlobal} oldu.` });
      await fetchAll();
    } else {
      const d = await res.json().catch(() => null);
      setMsg({ ok: false, text: d?.error ?? "Varsayılan kapasite kaydedilemedi." });
    }
    setSavingGlobal(false);
  };

  // ─── grid ───

  const firstDow = (() => {
    const d = new Date(year, month - 1, 1).getDay() - 1;
    return d < 0 ? 6 : d;
  })();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDs       = selectedDay ? dateStr(selectedDay) : null;
  const selectedOverride = selectedDs ? overrideFor(selectedDs) : null;
  const selectedCapacity = selectedDs ? capacityOf(selectedDs) : globalMax;
  const selectedBooked   = selectedDs ? bookedOn(selectedDs) : 0;
  const selectedClosed   = selectedCapacity === 0;
  const selectedEvents   = selectedDay ? eventsForDay(selectedDay) : [];
  const closedCount      = overrides.filter((o) => (o.maxBookings ?? 0) === 0).length;
  const customCount      = overrides.filter((o) => (o.maxBookings ?? 0) > 0).length;

  return (
    <div className="flex gap-6">
      {/* ── Main calendar ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              {events.length} transfer
            </span>
            {customCount > 0 && (
              <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                {customCount} özel kapasite
              </span>
            )}
            {closedCount > 0 && (
              <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                {closedCount} kapalı gün
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200">
              Bugün
            </button>
            <button onClick={prevMonth} className="rounded-lg p-1.5 transition-colors hover:bg-slate-100">
              <ChevronLeft size={18} className="text-slate-500" />
            </button>
            <button onClick={nextMonth} className="rounded-lg p-1.5 transition-colors hover:bg-slate-100">
              <ChevronRight size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-blue-200 bg-blue-100" />Rezervasyon var</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-orange-200 bg-orange-100" />Dolu (kapasite doldu)</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-red-200 bg-red-100" />Kapalı</span>
          <span className="flex items-center gap-1.5"><Settings2 size={11} className="text-sky-500" />Bu güne özel kapasite</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="grid grid-cols-7 border-b border-slate-100">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">{d}</div>
            ))}
          </div>
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-400">Yükleniyor…</div>
          ) : (
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (day === null) {
                  return <div key={`e-${i}`} className="min-h-[90px] border-b border-r border-slate-50 bg-slate-50/30" />;
                }
                const ds       = dateStr(day);
                const dayEv    = eventsForDay(day);
                const capacity = capacityOf(ds);
                const booked   = bookedOn(ds);
                const override = overrideFor(ds);
                const isClosed = capacity === 0;
                const isFull   = !isClosed && booked >= capacity;
                const isCustom = !!override && capacity > 0;
                const today    = isToday(day);
                const sel      = selectedDay === day;
                const isPast   = ds < now.toISOString().split("T")[0];

                let cellBg = sel ? "bg-orange-50" : "hover:bg-slate-50";
                if (booked > 0 && !isClosed && !isFull) cellBg = sel ? "bg-blue-50" : "bg-blue-50/40 hover:bg-blue-50";
                if (isFull)   cellBg = sel ? "bg-orange-100" : "bg-orange-50 hover:bg-orange-100";
                if (isClosed) cellBg = sel ? "bg-red-100" : "bg-red-50 hover:bg-red-100";

                return (
                  <div
                    key={day}
                    onClick={() => selectDay(sel ? null : day)}
                    className={`min-h-[90px] cursor-pointer border-b border-r border-slate-100 p-1.5 transition-colors ${cellBg} ${isPast ? "opacity-50" : ""}`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${today ? "bg-orange-500 text-white" : sel ? "bg-orange-200 text-orange-800" : "text-slate-600"}`}>
                        {day}
                      </span>
                      <span className="flex items-center gap-1">
                        {isCustom && <Settings2 size={10} className="text-sky-500" />}
                        {isClosed ? (
                          <Lock size={11} className="text-red-400" />
                        ) : (
                          <span className={`text-[9px] font-bold ${isFull ? "text-orange-500" : booked > 0 ? "text-slate-500" : "text-slate-300"}`}>
                            {booked}/{capacity}
                          </span>
                        )}
                      </span>
                    </div>
                    {isClosed ? (
                      <span className="text-[9px] font-bold uppercase text-red-400">Kapalı</span>
                    ) : (
                      <div className="space-y-0.5">
                        {dayEv.slice(0, 2).map((ev) => {
                          const cfg = STATUS_COLOR[ev.status] ?? STATUS_COLOR.pending;
                          return (
                            <button
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); selectDay(day); }}
                              className={`flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[9px] font-medium ${cfg.bg} ${cfg.text}`}
                            >
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                              <span className="truncate">
                                {ev.leg === "return" ? "↩ " : "↗ "}
                                {new Date(ev.pickup).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} {ev.region}
                              </span>
                            </button>
                          );
                        })}
                        {dayEv.length > 2 && (
                          <p className="pl-1 text-[9px] text-slate-400">+{dayEv.length - 2} daha</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div className="hidden w-80 shrink-0 lg:block">
        <div className="sticky top-4 space-y-3">
          {/* Day panel */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            {!selectedDay ? (
              <p className="py-4 text-center text-xs text-slate-400">
                Kapasiteyi değiştirmek için takvimden bir gün seçin
              </p>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {selectedDay} {MONTH_NAMES[month - 1]} {year}
                  </h3>
                  <button onClick={() => selectDay(null)} className="rounded-lg p-1 hover:bg-slate-100">
                    <X size={14} className="text-slate-400" />
                  </button>
                </div>

                {/* Current state */}
                <div className={`mb-3 rounded-xl px-3 py-2.5 ${selectedClosed ? "bg-red-50" : "bg-slate-50"}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Bu günün durumu
                  </p>
                  {selectedClosed ? (
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-red-600">
                      <Lock size={13} /> Kapalı
                    </p>
                  ) : (
                    <>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {selectedBooked} / {selectedCapacity} rezervasyon
                        <span className="ml-1.5 text-xs font-medium text-slate-500">
                          ({Math.max(0, selectedCapacity - selectedBooked)} boş)
                        </span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {selectedOverride
                          ? "Bu güne özel kapasite uygulanıyor"
                          : `Varsayılan kapasite (${globalMax}) uygulanıyor`}
                      </p>
                    </>
                  )}
                  {selectedOverride?.reason && (
                    <p className="mt-1 text-[11px] italic text-slate-500">
                      “{selectedOverride.reason}”
                    </p>
                  )}
                </div>

                {/* Capacity stepper */}
                <div className="mb-3 rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Bu güne özel kapasite
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDraftCapacity((c) => Math.max(0, c - 1))}
                      disabled={draftCapacity <= 0}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      aria-label="Azalt"
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={MAX_CAPACITY}
                      value={draftCapacity}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setDraftCapacity(Number.isFinite(n) ? Math.min(MAX_CAPACITY, Math.max(0, Math.trunc(n))) : 0);
                      }}
                      className="h-9 w-full rounded-lg border border-slate-200 text-center text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <button
                      onClick={() => setDraftCapacity((c) => Math.min(MAX_CAPACITY, c + 1))}
                      disabled={draftCapacity >= MAX_CAPACITY}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      aria-label="Artır"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setDraftCapacity(n)}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                          draftCapacity === n
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={draftReason}
                    onChange={(e) => setDraftReason(e.target.value)}
                    placeholder="Not (opsiyonel) — örn. bayram, ek araç"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-orange-300"
                  />

                  {draftCapacity > 0 && draftCapacity < selectedBooked && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                      Bu günde zaten {selectedBooked} rezervasyon var. Daha düşük bir
                      kapasite mevcut rezervasyonları iptal etmez, sadece yeni
                      rezervasyon alınmasını durdurur.
                    </p>
                  )}

                  <button
                    onClick={() => selectedDay && saveOverride(selectedDay, draftCapacity)}
                    disabled={saving || draftCapacity === 0}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                  >
                    <Check size={13} />
                    {saving ? "Kaydediliyor…" : `Kapasiteyi ${draftCapacity} yap`}
                  </button>

                  {selectedOverride && (
                    <button
                      onClick={() => selectedDay && clearOverride(selectedDay)}
                      disabled={saving}
                      className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <RotateCcw size={12} />
                      Varsayılana dön ({globalMax})
                    </button>
                  )}
                </div>

                {/* Open / close */}
                {selectedClosed ? (
                  <button
                    onClick={() => selectedDay && clearOverride(selectedDay)}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-60"
                  >
                    <Unlock size={12} />
                    {saving ? "İşleniyor…" : "Günü Aç"}
                  </button>
                ) : (
                  <button
                    onClick={() => selectedDay && saveOverride(selectedDay, null)}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                  >
                    <Lock size={12} />
                    {saving ? "İşleniyor…" : "Günü Tamamen Kapat"}
                  </button>
                )}

                {msg && (
                  <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-medium ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {msg.ok ? <CheckCircle size={13} className="mt-0.5 shrink-0" /> : <AlertTriangle size={13} className="mt-0.5 shrink-0" />}
                    {msg.text}
                  </div>
                )}

                {/* Reservations for day */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Bu günün transferleri
                  </p>
                  {selectedEvents.length === 0 ? (
                    <p className="py-2 text-center text-xs text-slate-400">Bu gün transfer yok</p>
                  ) : (
                    <div className="max-h-[38vh] space-y-2 overflow-y-auto">
                      {selectedEvents.map((ev) => {
                        const cfg = STATUS_COLOR[ev.status] ?? STATUS_COLOR.pending;
                        return (
                          <button
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className="w-full rounded-xl border border-slate-100 p-2.5 text-left transition-colors hover:border-slate-200"
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${cfg.bg} ${cfg.text}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                {STATUS_TR[ev.status] ?? ev.status}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">{ev.code}</span>
                            </div>
                            <p className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                              <Clock size={10} className="shrink-0 text-slate-400" />
                              {new Date(ev.pickup).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                              <span className={`ml-1 rounded px-1 py-0.5 text-[9px] font-bold ${ev.leg === "return" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                {ev.leg === "return" ? "Dönüş" : "Gidiş"}
                              </span>
                            </p>
                            <p className="truncate text-[10px] text-slate-400">{ev.route}</p>
                            <p className="mt-0.5 truncate text-[10px] text-slate-500">{ev.customer}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Global default */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Settings2 size={12} />
              Varsayılan günlük kapasite
            </p>
            <p className="mb-2 text-[11px] text-slate-500">
              Özel kapasitesi olmayan tüm günler için geçerli.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDraftGlobal((c) => Math.max(1, c - 1))}
                disabled={draftGlobal <= 1}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Azalt"
              >
                <Minus size={15} />
              </button>
              <input
                type="number"
                min={1}
                max={MAX_CAPACITY}
                value={draftGlobal}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setDraftGlobal(Number.isFinite(n) ? Math.min(MAX_CAPACITY, Math.max(1, Math.trunc(n))) : 1);
                }}
                className="h-9 w-full rounded-lg border border-slate-200 text-center text-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                onClick={() => setDraftGlobal((c) => Math.min(MAX_CAPACITY, c + 1))}
                disabled={draftGlobal >= MAX_CAPACITY}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                aria-label="Artır"
              >
                <Plus size={15} />
              </button>
            </div>
            <button
              onClick={saveGlobal}
              disabled={savingGlobal || draftGlobal === globalMax}
              className="mt-2 w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
            >
              {savingGlobal
                ? "Kaydediliyor…"
                : draftGlobal === globalMax
                  ? `Varsayılan: ${globalMax}`
                  : `Varsayılanı ${draftGlobal} yap`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Event detail modal ── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <span className="font-mono text-sm font-bold text-indigo-600">{selectedEvent.code}</span>
                <p className="mt-0.5 text-xs text-slate-400">
                  {new Date(selectedEvent.pickup).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="rounded-lg p-1.5 hover:bg-slate-100">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 p-5 text-sm">
              {[
                ["Güzergah", selectedEvent.route || `Antalya Havalimanı → ${selectedEvent.region}`],
                ["Leg", selectedEvent.leg === "return" ? "↩ Dönüş" : "↗ Gidiş"],
                ["Saat", new Date(selectedEvent.pickup).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })],
                ...(selectedEvent.returnDate ? [["Dönüş", new Date(selectedEvent.returnDate).toLocaleDateString("tr-TR")]] : []),
                ["Müşteri", selectedEvent.customer],
                ["Yolcu", `${selectedEvent.adults} yetişkin${selectedEvent.children > 0 ? ` + ${selectedEvent.children} çocuk` : ""}`],
                ...(selectedEvent.hotel ? [["Otel", selectedEvent.hotel]] : []),
                ...(selectedEvent.driver ? [["Şoför", selectedEvent.driver]] : []),
                ...(selectedEvent.vehicle ? [["Araç", selectedEvent.vehicle]] : []),
                ["Fiyat", `$${selectedEvent.price.toFixed(2)}`],
              ].map(([label, val]) => (
                <div key={label} className="flex gap-3">
                  <span className="w-20 shrink-0 text-xs font-medium text-slate-400">{label}</span>
                  <span className="text-xs font-medium text-slate-800">{val}</span>
                </div>
              ))}
              {selectedEvent.phone && (
                <a href={`tel:${selectedEvent.phone}`} className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:underline">
                  <Phone size={13} /> {selectedEvent.phone}
                </a>
              )}
              <div className="pt-1">
                {(() => {
                  const cfg = STATUS_COLOR[selectedEvent.status] ?? STATUS_COLOR.pending;
                  return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                      {STATUS_TR[selectedEvent.status] ?? selectedEvent.status}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
