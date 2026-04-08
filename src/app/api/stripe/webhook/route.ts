import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendReservationEmail } from "@/lib/email";
import { notifyNewPayment } from "@/lib/telegram";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
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

    if (reservationId) {
      // Update reservation status to paid
      await supabase
        .from("reservations")
        .update({
          status: "paid",
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
        .select("*, regions(name_en, name_tr, name_de, name_pl, name_ru, slug), customers(id, email, first_name, last_name, auth_user_id), vehicle_categories(name)")
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
        const welcomeEur = eurRate > 0 ? resData.welcome_sign_fee / eurRate : resData.welcome_sign_fee;
        const rtDiscountEur = eurRate > 0 ? resData.round_trip_discount / eurRate : resData.round_trip_discount;
        const couponDiscountEur = eurRate > 0 ? resData.coupon_discount / eurRate : resData.coupon_discount;

        sendReservationEmail({
          to: resData.customers.email,
          reservationCode: resData.reservation_code,
          firstName: resData.customers.first_name,
          lastName: resData.customers.last_name ?? "",
          regionName: String(regionName),
          pickupDate: resData.pickup_datetime?.split("T")[0] ?? "",
          pickupTime: resData.pickup_datetime?.split("T")[1]?.slice(0, 5) ?? "",
          tripType: resData.trip_type,
          returnDate: resData.return_datetime?.split("T")[0],
          returnTime: resData.return_datetime?.split("T")[1]?.slice(0, 5),
          adults: resData.adults ?? 1,
          children: resData.children ?? 0,
          luggageCount: resData.luggage_count ?? 0,
          childSeat: resData.child_seat ?? false,
          welcomeSign: resData.welcome_sign ?? false,
          welcomeName: resData.welcome_name,
          hotelName: resData.hotel_name,
          flightCode: resData.flight_code,
          vehicleName: resData.vehicle_categories?.name,
          basePrice: basePriceEur,
          nightSurcharge: nightEur,
          childSeatFee: childSeatEur,
          welcomeSignFee: welcomeEur,
          roundTripDiscount: rtDiscountEur,
          couponDiscount: couponDiscountEur,
          totalEur,
          qrCodeToken: resData.qr_code_token,
          locale,
        }).catch(() => {});
      }

      // Send Telegram notification (fire and forget)
      notifyNewPayment({
        code: reservationCode ?? "?",
        amount: `${((paymentIntent.amount ?? 0) / 100).toFixed(2)} USD`,
        email: paymentIntent.receipt_email ?? resData.customers?.email ?? "?",
        region: String(resData.regions?.name_en ?? ""),
      }).catch(() => {});
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
