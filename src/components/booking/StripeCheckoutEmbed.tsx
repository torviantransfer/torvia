"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCurrency } from "@/hooks/useCurrency";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, CreditCard, MapPin } from "lucide-react";

/**
 * Stripe carries its own translations for the card form and for the decline
 * messages it returns — but only when it is told which language to use.
 * Left unset it reads the browser, so a German customer on the German site
 * whose phone is set to English met an English card form in the middle of
 * paying. Every locale this site runs in is one Stripe supports; anything
 * else falls back to its own detection.
 */
const STRIPE_LOCALES = ["tr", "en", "de", "pl", "ru", "nl", "ro", "ar"];

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Props {
  clientSecret: string;
  reservationCode: string;
  locale: string;
  totalPrice: number;
  /** Already the full localized route ("Antalya Havalimanı → Belek"), not just the destination — this file has no locale-aware label for the airport end of it. */
  routeLabel: string;
  tripType: string;
  pickupDate: string;
  pickupTime: string;
  onSuccess: () => void;
  /** Needed to show the summary in the visitor's currency, not raw dollars. */
  exchangeRates: Record<string, number>;
  /** Already on the reservation from the passenger step — see `billingDetails`. */
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  // Cash deposit fields
  isDeposit?: boolean;
  depositAmount?: number;
  driverAmount?: number;
}

/**
 * The same tokens as the rest of the wizard: #F5F5F7 fields with no border
 * that go white on focus, #007AFF as the one accent, 12-14px radii. Stripe's
 * "flat" theme starts from thin gray borders on a white field — the right
 * base to start from, since night/stripe both carry stronger opinions this
 * would have to fight — but its defaults still read as a generic web form
 * dropped into a page that has otherwise moved to this system.
 */
const appearance: StripeElementsOptions["appearance"] = {
  theme: "flat",
  variables: {
    colorPrimary: "#007AFF",
    colorBackground: "#F5F5F7",
    colorText: "#1d1d1f",
    colorTextSecondary: "#86868b",
    colorDanger: "#D70015",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "12px",
    spacingUnit: "5px",
    fontSizeBase: "15px",
    colorIcon: "#86868b",
    fontWeightNormal: "500",
  },
  rules: {
    ".Input": {
      backgroundColor: "#F5F5F7",
      border: "none",
      boxShadow: "none",
      padding: "14px",
      fontSize: "15px",
    },
    ".Input:focus": {
      backgroundColor: "#FFFFFF",
      boxShadow: "0 0 0 2px rgba(0,122,255,0.4)",
    },
    ".Input--invalid": {
      backgroundColor: "#FFF2F1",
      boxShadow: "0 0 0 1px rgba(255,59,48,0.5)",
    },
    ".Label": {
      color: "#424245",
      fontSize: "13px",
      fontWeight: "500",
      marginBottom: "6px",
    },
    /* Tabs, not bordered boxes: a soft fill at rest, white with a blue ring
       once chosen — the same pairing the payment-method rows on the previous
       step use, so the card form reads as one more list in the same system
       rather than a different product embedded in the page. */
    ".Tab": {
      backgroundColor: "#F5F5F7",
      border: "none",
      borderRadius: "12px",
      boxShadow: "none",
      padding: "12px",
    },
    ".Tab:hover": {
      backgroundColor: "#EBEBED",
    },
    ".Tab--selected": {
      backgroundColor: "#FFFFFF",
      boxShadow: "0 0 0 2px #007AFF, 0 1px 2px rgba(0,0,0,0.05)",
    },
    ".TabLabel": {
      fontWeight: "600",
      fontSize: "13.5px",
    },
    ".Block": {
      backgroundColor: "#F5F5F7",
      borderRadius: "14px",
      border: "none",
      padding: "14px",
    },
    ".Dropdown": {
      borderRadius: "14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    },
    ".DropdownItem": {
      padding: "12px 14px",
      borderRadius: "10px",
    },
    ".DropdownItem--highlight": {
      backgroundColor: "#F5F5F7",
    },
    ".CheckboxInput": {
      borderRadius: "6px",
      border: "1.5px solid #c7c7cc",
    },
    ".CheckboxInput--checked": {
      backgroundColor: "#007AFF",
      borderColor: "#007AFF",
    },
  },
};

function CheckoutForm({ reservationCode, locale, totalPrice, routeLabel, tripType, pickupDate, pickupTime, onSuccess, exchangeRates, isDeposit, depositAmount, driverAmount, customerName, customerEmail, customerPhone }: Omit<Props, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("booking");
  const { format: fmt, formatBilling, isConverted } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Whether the wallet element found anything to draw on this device. */
  const [walletsShown, setWalletsShown] = useState(false);

  const money = (usd: number) => fmt(usd, exchangeRates);
  const formattedDate = (() => {
    try {
      return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(`${pickupDate}T00:00:00`));
    } catch {
      return pickupDate;
    }
  })();

  /**
   * Confirming is the same work whichever button started it.
   *
   * The card form and the wallet sheet hand back the same Elements instance
   * against the same intent, so Apple Pay reuses this rather than carrying a
   * second copy of the confirm, the `processing` guard and the fallback call
   * to /api/reservations/confirm — three things that must not be allowed to
   * drift apart depending on how the customer chose to pay.
   *
   * No `elements.submit()` here: that belongs to the deferred-intent flow,
   * and these Elements are created with a clientSecret.
   */
  const confirmPayment = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/booking/success?code=${reservationCode}`,
        // The Payment Element is told below (`fields.billingDetails`) not to
        // ask for these, since the passenger-info step already collected
        // them — a name/email/phone field the customer just typed, asked
        // again at the point of paying, reads as the form having lost what
        // they entered rather than as one connected booking.
        payment_method_data: {
          billing_details: {
            name: customerName || undefined,
            email: customerEmail || undefined,
            phone: customerPhone || undefined,
          },
        },
      },
      redirect: "if_required",
    });

    if (submitError) {
      // Stripe's own message is localised now that Elements knows the locale;
      // the fallback covers a failure that arrives without one.
      setError(submitError.message ?? t("errorGeneric"));
      setLoading(false);
      return;
    }

    /* `redirect: "if_required"` also returns without an error for an intent
       that is merely `processing`, and confirming one of those would record a
       payment that has not been taken. The success page checks the stored
       status either way, and the webhook lands the real one. */
    if (paymentIntent?.id && paymentIntent.status === "succeeded") {
      try {
        await fetch("/api/reservations/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            reservationCode,
          }),
        });
      } catch {
        // Webhook will handle it as fallback
      }
    }

    // Purchase tracking deliberately lives on the success page, not here: this
    // line never runs for cards that go through 3-D Secure (confirmPayment
    // redirects away first), so firing here produced one report for 3-D Secure
    // payments and two for everything else. The success page is reached by
    // both flows and verifies the reservation is actually paid.
    onSuccess();
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await confirmPayment();
  };

  return (
    <div className="space-y-5">
      {/* Order summary. Every label here was hardcoded English and every
          amount a hardcoded "$", so a German visitor paying in euro was shown
          "Total $40.00". */}
      <div className={`rounded-xl border p-4 ${isDeposit ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDeposit ? "bg-amber-500/10" : "bg-blue-500/10"}`}>
            <MapPin size={16} className={isDeposit ? "text-amber-600" : "text-blue-600"} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-sm font-semibold truncate">{routeLabel}</p>
            <p className="text-gray-500 text-xs">
              {tripType === "round_trip" ? t("roundTrip") : t("oneWay")} · {formattedDate} · {pickupTime}
            </p>
          </div>
        </div>

        {isDeposit && depositAmount != null && driverAmount != null ? (
          <div className="pt-3 border-t border-amber-200 space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-amber-700 text-sm font-semibold">{t("totalPrice")}</span>
              <span className="text-gray-700 text-sm font-bold">{money(totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 text-xs">{t("payToDriver")}</span>
              <span className="text-gray-600 text-xs">{money(driverAmount)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-amber-200">
              <span className="text-amber-700 text-sm font-bold">{t("depositNow")}</span>
              <div className="text-end">
                <span className="block text-amber-700 text-xl font-bold">{money(depositAmount)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
            <span className="text-gray-500 text-sm">{t("totalPrice")}</span>
            <div className="text-end">
              <span className="block text-gray-900 text-xl font-bold">{money(totalPrice)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Wallets, above the card form.
          Apple Pay and Google Pay turn the highest-friction moment of the
          booking — a 16-digit number typed on a phone at an airport — into a
          fingerprint. The element renders nothing at all on a device with no
          wallet available, so the divider below it is held back until
          `onReady` says something was actually drawn; otherwise a lone rule
          would float above the card form on every desktop without one.

          No `emailRequired`: the address is already on the reservation from
          the passenger step, and asking the wallet for it again would put a
          field in front of the one-tap it exists to remove. */}
      <div>
        <ExpressCheckoutElement
          options={{
            buttonHeight: 48,
            // One button per row rather than the row Stripe's own layout
            // packed them into — three brand-coloured buttons sharing a
            // narrow row read as clutter, not as choice.
            layout: { maxColumns: 1 },
            // Link and Amazon Pay dropped: Link's own button sat beside
            // Apple/Google Pay promising the same one-tap speed while
            // asking the customer to create a Link account first, and
            // Amazon Pay has no customer base among the guests this page
            // actually sells to. Apple Pay and Google Pay are the two wallets
            // worth the space.
            paymentMethods: { link: "never", amazonPay: "never" },
          }}
          onReady={({ availablePaymentMethods }) => setWalletsShown(Boolean(availablePaymentMethods))}
          onConfirm={confirmPayment}
        />
        {walletsShown && <div className="mt-5 h-px bg-gray-200" />}
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          {/* The Stripe mark that used to sit here is now part of the badge
              under the form, so it is not claimed twice on one screen. */}
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-gray-500" />
            <span className="text-gray-900 text-sm font-medium">{t("cardDetails")}</span>
          </div>

          {/* Name, email and phone are not asked here: the passenger-info
              step already has them, and a booking is one connected form, not
              two forms that happen to ask the same three questions. `never`
              applies to every payment method shown here, Link included, so
              its own "save my info" prompt has nothing left to ask either —
              without losing Link itself, which a customer with a saved
              wallet may still want to pay with. confirmPayment hands the
              three fields over instead, at confirmation
              (confirmParams.payment_method_data.billing_details above). */}
          {/* Card leads every time; everything else — Bancontact, EPS, Klarna,
              Amazon Pay, whatever the account has on — follows in whatever
              order Stripe judges best for the visitor, and spills into the
              "more" tab once the row runs out of width rather than crowding
              it. This is a positioning decision, not a listing one: nothing
              here is switched off, a card payer just never has to scan past
              five icons to find the one tab that matters to them. */}
          <PaymentElement
            options={{
              layout: "tabs",
              paymentMethodOrder: ["card"],
              fields: { billingDetails: { name: "never", email: "never", phone: "never" } },
            }}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-red-500">⚠</span>
            {error}
          </div>
        )}

        {/* Pay Button */}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full py-4 rounded-xl font-bold text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99]"
          style={{ backgroundColor: "#007AFF" }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t("processing")}
            </>
          ) : isDeposit && depositAmount != null ? (
            <>
              <Lock size={16} />
              {t("depositNow")} · {money(depositAmount)}
            </>
          ) : (
            <>
              <Lock size={16} />
              {t("pay")} · {money(totalPrice)}
            </>
          )}
        </button>

        {/* Every PaymentIntent is created in USD, so a total shown in lira or
            euro is a conversion this page made — the card is charged the
            dollar figure and the customer's own bank picks the rate and adds
            its fee. Without this line the statement shows an amount they
            never agreed to, which is a chargeback waiting to happen. Only
            rendered when the two actually differ. */}
        {isConverted && (
          <p className="text-center text-[11.5px] text-gray-500">
            {t("chargedIn", {
              amount: formatBilling(isDeposit && depositAmount != null ? depositAmount : totalPrice),
            })}
          </p>
        )}
      </form>

      {/* One badge instead of four separately-boxed card logos: it carries the
          Stripe mark and the accepted brands together, so the payment
          processor and the cards are read as a single statement. */}
      <div className="flex justify-center">
        <Image
          src="/images/cards/stripe-secure-payment.png"
          alt="Powered by Stripe — Visa, Mastercard, Maestro, American Express, Discover"
          width={502}
          height={131}
          className="h-auto w-full max-w-[260px] opacity-90"
        />
      </div>

    </div>
  );
}

export default function StripeCheckoutEmbed({ clientSecret, reservationCode, locale, totalPrice, routeLabel, tripType, pickupDate, pickupTime, onSuccess, exchangeRates, isDeposit, depositAmount, driverAmount, customerName, customerEmail, customerPhone }: Props) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
    locale: STRIPE_LOCALES.includes(locale)
      ? (locale as StripeElementsOptions["locale"])
      : undefined,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        reservationCode={reservationCode}
        locale={locale}
        totalPrice={totalPrice}
        routeLabel={routeLabel}
        tripType={tripType}
        pickupDate={pickupDate}
        pickupTime={pickupTime}
        onSuccess={onSuccess}
        exchangeRates={exchangeRates}
        isDeposit={isDeposit}
        depositAmount={depositAmount}
        driverAmount={driverAmount}
        customerName={customerName}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
      />
    </Elements>
  );
}
