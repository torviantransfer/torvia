"use client";

import { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import PhoneInput from "react-phone-number-input";
import * as flags from "country-flag-icons/react/3x2";
import "react-phone-number-input/style.css";

const StripeCheckoutEmbed = dynamic(() => import("./StripeCheckoutEmbed"), { ssr: false });
const BookingFormMini = dynamic(() => import("./BookingFormMini"), { ssr: false });

import {
  Plane, MapPin, Calendar, Users, Luggage, ArrowRight, ArrowLeft,
  ArrowLeftRight, Baby, CreditCard, Check, Shield, Loader2, AlertCircle,
  Wind, Wifi, Droplets, Armchair, Plug, Tv, GlassWater, Car, X,
  CalendarCheck, Banknote, Sparkles, Clock, ChevronDown, MessageCircle, Ban,
} from "lucide-react";
import type { PriceCalculation } from "@/types";
import { useCurrency } from "@/hooks/useCurrency";
import { pixelInitiateCheckout, pixelAddPaymentInfo } from "@/lib/pixel";
import { trackPageView, trackBookingStep } from "@/lib/analytics";

interface Props {
  initialRegion?: string;
  initialTrip?: "one_way" | "round_trip";
  initialDate?: string;
  initialTime?: string;
  initialReturnDate?: string;
  initialReturnTime?: string;
  initialFlight?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialLuggage?: number;
}

type Locale = "tr" | "en" | "de" | "pl" | "ru";

interface VehicleOption {
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  max_passengers: number;
  max_luggage: number;
  features: string[];
  sort_order: number;
  oneWayPrice: number;
  roundTripPrice: number | null;
  cashPrice: number | null;
  cashDeposit: number | null;
  cashDriverAmount: number | null;
  calculation: PriceCalculation;
}

interface RegionData {
  id: string;
  slug: string;
  name_en: string;
  name_tr: string;
  name_de: string;
  name_pl: string;
  name_ru: string;
  name_nl: string;
  distance_km: number;
  duration_minutes: number;
  latitude?: number;
  longitude?: number;
}

export default function BookingWizard(props: Props) {
  const t = useTranslations("booking");

  // A region without a date happens when someone arrives via a region page's
  // "Book Now" CTA (which only carries ?region=, no date). Step 1 of the full
  // wizard has no date picker, so landing there left people stuck unable to
  // select a vehicle. Send them to the mini form instead — same widget as the
  // homepage, destination pre-filled — so they can pick a date before the
  // full wizard (which requires one) takes over.
  if (!props.initialRegion || !props.initialDate) {
    return <BookingFormMini presetRegion={props.initialRegion} />;
  }

  return <BookingWizardInner {...props} />;
}
function BookingWizardInner(props: Props) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const { format: fmt } = useCurrency();

  const regionSlug = props.initialRegion!;
  const tripType = props.initialTrip ?? "one_way";
  const pickupDate = props.initialDate ?? "";
  const pickupTime = props.initialTime ?? "12:00";
  const returnDate = props.initialReturnDate ?? "";
  const returnTime = props.initialReturnTime ?? "";
  const [adults, setAdults] = useState(props.initialAdults ?? 2);
  const [children, setChildren] = useState(props.initialChildren ?? 0);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [regionData, setRegionData] = useState<RegionData | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });
  const [settingsData, setSettingsData] = useState<{ childSeatFee: number; cashPaymentEnabled: boolean; onlineDiscountPercent: number }>({ childSeatFee: 10, cashPaymentEnabled: false, onlineDiscountPercent: 0 });
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [flightCode, setFlightCode] = useState(props.initialFlight ?? "");
  const [hotelName, setHotelName] = useState("");
  const [notes, setNotes] = useState("");

  const [luggage, setLuggage] = useState(props.initialLuggage ?? 0);
  const [childSeat, setChildSeat] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  // `couponApplied` is the code we have actually asked the server to price.
  // It used to be a bare boolean flipped by the Apply button, which meant the
  // code was never sent to /api/pricing and no discount could ever appear.
  const [couponApplied, setCouponApplied] = useState<string>("");
  const [couponStatus, setCouponStatus] = useState<
    { applied: boolean; reason?: string } | null
  >(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reservationCode, setReservationCode] = useState<string | null>(null);
  const [reservationTotalPrice, setReservationTotalPrice] = useState<number>(0);
  const [reservationDepositAmount, setReservationDepositAmount] = useState<number>(0);
  const [reservationDriverAmount, setReservationDriverAmount] = useState<number>(0);
  const [dateAvailable, setDateAvailable] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [suggestedDates, setSuggestedDates] = useState<string[]>([]);
  const [suggestedVehicles, setSuggestedVehicles] = useState<Record<string, { name: string; slug: string; max_passengers: number }[]>>({});

  const totalPrice = useMemo(() => {
    if (!selectedVehicle) return 0;
    const seatFee = childSeat ? settingsData.childSeatFee : 0;
    if (paymentMethod === "cash" && selectedVehicle.cashPrice != null) {
      // Cash price is a fixed per-region override — coupons never apply to it,
      // so leaving that path alone keeps the driver-side math in sync.
      return selectedVehicle.cashPrice + seatFee;
    }
    // Online path: the API returns basePrice as the pre-discount amount and
    // calculation.couponDiscount as the amount subtracted by the coupon. The
    // old code only added seatFee to basePrice, so a valid coupon reduced the
    // charged amount on Stripe but the summary total never moved — the user
    // saw a lie until the payment screen. Subtracting the discount here keeps
    // the summary honest.
    const coupon = couponStatus?.applied ? (selectedVehicle.calculation.couponDiscount || 0) : 0;
    return Math.max(0, selectedVehicle.calculation.basePrice + seatFee - coupon);
  }, [selectedVehicle, childSeat, settingsData, paymentMethod, couponStatus]);

  // ---------------------------------------------------------------------------
  // Step & form persistence
  //
  // The wizard rehydrates its search-linked inputs (region, date, passengers)
  // from `props` because /booking?region=... carries them in the URL. Every
  // other piece of state (step, chosen vehicle, name/email/phone, coupon,
  // Stripe clientSecret) lived only in React memory, so a refresh sent the
  // customer back to step 1 with empty inputs \u2014 a documented drop-off point.
  //
  // We stash the transient state in sessionStorage keyed by the trip signature.
  // A different trip (different region or date) gets its own bucket, so we
  // never leak one booking's answers into another. Restore happens once, only
  // after the vehicles list is loaded, so the categoryId can be resolved to a
  // real object with a live calculation.
  // ---------------------------------------------------------------------------
  const storageKey = useMemo(() => {
    const parts = [
      regionSlug,
      tripType,
      pickupDate || "-",
      pickupTime || "-",
      returnDate || "-",
      returnTime || "-",
      String(props.initialAdults ?? 2),
      String(props.initialChildren ?? 0),
    ];
    return `torvia:booking:${parts.join("|")}`;
  }, [regionSlug, tripType, pickupDate, pickupTime, returnDate, returnTime, props.initialAdults, props.initialChildren]);

  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    if (vehicles.length === 0) return;
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) { restoredRef.current = true; return; }
      const saved = JSON.parse(raw) as Partial<{
        step: number;
        categoryId: string;
        firstName: string; lastName: string; email: string; phone: string;
        flightCode: string; hotelName: string; notes: string;
        luggage: number; adults: number; children: number;
        childSeat: boolean; couponCode: string; couponApplied: string;
        paymentMethod: "online" | "cash";
        clientSecret: string; reservationCode: string;
        reservationTotalPrice: number; reservationDepositAmount: number; reservationDriverAmount: number;
      }>;

      const matchedVehicle = saved.categoryId
        ? vehicles.find((v) => v.categoryId === saved.categoryId)
        : undefined;
      if (matchedVehicle) setSelectedVehicle(matchedVehicle);

      if (saved.firstName !== undefined) setFirstName(saved.firstName);
      if (saved.lastName !== undefined) setLastName(saved.lastName);
      if (saved.email !== undefined) setEmail(saved.email);
      if (saved.phone !== undefined) setPhone(saved.phone);
      if (saved.flightCode !== undefined) setFlightCode(saved.flightCode);
      if (saved.hotelName !== undefined) setHotelName(saved.hotelName);
      if (saved.notes !== undefined) setNotes(saved.notes);
      if (saved.luggage !== undefined) setLuggage(saved.luggage);
      if (saved.adults !== undefined) setAdults(saved.adults);
      if (saved.children !== undefined) setChildren(saved.children);
      if (saved.childSeat !== undefined) setChildSeat(saved.childSeat);
      if (saved.couponCode) setCouponCode(saved.couponCode);
      if (saved.couponApplied) setCouponApplied(saved.couponApplied);
      if (saved.paymentMethod) setPaymentMethod(saved.paymentMethod);

      // Only restore step 3 if we still have the Stripe handle. Otherwise fall
      // back to step 2 (form filled in) so the customer can re-submit and get
      // a fresh PaymentIntent \u2014 stripe clientSecret can expire and returning
      // the customer to an empty payment form is worse than dropping a step.
      if (saved.step === 3 && saved.clientSecret && saved.reservationCode) {
        setClientSecret(saved.clientSecret);
        setReservationCode(saved.reservationCode);
        setReservationTotalPrice(saved.reservationTotalPrice ?? 0);
        setReservationDepositAmount(saved.reservationDepositAmount ?? 0);
        setReservationDriverAmount(saved.reservationDriverAmount ?? 0);
        setStep(3);
      } else if ((saved.step === 2 || saved.step === 3) && matchedVehicle) {
        setStep(2);
      }
    } catch { /* corrupt payload \u2014 ignore, treat as no saved state */ }
    restoredRef.current = true;
  }, [vehicles, storageKey]);

  useEffect(() => {
    if (!restoredRef.current) return;
    if (typeof window === "undefined") return;
    const payload = {
      step,
      categoryId: selectedVehicle?.categoryId,
      firstName, lastName, email, phone,
      flightCode, hotelName, notes,
      luggage, adults, children,
      childSeat, couponCode, couponApplied,
      paymentMethod,
      clientSecret, reservationCode,
      reservationTotalPrice, reservationDepositAmount, reservationDriverAmount,
    };
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
    } catch { /* quota / private mode \u2014 the refresh case degrades gracefully */ }
  }, [
    storageKey, step, selectedVehicle,
    firstName, lastName, email, phone,
    flightCode, hotelName, notes,
    luggage, adults, children,
    childSeat, couponCode, couponApplied,
    paymentMethod,
    clientSecret, reservationCode,
    reservationTotalPrice, reservationDepositAmount, reservationDriverAmount,
  ]);

  const getRegionName = (r: RegionData) => {
    const name = r[`name_${locale}`] || r.name_en;
    // Slug-based display name overrides (e.g. "kundu-lara" shows as "Kundu")
    if (r.slug === "kundu-lara") return "Kundu";
    return name;
  };

  // Correct coordinates for regions that have wrong data in DB
  const COORD_OVERRIDES: Record<string, { latitude: number; longitude: number }> = {
    "kundu-lara": { latitude: 36.8570, longitude: 30.8643 },
    "kundu": { latitude: 36.8648, longitude: 30.9278 },
    "lara": { latitude: 36.8493, longitude: 30.8007 },
    "belek": { latitude: 36.8572, longitude: 30.9878 },
    "side": { latitude: 36.7683, longitude: 31.3860 },
    "manavgat": { latitude: 36.7862, longitude: 31.4339 },
    "konyaalti": { latitude: 36.8857, longitude: 30.6337 },
  };

  useEffect(() => {
    const params = new URLSearchParams({ region: regionSlug, trip: tripType, time: pickupTime });
    if (couponApplied) params.set("coupon", couponApplied);
    fetch(`/api/pricing?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setCouponStatus(data.coupon ?? null);
        if (data.vehicles) {
          setVehicles(data.vehicles);
          // A vehicle picked before a coupon (or before any pricing refetch)
          // holds a *stale* calculation object — the old totals with coupon=0.
          // Re-point selectedVehicle at the matching row in the fresh list so
          // the sidebar reads the new couponDiscount / totalPrice.
          setSelectedVehicle((prev) => {
            if (!prev) return prev;
            const fresh = (data.vehicles as VehicleOption[]).find(
              (v) => v.categoryId === prev.categoryId,
            );
            return fresh ?? prev;
          });
          const region = data.region;
          if (region && COORD_OVERRIDES[region.slug]) {
            setRegionData({ ...region, ...COORD_OVERRIDES[region.slug] });
          } else {
            setRegionData(region);
          }
          setExchangeRates(data.exchangeRates);
          if (data.settings) {
            setSettingsData({
              childSeatFee: data.settings.childSeatFee ?? 10,
              cashPaymentEnabled: data.settings.cashPaymentEnabled ?? false,
              onlineDiscountPercent: 0,
            });
          }
        }
      })
      .catch(() => setError(t("errorNetwork")))
      .finally(() => setLoading(false));
  }, [regionSlug, tripType, pickupTime, couponApplied, t]);

  // Check date availability
  useEffect(() => {
    if (!pickupDate) { setDateAvailable(true); setCheckingAvailability(false); return; }
    setCheckingAvailability(true);
    const from = pickupDate;
    const toDate = new Date(pickupDate + "T00:00:00");
    toDate.setDate(toDate.getDate() + 60);
    const to = toDate.toISOString().split("T")[0];
    const params = new URLSearchParams({ from, to, checkDate: pickupDate, region: regionSlug });
    fetch(`/api/availability?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.isAvailable === "boolean") {
          setDateAvailable(data.isAvailable);
          setSuggestedDates(data.suggestedDates ?? []);
          setSuggestedVehicles(data.suggestedVehicles ?? {});
        }
      })
      .catch(() => { setDateAvailable(true); })
      .finally(() => setCheckingAvailability(false));
  }, [pickupDate]);
  useEffect(() => {
    trackPageView({
      region: regionSlug,
      metadata: { tripType, pickupDate, pickupTime, route: "/booking" },
    });
  }, [regionSlug, tripType, pickupDate, pickupTime]);

  useEffect(() => {
    if (step === 3 && clientSecret) {
      trackBookingStep("payment_page_view", {
        region: regionSlug,
        metadata: { totalPrice, tripType },
      });
    }
  }, [step, clientSecret, regionSlug, totalPrice, tripType]);

  /**
   * How many seats and bags the customer needs.
   *
   * The party size used to be asked for on step 2 — after a vehicle was
   * already chosen — and the counters there clamp to the chosen vehicle's
   * capacity. So a family of eight could pick a five-seater, then find the
   * "+" button simply stopped responding at five with no explanation. Asking
   * first, and marking which vehicles fit, is what stops that.
   */
  const partySize = adults + children;

  const vehicleFit = (vehicle: VehicleOption) => {
    const seatsShort = vehicle.max_passengers < partySize;
    const bagsShort = vehicle.max_luggage < luggage;
    return {
      fits: !seatsShort && !bagsShort,
      // Seats are the harder constraint, so when both are short the seat
      // message is the one worth showing.
      reason: seatsShort
        ? t("capacityTooSmall", { count: partySize })
        : bagsShort
          ? t("luggageTooSmall", { count: luggage })
          : null,
    };
  };

  const anyVehicleFits = vehicles.some((v) => vehicleFit(v).fits);

  const selectVehicle = (vehicle: VehicleOption) => {
    if (!pickupDate) { setError(t("errorSelectDate")); return; }
    if (!dateAvailable) { setError(t("dateUnavailable")); return; }
    // The card for a vehicle that cannot take the party is rendered disabled,
    // but guard here too so a stale click or a keyboard activation cannot slip
    // an over-capacity booking through.
    if (!vehicleFit(vehicle).fits) return;
    setSelectedVehicle(vehicle);
    pixelInitiateCheckout(vehicle.oneWayPrice);
    trackBookingStep("vehicle_selected", {
      region: regionSlug,
      metadata: { vehicle: vehicle.slug, price: vehicle.oneWayPrice },
    });
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    setError(null);
    if (!pickupDate) { setError(t("errorSelectDate")); return; }
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) { setError(t("errorFillRequired")); return; }
    if (!selectedVehicle) return;
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionSlug, categorySlug: selectedVehicle.slug, tripType, pickupDate, pickupTime,
          returnDate: tripType === "round_trip" ? returnDate : undefined,
          returnTime: tripType === "round_trip" ? returnTime : undefined,
          flightCode: flightCode || undefined, adults, children, luggage,
          childSeat,
          firstName, lastName, email, phone, hotelName: hotelName || undefined,
          notes: notes || undefined, couponCode: couponStatus?.applied ? couponApplied : undefined, locale,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Show first field-level error if available, otherwise show generic error
        if (data.details) {
          const firstField = Object.keys(data.details)[0];
          const firstMsg = firstField && data.details[firstField]?.[0];
          if (firstMsg?.includes("future") || firstField === "pickupDate") {
            setError("Seçilen tarih/saat geçmişte kalmış. Lütfen ilerleyen bir saat seçin.");
          } else {
            setError(firstMsg ? `${firstField}: ${firstMsg}` : (data.error ?? t("errorGeneric")));
          }
        } else {
          setError(data.error ?? t("errorGeneric"));
        }
        return;
      }
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setReservationCode(data.reservationCode);
        setReservationTotalPrice(data.reservation?.totalPrice ?? 0);
        setReservationDepositAmount(data.reservation?.depositAmount ?? 0);
        setReservationDriverAmount(data.reservation?.driverAmount ?? 0);
        pixelAddPaymentInfo(selectedVehicle.oneWayPrice);
        trackBookingStep("checkout_initiated", {
          region: regionSlug,
          metadata: {
            vehicle: selectedVehicle.slug,
            totalPrice: selectedVehicle.oneWayPrice,
            adults,
            children,
            luggage,
          },
        });
        setStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch { setError(t("errorNetwork")); }
    finally { isSubmittingRef.current = false; setSubmitting(false); }
  };

  const goBack = () => { setError(null); if (step === 2) { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); } };

  const featureIcon: Record<string, React.ReactNode> = {
    ac: <Wind size={13} />, wifi: <Wifi size={13} />, water: <Droplets size={13} />,
    leather: <Armchair size={13} />, usb: <Plug size={13} />, tv: <Tv size={13} />, minibar: <GlassWater size={13} />,
  };
  const featureLabel: Record<string, string> = {
    ac: t("featureAc"), wifi: t("featureWifi"), water: t("featureWater"),
    leather: t("featureLeather"), usb: t("featureUsb"), tv: t("featureTv"), minibar: t("featureMinibar"),
  };
  const vehicleDesc = (slug: string, fallback: string | null) => {
    const key = `vehicleDesc${slug.charAt(0).toUpperCase() + slug.slice(1)}` as never;
    try { const v = t(key); return v !== key ? v : (fallback ?? ""); } catch { return fallback ?? ""; }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try { return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr + "T00:00:00")); }
    catch { return dateStr; }
  };

  const stepLabels = [t("step2"), t("step3"), t("step4")];
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Step indicator.

          Phones get a progress line rather than a miniature of the desktop
          stepper. Three pills never fit at that width: labels had to be
          dropped (leaving an unexplained "1 2 3"), shown only for the active
          step (which made the markers slide as you advanced), or pushed under
          the rail as a stray caption. A counter plus the step name reads
          straight away, holds still, and has room for the longest label in
          any language. */}
      <div className="mb-6">
        <div className="sm:hidden">
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 flex-shrink-0">
              {t("stepProgress", { current: step, total: 3 })}
            </span>
            <span className="text-sm font-bold text-gray-900 text-right">{stepLabels[step - 1]}</span>
          </div>
          <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%`, background: "linear-gradient(135deg, #007AFF, #0056CC)" }}
            />
          </div>
        </div>

        {/* Sized to its labels rather than capped at a fixed width: at
            max-w-md the three names were truncated to "Araç S…" / "Yolcu
            Bil…". Fixed-width connectors keep the spacing even. */}
        <div className="hidden sm:flex justify-center">
          <div className="inline-flex items-center px-5 py-3 rounded-2xl" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
            {[1, 2, 3].map((s) => (
              <Fragment key={s}>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all"
                  style={s === step ? { background: "linear-gradient(135deg, #007AFF, #0056CC)", boxShadow: "0 4px 15px rgba(0,122,255,0.3)" } : s < step ? { backgroundColor: "rgba(52,211,153,0.1)" } : {}}
                >
                  <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s < step ? "bg-emerald-500/20 text-emerald-600 ring-1 ring-emerald-500/30" : s === step ? "bg-white/20 text-white" : "bg-gray-50 text-gray-500 ring-1 ring-gray-200"}`}>
                    {s < step ? <Check size={12} strokeWidth={3} /> : s}
                  </div>
                  <span className={`text-xs font-semibold whitespace-nowrap ${s < step ? "text-emerald-600" : s === step ? "text-white" : "text-gray-500"}`}>
                    {stepLabels[s - 1]}
                  </span>
                </div>
                {s < 3 && <div className={`h-px w-8 mx-2 flex-shrink-0 ${s < step ? "bg-emerald-500/40" : "bg-gray-200"}`} />}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Route summary — the two stops read as a journey (pin rail + stacked
          names) instead of one dense line where the route, date and distance
          all competed at the same weight. Trip type, distance and duration sit
          underneath as separate chips.

          The map that used to follow this was removed: on a fixed
          airport-to-resort transfer it did not inform the decision, it pushed
          the vehicle choices below the fold on phones, and its live OSRM
          distance contradicted the figure shown here. */}
      {regionData && step === 1 && (
        <div className="mb-8 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          <div className="flex gap-3 px-4 py-3.5" style={{ backgroundColor: "#FFFFFF" }}>
            {/* Pin rail */}
            <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="w-px flex-1 min-h-[18px] my-1 bg-gray-200" />
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-2.5">
              <div>
                <p className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">Antalya Airport</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(pickupDate)} · {pickupTime}</p>
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">{getRegionName(regionData)}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 py-2.5" style={{ backgroundColor: "rgba(0,0,0,0.02)", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            {tripType === "round_trip" && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full" style={{ border: "1px solid rgba(37,99,235,0.2)" }}>
                <ArrowLeftRight size={11} />{t("roundTrip")}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-white px-2 py-1 rounded-full" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <MapPin size={11} className="text-blue-600" />{regionData.distance_km} km
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-white px-2 py-1 rounded-full" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
              <Clock size={11} className="text-blue-600" />~{regionData.duration_minutes} min
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-lg text-red-600 flex items-center gap-2 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle size={16} />{error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {/* STEP 1: Vehicle Selection */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Car size={22} className="text-blue-600" />{t("step2")}
          </h2>

          {/* Date unavailability warning */}
          {!dateAvailable && (
            <div className="mb-4 flex items-center gap-3 px-4 py-4 rounded-2xl" style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fee2e2" }}>
                <AlertCircle size={18} className="text-red-500" strokeWidth={2} />
              </div>
              <div>
                <p className="font-semibold text-red-800 text-sm">{t("dateUnavailable")}</p>
                <p className="text-xs text-red-500 mt-0.5 font-medium">{formatDate(pickupDate)}</p>
              </div>
            </div>
          )}

          {/* Suggested dates */}
          {!dateAvailable && suggestedDates.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CalendarCheck size={13} className="text-emerald-600" />
                {t("suggestedDates")}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedDates.map((date) => (
                  <a
                    key={date}
                    href={`?region=${regionSlug}&trip=${tripType}&date=${date}&time=${pickupTime}&adults=${adults}&children=${children}${returnDate ? `&returnDate=${returnDate}&returnTime=${returnTime}` : ""}`}
                    className="inline-flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all hover:shadow-sm group"
                    style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
                  >
                    <p className="text-sm font-semibold text-emerald-800">{formatDate(date)}</p>
                    <ArrowRight size={14} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                ))}
              </div>
            </div>
          )}
          {/* ── Party size, asked before the vehicle list ──
              Three steppers rather than dropdowns: on a phone a stepper is one
              tap per person and never opens a picker over the page. The same
              adults/children/luggage state drives step 2, so nothing is asked
              twice. */}
          <div className="mb-5 rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}>
            <div className="flex items-start gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Users size={14} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900 leading-tight">{t("partySizeTitle")}</h3>
                <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{t("partySizeDesc")}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {([
                { label: t("adults"), icon: <Users size={13} />, value: adults, set: setAdults, min: 1, max: 20 },
                { label: t("children"), icon: <Baby size={13} />, value: children, set: setChildren, min: 0, max: 10 },
                { label: t("luggage"), icon: <Luggage size={13} />, value: luggage, set: setLuggage, min: 0, max: 20 },
              ] as const).map(({ label, icon, value, set, min, max }) => (
                <div key={label} className="rounded-xl px-2 py-2.5 sm:px-3" style={{ backgroundColor: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <span className="text-blue-600">{icon}</span>
                    <span className="truncate">{label}</span>
                  </span>
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      aria-label={`${label} −`}
                      onClick={() => set((v: number) => Math.max(min, v - 1))}
                      className="w-9 h-9 rounded-lg bg-white text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50 active:bg-blue-100 disabled:opacity-40"
                      style={{ border: "1px solid rgba(0,0,0,0.1)" }}
                      disabled={value <= min}
                    >−</button>
                    <span className="text-base font-bold text-gray-900 tabular-nums">{value}</span>
                    <button
                      type="button"
                      aria-label={`${label} +`}
                      onClick={() => set((v: number) => Math.min(max, v + 1))}
                      className="w-9 h-9 rounded-lg bg-white text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50 active:bg-blue-100 disabled:opacity-40"
                      style={{ border: "1px solid rgba(0,0,0,0.1)" }}
                      disabled={value >= max}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Every vehicle is too small. Without this the customer is left
              staring at a list where nothing can be clicked and no reason is
              given — a dead end on the page that takes the booking. */}
          {!loading && vehicles.length > 0 && !anyVehicleFits && (
            <div className="mb-5 rounded-2xl p-4 sm:p-5" style={{ backgroundColor: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-amber-900 leading-relaxed">{t("noVehicleFits")}</p>
                  <a
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "905469407955"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <MessageCircle size={14} />
                    {t("noVehicleFitsCta")}
                  </a>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
              <p className="text-sm text-gray-500">{t("processing")}</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-20">
              <AlertCircle size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">{t("errorGeneric")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicles.map((vehicle) => {
                const { fits, reason } = vehicleFit(vehicle);
                return (
                /* A vehicle that cannot take the party stays on the page,
                   faded and unselectable, carrying the reason. Hiding it
                   instead would leave the customer wondering where the cheap
                   option went; greying it out without a reason is worse still,
                   because the obvious read is that the site is broken. */
                <div key={vehicle.categoryId} className={`group rounded-2xl overflow-hidden transition-all ${fits ? "hover:shadow-lg" : "opacity-60 saturate-50"}`} style={{ backgroundColor: "#FFFFFF", border: fits ? "1px solid rgba(0,0,0,0.08)" : "1px dashed rgba(0,0,0,0.16)" }}>
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-[300px] h-64 sm:h-auto sm:min-h-[220px] bg-gray-50 flex-shrink-0 overflow-hidden">
                      <Image src={vehicle.image_url || "/images/vehicles/mercedes-vito-vip.png"} alt={vehicle.name} fill className={`object-contain p-3 sm:p-4 transition-transform duration-300 ${fits ? "group-hover:scale-105" : "grayscale"}`} sizes="(max-width: 768px) 100vw, 300px" />
                    </div>
                    {/* Name → capacity → price → CTA, then the extras behind a
                        disclosure. Previously the feature chips and trust
                        badges sat between the capacity and the price at the
                        same visual weight, so on a phone the price and the
                        button — the two things the customer is actually here
                        to act on — were pushed below a wall of small text. */}
                    <div className="flex-1 p-5 sm:p-6 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-900">{vehicle.name}</h3>
                      {vehicle.description && <p className="text-sm text-gray-500 mt-0.5">{vehicleDesc(vehicle.slug, vehicle.description)}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600"><Users size={15} className="text-blue-600" />{vehicle.max_passengers} {t("passengers")}</span>
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600"><Luggage size={15} className="text-blue-600" />{vehicle.max_luggage} {t("luggageCapacity")}</span>
                        {reason && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800" style={{ border: "1px solid rgba(245,158,11,0.3)" }}>
                            <Ban size={11} className="flex-shrink-0" />
                            {reason}
                          </span>
                        )}
                      </div>

                      {/* ── Price + CTA ── */}
                      <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">{t("payOnline")}</span>
                              {vehicle.calculation.roundTripDiscount > 0 && (
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap" style={{ border: "1px solid rgba(16,163,74,0.25)" }}>
                                  {t("roundTripDiscount")} −{fmt(vehicle.calculation.roundTripDiscount, exchangeRates)}
                                </span>
                              )}
                            </div>
                            <span className="block text-[28px] leading-none font-black text-gray-900 tracking-tight">
                              {fmt(vehicle.calculation.basePrice, exchangeRates)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => selectVehicle(vehicle)}
                            disabled={checkingAvailability || !fits}
                            title={reason ?? undefined}
                            className={`w-full sm:w-auto flex-shrink-0 px-4 sm:px-5 py-3 sm:py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                              fits
                                ? "bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-md shadow-blue-600/20 hover:shadow-blue-600/30"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {!fits ? <Ban size={15} /> : checkingAvailability ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                            {t("selectVehicle")}
                          </button>
                        </div>

                        {/* Cash option — a separate lane so it reads as an
                            alternative rather than a second, competing price. */}
                        {vehicle.cashPrice != null && settingsData.cashPaymentEnabled && (
                          <div className="flex items-center justify-between gap-2 mt-3 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                            <span className="text-[11px] font-medium text-amber-700">{t("payAtVehicle")}</span>
                            <span className="text-[13px] font-bold text-amber-700">{fmt(vehicle.cashPrice, exchangeRates)}</span>
                          </div>
                        )}
                      </div>

                      {/* Features + trust, collapsed by default */}
                      <details className="group/d mt-3">
                        <summary className="flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium text-gray-500 hover:text-gray-700 cursor-pointer list-none transition-colors">
                          {t("vehicleFeatures")}
                          <ChevronDown size={13} className="transition-transform group-open/d:rotate-180" />
                        </summary>
                        {/* Features only.
                            "Secure payment / free cancellation / 24-7 support"
                            used to sit here too, but they describe the company,
                            not the vehicle — identical text repeated inside
                            every card in the list, and repeated again in the
                            summary card one step later. They now appear once,
                            beside the total the customer is about to pay. This
                            disclosure is for what actually differs between
                            vehicles. */}
                        <div className="pt-2.5" style={{ borderTop: "1px dashed rgba(0,0,0,0.08)" }}>
                          {vehicle.features.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {vehicle.features.map((f) => (
                                <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-gray-600" style={{ backgroundColor: "rgba(0,0,0,0.04)" }}>
                                  <span className="text-blue-600">{featureIcon[f] ?? <Check size={11} />}</span>
                                  {featureLabel[f] || f}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* STEP 2: Passenger Info + Extras
           Order swap on mobile: the summary card comes FIRST so the customer
           sees vehicle + price before deciding to fill in the form. On desktop
           we restore the historical form-left / summary-right layout. */}
      {step === 2 && selectedVehicle && (
        <div className="grid lg:grid-cols-3 gap-5 lg:gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="rounded-2xl p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
              {/* Grouped into contact / trip / extras. Everything used to run
                  together as one flat list of eight unrelated fields, so there
                  was nothing telling the customer how much was left or which
                  answers belonged together.

                  There is no card title above these: the step indicator already
                  reads "Passenger Info", and repeating it here put two
                  Users-icon headings directly on top of each other. */}
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 pb-1">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Users size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{t("contactSection")}</h3>
                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{t("contactSectionDesc")}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("firstName")} *</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-4 py-2.5 sm:py-3 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("lastName")} *</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-4 py-2.5 sm:py-3 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("email")} *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 sm:py-3 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("phone")} *</label>
                    <PhoneInput international defaultCountry="TR" value={phone} onChange={(val) => setPhone(val ?? "")} placeholder={t("placeholderPhone")}
                      className="phone-input-dark w-full px-4 py-2.5 sm:py-3 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }}
                      flagComponent={({ country, countryName }) => {
                        const Flag = flags[country as keyof typeof flags];
                        return Flag ? <Flag title={countryName} style={{ width: 24, height: 16, borderRadius: 2, display: "block", flexShrink: 0 }} /> : <span style={{ fontSize: 12, color: "#86868b" }}>{country}</span>;
                      }}
                    />
                  </div>
                </div>
                {/* ── Trip details ── */}
                <div className="flex items-center gap-2.5 pt-3 pb-1" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Plane size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">{t("tripSection")}</h3>
                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{t("tripSectionDesc")}</p>
                  </div>
                </div>

                {/* Passenger + Luggage counters
                     Buttons are 40px on mobile (Apple/Google recommended touch
                     target) and taper to the previous 28px on desktop where
                     hover replaces tap. Row switches from a cramped 3-col grid
                     to a card-per-row layout below sm so labels never truncate. */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Adults */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-1.5 px-4 sm:px-0 py-2 sm:py-0 rounded-xl sm:rounded-none" style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                      <span className="text-xs text-gray-500 font-medium">{t("adult")}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" aria-label={`${t("adult")} -`} onClick={() => setAdults((v) => Math.max(1, v - 1))} className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50 active:bg-blue-100 bg-white sm:bg-transparent" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>−</button>
                        <span className="text-base font-bold text-gray-900 w-5 text-center">{adults}</span>
                        <button type="button" aria-label={`${t("adult")} +`} onClick={() => setAdults((v) => Math.min(selectedVehicle?.max_passengers ?? 8, v + 1))} className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50 active:bg-blue-100 bg-white sm:bg-transparent" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>+</button>
                      </div>
                    </div>
                    {/* Children */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-1.5 px-4 sm:px-0 py-2 sm:py-0 rounded-xl sm:rounded-none" style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                      <span className="text-xs text-gray-500 font-medium">{t("child")}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" aria-label={`${t("child")} -`} onClick={() => setChildren((v) => Math.max(0, v - 1))} className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50 active:bg-blue-100 bg-white sm:bg-transparent" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>−</button>
                        <span className="text-base font-bold text-gray-900 w-5 text-center">{children}</span>
                        <button type="button" aria-label={`${t("child")} +`} onClick={() => setChildren((v) => Math.min(6, v + 1))} className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50 active:bg-blue-100 bg-white sm:bg-transparent" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>+</button>
                      </div>
                    </div>
                    {/* Luggage */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-1.5 px-4 sm:px-0 py-2 sm:py-0 rounded-xl sm:rounded-none" style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                      <span className="text-xs text-gray-500 font-medium">{t("luggageCapacity")}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" aria-label={`${t("luggageCapacity")} -`} onClick={() => setLuggage((v) => Math.max(0, v - 1))} className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50 active:bg-blue-100 bg-white sm:bg-transparent" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>−</button>
                        <span className="text-base font-bold text-gray-900 w-5 text-center">{luggage}</span>
                        <button type="button" aria-label={`${t("luggageCapacity")} +`} onClick={() => setLuggage((v) => Math.min(selectedVehicle?.max_luggage ?? 10, v + 1))} className="w-10 h-10 sm:w-7 sm:h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50 active:bg-blue-100 bg-white sm:bg-transparent" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("flightCode")} <span className="text-gray-400 text-xs">({t("optional")})</span></label>
                    <div className="relative">
                      <Plane size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={flightCode} onChange={(e) => setFlightCode(e.target.value.toUpperCase())} placeholder={t("flightCodePlaceholder")} className="w-full pl-10 pr-3 py-2.5 sm:py-3 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("selectHotel")} <span className="text-gray-400 text-xs">({t("optional")})</span></label>
                    <input type="text" value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder={t("placeholderHotel")} className="w-full px-4 py-2.5 sm:py-3 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("notes")} <span className="text-gray-400 text-xs">({t("optional")})</span></label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t("notesPlaceholder")} className="w-full px-4 py-2.5 sm:py-3 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }} />
                </div>

                {/* ── Extras ── */}
                <div className="pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={14} className="text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">{t("extras")}</h3>
                  </div>
                  <label className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-colors gap-3" style={{ backgroundColor: childSeat ? "rgba(0,122,255,0.04)" : "#FFFFFF", border: childSeat ? "1px solid rgba(0,122,255,0.2)" : "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Baby size={20} className="text-gray-700 flex-shrink-0" />
                      <div className="min-w-0"><p className="font-medium text-gray-900 text-sm">{t("childSeat")}</p><p className="text-xs text-gray-500">{t("childSeatNeeded")}</p></div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Was hardcoded as "+$10" — it stayed in dollars even
                          when every other price on the page was in lira. */}
                      <span className="text-sm font-semibold text-blue-600">+{fmt(settingsData.childSeatFee, exchangeRates)}</span>
                      <input type="checkbox" checked={childSeat} onChange={(e) => setChildSeat(e.target.checked)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                    </div>
                  </label>
                </div>

                {/* Coupon */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("couponCode")}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        // Editing invalidates the previous verdict; the price
                        // reverts until the new code is checked server-side.
                        setCouponApplied("");
                        setCouponStatus(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && couponCode.trim()) {
                          e.preventDefault();
                          setCouponApplied(couponCode.trim().toUpperCase());
                        }
                      }}
                      placeholder={t("placeholderCoupon")}
                      className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setCouponApplied(couponCode.trim().toUpperCase())}
                      disabled={!couponCode.trim() || couponApplied === couponCode.trim().toUpperCase()}
                      className="px-5 py-2.5 sm:py-3 text-gray-900 text-sm font-medium rounded-lg disabled:opacity-40 transition-all whitespace-nowrap"
                      style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
                    >
                      {t("applyCoupon")}
                    </button>
                  </div>
                  {couponStatus && (
                    <p
                      className="mt-2 text-xs font-medium"
                      style={{ color: couponStatus.applied ? "#16a34a" : "#dc2626" }}
                      role="status"
                    >
                      {couponStatus.applied ? t("couponAppliedSuccess") : t("couponInvalid")}
                    </p>
                  )}
                </div>

                {/* Payment Method Selector */}
                {settingsData.cashPaymentEnabled && (
                  <div className="pt-2 space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t("paymentMethod")}</p>

                    {/* Toggle group */}
                    <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("online")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
                          paymentMethod === "online"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        <CreditCard size={14} />
                        {t("payOnline")}
                      </button>
                      <div style={{ width: 1, backgroundColor: "rgba(0,0,0,0.1)" }} />
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cash")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
                          paymentMethod === "cash"
                            ? "bg-amber-500 text-white"
                            : "bg-white text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        <Banknote size={14} />
                        {t("payAtVehicle")}
                      </button>
                    </div>

                    {/* Description for selected method */}
                    <p className="text-xs text-gray-400 px-0.5">
                      {paymentMethod === "online" ? t("payOnlineDesc") : t("payAtVehicleDesc")}
                    </p>

                    {/* Online savings nudge when cash is selected */}
                    {paymentMethod === "cash" && selectedVehicle?.cashPrice != null && (
                      <p className="text-xs text-blue-600 px-0.5">
                        <Sparkles size={11} className="inline mr-1" />
                        {t("payOnline")}: {fmt(selectedVehicle.calculation.basePrice, exchangeRates)}
                        <span className="text-blue-400 ml-1">({fmt(selectedVehicle.cashPrice - selectedVehicle.calculation.basePrice, exchangeRates)} {t("savings")})</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex flex-row gap-3 pt-4">
                  <button type="button" onClick={goBack} className="px-4 py-3 font-medium rounded-xl text-gray-600 transition-colors flex items-center justify-center gap-1.5 text-sm whitespace-nowrap shrink-0" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
                    <ArrowLeft size={15} />{t("back")}
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={submitting} className={`flex-1 py-3 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 shadow-lg ${paymentMethod === "cash" ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"}`}>
                    {submitting
                      ? (<><Loader2 size={17} className="animate-spin" />{t("processing")}</>)
                      : paymentMethod === "cash"
                        ? (<><Check size={17} />{t("confirmBooking")}</>)
                        : (<><CreditCard size={17} />{t("pay")}</>)}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-24 z-10">
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                {/* Header */}
                <div className="px-5 py-3.5" style={{ background: "linear-gradient(135deg, #007AFF 0%, #0056CC 100%)" }}>
                  <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-widest mb-0.5">{t("orderSummary")}</p>
                  <h3 className="text-sm font-bold text-white">{t("step1")}</h3>
                </div>

                <div className="p-5 space-y-4">
                  {/* Vehicle chip */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-11 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                      <Image src={selectedVehicle.image_url || "/images/vehicles/mercedes-vito-vip.png"} alt={selectedVehicle.name} fill className="object-contain p-1" sizes="64px" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-tight">{selectedVehicle.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {selectedVehicle.max_passengers} {t("passengers")} &middot; {selectedVehicle.max_luggage} {t("luggageCapacity")}
                      </p>
                    </div>
                  </div>

                  {/* Route */}
                  {regionData && (
                    <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <div className="w-px h-4 bg-gray-200" />
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <div className="min-w-0 space-y-1.5">
                          <p className="text-xs font-semibold text-gray-700 truncate">Antalya Airport (AYT)</p>
                          <p className="text-xs font-semibold text-gray-700 truncate">{getRegionName(regionData)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                        <span className="text-[11px] text-gray-500">{formatDate(pickupDate)} · {pickupTime}</span>
                        {tripType === "round_trip" && returnDate && (
                          <span className="text-[11px] text-blue-500 font-medium">↔ {formatDate(returnDate)} · {returnTime}</span>
                        )}
                        <span className="text-[11px] text-gray-500">{adults} {t("adult")}{children > 0 ? ` + ${children} ${t("child")}` : ""}</span>
                        {/* Carried over from the route bar, which only shows on
                            step 1 now that this card repeats the same trip. */}
                        <span className="text-[11px] text-gray-500">{regionData.distance_km} km · ~{regionData.duration_minutes} min</span>
                      </div>
                    </div>
                  )}

                  {/* Price breakdown.
                      Only rendered when there is something to break down. On a
                      plain one-way with no coupon, no child seat and no
                      discount, the single "One Way $40" row was identical to
                      the "Total $40" box directly beneath it, so the card
                      showed the same price twice and read like a mistake. The
                      trip type moved into the total box instead, where it
                      still says what the figure covers. */}
                  {(tripType === "round_trip"
                    || selectedVehicle.calculation.roundTripDiscount > 0
                    || childSeat
                    || (couponStatus?.applied && selectedVehicle.calculation.couponDiscount > 0)) && (
                  <div className="space-y-1.5 pt-1" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{tripType === "round_trip" ? `2 × ${t("oneWay")}` : t("oneWay")}</span>
                      <span className="font-medium text-gray-700">{fmt(tripType === "round_trip" ? selectedVehicle.oneWayPrice * 2 : selectedVehicle.calculation.basePrice, exchangeRates)}</span>
                    </div>
                    {selectedVehicle.calculation.roundTripDiscount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">{t("roundTripDiscount")}</span>
                        <span className="font-semibold text-emerald-500">-{fmt(selectedVehicle.calculation.roundTripDiscount, exchangeRates)}</span>
                      </div>
                    )}
                    {childSeat && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">{t("childSeatFee")}</span>
                        <span className="font-medium text-gray-700">+{fmt(settingsData.childSeatFee, exchangeRates)}</span>
                      </div>
                    )}
                    {couponStatus?.applied && selectedVehicle.calculation.couponDiscount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400 truncate mr-2">
                          {t("couponDiscount")}
                          {couponApplied && <span className="ml-1 text-gray-300">· {couponApplied}</span>}
                        </span>
                        <span className="font-semibold text-emerald-500 whitespace-nowrap">
                          -{fmt(selectedVehicle.calculation.couponDiscount, exchangeRates)}
                        </span>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Total / Deposit box */}
                  {paymentMethod === "cash" && selectedVehicle.cashDeposit != null ? (
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(245,158,11,0.25)" }}>
                      {/* Cash total row */}
                      <div className="flex justify-between items-center px-4 py-2.5 bg-amber-50">
                        <span className="text-xs font-medium text-amber-700">{t("totalPrice")}</span>
                        <div className="text-right">
                          <span className="text-base font-black text-amber-700">{fmt(totalPrice, exchangeRates)}</span>
                        </div>
                      </div>
                      {/* Divider */}
                      <div style={{ height: 1, backgroundColor: "rgba(245,158,11,0.15)" }} />
                      {/* Deposit row */}
                      <div className="flex justify-between items-center px-4 py-2.5 bg-white">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{t("depositNow")}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{t("payOnlineDesc")}</p>
                        </div>
                        <span className="text-lg font-black text-gray-900">{fmt(selectedVehicle.cashDeposit, exchangeRates)}</span>
                      </div>
                      {/* Driver row */}
                      <div className="flex justify-between items-center px-4 py-2.5 bg-gray-50" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                        <p className="text-xs text-gray-500">{t("payToDriver")}</p>
                        <span className="text-sm font-bold text-gray-600">{fmt(selectedVehicle.cashDriverAmount ?? 0, exchangeRates)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl px-4 py-3.5" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.07) 0%, rgba(0,86,204,0.03) 100%)", border: "1px solid rgba(0,122,255,0.14)" }}>
                      <div className="flex justify-between items-center gap-3">
                        <div className="min-w-0">
                          <span className="block text-xs font-semibold text-gray-700">{t("totalPrice")}</span>
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            {tripType === "round_trip" ? t("roundTrip") : t("oneWay")}
                          </span>
                        </div>
                        <span className="text-xl font-black text-blue-600 whitespace-nowrap">{fmt(totalPrice, exchangeRates)}</span>
                      </div>
                    </div>
                  )}

                  {/* Trust badges.
                      These belong here, next to the figure the customer is
                      about to pay — that is where the hesitation is. They used
                      to be three loose grey lines that read as a footnote; the
                      panel gives them enough weight to be reassurance without
                      competing with the total. */}
                  <div className="rounded-xl px-3.5 py-3 space-y-2" style={{ backgroundColor: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.18)" }}>
                    {[
                      { icon: Shield, text: t("trustSecure") },
                      { icon: CalendarCheck, text: t("trustCancel") },
                      { icon: Check, text: t("trustNoHidden") },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-start gap-2 text-[11px] font-medium text-gray-600 leading-snug">
                        <Icon size={13} className="text-emerald-600 flex-shrink-0 mt-px" strokeWidth={2.2} />{text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* STEP 3: Stripe Payment */}
      {/* The embed already lays its own summary and card form out as cards, so
          this wraps them in a heading only — the bordered container it used to
          sit in put a card inside a card. */}
      {step === 3 && clientSecret && (
        <div className="max-w-2xl mx-auto">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1.5">
              <CreditCard size={20} className="text-blue-600" />{t("step4")}
            </h2>
            <p className="text-xs text-gray-500 mb-5">{t("paymentSecureNote")}</p>
            <StripeCheckoutEmbed
              exchangeRates={exchangeRates}
              clientSecret={clientSecret} reservationCode={reservationCode ?? ""} locale={locale}
              totalPrice={reservationTotalPrice} regionName={regionData ? getRegionName(regionData) : regionSlug}
              tripType={tripType} pickupDate={pickupDate} pickupTime={pickupTime}
              isDeposit={paymentMethod === "cash"}
              depositAmount={reservationDepositAmount > 0 ? reservationDepositAmount : undefined}
              driverAmount={reservationDriverAmount > 0 ? reservationDriverAmount : undefined}
              onSuccess={() => {
                // Wipe the persisted wizard state before we leave the page.
                // Without this, coming back to /booking with the same trip
                // signature would resurrect a completed reservation into a
                // fresh session and confuse the customer.
                try { window.sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
                window.location.href = `/${locale}/booking/success?code=${reservationCode}`;
              }}
            />
          </div>
        </div>
      )}

      {/* Back to previous step / booking page */}
      <div className="flex justify-center mt-10 mb-4">
        <button
          type="button"
          onClick={() => {
            if (step > 1) {
              if (step === 3) { setStep(2); }
              else if (step === 2) { setStep(1); }
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.location.href = `/${locale}/booking`;
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          style={{ border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <ArrowLeft size={16} />
          {t("back")}
        </button>
      </div>
    </div>
  );
}