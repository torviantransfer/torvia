"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Car,
  Phone,
  X,
  Users,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  code: string;
  status: string;
  pickup: string;
  returnDate: string | null;
  tripType: string;
  price: number;
  hotel: string | null;
  adults: number;
  children: number;
  customer: string;
  phone: string;
  region: string;
  vehicle: string;
  driver: string;
}

const STATUS_COLOR: Record<string, { bg: string; dot: string; text: string }> = {
  pending: { bg: "bg-amber-50", dot: "bg-amber-400", text: "text-amber-700" },
  paid: { bg: "bg-blue-50", dot: "bg-blue-400", text: "text-blue-700" },
  driver_assigned: { bg: "bg-violet-50", dot: "bg-violet-400", text: "text-violet-700" },
  passenger_picked_up: { bg: "bg-indigo-50", dot: "bg-indigo-400", text: "text-indigo-700" },
  completed: { bg: "bg-emerald-50", dot: "bg-emerald-400", text: "text-emerald-700" },
  cancelled: { bg: "bg-red-50", dot: "bg-red-400", text: "text-red-700" },
  cancel_requested: { bg: "bg-orange-50", dot: "bg-orange-400", text: "text-orange-700" },
};

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export default function CalendarView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/calendar?year=${year}&month=${month}`);
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setSelectedDay(now.getDate());
  };

  // Calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Monday = 0
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.pickup);
      return d.getDate() === day;
    });
  };

  const isToday = (day: number) =>
    day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

  // Events for selected day (sidebar)
  const dayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="flex gap-6">
      {/* Main calendar */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
              {events.length} transfer
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
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

        {/* Calendar grid */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-slate-50 bg-slate-50/30" />;
              }
              const dayEv = getEventsForDay(day);
              const today = isToday(day);
              const selected = selectedDay === day;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(selected ? null : day)}
                  className={`min-h-[100px] border-b border-r border-slate-50 p-1.5 cursor-pointer transition-colors ${
                    selected ? "bg-orange-50/60" : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium ${
                        today
                          ? "bg-orange-500 text-white"
                          : selected
                            ? "bg-orange-100 text-orange-700"
                            : "text-slate-600"
                      }`}
                    >
                      {day}
                    </span>
                    {dayEv.length > 0 && (
                      <span className="text-[10px] font-medium text-slate-400">{dayEv.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayEv.slice(0, 3).map((ev) => {
                      const cfg = STATUS_COLOR[ev.status] ?? STATUS_COLOR.pending;
                      return (
                        <button
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); setSelectedDay(day); }}
                          className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 ${cfg.bg} ${cfg.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                          <span className="truncate">
                            {new Date(ev.pickup).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} {ev.region}
                          </span>
                        </button>
                      );
                    })}
                    {dayEv.length > 3 && (
                      <p className="text-[10px] text-slate-400 pl-1">+{dayEv.length - 3} daha</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Right sidebar - day detail */}
      <div className="w-80 shrink-0 hidden xl:block">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h3 className="font-semibold text-slate-800 text-sm mb-3">
            {selectedDay
              ? `${selectedDay} ${MONTH_NAMES[month - 1]} ${year}`
              : "Bir gün seçin"}
          </h3>
          {selectedDay && dayEvents.length === 0 && (
            <p className="text-xs text-slate-400">Bu gün transfer yok</p>
          )}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {dayEvents.map((ev) => {
              const cfg = STATUS_COLOR[ev.status] ?? STATUS_COLOR.pending;
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {ev.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{ev.code}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <Clock size={11} className="text-slate-400" />
                    {new Date(ev.pickup).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    <span className="text-slate-400 mx-1">→</span>
                    {ev.region}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{ev.customer}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800 text-sm">{selectedEvent.code}</span>
                {(() => {
                  const cfg = STATUS_COLOR[selectedEvent.status] ?? STATUS_COLOR.pending;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {selectedEvent.status.replace(/_/g, " ")}
                    </span>
                  );
                })()}
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <Row icon={Clock} label="Alış" value={new Date(selectedEvent.pickup).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
              {selectedEvent.returnDate && (
                <Row icon={Clock} label="Dönüş" value={new Date(selectedEvent.returnDate).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
              )}
              <Row icon={MapPin} label="Güzergah" value={`Havalimanı → ${selectedEvent.region}`} />
              <Row icon={User} label="Müşteri" value={selectedEvent.customer} />
              {selectedEvent.phone && <Row icon={Phone} label="Telefon" value={selectedEvent.phone} />}
              <Row icon={Users} label="Yolcular" value={`${selectedEvent.adults} yetişkin${selectedEvent.children > 0 ? ` + ${selectedEvent.children} çocuk` : ""}`} />
              {selectedEvent.vehicle && <Row icon={Car} label="Araç" value={selectedEvent.vehicle} />}
              {selectedEvent.driver && <Row icon={User} label="Şoför" value={selectedEvent.driver} />}
              {selectedEvent.hotel && <Row icon={MapPin} label="Otel" value={selectedEvent.hotel} />}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {selectedEvent.tripType === "round_trip" ? "Gidiş-Dönüş" : "Tek Yön"}
                </span>
                <span className="font-bold text-slate-900">${selectedEvent.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ size: number; className: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-slate-700 text-[13px]">{value}</p>
      </div>
    </div>
  );
}
