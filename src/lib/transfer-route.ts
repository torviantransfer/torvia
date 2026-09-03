/**
 * Which way a transfer actually runs.
 *
 * `direction` on a reservation describes its OUTBOUND leg; the return leg of a
 * round trip always runs the opposite way. Every place that prints a route —
 * admin list, calendar, driver voucher, customer voucher, emails — resolves it
 * here so a corrected direction shows up consistently rather than in some
 * screens only.
 */

export type Direction = "airport_to_region" | "region_to_airport";
export type Leg = "outbound" | "return";

export const DIRECTIONS: Direction[] = ["airport_to_region", "region_to_airport"];

export function normalizeDirection(value: unknown): Direction {
  return value === "region_to_airport" ? "region_to_airport" : "airport_to_region";
}

// The IATA code is carried in the label: drivers and hotel staff recognise AYT
// faster than the written name, and it is what the group messages have always used.
const AIRPORT_LABELS: Record<string, string> = {
  tr: "Antalya Havalimanı (AYT)",
  en: "Antalya Airport (AYT)",
  de: "Flughafen Antalya (AYT)",
  pl: "Lotnisko Antalya (AYT)",
  ru: "Аэропорт Анталья (AYT)",
  nl: "Luchthaven Antalya (AYT)",
};

export const airportLabel = (locale = "en") =>
  AIRPORT_LABELS[locale] ?? AIRPORT_LABELS.en;

/** True when the given leg starts at the airport. */
export function legStartsAtAirport(direction: unknown, leg: Leg): boolean {
  const fromAirport = normalizeDirection(direction) === "airport_to_region";
  return leg === "return" ? !fromAirport : fromAirport;
}

/** The two endpoints of one leg, already in the right order. */
export function legEndpoints(
  direction: unknown,
  leg: Leg,
  regionName: string,
  locale = "tr"
): { from: string; to: string } {
  const airport = airportLabel(locale);
  return legStartsAtAirport(direction, leg)
    ? { from: airport, to: regionName }
    : { from: regionName, to: airport };
}

/** "Antalya Havalimanı → Kargıcak" for the given leg. */
export function legRoute(
  direction: unknown,
  leg: Leg,
  regionName: string,
  locale = "tr",
  arrow = "→"
): string {
  const { from, to } = legEndpoints(direction, leg, regionName, locale);
  return `${from} ${arrow} ${to}`;
}

export const DIRECTION_LABELS_TR: Record<Direction, string> = {
  airport_to_region: "Havalimanından bölgeye (karşılama)",
  region_to_airport: "Bölgeden havalimanına (çıkış)",
};
