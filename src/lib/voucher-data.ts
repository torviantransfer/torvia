import type { ReservationEmailData } from "@/lib/email";
import { convertFromUSD } from "@/lib/currency";

/**
 * Columns the voucher builders need. Keep in sync with the select strings in
 * /api/voucher and /api/admin/voucher-pdf.
 */
export const VOUCHER_SELECT = `
  *,
  regions(name_en, name_tr, name_de, name_pl, name_ru, name_nl, name_ro, slug),
  customers(first_name, last_name, email),
  vehicle_categories(name)
`;

type Row = Record<string, unknown> & {
  regions?: Record<string, unknown> | null;
  customers?: Record<string, string> | null;
  vehicle_categories?: { name?: string } | null;
};

/**
 * Maps a reservation row (with regions/customers/vehicle_categories joined) onto
 * the shape both the HTML voucher and the PDF voucher expect. Prices are stored
 * in USD; the voucher is presented in EUR via the rate captured at booking time.
 */
export function buildVoucherData(res: Row, locale: string): ReservationEmailData {
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0)) || 0;

  const regionName =
    (res.regions?.[`name_${locale}`] as string | undefined) ??
    (res.regions?.name_en as string | undefined) ??
    "";

  // exchange_rate_eur is EUR per ONE dollar, so converting multiplies. This
  // used to divide, which inverted the rate: $85 was vouchered as €98.41.
  const eurRate = num(res.exchange_rate_eur) || 1;
  const toEur = (usd: unknown) => convertFromUSD(num(usd), eurRate);

  const paymentMethod = res.payment_method === "cash" ? "cash" : "online";
  const depositAmount = num(res.deposit_amount);
  const driverAmount = num(res.driver_amount);

  return {
    to: res.customers?.email ?? "",
    reservationCode: String(res.reservation_code ?? ""),
    firstName: res.customers?.first_name ?? "",
    lastName: res.customers?.last_name ?? "",
    regionName: String(regionName),
    pickupDate: String(res.pickup_datetime ?? "").split("T")[0] ?? "",
    pickupTime: String(res.pickup_datetime ?? "").split("T")[1]?.slice(0, 5) ?? "",
    tripType: res.trip_type === "round_trip" ? "round_trip" : "one_way",
    returnDate: res.return_datetime ? String(res.return_datetime).split("T")[0] : undefined,
    returnTime: res.return_datetime
      ? String(res.return_datetime).split("T")[1]?.slice(0, 5)
      : undefined,
    adults: num(res.adults) || 1,
    children: num(res.children),
    luggageCount: num(res.luggage_count),
    childSeat: Boolean(res.child_seat),
    hotelName: (res.hotel_name as string) ?? undefined,
    flightCode: (res.flight_code as string) ?? undefined,
    returnFlightCode: (res.return_flight_code as string) ?? undefined,
    vehicleName: res.vehicle_categories?.name,
    basePrice: toEur(res.base_price),
    nightSurcharge: toEur(res.night_surcharge),
    childSeatFee: toEur(res.child_seat_fee),
    roundTripDiscount: toEur(res.round_trip_discount),
    couponDiscount: toEur(res.coupon_discount),
    totalEur: toEur(res.total_price),
    qrCodeToken: (res.qr_code_token as string) ?? undefined,
    locale,
    direction: (res.direction as string) ?? null,
    paymentMethod,
    // Only meaningful for cash bookings — the HTML/PDF builders gate on both.
    ...(paymentMethod === "cash" && depositAmount > 0
      ? { depositAmountEur: toEur(depositAmount), driverAmountEur: toEur(driverAmount) }
      : {}),
  };
}
