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

const STATUS: Record<string, { label: string; dot: string }> = {
  assigned: { label: "Kabul bekliyor", dot: "bg-[#FF9500]" },
  accepted: { label: "Kabul edildi", dot: "bg-[#007AFF]" },
  picked_up: { label: "Yolda", dot: "bg-[#5856D6]" },
  completed: { label: "Tamamlandı", dot: "bg-[#34C759]" },
};

function JobRow({ job }: { job: DriverHomeJob }) {
  return (
    <a href={`/driver/${job.linkToken}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-black/[0.03]">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[16px] font-semibold text-[#1d1d1f]">{job.route}</div>
        <div className="mt-0.5 text-[14px] text-[#6e6e73]">{formatBookingDateTime(job.wall)}</div>
        <div className="mt-1 flex items-center gap-2 text-[12.5px] text-[#86868b]">
          <span className="font-mono tracking-wide">{job.code}</span>
          <span className="inline-flex items-center gap-1">
            <span className={`size-1.5 rounded-full ${STATUS[job.status]?.dot ?? "bg-[#8E8E93]"}`} />
            {STATUS[job.status]?.label ?? job.status}
          </span>
        </div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-[#c7c7cc]" aria-hidden="true" />
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
    <div className="space-y-6 pb-10">
      <header className="px-1">
        <p className="text-[13px] font-medium text-[#86868b]">TORVIAN Şoför Paneli</p>
        <h1 className="mt-0.5 text-[30px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">{driverName}</h1>
        {phone && (
          <a href={`tel:${phone}`} className="mt-1 inline-flex items-center gap-1.5 text-[15px] text-[#007AFF]">
            <Phone size={13} aria-hidden="true" />
            {phone}
          </a>
        )}
      </header>

      <section>
        <h2 className="mb-1.5 px-4 text-[13px] font-medium uppercase tracking-[0.04em] text-[#86868b]">
          Bugün ve yaklaşan işler ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="rounded-[18px] bg-white p-6 text-center text-[15px] text-[#86868b] ring-1 ring-black/[0.04]">
            Bekleyen iş yok.
          </div>
        ) : (
          <div className="divide-y divide-black/[0.06] overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.04]">
            {upcoming.map((j) => (
              <JobRow key={`${j.code}-${j.linkToken}`} job={j} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1.5 flex items-center gap-1.5 px-4 text-[13px] font-medium uppercase tracking-[0.04em] text-[#86868b]">
          <CalendarOff size={14} aria-hidden="true" />
          İzin günleri
        </h2>
        <p className="mb-2.5 px-4 text-[13px] text-[#6e6e73]">Müsait olmadığınız günleri işaretleyin; ofis size iş atarken bunu görür.</p>
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
                className={`flex flex-col items-center gap-0.5 rounded-[12px] px-1 py-2 text-center transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isLeave
                    ? "bg-[#FF3B30] text-white"
                    : "bg-white text-[#1d1d1f] ring-1 ring-black/[0.04] active:bg-black/[0.03]"
                }`}
                title={hasWork ? "Bu günde işiniz var" : isLeave ? "İzinli — kaldırmak için dokunun" : "İzinli işaretlemek için dokunun"}
              >
                <span className={`text-[11px] font-medium uppercase ${isLeave ? "text-white/80" : "text-[#86868b]"}`}>{weekday}</span>
                <span className="text-[13px] font-semibold tabular-nums">{day}</span>
              </button>
            );
          })}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-1.5 flex items-center gap-1.5 px-4 text-[13px] font-medium uppercase tracking-[0.04em] text-[#86868b]">
            <CheckCircle2 size={14} aria-hidden="true" />
            Son tamamlananlar
          </h2>
          <div className="divide-y divide-black/[0.06] overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.04]">
            {recent.map((j) => (
              <JobRow key={`${j.code}-${j.linkToken}`} job={j} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
