"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Car,
  Hotel,
  Plane,
  Download,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  AlertTriangle,
  Baby,
  Star,
  MessageSquare,
  Phone,
  ChevronRight,
  Shield,
} from "lucide-react";

interface Reservation {
  id: string;
  reservation_code: string;
  trip_type: string;
  pickup_datetime: string;
  return_datetime: string | null;
  status: string;
  adults: number;
  children: number;
  luggage_count: number;
  hotel_name: string | null;
  hotel_address: string | null;
  flight_code: string | null;
  child_seat: boolean;
  total_price: number;
  base_price: number;
  night_surcharge: number;
  child_seat_fee: number;
  round_trip_discount: number;
  coupon_discount: number;
  exchange_rate_eur: number | null;
  qr_code_token: string | null;
  created_at: string;
  regions: {
    name_en: string;
    name_tr: string;
    name_de: string;
    name_pl: string;
    name_ru: string;
    slug: string;
  };
  customers: {
    first_name: string;
    last_name: string;
    email: string;
  };
  vehicle_categories: { name: string } | null;
  driver_assignments?: Array<{
    id: string;
    leg: string;
    pickup_time: string | null;
    status: string;
    drivers: { full_name: string; phone: string } | null;
    vehicles: { plate_number: string; brand: string; model: string } | null;
  }>;
}

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle; color: string; bg: string; border: string; textColor: string }
> = {
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", textColor: "text-amber-600" },
  paid: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", textColor: "text-emerald-600" },
  driver_assigned: { icon: Truck, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", textColor: "text-blue-600" },
  passenger_picked_up: { icon: Car, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30", textColor: "text-violet-300" },
  completed: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", textColor: "text-emerald-600" },
  cancel_requested: { icon: AlertTriangle, color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-600/30", textColor: "text-blue-600" },
  cancelled: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", textColor: "text-red-500" },
};

const CANCELLABLE = ["pending", "paid", "driver_assigned"];

export default function TrackReservation() {
  const t = useTranslations("track");
  const locale = useLocale();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reservation, setReservation] = useState<Reservation | null>(null);

  // Cancel states
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Review states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setReservation(null);
    setCancelSuccess(false);
    setReviewSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/reservations/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), email: email.trim() }),
      });

      if (!res.ok) {
        setError(t("notFound"));
        return;
      }

      const data = await res.json();
      setReservation(data.reservation);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!reservation) return;
    setCancelling(true);
    setCancelError("");

    try {
      const res = await fetch("/api/reservations/cancel-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_code: reservation.reservation_code,
          email: email.trim(),
          reason: cancelReason.trim(),
        }),
      });

      if (!res.ok) {
        setCancelError(t("cancelError"));
        return;
      }

      setCancelSuccess(true);
      setShowCancel(false);
      setReservation({ ...reservation, status: "cancel_requested" });
    } catch {
      setCancelError(t("cancelError"));
    } finally {
      setCancelling(false);
    }
  };

  const handleReview = async () => {
    if (!reservation || rating === 0) return;
    setSubmittingReview(true);
    setReviewError("");

    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_code: reservation.reservation_code,
          email: email.trim(),
          rating,
          comment: reviewComment.trim(),
        }),
      });

      if (!res.ok) {
        setReviewError(t("rateError"));
        return;
      }

      setReviewSuccess(true);
    } catch {
      setReviewError(t("rateError"));
    } finally {
      setSubmittingReview(false);
    }
  };

  const regionName =
    reservation?.regions?.[
      `name_${locale}` as keyof typeof reservation.regions
    ] ?? reservation?.regions?.name_en;

  const eurRate = reservation?.exchange_rate_eur ?? 1;
  const totalEur =
    eurRate > 0
      ? (reservation?.total_price ?? 0) / eurRate
      : reservation?.total_price ?? 0;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const sc = statusConfig[reservation?.status ?? ""] ?? statusConfig.pending;
  const StatusIcon = sc.icon;

  // Status timeline steps
  const statusSteps = ["pending", "paid", "driver_assigned", "completed"];
  const currentStepIdx = statusSteps.indexOf(reservation?.status ?? "");

  return (
    <div className="max-w-3xl mx-auto">
      {/* Search Form */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 backdrop-blur-sm"
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold text-lg">{t("title")}</h3>
            <p className="text-gray-500 text-xs">{t("subtitle")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              {t("codeLabel")}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VL-ABC123"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600/50 tracking-wider font-mono text-lg transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              {t("emailLabel")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600/50 transition-all"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            <Search size={18} />
            {loading ? t("searching") : t("searchButton")}
          </button>
        </div>
      </form>

      {/* Cancel Success Message */}
      {cancelSuccess && (
        <div className="mt-4 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 rounded-xl">
          <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-600 text-sm font-medium">{t("cancelSuccess")}</p>
        </div>
      )}

      {/* Result */}
      {reservation && (
        <div className="mt-8 space-y-4">

          {/* Header Card */}
          <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

            <div className="p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-medium mb-1">
                    {t("reservationCode")}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-wider font-mono">
                    {reservation.reservation_code}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {reservation.customers.first_name} {reservation.customers.last_name}
                  </p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${sc.bg} ${sc.border}`}>
                  <StatusIcon size={14} className={sc.color} />
                  <span className={`text-sm font-semibold ${sc.textColor}`}>
                    {t(`status_${reservation.status}`)}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              {!["cancelled", "cancel_requested"].includes(reservation.status) && (
                <div className="mt-6 flex items-center gap-1">
                  {statusSteps.map((step, i) => {
                    const isActive = i <= currentStepIdx;
                    const isCurrent = i === currentStepIdx;
                    return (
                      <div key={step} className="flex-1 flex items-center gap-1">
                        <div className={`flex-1 h-1.5 rounded-full transition-all ${isActive ? "bg-blue-600" : "bg-gray-100"} ${isCurrent ? "bg-blue-400 animate-pulse" : ""}`} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price Bar */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{t("total")}</span>
              <span className="text-xl font-bold text-gray-900">
                €{totalEur.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Transfer Details Card */}
          <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <p className="text-xs text-gray-400 uppercase tracking-[0.15em] font-semibold">{t("transferDetails")}</p>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Route */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("route")}</p>
                  <p className="text-gray-900 font-medium text-sm">{regionName}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                    <ChevronRight size={10} />
                    {reservation.trip_type === "round_trip" ? t("roundTrip") : t("oneWay")}
                  </p>
                </div>
              </div>

              {/* Pickup */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("pickup")}</p>
                  <p className="text-gray-900 font-medium text-sm">
                    {formatDate(reservation.pickup_datetime)}
                  </p>
                  {reservation.return_datetime && (
                    <>
                      <p className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-wider">{t("return")}</p>
                      <p className="text-gray-900 text-sm">
                        {formatDate(reservation.return_datetime)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Passengers */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("passengers")}</p>
                  <p className="text-gray-900 font-medium text-sm">
                    {reservation.adults} {t("adults")}
                    {reservation.children > 0 && ` + ${reservation.children} ${t("children")}`}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {reservation.luggage_count} {t("luggage")}
                  </p>
                </div>
              </div>

              {/* Vehicle */}
              {reservation.vehicle_categories && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Car size={16} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("vehicle")}</p>
                    <p className="text-gray-900 font-medium text-sm">
                      {reservation.vehicle_categories.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Hotel */}
              {reservation.hotel_name && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hotel size={16} className="text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("hotel")}</p>
                    <p className="text-gray-900 font-medium text-sm">{reservation.hotel_name}</p>
                    {reservation.hotel_address && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{reservation.hotel_address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Flight */}
              {reservation.flight_code && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-sky-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Plane size={16} className="text-sky-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("flight")}</p>
                    <p className="text-gray-900 font-medium text-sm">{reservation.flight_code}</p>
                  </div>
                </div>
              )}

              {/* Extras */}
              {reservation.child_seat && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-pink-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Baby size={16} className="text-pink-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("extras")}</p>
                    <p className="text-gray-900 text-sm font-medium">{t("childSeat")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Driver Info Card */}
          {reservation.driver_assignments && reservation.driver_assignments.length > 0 && (
            <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden backdrop-blur-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-[0.15em] font-semibold">{t("driverInfo")}</p>
              </div>

              <div className="p-6 space-y-3">
                {reservation.driver_assignments
                  .filter(da => ["assigned", "picked_up"].includes(da.status))
                  .map((da) => {
                    const isReturn = da.leg === "return";
                    const legLabel = isReturn ? t("return") : t("pickup");
                    return (
                      <div key={da.id} className={`p-4 rounded-xl border ${isReturn ? "bg-blue-500/5 border-blue-500/15" : "bg-emerald-500/5 border-emerald-500/15"}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isReturn ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                            {legLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("driverName")}</p>
                            <p className="text-gray-900 font-semibold">{da.drivers?.full_name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("driverPhone")}</p>
                            <a href={`tel:${da.drivers?.phone}`} className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                              <Phone size={12} />
                              {da.drivers?.phone}
                            </a>
                          </div>
                          {da.vehicles && (
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("vehicle")}</p>
                              <p className="text-gray-900 text-sm">{da.vehicles.brand} {da.vehicles.model} — {da.vehicles.plate_number}</p>
                            </div>
                          )}
                          {da.pickup_time && (
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t("pickupTime")}</p>
                              <p className="text-blue-600 font-bold text-lg">{da.pickup_time}</p>
                            </div>
                          )}
                        </div>
                        {isReturn && da.pickup_time && (
                          <div className="mt-3 p-2.5 bg-blue-500/10 rounded-lg border border-blue-600/20">
                            <p className="text-xs text-blue-500 font-medium">{t("earlyWarning")}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Actions Card */}
          <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden backdrop-blur-sm">
            <div className="p-6 flex flex-wrap gap-3">
              {reservation.status !== "cancelled" &&
                reservation.status !== "cancel_requested" && (
                  <a
                    href={`/api/voucher?code=${encodeURIComponent(reservation.reservation_code)}&locale=${locale}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all text-sm shadow-lg shadow-blue-500/20"
                  >
                    <Download size={16} />
                    {t("downloadVoucher")}
                  </a>
              )}

              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "908508401327"}?text=${encodeURIComponent(`Reservation: ${reservation.reservation_code}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366]/90 text-white font-semibold rounded-xl hover:bg-[#20BD5A] transition-colors text-sm"
              >
                <MessageSquare size={16} />
                {t("whatsappSupport")}
              </a>

              {/* Cancel Button */}
              {CANCELLABLE.includes(reservation.status) && !showCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-semibold rounded-xl hover:bg-red-500/20 transition-all text-sm"
                >
                  <XCircle size={16} />
                  {t("cancelReservation")}
                </button>
              )}
            </div>

            {/* Cancel Confirmation */}
            {showCancel && (
              <div className="px-6 pb-6">
                <div className="p-5 bg-red-500/5 border border-red-500/15 rounded-xl space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-500 text-sm font-medium">{t("cancelConfirm")}</p>
                  </div>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={t("cancelReason")}
                    rows={2}
                    maxLength={500}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                  />
                  {cancelError && (
                    <p className="text-red-400 text-xs">{cancelError}</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="px-5 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
                    >
                      {cancelling ? t("cancelling") : t("cancelSubmit")}
                    </button>
                    <button
                      onClick={() => { setShowCancel(false); setCancelError(""); }}
                      className="px-5 py-2 bg-white border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      {t("cancelBack")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Review Card – only for completed reservations */}
          {reservation.status === "completed" && !reviewSuccess && (
            <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Star size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">{t("rateTitle")}</p>
                    <p className="text-gray-500 text-xs">{t("rateSubtitle")}</p>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${
                          star <= (hoverRating || rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-500"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={t("rateComment")}
                  rows={3}
                  maxLength={1000}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                />

                {reviewError && (
                  <p className="text-red-400 text-xs">{reviewError}</p>
                )}

                <button
                  onClick={handleReview}
                  disabled={rating === 0 || submittingReview}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all text-sm disabled:opacity-40 shadow-lg shadow-blue-500/20"
                >
                  {submittingReview ? t("rateSubmitting") : t("rateSubmit")}
                </button>
              </div>
            </div>
          )}

          {/* Review Success */}
          {reviewSuccess && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 rounded-xl">
              <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-600 text-sm font-medium">{t("rateSuccess")}</p>
            </div>
          )}

          {/* Contact Support Footer */}
          <div className="text-center py-4">
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">{t("contactSupport")}</p>
            <p className="text-xs text-gray-500 mt-1">0850 840 1327 · torviantransfer@gmail.com</p>
          </div>
        </div>
      )}
    </div>
  );
}
