import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAll } from "@/lib/supabaseFetchAll";
import { CAPACITY_STATUSES } from "@/lib/reservation-status";
import { todayInBookingTz } from "@/lib/datetime";
import type { ReservationQuery } from "@/lib/reservationQuery";
import {
  dayKey,
  focusLeg,
  legDateTime,
  legsOf,
  legsWithoutDriver,
  type Driver,
  type Reservation,
  type ReservationDetail,
  type ReservationListResult,
  type Vehicle,
} from "@/components/admin/reservations/types";

type Db = ReturnType<typeof createAdminClient>;

export const RESERVATION_PAGE = 60;

/**
 * What a row shows, what the filters read, and what the drawer needs to decide
 * whether a leg is waiting for a driver. Everything else — price components,
 * notes, addresses — is loaded when a reservation is opened.
 */
const LIST_SELECT = `
  id, reservation_code, status, trip_type, direction, created_at, locale, region_id,
  pickup_datetime, return_datetime, total_price, payment_method, deposit_amount, driver_amount,
  currency, exchange_rate_eur, exchange_rate_usd,
  adults, children, luggage_count, flight_code, return_flight_code, hotel_name,
  customers(first_name, last_name, email, phone),
  regions(name_en, name_tr, slug),
  driver_assignments(id, leg, status, driver_id, driver_fee, driver_fee_currency, pickup_time,
    drivers(full_name, phone), vehicles(plate_number, brand, model))
`;

const DETAIL_SELECT = `*,
  customers(first_name, last_name, email, phone),
  regions(name_en, name_tr, slug),
  vehicle_categories(name),
  driver_assignments(*, drivers(full_name, phone), vehicles(plate_number, brand, model))`;

const listQuery = (db: Db) => db.from("reservations").select(LIST_SELECT);
type ListBuilder = ReturnType<typeof listQuery>;

/** Every row a list query matches, a thousand at a time. */
const readAll = (build: () => ListBuilder) =>
  fetchAll((from, to) => build().order("id").range(from, to)).then((rows) => rows as unknown as Reservation[]);

/** Matches nothing, for a filter that resolved to an empty set of ids. */
const NO_MATCH = "00000000-0000-0000-0000-000000000000";

/**
 * The search box as one PostgREST `or` group. The text columns on the booking
 * are matched directly; the customer, the region and the driver live in other
 * tables and are resolved to ids first.
 */
async function searchGroup(db: Db, raw: string): Promise<string | null> {
  // PostgREST's filter syntax reserves these; a stray comma would split the filter.
  const q = raw.replace(/[,()*%\\"]/g, " ").replace(/\s+/g, " ").trim();
  if (q.length < 2) return null;
  const like = `%${q}%`;

  const customerFilters = [
    `first_name.ilike.${like}`,
    `last_name.ilike.${like}`,
    `email.ilike.${like}`,
    `phone.ilike.${like}`,
  ];
  const digits = q.replace(/\D/g, "");
  if (digits.length >= 4 && digits !== q) customerFilters.push(`phone.ilike.%${digits}%`);
  const words = q.split(" ");
  if (words.length > 1) {
    customerFilters.push(`and(first_name.ilike.%${words[0]}%,last_name.ilike.%${words.slice(1).join(" ")}%)`);
  }

  const [customers, regions, drivers] = await Promise.all([
    db.from("customers").select("id").or(customerFilters.join(",")).limit(100),
    db.from("regions").select("id").or(`name_tr.ilike.${like},name_en.ilike.${like}`).limit(30),
    db.from("drivers").select("id").ilike("full_name", like).limit(30),
  ]);

  const driverIds = (drivers.data ?? []).map((d: { id: string }) => d.id);
  const assignments = driverIds.length
    ? await db.from("driver_assignments").select("reservation_id").in("driver_id", driverIds).limit(500)
    : { data: [] as { reservation_id: string }[] };

  const parts = [
    `reservation_code.ilike.${like}`,
    `flight_code.ilike.${like}`,
    `return_flight_code.ilike.${like}`,
    `hotel_name.ilike.${like}`,
  ];
  const customerIds = (customers.data ?? []).map((c: { id: string }) => c.id);
  const regionIds = (regions.data ?? []).map((r: { id: string }) => r.id);
  const reservationIds = [
    ...new Set((assignments.data ?? []).map((a: { reservation_id: string }) => a.reservation_id)),
  ];
  if (customerIds.length) parts.push(`customer_id.in.(${customerIds.join(",")})`);
  if (regionIds.length) parts.push(`region_id.in.(${regionIds.join(",")})`);
  if (reservationIds.length) parts.push(`id.in.(${reservationIds.join(",")})`);
  return parts.join(",");
}

async function driverReservationIds(db: Db, driverId: string): Promise<string[]> {
  const { data } = await db.from("driver_assignments").select("reservation_id").eq("driver_id", driverId).limit(2000);
  return [...new Set((data ?? []).map((a: { reservation_id: string }) => a.reservation_id))];
}

/**
 * One page of the reservations screen and the counts on its tabs.
 *
 * The forward-looking tabs (upcoming, today, waiting for a driver, awaiting
 * payment, cancel requests) are read whole and sorted here: a row's place
 * depends on which of its legs is next, which the database cannot order by.
 * They are bounded by the calendar, so they stay small. Past and all are paged
 * in the database, since those grow without end.
 */
export async function loadReservationList(
  db: Db,
  query: ReservationQuery,
  offset = 0,
  limit = RESERVATION_PAGE
): Promise<ReservationListResult> {
  const today = todayInBookingTz();
  // Pickup times are the Antalya wall clock stored as UTC (lib/datetime), so
  // midnight is written without an offset. Quoted: it carries colons.
  const midnight = `${today}T00:00:00`;

  const [search, driverIds] = await Promise.all([
    searchGroup(db, query.q),
    query.driver ? driverReservationIds(db, query.driver) : Promise.resolve(null),
  ]);

  const filtered = (extraOr: string[] = []): ListBuilder => {
    let b = listQuery(db);
    const groups = [...extraOr];
    if (search) groups.push(search);
    if (query.payment === "online") groups.push("payment_method.is.null,payment_method.neq.cash");
    if (groups.length === 1) b = b.or(groups[0]);
    else if (groups.length > 1) b = b.or(`and(${groups.map((g) => `or(${g})`).join(",")})`);
    if (driverIds) b = b.in("id", driverIds.length ? driverIds : [NO_MATCH]);
    if (query.region) b = b.eq("region_id", query.region);
    if (query.payment === "cash") b = b.eq("payment_method", "cash");
    if (query.payment === "pending") b = b.eq("status", "pending");
    if (query.from) b = b.gte("pickup_datetime", `${query.from}T00:00:00`);
    if (query.to) b = b.lte("pickup_datetime", `${query.to}T23:59:59`);
    return b;
  };

  const [upcoming, pending, cancel] = await Promise.all([
    readAll(() =>
      filtered([`pickup_datetime.gte."${midnight}",return_datetime.gte."${midnight}"`]).in("status", CAPACITY_STATUSES)
    ),
    readAll(() => filtered().eq("status", "pending").gte("pickup_datetime", midnight)),
    readAll(() => filtered().eq("status", "cancel_requested")),
  ]);

  const todayRows = upcoming.filter((r) => legsOf(r).some((leg) => dayKey(legDateTime(r, leg)) === today));
  const driverRows = upcoming.filter((r) => legsWithoutDriver(r, today).length > 0);
  const counts = {
    today: todayRows.length,
    driver: driverRows.length,
    pending: pending.length,
    cancel: cancel.length,
  };

  if (query.tab === "past" || query.tab === "all") {
    let b =
      query.tab === "past"
        ? filtered([`return_datetime.is.null,return_datetime.lt."${midnight}"`])
            .lt("pickup_datetime", midnight)
            .neq("status", "pending")
        : filtered();
    b =
      query.sort === "created"
        ? b.order("created_at", { ascending: false })
        : b.order("pickup_datetime", { ascending: false });
    const { data, error } = await b.order("id").range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Reservation[];
    return { rows, counts, today, nextOffset: rows.length === limit ? offset + limit : null };
  }

  const set = { upcoming, today: todayRows, driver: driverRows, pending, cancel }[query.tab];
  const tab = query.tab;
  const sorted = [...set].sort((a, b) =>
    query.sort === "created"
      ? b.created_at.localeCompare(a.created_at)
      : legDateTime(a, focusLeg(a, tab, today)).localeCompare(legDateTime(b, focusLeg(b, tab, today)))
  );
  return {
    rows: sorted.slice(offset, offset + limit),
    counts,
    today,
    nextOffset: offset + limit < sorted.length ? offset + limit : null,
  };
}

/**
 * Bookings with a leg on any day from `from` to `to` (inclusive), including
 * unpaid ones — the Bugün screen lists those as payments to chase.
 */
export function loadLegsBetween(db: Db, from: string, to: string): Promise<Reservation[]> {
  const start = `"${from}T00:00:00"`;
  const end = `"${to}T23:59:59"`;
  return readAll(() =>
    listQuery(db)
      .or(
        `and(pickup_datetime.gte.${start},pickup_datetime.lte.${end}),and(return_datetime.gte.${start},return_datetime.lte.${end})`
      )
      .in("status", [...CAPACITY_STATUSES, "pending"])
  );
}

/** Cancel requests still waiting for an answer, whatever their date. */
export function loadCancelRequests(db: Db): Promise<Reservation[]> {
  return readAll(() => listQuery(db).eq("status", "cancel_requested"));
}

/** How far either side of the transfer to look for a driver's other jobs. */
const WORKLOAD_WINDOW_DAYS = 2;

/** Everything the reservation drawer and its full page show. */
export async function loadReservationDetail(db: Db, code: string): Promise<ReservationDetail | null> {
  const { data: reservation } = await db
    .from("reservations")
    .select(DETAIL_SELECT)
    .eq("reservation_code", code)
    .maybeSingle();

  if (!reservation) return null;

  /*
   * The assign panel shows how busy each driver already is on the day, which
   * needs other bookings — only the ones near this transfer.
   */
  const centre = new Date(reservation.pickup_datetime as string);
  const from = new Date(centre);
  from.setDate(from.getDate() - WORKLOAD_WINDOW_DAYS);
  const to = new Date(centre);
  to.setDate(to.getDate() + WORKLOAD_WINDOW_DAYS + (reservation.return_datetime ? 30 : 0));

  const [{ data: nearby }, { data: drivers }, { data: vehicles }, { data: events }] = await Promise.all([
    db
      .from("reservations")
      .select(
        `id, reservation_code, status, trip_type, pickup_datetime, return_datetime,
         regions(name_en, name_tr),
         driver_assignments(id, leg, status, driver_id)`
      )
      .neq("status", "cancelled")
      .gte("pickup_datetime", from.toISOString())
      .lte("pickup_datetime", to.toISOString())
      .limit(500),
    db.from("drivers").select("id, full_name, phone").eq("is_active", true).order("full_name"),
    db.from("vehicles").select("id, plate_number, brand, model").eq("is_active", true).order("plate_number"),
    db
      .from("event_log")
      .select("id, action, actor, detail, created_at")
      .eq("reservation_id", reservation.id as string)
      .order("created_at"),
  ]);

  return {
    reservation: reservation as unknown as Reservation,
    nearby: (nearby ?? []) as unknown as Reservation[],
    drivers: (drivers ?? []) as Driver[],
    vehicles: (vehicles ?? []) as Vehicle[],
    events: (events ?? []) as ReservationDetail["events"],
  };
}
