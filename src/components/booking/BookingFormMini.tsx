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
  Clock,
} from "lucide-react";

interface Region {
  id: string;
  slug: string;
  name_tr: string;
  name_en: string;
  name_de: string;
  name_pl: string;
  name_ru: string;
  name_nl: string;
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

interface BookingFormMiniProps {
  /** Pre-fills the destination (from a region page's "Book Now" CTA) so the
   * visitor only has to pick a date/time instead of re-selecting the route. */
  presetRegion?: string;
}

export default function BookingFormMini({ presetRegion }: BookingFormMiniProps = {}) {
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
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [dateError, setDateError] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const [calFor, setCalFor] = useState<"dep" | "ret">("dep");

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("TORVIAN_booking_form");
      let restoredRoute = false;
      if (saved) {
        const d = JSON.parse(saved);
        if (d.from) { setFrom(d.from); restoredRoute = true; }
        if (d.to) { setTo(d.to); restoredRoute = true; }
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
      // Coming from a region page's "Book Now" CTA: pre-fill the route so the
      // visitor only has to pick a date, unless they already have a route
      // in progress from a previous visit.
      if (!restoredRoute && presetRegion) {
        setFrom("antalya-airport");
        setTo(presetRegion);
      }
    } catch {}
  }, [presetRegion]);

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
  const swapLabel = ({ tr: "Kalkış ve varış yerini değiştir", de: "Start und Ziel tauschen", pl: "Zamień miejsce startu i celu", ru: "Поменять местами пункты отправления и назначения", nl: "Vertrek en bestemming omwisselen" } as Record<string, string>)[locale] ?? "Swap pickup and dropoff";
  const removeReturnLabel = ({ tr: "Dönüş tarihini kaldır", de: "Rückreisedatum entfernen", pl: "Usuń datę powrotu", ru: "Удалить дату возврата", nl: "Retourdatum verwijderen" } as Record<string, string>)[locale] ?? "Remove return date";
  const bookingHint = t("bookNow");
  const REGION_NAME_OVERRIDES: Record<string, string> = { "kundu-lara": "Kundu" };
  const getRegionLabel = (r: Region) => REGION_NAME_OVERRIDES[r.slug] ?? ((r[nameKey] as string) || r.name_en);
  const getName = (slug: string) => {
    if (slug === "antalya-airport") return airportName;
    const r = regions.find((r) => r.slug === slug);
    return r ? getRegionLabel(r) : slug;
  };

  const fmtDate = (d: Date | null, h: number, m: number) => {
    if (!d) return null;
    const s = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
    return { text: s, time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}` };
  };

  const swap = () => { const tmp = from; setFrom(to); setTo(tmp); };

  /* Time as the "HH:MM" that <input type="time"> speaks, both ways. */
  const activeH = calFor === "dep" ? depH : retH;
  const activeM = calFor === "dep" ? depM : retM;
  const timeValue = `${String(activeH).padStart(2, "0")}:${String(activeM).padStart(2, "0")}`;
  const setTimeFromInput = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    // Clearing the field yields "", which parses to NaN — keep the old time.
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    if (calFor === "dep") { setDepH(h); setDepM(m); } else { setRetH(h); setRetM(m); }
  };

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
    if (!depDate) { setDateError(true); setOpen("cal"); setCalFor("dep"); setCalMonth(new Date()); return; }
    setDateError(false);
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    p.set("region", region);
    p.set("trip", hasRet ? "round_trip" : "one_way");
    if (depDate) {
      const dep = `${depDate.getFullYear()}-${String(depDate.getMonth() + 1).padStart(2, "0")}-${String(depDate.getDate()).padStart(2, "0")}`;
      p.set("date", dep);
      p.set("time", `${String(depH).padStart(2, "0")}:${String(depM).padStart(2, "0")}`);
    }
    if (hasRet && retDate) {
      const ret = `${retDate.getFullYear()}-${String(retDate.getMonth() + 1).padStart(2, "0")}-${String(retDate.getDate()).padStart(2, "0")}`;
      p.set("returnDate", ret);
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
    : locale === "nl" ? ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const locItems = [
    { type: "airport" as const, value: "antalya-airport", label: airportName },
    ...regions.map((r) => ({
      type: "destination" as const,
      value: r.slug,
      label: getRegionLabel(r),
    })),
  ];

  /* --- Location dropdown --- */
  const renderLocDrop = (field: "from" | "to") => (
    <div className={`absolute top-full mt-1 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 max-h-[280px] overflow-y-auto left-0 right-0 lg:right-auto lg:w-[280px]`}>
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
            <MapPin size={15} className="text-gray-500 shrink-0" />
          )}
          {l.label}
        </button>
      ))}
    </div>
  );

  /**
   * Lock the page behind the mobile calendar sheet.
   *
   * The sheet is `position: fixed`, so without this the page kept scrolling
   * under it whenever a swipe started on the dimmed backdrop — the month grid
   * stayed put while the form slid away behind it. Only phones are affected:
   * from `lg` up the calendar is an inline popover, not a sheet.
   */
  useEffect(() => {
    if (open !== "cal") return;
    if (typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* --- Calendar popup --- */
  const renderCalendar = () => (
    <>
    {/* z-60 / z-70, not z-40 / z-50.
        The floating WhatsApp button is `fixed … z-50` and every page that
        renders this form mounts it after the form, so at equal z-index the
        button won the tie and painted on top of the sheet — sitting directly
        over the confirm button in the bottom-right corner. Raising both layers
        above it puts the button behind the dim, where it belongs while a
        modal is open. */}
    <div className="fixed inset-0 z-[60] bg-black/30 lg:hidden" onClick={() => setOpen(null)} />
    <div className="fixed inset-x-0 bottom-0 z-[70] rounded-t-2xl lg:absolute lg:inset-auto lg:bottom-auto lg:top-full lg:mt-1 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-[310px] lg:rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
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
      {/* Time.
          Phones get the platform's own time picker — the wheel on iOS, the
          dial on Android — because the stepper below needs about fifteen taps
          on 11px arrows to get from the default 12:00 to something like 03:30.
          Pointer devices keep the stepper, where those arrows are fine. */}
      <div className="border-t border-gray-100 px-4 py-3">
        <label className="lg:hidden block">
          <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">{t("hour")}</span>
          <input
            type="time"
            step={300}
            value={timeValue}
            onChange={(e) => setTimeFromInput(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </label>

        <div className="hidden lg:flex items-center justify-center gap-5">
          <div className="text-center">
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{t("hour")}</span>
            <div className="mt-1 border border-gray-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
              <span className="text-base font-bold text-gray-900 w-6 text-center">{String(activeH).padStart(2, "0")}</span>
              <div className="flex flex-col">
                <button type="button" aria-label={`${t("hour")} +`} onClick={() => calFor === "dep" ? setDepH((h) => (h + 1) % 24) : setRetH((h) => (h + 1) % 24)} className="text-gray-500 hover:text-gray-600 p-0.5"><ChevronUp size={12} /></button>
                <button type="button" aria-label={`${t("hour")} −`} onClick={() => calFor === "dep" ? setDepH((h) => (h - 1 + 24) % 24) : setRetH((h) => (h - 1 + 24) % 24)} className="text-gray-500 hover:text-gray-600 p-0.5"><ChevronDown size={12} /></button>
              </div>
            </div>
          </div>
          <span className="text-base font-bold text-gray-300 mt-4">:</span>
          <div className="text-center">
            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{t("minute")}</span>
            <div className="mt-1 border border-gray-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
              <span className="text-base font-bold text-gray-900 w-6 text-center">{String(activeM).padStart(2, "0")}</span>
              <div className="flex flex-col">
                <button type="button" aria-label={`${t("minute")} +`} onClick={() => calFor === "dep" ? setDepM((m) => (m + 5) % 60) : setRetM((m) => (m + 5) % 60)} className="text-gray-500 hover:text-gray-600 p-0.5"><ChevronUp size={12} /></button>
                <button type="button" aria-label={`${t("minute")} −`} onClick={() => calFor === "dep" ? setDepM((m) => (m - 5 + 60) % 60) : setRetM((m) => (m - 5 + 60) % 60)} className="text-gray-500 hover:text-gray-600 p-0.5"><ChevronDown size={12} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Closing the sheet used to mean tapping the dimmed area behind it,
          which is not obvious. The padding clears the iPhone home indicator. */}
      <div
        className="lg:hidden px-4 pt-1"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={() => setOpen(null)}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[15px] active:scale-[0.98] transition-transform"
        >
          {t("dateConfirm")}
        </button>
      </div>
    </div>
    </>
  );

  /* --- Passenger popup ---
   * Spans the full width of its row on phones. It used to be a fixed 220px
   * box pinned to the right, which since the passenger control became a
   * full-width row left it hanging off the edge of the card, with the two
   * counters squeezed into a narrow column. */
  const stepperBtn =
    "w-9 h-9 sm:w-7 sm:h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 text-base sm:text-sm flex-shrink-0";

  const renderPassengers = () => (
    <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 lg:left-auto lg:w-[240px]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{t("adult")}</p>
          <p className="text-[11px] text-gray-500">13+ {t("age")}</p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button type="button" aria-label={`${t("adult")} −`} onClick={() => setAdults(Math.max(1, adults - 1))} className={stepperBtn}>&minus;</button>
          <span className="text-sm font-bold text-gray-900 w-4 text-center">{adults}</span>
          <button type="button" aria-label={`${t("adult")} +`} onClick={() => setAdults(Math.min(10, adults + 1))} className={stepperBtn}>+</button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{t("child")}</p>
          <p className="text-[11px] text-gray-500">0-12 {t("age")}</p>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button type="button" aria-label={`${t("child")} −`} onClick={() => setKids(Math.max(0, kids - 1))} className={stepperBtn}>&minus;</button>
          <span className="text-sm font-bold text-gray-900 w-4 text-center">{kids}</span>
          <button type="button" aria-label={`${t("child")} +`} onClick={() => setKids(Math.min(10, kids + 1))} className={stepperBtn}>+</button>
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
            <span className={`text-[13px] truncate ${from ? "font-semibold text-gray-900" : "text-gray-500"}`}>{from ? getName(from) : t("pickup")}</span>
          </button>
          {open === "from" && renderLocDrop("from")}
        </div>

        {/* Swap */}
        <button type="button" onClick={swap} aria-label={swapLabel} className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 hover:bg-blue-700 transition-colors z-10 -mx-1 shadow">
          <ArrowLeftRight size={13} className="text-white" />
        </button>

        {/* To */}
        <div className="relative flex-1 min-w-0 h-full">
          <button type="button" onClick={() => setOpen(open === "to" ? null : "to")} className="flex items-center gap-2 px-4 h-full w-full text-left hover:bg-gray-50/80 transition-colors border-r border-gray-200/60">
            <MapPin size={16} className="text-blue-600 shrink-0" />
            <span className={`text-[13px] truncate ${to ? "font-semibold text-gray-900" : "text-gray-500"}`}>{to ? getName(to) : t("dropoff")}</span>
          </button>
          {open === "to" && renderLocDrop("to")}
        </div>

        {/* Dep date */}
        <div className="relative h-full shrink-0">
          <button type="button" onClick={() => { setDateError(false); openCal("dep"); }} className={`flex items-center gap-2 px-4 h-full text-left hover:bg-gray-50/80 transition-colors border-r ${dateError ? "border-red-400 bg-red-50" : "border-gray-200/60"}`}>
            <Calendar size={16} className={dateError ? "text-red-500 shrink-0" : "text-green-600 shrink-0"} />
            {depFmt ? (
              <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">{depFmt.text} &middot; <span className="text-blue-600">{depFmt.time}</span></span>
            ) : (
              <span className={`text-[13px] whitespace-nowrap ${dateError ? "text-red-500 font-semibold" : "text-gray-500"}`}>{dateError ? t("selectDate") : t("departureDate")}</span>
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
                  <span className="text-[13px] text-gray-500 whitespace-nowrap">{t("returnDate")}</span>
                )}
              </button>
              <button type="button" onClick={() => { setHasRet(false); setRetDate(null); }} aria-label={removeReturnLabel} className="text-red-400 hover:text-red-600 ml-0.5"><X size={13} /></button>
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
          {bookingHint}
        </button>
      </div>

      {/* MOBILE CARD (<lg) — full-width stacked rows (label above, value
          below) instead of cramped icon+text pills, so each field reads
          clearly and has a generous tap target. */}
      <div className="lg:hidden bg-white rounded-2xl shadow-2xl shadow-black/20 p-3 space-y-2">
        {/* From */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(open === "from" ? null : "from")}
            aria-haspopup="listbox"
            aria-expanded={open === "from"}
            className="w-full text-left border border-gray-200 rounded-xl px-4 py-2.5 active:bg-gray-50"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
              <MapPin size={12} className="text-blue-600" />
              {t("pickup")}
            </span>
            <span className={`block text-[15px] mt-0.5 truncate ${from ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}>
              {from ? getName(from) : t("pickup")}
            </span>
          </button>
          {open === "from" && renderLocDrop("from")}
        </div>

        {/* Swap — floats between the From/To rows */}
        <div className="relative h-0">
          <button
            type="button"
            onClick={swap}
            aria-label={swapLabel}
            className="absolute -top-[27px] right-4 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md active:scale-95 z-10"
          >
            <ArrowLeftRight size={14} className="text-white rotate-90" />
          </button>
        </div>

        {/* To */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(open === "to" ? null : "to")}
            aria-haspopup="listbox"
            aria-expanded={open === "to"}
            className="w-full text-left border border-gray-200 rounded-xl px-4 py-2.5 active:bg-gray-50"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
              <MapPin size={12} className="text-blue-600" />
              {t("dropoff")}
            </span>
            <span className={`block text-[15px] mt-0.5 truncate ${to ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}>
              {to ? getName(to) : t("dropoff")}
            </span>
          </button>
          {open === "to" && renderLocDrop("to")}
        </div>

        {/* Date + Time — same picker, split into two columns like the
            pickup/dropoff rows above so each half reads as its own field. */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => { setDateError(false); openCal("dep"); }}
              className={`w-full text-left border rounded-xl px-4 py-2.5 ${dateError ? "border-red-400 bg-red-50" : "border-gray-200"}`}
            >
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                <Calendar size={12} className={dateError ? "text-red-500" : "text-green-600"} />
                {t("departureDate")}
              </span>
              <span className={`block text-[15px] font-bold mt-0.5 truncate ${dateError ? "text-red-500" : depFmt ? "text-gray-900" : "text-gray-500 font-medium"}`}>
                {dateError ? t("selectDate") : depFmt ? depFmt.text : "—"}
              </span>
            </button>
            {open === "cal" && calFor === "dep" && renderCalendar()}
          </div>
          <button
            type="button"
            onClick={() => { setDateError(false); openCal("dep"); }}
            className={`w-full text-left border rounded-xl px-4 py-2.5 ${dateError ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
              <Clock size={12} className="text-blue-600" />
              {t("hour")}
            </span>
            <span className={`block text-[15px] font-bold mt-0.5 truncate ${depFmt ? "text-gray-900" : "text-gray-500 font-medium"}`}>
              {depFmt ? depFmt.time : "—"}
            </span>
          </button>
        </div>

        {/* Passengers — its own clear, tappable row. This is a required
            field on every booking (unlike the optional return trip below),
            so it gets top billing and an explicit "X Kişi" label + chevron
            instead of sharing a row and reading as just a bare number. */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(open === "pax" ? null : "pax")}
            aria-haspopup="dialog"
            aria-expanded={open === "pax"}
            className={`w-full flex items-center justify-between gap-3 border rounded-xl px-4 py-2.5 ${open === "pax" ? "border-blue-400 bg-blue-50/50" : "border-gray-200"}`}
          >
            <span className="flex items-center gap-2.5">
              <Users size={16} className="text-blue-600 shrink-0" />
              <span className="text-left">
                <span className="block text-[15px] font-bold text-gray-900">{adults + kids} {t("person")}</span>
                <span className="block text-[10.5px] text-gray-500 leading-tight">{t("adult")} &amp; {t("child")}</span>
              </span>
            </span>
            <ChevronRight size={15} className={`text-gray-300 shrink-0 transition-transform ${open === "pax" ? "rotate-90" : ""}`} />
          </button>
          {open === "pax" && renderPassengers()}
        </div>

        {/* Return — optional add-on, demoted below the required fields with
            a dashed border so it visually reads as "extra" rather than
            competing with passengers for attention. */}
        <div className="relative">
          {!hasRet ? (
            <button
              type="button"
              onClick={() => { if (!depDate) return; setHasRet(true); openCal("ret"); }}
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold border border-dashed ${depDate ? "text-gray-500 border-gray-300 active:bg-gray-50" : "text-gray-300 border-gray-200 cursor-not-allowed"}`}
            >
              <CornerDownLeft size={14} />{t("addReturn")}
              <span className="text-[11px] font-normal text-gray-500">({t("optional")})</span>
            </button>
          ) : (
            <div className="flex items-center border border-blue-200 bg-blue-50/50 rounded-xl pl-4 pr-2 py-2.5">
              <button type="button" onClick={() => openCal("ret")} className="flex-1 min-w-0 text-left">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                  <CornerDownLeft size={12} className="text-green-600" />
                  {t("returnDate")}
                </span>
                <span className="block text-[15px] font-bold text-gray-900 mt-0.5 truncate">
                  {retFmt ? `${retFmt.text} · ${retFmt.time}` : "—"}
                </span>
              </button>
              <button type="button" onClick={() => { setHasRet(false); setRetDate(null); }} aria-label={removeReturnLabel} className="text-red-400 p-1.5 shrink-0"><X size={14} /></button>
            </div>
          )}
          {open === "cal" && calFor === "ret" && renderCalendar()}
        </div>

        {/* Submit */}
        <button type="button" onClick={submit} className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] transition-colors active:scale-[0.98] shadow-md shadow-blue-600/20">
          {bookingHint}
        </button>
      </div>
    </div>
  );
}
