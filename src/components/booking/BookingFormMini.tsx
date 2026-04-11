"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  MapPin,
  Plane,
  ArrowLeftRight,
  Calendar,
  CornerDownLeft,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Region {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
  name_de: string;
  name_pl: string;
  name_ru: string;
}

function getCalDays(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const prev = new Date(year, month, 0).getDate();
  const days: { day: number; inMonth: boolean; date: Date }[] = [];
  for (let i = first - 1; i >= 0; i--)
    days.push({ day: prev - i, inMonth: false, date: new Date(year, month - 1, prev - i) });
  for (let i = 1; i <= total; i++)
    days.push({ day: i, inMonth: true, date: new Date(year, month, i) });
  while (days.length < 42)
    days.push({
      day: days.length - first - total + 1,
      inMonth: false,
      date: new Date(year, month + 1, days.length - first - total + 1),
    });
  return days;
}

export default function BookingFormMini() {
  const t = useTranslations("booking");
  const locale = useLocale();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [regions, setRegions] = useState<Region[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [depDate, setDepDate] = useState<Date | null>(null);
  const [depH, setDepH] = useState(12);
  const [depM, setDepM] = useState(0);
  const [hasRet, setHasRet] = useState(false);
  const [retDate, setRetDate] = useState<Date | null>(null);
  const [retH, setRetH] = useState(12);
  const [retM, setRetM] = useState(0);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(new Date());
  const [calFor, setCalFor] = useState<"dep" | "ret">("dep");

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("TORVIAN_booking_form");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.from) setFrom(d.from);
        if (d.to) setTo(d.to);
        if (d.depDate) setDepDate(new Date(d.depDate));
        if (typeof d.depH === "number") setDepH(d.depH);
        if (typeof d.depM === "number") setDepM(d.depM);
        if (d.hasRet) setHasRet(true);
        if (d.retDate) setRetDate(new Date(d.retDate));
        if (typeof d.retH === "number") setRetH(d.retH);
        if (typeof d.retM === "number") setRetM(d.retM);
        if (typeof d.adults === "number") setAdults(d.adults);
        if (typeof d.kids === "number") setKids(d.kids);
      }
    } catch {}
  }, []);

  // Save to sessionStorage on any change
  useEffect(() => {
    try {
      sessionStorage.setItem("TORVIAN_booking_form", JSON.stringify({
        from, to, depDate: depDate?.toISOString() ?? null, depH, depM,
        hasRet, retDate: retDate?.toISOString() ?? null, retH, retM, adults, kids,
      }));
    } catch {}
  }, [from, to, depDate, depH, depM, hasRet, retDate, retH, retM, adults, kids]);

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRegions(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const nameKey = `name_${locale}` as keyof Region;
  const airportName = ({ tr: "Antalya Havalimanı (AYT)", en: "Antalya Airport (AYT)", de: "Flughafen Antalya (AYT)", pl: "Lotnisko Antalya (AYT)", ru: "Аэропорт Анталья (AYT)" } as Record<string, string>)[locale] ?? "Antalya Airport (AYT)";
  const getName = (slug: string) => {
    if (slug === "antalya-airport") return airportName;
    const r = regions.find((r) => r.slug === slug);
    return r ? (r[nameKey] as string) || r.name_en : slug;
  };

  const fmtDate = (d: Date | null, h: number, m: number) => {
    if (!d) return null;
    const s = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
    return { text: s, time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
  };

  const swap = () => { const tmp = from; setFrom(to); setTo(tmp); };

  const openCal = (target: "dep" | "ret") => {
    if (target === "ret" && !depDate) return;
    setCalFor(target);
    const base = target === "dep" ? depDate : retDate;
    setCalMonth(base ? new Date(base.getFullYear(), base.getMonth(), 1) : new Date());
    setOpen("cal");
  };

  const pickDay = (d: Date) => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (d < now) return;
    if (calFor === "dep") {
      setDepDate(d);
      if (retDate && retDate < d) setRetDate(null);
    } else {
      if (depDate && d < depDate) return;
      setRetDate(d);
    }
  };

  const submit = () => {
    // Determine actual region: use whichever is NOT the airport
    const region = to === "antalya-airport" ? from : to;
    if (!region || region === "antalya-airport") return;
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    p.set("region", region);
    p.set("trip", hasRet ? "round_trip" : "one_way");
    if (depDate) {
      p.set("date", depDate.toISOString().split("T")[0]);
      p.set("time", `${String(depH).padStart(2, "0")}:${String(depM).padStart(2, "0")}`);
    }
    if (hasRet && retDate) {
      p.set("returnDate", retDate.toISOString().split("T")[0]);
      p.set("returnTime", `${String(retH).padStart(2, "0")}:${String(retM).padStart(2, "0")}`);
    }
    p.set("adults", String(adults));
    p.set("children", String(kids));
    router.push(`/booking?${p.toString()}`);
  };

  const depFmt = fmtDate(depDate, depH, depM);
  const retFmt = fmtDate(retDate, retH, retM);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = getCalDays(calMonth.getFullYear(), calMonth.getMonth());
  const mName = new Intl.DateTimeFormat(locale, { month: "long" }).format(calMonth);
  const wk =
    locale === "tr" ? ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
    : locale === "de" ? ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
    : locale === "ru" ? ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
    : locale === "pl" ? ["Nd", "Pn", "Wt", "Sr", "Cz", "Pt", "So"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const locItems = [
    { type: "airport" as const, value: "antalya-airport", label: airportName },
    ...regions.map((r) => ({
      type: "destination" as const,
      value: r.slug,
      label: (r[nameKey] as string) || r.name_en,
    })),
  ];

  /* --- Location dropdown --- */
  const renderLocDrop = (field: "from" | "to") => (
    <div className={`absolute top-full mt-1 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 max-h-[280px] overflow-y-auto min-w-[260px] ${field === "to" ? "right-0" : "left-0"} lg:left-0 lg:right-0 lg:w-[280px] lg:min-w-0`}>
      {locItems.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => { field === "from" ? setFrom(l.value) : setTo(l.value); setOpen(null); }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors ${
            (field === "from" ? from : to) === l.value ? "text-blue-600 font-semibold bg-blue-50/50" : "text-gray-700"
          }`}
        >
          {l.type === "airport" ? (
            <Plane size={15} className="text-blue-600 shrink-0" />
          ) : (
            <MapPin size={15} className="text-gray-400 shrink-0" />
          )}
          {l.label}
        </button>
      ))}
    </div>
  );

  /* --- Calendar popup --- */
  const renderCalendar = () => (
    <>
    <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(null)} />
    <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl lg:absolute lg:inset-auto lg:bottom-auto lg:top-full lg:mt-1 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-[310px] lg:rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
      {/* Mobile drag handle */}
      <div className="flex justify-center pt-2 pb-1 lg:hidden"><div className="w-10 h-1 rounded-full bg-gray-300" /></div>
      <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between">
        <button type="button" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))} className="hover:bg-white/20 rounded-lg p-1"><ChevronLeft size={16} /></button>
        <span className="font-semibold text-sm capitalize">{mName} {calMonth.getFullYear()}</span>
        <button type="button" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))} className="hover:bg-white/20 rounded-lg p-1"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-blue-600 border-b border-gray-100 py-1.5 px-2">
        {wk.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 text-center px-2 py-1.5 gap-y-0.5">
        {days.map((d, i) => {
          const past = d.date < today || (calFor === "ret" && depDate && d.date < depDate);
          const sel = calFor === "dep" ? depDate?.toDateString() === d.date.toDateString() : retDate?.toDateString() === d.date.toDateString();
          const isToday = d.date.toDateString() === new Date().toDateString();
          return (
            <button key={i} type="button" disabled={past || !d.inMonth} onClick={() => pickDay(d.date)}
              className={[
                "w-8 h-8 rounded-lg text-xs mx-auto flex items-center justify-center transition-colors",
                !d.inMonth ? "text-gray-200" : past ? "text-gray-300 cursor-not-allowed" : "hover:bg-blue-50 cursor-pointer",
                sel ? "bg-blue-600 text-white font-bold" : "",
                isToday && !sel ? "ring-1 ring-blue-300" : "",
                d.inMonth && !past && !sel ? "text-gray-700 font-medium" : "",
              ].join(" ")}
            >{d.day}</button>
          );
        })}
      </div>
      <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-center gap-5">
        <div className="text-center">
          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">HOUR</span>
          <div className="mt-1 border border-gray-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-base font-bold text-gray-900 w-6 text-center">{String(calFor === "dep" ? depH : retH).padStart(2, "0")}</span>
            <div className="flex flex-col">
              <button type="button" onClick={() => calFor === "dep" ? setDepH((h) => (h + 1) % 24) : setRetH((h) => (h + 1) % 24)} className="text-gray-400 hover:text-gray-600"><ChevronUp size={11} /></button>
              <button type="button" onClick={() => calFor === "dep" ? setDepH((h) => (h - 1 + 24) % 24) : setRetH((h) => (h - 1 + 24) % 24)} className="text-gray-400 hover:text-gray-600"><ChevronDown size={11} /></button>
            </div>
          </div>
        </div>
        <span className="text-base font-bold text-gray-300 mt-4">:</span>
        <div className="text-center">
          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">MINUTE</span>
          <div className="mt-1 border border-gray-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
            <span className="text-base font-bold text-gray-900 w-6 text-center">{String(calFor === "dep" ? depM : retM).padStart(2, "0")}</span>
            <div className="flex flex-col">
              <button type="button" onClick={() => calFor === "dep" ? setDepM((m) => (m + 5) % 60) : setRetM((m) => (m + 5) % 60)} className="text-gray-400 hover:text-gray-600"><ChevronUp size={11} /></button>
              <button type="button" onClick={() => calFor === "dep" ? setDepM((m) => (m - 5 + 60) % 60) : setRetM((m) => (m - 5 + 60) % 60)} className="text-gray-400 hover:text-gray-600"><ChevronDown size={11} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );

  /* --- Passenger popup --- */
  const renderPassengers = () => (
    <div className="absolute top-full mt-1 right-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-[220px]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{t("adult")}</p>
          <p className="text-[11px] text-gray-400">13+ {t("age")}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm">&minus;</button>
          <span className="text-sm font-bold text-gray-900 w-3 text-center">{adults}</span>
          <button type="button" onClick={() => setAdults(Math.min(10, adults + 1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm">+</button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{t("child")}</p>
          <p className="text-[11px] text-gray-400">0-12 {t("age")}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => setKids(Math.max(0, kids - 1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm">&minus;</button>
          <span className="text-sm font-bold text-gray-900 w-3 text-center">{kids}</span>
          <button type="button" onClick={() => setKids(Math.min(10, kids + 1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm">+</button>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* DESKTOP BAR (lg+) */}
      <div className="hidden lg:flex bg-white rounded-2xl shadow-2xl shadow-black/20 items-center h-[56px] border border-gray-100">
        {/* From */}
        <div className="relative flex-1 min-w-0 h-full">
          <button type="button" onClick={() => setOpen(open === "from" ? null : "from")} className="flex items-center gap-2 px-4 h-full w-full text-left hover:bg-gray-50/80 rounded-l-2xl transition-colors border-r border-gray-200/60">
            <MapPin size={16} className="text-blue-600 shrink-0" />
            <span className={`text-[13px] truncate ${from ? "font-semibold text-gray-900" : "text-gray-400"}`}>{from ? getName(from) : t("pickup")}</span>
          </button>
          {open === "from" && renderLocDrop("from")}
        </div>

        {/* Swap */}
        <button type="button" onClick={swap} className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 hover:bg-blue-700 transition-colors z-10 -mx-1 shadow">
          <ArrowLeftRight size={13} className="text-white" />
        </button>

        {/* To */}
        <div className="relative flex-1 min-w-0 h-full">
          <button type="button" onClick={() => setOpen(open === "to" ? null : "to")} className="flex items-center gap-2 px-4 h-full w-full text-left hover:bg-gray-50/80 transition-colors border-r border-gray-200/60">
            <MapPin size={16} className="text-blue-600 shrink-0" />
            <span className={`text-[13px] truncate ${to ? "font-semibold text-gray-900" : "text-gray-400"}`}>{to ? getName(to) : t("dropoff")}</span>
          </button>
          {open === "to" && renderLocDrop("to")}
        </div>

        {/* Dep date */}
        <div className="relative h-full shrink-0">
          <button type="button" onClick={() => openCal("dep")} className="flex items-center gap-2 px-4 h-full text-left hover:bg-gray-50/80 transition-colors border-r border-gray-200/60">
            <Calendar size={16} className="text-green-600 shrink-0" />
            {depFmt ? (
              <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">{depFmt.text} &middot; <span className="text-blue-600">{depFmt.time}</span></span>
            ) : (
              <span className="text-[13px] text-gray-400 whitespace-nowrap">{t("departureDate")}</span>
            )}
          </button>
          {open === "cal" && calFor === "dep" && renderCalendar()}
        </div>

        {/* Return */}
        <div className="relative h-full shrink-0">
          {!hasRet ? (
            <button type="button" onClick={() => { if (!depDate) return; setHasRet(true); openCal("ret"); }} className={`flex items-center gap-1.5 px-4 h-full transition-colors border-r border-gray-200/60 ${depDate ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}`}>
              <CornerDownLeft size={14} className="text-white" />
              <span className="text-[13px] font-semibold text-white whitespace-nowrap">{t("addReturn")}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-4 h-full border-r border-gray-200/60">
              <button type="button" onClick={() => openCal("ret")} className="flex items-center gap-1.5">
                <CornerDownLeft size={14} className="text-green-600 shrink-0" />
                {retFmt ? (
                  <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">{retFmt.text} &middot; <span className="text-blue-600">{retFmt.time}</span></span>
                ) : (
                  <span className="text-[13px] text-gray-400 whitespace-nowrap">{t("returnDate")}</span>
                )}
              </button>
              <button type="button" onClick={() => { setHasRet(false); setRetDate(null); }} className="text-red-400 hover:text-red-600 ml-0.5"><X size={13} /></button>
            </div>
          )}
          {open === "cal" && calFor === "ret" && renderCalendar()}
        </div>

        {/* Passengers */}
        <div className="relative h-full shrink-0">
          <button type="button" onClick={() => setOpen(open === "pax" ? null : "pax")} className="flex items-center gap-1.5 px-4 h-full hover:bg-gray-50/80 transition-colors">
            <Users size={16} className="text-blue-600 shrink-0" />
            <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">{adults + kids} {t("person")}</span>
          </button>
          {open === "pax" && renderPassengers()}
        </div>

        {/* Submit */}
        <button type="button" onClick={submit} className="h-[44px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] shrink-0 transition-colors mr-1.5 whitespace-nowrap active:scale-95">
          {t("findTransfer")}
        </button>
      </div>

      {/* MOBILE CARD (<lg) */}
      <div className="lg:hidden bg-white rounded-xl shadow-2xl shadow-black/20 p-3">
        {/* Row 1: From + Swap + To */}
        <div className="flex items-center gap-1 mb-2">
          <div className="relative flex-1 min-w-0">
            <button type="button" onClick={() => setOpen(open === "from" ? null : "from")} className="w-full flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-2.5 text-left min-w-0">
              <MapPin size={14} className="text-blue-600 shrink-0" />
              <span className={`text-[13px] leading-tight ${from ? "font-semibold text-gray-900" : "text-gray-400"}`}>{from ? getName(from) : t("pickup")}</span>
            </button>
            {open === "from" && renderLocDrop("from")}
          </div>
          <button type="button" onClick={swap} className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow">
            <ArrowLeftRight size={11} className="text-white" />
          </button>
          <div className="relative flex-1 min-w-0">
            <button type="button" onClick={() => setOpen(open === "to" ? null : "to")} className="w-full flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-2.5 text-left min-w-0">
              <MapPin size={14} className="text-blue-600 shrink-0" />
              <span className={`text-[13px] leading-tight ${to ? "font-semibold text-gray-900" : "text-gray-400"}`}>{to ? getName(to) : t("dropoff")}</span>
            </button>
            {open === "to" && renderLocDrop("to")}
          </div>
        </div>

        {/* Row 2: Date + Return + Passengers */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="relative flex-1 min-w-0">
            <button type="button" onClick={() => openCal("dep")} className="w-full flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-2.5 min-w-0">
              <Calendar size={14} className="text-green-600 shrink-0" />
              {depFmt ? (
                <span className="text-[12px] font-semibold text-gray-900 whitespace-nowrap">{depFmt.text} &middot; <span className="text-blue-600">{depFmt.time}</span></span>
              ) : (
                <span className="text-[12px] text-gray-400">{t("departureDate")}</span>
              )}
            </button>
            {open === "cal" && calFor === "dep" && renderCalendar()}
          </div>

          <div className="relative shrink-0">
            {!hasRet ? (
              <button type="button" onClick={() => { if (!depDate) return; setHasRet(true); openCal("ret"); }} className={`flex items-center gap-1 rounded-lg px-2.5 py-2.5 text-[12px] font-semibold ${depDate ? "text-white bg-blue-600" : "text-white bg-gray-300 cursor-not-allowed"}`}>
                <CornerDownLeft size={12} />{t("addReturn")}
              </button>
            ) : (
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-2.5">
                <button type="button" onClick={() => openCal("ret")} className="flex items-center gap-1">
                  <CornerDownLeft size={12} className="text-green-600" />
                  {retFmt ? (
                    <span className="text-[12px] font-semibold text-gray-900 whitespace-nowrap">{retFmt.text} &middot; <span className="text-blue-600">{retFmt.time}</span></span>
                  ) : (
                    <span className="text-[12px] text-gray-400">{t("returnDate")}</span>
                  )}
                </button>
                <button type="button" onClick={() => { setHasRet(false); setRetDate(null); }} className="text-red-400"><X size={11} /></button>
              </div>
            )}
            {open === "cal" && calFor === "ret" && renderCalendar()}
          </div>

          <div className="relative shrink-0">
            <button type="button" onClick={() => setOpen(open === "pax" ? null : "pax")} className="flex items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-2.5">
              <Users size={13} className="text-blue-600" />
              <span className="text-[12px] font-semibold text-gray-900">{adults + kids} {t("person")}</span>
            </button>
            {open === "pax" && renderPassengers()}
          </div>
        </div>

        {/* Submit */}
        <button type="button" onClick={submit} className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors active:scale-[0.98]">
          {t("findTransfer")}
        </button>
      </div>
    </div>
  );
}
