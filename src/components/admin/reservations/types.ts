import { legEndpoints, legRoute } from "@/lib/transfer-route";
import {
  bookingDayKey,
  bookingDayOffset,
  formatBookingDate,
  formatBookingDateTime,
  formatBookingTime,
  formatInstant,
  formatInstantDate,
  todayInBookingTz,
} from "@/lib/datetime";

export interface DriverAssignment {
  id: string;
  status: string;
  link_token: string;
  leg: string;
  pickup_time: string | null;
  driver_id?: string | null;
  vehicle_id?: string | null;
  assigned_at?: string | null;
  accepted_at?: string | null;
  picked_up_at?: string | null;
  completed_at?: string | null;
  drivers: { full_name: string; phone: string } | null;
  vehicles?: { plate_number: string; brand: string; model: string } | null;
}

export interface Reservation {
  id: string;
  reservation_code: string;
  status: string;
  trip_type: string;
  total_price: number;
  pickup_datetime: string;
  return_datetime: string | null;
  flight_code: string | null;
  adults: number;
  children: number;
  luggage_count?: number | null;
  child_seat: boolean;
  welcome_sign: boolean;
  welcome_name?: string | null;
  hotel_name: string | null;
  hotel_address?: string | null;
  notes: string | null;
  created_at: string;
  locale?: string | null;
  /** Outbound leg direction; the return leg runs the opposite way (migration 060). */
  direction?: string | null;
  // Present once the cash-payment migration has been applied.
  payment_method?: string | null;
  deposit_amount?: number | null;
  driver_amount?: number | null;
  base_price?: number | null;
  night_surcharge?: number | null;
  child_seat_fee?: number | null;
  round_trip_discount?: number | null;
  coupon_discount?: number | null;
  customers: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
  regions: { name_en: string; name_tr?: string | null; slug: string } | null;
  vehicle_categories: { name: string } | null;
  driver_assignments: DriverAssignment[];
}

export interface Driver {
  id: string;
  full_name: string;
  phone: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
}

export type Leg = "outbound" | "return";

/** An assignment still occupies a driver until it is removed or completed. */
export const LIVE_ASSIGNMENT_STATUSES = ["assigned", "accepted", "picked_up"];

export const STATUS_META: Record<
  string,
  { label: string; chip: string; rail: string; dot: string }
> = {
  pending: {
    label: "Ödeme Bekliyor",
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    rail: "bg-amber-400",
    dot: "bg-amber-500",
  },
  paid: {
    label: "Ödendi",
    chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    rail: "bg-sky-500",
    dot: "bg-sky-500",
  },
  driver_assigned: {
    label: "Şoför Atandı",
    chip: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    rail: "bg-violet-500",
    dot: "bg-violet-500",
  },
  passenger_picked_up: {
    label: "Yolcu Alındı",
    chip: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    rail: "bg-indigo-500",
    dot: "bg-indigo-500",
  },
  completed: {
    label: "Tamamlandı",
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    rail: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "İptal Edildi",
    chip: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
    rail: "bg-slate-300",
    dot: "bg-slate-400",
  },
  cancel_requested: {
    label: "İptal Talebi",
    chip: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    rail: "bg-rose-500",
    dot: "bg-rose-500",
  },
};

export const ASSIGNMENT_META: Record<
  string,
  { label: string; chip: string; step: number }
> = {
  assigned: {
    label: "Şoföre Gönderildi",
    chip: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    step: 0,
  },
  accepted: {
    label: "Şoför Kabul Etti",
    chip: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    step: 1,
  },
  picked_up: {
    label: "Yolcu Alındı",
    chip: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    step: 2,
  },
  completed: {
    label: "Tamamlandı",
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    step: 3,
  },
};

export const ASSIGNMENT_STEPS = [
  "Atandı",
  "Kabul Edildi",
  "Yolcu Alındı",
  "Tamamlandı",
];

export const statusMeta = (status: string) =>
  STATUS_META[status] ?? {
    label: status.replace(/_/g, " "),
    chip: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    rail: "bg-slate-300",
    dot: "bg-slate-400",
  };

export const assignmentMeta = (status: string) =>
  ASSIGNMENT_META[status] ?? {
    label: status.replace(/_/g, " "),
    chip: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    step: 0,
  };

// ─── date helpers ───
// pickup/return values are stored Antalya wall clocks; created_at and the
// assignment timestamps are real instants. See lib/datetime for why the two
// need different formatting.

export const fmtDate = (iso: string) => formatBookingDate(iso);
export const fmtTime = (iso: string) => formatBookingTime(iso);
export const fmtDateTime = (iso: string) => formatBookingDateTime(iso);

/** For created_at / assigned_at / accepted_at / picked_up_at / completed_at. */
export const fmtStamp = (iso?: string | null) => (iso ? formatInstant(iso) : null);
export const fmtInstantDate = (iso: string) => formatInstantDate(iso);

export const dayKey = (iso: string) => bookingDayKey(iso);

export const todayKey = () => todayInBookingTz();

export const offsetDayKey = (days: number) => bookingDayOffset(days);

export const dayLabel = (key: string) => {
  if (key === todayKey()) return "Bugün";
  if (key === offsetDayKey(1)) return "Yarın";
  if (key === offsetDayKey(-1)) return "Dün";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("tr-TR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

/** The moment a given leg actually runs — the return leg uses the return date. */
export const legDateTime = (r: Reservation, leg: string) =>
  leg === "return" ? r.return_datetime ?? r.pickup_datetime : r.pickup_datetime;

export const liveAssignment = (r: Reservation, leg: Leg) =>
  r.driver_assignments?.find(
    (da) => da.leg === leg && LIVE_ASSIGNMENT_STATUSES.includes(da.status)
  );

export const isCash = (r: Reservation) => r.payment_method === "cash";

export const money = (v: number | null | undefined) =>
  `$${(Number(v) || 0).toFixed(2)}`;

export const customerName = (r: Reservation) =>
  `${r.customers?.first_name ?? ""} ${r.customers?.last_name ?? ""}`.trim() ||
  "İsimsiz müşteri";

export const regionName = (r: Reservation) =>
  r.regions?.name_tr || r.regions?.name_en || "—";

/** "Antalya Havalimanı → Kargıcak" for one leg of this reservation. */
export const routeFor = (r: Reservation, leg: Leg = "outbound") =>
  legRoute(r.direction, leg, regionName(r));

/** Short form for the collapsed card: "Havalimanı → Kargıcak". */
export const shortRouteFor = (r: Reservation, leg: Leg = "outbound") => {
  const { from, to } = legEndpoints(r.direction, leg, regionName(r));
  const short = (s: string) => (s.startsWith("Antalya Havalimanı") ? "Havalimanı" : s);
  return { from: short(from), to: short(to) };
};
