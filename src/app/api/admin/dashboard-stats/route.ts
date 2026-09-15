import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONFIRMED_STATUSES } from "@/lib/reservation-status";
import { reservationMoney } from "@/lib/currency";
import { BOOKING_TZ, bookingDayKey, todayInBookingTz } from "@/lib/datetime";
import { addDays, addMonths, monthKey, monthLabel } from "@/lib/period";
import { fetchAll } from "@/lib/supabaseFetchAll";

interface Row {
  status: string;
  total_price: number;
  currency: string | null;
  exchange_rate_eur: number | null;
  created_at: string;
  pickup_datetime: string;
  trip_type: string;
  stripe_payment_intent_id: string | null;
  regions: { name_tr: string | null; name_en: string | null } | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Antalya's calendar day of a real instant (created_at). */
const instantDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: BOOKING_TZ });

/**
 * The booking charts on the analytics tab. Revenue is in euro, whichever
 * currency a row was taken in, and counted by transfer date as on the finance
 * screen; booking counts go by the day the booking was made. The version
 * before added dollars and euros together and bucketed by the server's clock.
 */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const db = createAdminClient();
  const rows = (await fetchAll((from, to) =>
    db
      .from("reservations")
      .select("status, total_price, currency, exchange_rate_eur, created_at, pickup_datetime, trip_type, stripe_payment_intent_id, regions(name_tr, name_en)")
      .neq("status", "cancelled")
      .order("id")
      .range(from, to)
  )) as unknown as Row[];

  const today = todayInBookingTz();
  const thisMonth = monthKey(today);
  const eur = (r: Row) => reservationMoney(Number(r.total_price) || 0, r.currency, r.exchange_rate_eur).value;
  const confirmed = rows.filter((r) => CONFIRMED_STATUSES.includes(r.status));

  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => addMonths(thisMonth, i - 11)).map((key) => ({
    month: monthLabel(key),
    revenue: round2(confirmed.filter((r) => bookingDayKey(r.pickup_datetime).startsWith(key)).reduce((s, r) => s + eur(r), 0)),
    count: rows.filter((r) => instantDay(r.created_at).startsWith(key)).length,
  }));

  const statusMap = new Map<string, number>();
  for (const r of rows) statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);

  const regionMap = new Map<string, { name: string; count: number; revenue: number }>();
  for (const r of rows) {
    const name = r.regions?.name_tr || r.regions?.name_en || "Bilinmiyor";
    const entry = regionMap.get(name) ?? { name, count: 0, revenue: 0 };
    entry.count += 1;
    if (CONFIRMED_STATUSES.includes(r.status)) entry.revenue += eur(r);
    regionMap.set(name, entry);
  }

  const dailyBookings = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29)).map((day) => ({
    date: `${day.slice(8, 10)}.${day.slice(5, 7)}`,
    count: rows.filter((r) => instantDay(r.created_at) === day).length,
  }));

  const paymentInitiated = rows.filter((r) => r.stripe_payment_intent_id !== null).length;

  return NextResponse.json(
    {
      monthlyRevenue,
      statusDistribution: [...statusMap.entries()].map(([name, value]) => ({ name, value })),
      topRegions: [...regionMap.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map((r) => ({ ...r, revenue: round2(r.revenue) })),
      tripTypes: [
        { name: "Tek yön", value: rows.filter((r) => r.trip_type === "one_way").length },
        { name: "Gidiş-dönüş", value: rows.filter((r) => r.trip_type === "round_trip").length },
      ],
      dailyBookings,
      summary: {
        totalReservations: rows.length,
        totalRevenue: round2(confirmed.reduce((s, r) => s + eur(r), 0)),
        thisMonthCount: rows.filter((r) => instantDay(r.created_at).startsWith(thisMonth)).length,
        thisMonthRevenue: round2(confirmed.filter((r) => bookingDayKey(r.pickup_datetime).startsWith(thisMonth)).reduce((s, r) => s + eur(r), 0)),
        cancelRequested: rows.filter((r) => r.status === "cancel_requested").length,
        paymentInitiated,
        paymentCompleted: confirmed.length,
        paymentPending: rows.filter((r) => r.status === "pending" && r.stripe_payment_intent_id !== null).length,
        paymentConversion: paymentInitiated > 0 ? Math.round((confirmed.length / paymentInitiated) * 100) : 0,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
