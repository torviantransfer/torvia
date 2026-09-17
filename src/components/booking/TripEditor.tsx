"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ChevronDown, Minus, Plus } from "lucide-react";

/** Every five minutes, the same grid the search form's time wheel offers. */
const TIME_SLOTS = Array.from({ length: 24 * 12 }, (_, i) => {
  const h = Math.floor(i / 12);
  const m = i * 5 - h * 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** A restored time need not sit on the five-minute grid; the select must still show it. */
const withTime = (slots: string[], time: string) =>
  time && !slots.includes(time) ? [...slots, time].sort() : slots;

interface TripEditorProps {
  regionSlug: string;
  direction: "airport_to_region" | "region_to_airport";
  date: string;
  time: string;
  roundTrip: boolean;
  returnDate: string;
  returnTime: string;
  adults: number;
  kids: number;
  /** False for the long routes that are sold one-way only. */
  roundTripAvailable: boolean;
  onClose: () => void;
}

/**
 * The trip, editable where it is shown: the route card on the vehicle step.
 *
 * Only what a customer changes after seeing a price — the date, the time,
 * the party and the return leg. The route itself is not here: a different
 * destination is a different search, not an edit of this one.
 *
 * The date is the platform's own picker and the time is a <select>, which is
 * the one control that looks right everywhere: the drum on an iPhone, the
 * system list on Android, a plain dropdown on a desktop. A time *input* gives
 * that drum only on iOS and a two-column scroller everywhere else.
 */
export default function TripEditor(props: TripEditorProps) {
  const t = useTranslations("booking");
  const router = useRouter();

  const [date, setDate] = useState(props.date);
  const [time, setTime] = useState(props.time);
  const [roundTrip, setRoundTrip] = useState(props.roundTrip && props.roundTripAvailable);
  const [returnDate, setReturnDate] = useState(props.returnDate);
  const [returnTime, setReturnTime] = useState(props.returnTime || "12:00");
  const [adults, setAdults] = useState(Math.max(1, props.adults));
  const [children, setChildren] = useState(Math.max(0, props.kids));

  const returnMissing = roundTrip && (!returnDate || returnDate <= date);
  const canApply = Boolean(date) && !returnMissing;

  const apply = () => {
    if (!canApply) return;
    const unchanged =
      date === props.date &&
      time === props.time &&
      roundTrip === props.roundTrip &&
      (!roundTrip || (returnDate === props.returnDate && returnTime === props.returnTime)) &&
      adults === props.adults &&
      children === props.kids;
    if (unchanged) {
      props.onClose();
      return;
    }
    const p = new URLSearchParams();
    if (props.direction === "region_to_airport") p.set("from", props.regionSlug);
    p.set("region", props.regionSlug);
    p.set("trip", roundTrip ? "round_trip" : "one_way");
    p.set("date", date);
    p.set("time", time);
    if (roundTrip) {
      p.set("returnDate", returnDate);
      p.set("returnTime", returnTime);
    }
    p.set("adults", String(adults));
    p.set("children", String(children));
    // The booking page keys the wizard on these, so it remounts on the new
    // trip and the vehicles and prices reload for it.
    router.push(`/booking?${p.toString()}`);
  };

  const field = "h-12 w-full rounded-[12px] bg-[#F5F5F7] px-3.5 text-[16px] text-[#1d1d1f] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#007AFF]/40";
  const label = "mb-1.5 block text-[12.5px] font-medium text-[#86868b]";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1.35fr_1fr] gap-2.5">
        <label>
          <span className={label}>{t("departureDate")}</span>
          <input type="date" value={date} min={todayYmd()} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>
        <label>
          <span className={label}>{t("tripTime")}</span>
          <div className="relative">
            <select value={time} onChange={(e) => setTime(e.target.value)} className={`${field} appearance-none pe-9`}>
            {withTime(TIME_SLOTS, time).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
            <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
          </div>
        </label>
      </div>

      <div className="divide-y divide-black/[0.06] rounded-[14px] bg-[#F5F5F7]">
        {([
          [t("adults"), adults, setAdults, 1, 16],
          [t("children"), children, setChildren, 0, 10],
        ] as const).map(([name, value, set, min, max]) => (
          <div key={name} className="flex items-center justify-between px-3.5 py-2.5">
            <span className="text-[15px] text-[#1d1d1f]">{name}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => set(Math.max(min, value - 1))}
                disabled={value <= min}
                aria-label={`${name} −`}
                className="grid size-9 place-items-center rounded-full bg-white text-[#007AFF] ring-1 ring-black/[0.08] transition active:scale-95 disabled:text-[#c7c7cc]"
              >
                <Minus size={16} strokeWidth={2.25} />
              </button>
              <span className="w-6 text-center text-[16px] font-semibold tabular-nums text-[#1d1d1f]">{value}</span>
              <button
                type="button"
                onClick={() => set(Math.min(max, value + 1))}
                disabled={value >= max}
                aria-label={`${name} +`}
                className="grid size-9 place-items-center rounded-full bg-white text-[#007AFF] ring-1 ring-black/[0.08] transition active:scale-95 disabled:text-[#c7c7cc]"
              >
                <Plus size={16} strokeWidth={2.25} />
              </button>
            </div>
          </div>
        ))}

        {props.roundTripAvailable && (
          <label className="flex cursor-pointer items-center justify-between px-3.5 py-3">
            <span className="text-[15px] text-[#1d1d1f]">{t("roundTrip")}</span>
            {/* iOS switch: the checkbox is real and focusable, the track is drawn. */}
            <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} className="peer sr-only" />
            <span className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-[#E9E9EB] transition-colors peer-checked:bg-[#34C759] peer-focus-visible:ring-2 peer-focus-visible:ring-[#007AFF]/40 after:absolute after:start-[2px] after:top-[2px] after:size-[27px] after:rounded-full after:bg-white after:shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)] after:transition-transform peer-checked:after:translate-x-[20px] rtl:peer-checked:after:-translate-x-[20px]" />
          </label>
        )}
      </div>

      {roundTrip && (
        <div className="grid grid-cols-[1.35fr_1fr] gap-2.5">
          <label>
            <span className={label}>{t("returnDate")}</span>
            <input
              type="date"
              value={returnDate}
              min={date || todayYmd()}
              onChange={(e) => setReturnDate(e.target.value)}
              aria-invalid={returnMissing}
              className={`${field} ${returnMissing ? "ring-2 ring-[#FF3B30]/40" : ""}`}
            />
          </label>
          <label>
            <span className={label}>{t("returnTime")}</span>
            <div className="relative">
            <select value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className={`${field} appearance-none pe-9`}>
              {withTime(TIME_SLOTS, returnTime).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-[#86868b]" />
          </div>
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={apply}
        disabled={!canApply}
        className="h-12 w-full rounded-[14px] bg-[#007AFF] text-[15px] font-semibold text-white transition hover:bg-[#0062CC] active:scale-[0.98] disabled:opacity-40"
      >
        {t("tripUpdate")}
      </button>
    </div>
  );
}
