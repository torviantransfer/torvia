"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { createPortal } from "react-dom";
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
  RefreshCw,
  ArrowUpDown,
  User,
  ShieldCheck,
  Tag,
  Headphones,
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
      const target = e.target as Node;
      if (!containerRef.current) return;
      if (containerRef.current.contains(target)) return;
      // The phone calendar is portalled into <body>, so it is not inside the
      // ref even though it is part of this form. Without this, every tap on
      // the month arrows counted as a click outside and closed the sheet
      // before the month could change.
      if (target instanceof Element && target.closest("[data-cal-sheet]")) return;
      setOpen(null);
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
    // Which month to land on. For a return with no date yet, fall back to the
    // departure month rather than to today: booking an outbound on 29 October
    // from September used to open the return calendar on September, every day
    // of it greyed out, with no hint that the month had to be changed.
    const base = target === "dep" ? depDate : (retDate ?? depDate);
    setCalMonth(base ? new Date(base.getFullYear(), base.getMonth(), 1) : new Date());
    setOpen("cal");
  };

  /** The phone's "Saat" fields, which open the time sheet on its own. The
   *  desktop bar never calls this: it has one date button that sets both. */
  const openTime = (target: "dep" | "ret") => {
    if (target === "ret" && !depDate) return;
    setCalFor(target);
    setOpen("time");
  };

  const pickDay = (d: Date) => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (d < now) return;
    if (calFor === "dep") {
      setDepDate(d);
      // Drop a return that the new outbound date has invalidated — including
      // one that now falls on the same day, which is not a return trip.
      if (retDate && retDate.getTime() <= d.getTime()) setRetDate(null);
    } else {
      if (depDate && d.getTime() <= depDate.getTime()) return;
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
          className={`w-full flex items-center gap-3 px-4 py-3 lg:py-2.5 text-left text-[15px] lg:text-sm hover:bg-[#EDF8F4] lg:hover:bg-blue-50 transition-colors ${
            (field === "from" ? from : to) === l.value ? "text-[#0e8a61] lg:text-blue-600 font-semibold bg-[#EDF8F4]/60 lg:bg-blue-50/50" : "text-gray-700"
          }`}
        >
          {l.type === "airport" ? (
            <Plane size={15} className="text-[#0e8a61] lg:text-blue-600 shrink-0" />
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
    if (open !== "cal" && open !== "time") return;
    if (typeof window === "undefined" || window.matchMedia("(min-width: 1024px)").matches) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /* --- Calendar contents ---
   *
   * Split into a grid and a time section, because the phone and the pointer
   * layouts want different combinations of them.
   *
   * On a phone the form has its own date field and its own time field, so
   * tapping "Gidiş Tarihi" opens the month grid alone and tapping "Saat"
   * opens the time picker alone — a sheet that answers exactly the field that
   * was pressed. The desktop bar has no separate time field: its single date
   * button has to set both, so its popover keeps the grid and the stepper
   * together the way it always has. */
  const calendarGrid = (
    <>
      <div className="bg-[#0e8a61] lg:bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between">
        <button type="button" aria-label="−1" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))} className="hover:bg-white/20 rounded-lg p-1"><ChevronLeft size={16} /></button>
        <span className="font-semibold text-sm capitalize">{mName} {calMonth.getFullYear()}</span>
        <button type="button" aria-label="+1" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))} className="hover:bg-white/20 rounded-lg p-1"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#0e8a61] lg:text-blue-600 border-b border-gray-100 py-1.5 px-2">
        {wk.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 text-center px-2 py-1.5 gap-y-0.5">
        {days.map((d, i) => {
          // `<=`, not `<`: the departure day itself is not a valid return.
          const past = d.date < today || (calFor === "ret" && depDate && d.date.getTime() <= depDate.getTime());
          const sel = calFor === "dep" ? depDate?.toDateString() === d.date.toDateString() : retDate?.toDateString() === d.date.toDateString();
          const isToday = d.date.toDateString() === new Date().toDateString();
          return (
            <button key={i} type="button" disabled={past || !d.inMonth} onClick={() => pickDay(d.date)}
              className={[
                // 40px on phones so every day clears the 44px-ish touch
                // guidance; the pointer-device popover keeps its 32px grid.
                "w-10 h-10 lg:w-8 lg:h-8 rounded-lg text-[13px] lg:text-xs mx-auto flex items-center justify-center transition-colors",
                !d.inMonth ? "text-gray-200" : past ? "text-gray-300 cursor-not-allowed" : "hover:bg-[#EDF8F4] lg:hover:bg-blue-50 cursor-pointer",
                sel ? "bg-[#0e8a61] lg:bg-blue-600 text-white font-bold" : "",
                isToday && !sel ? "ring-1 ring-[#0e8a61]/40 lg:ring-blue-300" : "",
                d.inMonth && !past && !sel ? "text-gray-700 font-medium" : "",
              ].join(" ")}
            >{d.day}</button>
          );
        })}
      </div>
    </>
  );

  /* Phones get the platform's own time picker — the wheel on iOS, the dial on
     Android — because the stepper beside it needs about fifteen taps on 11px
     arrows to get from the default 12:00 to something like 03:30. Pointer
     devices keep the stepper, where those arrows are fine. */
  const timeInput = (
    <label className="block">
      <span className="block text-[10px] font-bold text-[#0e8a61] uppercase tracking-wider mb-1.5">{t("hour")}</span>
      <input
        type="time"
        step={300}
        value={timeValue}
        onChange={(e) => setTimeFromInput(e.target.value)}
        className="w-full border border-[#E5E7EB] rounded-xl px-3 py-3 text-base font-bold text-[#111827] focus:ring-2 focus:ring-[#0e8a61] outline-none"
      />
    </label>
  );

  const timeStepper = (
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
  );

  /* Modal furniture. Dismissing used to mean tapping the dimmed area, which
     is not obvious on its own, so every modal ends in an explicit button. */
  const sheetConfirm = (
    <div className="px-4 pb-4 pt-3">
      <button
        type="button"
        onClick={() => setOpen(null)}
        className="w-full h-[48px] rounded-xl bg-[#0e8a61] text-white font-bold text-[15px] active:scale-[0.98] transition-transform"
      >
        {t("dateConfirm")}
      </button>
    </div>
  );

  /**
   * The phone shell for both pickers: a box in the middle of the screen over a
   * dimmed page, rather than a panel sliding up from the bottom edge.
   *
   * `max-h`/`overflow-y` matter more here than they would in a sheet — a
   * centred box has the viewport above *and* below it, so on a short screen
   * (or with the keyboard up) it has to be able to scroll inside itself
   * instead of running off both ends.
   */
  const modalShell = (label: string, body: React.ReactNode) => (
    <div className="lg:hidden">
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setOpen(null)} />
      <div
        data-cal-sheet
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="fixed left-1/2 top-1/2 z-[70] w-[min(340px,calc(100vw-32px))] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        {body}
      </div>
    </div>
  );

  /* --- Date popup ---
     Two shells around the same grid, because they need to live in different
     places in the tree.

     Desktop is a popover anchored under the field, so it has to stay where it
     is, inside the field's relatively-positioned parent.

     The phone sheet cannot. Raising its z-index — which is what the previous
     attempt at this did — has no effect, because the form is mounted inside
     `relative z-30` on the home page and `relative z-10` on /booking. A
     positioned element with a z-index opens a stacking context, and every
     z-index inside it is resolved against its siblings only. So the sheet was
     never competing with the floating WhatsApp button at all: the whole
     stacking context was, at z-30 against the button's z-50, and it lost. No
     number written inside could have won.

     A portal moves the sheet out to <body>, into the root stacking context,
     where its z-index and the button's are finally comparable. */
  const renderCalendar = () => (
    <>
      <div className="hidden lg:block absolute top-full mt-1 left-1/2 -translate-x-1/2 w-[310px] rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden z-50">
        {calendarGrid}
        <div className="border-t border-gray-100 px-4 py-3">{timeStepper}</div>
      </div>

      {/* Safe to touch document at render time: this whole function only runs
          while `open === "cal"`, which starts null and can only be set by a
          tap. It is never reached during the server render or hydration. */}
      {createPortal(
        modalShell(
          calFor === "dep" ? t("departureDate") : t("returnDate"),
          <>
            {calendarGrid}
            {sheetConfirm}
          </>,
        ),
        document.body,
      )}
    </>
  );

  /* --- Time popup (phones only) ---
     The counterpart to the date sheet: the form's own "Saat" field opens this
     and nothing else, so the sheet answers the field that was pressed. There
     is no desktop shell because the desktop bar has no separate time field —
     its date popover carries the stepper instead. */
  const renderTimeSheet = () => {
    const label = calFor === "dep" ? t("departureTime") : t("returnTime");
    return createPortal(
      modalShell(
        label,
        <>
          <div className="bg-[#0e8a61] text-white px-4 py-2.5 text-center">
            <span className="font-semibold text-sm">{label}</span>
          </div>
          <div className="px-4 pt-4">{timeInput}</div>
          {sheetConfirm}
        </>,
      ),
      document.body,
    );
  };

  /* --- Passenger popup ---
   * Spans the full width of its row on phones. It used to be a fixed 220px
   * box pinned to the right, which since the passenger control became a
   * full-width row left it hanging off the edge of the card, with the two
   * counters squeezed into a narrow column. */
  const stepperBtn =
    "w-11 h-11 sm:w-7 sm:h-7 rounded-lg border border-[#E5E7EB] sm:border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100 text-base sm:text-sm flex-shrink-0";

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

      {/* MOBILE CARD (<lg) — the reference layout at a restrained scale:
          56px route rows with a 36px mint icon tile, a 52px date/time pair,
          46px option rows, a 52px CTA and a 28px trust strip with hairline
          dividers. Roughly 410px in total, so the whole form still reads as
          one glance on a phone rather than a page of its own.

          The date/time cells carry small icons and 15px values on purpose:
          at the reference's 26px icon and 16px text, "Tarih seçin" ran out of
          room and truncated to "Tarih s...".

          Desktop keeps the compact horizontal bar above. The only markup the
          two layouts share is the calendar and passenger popups, which take
          `lg:` overrides so each viewport gets its own accent out of the same
          elements. */}
      <div className="lg:hidden rounded-[20px] border border-[#E5E7EB] bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12),0_3px_10px_rgba(15,23,42,0.05)]">
        {/* Route — pickup and dropoff share one relative box so the swap
            button can float on the seam between them. */}
        <div className="relative grid gap-2">
          {/* From */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(open === "from" ? null : "from")}
              aria-haspopup="listbox"
              aria-expanded={open === "from"}
              aria-label={`${t("pickup")}: ${from ? getName(from) : t("pickupPlaceholder")}`}
              className={`flex min-h-[56px] w-full items-center gap-2.5 rounded-2xl border bg-white py-2 pl-2.5 pr-14 text-left transition-colors ${open === "from" ? "border-[#0e8a61] bg-[#EDF8F4]/50" : "border-[#E5E7EB] active:bg-gray-50"}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#EDF8F4]">
                <MapPin size={18} className="text-[#0e8a61]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] leading-none text-[#6B7280]">{t("pickup")}</span>
                <span className={`mt-[3px] block truncate text-[15px] leading-tight ${from ? "font-semibold text-[#111827]" : "font-medium text-[#4B5563]"}`}>
                  {from ? getName(from) : t("pickupPlaceholder")}
                </span>
              </span>
            </button>
            {open === "from" && renderLocDrop("from")}
          </div>

          {/* To */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(open === "to" ? null : "to")}
              aria-haspopup="listbox"
              aria-expanded={open === "to"}
              aria-label={`${t("dropoff")}: ${to ? getName(to) : t("dropoffPlaceholder")}`}
              className={`flex min-h-[56px] w-full items-center gap-2.5 rounded-2xl border bg-white py-2 pl-2.5 pr-14 text-left transition-colors ${open === "to" ? "border-[#0e8a61] bg-[#EDF8F4]/50" : "border-[#E5E7EB] active:bg-gray-50"}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#EDF8F4]">
                <MapPin size={18} className="text-[#0e8a61]" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] leading-none text-[#6B7280]">{t("dropoff")}</span>
                <span className={`mt-[3px] block truncate text-[15px] leading-tight ${to ? "font-semibold text-[#111827]" : "font-medium text-[#4B5563]"}`}>
                  {to ? getName(to) : t("dropoffPlaceholder")}
                </span>
              </span>
            </button>
            {open === "to" && renderLocDrop("to")}
          </div>

          {/* Swap — a rounded square floating on the seam, white with a
              shadow so it reads as sitting on top of the two fields rather
              than as a third action competing with the CTA. Draws at 40px but
              keeps a 44px hit area. */}
          <button
            type="button"
            onClick={swap}
            aria-label={swapLabel}
            className="absolute right-1.5 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center transition-transform active:scale-95"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_6px_16px_rgba(15,23,42,0.14)]">
              <ArrowUpDown size={18} className="text-[#0e8a61]" aria-hidden="true" />
            </span>
          </button>
        </div>

        {/* Date + time — 50/50, both on the same minimum height so the row
            never reflows when a value replaces a placeholder. */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => { setDateError(false); openCal("dep"); }}
              aria-haspopup="dialog"
              aria-expanded={open === "cal" && calFor === "dep"}
              aria-label={`${t("departureDate")}: ${depFmt ? depFmt.text : t("selectDateShort")}`}
              className={`flex min-h-[52px] w-full items-center gap-2 rounded-2xl border px-2.5 text-left transition-colors ${dateError ? "border-red-400 bg-red-50" : "border-[#E5E7EB] bg-white active:bg-gray-50"}`}
            >
              <Calendar size={18} className={dateError ? "shrink-0 text-red-500" : "shrink-0 text-[#0e8a61]"} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] leading-none text-[#6B7280]">{t("departureDate")}</span>
                <span className={`mt-[3px] block truncate text-[15px] leading-tight ${dateError ? "font-semibold text-red-500" : depFmt ? "font-semibold text-[#111827]" : "font-medium text-[#4B5563]"}`}>
                  {depFmt ? depFmt.text : t("selectDateShort")}
                </span>
              </span>
              <ChevronDown size={14} className="shrink-0 text-[#9CA3AF]" aria-hidden="true" />
            </button>
            {open === "cal" && calFor === "dep" && renderCalendar()}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => openTime("dep")}
              aria-haspopup="dialog"
              aria-expanded={open === "time" && calFor === "dep"}
              aria-label={`${t("hour")}: ${depFmt ? depFmt.time : t("selectTimeShort")}`}
              className="flex min-h-[52px] w-full items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-2.5 text-left transition-colors active:bg-gray-50"
            >
              <Clock size={18} className="shrink-0 text-[#0e8a61]" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] leading-none text-[#6B7280]">{t("hour")}</span>
                <span className={`mt-[3px] block truncate text-[15px] leading-tight ${depFmt ? "font-semibold text-[#111827]" : "font-medium text-[#4B5563]"}`}>
                  {depFmt ? depFmt.time : t("selectTimeShort")}
                </span>
              </span>
              <ChevronDown size={14} className="shrink-0 text-[#9CA3AF]" aria-hidden="true" />
            </button>
            {open === "time" && calFor === "dep" && renderTimeSheet()}
          </div>
        </div>

        {/* Return — a switch row rather than a dashed "add" button, which read
            as a broken field. Flipping it on reveals the same return date/time
            pair the form always had. The switch stays dimmed until there is an
            outbound date, because a return can only be picked relative to
            one. */}
        <div className={`mt-2 flex min-h-[46px] items-center justify-between gap-3 rounded-2xl border px-3 transition-colors ${hasRet ? "border-[#0e8a61]/30 bg-[#EDF8F4]/60" : "border-[#E5E7EB] bg-white"}`}>
          <span className="flex min-w-0 items-center gap-2.5">
            <RefreshCw size={18} className={depDate ? "shrink-0 text-[#0e8a61]" : "shrink-0 text-[#9CA3AF]"} aria-hidden="true" />
            <span className={`truncate text-[14px] ${depDate ? "text-[#4B5563]" : "text-[#9CA3AF]"}`}>
              {t("addReturnTransfer")}
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={hasRet}
            aria-label={t("addReturnTransfer")}
            disabled={!depDate}
            onClick={() => {
              if (!depDate) return;
              if (hasRet) { setHasRet(false); setRetDate(null); }
              else { setHasRet(true); openCal("ret"); }
            }}
            className="-mr-1.5 flex h-11 shrink-0 items-center justify-end pl-3 pr-1.5 disabled:cursor-not-allowed"
          >
            <span className={`relative block h-[22px] w-10 rounded-full transition-colors ${!depDate ? "bg-[#E5E7EB]" : hasRet ? "bg-[#0e8a61]" : "bg-[#D1D5DB]"}`}>
              <span className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all ${hasRet ? "left-[21px]" : "left-[3px]"}`} />
            </span>
          </button>
        </div>

        {/* Return date + time — the same pair as the outbound, shown only
            once the switch is on. */}
        {hasRet && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => openCal("ret")}
                aria-haspopup="dialog"
                aria-expanded={open === "cal" && calFor === "ret"}
                aria-label={`${t("returnDate")}: ${retFmt ? retFmt.text : t("selectDateShort")}`}
                className="flex min-h-[52px] w-full items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-2.5 text-left transition-colors active:bg-gray-50"
              >
                <Calendar size={18} className="shrink-0 text-[#0e8a61]" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] leading-none text-[#6B7280]">{t("returnDate")}</span>
                  <span className={`mt-[3px] block truncate text-[15px] leading-tight ${retFmt ? "font-semibold text-[#111827]" : "font-medium text-[#4B5563]"}`}>
                    {retFmt ? retFmt.text : t("selectDateShort")}
                  </span>
                </span>
                <ChevronDown size={14} className="shrink-0 text-[#9CA3AF]" aria-hidden="true" />
              </button>
              {open === "cal" && calFor === "ret" && renderCalendar()}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => openTime("ret")}
                aria-haspopup="dialog"
                aria-expanded={open === "time" && calFor === "ret"}
                aria-label={`${t("returnTime")}: ${retFmt ? retFmt.time : t("selectTimeShort")}`}
                className="flex min-h-[52px] w-full items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-white px-2.5 text-left transition-colors active:bg-gray-50"
              >
                <Clock size={18} className="shrink-0 text-[#0e8a61]" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] leading-none text-[#6B7280]">{t("hour")}</span>
                  <span className={`mt-[3px] block truncate text-[15px] leading-tight ${retFmt ? "font-semibold text-[#111827]" : "font-medium text-[#4B5563]"}`}>
                    {retFmt ? retFmt.time : t("selectTimeShort")}
                  </span>
                </span>
                <ChevronDown size={14} className="shrink-0 text-[#9CA3AF]" aria-hidden="true" />
              </button>
              {open === "time" && calFor === "ret" && renderTimeSheet()}
            </div>
          </div>
        )}

        {/* Passengers — a single line. The adult/child split lives in the
            popup it opens, so the closed row carries only the one number that
            matters. */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(open === "pax" ? null : "pax")}
            aria-haspopup="dialog"
            aria-expanded={open === "pax"}
            aria-label={`${adults + kids} ${t("passengers")}`}
            className={`mt-2 flex min-h-[46px] w-full items-center justify-between gap-3 rounded-2xl border px-3 transition-colors ${open === "pax" ? "border-[#0e8a61] bg-[#EDF8F4]/50" : "border-[#E5E7EB] bg-white active:bg-gray-50"}`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <User size={18} className="shrink-0 text-[#0e8a61]" aria-hidden="true" />
              <span className="truncate text-[15px] font-semibold text-[#111827]">{adults + kids} {t("passengers")}</span>
            </span>
            <ChevronDown size={16} className={`shrink-0 text-[#9CA3AF] transition-transform ${open === "pax" ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {open === "pax" && renderPassengers()}
        </div>

        {/* Submit — the label is centred in the free column so the chevron
            sits hard against the right edge without pulling the text
            off-centre. */}
        <button
          type="button"
          onClick={submit}
          className="mt-2.5 grid h-[52px] w-full grid-cols-[1fr_auto] items-center gap-2 rounded-xl bg-[#0e8a61] px-4 text-[15px] font-bold text-white shadow-[0_10px_20px_-6px_rgba(14,138,97,0.45)] transition-transform active:scale-[0.985]"
        >
          <span className="truncate text-center">{t("seePriceAndBook")}</span>
          <ChevronRight size={20} className="shrink-0" aria-hidden="true" />
        </button>

        {/* Trust strip — the three objections people have at exactly this
            moment, answered right where the thumb already is. */}
        <ul className="mt-2.5 grid min-h-[28px] grid-cols-[1fr_auto_1fr_auto_1fr] items-center">
          {[
            { Icon: ShieldCheck, label: t("trustFixedPrice") },
            { Icon: Tag, label: t("trustNoHiddenShort") },
            { Icon: Headphones, label: t("trustSupport247") },
          ].map(({ Icon, label }, i) => (
            <Fragment key={label}>
              {i > 0 && <li aria-hidden="true" className="h-4 w-px bg-[#E5E7EB]" />}
              <li className="flex items-center justify-center gap-1.5 px-1 text-center text-[10.5px] font-medium leading-tight text-[#4B5563]">
                <Icon size={13} className="shrink-0 text-[#0e8a61]" aria-hidden="true" />
                <span>{label}</span>
              </li>
            </Fragment>
          ))}
        </ul>
      </div>
    </div>
  );
}
