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
  HandMetal,
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
  welcome_sign: boolean;
  welcome_name: string | null;
  total_price: number;
  base_price: number;
  night_surcharge: number;
  child_seat_fee: number;
  welcome_sign_fee: number;
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
}

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle; color: string; bg: string }
> = {
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  paid: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  driver_assigned: {
    icon: Truck,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  passenger_picked_up: {
    icon: Car,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  completed: {
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  cancel_requested: {
    icon: AlertTriangle,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
  },
  cancelled: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

export default function TrackReservation() {
  const t = useTranslations("track");
  const locale = useLocale();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reservation, setReservation] = useState<Reservation | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setReservation(null);
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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Search Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 rounded-2xl border border-white/10 p-6 sm:p-8"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              {t("codeLabel")}
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VL-ABC123"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 tracking-wider font-mono text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">
              {t("emailLabel")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50"
          >
            <Search size={18} />
            {loading ? t("searching") : t("searchButton")}
          </button>
        </div>
      </form>

      {/* Result */}
      {reservation && (
        <div className="mt-8 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {t("reservationCode")}
                </p>
                <p className="text-2xl font-bold text-white tracking-wider font-mono">
                  {reservation.reservation_code}
                </p>
              </div>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${sc.bg}`}
              >
                <StatusIcon size={16} className={sc.color} />
                <span className={`text-sm font-medium ${sc.color}`}>
                  {t(`status_${reservation.status}`)}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Route */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin size={16} className="text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("route")}</p>
                <p className="text-white font-medium">{regionName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {reservation.trip_type === "round_trip"
                    ? t("roundTrip")
                    : t("oneWay")}
                </p>
              </div>
            </div>

            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("pickup")}</p>
                <p className="text-white font-medium">
                  {formatDate(reservation.pickup_datetime)}
                </p>
                {reservation.return_datetime && (
                  <>
                    <p className="text-xs text-gray-500 mt-1">{t("return")}</p>
                    <p className="text-white text-sm">
                      {formatDate(reservation.return_datetime)}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Passengers */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users size={16} className="text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("passengers")}</p>
                <p className="text-white font-medium">
                  {reservation.adults} {t("adults")}
                  {reservation.children > 0 &&
                    ` + ${reservation.children} ${t("children")}`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {reservation.luggage_count} {t("luggage")}
                </p>
              </div>
            </div>

            {/* Vehicle */}
            {reservation.vehicle_categories && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Car size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("vehicle")}</p>
                  <p className="text-white font-medium">
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
                  <p className="text-xs text-gray-500">{t("hotel")}</p>
                  <p className="text-white font-medium">
                    {reservation.hotel_name}
                  </p>
                  {reservation.hotel_address && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {reservation.hotel_address}
                    </p>
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
                  <p className="text-xs text-gray-500">{t("flight")}</p>
                  <p className="text-white font-medium">
                    {reservation.flight_code}
                  </p>
                </div>
              </div>
            )}

            {/* Extras */}
            {(reservation.child_seat || reservation.welcome_sign) && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-pink-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Baby size={16} className="text-pink-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("extras")}</p>
                  <div className="space-y-0.5">
                    {reservation.child_seat && (
                      <p className="text-white text-sm">{t("childSeat")}</p>
                    )}
                    {reservation.welcome_sign && (
                      <p className="text-white text-sm">
                        {t("welcomeSign")}
                        {reservation.welcome_name &&
                          `: ${reservation.welcome_name}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-gray-400 font-medium">{t("total")}</span>
            <span className="text-2xl font-bold text-white">
              €{totalEur.toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-white/10 flex flex-wrap gap-3">
            {reservation.status !== "cancelled" &&
              reservation.status !== "cancel_requested" && (
                <a
                  href={`/api/voucher?code=${encodeURIComponent(reservation.reservation_code)}&locale=${locale}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all text-sm"
                >
                  <Download size={16} />
                  {t("downloadVoucher")}
                </a>
              )}
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "905469407955"}?text=${encodeURIComponent(`Reservation: ${reservation.reservation_code}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white font-medium rounded-xl hover:bg-[#20BD5A] transition-colors text-sm"
            >
              {t("whatsappSupport")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
