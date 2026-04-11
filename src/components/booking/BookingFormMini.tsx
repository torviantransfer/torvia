"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useState, useRef } from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Search,
  FileSearch,
  ChevronRight,
} from "lucide-react";

export default function BookingFormMini() {
  const t = useTranslations("booking");
  const router = useRouter();
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("one_way");
  const dateRef = useRef<HTMLInputElement>(null);
  const returnDateRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const defaultDate = today.toISOString().split("T")[0];
  const nextHour = new Date(today.getTime() + 60 * 60 * 1000);
  nextHour.setMinutes(0, 0, 0);
  const defaultTime = `${String(nextHour.getHours()).padStart(2, "0")}:00`;
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
    router.push(`/booking?${params.toString()}`);
  };

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    try { ref.current?.showPicker(); } catch { /* unsupported browser */ }
  };

  return (
    <div className="w-full">
      {/* Search form card */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
          {/* Tab bar: Tek Yön | Gidiş Dönüş ... Rezervasyon Sorgula */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 lg:px-5">
            <div className="flex items-center gap-0">
              <button
                type="button"
                onClick={() => setTripType("one_way")}
                className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                  tripType === "one_way"
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t("oneWay")}
                {tripType === "one_way" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-500 rounded-t-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setTripType("round_trip")}
                className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                  tripType === "round_trip"
                    ? "text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t("roundTrip")}
                {tripType === "round_trip" && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-500 rounded-t-full" />
                )}
              </button>
            </div>
            <Link
              href="/track"
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-orange-500 transition-colors py-3"
            >
              <FileSearch size={15} />
              {t("trackReservation")}
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Form fields */}
          <div className="p-3 lg:p-4">
            {/* Row 1: Pickup, Dropoff, Date, Time (one-way) or just Pickup & Dropoff (round-trip) */}
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-2.5">
              {/* Kalkış */}
            <div className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-3 hover:border-orange-400 transition-colors">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 text-left">
                {t("pickup")}
              </label>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-orange-500 shrink-0" />
                <span className="text-sm font-medium text-gray-900 truncate">Antalya Havalimanı (AYT)</span>
              </div>
            </div>

            {/* Varış */}
            <div className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-3 hover:border-orange-400 transition-colors">
              <label htmlFor="mini-region" className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 text-left">
                {t("dropoff")}
              </label>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-orange-500 shrink-0" />
                <select
                  id="mini-region"
                  name="region"
                  required
                  className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none appearance-none cursor-pointer"
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

            {/* One-way: date + time + button in same row */}
            {tripType === "one_way" && (
              <>
                <div
                  className="border border-gray-300 rounded-xl px-4 py-3 hover:border-orange-400 transition-colors cursor-pointer lg:w-[155px] shrink-0"
                  onClick={() => openPicker(dateRef)}
                >
                  <label htmlFor="mini-date" className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 text-left cursor-pointer">
                    {t("departureDate")}
                  </label>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-orange-500 shrink-0" />
                    <input
                      ref={dateRef}
                      id="mini-date"
                      type="date"
                      name="date"
                      required
                      defaultValue={defaultDate}
                      min={defaultDate}
                      className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none cursor-pointer"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>

                <div className="border border-gray-300 rounded-xl px-4 py-3 hover:border-orange-400 transition-colors lg:w-[115px] shrink-0">
                  <label htmlFor="mini-time" className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 text-left">
                    {t("departureTime")}
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-orange-500 shrink-0" />
                    <input
                      id="mini-time"
                      type="time"
                      name="time"
                      required
                      defaultValue={defaultTime}
                      className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none cursor-pointer"
                      style={{ colorScheme: "light" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 text-sm whitespace-nowrap transition-all hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98] shrink-0"
                >
                  <Search size={18} />
                  {t("searchTransfer")}
                </button>
              </>
            )}
          </div>

          {/* Row 2: Round-trip date/time fields + button */}
          {tripType === "round_trip" && (
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-2.5 mt-2.5">
              {/* Gidiş Tarihi */}
              <div
                className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-3 hover:border-orange-400 transition-colors cursor-pointer"
                onClick={() => openPicker(dateRef)}
              >
                <label htmlFor="mini-date-rt" className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 text-left cursor-pointer">
                  {t("departureDate")}
                </label>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-orange-500 shrink-0" />
                  <input
                    ref={dateRef}
                    id="mini-date-rt"
                    type="date"
                    name="date"
                    required
                    defaultValue={defaultDate}
                    min={defaultDate}
                    className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none cursor-pointer"
                    style={{ colorScheme: "light" }}
                  />
                </div>
              </div>

              {/* Gidiş Saati */}
              <div className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-3 hover:border-orange-400 transition-colors">
                <label htmlFor="mini-time-rt" className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 text-left">
                  {t("departureTime")}
                </label>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-orange-500 shrink-0" />
                  <input
                    id="mini-time-rt"
                    type="time"
                    name="time"
                    required
                    defaultValue={defaultTime}
                    className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none cursor-pointer"
                    style={{ colorScheme: "light" }}
                  />
                </div>
              </div>

              {/* Dönüş Tarihi */}
              <div
                className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-3 hover:border-orange-400 transition-colors cursor-pointer"
                onClick={() => openPicker(returnDateRef)}
              >
                <label htmlFor="mini-return-date" className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 text-left cursor-pointer">
                  {t("returnDate")}
                </label>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-orange-500 shrink-0" />
                  <input
                    ref={returnDateRef}
                    id="mini-return-date"
                    type="date"
                    name="returnDate"
                    required
                    defaultValue={defaultReturnDate}
                    min={defaultDate}
                    className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none cursor-pointer"
                    style={{ colorScheme: "light" }}
                  />
                </div>
              </div>

              {/* Dönüş Saati */}
              <div className="flex-1 min-w-0 border border-gray-300 rounded-xl px-4 py-3 hover:border-orange-400 transition-colors">
                <label htmlFor="mini-return-time" className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 text-left">
                  {t("returnTime")}
                </label>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-orange-500 shrink-0" />
                  <input
                    id="mini-return-time"
                    type="time"
                    name="returnTime"
                    required
                    defaultValue={defaultReturnTime}
                    className="w-full text-sm font-medium text-gray-900 bg-transparent outline-none cursor-pointer"
                    style={{ colorScheme: "light" }}
                  />
                </div>
              </div>

              {/* Search button */}
              <button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 text-sm whitespace-nowrap transition-all hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98] shrink-0"
              >
                <Search size={18} />
                {t("searchTransfer")}
              </button>
            </div>
          )}
          </div>
        </div>
      </form>
    </div>
  );
}
