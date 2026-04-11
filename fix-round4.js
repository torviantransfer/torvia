const fs = require("fs");
const path = require("path");
const base = __dirname;

function w(rel, content) {
  fs.writeFileSync(path.join(base, rel), content, "utf8");
  console.log(`✅ ${rel}`);
}

// ===== 1. BookingFormMini — Complete redesign =====
w("src/components/booking/BookingFormMini.tsx", `"use client";

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

const LOCATIONS = [
  { type: "airport", value: "dalaman-airport", label: "Dalaman Havalimanı (DLM)" },
  { type: "airport", value: "antalya-airport", label: "Antalya Havalimanı (AYT)" },
  { type: "city", value: "sehirici", label: "Antalya Şehir Merkezi" },
  { type: "destination", value: "kundu-lara", label: "Kundu - Lara" },
  { type: "destination", value: "belek", label: "Belek" },
  { type: "destination", value: "side", label: "Side" },
  { type: "destination", value: "alanya", label: "Alanya" },
  { type: "destination", value: "kemer", label: "Kemer" },
  { type: "destination", value: "kalkan", label: "Kalkan" },
  { type: "destination", value: "kas", label: "Kaş" },
  { type: "destination", value: "fethiye", label: "Fethiye" },
];

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

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loc = (v: string) => LOCATIONS.find((l) => l.value === v);

  const fmtDate = (d: Date | null, h: number, m: number) => {
    if (!d) return null;
    const s = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
    return { text: s, time: \\\`\\\${String(h).padStart(2, "0")}:\\\${String(m).padStart(2, "0")}\\\` };
  };

  const swap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  };

  const openCal = (target: "dep" | "ret") => {
    setCalFor(target);
    const base = target === "dep" ? depDate : retDate;
    setCalMonth(base ? new Date(base.getFullYear(), base.getMonth(), 1) : new Date());
    setOpen("cal");
  };

  const pickDay = (d: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (d < now) return;
    if (calFor === "dep") setDepDate(d);
    else setRetDate(d);
  };

  const submit = () => {
    if (!to) return;
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    p.set("region", to);
    p.set("trip", hasRet ? "round_trip" : "one_way");
    if (depDate) {
      p.set("date", depDate.toISOString().split("T")[0]);
      p.set("time", \\\`\\\${String(depH).padStart(2, "0")}:\\\${String(depM).padStart(2, "0")}\\\`);
    }
    if (hasRet && retDate) {
      p.set("returnDate", retDate.toISOString().split("T")[0]);
      p.set("returnTime", \\\`\\\${String(retH).padStart(2, "0")}:\\\${String(retM).padStart(2, "0")}\\\`);
    }
    p.set("adults", String(adults));
    p.set("children", String(kids));
    router.push(\\\`/booking?\\\${p.toString()}\\\`);
  };

  const depFmt = fmtDate(depDate, depH, depM);
  const retFmt = fmtDate(retDate, retH, retM);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = getCalDays(calMonth.getFullYear(), calMonth.getMonth());
  const mName = new Intl.DateTimeFormat(locale, { month: "long" }).format(calMonth);
  const wk =
    locale === "tr"
      ? ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"]
      : locale === "de"
        ? ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
        : locale === "ru"
          ? ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
          : locale === "pl"
            ? ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"]
            : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // -- Location dropdown
  const renderLocDrop = (field: "from" | "to") => (
    <div className="absolute top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 left-0 right-0 lg:right-auto lg:w-[300px]">
      {LOCATIONS.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => {
            field === "from" ? setFrom(l.value) : setTo(l.value);
            setOpen(null);
          }}
          className={\\\`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors \\\${
            (field === "from" ? from : to) === l.value ? "text-blue-600 font-semibold" : "text-gray-700"
          }\\\`}
        >
          {l.type === "airport" ? (
            <Plane size={16} className="text-teal-600 shrink-0" />
          ) : (
            <MapPin size={16} className="text-teal-600 shrink-0" />
          )}
          {l.label}
        </button>
      ))}
    </div>
  );

  // -- Calendar popup
  const renderCalendar = () => (
    <div
      className="absolute top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden left-1/2 -translate-x-1/2"
      style={{ width: 320 }}
    >
      {/* Header */}
      <div className="bg-orange-500 text-white px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold capitalize">
          {mName} <span className="opacity-60">▾</span> {calMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-orange-500 border-b border-gray-100 py-2 px-3">
        {wk.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 text-center px-3 py-2 gap-y-0.5">
        {days.map((d, i) => {
          const past = d.date < today;
          const sel =
            calFor === "dep"
              ? depDate?.toDateString() === d.date.toDateString()
              : retDate?.toDateString() === d.date.toDateString();
          const isToday = d.date.toDateString() === new Date().toDateString();
          return (
            <button
              key={i}
              type="button"
              disabled={past || !d.inMonth}
              onClick={() => pickDay(d.date)}
              className={\\\`w-9 h-9 rounded-full text-sm mx-auto flex items-center justify-center transition-colors
                \\\${!d.inMonth ? "text-gray-200" : past ? "text-gray-300 cursor-not-allowed" : "hover:bg-orange-50 cursor-pointer"}
                \\\${sel ? "bg-orange-500 text-white font-bold" : ""}
                \\\${isToday && !sel ? "ring-1 ring-gray-300" : ""}
                \\\${d.inMonth && !past && !sel ? "text-gray-700 font-medium" : ""}
              \\\`}
            >
              {d.day}
            </button>
          );
        })}
      </div>

      {/* Time picker */}
      <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-center gap-6">
        <div className="text-center">
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">HOUR</span>
          <div className="mt-1 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900 w-7 text-center">
              {String(calFor === "dep" ? depH : retH).padStart(2, "0")}
            </span>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() =>
                  calFor === "dep" ? setDepH((h) => (h + 1) % 24) : setRetH((h) => (h + 1) % 24)
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() =>
                  calFor === "dep"
                    ? setDepH((h) => (h - 1 + 24) % 24)
                    : setRetH((h) => (h - 1 + 24) % 24)
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
        </div>

        <span className="text-lg font-bold text-gray-300 mt-5">:</span>

        <div className="text-center">
          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">MINUTE</span>
          <div className="mt-1 border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900 w-7 text-center">
              {String(calFor === "dep" ? depM : retM).padStart(2, "0")}
            </span>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() =>
                  calFor === "dep" ? setDepM((m) => (m + 5) % 60) : setRetM((m) => (m + 5) % 60)
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() =>
                  calFor === "dep"
                    ? setDepM((m) => (m - 5 + 60) % 60)
                    : setRetM((m) => (m - 5 + 60) % 60)
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // -- Passengers popup
  const renderPassengers = () => (
    <div className="absolute top-full mt-2 right-0 lg:right-20 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-[240px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-gray-900">{t("adult")}</p>
          <p className="text-xs text-gray-400">13+ {t("age")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAdults(Math.max(1, adults - 1))}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base"
          >
            −
          </button>
          <span className="text-base font-bold text-gray-900 w-4 text-center">{adults}</span>
          <button
            type="button"
            onClick={() => setAdults(Math.min(10, adults + 1))}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">{t("child")}</p>
          <p className="text-xs text-gray-400">0-12 {t("age")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setKids(Math.max(0, kids - 1))}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base"
          >
            −
          </button>
          <span className="text-base font-bold text-gray-900 w-4 text-center">{kids}</span>
          <button
            type="button"
            onClick={() => setKids(Math.min(10, kids + 1))}
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-base"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ========== DESKTOP BAR (lg+) ========== */}
      <div className="hidden lg:flex bg-white rounded-full shadow-2xl shadow-black/20 items-center h-[60px]">
        {/* From */}
        <button
          type="button"
          onClick={() => setOpen(open === "from" ? null : "from")}
          className="flex items-center gap-2.5 px-5 h-full flex-1 min-w-0 text-left hover:bg-gray-50/80 rounded-l-full transition-colors"
        >
          <MapPin size={18} className="text-orange-500 shrink-0" />
          <span
            className={\\\`text-sm truncate \\\${from ? "font-semibold text-gray-900" : "text-gray-400"}\\\`}
          >
            {loc(from)?.label || t("pickup")}
          </span>
        </button>

        {/* Swap */}
        <button
          type="button"
          onClick={swap}
          className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center shrink-0 hover:bg-orange-600 transition-colors z-10 -mx-1 shadow-md"
        >
          <ArrowLeftRight size={14} className="text-white" />
        </button>

        {/* To */}
        <button
          type="button"
          onClick={() => setOpen(open === "to" ? null : "to")}
          className="flex items-center gap-2.5 px-5 h-full flex-1 min-w-0 text-left hover:bg-gray-50/80 transition-colors border-r border-gray-200/80"
        >
          <MapPin size={18} className="text-orange-500 shrink-0" />
          <span
            className={\\\`text-sm truncate \\\${to ? "font-semibold text-gray-900" : "text-gray-400"}\\\`}
          >
            {loc(to)?.label || t("dropoff")}
          </span>
        </button>

        {/* Date */}
        <button
          type="button"
          onClick={() => openCal("dep")}
          className="flex items-center gap-2 px-5 h-full shrink-0 text-left hover:bg-gray-50/80 transition-colors border-r border-gray-200/80"
        >
          <Calendar size={18} className="text-orange-500 shrink-0" />
          {depFmt ? (
            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              {depFmt.text} · <span className="text-orange-500">{depFmt.time}</span>
            </span>
          ) : (
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {t("departureDate")}
            </span>
          )}
        </button>

        {/* Return */}
        {!hasRet ? (
          <button
            type="button"
            onClick={() => {
              setHasRet(true);
              openCal("ret");
            }}
            className="flex items-center gap-2 px-5 h-full shrink-0 transition-colors border-r border-gray-200/80"
            style={{ backgroundColor: "#1A4D5C" }}
          >
            <CornerDownLeft size={16} className="text-white" />
            <span className="text-sm font-semibold text-white whitespace-nowrap">
              {t("addReturn")}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-5 h-full shrink-0 border-r border-gray-200/80">
            <button
              type="button"
              onClick={() => openCal("ret")}
              className="flex items-center gap-2"
            >
              <CornerDownLeft size={16} className="text-orange-500 shrink-0" />
              {retFmt ? (
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {retFmt.text} · <span className="text-orange-500">{retFmt.time}</span>
                </span>
              ) : (
                <span className="text-sm text-gray-400 whitespace-nowrap">{t("returnDate")}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setHasRet(false);
                setRetDate(null);
              }}
              className="text-red-400 hover:text-red-600 ml-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Passengers */}
        <button
          type="button"
          onClick={() => setOpen(open === "pax" ? null : "pax")}
          className="flex items-center gap-2 px-5 h-full shrink-0 hover:bg-gray-50/80 transition-colors"
        >
          <Users size={18} className="text-orange-500 shrink-0" />
          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
            {adults + kids} {t("person")}
          </span>
        </button>

        {/* Submit */}
        <button
          type="button"
          onClick={submit}
          className="h-[48px] px-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shrink-0 transition-colors mr-1.5 whitespace-nowrap active:scale-95"
        >
          {t("findTransfer")}
        </button>
      </div>

      {/* ========== MOBILE CARD (<lg) ========== */}
      <div className="lg:hidden bg-white rounded-2xl shadow-2xl shadow-black/20 p-4">
        {/* From + Swap + To */}
        <div className="flex items-center gap-1 mb-3">
          <button
            type="button"
            onClick={() => setOpen(open === "from" ? null : "from")}
            className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-3 text-left min-w-0"
          >
            <MapPin size={16} className="text-orange-500 shrink-0" />
            <span
              className={\\\`text-sm truncate \\\${from ? "font-semibold text-gray-900" : "text-gray-400"}\\\`}
            >
              {loc(from)?.label || t("pickup")}
            </span>
          </button>
          <button
            type="button"
            onClick={swap}
            className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0 shadow-md"
          >
            <ArrowLeftRight size={12} className="text-white" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(open === "to" ? null : "to")}
            className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-3 text-left min-w-0"
          >
            <MapPin size={16} className="text-orange-500 shrink-0" />
            <span
              className={\\\`text-sm truncate \\\${to ? "font-semibold text-gray-900" : "text-gray-400"}\\\`}
            >
              {loc(to)?.label || t("dropoff")}
            </span>
          </button>
        </div>

        {/* Date + Return + Passengers */}
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => openCal("dep")}
            className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-3 min-w-0"
          >
            <Calendar size={16} className="text-orange-500 shrink-0" />
            {depFmt ? (
              <span className="text-xs font-semibold text-gray-900 whitespace-nowrap truncate">
                {depFmt.text} · <span className="text-orange-500">{depFmt.time}</span>
              </span>
            ) : (
              <span className="text-xs text-gray-400 truncate">{t("departureDate")}</span>
            )}
          </button>

          {!hasRet ? (
            <button
              type="button"
              onClick={() => {
                setHasRet(true);
                openCal("ret");
              }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-3 shrink-0 text-white text-xs font-semibold"
              style={{ backgroundColor: "#1A4D5C" }}
            >
              <CornerDownLeft size={14} />
              {t("addReturn")}
            </button>
          ) : (
            <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-3 shrink-0">
              <button
                type="button"
                onClick={() => openCal("ret")}
                className="flex items-center gap-1.5"
              >
                <CornerDownLeft size={14} className="text-orange-500" />
                {retFmt ? (
                  <span className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                    {retFmt.text} · <span className="text-orange-500">{retFmt.time}</span>
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">{t("returnDate")}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasRet(false);
                  setRetDate(null);
                }}
                className="text-red-400 ml-0.5"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen(open === "pax" ? null : "pax")}
            className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3 py-3 shrink-0"
          >
            <Users size={14} className="text-orange-500" />
            <span className="text-xs font-semibold text-gray-900">
              {adults + kids} {t("person")}
            </span>
          </button>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={submit}
          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors active:scale-[0.98]"
        >
          {t("findTransfer")}
        </button>
      </div>

      {/* ========== DROPDOWNS ========== */}
      {open === "from" && renderLocDrop("from")}
      {open === "to" && renderLocDrop("to")}
      {open === "cal" && renderCalendar()}
      {open === "pax" && renderPassengers()}
    </div>
  );
}
`);

// ===== 2. TestimonialsSection — Horizontal auto-sliding carousel =====
w("src/components/home/TestimonialsSection.tsx", `"use client";

import { useTranslations } from "next-intl";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function TestimonialsSection() {
  const t = useTranslations("testimonials");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const testimonials = [
    { nameKey: "review1Name", fromKey: "review1From", textKey: "review1Text", rating: 5 },
    { nameKey: "review2Name", fromKey: "review2From", textKey: "review2Text", rating: 5 },
    { nameKey: "review3Name", fromKey: "review3From", textKey: "review3Text", rating: 5 },
    { nameKey: "review4Name", fromKey: "review4From", textKey: "review4Text", rating: 5 },
    { nameKey: "review5Name", fromKey: "review5From", textKey: "review5Text", rating: 5 },
  ];

  const scrollTo = (idx: number) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const card = el.children[idx] as HTMLElement;
    if (card) {
      el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
      setCurrent(idx);
    }
  };

  // Auto-slide
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % testimonials.length;
        if (scrollRef.current) {
          const el = scrollRef.current;
          const card = el.children[next] as HTMLElement;
          if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#F5F5F7" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-3">
            {t("heading")}
          </h2>
          <p className="text-gray-500 text-base max-w-2xl mx-auto">
            {t("subheading")}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Nav arrows — desktop only */}
          <button
            type="button"
            onClick={() => scrollTo((current - 1 + testimonials.length) % testimonials.length)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-gray-600 hover:text-gray-900 transition-colors hidden md:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scrollTo((current + 1) % testimonials.length)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 items-center justify-center text-gray-600 hover:text-gray-900 transition-colors hidden md:flex"
          >
            <ChevronRight size={18} />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-2 px-2"
            style={{ scrollbarWidth: "none" }}
          >
            {testimonials.map((item) => (
              <div
                key={item.nameKey}
                className="snap-center shrink-0 w-[85vw] sm:w-[340px] p-6 rounded-2xl"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  &ldquo;{t(item.textKey)}&rdquo;
                </p>
                <div>
                  <p className="text-gray-900 text-sm font-medium">{t(item.nameKey)}</p>
                  <p className="text-gray-500 text-xs">{t(item.fromKey)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                className={\\\`h-2 rounded-full transition-all \\\${i === current ? "bg-gray-900 w-6" : "bg-gray-300 w-2"}\\\`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
`);

// ===== 3. TrustBadges — Desktop grid, mobile auto-cycling single =====
w("src/components/home/TrustBadges.tsx", `"use client";

import { useTranslations } from "next-intl";
import { Shield, Clock, Plane, Headset } from "lucide-react";
import { useState, useEffect } from "react";

export default function TrustBadges() {
  const t = useTranslations("trust");
  const [active, setActive] = useState(0);

  const badges = [
    { icon: Shield, titleKey: "licensedTitle", descKey: "licensedDesc", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
    { icon: Headset, titleKey: "conciergeTitle", descKey: "conciergeDesc", color: "#FF9500", bg: "rgba(255,149,0,0.08)" },
    { icon: Plane, titleKey: "flightTitle", descKey: "flightDesc", color: "#007AFF", bg: "rgba(0,122,255,0.08)" },
    { icon: Clock, titleKey: "punctualTitle", descKey: "punctualDesc", color: "#34C759", bg: "rgba(52,199,89,0.08)" },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActive((a) => (a + 1) % badges.length), 3000);
    return () => clearInterval(timer);
  }, [badges.length]);

  return (
    <section
      className="py-8 sm:py-10 border-b"
      style={{ backgroundColor: "#FAFAFA", borderColor: "rgba(0,0,0,0.06)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Desktop: 4-column grid */}
        <div className="hidden md:grid grid-cols-4 gap-8">
          {badges.map(({ icon: Icon, titleKey, descKey, color, bg }) => (
            <div key={titleKey} className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: bg, border: \\\`1px solid \\\${color}20\\\` }}
              >
                <Icon size={20} style={{ color }} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 leading-tight">{t(titleKey)}</p>
                <p className="text-xs text-gray-500 leading-snug mt-0.5">{t(descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: single item, auto-cycling */}
        <div className="md:hidden">
          <div className="relative overflow-hidden" style={{ height: 56 }}>
            {badges.map(({ icon: Icon, titleKey, descKey, color, bg }, i) => (
              <div
                key={titleKey}
                className="absolute inset-0 flex items-center justify-center gap-3 transition-all duration-500"
                style={{
                  opacity: i === active ? 1 : 0,
                  transform: i === active ? "translateY(0)" : "translateY(8px)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: bg, border: \\\`1px solid \\\${color}20\\\` }}
                >
                  <Icon size={18} style={{ color }} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{t(titleKey)}</p>
                  <p className="text-xs text-gray-500 leading-snug mt-0.5">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {badges.map((_, i) => (
              <span
                key={i}
                className={\\\`w-1.5 h-1.5 rounded-full transition-colors \\\${i === active ? "bg-gray-700" : "bg-gray-300"}\\\`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
`);

console.log("\\n🎉 Components written!");
