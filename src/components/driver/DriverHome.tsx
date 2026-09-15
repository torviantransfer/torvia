"use client";

import { useState } from "react";
import { CalendarOff, CheckCircle2, ChevronRight, Phone } from "lucide-react";
import { formatBookingDateTime } from "@/lib/datetime";

export interface DriverHomeJob {
  linkToken: string;
  code: string;
  /** Antalya wall-clock timestamp this leg runs at. */
  wall: string;
  route: string;
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  assigned: "Kabul bekliyor",
  accepted: "Kabul edildi",
  picked_up: "Yolda",
  completed: "Tamamlandı",
};

function JobRow({ job }: { job: DriverHomeJob }) {
  return (
    <a
      href={`/driver/${job.linkToken}`}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs font-bold text-orange-500">{job.code}</span>
          <span className="text-xs text-slate-400">{STATUS_LABEL[job.status] ?? job.status}</span>
        </div>
        <div className="mt-0.5 truncate text-sm font-semibold text-slate-900">{job.route}</div>
        <div className="mt-0.5 text-xs text-slate-500">{formatBookingDateTime(job.wall)}</div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-slate-300" aria-hidden="true" />
    </a>
  );
}

/** Next 14 days, "yyyy-mm-dd" each, starting today. */
function nextDays(today: string, count: number): string[] {
  const [y, m, d] = today.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(start);
    dt.setUTCDate(dt.getUTCDate() + i);
    return dt.toISOString().slice(0, 10);
  });
}

function dayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: dt.toLocaleDateString("tr-TR", { timeZone: "UTC", weekday: "short" }),
    day: dt.toLocaleDateString("tr-TR", { timeZone: "UTC", day: "numeric", month: "short" }),
  };
}

export default function DriverHome({
  driverName,
  phone,
  upcoming,
  recent,
  leaveDays,
  token,
  today,
}: {
  driverName: string;
  phone: string | null;
  upcoming: DriverHomeJob[];
  recent: DriverHomeJob[];
  leaveDays: string[];
  token: string;
  today: string;
}) {
  const [leave, setLeave] = useState(new Set(leaveDays));
  const [busy, setBusy] = useState<string | null>(null);
  const workingDays = new Set(upcoming.map((j) => j.wall.slice(0, 10)));

  const toggleLeave = async (date: string) => {
    const isLeave = leave.has(date);
    setBusy(date);
    try {
      const res = await fetch("/api/driver/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, date, action: isLeave ? "remove" : "add" }),
      });
      if (!res.ok) return;
      setLeave((prev) => {
        const next = new Set(prev);
        if (isLeave) next.delete(date);
        else next.add(date);
        return next;
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <header className="rounded-2xl border border-slate-200 bg-slate-950 px-5 py-4 text-white">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">TORVIAN Şoför Paneli</p>
        <h1 className="mt-1 text-lg font-black">{driverName}</h1>
        {phone && (
          <a href={`tel:${phone}`} className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-orange-400">
            <Phone size={13} aria-hidden="true" />
            {phone}
          </a>
        )}
      </header>

      <section>
        <h2 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
          Bugün ve yaklaşan işler ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            Bekleyen iş yok.
          </div>
        ) : (
          <div className="grid gap-2">
            {upcoming.map((j) => (
              <JobRow key={`${j.code}-${j.linkToken}`} job={j} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
          <CalendarOff size={14} aria-hidden="true" />
          İzin günleri
        </h2>
        <p className="mb-2.5 text-xs text-slate-500">Müsait olmadığınız günleri işaretleyin; ofis size iş atarken bunu görür.</p>
        <div className="grid grid-cols-7 gap-1.5">
          {nextDays(today, 14).map((date) => {
            const { weekday, day } = dayLabel(date);
            const isLeave = leave.has(date);
            const hasWork = workingDays.has(date);
            return (
              <button
                key={date}
                type="button"
                disabled={hasWork || busy === date}
                onClick={() => toggleLeave(date)}
                aria-pressed={isLeave}
                className={`flex flex-col items-center gap-0.5 rounded-xl border px-1 py-2 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  isLeave
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
                title={hasWork ? "Bu günde işiniz var" : isLeave ? "İzinli — kaldırmak için dokunun" : "İzinli işaretlemek için dokunun"}
              >
                <span className="text-[10px] font-bold uppercase">{weekday}</span>
                <span className="text-xs font-semibold tabular-nums">{day}</span>
              </button>
            );
          })}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
            <CheckCircle2 size={14} aria-hidden="true" />
            Son tamamlananlar
          </h2>
          <div className="grid gap-2">
            {recent.map((j) => (
              <JobRow key={`${j.code}-${j.linkToken}`} job={j} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
