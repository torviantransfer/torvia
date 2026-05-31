"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Clock,
  X,
  Car,
  Phone,
  AlertTriangle,
  CheckCircle,
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

interface BlockedDate {
  id: string;
  blocked_date: string;
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

export default function AdminCalendarAvailability() {
  const now = new Date();
  const [year, setYear]         = useState(now.getFullYear());
  const [month, setMonth]       = useState(now.getMonth() + 1);
  const [events, setEvents]     = useState<CalendarEvent[]>([]);
  const [blocked, setBlocked]   = useState<BlockedDate[]>([]);
  const [maxDaily, setMaxDaily] = useState(3);
  const [loading, setLoading]   = useState(true);

  const [selectedDay, setSelectedDay]     = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Block form state
  const [blockReason, setBlockReason]   = useState("");
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockMsg, setBlockMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  const pad = (n: number) => String(n).padStart(2, "0");

  const monthStart = `${year}-${pad(month)}-01`;
  const monthEnd   = (() => {
    const last = new Date(year, month, 0).getDate();
    return `${year}-${pad(month)}-${last}`;
  })();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [calRes, blockedRes, availRes] = await Promise.all([
      fetch(`/api/admin/calendar?year=${year}&month=${month}`),
      fetch(`/api/admin/blocked-dates?from=${monthStart}&to=${monthEnd}`),
      fetch(`/api/availability?from=${monthStart}&to=${monthEnd}`),
    ]);
    const [calData, blockedData, availData] = await Promise.all([
      calRes.json(), blockedRes.json(), availRes.json(),
    ]);
    setEvents(calData.events ?? []);
    setBlocked(Array.isArray(blockedData) ? blockedData : []);
    if (availData.maxDaily) setMaxDaily(availData.maxDaily);
    setLoading(false);
  }, [year, month, monthStart, monthEnd]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };
  const goToday = () => {
    setYear(now.getFullYear()); setMonth(now.getMonth() + 1);
    setSelectedDay(now.getDate());
  };

  const blockedSet = new Set(blocked.map(b => b.blocked_date));

  const eventsForDay = (day: number) =>
    events.filter(e => new Date(e.pickup).getDate() === day);

  const dateStr = (day: number) => `${year}-${pad(month)}-${pad(day)}`;

  const isToday = (day: number) =>
    day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

  // Block / Unblock selected day
  const blockDay = async (day: number) => {
    setBlockLoading(true); setBlockMsg(null);
    const ds = dateStr(day);
    const res = await fetch("/api/admin/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: ds, reason: blockReason || null }),
    });
    if (res.ok) {
      setBlockMsg({ ok: true, text: "Tarih kapatıldı." });
      setBlockReason("");
      fetchAll();
    } else {
      const d = await res.json().catch(() => null);
      setBlockMsg({ ok: false, text: d?.error === "Date already blocked" ? "Bu tarih zaten kapalı." : (d?.error ?? "Bir hata oluştu.") });
    }
    setBlockLoading(false);
  };

  const unblockDay = async (day: number) => {
    setBlockLoading(true); setBlockMsg(null);
    const ds = dateStr(day);
    const res = await fetch(`/api/admin/blocked-dates?date=${ds}`, { method: "DELETE" });
    if (res.ok) {
      setBlockMsg({ ok: true, text: "Tarih açıldı." });
      fetchAll();
    } else {
      setBlockMsg({ ok: false, text: "Açma işlemi başarısız." });
    }
    setBlockLoading(false);
  };

  // Build grid cells
  const firstDow = (() => {
    let d = new Date(year, month - 1, 1).getDay() - 1;
    return d < 0 ? 6 : d;
  })();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDayStr  = selectedDay ? dateStr(selectedDay) : null;
  const selectedBlocked = selectedDayStr ? blockedSet.has(selectedDayStr) : false;
  const selectedEvents  = selectedDay ? eventsForDay(selectedDay) : [];
  const blockedReason   = selectedDayStr ? blocked.find(b => b.blocked_date === selectedDayStr)?.reason : null;

  return (
    <div className="flex gap-6">
      {/* ── Main calendar ── */}
      <div className="flex-1 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
              {events.length} transfer
            </span>
            {blocked.length > 0 && (
              <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full font-medium">
                {blocked.length} kapalı gün
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Bugün
            </button>
            <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft size={18} className="text-slate-500" />
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight size={18} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-200" />Rezervasyon var</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-100 border border-orange-200" />Dolu (max kapasite)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" />Manuel kapalı</span>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="grid grid-cols-7 border-b border-slate-100">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">{d}</div>
            ))}
          </div>
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">Yükleniyor…</div>
          ) : (
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (day === null) return <div key={`e-${i}`} className="min-h-[90px] border-b border-r border-slate-50 bg-slate-50/30" />;
                const ds     = dateStr(day);
                const dayEv  = eventsForDay(day);
                const isBlk  = blockedSet.has(ds);
                const isFull = !isBlk && dayEv.length >= maxDaily && dayEv.length > 0;
                const hasBkg = !isBlk && dayEv.length > 0;
                const today  = isToday(day);
                const sel    = selectedDay === day;
                const isPast = ds < now.toISOString().split("T")[0];

                let cellBg = sel ? "bg-orange-50" : "hover:bg-slate-50";
                if (isBlk)  cellBg = sel ? "bg-red-100"    : "bg-red-50 hover:bg-red-100";
                if (isFull) cellBg = sel ? "bg-orange-100" : "bg-orange-50 hover:bg-orange-100";
                if (hasBkg && !isBlk && !isFull) cellBg = sel ? "bg-blue-50" : "bg-blue-50/40 hover:bg-blue-50";

                return (
                  <div
                    key={day}
                    onClick={() => { setSelectedDay(sel ? null : day); setBlockMsg(null); setBlockReason(""); }}
                    className={`min-h-[90px] border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors ${cellBg} ${isPast ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${today ? "bg-orange-500 text-white" : sel ? "bg-orange-200 text-orange-800" : "text-slate-600"}`}>
                        {day}
                      </span>
                      {isBlk && <Lock size={11} className="text-red-400" />}
                      {!isBlk && dayEv.length > 0 && (
                        <span className={`text-[9px] font-bold ${isFull ? "text-orange-500" : "text-slate-400"}`}>
                          {dayEv.length}/{maxDaily}
                        </span>
                      )}
                    </div>
                    {isBlk ? (
                      <span className="text-[9px] font-bold text-red-400 uppercase">Kapalı</span>
                    ) : (
                      <div className="space-y-0.5">
                        {dayEv.slice(0, 2).map(ev => {
                          const cfg = STATUS_COLOR[ev.status] ?? STATUS_COLOR.pending;
                          return (
                            <button
                              key={ev.id}
                              onClick={e => { e.stopPropagation(); setSelectedEvent(ev); setSelectedDay(day); }}
                              className={`w-full text-left px-1 py-0.5 rounded text-[9px] font-medium truncate flex items-center gap-1 ${cfg.bg} ${cfg.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                              <span className="truncate">
                                {ev.leg === "return" ? "↩ " : "↗ "}
                                {new Date(ev.pickup).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})} {ev.region}
                              </span>
                            </button>
                          );
                        })}
                        {dayEv.length > 2 && (
                          <p className="text-[9px] text-slate-400 pl-1">+{dayEv.length - 2} daha</p>
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
      <div className="w-72 shrink-0 hidden lg:block">
        <div className="sticky top-4 space-y-3">

          {/* Day panel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            {!selectedDay ? (
              <p className="text-xs text-slate-400 text-center py-4">Takvimden bir gün seçin</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 text-sm">
                    {selectedDay} {MONTH_NAMES[month - 1]}
                  </h3>
                  <button onClick={() => setSelectedDay(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                    <X size={14} className="text-slate-400" />
                  </button>
                </div>

                {/* Block / Unblock toggle */}
                {selectedBlocked ? (
                  <div className="mb-3 rounded-xl bg-red-50 border border-red-100 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock size={13} className="text-red-500" />
                      <span className="text-xs font-semibold text-red-700">Bu gün kapalı</span>
                    </div>
                    {blockedReason && <p className="text-[11px] text-red-500 mb-2">{blockedReason}</p>}
                    <button
                      onClick={() => unblockDay(selectedDay)}
                      disabled={blockLoading}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-50 disabled:opacity-60 transition-colors"
                    >
                      <Unlock size={12} />
                      {blockLoading ? "İşleniyor…" : "Günü Aç"}
                    </button>
                  </div>
                ) : (
                  <div className="mb-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
                      <Lock size={11} />
                      Günü kapat (yeni rezervasyon alınmaz)
                    </p>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={e => setBlockReason(e.target.value)}
                      placeholder="Sebep (opsiyonel)"
                      className="w-full px-3 py-1.5 rounded-lg text-xs text-slate-800 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-300 mb-2"
                    />
                    <button
                      onClick={() => blockDay(selectedDay)}
                      disabled={blockLoading}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                      <Lock size={12} />
                      {blockLoading ? "İşleniyor…" : "Günü Kapat"}
                    </button>
                  </div>
                )}

                {/* Feedback */}
                {blockMsg && (
                  <div className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${blockMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {blockMsg.ok ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                    {blockMsg.text}
                  </div>
                )}

                {/* Reservations for day */}
                {selectedEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Bu gün transfer yok</p>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {selectedEvents.map(ev => {
                      const cfg = STATUS_COLOR[ev.status] ?? STATUS_COLOR.pending;
                      return (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${cfg.bg} ${cfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                              {STATUS_TR[ev.status] ?? ev.status}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">{ev.code}</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                            <Clock size={10} className="text-slate-400 shrink-0" />
                            {new Date(ev.pickup).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}
                            <span className={`ml-1 px-1 py-0.5 rounded text-[9px] font-bold ${ev.leg === "return" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                              {ev.leg === "return" ? "Dönüş" : "Gidiş"}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{ev.route}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{ev.customer}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Kapasitei bilgisi */}
          <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 text-xs text-slate-500 flex items-center gap-2" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <Car size={14} className="text-slate-400 shrink-0" />
            Günlük max kapasite: <span className="font-bold text-slate-800 ml-1">{maxDaily}</span> rezervasyon
          </div>
        </div>
      </div>

      {/* ── Event detail modal ── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-sm font-bold text-indigo-600">{selectedEvent.code}</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(selectedEvent.pickup).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {[
                ["Güzergah", selectedEvent.route || `Antalya Havalimanı → ${selectedEvent.region}`],
                ["Leg", selectedEvent.leg === "return" ? "↩ Dönüş" : "↗ Gidiş"],
                ["Saat", new Date(selectedEvent.pickup).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})],
                ...(selectedEvent.returnDate ? [["Dönüş", new Date(selectedEvent.returnDate).toLocaleDateString("tr-TR")]] : []),
                ["Müşteri", selectedEvent.customer],
                ["Yolcu", `${selectedEvent.adults} yetişkin${selectedEvent.children > 0 ? ` + ${selectedEvent.children} çocuk` : ""}`],
                ...(selectedEvent.hotel ? [["Otel", selectedEvent.hotel]] : []),
                ...(selectedEvent.driver ? [["Şoför", selectedEvent.driver]] : []),
                ...(selectedEvent.vehicle ? [["Araç", selectedEvent.vehicle]] : []),
                ["Fiyat", `$${selectedEvent.price.toFixed(2)}`],
              ].map(([label, val]) => (
                <div key={label} className="flex gap-3">
                  <span className="text-slate-400 w-20 shrink-0 text-xs font-medium">{label}</span>
                  <span className="text-slate-800 font-medium text-xs">{val}</span>
                </div>
              ))}
              {selectedEvent.phone && (
                <a href={`tel:${selectedEvent.phone}`} className="flex items-center gap-2 text-blue-600 text-xs font-medium hover:underline">
                  <Phone size={13} /> {selectedEvent.phone}
                </a>
              )}
              <div className="pt-1">
                {(() => { const cfg = STATUS_COLOR[selectedEvent.status] ?? STATUS_COLOR.pending; return (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    {STATUS_TR[selectedEvent.status] ?? selectedEvent.status}
                  </span>
                ); })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
