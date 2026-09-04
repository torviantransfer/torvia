import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReservationEmail } from "@/lib/email";
import { convertFromUSD } from "@/lib/currency";
import { notifyNewPayment, notifyNewCashBooking, notifyPaymentFailed, sendDriverVoucherToTelegram } from "@/lib/telegram";
import { capiPurchase } from "@/lib/capi";
import { bookingParts } from "@/lib/datetime";

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
      /* Stripe re-sends a webhook whenever the endpoint does not answer 2xx —
         a timeout, a deploy landing mid-request, a transient database error.
         None of the work below was guarded, so a retry sent the customer a
         second confirmation email, the office a second Telegram, and Meta a
         second Purchase.

         The reservation's status cannot be the guard. /api/reservations/confirm
         writes that too, from the browser, and it sends no email — so keying
         off the status would let a fast confirm call suppress the confirmation
         email altogether.

         The marker is the notification_log row this handler already writes,
         which carries the payment intent's id. A payment intent succeeds at
         most once, so its id identifies this work exactly. The row is written
         below, before any message goes out. */
      const { data: alreadyHandled } = await supabase
        .from("notification_log")
        .select("id")
        .eq("type", "payment_received")
        .contains("metadata", { payment_intent_id: paymentIntent.id })
        .limit(1)
        .maybeSingle();

      if (alreadyHandled) {
        return NextResponse.json({ received: true, duplicate: true });
      }

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
        .select("*, regions(name_en, name_tr, name_de, name_pl, name_ru, name_nl, slug, distance_km, duration_minutes), customers(id, email, first_name, last_name, auth_user_id, phone), vehicle_categories(name)")
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
        // EUR per ONE dollar — convert by multiplying. Dividing inverted every
        // figure in the confirmation email ($85 became €98.41).
        const eurRate = resData.exchange_rate_eur ?? 1;
        const toEur = (usd: number | null | undefined) =>
          convertFromUSD(Number(usd) || 0, eurRate);

        const totalEur = toEur(resData.total_price);
        const basePriceEur = toEur(resData.base_price);
        const nightEur = toEur(resData.night_surcharge);
        const childSeatEur = toEur(resData.child_seat_fee);
        const rtDiscountEur = toEur(resData.round_trip_discount);
        const couponDiscountEur = toEur(resData.coupon_discount);

        const depositAmountEur =
          isDeposit && resData.deposit_amount ? toEur(resData.deposit_amount) : undefined;
        const driverAmountEur =
          isDeposit && resData.driver_amount ? toEur(resData.driver_amount) : undefined;

        sendReservationEmail({
          to: resData.customers.email,
          reservationCode: resData.reservation_code,
          firstName: resData.customers.first_name,
          lastName: resData.customers.last_name ?? "",
          regionName: String(regionName),
          pickupDate: bookingParts(resData.pickup_datetime).date,
          pickupTime: bookingParts(resData.pickup_datetime).time,
          tripType: resData.trip_type,
          direction: resData.direction,
          returnDate: bookingParts(resData.return_datetime).date || undefined,
          returnTime: bookingParts(resData.return_datetime).time || undefined,
          adults: resData.adults ?? 1,
          children: resData.children ?? 0,
          luggageCount: resData.luggage_count ?? 0,
          childSeat: resData.child_seat ?? false,
          hotelName: resData.hotel_name,
          flightCode: resData.flight_code,
          returnFlightCode: resData.return_flight_code,
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
          email: paymentIntent.receipt_email ?? resData.customers?.email ?? "?",
          region: String(resData.regions?.name_tr ?? resData.regions?.name_en ?? ""),
        }).catch(() => {});
      } else {
        notifyNewPayment({
          code: reservationCode ?? "?",
          email: paymentIntent.receipt_email ?? resData.customers?.email ?? "?",
          region: String(resData.regions?.name_tr ?? resData.regions?.name_en ?? ""),
        }).catch(() => {});
      }

      // Send Purchase event to Meta Conversions API (server-side)
      // Meta requires custom_data.value to be a number greater than 0.
      if (resData?.customers?.email && reservationCode && (resData.total_price ?? 0) > 0) {
        capiPurchase(
          resData.total_price!,
          "USD",
          reservationCode,
          {
            email: resData.customers.email,
            phone: (resData.customers as Record<string, string> | null)?.phone,
            firstName: resData.customers.first_name,
            lastName: resData.customers.last_name ?? undefined,
          },
          undefined,
          `purchase_${reservationCode}`
        ).catch(() => {});
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
          direction: resData.direction,
          pickupDatetime: resData.pickup_datetime,
          returnDatetime: resData.return_datetime,
          flightCode: resData.flight_code,
          returnFlightCode: resData.return_flight_code,
          hotelName: resData.hotel_name,
          hotelAddress: resData.hotel_address,
          regionName: String(regionObj?.name_tr ?? regionObj?.name_en ?? ""),
          distanceKm: regionObj?.distance_km as number | undefined,
          durationMinutes: regionObj?.duration_minutes as number | undefined,
          adults: resData.adults ?? 1,
          children: resData.children ?? 0,
          luggageCount: resData.luggage_count ?? 0,
          childSeat: resData.child_seat ?? false,
          notes: resData.notes,
          paymentMethod: resData.payment_method,
          depositAmountUsd: resData.deposit_amount,
          driverAmountUsd: resData.driver_amount,
          exchangeRateEur: resData.exchange_rate_eur,
        }).catch(() => {});
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const reservationId = pi.metadata?.reservation_id;
    const reservationCode = pi.metadata?.reservation_code;
    const reason =
      pi.last_payment_error?.message ??
      pi.last_payment_error?.decline_code ??
      pi.last_payment_error?.code ??
      "unknown";

    if (reservationId) {
      /* Guarded on the event id rather than the intent's, because unlike a
         success a failure can genuinely happen more than once against the
         same intent — the customer tries a second card. Those are separate
         events and both deserve to be seen; only a re-delivery of the same
         event is a duplicate. */
      const { data: alreadyLogged } = await supabase
        .from("notification_log")
        .select("id")
        .eq("type", "payment_failed")
        .contains("metadata", { event_id: event.id })
        .limit(1)
        .maybeSingle();

      if (alreadyLogged) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      /* The status stays `pending` on purpose. The same client secret still
         accepts another card, and moving the reservation to a failed state
         would take that retry away. What was missing is any record that a
         card was tried at all: until now a pending row looked identical
         whether the customer never reached the card form or had three cards
         declined, so there was no way to tell which of them was worth a call
         back. */
      await supabase.from("notification_log").insert({
        reservation_id: reservationId,
        type: "payment_failed",
        channel: "system",
        recipient: "admin",
        content: `Payment failed for ${reservationCode ?? "?"}: ${reason}`,
        status: "failed",
        metadata: {
          event_id: event.id,
          reservation_id: reservationId,
          payment_intent_id: pi.id,
          decline_code: pi.last_payment_error?.decline_code ?? null,
          error_code: pi.last_payment_error?.code ?? null,
        },
      });

      // Read the customer so the alert carries a number to call, which is the
      // only reason to send it while the visit is still warm.
      const { data: resData } = await supabase
        .from("reservations")
        .select("reservation_code, regions(name_tr, name_en), customers(first_name, last_name, email, phone)")
        .eq("id", reservationId)
        .maybeSingle();

      /* PostgREST hands an embedded relation back as an object for a to-one
         join but the generated types describe it as an array, and which one
         arrives depends on how the join was written. Unwrap either shape
         rather than casting past the disagreement. */
      const one = <T,>(v: T | T[] | null | undefined): T | null =>
        (Array.isArray(v) ? v[0] : v) ?? null;

      const customer = one(resData?.customers) as
        | { first_name?: string; last_name?: string; email?: string; phone?: string }
        | null;
      const regionObj = one(resData?.regions) as Record<string, unknown> | null;

      notifyPaymentFailed({
        code: reservationCode ?? resData?.reservation_code ?? "?",
        email: pi.receipt_email ?? customer?.email ?? "?",
        phone: customer?.phone,
        name: [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || undefined,
        region: String(regionObj?.name_tr ?? regionObj?.name_en ?? ""),
        reason,
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
