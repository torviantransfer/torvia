import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingDayKey, todayInBookingTz } from "@/lib/datetime";
import type { SearchHit } from "@/components/admin/ui/CommandPalette";

const COLUMNS = "id, reservation_code, status, pickup_datetime, flight_code, hotel_name, customers(first_name, last_name)";
const LIMIT = 8;

interface Row {
  id: string;
  reservation_code: string;
  status: string;
  pickup_datetime: string | null;
  flight_code: string | null;
  hotel_name: string | null;
  customers: { first_name: string | null; last_name: string | null } | null;
}

/**
 * Reservation search for the Ctrl K palette: code, flight, hotel, and the
 * customer's name, e-mail or phone. Upcoming transfers come first, nearest
 * first, then past ones, latest first — the one being looked for is usually
 * the next one.
 */
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  // PostgREST's filter syntax reserves these; a stray comma would split the filter.
  const q = (request.nextUrl.searchParams.get("q") ?? "")
    .replace(/[,()*%\\"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  if (q.length < 2) return NextResponse.json({ results: [] });

  const db = createAdminClient();
  const like = `%${q}%`;

  const customerFilters = [`first_name.ilike.${like}`, `last_name.ilike.${like}`, `email.ilike.${like}`, `phone.ilike.${like}`];
  const digits = q.replace(/\D/g, "");
  if (digits.length >= 4 && digits !== q) customerFilters.push(`phone.ilike.%${digits}%`);
  const words = q.split(" ");
  if (words.length > 1) {
    customerFilters.push(`and(first_name.ilike.%${words[0]}%,last_name.ilike.%${words.slice(1).join(" ")}%)`);
  }

  const [direct, customers] = await Promise.all([
    db
      .from("reservations")
      .select(COLUMNS)
      .or([`reservation_code.ilike.${like}`, `flight_code.ilike.${like}`, `return_flight_code.ilike.${like}`, `hotel_name.ilike.${like}`].join(","))
      .order("pickup_datetime", { ascending: false })
      .limit(LIMIT * 2),
    db.from("customers").select("id").or(customerFilters.join(",")).limit(50),
  ]);

  const ids = (customers.data ?? []).map((c: { id: string }) => c.id);
  const byCustomer = ids.length
    ? await db
        .from("reservations")
        .select(COLUMNS)
        .in("customer_id", ids)
        .order("pickup_datetime", { ascending: false })
        .limit(LIMIT * 2)
    : { data: [] };

  const seen = new Map<string, Row>();
  for (const row of [...(direct.data ?? []), ...(byCustomer.data ?? [])] as unknown as Row[]) {
    seen.set(row.id, row);
  }

  const today = todayInBookingTz();
  const rows = [...seen.values()].sort((a, b) => {
    const ak = a.pickup_datetime ?? "";
    const bk = b.pickup_datetime ?? "";
    const aAhead = !!ak && bookingDayKey(ak) >= today;
    const bAhead = !!bk && bookingDayKey(bk) >= today;
    if (aAhead !== bAhead) return aAhead ? -1 : 1;
    return aAhead ? ak.localeCompare(bk) : bk.localeCompare(ak);
  });

  const results: SearchHit[] = rows.slice(0, LIMIT).map((r) => ({
    code: r.reservation_code,
    name: [r.customers?.first_name, r.customers?.last_name].filter(Boolean).join(" "),
    pickup: r.pickup_datetime,
    status: r.status,
    flight: r.flight_code,
    hotel: r.hotel_name,
  }));

  return NextResponse.json({ results }, { headers: { "Cache-Control": "no-store" } });
}
