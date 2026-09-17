"use client";

import { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import PhoneInput, { isPossiblePhoneNumber, isValidPhoneNumber, type Country } from "react-phone-number-input";
import * as flags from "country-flag-icons/react/3x2";
import "react-phone-number-input/style.css";
/* Imported outright, not through another dynamic().
   This whole module is already client-only, and the no-date branch below hands
   straight over to this form — so lazily loading it meant the booking page
   fetched one chunk, ran it, and only then discovered it needed a second chunk
   before anything appeared. Two waterfalls to draw the first thing on the page.
   Together they are one import. */
import BookingFormMini, { type MiniRegion } from "./BookingFormMini";
import TripEditor from "./TripEditor";

const StripeCheckoutEmbed = dynamic(() => import("./StripeCheckoutEmbed"), { ssr: false });

import {
  MapPin, Calendar, Users, Luggage, ArrowRight, ArrowLeft,
  ArrowLeftRight, Baby, CreditCard, Check, Loader2, AlertCircle,
  Wind, Wifi, Droplets, Armchair, Plug, Tv, GlassWater, X,
  CalendarCheck, Banknote, Clock, MessageCircle, Ban, ShieldCheck, ChevronDown,
  ChevronLeft, Minus, Plus, Lock, BadgeCheck,
} from "lucide-react";
import type { PriceCalculation } from "@/types";
import { useCurrency } from "@/hooks/useCurrency";
import { pixelInitiateCheckout, pixelAddPaymentInfo, setPixelUserData } from "@/lib/pixel";
import { trackPageView, trackBookingStep } from "@/lib/analytics";

interface Props {
  initialRegion?: string;
  /** Which way the outbound leg runs; see lib/transfer-route. */
  initialDirection?: Direction;
  initialTrip?: "one_way" | "round_trip";
  initialDate?: string;
  initialTime?: string;
  initialReturnDate?: string;
  initialReturnTime?: string;
  initialFlight?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialLuggage?: number;
  /** Destinations read on the server, so the route picker is filled on arrival
   * rather than after a fetch. Only reaches the no-date mini form. */
  initialRegions?: MiniRegion[];
}

import { localePhoneCountries, type Locale } from "@/i18n/config";
// The airport's label and the order of the two stops live in one place, so the
// wizard, the voucher, the emails and the driver panel cannot disagree.
import { airportLabel, normalizeDirection, type Direction } from "@/lib/transfer-route";
import PaymentMethodsStrip from "@/components/PaymentMethodsStrip";

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
  name_ro: string;
  name_ar: string;
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
    return (
      <BookingFormMini
        presetRegion={props.initialRegion}
        initialRegions={props.initialRegions}
      />
    );
  }

  return <BookingWizardInner {...props} />;
}
function BookingWizardInner(props: Props) {
  const t = useTranslations("booking");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const { format: fmt, formatBilling, isConverted } = useCurrency();

  /* The phone field's starting country. Cast because the library names its own
     union for these; the map holds ISO 3166-1 alpha-2 codes, which is exactly
     that union's domain, and keeping the locale config free of a library type
     is worth the cast. */
  const phoneCountry = (localePhoneCountries[locale] ?? "TR") as Country;

  const regionSlug = props.initialRegion!;
  const direction = normalizeDirection(props.initialDirection);
  const startsAtAirport = direction === "airport_to_region";
  const tripType = props.initialTrip ?? "one_way";
  const pickupDate = props.initialDate ?? "";
  const pickupTime = props.initialTime ?? "12:00";
  const returnDate = props.initialReturnDate ?? "";
  const returnTime = props.initialReturnTime ?? "";
  const [adults, setAdults] = useState(props.initialAdults ?? 2);
  const [children, setChildren] = useState(props.initialChildren ?? 0);

  const [step, setStep] = useState(1);
  const [editingTrip, setEditingTrip] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  /**
   * What the reservation we already hold was created from.
   *
   * Submitting always created a fresh reservation and a fresh PaymentIntent,
   * so a customer who stepped back from the payment screen to re-read
   * something and then pressed on again was booked twice — the first row left
   * `pending` for good. Pending rows take no capacity, so nothing was blocked,
   * but the panel showed one person as two and the office chased a booking
   * that had already been paid for under another code. When nothing has
   * changed we go back to the payment we already started instead.
   */
  const bookedSignatureRef = useRef<string | null>(null);
  /* Guards the one-shot `form_started` event. Selecting a vehicle now lands
     the customer on this form immediately, so "reached step 2" no longer says
     anything about intent — only the first keystroke does. The admin live view
     uses it to separate "just arrived at the form" from "actually filling it". */
  const formStartedRef = useRef(false);

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
  const [returnFlightCode, setReturnFlightCode] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [notes, setNotes] = useState("");

  const [luggage, setLuggage] = useState(props.initialLuggage ?? 0);
  /**
   * Which fields are wrong, keyed by field name.
   *
   * Validation used to be a single boolean over four fields that set one
   * message at the top of the page. On a phone the customer is at the bottom
   * of a long form when they press pay, so that message rendered far above
   * the fold: the button appeared to do nothing at all, which reads either as
   * a broken site or — worse, at that moment — as a charge that may have gone
   * through. The error now lives on the field it belongs to, and the first
   * one is scrolled to and focused.
   */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // An empty discount box in front of someone ready to pay invites them to go
  // looking for a code they do not have, and they do not always come back.
  // Behind a link, whoever has one still finds it.
  const [showCoupon, setShowCoupon] = useState(false);
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

  // ---------------------------------------------------------------------------
  // Abandoned-form capture
  //
  // A phone or email typed here and never submitted used to leave no trace —
  // "Devam Et" is what creates a reservation row, so leaving before that point
  // lost the lead entirely. As soon as either field becomes valid, it is sent
  // to /api/booking-leads for the panel's "Yarım Kalan Formlar" list; debounced
  // so it fires once typing settles, not on every keystroke, and re-sent only
  // when the recorded fields actually change. Silent by design: a failure here
  // must never surface to the customer or interrupt the booking.
  // ---------------------------------------------------------------------------
  const leadSentKeyRef = useRef<string>("");
  useEffect(() => {
    if (!restoredRef.current) return;
    const validPhone = phone && isValidPhoneNumber(phone) ? phone : null;
    const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? email.trim() : null;
    if (!validPhone && !validEmail) return;

    const key = JSON.stringify({ validPhone, validEmail, firstName, lastName, regionSlug, pickupDate, pickupTime, adults, children });
    if (key === leadSentKeyRef.current) return;

    const timer = setTimeout(() => {
      leadSentKeyRef.current = key;
      fetch("/api/booking-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: validPhone,
          email: validEmail,
          firstName,
          lastName,
          regionSlug,
          pickupDate,
          pickupTime,
          partySize: adults + children,
          locale,
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [phone, email, firstName, lastName, regionSlug, pickupDate, pickupTime, adults, children, locale]);

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
    // `no-store`: this response carries whatever the panel last saved — the
    // vehicles, their features, the prices — so a cached copy shows an admin
    // an edit that has not taken effect and a customer a price that is gone.
    fetch(`/api/pricing?${params}`, { cache: "no-store" })
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
   * Both come from the search form, through the URL. This step does not ask
   * again — it only marks which vehicles can take them.
   *
   * It matters because the counters on step 2 clamp to the chosen vehicle's
   * capacity: a family of eight that picked a five-seater would find the "+"
   * button simply stop responding at five, with no explanation anywhere.
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

  /**
   * Is the pickup already behind us? Same rule the server applies: the stored
   * time is an Antalya wall clock, and an hour of grace covers the customer who
   * books a transfer for a flight that has just landed.
   *
   * Worth asking here because the search form lets a visitor pick today with a
   * time that has passed — and Turkey runs an hour ahead of most of the markets
   * we advertise in, so "today at noon" can already be gone for someone whose
   * own clock says eleven.
   */
  const pickupIsPast = () => {
    if (!pickupDate) return false;
    const pickup = new Date(`${pickupDate}T${pickupTime}:00+03:00`);
    if (Number.isNaN(pickup.getTime())) return false;
    return pickup.getTime() <= Date.now() - 60 * 60 * 1000;
  };

  const selectVehicle = (vehicle: VehicleOption) => {
    if (!pickupDate) { setError(t("errorSelectDate")); return; }
    if (!dateAvailable) { setError(t("dateUnavailable")); return; }
    /* Said here rather than after the form. The server refuses this booking
       either way, and it used to do so only once the customer had filled in
       every field — which is the most expensive possible moment to find out. */
    if (pickupIsPast()) { setError(t("errorPastDate")); return; }
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
    // Choosing is committing: the list gives way to the form straight away.
    // Nothing is lost by leaving it — the summary card on step 2 repeats the
    // vehicle and the price, and the back arrow returns here with the card
    // still marked, so a customer who wants to compare can.
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markFormStarted = () => {
    if (formStartedRef.current) return;
    formStartedRef.current = true;
    trackBookingStep("form_started", {
      region: regionSlug,
      metadata: { vehicle: selectedVehicle?.slug, price: selectedVehicle?.oneWayPrice },
    });
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;
    setError(null);
    if (!pickupDate) { setError(t("errorSelectDate")); return; }
    if (!selectedVehicle) return;
    /* A restored session can sit on this step long enough for its own pickup
       time to pass. Caught before the request so the answer is instant and in
       the customer's language, rather than a rejection to be translated back. */
    if (pickupIsPast()) { setError(t("errorPastDate")); return; }

    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = t("fieldRequired");
    if (!lastName.trim()) errors.lastName = t("fieldRequired");
    if (!email.trim()) errors.email = t("fieldRequired");
    // Deliberately loose. A stricter pattern rejects real addresses, and the
    // point here is to catch the typo that silently loses the voucher — a
    // missing @ or a bare domain — not to adjudicate RFC 5322.
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.email = t("errorInvalidEmail");
    if (!phone.trim()) errors.phone = t("fieldRequired");
    // "Possible", not "valid": length only. It stops the half-typed number
    // that would leave the driver with no way to reach the customer, without
    // rejecting a real number whose pattern the bundled metadata does not know.
    else if (!isPossiblePhoneNumber(phone)) errors.phone = t("errorInvalidPhone");
    /* Flight number and hotel are asked for but no longer demanded. Both were
       required, and both are answers a customer comparing prices often does not
       have yet: the flight is booked after the transfer is priced, and the hotel
       may still be undecided. A required field they cannot fill is a customer
       who leaves and does not come back. The office collects both later from a
       booking that exists, which is the trade that pays. */
    // Reachable even with the counters clamped: a restored session or a URL
    // carrying ?adults= can seat more people than the vehicle holds.
    if (adults + children > selectedVehicle.max_passengers) {
      errors.party = t("errorCapacityExceeded", { max: selectedVehicle.max_passengers });
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstError(errors);
      return;
    }
    setFieldErrors({});

    const body = {
      regionSlug, categorySlug: selectedVehicle.slug, tripType, direction, pickupDate, pickupTime,
      returnDate: tripType === "round_trip" ? returnDate : undefined,
      returnTime: tripType === "round_trip" ? returnTime : undefined,
      flightCode: flightCode.trim(),
      returnFlightCode: tripType === "round_trip" ? returnFlightCode.trim() : undefined,
      adults, children, luggage,
      childSeat,
      firstName, lastName, email, phone, hotelName: hotelName.trim(),
      notes: notes || undefined, couponCode: couponStatus?.applied ? couponApplied : undefined, locale,
      paymentMethod,
    };

    // Stepped back and pressed on again without changing anything: the
    // reservation and its PaymentIntent are still the right ones, so return to
    // them rather than booking the same trip a second time. See
    // bookedSignatureRef.
    const signature = JSON.stringify(body);
    if (clientSecret && reservationCode && signature === bookedSignatureRef.current) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        /* Nothing the server says reaches the customer verbatim. Its
           messages are English zod strings keyed by the field name, so a
           Russian customer was shown "email: Invalid email" — and `data.error`
           is English prose. Each case is mapped to a translated message, on
           the field itself wherever the server names one. */

        /* A date that filled up, or was closed, between the calendar and this
           submit. It used to land on "Something went wrong", which tells the
           customer nothing they can act on; the date message at least sends
           them back to pick another day, and marking the date unavailable means
           step 1 offers them the alternatives when they get there. */
        if (data.code === "date_full" || data.code === "date_unavailable") {
          setError(t("dateUnavailable"));
          setDateAvailable(false);
          return;
        }
        if (data.code === "capacity_exceeded") {
          const capacityError = {
            party: t("errorCapacityExceeded", { max: data.maxPassengers ?? selectedVehicle.max_passengers }),
          };
          setFieldErrors(capacityError);
          focusFirstError(capacityError);
          return;
        }
        const firstField = data.details ? Object.keys(data.details)[0] : null;
        const firstMsg = firstField ? data.details[firstField]?.[0] : null;
        if (firstField === "pickupDate" || String(firstMsg ?? "").includes("future")) {
          setError(t("errorPastDate"));
        } else if (firstField === "email") {
          const emailError = { email: t("errorInvalidEmail") };
          setFieldErrors(emailError);
          focusFirstError(emailError);
        } else if (firstField && serverFieldLabels[firstField]) {
          const known = {
            [firstField]: t("errorCheckField", { field: serverFieldLabels[firstField] }),
          };
          setFieldErrors(known);
          focusFirstError(known);
        } else {
          setError(t("errorGeneric"));
        }
        return;
      }
      if (data.clientSecret) {
        bookedSignatureRef.current = signature;
        setClientSecret(data.clientSecret);
        setReservationCode(data.reservationCode);
        setReservationTotalPrice(data.reservation?.totalPrice ?? 0);
        setReservationDepositAmount(data.reservation?.depositAmount ?? 0);
        setReservationDriverAmount(data.reservation?.driverAmount ?? 0);
        // The first point in the wizard where we know who the customer is.
        // Awaited because advanced matching only reaches events sent after the
        // pixel is re-initialised — AddPaymentInfo and the Purchase that
        // follows it are the two events worth matching.
        await setPixelUserData({ firstName, lastName, email, phone });
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

  /**
   * Fields in the order they appear, so "the first error" means the first one
   * the customer would reach rather than whichever key the object happened to
   * hold first.
   */
  const FIELD_ORDER = ["firstName", "lastName", "email", "phone", "party", "flightCode", "returnFlightCode", "hotelName"];

  const focusFirstError = (errors: Record<string, string>) => {
    const first = FIELD_ORDER.find((f) => errors[f]);
    if (!first) return;
    const el = document.getElementById(`booking-${first}`);
    if (!el) return;
    // Focus first with the scroll suppressed, then scroll deliberately —
    // focusing during a smooth scroll makes the browser jump to its own idea
    // of the position and fights the animation.
    (el as HTMLElement).focus?.({ preventScroll: true });
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /**
   * The whole-form error, rendered wherever the customer is looking.
   *
   * It used to exist once, at the very top of the wizard. On step 2 the pay
   * button sits at the bottom of a long form, so a refusal from the server — a
   * date gone full while they typed, a pickup time now in the past — was
   * announced a screenful or more above where they had just tapped. What the
   * customer saw was the spinner stop and nothing happen, which is
   * indistinguishable from a broken button, and they left. Step 2 now draws it
   * directly above the buttons instead.
   */
  const errorBanner = (className: string) =>
    error ? (
      <div
        role="alert"
        aria-live="assertive"
        className={`flex items-center gap-2.5 rounded-[14px] bg-[#FFF2F1] px-4 py-3 text-[14px] font-medium text-[#D70015] ring-1 ring-[#FF3B30]/25 ${className}`}
      >
        <AlertCircle size={16} className="flex-shrink-0" />
        <span>{error}</span>
        {/* type="button": inside the step 2 form, a bare button submits it. */}
        <button type="button" onClick={() => setError(null)} className="ms-auto flex-shrink-0">
          <X size={14} />
        </button>
      </div>
    ) : null;

  const clearFieldError = (name: string) =>
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });

  /* One field style for the whole passenger step: every input, the phone
     field and the textarea share height, fill, radius and focus ring.
     `focus-within` rather than `focus` so the phone field — a wrapper round
     its own input — lights up exactly like a plain input. */
  const fieldBase =
    "w-full rounded-[12px] px-3.5 text-[15px] text-[#1d1d1f] placeholder:text-[#a1a1a6] outline-none transition focus-within:bg-white focus-within:ring-2";
  const fieldTone = (name: string) =>
    fieldErrors[name]
      ? "bg-[#FFF2F1] ring-1 ring-[#FF3B30]/50 focus-within:ring-[#FF3B30]/40"
      : "bg-[#F5F5F7] focus-within:ring-[#007AFF]/40";
  const fieldClass = (name: string) => `h-11 ${fieldBase} ${fieldTone(name)}`;
  const labelClass = "mb-1 block text-[13px] font-medium text-[#424245]";
  const groupCard = "rounded-[22px] bg-white p-4 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5";
  const stepperButton =
    "grid size-9 place-items-center rounded-full bg-white text-[#007AFF] ring-1 ring-black/[0.08] transition active:scale-95 disabled:cursor-not-allowed disabled:text-[#c7c7cc]";

  const fieldMessage = (name: string) =>
    fieldErrors[name] ? (
      <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-[12.5px] font-medium text-[#D70015]">
        <AlertCircle size={12} className="mt-px shrink-0" />
        {fieldErrors[name]}
      </p>
    ) : null;

  /** Field names the reservations API can name, in the customer's language. */
  const serverFieldLabels: Record<string, string> = {
    firstName: t("firstName"),
    lastName: t("lastName"),
    email: t("email"),
    phone: t("phone"),
    flightCode: t("flightCode"),
    returnFlightCode: t("returnFlightCode"),
    hotelName: t("selectHotel"),
  };

  /**
   * Seats still free in the chosen vehicle.
   *
   * The two counters used to clamp against separate ceilings — adults against
   * the vehicle's capacity, children against a flat 6 — so eight adults and
   * six children fitted an eight-seat van as far as the form was concerned.
   * Nothing downstream looked at the sum either, so the booking was confirmed
   * and paid and the failure surfaced at the airport, with the driver.
   */
  const seatsLeft = selectedVehicle
    ? selectedVehicle.max_passengers - adults - children
    : Number.POSITIVE_INFINITY;

  const featureIcon: Record<string, React.ReactNode> = {
    ac: <Wind size={13} />, wifi: <Wifi size={13} />, water: <Droplets size={13} />,
    leather: <Armchair size={13} />, usb: <Plug size={13} />, tv: <Tv size={13} />, minibar: <GlassWater size={13} />,
  };
  const featureLabel: Record<string, string> = {
    ac: t("featureAc"), wifi: t("featureWifi"), water: t("featureWater"),
    leather: t("featureLeather"), usb: t("featureUsb"), tv: t("featureTv"), minibar: t("featureMinibar"),
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
            <span className="text-sm font-bold text-gray-900 text-end">{stepLabels[step - 1]}</span>
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
        {/* Same three tokens as everywhere else on this page now — #007AFF for
            the current step, #34C759 for a done one — rather than the
            gradient-and-emerald pairing this used to carry on its own. */}
        <div className="hidden sm:flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F7] p-1.5">
            {[1, 2, 3].map((s) => (
              <Fragment key={s}>
                <div className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 transition-colors ${s === step ? "bg-[#007AFF]" : ""}`}>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    s < step ? "bg-[#34C759] text-white" : s === step ? "bg-white/25 text-white" : "bg-white text-[#86868b] ring-1 ring-black/[0.06]"
                  }`}>
                    {s < step ? <Check size={12} strokeWidth={3} /> : s}
                  </span>
                  <span className={`whitespace-nowrap text-[13px] font-semibold ${s === step ? "text-white" : s < step ? "text-[#1d1d1f]" : "text-[#86868b]"}`}>
                    {stepLabels[s - 1]}
                  </span>
                </div>
                {s < 3 && <div className={`mx-1 h-px w-4 shrink-0 ${s < step ? "bg-[#34C759]/50" : "bg-black/[0.08]"}`} />}
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
        /* No overflow-hidden: the search form opened inside this card has
           dropdowns that must be able to spill past its edge. The chip strip
           rounds its own bottom corners instead, for as long as it is the last
           thing in the card. */
        <div className="mx-auto mb-8 max-w-3xl rounded-[18px] bg-white ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="relative flex gap-3 px-4 py-3.5">
            {/* Edit the trip in place. It used to be a lone "Back" button under
                the whole page that threw away the search and started again; now
                the search opens right here, already filled in with this trip. */}
            <button
              type="button"
              onClick={() => setEditingTrip((v) => !v)}
              aria-expanded={editingTrip}
              className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/[0.08]"
            >
              {t("changeVehicle")}
              <ChevronDown size={15} className={`transition-transform duration-200 ${editingTrip ? "rotate-180" : ""}`} />
            </button>
            {/* Pin rail */}
            <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#007AFF]" />
              <span className="w-px flex-1 min-h-[18px] my-1 bg-gray-200" />
              <span className="w-2 h-2 rounded-full bg-[#34C759]" />
            </div>
            {/* Read in travel order, so a guest being taken to the airport
                sees their hotel first. The date and time belong to whichever
                stop the journey actually starts from. */}
            <div className="flex-1 min-w-0 flex flex-col gap-2.5 pe-24">
              <div>
                <p className="text-[15px] sm:text-base font-semibold text-[#1d1d1f] leading-tight truncate">
                  {startsAtAirport ? airportLabel(locale) : getRegionName(regionData)}
                </p>
                <p className="text-[12.5px] text-[#86868b] mt-0.5">{formatDate(pickupDate)} · {pickupTime}</p>
              </div>
              <div>
                <p className="text-[15px] sm:text-base font-semibold text-[#1d1d1f] leading-tight truncate">
                  {startsAtAirport ? getRegionName(regionData) : airportLabel(locale)}
                </p>
              </div>
            </div>
          </div>
          <div className={`flex flex-wrap gap-1.5 border-t border-black/[0.06] bg-[#FAFAFB] px-4 py-2.5 ${editingTrip ? "" : "rounded-b-[18px]"}`}>
            {tripType === "round_trip" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007AFF]/[0.08] px-2.5 py-1 text-[12px] font-medium text-[#0062CC]">
                <ArrowLeftRight size={13} />{t("roundTrip")}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-[#424245] ring-1 ring-black/[0.06]">
              <Users size={13} className="text-[#86868b]" />{adults + children} {t("passengers")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-[#424245] ring-1 ring-black/[0.06]">
              <MapPin size={13} className="text-[#86868b]" />{regionData.distance_km} km
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-[#424245] ring-1 ring-black/[0.06]">
              <Clock size={13} className="text-[#86868b]" />~{regionData.duration_minutes} {tc("minutes")}
            </span>
          </div>
          {editingTrip && (
            <div className="rounded-b-[18px] border-t border-black/[0.06] p-4">
              <TripEditor
                regionSlug={regionSlug}
                direction={direction}
                date={pickupDate}
                time={pickupTime}
                roundTrip={tripType === "round_trip"}
                returnDate={returnDate}
                returnTime={returnTime}
                adults={adults}
                kids={children}
                roundTripAvailable={props.initialRegions?.find((r) => r.slug === regionSlug)?.has_round_trip !== false}
                onClose={() => setEditingTrip(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* Error — on step 2 it is rendered down beside the pay button instead.
          See errorBanner. */}
      {step !== 2 && errorBanner("mb-6")}
      {/* STEP 1: Vehicle Selection */}
      {/* The bottom padding clears the sticky bar, so the last card can still
          be scrolled into full view once a vehicle is chosen. */}
      {step === 1 && (
        <div className="mx-auto max-w-3xl pb-24">
          <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-[#1d1d1f]">{t("selectVehicle")}</h2>
          <p className="mt-1.5 mb-6 text-[15px] leading-snug text-[#6e6e73]">{t("vehicleStepSubtitle")}</p>

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
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "902426060763"}`}
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
                const chosen = selectedVehicle?.categoryId === vehicle.categoryId;
                const showCash = vehicle.cashPrice != null && settingsData.cashPaymentEnabled;

                return (
                /* A vehicle that cannot take the party stays on the page,
                   faded and unselectable, carrying the reason. Hidden, the
                   customer wonders where the cheaper option went; greyed out
                   without a reason, the obvious read is a broken site.

                   Stacked on a phone, side by side from `sm`: at 390px a row
                   left the photograph 116px wide and squeezed name, specs,
                   chips and price into what was left — the vehicle, the one
                   thing being chosen between, was the smallest thing on the
                   card. */
                <article
                  key={vehicle.categoryId}
                  className={`overflow-hidden rounded-[22px] bg-white transition-shadow duration-200 sm:flex ${
                    !fits
                      ? "opacity-60 ring-1 ring-black/[0.08]"
                      : chosen
                        ? "ring-2 ring-[#007AFF] shadow-[0_14px_34px_-18px_rgba(0,122,255,0.5)]"
                        : "ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_30px_-20px_rgba(0,0,0,0.22)]"
                  }`}
                >
                  {/* The stage: a soft studio sweep the cut-out can sit on,
                      with a shadow under the wheels so it stands rather than
                      floats. `object-contain` — the whole vehicle, never
                      cropped. */}
                  <div className="relative flex aspect-[16/9] items-center justify-center bg-[radial-gradient(120%_95%_at_50%_0%,#FFFFFF_0%,#F5F5F7_55%,#EBEBEE_100%)] sm:aspect-auto sm:w-[270px] sm:shrink-0">
                    <div className="relative h-[80%] w-[86%] sm:h-[140px] sm:w-[230px]">
                      <Image
                        src={vehicle.image_url || "/images/vehicles/mercedes-vito-vip.png"}
                        alt={vehicle.name}
                        fill
                        sizes="(min-width: 640px) 230px, 86vw"
                        className={`object-contain drop-shadow-[0_16px_14px_rgba(0,0,0,0.2)] ${fits ? "" : "grayscale"}`}
                      />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                    <h3 className="text-[19px] font-semibold leading-tight tracking-[-0.02em] text-balance text-[#1d1d1f]">
                      {vehicle.name}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-[#424245]">
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={16} strokeWidth={1.75} className="shrink-0 text-[#86868b]" />
                        1&ndash;{vehicle.max_passengers} {t("passengers")}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Luggage size={16} strokeWidth={1.75} className="shrink-0 text-[#86868b]" />
                        {vehicle.max_luggage} {t("luggageCapacity")}
                      </span>
                    </div>

                    {vehicle.features.length > 0 && (
                      <ul className="mt-3.5 flex flex-wrap gap-1.5">
                        {vehicle.features.map((f) => (
                          <li
                            key={f}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[12px] font-medium text-[#424245]"
                          >
                            <span className="text-[#007AFF]">{featureIcon[f] ?? <Check size={13} />}</span>
                            {featureLabel[f] || f}
                          </li>
                        ))}
                      </ul>
                    )}

                    {(reason || vehicle.calculation.roundTripDiscount > 0) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {reason && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E5] px-2.5 py-1 text-[12px] font-medium text-[#B25E00]">
                            <Ban size={13} className="shrink-0" />{reason}
                          </span>
                        )}
                        {vehicle.calculation.roundTripDiscount > 0 && (
                          <span className="inline-flex items-center rounded-full bg-[#E8F7EE] px-2.5 py-1 text-[12px] font-medium text-[#1E7A43]">
                            {t("roundTripDiscount")} &minus;{fmt(vehicle.calculation.roundTripDiscount, exchangeRates)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price over the button on a phone, beside it from `sm`.
                        A shared row on a phone fought the longest labels —
                        "Dieses Fahrzeug wählen" next to "12.500,00 ₺" does not
                        fit 350px — so the button gets the whole width and one
                        height everywhere: 48px, the same as every primary
                        action in this flow. */}
                    <div aria-hidden="true" className="hidden sm:block sm:flex-1" />
                    <div className="mt-5 flex flex-col gap-3.5 border-t border-black/[0.06] pt-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-[#1d1d1f]">
                          {fmt(vehicle.calculation.basePrice, exchangeRates)}
                        </p>
                        <p className="mt-1.5 text-[12.5px] leading-snug text-[#86868b]">
                          {t("trustFixedPrice")} · {tripType === "round_trip" ? t("roundTrip") : t("oneWay")}
                        </p>
                        {showCash && (
                          <p className="mt-0.5 text-[12.5px] leading-snug text-[#86868b]">
                            {t("payAtVehicle")}: <span className="font-medium text-[#424245]">{fmt(vehicle.cashPrice!, exchangeRates)}</span>
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => selectVehicle(vehicle)}
                        disabled={checkingAvailability || !fits}
                        title={reason ?? undefined}
                        aria-pressed={chosen}
                        className={`flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-[14px] px-6 text-[15px] font-semibold transition sm:w-auto sm:min-w-[190px] ${
                          !fits
                            ? "cursor-not-allowed bg-[#F5F5F7] text-[#86868b]"
                            : "bg-[#007AFF] text-white hover:bg-[#0062CC] active:scale-[0.98] disabled:opacity-60"
                        }`}
                      >
                        {!fits ? <Ban size={16} /> : checkingAvailability ? <Loader2 size={16} className="animate-spin" /> : chosen ? <Check size={16} strokeWidth={2.5} /> : null}
                        {chosen ? t("vehicleSelected") : t("selectThisVehicle")}
                      </button>
                    </div>
                  </div>
                </article>
                );
              })}

              {/* What every price already covers, said once under the list
                  rather than repeated as a chip on every card. */}
              <p className="flex items-start gap-2.5 rounded-[14px] bg-[#F5F5F7] px-4 py-3 text-[13px] leading-snug text-[#424245] sm:items-center sm:justify-center sm:text-center">
                <ShieldCheck size={16} className="shrink-0 text-[#34C759]" />
                {t("allInclusiveNote")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Passenger Info + Extras
           Form left, summary right on desktop. On a phone the summary is a
           collapsed row above the form: it used to be a full card under it,
           reached only after the pay button, which is too late to be of use. */}
      {step === 2 && selectedVehicle && (() => {
        const v = selectedVehicle;
        const cashDepositFlow = paymentMethod === "cash" && v.cashDeposit != null;
        const headlinePrice = cashDepositFlow ? v.cashDeposit! : totalPrice;
        /* Three promises, three lines, no chrome. These used to sit in a white
           card with a ring, a filled icon disc and two pill chips, which gave
           six words more visual weight than the pay button directly beneath
           them. Reassurance should be readable at a glance and then get out of
           the way — the button is what the eye should land on. */
        const trustLines = (
          <ul className="space-y-1.5">
            {[
              [Lock, t("trustSecure")] as const,
              [CalendarCheck, t("trustCancel")] as const,
              [BadgeCheck, t("trustNoHidden")] as const,
            ].map(([Icon, label]) => (
              <li key={label} className="flex items-center gap-2 text-[13px] leading-snug text-[#6e6e73]">
                <Icon size={14} strokeWidth={2.25} className="shrink-0 text-[#248A3D]" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        );

        /* The sidebar sits in a column of cards, so there the same lines keep a
           card around them; above the button they do not. */
        const trustCard = (
          <div className="rounded-[18px] bg-white p-4 ring-1 ring-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {trustLines}
          </div>
        );

        /* The trip and its price, told once and used twice: inside the phone's
           accordion and in the desktop sidebar. */
        const summaryDetails = (
          <div className="space-y-4">
            {regionData && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center pt-1.5">
                  <span className="size-2 rounded-full bg-[#007AFF]" />
                  <span className="my-1 min-h-[18px] w-px flex-1 bg-black/[0.12]" />
                  <span className="size-2 rounded-full bg-[#34C759]" />
                </div>
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div>
                    <p className="truncate text-[15px] font-semibold leading-tight text-[#1d1d1f]">
                      {startsAtAirport ? airportLabel(locale) : getRegionName(regionData)}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-[#86868b]">{formatDate(pickupDate)} · {pickupTime}</p>
                  </div>
                  <p className="truncate text-[15px] font-semibold leading-tight text-[#1d1d1f]">
                    {startsAtAirport ? getRegionName(regionData) : airportLabel(locale)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {tripType === "round_trip" && returnDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007AFF]/[0.08] px-2.5 py-1 text-[12px] font-medium text-[#0062CC]">
                  <ArrowLeftRight size={13} />{formatDate(returnDate)} · {returnTime}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[12px] font-medium text-[#424245]">
                <Users size={13} className="text-[#86868b]" />
                {adults} {t("adult")}{children > 0 ? ` + ${children} ${t("child")}` : ""}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[12px] font-medium text-[#424245]">
                <Luggage size={13} className="text-[#86868b]" />{luggage} {t("luggageCapacity")}
              </span>
              {regionData && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[12px] font-medium text-[#424245]">
                  <Clock size={13} className="text-[#86868b]" />{regionData.distance_km} km · ~{regionData.duration_minutes} {tc("minutes")}
                </span>
              )}
            </div>

            {/* Only broken down when there is something to break down; a single
                row repeating the total read like a mistake. "2 × one way" only
                appears when a discount comes off it — otherwise an unexplained
                gap between a subtotal and the total reads as a hidden fee. */}
            {(tripType === "round_trip" || v.calculation.roundTripDiscount > 0 || childSeat ||
              (couponStatus?.applied && v.calculation.couponDiscount > 0)) && (
              <div className="space-y-2 border-t border-black/[0.06] pt-3.5 text-[13.5px]">
                {(() => {
                  const twoSingles = tripType === "round_trip" && v.calculation.roundTripDiscount > 0;
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-[#6e6e73]">{twoSingles ? `2 × ${t("oneWay")}` : tripType === "round_trip" ? t("roundTrip") : t("oneWay")}</span>
                      <span className="font-medium text-[#1d1d1f]">{fmt(twoSingles ? v.oneWayPrice * 2 : v.calculation.basePrice, exchangeRates)}</span>
                    </div>
                  );
                })()}
                {v.calculation.roundTripDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#6e6e73]">{t("roundTripDiscount")}</span>
                    <span className="font-medium text-[#248A3D]">−{fmt(v.calculation.roundTripDiscount, exchangeRates)}</span>
                  </div>
                )}
                {childSeat && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#6e6e73]">{t("childSeatFee")}</span>
                    <span className="font-medium text-[#1d1d1f]">+{fmt(settingsData.childSeatFee, exchangeRates)}</span>
                  </div>
                )}
                {couponStatus?.applied && v.calculation.couponDiscount > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[#6e6e73]">{t("couponDiscount")}{couponApplied && <span className="text-[#a1a1a6]"> · {couponApplied}</span>}</span>
                    <span className="whitespace-nowrap font-medium text-[#248A3D]">−{fmt(v.calculation.couponDiscount, exchangeRates)}</span>
                  </div>
                )}
              </div>
            )}

            {cashDepositFlow ? (
              <div className="divide-y divide-black/[0.06] overflow-hidden rounded-[14px] bg-[#F5F5F7]">
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-[13.5px] text-[#6e6e73]">{t("totalPrice")}</span>
                  <span className="text-[15px] font-semibold text-[#1d1d1f]">{fmt(totalPrice, exchangeRates)}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-[13.5px] font-medium text-[#1d1d1f]">{t("depositNow")}</span>
                  <span className="text-[17px] font-semibold text-[#1d1d1f]">{fmt(v.cashDeposit!, exchangeRates)}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-[13.5px] text-[#6e6e73]">{t("payToDriver")}</span>
                  <span className="text-[14px] font-medium text-[#424245]">{fmt(v.cashDriverAmount ?? 0, exchangeRates)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-end justify-between border-t border-black/[0.06] pt-3.5">
                <div>
                  <p className="text-[13.5px] font-medium text-[#1d1d1f]">{t("totalPrice")}</p>
                  <p className="text-[12px] text-[#86868b]">{tripType === "round_trip" ? t("roundTrip") : t("oneWay")}</p>
                </div>
                <p className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#1d1d1f]">{fmt(totalPrice, exchangeRates)}</p>
              </div>
            )}

            {/* Said beside the figure the customer decides on, not first at the
                card form: the amount charged is a conversion of this one. */}
            {isConverted && (
              <p className="text-[12px] text-[#86868b]">{t("chargedIn", { amount: formatBilling(headlinePrice) })}</p>
            )}
          </div>
        );

        return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* min-w-0: a grid item is as wide as its widest unbreakable content
              by default, and the truncated vehicle name in the summary row
              pushed every card on this step past the right edge of a phone. */}
          <div className="order-1 min-w-0 lg:col-span-2">
            {/* The one way back from this step. There used to be two: one
                beside the pay button and another under the whole page. */}
            <button
              type="button"
              onClick={goBack}
              className="-ms-2 mb-3 inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[15px] font-medium text-[#007AFF] transition-colors hover:bg-[#007AFF]/[0.08]"
            >
              <ChevronLeft size={20} strokeWidth={2.25} className="rtl:rotate-180" />{stepLabels[0]}
            </button>

            {/* Phone summary: closed by default, since the customer came here
                to fill the form and already agreed to this price one step ago;
                one tap shows the whole trip and the breakdown. */}
            <div className={`mb-5 lg:hidden ${groupCard} !p-0`}>
              <button
                type="button"
                onClick={() => setSummaryOpen((o) => !o)}
                aria-expanded={summaryOpen}
                className="flex w-full items-center gap-3 px-4 py-3 text-start"
              >
                <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[#F5F5F7]">
                  <Image src={v.image_url || "/images/vehicles/mercedes-vito-vip.png"} alt="" fill sizes="56px" className="object-contain p-0.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold leading-tight text-[#1d1d1f]">{v.name}</span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-[#86868b]">{formatDate(pickupDate)} · {pickupTime}</span>
                </span>
                <span className="shrink-0 text-end">
                  <span className="block text-[11px] leading-none text-[#86868b]">{cashDepositFlow ? t("depositNow") : t("totalPrice")}</span>
                  <span className="mt-1 block text-[17px] font-semibold leading-none text-[#1d1d1f]">{fmt(headlinePrice, exchangeRates)}</span>
                </span>
                <ChevronDown size={18} className={`shrink-0 text-[#86868b] transition-transform duration-200 ${summaryOpen ? "rotate-180" : ""}`} />
              </button>
              {summaryOpen && <div className="border-t border-black/[0.06] px-4 pb-4 pt-3.5">{summaryDetails}</div>}
            </div>

            <form
              className="space-y-5"
              noValidate
              onFocusCapture={markFormStarted}
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            >
              {/* ── Contact ── */}
              <section>
                <h3 className="px-1 text-[16px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{t("contactSection")}</h3>
                <p className="mb-2 px-1 text-[13px] text-[#86868b]">{t("contactSectionDesc")}</p>
                <div className={`${groupCard} grid grid-cols-2 gap-x-3 gap-y-3.5`}>
                  <div>
                    <label htmlFor="booking-firstName" className={labelClass}>{t("firstName")}</label>
                    <input id="booking-firstName" type="text" autoComplete="given-name" value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName"); }}
                      aria-invalid={!!fieldErrors.firstName} className={fieldClass("firstName")} />
                    {fieldMessage("firstName")}
                  </div>
                  <div>
                    <label htmlFor="booking-lastName" className={labelClass}>{t("lastName")}</label>
                    <input id="booking-lastName" type="text" autoComplete="family-name" value={lastName}
                      onChange={(e) => { setLastName(e.target.value); clearFieldError("lastName"); }}
                      aria-invalid={!!fieldErrors.lastName} className={fieldClass("lastName")} />
                    {fieldMessage("lastName")}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="booking-email" className={labelClass}>{t("email")}</label>
                    <input id="booking-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                      aria-invalid={!!fieldErrors.email} className={fieldClass("email")} />
                    {fieldMessage("email")}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="booking-phone" className={labelClass}>{t("phone")}</label>
                    {/* Opens on the visitor's own country, guessed from the
                        language they read in. No placeholder: it used to hold our
                        own Antalya landline. */}
                    <PhoneInput international defaultCountry={phoneCountry} value={phone}
                      id="booking-phone"
                      autoComplete="tel"
                      onChange={(val) => { setPhone(val ?? ""); clearFieldError("phone"); }}
                      className={`phone-input-dark ${fieldClass("phone")}`}
                      flagComponent={({ country, countryName }) => {
                        const Flag = flags[country as keyof typeof flags];
                        return Flag ? <Flag title={countryName} style={{ width: 24, height: 16, borderRadius: 3, display: "block", flexShrink: 0 }} /> : <span style={{ fontSize: 12, color: "#86868b" }}>{country}</span>;
                      }}
                    />
                    {fieldMessage("phone")}
                  </div>
                </div>
              </section>

              {/* ── Trip ── */}
              <section>
                <h3 className="mb-2 px-1 text-[16px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{t("tripSection")}</h3>
                <div className={`${groupCard} space-y-3.5`}>
                  <div id="booking-party">
                    <div className="divide-y divide-black/[0.06] rounded-[14px] bg-[#F5F5F7]">
                      {([
                        { key: "adult", label: t("adult"), value: adults, dec: () => setAdults((n) => Math.max(1, n - 1)), inc: () => { if (seatsLeft > 0) { setAdults((n) => n + 1); clearFieldError("party"); } }, decDisabled: adults <= 1, incDisabled: seatsLeft <= 0 },
                        { key: "child", label: t("child"), value: children, dec: () => setChildren((n) => Math.max(0, n - 1)), inc: () => { if (seatsLeft > 0) { setChildren((n) => Math.min(6, n + 1)); clearFieldError("party"); } }, decDisabled: children <= 0, incDisabled: seatsLeft <= 0 || children >= 6 },
                        { key: "luggage", label: t("luggageCapacity"), value: luggage, dec: () => setLuggage((n) => Math.max(0, n - 1)), inc: () => setLuggage((n) => Math.min(v.max_luggage ?? 10, n + 1)), decDisabled: luggage <= 0, incDisabled: luggage >= (v.max_luggage ?? 10) },
                      ]).map((row) => (
                        <div key={row.key} className="flex items-center justify-between px-3.5 py-2">
                          <span className="text-[15px] text-[#1d1d1f]">{row.label}</span>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={row.dec} disabled={row.decDisabled} aria-label={`${row.label} −`} className={stepperButton}><Minus size={16} strokeWidth={2.25} /></button>
                            <span className="w-6 text-center text-[16px] font-semibold tabular-nums text-[#1d1d1f]">{row.value}</span>
                            <button type="button" onClick={row.inc} disabled={row.incDisabled} aria-label={`${row.label} +`} className={stepperButton}><Plus size={16} strokeWidth={2.25} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {fieldMessage("party")}
                    {/* Said before the customer runs into a dead "+", not after. */}
                    {!fieldErrors.party && seatsLeft <= 0 && (
                      <p className="mt-2 px-1 text-[12.5px] text-[#86868b]">{t("errorCapacityExceeded", { max: v.max_passengers })}</p>
                    )}
                  </div>

                  {/* Said once for the fields below rather than as a tag and a
                      hint on each: a customer who does not have a flight number
                      yet must still see that they can carry on without one. */}
                  <p className="border-t border-black/[0.06] px-0.5 pt-3.5 text-[12.5px] text-[#86868b]">{t("canSendLater")}</p>
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="booking-flightCode" className={labelClass}>{t("flightCode")}</label>
                      <input id="booking-flightCode" type="text" autoCapitalize="characters" spellCheck={false} value={flightCode}
                        onChange={(e) => { setFlightCode(e.target.value.toUpperCase()); clearFieldError("flightCode"); }}
                        placeholder={t("flightCodePlaceholder")} aria-invalid={!!fieldErrors.flightCode} className={fieldClass("flightCode")} />
                      {fieldMessage("flightCode")}
                    </div>

                    {/* Round trip only; the return flight lets the office catch a
                        pickup time that would miss it. */}
                    {tripType === "round_trip" && (
                      <div>
                        <label htmlFor="booking-returnFlightCode" className={labelClass}>{t("returnFlightCode")}</label>
                        <input id="booking-returnFlightCode" type="text" autoCapitalize="characters" spellCheck={false} value={returnFlightCode}
                          onChange={(e) => { setReturnFlightCode(e.target.value.toUpperCase()); clearFieldError("returnFlightCode"); }}
                          placeholder={t("returnFlightCodePlaceholder")} aria-invalid={!!fieldErrors.returnFlightCode} className={fieldClass("returnFlightCode")} />
                        {fieldMessage("returnFlightCode")}
                      </div>
                    )}

                    <div className={tripType === "round_trip" ? "sm:col-span-2" : ""}>
                      <label htmlFor="booking-hotelName" className={labelClass}>{t("selectHotel")}</label>
                      <input id="booking-hotelName" type="text" value={hotelName}
                        onChange={(e) => { setHotelName(e.target.value); clearFieldError("hotelName"); }}
                        placeholder={t("placeholderHotel")} aria-invalid={!!fieldErrors.hotelName} className={fieldClass("hotelName")} />
                      {fieldMessage("hotelName")}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="booking-notes" className={labelClass}>{t("notes")}</label>
                    <textarea id="booking-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={t("notesPlaceholder")}
                      className={`${fieldBase} ${fieldTone("notes")} resize-none py-3`} />
                  </div>
                </div>
              </section>

              {/* ── Extras ── */}
              <section>
                <h3 className="mb-2.5 px-1 text-[16px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{t("extras")}</h3>
                <div className={`${groupCard} !p-0 divide-y divide-black/[0.06]`}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#F5F5F7] text-[#424245]"><Baby size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] text-[#1d1d1f]">{t("childSeat")}</span>
                      <span className="block text-[12.5px] text-[#86868b]">+{fmt(settingsData.childSeatFee, exchangeRates)}</span>
                    </span>
                    <input type="checkbox" checked={childSeat} onChange={(e) => setChildSeat(e.target.checked)} className="peer sr-only" />
                    <span className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-[#E9E9EB] transition-colors peer-checked:bg-[#34C759] peer-focus-visible:ring-2 peer-focus-visible:ring-[#007AFF]/40 after:absolute after:start-[2px] after:top-[2px] after:size-[27px] after:rounded-full after:bg-white after:shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)] after:transition-transform peer-checked:after:translate-x-[20px] rtl:peer-checked:after:-translate-x-[20px]" />
                  </label>

                  <div className="px-4 py-3 sm:px-5">
                    {!showCoupon && !couponCode ? (
                      <button type="button" onClick={() => setShowCoupon(true)} className="text-[15px] font-medium text-[#007AFF]">
                        {t("haveCoupon")}
                      </button>
                    ) : (
                      <div>
                        <label htmlFor="booking-coupon" className={labelClass}>{t("couponCode")}</label>
                        <div className="flex gap-2">
                          <input
                            id="booking-coupon"
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
                            className={`${fieldClass("coupon")} min-w-0 flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() => setCouponApplied(couponCode.trim().toUpperCase())}
                            disabled={!couponCode.trim() || couponApplied === couponCode.trim().toUpperCase()}
                            className="h-11 shrink-0 rounded-[12px] bg-[#007AFF]/[0.1] px-4 text-[15px] font-semibold text-[#007AFF] transition disabled:opacity-40"
                          >
                            {t("applyCoupon")}
                          </button>
                        </div>
                        {couponStatus && (
                          <p role="status" className={`mt-2 text-[12.5px] font-medium ${couponStatus.applied ? "text-[#248A3D]" : "text-[#D70015]"}`}>
                            {couponStatus.applied ? t("couponAppliedSuccess") : t("couponInvalid")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ── Payment method ──
                  Options stacked, each with its own line of explanation and
                  price. Side by side they were two buttons sharing half a phone
                  each, and "Betalen in het voertuig" does not fit half a phone. */}
              {settingsData.cashPaymentEnabled && (
                <section>
                  <h3 className="mb-2.5 px-1 text-[16px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">{t("paymentMethod")}</h3>
                  <div role="radiogroup" aria-label={t("paymentMethod")} className={`${groupCard} !p-0 divide-y divide-black/[0.06]`}>
                    {([
                      { key: "online" as const, icon: CreditCard, title: t("payOnline"), desc: t("payOnlineDesc"), price: v.calculation.basePrice },
                      { key: "cash" as const, icon: Banknote, title: t("payAtVehicle"), desc: t("payAtVehicleDesc"), price: v.cashPrice },
                    ]).map((o) => {
                      const on = paymentMethod === o.key;
                      const Icon = o.icon;
                      return (
                        <button
                          key={o.key}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setPaymentMethod(o.key)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-start sm:px-5"
                        >
                          <span className={`grid size-9 shrink-0 place-items-center rounded-[10px] ${on ? "bg-[#007AFF]/[0.1] text-[#007AFF]" : "bg-[#F5F5F7] text-[#86868b]"}`}><Icon size={18} /></span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-medium text-[#1d1d1f]">{o.title}</span>
                            <span className="block text-[12.5px] leading-snug text-[#86868b]">{o.desc}</span>
                          </span>
                          {o.price != null && <span className="shrink-0 text-[15px] font-semibold text-[#1d1d1f]">{fmt(o.price, exchangeRates)}</span>}
                          <span className={`grid size-[22px] shrink-0 place-items-center rounded-full ${on ? "bg-[#007AFF] text-white" : "ring-[1.5px] ring-inset ring-[#c7c7cc]"}`}>
                            {on && <Check size={14} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Why a deposit at all, said the moment cash is chosen —
                      not buried in the FAQ. Without this the button below just
                      says "Pay Deposit", which invites the question it never
                      answers: what is this charge and do I get it back. */}
                  {paymentMethod === "cash" && v.cashDeposit != null && (
                    <div className="mt-3 flex items-start gap-3 rounded-[14px] bg-[#F0F7FF] p-3.5">
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#007AFF]/[0.12] text-[#007AFF]">
                        <ShieldCheck size={15} strokeWidth={2.25} />
                      </span>
                      <p className="text-[13px] leading-relaxed text-[#1d1d1f]">{t("depositExplanation")}</p>
                    </div>
                  )}
                </section>
              )}

              {errorBanner("")}

              {/* Reassurance directly above the button that asks for the card —
                  hesitation happens before the press. On desktop the sidebar
                  already carries it, so this is phones only. */}
              <div className="rounded-[14px] bg-[#F5F5F7] px-4 py-3.5 lg:hidden">{trustLines}</div>

              {/* Pay-at-vehicle still takes a card for the deposit, so the label
                  says so: an unannounced card form is where trust goes. */}
              <button
                type="submit"
                disabled={submitting}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#007AFF] px-5 text-[16px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(0,122,255,0.6)] transition hover:bg-[#0062CC] active:scale-[0.99] disabled:opacity-60"
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin" />{t("processing")}</>
                ) : (
                  <>
                    <Lock size={16} strokeWidth={2.25} />
                    <span className="truncate">
                      {paymentMethod === "cash" ? (v.cashDeposit != null ? t("payDepositAndConfirm") : t("confirmBooking")) : t("pay")}
                    </span>
                    <span className="opacity-60">·</span>
                    <span>{fmt(headlinePrice, exchangeRates)}</span>
                  </>
                )}
              </button>

              {/* Under the button, not inside the trust card: the logos answer
                  "can I pay the way I pay" at the moment of the press, and
                  boxing them in with the cancellation and fee promises made
                  that card carry two unrelated jobs at once. */}
              <div className="flex justify-center pt-1">
                <PaymentMethodsStrip maxWidth={380} />
              </div>
            </form>
          </div>

          {/* Desktop sidebar: the same summary, beside the form the whole time. */}
          <aside className="order-2 hidden lg:col-span-1 lg:block">
            <div className="sticky top-24 space-y-3">
              <div className={groupCard}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-[10px] bg-[#F5F5F7]">
                    <Image src={v.image_url || "/images/vehicles/mercedes-vito-vip.png"} alt={v.name} fill sizes="64px" className="object-contain p-1" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-[#86868b]">{t("orderSummary")}</p>
                    <p className="truncate text-[15px] font-semibold text-[#1d1d1f]">{v.name}</p>
                  </div>
                </div>
                {summaryDetails}
              </div>
              {trustCard}
            </div>
          </aside>
        </div>
        );
      })()}
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
              totalPrice={reservationTotalPrice}
              routeLabel={
                regionData
                  ? `${startsAtAirport ? airportLabel(locale) : getRegionName(regionData)} → ${startsAtAirport ? getRegionName(regionData) : airportLabel(locale)}`
                  : regionSlug
              }
              tripType={tripType} pickupDate={pickupDate} pickupTime={pickupTime}
              isDeposit={paymentMethod === "cash"}
              depositAmount={reservationDepositAmount > 0 ? reservationDepositAmount : undefined}
              driverAmount={reservationDriverAmount > 0 ? reservationDriverAmount : undefined}
              customerName={`${firstName} ${lastName}`.trim()}
              customerEmail={email}
              customerPhone={phone}
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

      {/* Back to previous step. Only on the payment step for now: step 1
          has "Change" on the trip card, and step 2 has its own back button
          beside the pay button — this one made two. */}
      {step === 3 && <div className="flex justify-center mt-10 mb-4">
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
      </div>}
    </div>
  );
}