"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import {
  Plane,
  MapPin,
  Calendar,
  Clock,
  Users,
  Luggage,
  ArrowRight,
  ArrowLeftRight,
} from "lucide-react";

export default function BookingFormMini() {
  const t = useTranslations("booking");
  const router = useRouter();
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("one_way");

  // Auto-fill today's date and next rounded hour
  const today = new Date();
  const defaultDate = today.toISOString().split("T")[0];
  const nextHour = new Date(today.getTime() + 60 * 60 * 1000);
  nextHour.setMinutes(0, 0, 0);
  const defaultTime = `${String(nextHour.getHours()).padStart(2, "0")}:00`;

  // Default return date = tomorrow, return time = same
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const defaultReturnDate = tomorrow.toISOString().split("T")[0];
  const defaultReturnTime = defaultTime;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    params.set("trip", tripType);
    params.set("region", form.get("region") as string);
    params.set("date", form.get("date") as string);
    params.set("time", form.get("time") as string);
    if (tripType === "round_trip") {
      params.set("returnDate", form.get("returnDate") as string);
      params.set("returnTime", form.get("returnTime") as string);
    }
    params.set("flight", form.get("flight") as string);
    params.set("adults", form.get("adults") as string);
    params.set("children", form.get("children") as string);
    params.set("luggage", form.get("luggage") as string);
    router.push(`/booking?${params.toString()}`);
  };

  return (
    <div className="relative rounded-2xl p-6 lg:p-7 backdrop-blur-sm overflow-hidden" style={{ backgroundColor: "#1d1d1f", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
      {/* Form header with airport note */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">{t("title")}</h2>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
          <Plane size={10} className="text-orange-400" />
          Antalya Airport (AYT)
        </span>
      </div>

      {/* Trip type toggle */}
      <div role="group" aria-label="Trip type" className="flex rounded-xl p-0.5 mb-5" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        <button
          type="button"
          onClick={() => setTripType("one_way")}
          aria-pressed={tripType === "one_way"}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${
            tripType === "one_way"
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {t("oneWay")}
        </button>
        <button
          type="button"
          onClick={() => setTripType("round_trip")}
          aria-pressed={tripType === "round_trip"}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tripType === "round_trip"
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <ArrowLeftRight size={12} aria-hidden="true" />
          {t("roundTrip")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropoff (region select) */}
        <div>
          <label htmlFor="mini-region" className="block text-xs font-medium text-gray-300 mb-1.5">
            {t("dropoff")}
          </label>
          <div className="relative">
            <MapPin
              size={14}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <select
              id="mini-region"
              name="region"
              required
              className="w-full pl-9 pr-4 py-3 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none appearance-none"
              style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <option value="">{t("selectRegion")}</option>
              <option value="kundu-lara">Kundu - Lara</option>
              <option value="sehirici">Antalya City Center</option>
              <option value="kadriye">Kadriye</option>
              <option value="belek">Belek</option>
              <option value="bogazkent">Boğazkent</option>
              <option value="evrenseki">Evrenseki</option>
              <option value="side">Side</option>
              <option value="kizilagac">Kızılağaç</option>
              <option value="okurcalar">Okurcalar</option>
              <option value="turkler">Türkler</option>
              <option value="alanya">Alanya</option>
              <option value="mahmutlar">Mahmutlar</option>
              <option value="kargicak">Kargıcak</option>
              <option value="beldibi">Beldibi</option>
              <option value="goynuk">Göynük</option>
              <option value="kemer">Kemer</option>
              <option value="kiris">Kiriş</option>
              <option value="camyuva">Çamyuva</option>
              <option value="tekirova">Tekirova</option>
              <option value="adrasan">Adrasan</option>
              <option value="kas">Kaş</option>
              <option value="kalkan">Kalkan</option>
              <option value="fethiye">Fethiye</option>
              <option value="marmaris">Marmaris</option>
            </select>
          </div>
        </div>

        {/* Date & Time row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="mini-date" className="block text-xs font-medium text-gray-300 mb-1.5">
              {t("departureDate")}
            </label>
            <div className="relative">
              <Calendar
                size={14}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                id="mini-date"
                type="date"
                name="date"
                required
                defaultValue={defaultDate}
                min={defaultDate}
                className="w-full pl-9 pr-2 py-3 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", colorScheme: "dark" }}
              />
            </div>
          </div>
          <div>
            <label htmlFor="mini-time" className="block text-xs font-medium text-gray-300 mb-1.5">
              {t("departureTime")}
            </label>
            <div className="relative">
              <Clock
                size={14}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                id="mini-time"
                type="time"
                name="time"
                required
                defaultValue={defaultTime}
                className="w-full pl-9 pr-2 py-3 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", colorScheme: "dark" }}
              />
            </div>
          </div>
        </div>

        {/* Return date & time (visible only for round trip) */}
        {tripType === "round_trip" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mini-return-date" className="block text-xs font-medium text-gray-300 mb-1.5">
                {t("returnDate")}
              </label>
              <div className="relative">
                <Calendar
                  size={14}
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="mini-return-date"
                  type="date"
                  name="returnDate"
                  required
                  defaultValue={defaultReturnDate}
                  min={defaultDate}
                  className="w-full pl-9 pr-2 py-3 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", colorScheme: "dark" }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="mini-return-time" className="block text-xs font-medium text-gray-300 mb-1.5">
                {t("returnTime")}
              </label>
              <div className="relative">
                <Clock
                  size={14}
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  id="mini-return-time"
                  type="time"
                  name="returnTime"
                  required
                  defaultValue={defaultReturnTime}
                  className="w-full pl-9 pr-2 py-3 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", colorScheme: "dark" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Flight code */}
        <div>
          <label htmlFor="mini-flight" className="block text-xs font-medium text-gray-300 mb-1.5">
            {t("flightCode")} <span className="text-gray-500">({t("optional")})</span>
          </label>
          <div className="relative">
            <Plane
              size={14}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              id="mini-flight"
              type="text"
              name="flight"
              placeholder={t("flightCodePlaceholder")}
              className="w-full pl-9 pr-3 py-3 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none placeholder:text-gray-600"
              style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
            />
          </div>
        </div>

        {/* Passengers row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="mini-adults" className="block text-xs font-medium text-gray-300 mb-1.5">
              {t("adults")}
            </label>
            <div className="relative">
              <Users
                size={14}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <select
                id="mini-adults"
                name="adults"
                defaultValue="2"
                className="w-full pl-9 pr-2 py-3 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none appearance-none"
                style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="mini-children" className="block text-xs font-medium text-gray-300 mb-1.5">
              {t("children")}
            </label>
            <select
              id="mini-children"
              name="children"
              defaultValue="0"
              className="w-full px-3 py-3 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none appearance-none"
              style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mini-luggage" className="block text-xs font-medium text-gray-300 mb-1.5">
              {t("luggage")}
            </label>
            <div className="relative">
              <Luggage
                size={14}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <select
                id="mini-luggage"
                name="luggage"
                defaultValue="2"
                className="w-full pl-9 pr-2 py-3 rounded-lg text-sm text-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none appearance-none"
                style={{ backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3.5 text-white font-bold rounded-xl transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 text-sm bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25"
        >
          {t("next")}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
