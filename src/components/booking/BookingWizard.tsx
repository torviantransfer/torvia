"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });
const StripeCheckoutEmbed = dynamic(() => import("./StripeCheckoutEmbed"), { ssr: false });
import {
  Plane,
  MapPin,
  Calendar,
  Clock,
  Users,
  Luggage,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  Baby,
  CreditCard,
  Check,
  Tag,
  Shield,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { PriceCalculation } from "@/types";
import { useCurrency } from "@/hooks/useCurrency";

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

type RegionItem = {
  slug: string;
  name_tr: string;
  name_en: string;
  name_de: string;
  name_pl: string;
  name_ru: string;
  latitude?: number;
  longitude?: number;
};

type Locale = "tr" | "en" | "de" | "pl" | "ru";

export default function BookingWizard(props: Props) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const { format: fmt, otherCurrencies } = useCurrency();

  // ─── Restore persisted state from sessionStorage (survives locale/currency change) ───
  const STORAGE_KEY = "velora_booking_state";

  const getSaved = (): Record<string, unknown> | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Expire after 30 minutes
      if (parsed._ts && Date.now() - parsed._ts > 30 * 60 * 1000) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch { return null; }
  };

  const saved = getSaved();

  const [step, setStep] = useState((saved?.step as number) ?? 1);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reservationCode, setReservationCode] = useState<string | null>(null);

  // Auto-fill today's date & current rounded time
  const getDefaults = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(Math.ceil(now.getMinutes() / 5) * 5 % 60).padStart(2, "0");
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
  };
  const defaults = getDefaults();

  // Step 1:  Transfer details
  const [tripType, setTripType] = useState((saved?.tripType as string as "one_way" | "round_trip") ?? props.initialTrip ?? "one_way");
  const [regionSlug, setRegionSlug] = useState((saved?.regionSlug as string) ?? props.initialRegion ?? "");
  const [pickupDate, setPickupDate] = useState((saved?.pickupDate as string) ?? props.initialDate ?? defaults.date);
  const [pickupTime, setPickupTime] = useState((saved?.pickupTime as string) ?? props.initialTime ?? defaults.time);
  const [returnDate, setReturnDate] = useState((saved?.returnDate as string) ?? props.initialReturnDate ?? "");
  const [returnTime, setReturnTime] = useState((saved?.returnTime as string) ?? props.initialReturnTime ?? "");
  const [flightCode, setFlightCode] = useState((saved?.flightCode as string) ?? props.initialFlight ?? "");
  const [adults, setAdults] = useState((saved?.adults as number) ?? props.initialAdults ?? 2);
  const [children, setChildren] = useState((saved?.children as number) ?? props.initialChildren ?? 0);
  const [luggage, setLuggage] = useState((saved?.luggage as number) ?? props.initialLuggage ?? 2);

  // Dynamic regions from Supabase
  const [regions, setRegions] = useState<RegionItem[]>([]);
  useEffect(() => {
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRegions(data);
      })
      .catch(() => {});
  }, []);

  const getRegionName = (r: RegionItem) => r[`name_${locale}`] || r.name_en;

  const selectedRegion = useMemo(
    () => regions.find((r) => r.slug === regionSlug) ?? null,
    [regions, regionSlug]
  );

  // Step 2: Vehicle & extras
  const [childSeat, setChildSeat] = useState((saved?.childSeat as boolean) ?? false);
  const [welcomeSign, setWelcomeSign] = useState((saved?.welcomeSign as boolean) ?? false);
  const [welcomeName, setWelcomeName] = useState((saved?.welcomeName as string) ?? "");
  const [couponCode, setCouponCode] = useState((saved?.couponCode as string) ?? "");
  const [couponApplied, setCouponApplied] = useState((saved?.couponApplied as boolean) ?? false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState(false);

  // Step 3: Personal info
  const [firstName, setFirstName] = useState((saved?.firstName as string) ?? "");
  const [lastName, setLastName] = useState((saved?.lastName as string) ?? "");
  const [email, setEmail] = useState((saved?.email as string) ?? "");
  const [phone, setPhone] = useState((saved?.phone as string) ?? "");
  const [hotelName, setHotelName] = useState((saved?.hotelName as string) ?? "");
  const [hotelAddress, setHotelAddress] = useState((saved?.hotelAddress as string) ?? "");
  const [notes, setNotes] = useState((saved?.notes as string) ?? "");

  // ─── Persist form state to sessionStorage on every change ───
  useEffect(() => {
    // Don't persist once payment started (step 4)
    if (step >= 4) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        _ts: Date.now(),
        step: Math.min(step, 3), // Never persist step 4
        tripType, regionSlug, pickupDate, pickupTime, returnDate, returnTime,
        flightCode, adults, children, luggage,
        childSeat, welcomeSign, welcomeName, couponCode, couponApplied,
        firstName, lastName, email, phone, hotelName, hotelAddress, notes,
      }));
    } catch { /* storage full or unavailable */ }
  }, [step, tripType, regionSlug, pickupDate, pickupTime, returnDate, returnTime,
      flightCode, adults, children, luggage, childSeat, welcomeSign, welcomeName,
      couponCode, couponApplied, firstName, lastName, email, phone, hotelName,
      hotelAddress, notes]);

  // Price calculation result
  const [priceData, setPriceData] = useState<{
    calculation: PriceCalculation;
    exchangeRates: Record<string, number>;
    region: { duration_minutes: number; distance_km: number };
    couponId: string | null;
    vehicle?: {
      name: string;
      slug: string;
      description: string | null;
      image_url: string | null;
      max_passengers: number;
      max_luggage: number;
      features: string[];
    };
  } | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!regionSlug || !pickupTime) return;
    setPriceLoading(true);
    try {
      const params = new URLSearchParams({
        region: regionSlug,
        trip: tripType,
        time: pickupTime,
        childSeat: childSeat.toString(),
        welcomeSign: welcomeSign.toString(),
      });
      if (couponApplied && couponCode) {
        params.set("coupon", couponCode);
      }
      const res = await fetch(`/api/pricing?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPriceData(data);
      }
    } catch {
      // Silently fail for price preview
    } finally {
      setPriceLoading(false);
    }
  }, [regionSlug, tripType, pickupTime, childSeat, welcomeSign, couponApplied, couponCode]);

  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    setCouponSuccess(false);
    setCouponApplied(true);
    // fetchPrice will be triggered via useEffect
    // Check result after a short delay
    setTimeout(() => {
      if (priceData?.calculation?.couponDiscount && priceData.calculation.couponDiscount > 0) {
        setCouponSuccess(true);
      }
    }, 1500);
  };

  const goNext = () => {
    setError(null);
    if (step === 1) {
      if (!regionSlug || !pickupDate || !pickupTime) {
        setError(t("errorFillRequired"));
        return;
      }
      if (tripType === "round_trip" && (!returnDate || !returnTime)) {
        setError(t("errorFillReturn"));
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => {
    setError(null);
    if (step === 4) return; // Can't go back from payment
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!firstName || !lastName || !email || !phone) {
      setError(t("errorFillRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionSlug,
          tripType,
          pickupDate,
          pickupTime,
          returnDate: tripType === "round_trip" ? returnDate : undefined,
          returnTime: tripType === "round_trip" ? returnTime : undefined,
          flightCode: flightCode || undefined,
          adults,
          children,
          luggage,
          childSeat,
          welcomeSign,
          welcomeName: welcomeSign ? welcomeName : undefined,
          firstName,
          lastName,
          email,
          phone,
          hotelName: hotelName || undefined,
          hotelAddress: hotelAddress || undefined,
          notes: notes || undefined,
          couponCode: couponApplied ? couponCode : undefined,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("errorGeneric"));
        return;
      }

      // Show embedded Stripe checkout on Step 4
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setReservationCode(data.reservationCode);
        setStep(4);
        // Clear saved state — payment in progress
        try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
      }
    } catch {
      setError(t("errorNetwork"));
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s < step
                  ? "bg-green-500 text-white"
                  : s === step
                    ? "bg-orange-500 text-white shadow-lg"
                    : "text-[#555]" + " " + "bg-[#1c1c1e]"
              }`}
            >
              {s < step ? <Check size={18} /> : s}
            </div>
            <span
              className={`hidden sm:inline text-sm font-medium ${
                s === step ? "text-white" : "text-[#555]"
              }`}
            >
              {t(`step${s}`)}
            </span>
            {s < 4 && (
              <div
                className={`w-12 h-0.5 mx-1 ${s < step ? "bg-green-500" : "bg-[#333]"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl p-6 lg:p-8" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {error && (
              <div className="mb-6 p-4 rounded-lg text-red-400 flex items-center gap-2 text-sm" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* STEP 1: Transfer Details */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin size={20} className="text-orange-500" />
                  {t("step1")}
                </h2>

                {/* Trip type */}
                <div className="flex rounded-lg p-1" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                  <button
                    type="button"
                    onClick={() => setTripType("one_way")}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                      tripType === "one_way"
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-[#86868b]"
                    }`}
                  >
                    {t("oneWay")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType("round_trip")}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      tripType === "round_trip"
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-[#86868b]"
                    }`}
                  >
                    <ArrowLeftRight size={14} />
                    {t("roundTrip")}
                  </button>
                </div>

                {/* Pickup */}
                <div>
                  <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                    {t("pickup")}
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Plane size={18} className="text-orange-500" />
                    <span className="text-sm text-white font-medium">
                      Antalya Airport
                    </span>
                  </div>
                </div>

                {/* Dropoff */}
                <div>
                  <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                    {t("dropoff")} *
                  </label>
                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
                    />
                    <select
                      value={regionSlug}
                      onChange={(e) => setRegionSlug(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <option value="">{t("selectRegion")}</option>
                      {regions.map((r) => (
                        <option key={r.slug} value={r.slug}>
                          {getRegionName(r)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                      {t("departureDate")} *
                    </label>
                    <div className="relative">
                      <Calendar
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
                      />
                      <input
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        min={today}
                        required
                        className="w-full pl-10 pr-3 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                      {t("departureTime")} *
                    </label>
                    <div className="relative">
                      <Clock
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
                      />
                      <input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Return date (round trip) */}
                {tripType === "round_trip" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                        {t("returnDate")} *
                      </label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        min={pickupDate || today}
                        required
                        className="w-full px-3 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                        {t("returnTime")} *
                      </label>
                      <input
                        type="time"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                        required
                        className="w-full px-3 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                    </div>
                  </div>
                )}

                {/* Flight code */}
                <div>
                  <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                    {t("flightCode")} <span className="text-[#555] text-xs">({t("optional")})</span>
                  </label>
                  <div className="relative">
                    <Plane
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
                    />
                    <input
                      type="text"
                      value={flightCode}
                      onChange={(e) =>
                        setFlightCode(e.target.value.toUpperCase())
                      }
                      placeholder={t("flightCodePlaceholder")}
                      className="w-full pl-10 pr-3 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>

                {/* Passengers */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                      <Users size={14} className="inline mr-1" />
                      {t("adults")}
                    </label>
                    <select
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="w-full px-3 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                      {t("children")}
                    </label>
                    <select
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value))}
                      className="w-full px-3 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {[0, 1, 2, 3, 4].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                      <Luggage size={14} className="inline mr-1" />
                      {t("luggage")}
                    </label>
                    <select
                      value={luggage}
                      onChange={(e) => setLuggage(Number(e.target.value))}
                      className="w-full px-3 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {t("next")}
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 2: Vehicle & Extras */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield size={20} className="text-orange-500" />
                  {t("step2")}
                </h2>

                {/* Vehicle card */}
                <div className="border-2 border-orange-500 rounded-xl overflow-hidden" style={{ backgroundColor: "rgba(249,115,22,0.06)" }}>
                  {/* Vehicle image */}
                  <div className="relative w-full h-48 bg-gradient-to-b from-[#1a1a1a] to-[#111]">
                    <Image
                      src={priceData?.vehicle?.image_url || "/images/vehicles/mercedes-vito-vip.png"}
                      alt={priceData?.vehicle?.name || "VIP Transfer"}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">
                          {priceData?.vehicle?.name || "VIP"}
                        </span>
                        <h3 className="text-lg font-bold text-white">
                          Mercedes-Benz Vito Tourer
                        </h3>
                        {priceData?.vehicle?.description && (
                          <p className="text-xs text-[#86868b] mt-1">{priceData.vehicle.description}</p>
                        )}
                      </div>
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                        <Check size={16} className="text-white" />
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-[#86868b] mb-4">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> {priceData?.vehicle?.max_passengers ?? 7} {t("passengers")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Luggage size={14} /> {priceData?.vehicle?.max_luggage ?? 7} {t("luggageCapacity")}
                      </span>
                    </div>
                    {/* Features */}
                    {(priceData?.vehicle?.features?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {priceData!.vehicle!.features.map((f) => {
                          const label: Record<string, string> = {
                            ac: "A/C",
                            wifi: "Wi-Fi",
                            water: "Water",
                            leather: "Leather",
                            usb: "USB",
                            tv: "TV",
                            minibar: "Minibar",
                          };
                          const icons: Record<string, string> = {
                            ac: "❄️",
                            wifi: "📶",
                            water: "💧",
                            leather: "🪑",
                            usb: "🔌",
                            tv: "📺",
                            minibar: "🥤",
                          };
                          return (
                            <span
                              key={f}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-white"
                              style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                            >
                              {icons[f] || "✓"} {label[f] || f}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Extras */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#555] uppercase tracking-wide">
                    {t("extras")}
                  </h3>

                  {/* Child seat toggle */}
                  <label className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <Baby
                        size={20}
                        className="text-white"
                      />
                      <div>
                        <p className="font-medium text-white text-sm">
                          {t("childSeat")}
                        </p>
                        <p className="text-xs text-[#555]">
                          {t("childSeatNeeded")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-emerald-400">
                        {t("free")}
                      </span>
                      <input
                        type="checkbox"
                        checked={childSeat}
                        onChange={(e) => setChildSeat(e.target.checked)}
                        className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </label>

                  {/* Welcome sign toggle */}
                  <label className="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <Tag size={20} className="text-white" />
                      <div>
                        <p className="font-medium text-white text-sm">
                          {t("welcomeSign")}
                        </p>
                        <p className="text-xs text-[#555]">
                          {t("welcomeSignDesc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#86868b]">
                        {priceData ? fmt(5, priceData.exchangeRates) : "$5"}
                      </span>
                      <input
                        type="checkbox"
                        checked={welcomeSign}
                        onChange={(e) => setWelcomeSign(e.target.checked)}
                        className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </label>
                  {welcomeSign && (
                    <input
                      type="text"
                      placeholder={t("placeholderWelcomeName")}
                      value={welcomeName}
                      onChange={(e) => setWelcomeName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  )}
                </div>

                {/* Coupon */}
                <div>
                  <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                    {t("couponCode")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponApplied(false);
                      }}
                      placeholder={t("placeholderCoupon")}
                      className="flex-1 px-4 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={!couponCode.trim()}
                      className="px-5 py-3 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    >
                      {t("applyCoupon")}
                    </button>
                  </div>
                  {couponApplied && priceData && !priceLoading && (
                    priceData.calculation.couponDiscount > 0 ? (
                      <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                        <Check size={12} /> {t("couponAppliedSuccess")} (-{fmt(priceData.calculation.couponDiscount, priceData.exchangeRates)})
                      </p>
                    ) : (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {t("couponInvalid")}
                      </p>
                    )
                  )}
                </div>

                {/* Navigation */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex-1 py-3.5 font-medium rounded-lg text-[#86868b] transition-colors flex items-center justify-center gap-2" style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <ArrowLeft size={16} />
                    {t("back")}
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {t("next")}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Personal Info & Payment */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard
                    size={20}
                    className="text-orange-500"
                  />
                  {t("step3")}
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                      {t("firstName")} *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                      {t("lastName")} *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                    {t("email")} *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                    {t("phone")} *
                  </label>
                  <PhoneInput
                    international
                    defaultCountry="TR"
                    value={phone}
                    onChange={(val) => setPhone(val ?? "")}
                    placeholder={t("placeholderPhone")}
                    className="phone-input-dark w-full px-4 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                    {t("selectHotel")}
                  </label>
                  <input
                    type="text"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    placeholder={t("placeholderHotel")}
                    className="w-full px-4 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#86868b] mb-1.5">
                    {t("notes")}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder={t("notesPlaceholder")}
                    className="w-full px-4 py-3 rounded-lg text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                </div>

                {/* Navigation */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex-1 py-3.5 font-medium rounded-lg text-[#86868b] transition-colors flex items-center justify-center gap-2" style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <ArrowLeft size={16} />
                    {t("back")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {t("processing")}
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        {t("pay")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Stripe Payment */}
            {step === 4 && clientSecret && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard size={20} className="text-orange-500" />
                  {t("step4")}
                </h2>
                <StripeCheckoutEmbed
                  clientSecret={clientSecret}
                  reservationCode={reservationCode ?? ""}
                  locale={locale}
                  totalPrice={priceData?.calculation?.totalPrice ?? 0}
                  regionName={selectedRegion ? getRegionName(selectedRegion) : regionSlug}
                  tripType={tripType}
                  pickupDate={pickupDate}
                  pickupTime={pickupTime}
                  onSuccess={() => {
                    window.location.href = `/${locale}/booking/success?code=${reservationCode}`;
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Price Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 z-10 space-y-4">
          {/* Route Map */}
          <div>
            <RouteMap
              destinationLat={selectedRegion?.latitude}
              destinationLng={selectedRegion?.longitude}
              destinationName={selectedRegion ? getRegionName(selectedRegion) : undefined}
              className="h-[220px]"
            />
          </div>

          <div className="rounded-2xl p-6" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-lg font-bold text-white mb-4">
              {t("totalPrice")}
            </h3>

            {priceLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  size={24}
                  className="animate-spin text-[#555]"
                />
              </div>
            ) : priceData ? (
              <div className="space-y-3">
                {/* Region info */}
                <div className="pb-3 border-b border-white/5">
                  <p className="text-sm text-[#86868b]">{t("dropoff")}</p>
                  <p className="font-semibold text-white">
                    {selectedRegion ? getRegionName(selectedRegion) : regionSlug}
                  </p>
                  <p className="text-xs text-[#555] mt-1">
                    ~{priceData.region.duration_minutes} min •{" "}
                    {priceData.region.distance_km} km
                  </p>
                </div>

                {/* Trip type */}
                <div className="flex justify-between text-sm">
                  <span className="text-[#86868b]">
                    {tripType === "round_trip" ? t("roundTrip") : t("oneWay")}
                  </span>
                  <span className="font-medium">
                    {fmt(priceData.calculation.basePrice, priceData.exchangeRates)}
                  </span>
                </div>

                {/* Night surcharge */}
                {priceData.calculation.nightSurcharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868b]">
                      {t("nightSurcharge")}
                    </span>
                    <span className="font-medium text-amber-400">
                      +{fmt(priceData.calculation.nightSurcharge, priceData.exchangeRates)}
                    </span>
                  </div>
                )}

                {/* Welcome sign */}
                {priceData.calculation.welcomeSignFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868b]">
                      {t("welcomeSignFee")}
                    </span>
                    <span className="font-medium">
                      +{fmt(priceData.calculation.welcomeSignFee, priceData.exchangeRates)}
                    </span>
                  </div>
                )}

                {/* Child seat */}
                {childSeat && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868b]">
                      {t("childSeatFee")}
                    </span>
                    <span className="font-medium text-emerald-400">{t("free")}</span>
                  </div>
                )}

                {/* Round trip discount */}
                {priceData.calculation.roundTripDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868b]">
                      {t("roundTripDiscount")}
                    </span>
                    <span className="font-medium text-emerald-400">
                      -{fmt(priceData.calculation.roundTripDiscount, priceData.exchangeRates)}
                    </span>
                  </div>
                )}

                {/* Coupon discount */}
                {priceData.calculation.couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#86868b]">
                      {t("couponDiscount")}
                    </span>
                    <span className="font-medium text-emerald-400">
                      -{fmt(priceData.calculation.couponDiscount, priceData.exchangeRates)}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                  <span className="font-bold text-white">
                    {t("totalPrice")}
                  </span>
                  <span className="text-2xl font-bold text-orange-500">
                    {fmt(priceData.calculation.totalPrice, priceData.exchangeRates)}
                  </span>
                </div>

                {/* Other currency equivalents */}
                <div className="text-xs text-[#555] text-right space-y-0.5">
                  {otherCurrencies(priceData.calculation.totalPrice, priceData.exchangeRates).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#555] text-center py-6">
                {t("selectRegionForPrice")}
              </p>
            )}

            {/* Trust badges */}
            <div className="mt-6 pt-4 border-t border-white/5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-[#86868b]">
                <Shield size={14} className="text-green-500" />
                {t("trustSecure")}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#86868b]">
                <Check size={14} className="text-green-500" />
                {t("trustCancel")}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#86868b]">
                <Check size={14} className="text-green-500" />
                {t("trustNoHidden")}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
