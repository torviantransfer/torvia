import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generatePDFVoucher } from "@/lib/pdf-voucher";
import type { ReservationEmailData } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";

  if (!code) {
    return NextResponse.json({ error: "Missing reservation code" }, { status: 400 });
  }

  const { data: res } = await supabase
    .from("reservations")
    .select(`
      *,
      regions(name_en, name_tr, name_de, name_pl, name_ru, slug),
      customers(first_name, last_name, email),
      vehicle_categories(name)
    `)
    .eq("reservation_code", code)
    .eq("status", "paid")
    .single();

  if (!res) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const regionName =
    res.regions?.[`name_${locale}` as keyof typeof res.regions] ??
    res.regions?.name_en ?? "";

  const eurRate = res.exchange_rate_eur ?? 1;
  const totalEur = eurRate > 0 ? res.total_price / eurRate : res.total_price;
  const basePriceEur = eurRate > 0 ? res.base_price / eurRate : res.base_price;
  const nightEur = eurRate > 0 ? res.night_surcharge / eurRate : res.night_surcharge;
  const childSeatEur = eurRate > 0 ? res.child_seat_fee / eurRate : res.child_seat_fee;
  const welcomeEur = eurRate > 0 ? res.welcome_sign_fee / eurRate : res.welcome_sign_fee;
  const rtDiscountEur = eurRate > 0 ? res.round_trip_discount / eurRate : res.round_trip_discount;
  const couponDiscountEur = eurRate > 0 ? res.coupon_discount / eurRate : res.coupon_discount;

  const emailData: ReservationEmailData = {
    to: res.customers?.email ?? "",
    reservationCode: res.reservation_code,
    firstName: res.customers?.first_name ?? "",
    lastName: res.customers?.last_name ?? "",
    regionName: String(regionName),
    pickupDate: res.pickup_datetime?.split("T")[0] ?? "",
    pickupTime: res.pickup_datetime?.split("T")[1]?.slice(0, 5) ?? "",
    tripType: res.trip_type,
    returnDate: res.return_datetime?.split("T")[0],
    returnTime: res.return_datetime?.split("T")[1]?.slice(0, 5),
    adults: res.adults ?? 1,
    children: res.children ?? 0,
    luggageCount: res.luggage_count ?? 0,
    childSeat: res.child_seat ?? false,
    welcomeSign: res.welcome_sign ?? false,
    welcomeName: res.welcome_name,
    hotelName: res.hotel_name,
    flightCode: res.flight_code,
    vehicleName: res.vehicle_categories?.name,
    basePrice: basePriceEur,
    nightSurcharge: nightEur,
    childSeatFee: childSeatEur,
    welcomeSignFee: welcomeEur,
    roundTripDiscount: rtDiscountEur,
    couponDiscount: couponDiscountEur,
    totalEur,
    qrCodeToken: res.qr_code_token,
    locale,
  };

  const pdfBuffer = await generatePDFVoucher(emailData);
  const uint8 = new Uint8Array(pdfBuffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="TORVIAN-Voucher-${code}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
