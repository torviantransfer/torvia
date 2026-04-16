"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import PhoneInput from "react-phone-number-input";
import * as flags from "country-flag-icons/react/3x2";
import "react-phone-number-input/style.css";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });
const StripeCheckoutEmbed = dynamic(() => import("./StripeCheckoutEmbed"), { ssr: false });
const BookingFormMini = dynamic(() => import("./BookingFormMini"), { ssr: false });

import {
  Plane, MapPin, Calendar, Clock, Users, Luggage, ArrowRight, ArrowLeft,
  ArrowLeftRight, Baby, CreditCard, Check, Tag, Shield, Loader2, AlertCircle,
  Wind, Wifi, Droplets, Armchair, Plug, Tv, GlassWater, Car, Headphones, X,
  CalendarCheck,
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
  distance_km: number;
  duration_minutes: number;
  latitude?: number;
  longitude?: number;
}

export default function BookingWizard(props: Props) {
  const t = useTranslations("booking");

  if (!props.initialRegion) {
    return <BookingFormMini />;
  }

  return <BookingWizardInner {...props} />;
}
function BookingWizardInner(props: Props) {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const { format: fmt, otherCurrencies } = useCurrency();

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

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);
  const [regionData, setRegionData] = useState<RegionData | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1 });
  const [settingsData, setSettingsData] = useState<{ childSeatFee: number }>({ childSeatFee: 10 });

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

  const [couponApplied, setCouponApplied] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const [reservationCode, setReservationCode] = useState<string | null>(null);
  const [dateAvailable, setDateAvailable] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [suggestedDates, setSuggestedDates] = useState<string[]>([]);
  const [suggestedVehicles, setSuggestedVehicles] = useState<Record<string, { name: string; slug: string; max_passengers: number }[]>>({});

  const totalPrice = useMemo(() => {
    if (!selectedVehicle) return 0;
    let total = selectedVehicle.calculation.basePrice;
    // roundTripDiscount is informational only — basePrice is already the round trip price
    if (childSeat) total += settingsData.childSeatFee;
    return total;
  }, [selectedVehicle, childSeat, settingsData]);

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
    fetch(`/api/pricing?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.vehicles) {
          setVehicles(data.vehicles);
          const region = data.region;
          if (region && COORD_OVERRIDES[region.slug]) {
            setRegionData({ ...region, ...COORD_OVERRIDES[region.slug] });
          } else {
            setRegionData(region);
          }
          setExchangeRates(data.exchangeRates);
          if (data.settings) setSettingsData(data.settings);
        }
      })
      .catch(() => setError(t("errorNetwork")))
      .finally(() => setLoading(false));
  }, [regionSlug, tripType, pickupTime, t]);

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

  const selectVehicle = (vehicle: VehicleOption) => {
    if (!pickupDate) { setError(t("errorSelectDate")); return; }
    if (!dateAvailable) { setError(t("dateUnavailable")); return; }
    setSelectedVehicle(vehicle);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setError(null);
    if (!pickupDate) { setError(t("errorSelectDate")); return; }
    if (!firstName || !lastName || !email || !phone) { setError(t("errorFillRequired")); return; }
    if (!selectedVehicle) return;
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
          notes: notes || undefined, couponCode: couponApplied ? couponCode : undefined, locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("errorGeneric")); return; }
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setReservationCode(data.reservationCode);
        setStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch { setError(t("errorNetwork")); }
    finally { setSubmitting(false); }
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
      {/* Step indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-0 px-2 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl transition-all"
                style={s === step ? { background: "linear-gradient(135deg, #007AFF, #0056CC)", boxShadow: "0 4px 15px rgba(0,122,255,0.3)" } : s < step ? { backgroundColor: "rgba(52,211,153,0.1)" } : {}}
              >
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${s < step ? "bg-emerald-500/20 text-emerald-600 ring-1 ring-emerald-500/30" : s === step ? "bg-white/20 text-white" : "bg-gray-50 text-gray-500 ring-1 ring-gray-200"}`}>
                  {s < step ? <Check size={12} strokeWidth={3} /> : s}
                </div>
                <span className={`hidden sm:inline text-xs font-semibold ${s < step ? "text-emerald-600" : s === step ? "text-white" : "text-gray-500"}`}>
                  {stepLabels[s - 1]}
                </span>
              </div>
              {s < 3 && <div className="w-3 sm:w-8 flex items-center justify-center"><div className={`w-full h-px ${s < step ? "bg-emerald-500/40" : "bg-gray-200"}`} /></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Route summary bar */}
      {regionData && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 text-sm"><Plane size={15} className="text-blue-600" /><span className="font-medium text-gray-900">Antalya Airport</span></div>
          <ArrowRight size={14} className="text-gray-400" />
          <div className="flex items-center gap-2 text-sm"><MapPin size={15} className="text-emerald-600" /><span className="font-medium text-gray-900">{getRegionName(regionData)}</span></div>
          <span className="text-gray-400 hidden sm:inline">&bull;</span>
          <span className="text-xs text-gray-500 hidden sm:inline">{formatDate(pickupDate)} &middot; {pickupTime}</span>
          {tripType === "round_trip" && (<><span className="text-gray-400 hidden sm:inline">&bull;</span><span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium"><ArrowLeftRight size={12} />{t("roundTrip")}</span></>)}
          <span className="text-gray-400 hidden sm:inline">&bull;</span>
          <span className="text-xs text-gray-500 hidden sm:inline">{regionData.distance_km} km &middot; ~{regionData.duration_minutes} min</span>
        </div>
      )}

      {/* Route map */}
      {regionData && step <= 2 && (
        <div className="mb-8 rounded-xl" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
          <RouteMap destinationLat={regionData.latitude} destinationLng={regionData.longitude} destinationName={getRegionName(regionData)} className="h-[220px] sm:h-[250px]" />
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
              {vehicles.map((vehicle) => (
                <div key={vehicle.categoryId} className="group rounded-2xl overflow-hidden transition-all hover:shadow-lg" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-[300px] h-64 sm:h-auto sm:min-h-[220px] bg-gray-50 flex-shrink-0 overflow-hidden">
                      <Image src={vehicle.image_url || "/images/vehicles/mercedes-vito-vip.png"} alt={vehicle.name} fill className="object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 300px" />
                    </div>
                    <div className="flex-1 p-5 sm:p-6 flex flex-col">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{vehicle.name}</h3>
                        {vehicle.description && <p className="text-sm text-gray-500 mt-0.5">{vehicleDesc(vehicle.slug, vehicle.description)}</p>}
                        <div className="flex flex-wrap gap-3 mt-3 mb-4">
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600"><Users size={15} className="text-blue-600" />{vehicle.max_passengers} {t("passengers")}</span>
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600"><Luggage size={15} className="text-blue-600" />{vehicle.max_luggage} {t("luggageCapacity")}</span>
                        </div>
                        {vehicle.features.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {vehicle.features.map((f) => (
                              <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-gray-600" style={{ backgroundColor: "rgba(0,0,0,0.04)" }}>
                                <span className="text-blue-600">{featureIcon[f] ?? <Check size={11} />}</span>
                                {featureLabel[f] || f}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {[{ icon: <Shield size={12} />, text: t("trustSecure") }, { icon: <Check size={12} />, text: t("trustCancel") }, { icon: <Headphones size={12} />, text: t("seo247") }].map(({ icon, text }) => (
                            <span key={text} className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">{icon} {text}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-end justify-between mt-5 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <div>
                          <p className="text-2xl font-bold text-gray-900">{fmt(vehicle.calculation.basePrice, exchangeRates)}</p>
                          {vehicle.calculation.roundTripDiscount > 0 && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm text-gray-400 line-through">{fmt(vehicle.oneWayPrice * 2, exchangeRates)}</span>
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">-{fmt(vehicle.calculation.roundTripDiscount, exchangeRates)}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                            {otherCurrencies(vehicle.calculation.basePrice, exchangeRates).map((line, i) => (<p key={i}>{line}</p>))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => selectVehicle(vehicle)}
                          disabled={checkingAvailability}
                          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
                        >
                          {checkingAvailability ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                          {t("selectVehicle")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* STEP 2: Passenger Info + Extras */}
      {step === 2 && selectedVehicle && (
        <div className="grid lg:grid-cols-3 gap-5 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="rounded-2xl p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                <Users size={20} className="text-blue-600" />{t("step3")}
              </h2>
              <div className="space-y-5">
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
                {/* Passenger + Luggage counters */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t("passengers")}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Adults */}
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs text-gray-500 font-medium">{t("adult")}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setAdults((v) => Math.max(1, v - 1))} className="w-7 h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>−</button>
                        <span className="text-base font-bold text-gray-900 w-5 text-center">{adults}</span>
                        <button type="button" onClick={() => setAdults((v) => Math.min(selectedVehicle?.max_passengers ?? 8, v + 1))} className="w-7 h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>+</button>
                      </div>
                    </div>
                    {/* Children */}
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs text-gray-500 font-medium">{t("child")}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setChildren((v) => Math.max(0, v - 1))} className="w-7 h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>−</button>
                        <span className="text-base font-bold text-gray-900 w-5 text-center">{children}</span>
                        <button type="button" onClick={() => setChildren((v) => Math.min(6, v + 1))} className="w-7 h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>+</button>
                      </div>
                    </div>
                    {/* Luggage */}
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs text-gray-500 font-medium">{t("luggageCapacity")}</span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setLuggage((v) => Math.max(0, v - 1))} className="w-7 h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>−</button>
                        <span className="text-base font-bold text-gray-900 w-5 text-center">{luggage}</span>
                        <button type="button" onClick={() => setLuggage((v) => Math.min(selectedVehicle?.max_luggage ?? 10, v + 1))} className="w-7 h-7 rounded-lg text-gray-600 font-bold flex items-center justify-center transition-colors hover:bg-blue-50" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>+</button>
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

                {/* Extras */}
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t("extras")}</h3>
                  <label className="flex items-center justify-between p-4 rounded-lg cursor-pointer mb-2 transition-colors gap-3" style={{ backgroundColor: childSeat ? "rgba(0,122,255,0.04)" : "#FFFFFF", border: childSeat ? "1px solid rgba(0,122,255,0.2)" : "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Baby size={20} className="text-gray-700" />
                      <div><p className="font-medium text-gray-900 text-sm">{t("childSeat")}</p><p className="text-xs text-gray-500">{t("childSeatNeeded")}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-blue-600">+${settingsData.childSeatFee}</span>
                      <input type="checkbox" checked={childSeat} onChange={(e) => setChildSeat(e.target.checked)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                    </div>
                  </label>
                </div>

                {/* Coupon */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">{t("couponCode")}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponApplied(false); }} placeholder={t("placeholderCoupon")} className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.08)" }} />
                    <button type="button" onClick={() => setCouponApplied(true)} disabled={!couponCode.trim()} className="px-5 py-2.5 sm:py-3 text-gray-900 text-sm font-medium rounded-lg disabled:opacity-40 transition-all whitespace-nowrap" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>{t("applyCoupon")}</button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button type="button" onClick={goBack} className="flex-1 py-3 font-medium rounded-lg text-gray-600 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                    <ArrowLeft size={16} />{t("back")}
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap disabled:opacity-60 shadow-lg shadow-blue-600/20">
                    {submitting ? (<><Loader2 size={18} className="animate-spin" />{t("processing")}</>) : (<><CreditCard size={18} />{t("pay")}</>)}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 z-10">
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                {/* Header */}
                <div className="px-5 py-3.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "linear-gradient(135deg, #007AFF 0%, #0056CC 100%)" }}>
                  <h3 className="text-sm font-bold text-white">{t("step1")}</h3>
                </div>
                <div className="p-5 space-y-4">
                  {/* Vehicle */}
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(0,122,255,0.04)", border: "1px solid rgba(0,122,255,0.08)" }}>
                    <div className="relative w-14 h-10 flex-shrink-0">
                      <Image src={selectedVehicle.image_url || "/images/vehicles/mercedes-vito-vip.png"} alt={selectedVehicle.name} fill className="object-contain" sizes="56px" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">{selectedVehicle.name}</p>
                      <p className="text-[11px] text-gray-500">{selectedVehicle.max_passengers} {t("passengers")} · {selectedVehicle.max_luggage} {t("luggageCapacity")}</p>
                    </div>
                  </div>

                  {/* Route + Date + Passengers */}
                  <div className="space-y-2.5">
                    {regionData && (
                      <div className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-blue-600" />
                          <div className="w-px h-5 bg-gray-200" />
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">Antalya Airport (AYT)</p>
                          <p className="text-xs font-medium text-gray-700 truncate">{getRegionName(regionData)}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar size={13} className="text-gray-400 flex-shrink-0" />
                      <span>{formatDate(pickupDate)} · {pickupTime}</span>
                    </div>
                    {tripType === "round_trip" && returnDate && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <ArrowLeftRight size={13} className="text-gray-400 flex-shrink-0" />
                        <span>{formatDate(returnDate)} · {returnTime}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Users size={13} className="text-gray-400 flex-shrink-0" />
                      <span>{adults} {t("adult")}{children > 0 ? ` · ${children} ${t("child")}` : ""}</span>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="pt-3 space-y-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">{tripType === "round_trip" ? `2 × ${t("oneWay")}` : t("oneWay")}</span>
                      <span className="font-medium text-gray-800">{fmt(tripType === "round_trip" ? selectedVehicle.oneWayPrice * 2 : selectedVehicle.calculation.basePrice, exchangeRates)}</span>
                    </div>
                    {selectedVehicle.calculation.roundTripDiscount > 0 && (
                      <div className="flex justify-between text-xs"><span className="text-gray-500">{t("roundTripDiscount")}</span><span className="font-medium text-emerald-600">-{fmt(selectedVehicle.calculation.roundTripDiscount, exchangeRates)}</span></div>
                    )}
                    {childSeat && (
                      <div className="flex justify-between text-xs"><span className="text-gray-500">{t("childSeatFee")}</span><span className="font-medium text-blue-600">+{fmt(settingsData.childSeatFee, exchangeRates)}</span></div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="p-3.5 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(0,122,255,0.06) 0%, rgba(0,86,204,0.03) 100%)", border: "1px solid rgba(0,122,255,0.12)" }}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900 text-xs">{t("totalPrice")}</span>
                      <span className="text-lg sm:text-xl font-bold text-blue-600">{fmt(totalPrice, exchangeRates)}</span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-right space-y-0.5">
                      {otherCurrencies(totalPrice, exchangeRates).map((line, i) => (<p key={i} className="text-gray-400">{line}</p>))}
                    </div>
                  </div>

                  {/* Trust badges */}
                  <div className="space-y-1.5">
                    {[
                      { icon: Shield, text: t("trustSecure") },
                      { icon: Check, text: t("trustCancel") },
                      { icon: Check, text: t("trustNoHidden") },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2 text-[11px] text-gray-500">
                        <Icon size={12} className="text-emerald-500 flex-shrink-0" strokeWidth={2.5} />{text}
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
      {step === 3 && clientSecret && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-6 lg:p-8" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <CreditCard size={20} className="text-blue-600" />{t("step4")}
            </h2>
            <p className="text-xs text-gray-500 mb-6">{t("paymentSecureNote")}</p>
            <StripeCheckoutEmbed
              clientSecret={clientSecret} reservationCode={reservationCode ?? ""} locale={locale}
              totalPrice={totalPrice} regionName={regionData ? getRegionName(regionData) : regionSlug}
              tripType={tripType} pickupDate={pickupDate} pickupTime={pickupTime}
              onSuccess={() => { window.location.href = `/${locale}/booking/success?code=${reservationCode}`; }}
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