/**
 * What the reservations screen is showing: tab, search, filters, sort.
 *
 * Read from and written to the URL, so a filtered list can be sent to someone
 * and survives a refresh. The same parser runs on the page and in the API, so
 * the two cannot disagree about what a link means.
 */

export type ReservationTab = "upcoming" | "today" | "driver" | "pending" | "cancel" | "past" | "all";
export type PaymentFilter = "" | "online" | "cash" | "pending";
export type ReservationSort = "pickup" | "created";

export interface ReservationQuery {
  tab: ReservationTab;
  q: string;
  /** `YYYY-MM-DD`, on the pickup date. */
  from: string;
  to: string;
  region: string;
  driver: string;
  payment: PaymentFilter;
  sort: ReservationSort;
}

export const RESERVATION_TABS: ReservationTab[] = ["upcoming", "today", "driver", "pending", "cancel", "past", "all"];

export const DEFAULT_RESERVATION_QUERY: ReservationQuery = {
  tab: "upcoming",
  q: "",
  from: "",
  to: "",
  region: "",
  driver: "",
  payment: "",
  sort: "pickup",
};

type Source = URLSearchParams | Record<string, string | string[] | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function read(source: Source, key: string): string {
  const value = source instanceof URLSearchParams ? source.get(key) : source[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseReservationQuery(source: Source): ReservationQuery {
  const tab = read(source, "tab");
  const payment = read(source, "payment");
  const from = read(source, "from");
  const to = read(source, "to");
  const region = read(source, "region");
  const driver = read(source, "driver");
  return {
    tab: (RESERVATION_TABS as string[]).includes(tab) ? (tab as ReservationTab) : "upcoming",
    q: read(source, "q").slice(0, 80),
    from: DAY.test(from) ? from : "",
    to: DAY.test(to) ? to : "",
    // An id that is not a uuid would reach Postgres as a type error, not an empty list.
    region: UUID.test(region) ? region : "",
    driver: UUID.test(driver) ? driver : "",
    payment: (["online", "cash", "pending"] as string[]).includes(payment) ? (payment as PaymentFilter) : "",
    sort: read(source, "sort") === "created" ? "created" : "pickup",
  };
}

/** The query as a URL string, leaving out whatever is at its default. */
export function reservationQueryString(
  query: ReservationQuery,
  extra: Record<string, string | number | undefined> = {}
): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(DEFAULT_RESERVATION_QUERY) as (keyof ReservationQuery)[]) {
    const value = query[key];
    if (value && value !== DEFAULT_RESERVATION_QUERY[key]) params.set(key, value);
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

/** Anything beyond the tab and the sort order. */
export const hasReservationFilters = (q: ReservationQuery) =>
  !!(q.q || q.from || q.to || q.region || q.driver || q.payment);
