"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Lock, Unlock, AlertCircle, Plus, Trash2, Car, Users } from "lucide-react";

type BlockedDate = {
  id: string;
  blocked_date: string;
  reason: string | null;
  created_at: string;
};

type DateCount = Record<string, number>;

export default function DateAvailabilityManager() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [dateCounts, setDateCounts] = useState<DateCount>({});
  const [maxDaily, setMaxDaily] = useState(3);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const getMonthRange = useCallback((m: string) => {
    const [year, mon] = m.split("-").map(Number);
    const from = `${year}-${String(mon).padStart(2, "0")}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const to = `${year}-${String(mon).padStart(2, "0")}-${lastDay}`;
    return { from, to };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getMonthRange(month);

    const [blockedRes, availRes] = await Promise.all([
      fetch(`/api/admin/blocked-dates?from=${from}&to=${to}`),
      fetch(`/api/availability?from=${from}&to=${to}`),
    ]);

    const blockedData = await blockedRes.json();
    const availData = await availRes.json();

    if (Array.isArray(blockedData)) setBlockedDates(blockedData);
    if (availData.dateCounts) setDateCounts(availData.dateCounts);
    if (availData.maxDaily) setMaxDaily(availData.maxDaily);

    setLoading(false);
  }, [month, getMonthRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const blockDate = async () => {
    if (!newDate) return;
    const res = await fetch("/api/admin/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, reason: newReason || null }),
    });

    if (res.ok) {
      setNewDate("");
      setNewReason("");
      fetchData();
    }
  };

  const unblockDate = async (date: string) => {
    const res = await fetch(`/api/admin/blocked-dates?date=${date}`, {
      method: "DELETE",
    });
    if (res.ok) fetchData();
  };

  // Generate calendar grid for the month
  const renderCalendar = () => {
    const [year, mon] = month.split("-").map(Number);
    const firstDay = new Date(year, mon - 1, 1).getDay();
    const daysInMonth = new Date(year, mon, 0).getDate();
    const today = new Date().toISOString().split("T")[0];

    const blockedSet = new Set(blockedDates.map((d) => d.blocked_date));
    const cells = [];

    // Day headers
    const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    for (const d of dayNames) {
      cells.push(
        <div key={`h-${d}`} className="text-center text-xs font-semibold text-gray-500 py-2">
          {d}
        </div>
      );
    }

    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const count = dateCounts[dateStr] || 0;
      const isBlocked = blockedSet.has(dateStr);
      const isFull = count >= maxDaily;
      const isPast = dateStr < today;

      let bg = "rgba(255,255,255,0.03)";
      let border = "1px solid rgba(255,255,255,0.06)";
      let textColor = "text-white";

      if (isPast) {
        bg = "rgba(255,255,255,0.01)";
        textColor = "text-gray-600";
      } else if (isBlocked) {
        bg = "rgba(239,68,68,0.15)";
        border = "1px solid rgba(239,68,68,0.3)";
        textColor = "text-red-400";
      } else if (isFull) {
        bg = "rgba(249,115,22,0.15)";
        border = "1px solid rgba(249,115,22,0.3)";
        textColor = "text-orange-400";
      } else if (count > 0) {
        bg = "rgba(52,211,153,0.1)";
        border = "1px solid rgba(52,211,153,0.2)";
      }

      cells.push(
        <div
          key={dateStr}
          className={`relative p-2 rounded-lg text-center cursor-default ${textColor}`}
          style={{ backgroundColor: bg, border, minHeight: "60px" }}
        >
          <div className="text-sm font-semibold">{day}</div>
          {!isPast && (
            <div className="mt-1">
              {isBlocked ? (
                <span className="text-[10px] font-bold text-red-400">KAPALI</span>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <Car size={10} className={count >= maxDaily ? "text-orange-400" : "text-gray-500"} />
                  <span className={`text-[10px] font-bold ${count >= maxDaily ? "text-orange-400" : "text-gray-400"}`}>
                    {count}/{maxDaily}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar size={20} className="text-orange-500" />
          Tarih & Kapasite Yönetimi
        </h2>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users size={14} />
          Günlük Max: <span className="font-bold text-slate-900">{maxDaily}</span> rezervasyon
        </div>
      </div>

      {/* Month selector */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            const [y, m] = month.split("-").map(Number);
            const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
            setMonth(prev);
          }}
          className="px-3 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
        >
          ◀
        </button>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm text-slate-900 bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          onClick={() => {
            const [y, m] = month.split("-").map(Number);
            const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
            setMonth(next);
          }}
          className="px-3 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
        >
          ▶
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200" />
          <span>Müsait (Rez. var)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200" />
          <span>Dolu (Max kapasiteye ulaşıldı)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
          <span>Manuel Kapalı</span>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">{renderCalendar()}</div>
      )}

      {/* Block date form */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Lock size={14} className="text-red-500" />
          Tarihi Manuel Kapat
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="px-4 py-2.5 rounded-lg text-slate-900 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            type="text"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Sebep (opsiyonel)"
            className="flex-1 px-4 py-2.5 rounded-lg text-slate-900 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button
            onClick={blockDate}
            disabled={!newDate}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition flex items-center gap-2"
          >
            <Plus size={14} />
            Kapat
          </button>
        </div>
      </div>

      {/* Blocked dates list */}
      {blockedDates.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500" />
              Kapalı Tarihler
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {blockedDates.map((bd) => (
              <div key={bd.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-900">{bd.blocked_date}</span>
                  {bd.reason && (
                    <span className="text-xs text-slate-500 ml-3">{bd.reason}</span>
                  )}
                </div>
                <button
                  onClick={() => unblockDate(bd.blocked_date)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition flex items-center gap-1"
                >
                  <Unlock size={12} />
                  Aç
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
