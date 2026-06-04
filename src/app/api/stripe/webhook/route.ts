import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReservationEmail } from "@/lib/email";
import { notifyNewPayment, notifyNewCashBooking, sendDriverVoucherToTelegram } from "@/lib/telegram";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const reservationId = paymentIntent.metadata?.reservation_id;
    const reservationCode = paymentIntent.metadata?.reservation_code;
    const isDeposit = paymentIntent.metadata?.is_deposit === "true";
    const newStatus = isDeposit ? "deposit_paid" : "paid";

    if (reservationId) {
      // Update reservation status: deposit_paid for cash bookings, paid for online
      await supabase
        .from("reservations")
        .update({
          status: newStatus,
          stripe_payment_intent_id: paymentIntent.id,
        })
        .eq("id", reservationId);

      // Log notification
      await supabase.from("notification_log").insert({
        type: "payment_received",
        channel: "system",
        recipient: "admin",
        content: `Payment received for reservation ${reservationCode}. Amount: $${(paymentIntent.amount ?? 0) / 100}`,
        metadata: { reservation_id: reservationId, payment_intent_id: paymentIntent.id },
      });

      // Send confirmation email to customer
      const { data: resData } = await supabase
        .from("reservations")
        .select("*, regions(name_en, name_tr, name_de, name_pl, name_ru, slug, distance_km, duration_minutes), customers(id, email, first_name, last_name, auth_user_id, phone), vehicle_categories(name)")
        .eq("id", reservationId)
        .single();

      // Auto-create Supabase Auth account for the customer (passwordless)
      if (resData?.customers?.email && !resData.customers.auth_user_id) {
        try {
          const { data: authData } = await supabase.auth.admin.createUser({
            email: resData.customers.email,
            email_confirm: true,
            user_metadata: {
              full_name: `${resData.customers.first_name} ${resData.customers.last_name}`.trim(),
              first_name: resData.customers.first_name,
              last_name: resData.customers.last_name,
            },
          });

          if (authData?.user) {
            await supabase
              .from("customers")
              .update({ auth_user_id: authData.user.id })
              .eq("id", resData.customers.id);
          }
        } catch {
          // User may already exist in auth — try to find and link
          const { data: userList } = await supabase.auth.admin.listUsers();
          const existingAuth = userList?.users?.find(
            (u) => u.email === resData.customers.email
          );
          if (existingAuth) {
            await supabase
              .from("customers")
              .update({ auth_user_id: existingAuth.id })
              .eq("id", resData.customers.id);
          }
        }
      }

      if (resData?.customers?.email) {
        const locale = paymentIntent.metadata?.locale ?? "en";
        const regionName =
          resData.regions?.[`name_${locale}` as keyof typeof resData.regions] ??
          resData.regions?.name_en ??
          "";
        const eurRate = resData.exchange_rate_eur ?? 1;
        const totalEur = eurRate > 0 ? resData.total_price / eurRate : resData.total_price;
        const basePriceEur = eurRate > 0 ? resData.base_price / eurRate : resData.base_price;
        const nightEur = eurRate > 0 ? resData.night_surcharge / eurRate : resData.night_surcharge;
        const childSeatEur = eurRate > 0 ? resData.child_seat_fee / eurRate : resData.child_seat_fee;
        const rtDiscountEur = eurRate > 0 ? resData.round_trip_discount / eurRate : resData.round_trip_discount;
        const couponDiscountEur = eurRate > 0 ? resData.coupon_discount / eurRate : resData.coupon_discount;

        const depositAmountEur = isDeposit && resData.deposit_amount
          ? (eurRate > 0 ? resData.deposit_amount / eurRate : resData.deposit_amount)
          : undefined;
        const driverAmountEur = isDeposit && resData.driver_amount
          ? (eurRate > 0 ? resData.driver_amount / eurRate : resData.driver_amount)
          : undefined;

        sendReservationEmail({
          to: resData.customers.email,
          reservationCode: resData.reservation_code,
          firstName: resData.customers.first_name,
          lastName: resData.customers.last_name ?? "",
          regionName: String(regionName),
          pickupDate: resData.pickup_datetime ? new Date(resData.pickup_datetime).toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }) : "",
          pickupTime: resData.pickup_datetime ? new Date(resData.pickup_datetime).toLocaleTimeString("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" }) : "",
          tripType: resData.trip_type,
          returnDate: resData.return_datetime ? new Date(resData.return_datetime).toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }) : undefined,
          returnTime: resData.return_datetime ? new Date(resData.return_datetime).toLocaleTimeString("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" }) : undefined,
          adults: resData.adults ?? 1,
          children: resData.children ?? 0,
          luggageCount: resData.luggage_count ?? 0,
          childSeat: resData.child_seat ?? false,
          hotelName: resData.hotel_name,
          flightCode: resData.flight_code,
          vehicleName: resData.vehicle_categories?.name,
          basePrice: basePriceEur,
          nightSurcharge: nightEur,
          childSeatFee: childSeatEur,
          roundTripDiscount: rtDiscountEur,
          couponDiscount: couponDiscountEur,
          totalEur,
          qrCodeToken: resData.qr_code_token,
          locale,
          paymentMethod: isDeposit ? "cash" : "online",
          depositAmountEur,
          driverAmountEur,
        }).catch(() => {});
      }

      // Send Telegram notification (fire and forget)
      if (isDeposit) {
        notifyNewCashBooking({
          code: reservationCode ?? "?",
          amount: `${((paymentIntent.amount ?? 0) / 100).toFixed(2)} USD depozit`,
          cashTotal: `${(resData.total_price ?? 0).toFixed(2)} USD toplam`,
          driverAmount: `${(resData.driver_amount ?? 0).toFixed(2)} USD şöföre`,
          email: paymentIntent.receipt_email ?? resData.customers?.email ?? "?",
          region: String(resData.regions?.name_en ?? ""),
        }).catch(() => {});
      } else {
        notifyNewPayment({
          code: reservationCode ?? "?",
          amount: `${((paymentIntent.amount ?? 0) / 100).toFixed(2)} USD`,
          email: paymentIntent.receipt_email ?? resData.customers?.email ?? "?",
          region: String(resData.regions?.name_en ?? ""),
        }).catch(() => {});
      }

      // Send driver voucher (without price) to Telegram
      if (resData) {
        const regionObj = resData.regions as Record<string, unknown> | null;
        sendDriverVoucherToTelegram({
          reservationCode: resData.reservation_code,
          customerFirstName: resData.customers?.first_name ?? "",
          customerLastName: resData.customers?.last_name ?? "",
          customerPhone: (resData.customers as Record<string, string> | null)?.phone,
          tripType: resData.trip_type,
          pickupDatetime: resData.pickup_datetime,
          returnDatetime: resData.return_datetime,
          flightCode: resData.flight_code,
          hotelName: resData.hotel_name,
          hotelAddress: resData.hotel_address,
          regionName: String(regionObj?.name_en ?? ""),
          distanceKm: regionObj?.distance_km as number | undefined,
          durationMinutes: regionObj?.duration_minutes as number | undefined,
          adults: resData.adults ?? 1,
          children: resData.children ?? 0,
          luggageCount: resData.luggage_count ?? 0,
          childSeat: resData.child_seat ?? false,
          notes: resData.notes,
        }).catch(() => {});
      }
    }
  }

  if (event.type === "payment_intent.canceled") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const reservationId = pi.metadata?.reservation_id;
    if (reservationId) {
      await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId)
        .eq("status", "pending");
    }
  }

  return NextResponse.json({ received: true });
}
