"use client";

import { useState } from "react";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, Shield, CreditCard, CheckCircle, MapPin, Plane } from "lucide-react";

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
}

const appearance: StripeElementsOptions["appearance"] = {
  theme: "night",
  variables: {
    colorPrimary: "#F97316",
    colorBackground: "#1d1d1f",
    colorText: "#f5f5f7",
    colorTextSecondary: "#86868b",
    colorDanger: "#ef4444",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
    fontSizeBase: "15px",
    colorIcon: "#86868b",
  },
  rules: {
    ".Input": {
      backgroundColor: "#2a2a2e",
      border: "1px solid #3a3a3e",
      boxShadow: "none",
      padding: "12px 14px",
    },
    ".Input:focus": {
      border: "1px solid #F97316",
      boxShadow: "0 0 0 1px #F97316",
    },
    ".Label": {
      color: "#6b7280",
      fontSize: "13px",
      fontWeight: "500",
      marginBottom: "6px",
    },
    ".Tab": {
      backgroundColor: "#2a2a2e",
      border: "1px solid #3a3a3e",
      color: "#f5f5f7",
    },
    ".Tab--selected": {
      backgroundColor: "#3a3a3e",
      border: "1px solid #F97316",
      color: "#F97316",
    },
    ".Tab:hover": {
      backgroundColor: "#333338",
    },
  },
};

function CheckoutForm({ reservationCode, locale, totalPrice, regionName, tripType, pickupDate, pickupTime, onSuccess }: Omit<Props, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(submitError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    // Payment succeeded — confirm on server to update status to "paid"
    if (paymentIntent?.id) {
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

    onSuccess();
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Order Summary Card */}
      <div className="rounded-xl border border-[#2a2a2e] bg-[#1a1a1d] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <MapPin size={16} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-sm font-semibold truncate">Antalya Airport → {regionName}</p>
            <p className="text-gray-500 text-xs">
              {tripType === "round_trip" ? "↔ Round Trip" : "→ One Way"} · {pickupDate} · {pickupTime}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2e]">
          <span className="text-gray-500 text-sm">Total</span>
          <span className="text-gray-900 text-xl font-bold">${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-[#2a2a2e] bg-[#1d1d1f] p-5">
          {/* Card info header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-gray-500" />
              <span className="text-gray-900 text-sm font-medium">Card Details</span>
            </div>
            {/* Stripe logo */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#686872] tracking-wide">POWERED BY</span>
              <svg width="38" height="16" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M60 12.5C60 5.596 55.228 0 49.333 0H10.667C4.772 0 0 5.596 0 12.5S4.772 25 10.667 25h38.666C55.228 25 60 19.404 60 12.5z" fill="#635BFF"/>
                <path d="M28.736 8.264c0-.927.763-1.284 2.026-1.284 1.812 0 4.1.549 5.912 1.528V3.406C34.811 2.614 33.006 2 30.762 2c-4.413 0-7.345 2.305-7.345 6.153 0 6.001 8.26 5.04 8.26 7.631 0 1.095-.954 1.452-2.289 1.452-1.98 0-4.516-.815-6.525-1.91v5.167C24.945 21.403 27.013 22 29.388 22c4.524 0 7.633-2.238 7.633-6.136-.017-6.477-8.285-5.32-8.285-7.6z" fill="#fff"/>
              </svg>
            </div>
          </div>

          <PaymentElement options={{ layout: "tabs" }} />
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-red-400">⚠</span>
            {error}
          </div>
        )}

        {/* Pay Button */}
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full py-4 rounded-xl font-bold text-gray-900 text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99]"
          style={{ backgroundColor: "#F97316" }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock size={16} />
              Pay ${totalPrice.toFixed(2)}
            </>
          )}
        </button>
      </form>

      {/* Security Badges */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-[#2a2a2e] bg-[#1a1a1d] py-3 px-2">
          <Shield size={16} className="text-green-500" />
          <span className="text-[10px] text-gray-500 text-center leading-tight">SSL Encrypted</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-[#2a2a2e] bg-[#1a1a1d] py-3 px-2">
          <CheckCircle size={16} className="text-green-500" />
          <span className="text-[10px] text-gray-500 text-center leading-tight">PCI Compliant</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-[#2a2a2e] bg-[#1a1a1d] py-3 px-2">
          <Lock size={16} className="text-green-500" />
          <span className="text-[10px] text-gray-500 text-center leading-tight">3D Secure</span>
        </div>
      </div>

      {/* Card brand logos + trust line */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          {/* Visa */}
          <svg width="36" height="12" viewBox="0 0 48 16" fill="none"><path d="M18.76 1.09l-3.49 13.82h-2.83L15.93 1.09h2.83zm14.18 8.92l1.49-4.1.86 4.1h-2.35zm3.16 4.9h2.62L36.35 1.09h-2.42c-.54 0-1 .32-1.2.8l-4.24 12.02h2.97l.59-1.63h3.62l.34 1.63zm-7.49-4.51c.01-3.65-5.05-3.85-5.01-5.48.01-.5.48-1.02 1.52-1.16.51-.07 1.93-.12 3.53.63l.63-2.94C28.09 1.08 26.59.72 24.72.72c-2.8 0-4.77 1.49-4.79 3.62-.02 1.57 1.4 2.45 2.47 2.98 1.1.54 1.47.88 1.47 1.36-.01.73-.88 1.06-1.7 1.07-1.42.02-2.25-.38-2.91-.69l-.51 2.41c.66.3 1.88.57 3.14.58 2.98 0 4.93-1.47 4.94-3.74zM13.81 1.09L9.38 14.91H6.37L4.19 3.37c-.13-.52-.25-.71-.65-.93C2.88 2.1 1.55 1.8 .37 1.6l.06-.51h4.82c.61 0 1.16.41 1.3 1.12L7.9 9.29l2.94-8.2h2.97z" fill="#6B7280"/></svg>
          {/* Mastercard */}
          <svg width="28" height="18" viewBox="0 0 32 20" fill="none"><circle cx="11.5" cy="10" r="9" fill="#6B7280" opacity="0.6"/><circle cx="20.5" cy="10" r="9" fill="#6B7280" opacity="0.4"/></svg>
          {/* Amex */}
          <div className="text-[9px] font-bold text-[#6B7280] border border-[#3a3a3e] rounded px-1.5 py-0.5">AMEX</div>
        </div>
        <p className="text-[10px] text-gray-500 text-center">
          Your payment is securely processed. We never store your card details.
        </p>
      </div>
    </div>
  );
}

export default function StripeCheckoutEmbed({ clientSecret, reservationCode, locale, totalPrice, regionName, tripType, pickupDate, pickupTime, onSuccess }: Props) {
  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
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
      />
    </Elements>
  );
}
