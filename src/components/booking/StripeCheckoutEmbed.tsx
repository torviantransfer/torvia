"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCurrency } from "@/hooks/useCurrency";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
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
const STRIPE_LOCALES = ["tr", "en", "de", "pl", "ru", "nl"];

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Props {
  clientSecret: string;
  reservationCode: string;
  locale: string;
  totalPrice: number;
  regionName: string;
  tripType: string;
  pickupDate: string;
  pickupTime: string;
  onSuccess: () => void;
  /** Needed to show the summary in the visitor's currency, not raw dollars. */
  exchangeRates: Record<string, number>;
  // Cash deposit fields
  isDeposit?: boolean;
  depositAmount?: number;
  driverAmount?: number;
}

const appearance: StripeElementsOptions["appearance"] = {
  theme: "flat",
  variables: {
    colorPrimary: "#007AFF",
    colorBackground: "#FFFFFF",
    colorText: "#1d1d1f",
    colorTextSecondary: "#6b7280",
    colorDanger: "#ef4444",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
    fontSizeBase: "15px",
    colorIcon: "#6b7280",
  },
  rules: {
    ".Input": {
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      boxShadow: "none",
      padding: "12px 14px",
    },
    ".Input:focus": {
      border: "1px solid #007AFF",
      boxShadow: "0 0 0 1px #007AFF",
    },
    ".Label": {
      color: "#374151",
      fontSize: "13px",
      fontWeight: "500",
      marginBottom: "6px",
    },
    ".Tab": {
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      color: "#1d1d1f",
    },
    ".Tab--selected": {
      backgroundColor: "#eff6ff",
      border: "1px solid #007AFF",
      color: "#007AFF",
    },
    ".Tab:hover": {
      backgroundColor: "#f3f4f6",
    },
  },
};

function CheckoutForm({ reservationCode, locale, totalPrice, regionName, tripType, pickupDate, pickupTime, onSuccess, exchangeRates, isDeposit, depositAmount, driverAmount }: Omit<Props, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("booking");
  const { format: fmt, formatBilling, isConverted } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const money = (usd: number) => fmt(usd, exchangeRates);
  const formattedDate = (() => {
    try {
      return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(`${pickupDate}T00:00:00`));
    } catch {
      return pickupDate;
    }
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/booking/success?code=${reservationCode}`,
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
            <p className="text-gray-900 text-sm font-semibold truncate">Antalya Airport → {regionName}</p>
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
              <div className="text-right">
                <span className="block text-amber-700 text-xl font-bold">{money(depositAmount)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
            <span className="text-gray-500 text-sm">{t("totalPrice")}</span>
            <div className="text-right">
              <span className="block text-gray-900 text-xl font-bold">{money(totalPrice)}</span>
            </div>
          </div>
        )}
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

          <PaymentElement options={{ layout: "tabs" }} />
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
            {t("chargedInUsd", {
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

export default function StripeCheckoutEmbed({ clientSecret, reservationCode, locale, totalPrice, regionName, tripType, pickupDate, pickupTime, onSuccess, exchangeRates, isDeposit, depositAmount, driverAmount }: Props) {
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
        regionName={regionName}
        tripType={tripType}
        pickupDate={pickupDate}
        pickupTime={pickupTime}
        onSuccess={onSuccess}
        exchangeRates={exchangeRates}
        isDeposit={isDeposit}
        depositAmount={depositAmount}
        driverAmount={driverAmount}
      />
    </Elements>
  );
}
