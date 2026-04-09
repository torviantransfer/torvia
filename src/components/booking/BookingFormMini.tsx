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
    <div className="rounded-2xl p-6 lg:p-7" style={{ backgroundColor: "#1d1d1f", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Form header with airport note */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">{t("title")}</h2>
        <span className="flex items-center gap-1 text-[11px] text-gray-500">
          <Plane size={10} className="text-orange-400" />
          Antalya Airport (AYT)
        </span>
      </div>

      {/* Trip type toggle */}
      <div className="flex rounded-lg p-0.5 mb-5" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        <button
          type="button"
          onClick={() => setTripType("one_way")}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
            tripType === "one_way"
              ? "bg-white text-black"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {t("oneWay")}
        </button>
        <button
          type="button"
          onClick={() => setTripType("round_trip")}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
            tripType === "round_trip"
              ? "bg-white text-black"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <ArrowLeftRight size={12} />
          {t("roundTrip")}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropoff (region select) */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            {t("dropoff")}
          </label>
          <div className="relative">
            <MapPin
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <select
              name="region"
              required
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
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
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {t("departureDate")}
            </label>
            <div className="relative">
              <Calendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="date"
                name="date"
                required
                defaultValue={defaultDate}
                min={defaultDate}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {t("departureTime")}
            </label>
            <div className="relative">
              <Clock
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="time"
                name="time"
                required
                defaultValue={defaultTime}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
              />
            </div>
          </div>
        </div>

        {/* Return date & time (visible only for round trip) */}
        {tripType === "round_trip" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t("returnDate")}
              </label>
              <input
                type="date"
                name="returnDate"
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2.5 rounded-lg text-sm text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {t("returnTime")}
              </label>
              <input
                type="time"
                name="returnTime"
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
              />
            </div>
          </div>
        )}

        {/* Passengers & Flight row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-3">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {t("flightCode")} <span className="text-gray-600">({t("optional")})</span>
            </label>
            <div className="relative">
              <Plane
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                name="flight"
                placeholder={t("flightCodePlaceholder")}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-gray-600"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {t("adults")}
            </label>
            <div className="relative">
              <Users
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <select
                name="adults"
                defaultValue="2"
                className="w-full pl-9 pr-2 py-2.5 rounded-lg text-sm text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
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
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {t("children")}
            </label>
            <select
              name="children"
              defaultValue="0"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {t("luggage")}
            </label>
            <div className="relative">
              <Luggage
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <select
                name="luggage"
                defaultValue="2"
                className="w-full pl-9 pr-2 py-2.5 rounded-lg text-sm text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
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
          className="w-full py-3 text-white font-semibold rounded-lg transition-all hover:brightness-110 flex items-center justify-center gap-2 text-sm"
          style={{ backgroundColor: '#F97316' }}
        >
          {t("next")}
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
