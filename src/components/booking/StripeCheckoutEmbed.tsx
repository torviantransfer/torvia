"use client";

import { useState } from "react";
import Image from "next/image";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, Lock, Shield, CreditCard, CheckCircle, MapPin } from "lucide-react";
import { pixelPurchase } from "@/lib/pixel";

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

function CheckoutForm({ reservationCode, locale, totalPrice, regionName, tripType, pickupDate, pickupTime, onSuccess, isDeposit, depositAmount, driverAmount }: Omit<Props, "clientSecret">) {
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

    pixelPurchase(reservationCode, totalPrice, "USD", regionName);
    onSuccess();
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Order Summary Card */}
      <div className={`rounded-xl border p-4 ${isDeposit ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50"}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDeposit ? "bg-amber-500/10" : "bg-blue-500/10"}`}>
            <MapPin size={16} className={isDeposit ? "text-amber-600" : "text-blue-600"} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-sm font-semibold truncate">Antalya Airport → {regionName}</p>
            <p className="text-gray-500 text-xs">
              {tripType === "round_trip" ? "↔ Round Trip" : "→ One Way"} · {pickupDate} · {pickupTime}
            </p>
          </div>
        </div>

        {isDeposit && depositAmount != null && driverAmount != null ? (
          <div className="pt-3 border-t border-amber-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-700 text-sm font-semibold">Total (cash)</span>
              <span className="text-gray-700 text-sm font-bold">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">Pay to driver (cash)</span>
              <span className="text-gray-600 text-xs">${driverAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-amber-200">
              <span className="text-amber-700 text-sm font-bold">Deposit (pay now)</span>
              <span className="text-amber-700 text-xl font-bold">${depositAmount.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <span className="text-gray-500 text-sm">Total</span>
            <span className="text-gray-900 text-xl font-bold">${totalPrice.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          {/* Card info header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-gray-500" />
              <span className="text-gray-900 text-sm font-medium">Card Details</span>
            </div>
            {/* Stripe logo */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 tracking-wide">POWERED BY</span>
              <svg width="38" height="16" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M60 12.5C60 5.596 55.228 0 49.333 0H10.667C4.772 0 0 5.596 0 12.5S4.772 25 10.667 25h38.666C55.228 25 60 19.404 60 12.5z" fill="#635BFF"/>
                <path d="M28.736 8.264c0-.927.763-1.284 2.026-1.284 1.812 0 4.1.549 5.912 1.528V3.406C34.811 2.614 33.006 2 30.762 2c-4.413 0-7.345 2.305-7.345 6.153 0 6.001 8.26 5.04 8.26 7.631 0 1.095-.954 1.452-2.289 1.452-1.98 0-4.516-.815-6.525-1.91v5.167C24.945 21.403 27.013 22 29.388 22c4.524 0 7.633-2.238 7.633-6.136-.017-6.477-8.285-5.32-8.285-7.6z" fill="#fff"/>
              </svg>
            </div>
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
              Processing...
            </>
          ) : isDeposit && depositAmount != null ? (
            <>
              <Lock size={16} />
              Pay Deposit ${depositAmount.toFixed(2)}
            </>
          ) : (
            <>
              <Lock size={16} />
              Pay ${totalPrice.toFixed(2)}
            </>
          )}
        </button>
      </form>

      {/* Card brand logos */}
      <div className="flex items-center justify-center gap-2">
        {[
          { src: "/images/cards/visa.svg", alt: "Visa", w: 54 },
          { src: "/images/cards/mastercard.svg", alt: "Mastercard", w: 46 },
          { src: "/images/cards/amex.svg", alt: "American Express", w: 46 },
          { src: "/images/cards/troy.svg", alt: "Troy", w: 46 },
        ].map((card) => (
          <div
            key={card.alt}
            className="h-8 rounded-md border border-gray-200 bg-white overflow-hidden flex items-center justify-center"
            style={{ width: card.w }}
          >
            <Image
              src={card.src}
              alt={card.alt}
              width={card.w}
              height={32}
              className="object-contain w-full h-full"
            />
          </div>
        ))}
      </div>

      {/* Security trust row */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <Shield size={13} className="text-emerald-500" />
          <span className="text-[10px] text-gray-500 font-medium">SSL</span>
        </div>
        <div className="w-px h-3 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <CheckCircle size={13} className="text-emerald-500" />
          <span className="text-[10px] text-gray-500 font-medium">PCI DSS</span>
        </div>
        <div className="w-px h-3 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <Lock size={13} className="text-emerald-500" />
          <span className="text-[10px] text-gray-500 font-medium">3D Secure</span>
        </div>
      </div>
    </div>
  );
}

export default function StripeCheckoutEmbed({ clientSecret, reservationCode, locale, totalPrice, regionName, tripType, pickupDate, pickupTime, onSuccess, isDeposit, depositAmount, driverAmount }: Props) {
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
        isDeposit={isDeposit}
        depositAmount={depositAmount}
        driverAmount={driverAmount}
      />
    </Elements>
  );
}
