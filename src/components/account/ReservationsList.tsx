"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Users,
  Car,
  Luggage,
  FileText,
  XCircle,
  X,
} from "lucide-react";

const t: Record<string, Record<string, string>> = {
  title: { en: "My Reservations", tr: "Rezervasyonlarım", de: "Meine Buchungen", pl: "Moje rezerwacje", ru: "Мои бронирования" },
  search: { en: "Search by code or hotel…", tr: "Kod veya otel ara…", de: "Suche nach Code oder Hotel…", pl: "Szukaj po kodzie lub hotelu…", ru: "Поиск по коду или отелю…" },
  all: { en: "All", tr: "Tümü", de: "Alle", pl: "Wszystkie", ru: "Все" },
  paid: { en: "Paid", tr: "Ödendi", de: "Bezahlt", pl: "Opłacone", ru: "Оплачено" },
  driver_assigned: { en: "Driver Assigned", tr: "Şoför Atandı", de: "Fahrer zugewiesen", pl: "Kierowca przypisany", ru: "Водитель назначен" },
  passenger_picked_up: { en: "Picked Up", tr: "Alındı", de: "Abgeholt", pl: "Odebrano", ru: "Подобран" },
  completed: { en: "Completed", tr: "Tamamlandı", de: "Abgeschlossen", pl: "Zakończone", ru: "Завершено" },
  cancelled: { en: "Cancelled", tr: "İptal", de: "Storniert", pl: "Anulowane", ru: "Отменено" },
  pending: { en: "Pending", tr: "Bekliyor", de: "Ausstehend", pl: "Oczekuje", ru: "Ожидание" },
  noResults: { en: "No reservations found", tr: "Rezervasyon bulunamadı", de: "Keine Buchungen gefunden", pl: "Nie znaleziono rezerwacji", ru: "Бронирования не найдены" },
  tripType: { en: "Trip Type", tr: "Yolculuk Tipi", de: "Reiseart", pl: "Typ podróży", ru: "Тип поездки" },
  oneWay: { en: "One Way", tr: "Tek Yön", de: "Einfach", pl: "Jednokierunkowy", ru: "В одну сторону" },
  roundTrip: { en: "Round Trip", tr: "Gidiş-Dönüş", de: "Hin & Rück", pl: "W obie strony", ru: "Туда и обратно" },
  pickup: { en: "Pickup", tr: "Alış", de: "Abholung", pl: "Odbiór", ru: "Трансфер" },
  returnLabel: { en: "Return", tr: "Dönüş", de: "Rückfahrt", pl: "Powrót", ru: "Возврат" },
  passengers: { en: "Passengers", tr: "Yolcular", de: "Passagiere", pl: "Pasażerowie", ru: "Пассажиры" },
  adults: { en: "Adults", tr: "Yetişkin", de: "Erwachsene", pl: "Dorośli", ru: "Взрослых" },
  children: { en: "Children", tr: "Çocuk", de: "Kinder", pl: "Dzieci", ru: "Детей" },
  vehicle: { en: "Vehicle", tr: "Araç", de: "Fahrzeug", pl: "Pojazd", ru: "Транспорт" },
  hotel: { en: "Hotel", tr: "Otel", de: "Hotel", pl: "Hotel", ru: "Отель" },
  total: { en: "Total", tr: "Toplam", de: "Gesamt", pl: "Suma", ru: "Итого" },
  downloadVoucher: { en: "Download Voucher", tr: "Fişi İndir", de: "Gutschein herunterladen", pl: "Pobierz voucher", ru: "Скачать ваучер" },
  cancel_requested: { en: "Cancel Requested", tr: "İptal Talep Edildi", de: "Stornierung beantragt", pl: "Prośba o anulowanie", ru: "Запрос на отмену" },
  cancelBtn: { en: "Request Cancellation", tr: "İptal Talebi", de: "Stornierung beantragen", pl: "Poproś o anulowanie", ru: "Запросить отмену" },
  cancelTitle: { en: "Cancel Reservation", tr: "Rezervasyonu İptal Et", de: "Buchung stornieren", pl: "Anuluj rezerwację", ru: "Отменить бронирование" },
  cancelConfirm: { en: "Are you sure you want to cancel this reservation?", tr: "Bu rezervasyonu iptal etmek istediğinize emin misiniz?", de: "Sind Sie sicher, dass Sie diese Buchung stornieren möchten?", pl: "Czy na pewno chcesz anulować tę rezerwację?", ru: "Вы уверены, что хотите отменить бронирование?" },
  cancelReason: { en: "Reason (optional)", tr: "Sebep (isteğe bağlı)", de: "Grund (optional)", pl: "Powód (opcjonalnie)", ru: "Причина (необязательно)" },
  cancelSubmit: { en: "Confirm Cancel", tr: "İptali Onayla", de: "Stornierung bestätigen", pl: "Potwierdź anulowanie", ru: "Подтвердить отмену" },
  cancelSuccess: { en: "Cancellation request sent", tr: "İptal talebi gönderildi", de: "Stornierungsanfrage gesendet", pl: "Prośba o anulowanie wysłana", ru: "Запрос на отмену отправлен" },
};

const STATUS_BADGE: Record<string, string> = {
  paid: "bg-green-500/15 text-green-400 border-green-500/20",
  driver_assigned: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  passenger_picked_up: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  completed: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  cancel_requested: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

const CANCELLABLE = ["pending", "paid", "driver_assigned"];

const FILTER_STATUSES = ["all", "paid", "driver_assigned", "passenger_picked_up", "completed", "cancelled"];

interface Reservation {
  id: string;
  reservation_code: string;
  trip_type: string;
  pickup_datetime: string;
  return_datetime: string | null;
  status: string;
  total_price: number;
  exchange_rate_eur: number | null;
  hotel_name: string | null;
  adults: number;
  children: number;
  qr_code_token: string | null;
  regions: { name_en: string; name_tr: string; name_de: string; name_pl: string; name_ru: string } | null;
  vehicle_categories: { name: string } | null;
}

export default function ReservationsList({
  reservations,
  locale,
}: {
  reservations: Reservation[];
  locale: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(new Set());

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/reservations/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: cancelId, reason: cancelReason }),
      });
      if (res.ok) {
        setCancelledIds((prev) => new Set(prev).add(cancelId));
        setCancelId(null);
        setCancelReason("");
      }
    } catch { /* ignore */ }
    setCancelling(false);
  };

  const regionName = (r: Reservation["regions"]) =>
    r?.[`name_${locale}` as keyof NonNullable<typeof r>] ?? r?.name_en ?? "";

  const filtered = reservations.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchCode = r.reservation_code.toLowerCase().includes(q);
      const matchHotel = r.hotel_name?.toLowerCase().includes(q);
      const matchRegion = regionName(r.regions).toLowerCase().includes(q);
      if (!matchCode && !matchHotel && !matchRegion) return false;
    }
    return true;
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const eurPrice = (r: Reservation) =>
    r.exchange_rate_eur ? (r.total_price / r.exchange_rate_eur).toFixed(2) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-white/[0.07] to-white/[0.03] rounded-2xl border border-white/10 p-6 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">{t.title[locale] ?? t.title.en}</h1>
          <span className="text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 font-mono">{filtered.length} / {reservations.length}</span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="relative bg-gradient-to-b from-white/[0.07] to-white/[0.03] rounded-2xl border border-white/10 p-5 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder={t.search[locale] ?? t.search.en}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={14} className="text-gray-500 mr-1" />
            {FILTER_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-xs px-3.5 py-2 rounded-xl border transition-all font-medium ${
                  statusFilter === s
                    ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t[s]?.[locale] ?? t[s]?.en ?? s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reservation Cards */}
      {filtered.length === 0 ? (
        <div className="relative bg-gradient-to-b from-white/[0.07] to-white/[0.03] rounded-2xl border border-white/10 p-12 text-center backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <p className="text-gray-500 text-sm">{t.noResults[locale] ?? t.noResults.en}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const expanded = expandedId === r.id;
            return (
              <div
                key={r.id}
                className="relative bg-gradient-to-b from-white/[0.07] to-white/[0.03] rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-white/15 backdrop-blur-sm"
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                >
                  {/* Status badge */}
                  <span className={`shrink-0 text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border ${STATUS_BADGE[r.status] ?? STATUS_BADGE.pending}`}>
                    {t[r.status]?.[locale] ?? t[r.status]?.en ?? r.status}
                  </span>

                  {/* Route */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      Antalya Airport → {regionName(r.regions)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(r.pickup_datetime)} · {formatTime(r.pickup_datetime)}
                    </p>
                  </div>

                  {/* Code + Price */}
                  <div className="hidden sm:flex flex-col items-end shrink-0">
                    <span className="text-xs font-mono text-orange-400">{r.reservation_code}</span>
                    <span className="text-xs text-gray-500">
                      {eurPrice(r) ? `€${eurPrice(r)}` : `₺${r.total_price.toLocaleString()}`}
                    </span>
                  </div>

                  {/* Chevron */}
                  {expanded ? (
                    <ChevronUp size={16} className="shrink-0 text-gray-500" />
                  ) : (
                    <ChevronDown size={16} className="shrink-0 text-gray-500" />
                  )}
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                    {/* Mobile: code + price */}
                    <div className="sm:hidden flex items-center justify-between">
                      <span className="text-xs font-mono text-orange-400">{r.reservation_code}</span>
                      <span className="text-sm font-bold text-white">
                        {eurPrice(r) ? `€${eurPrice(r)}` : `₺${r.total_price.toLocaleString()}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {/* Trip type */}
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin size={14} className="text-orange-400 shrink-0" />
                        <span className="text-gray-500">{t.tripType[locale] ?? t.tripType.en}:</span>
                        <span className="text-white">
                          {r.trip_type === "round_trip"
                            ? (t.roundTrip[locale] ?? t.roundTrip.en)
                            : (t.oneWay[locale] ?? t.oneWay.en)}
                        </span>
                      </div>

                      {/* Pickup datetime */}
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={14} className="text-orange-400 shrink-0" />
                        <span className="text-gray-500">{t.pickup[locale] ?? t.pickup.en}:</span>
                        <span className="text-white">{formatDate(r.pickup_datetime)} {formatTime(r.pickup_datetime)}</span>
                      </div>

                      {/* Return datetime */}
                      {r.return_datetime && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar size={14} className="text-blue-400 shrink-0" />
                          <span className="text-gray-500">{t.returnLabel[locale] ?? t.returnLabel.en}:</span>
                          <span className="text-white">{formatDate(r.return_datetime)} {formatTime(r.return_datetime)}</span>
                        </div>
                      )}

                      {/* Passengers */}
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users size={14} className="text-orange-400 shrink-0" />
                        <span className="text-gray-500">{t.passengers[locale] ?? t.passengers.en}:</span>
                        <span className="text-white">{r.adults} {t.adults[locale] ?? t.adults.en}{r.children > 0 ? ` + ${r.children} ${t.children[locale] ?? t.children.en}` : ""}</span>
                      </div>

                      {/* Vehicle */}
                      {r.vehicle_categories?.name && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Car size={14} className="text-orange-400 shrink-0" />
                          <span className="text-gray-500">{t.vehicle[locale] ?? t.vehicle.en}:</span>
                          <span className="text-white">{r.vehicle_categories.name}</span>
                        </div>
                      )}

                      {/* Hotel */}
                      {r.hotel_name && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Luggage size={14} className="text-orange-400 shrink-0" />
                          <span className="text-gray-500">{t.hotel[locale] ?? t.hotel.en}:</span>
                          <span className="text-white">{r.hotel_name}</span>
                        </div>
                      )}

                      {/* Total (desktop) */}
                      <div className="hidden sm:flex items-center gap-2 text-gray-400">
                        <FileText size={14} className="text-orange-400 shrink-0" />
                        <span className="text-gray-500">{t.total[locale] ?? t.total.en}:</span>
                        <span className="text-white font-semibold">
                          {eurPrice(r) ? `€${eurPrice(r)}` : `₺${r.total_price.toLocaleString()}`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Download voucher */}
                      {(r.status === "paid" || r.status === "driver_assigned" || r.status === "passenger_picked_up") && (
                        <a
                          href={`/api/voucher?code=${r.reservation_code}&locale=${locale}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20"
                        >
                          <Download size={14} />
                          {t.downloadVoucher[locale] ?? t.downloadVoucher.en}
                        </a>
                      )}

                      {/* Cancel button */}
                      {CANCELLABLE.includes(cancelledIds.has(r.id) ? "" : r.status) && (
                        <button
                          onClick={() => setCancelId(r.id)}
                          className="inline-flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
                        >
                          <XCircle size={14} />
                          {t.cancelBtn[locale] ?? t.cancelBtn.en}
                        </button>
                      )}

                      {/* Cancel requested badge */}
                      {(r.status === "cancel_requested" || cancelledIds.has(r.id)) && (
                        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-lg">
                          {t.cancelSuccess[locale] ?? t.cancelSuccess.en}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="relative bg-gradient-to-b from-[#1e1e22] to-[#16161a] border border-white/10 rounded-2xl w-full max-w-md p-6 sm:p-8 space-y-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{t.cancelTitle[locale] ?? t.cancelTitle.en}</h3>
              <button onClick={() => { setCancelId(null); setCancelReason(""); }} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-400">{t.cancelConfirm[locale] ?? t.cancelConfirm.en}</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t.cancelReason[locale] ?? t.cancelReason.en}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none transition-all"
            />
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setCancelId(null); setCancelReason(""); }}
                className="text-sm text-gray-400 hover:text-white px-4 py-2 transition-colors"
              >
                {t.all[locale] === "Tümü" ? "Vazgeç" : "Close"}
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                {t.cancelSubmit[locale] ?? t.cancelSubmit.en}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
