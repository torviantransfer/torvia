"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  UserPlus,
  Eye,
  Phone,
  Send,
  ChevronDown,
  AlertTriangle,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  X,
} from "lucide-react";

interface Reservation {
  id: string;
  reservation_code: string;
  status: string;
  trip_type: string;
  total_price: number;
  pickup_datetime: string;
  return_datetime: string | null;
  flight_code: string | null;
  adults: number;
  children: number;
  child_seat: boolean;
  welcome_sign: boolean;
  hotel_name: string | null;
  notes: string | null;
  created_at: string;
  customers: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null;
  regions: { name_en: string; slug: string } | null;
  vehicle_categories: { name: string } | null;
  driver_assignments: Array<{
    id: string;
    status: string;
    link_token: string;
    drivers: { full_name: string; phone: string } | null;
  }>;
}

interface Props {
  reservations: Reservation[];
  drivers: Array<{ id: string; full_name: string; phone: string }>;
  vehicles: Array<{
    id: string;
    plate_number: string;
    brand: string;
    model: string;
  }>;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  driver_assigned: "bg-purple-100 text-purple-800",
  passenger_picked_up: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  cancel_requested: "bg-amber-100 text-amber-800",
};

export default function ReservationList({
  reservations,
  drivers,
  vehicles,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [conflicts, setConflicts] = useState<Array<{ type: string; reservation_code: string; pickup: string; region: string }>>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [forceAssign, setForceAssign] = useState(false);
  const [driverLinkModal, setDriverLinkModal] = useState<{
    driverLink: string;
    whatsappUrl: string;
    driverName: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const filtered = reservations.filter((r) => {
    const matchesSearch =
      search === "" ||
      r.reservation_code.toLowerCase().includes(search.toLowerCase()) ||
      r.customers?.first_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customers?.last_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customers?.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const assignDriver = async (reservationId: string) => {
    if (!selectedDriver || !selectedVehicle) return;

    // Step 1: Check for conflicts (unless forced)
    if (!forceAssign) {
      setCheckingConflicts(true);
      try {
        const checkRes = await fetch("/api/admin/check-conflicts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reservationId,
            driverId: selectedDriver,
            vehicleId: selectedVehicle,
          }),
        });
        const checkData = await checkRes.json();
        if (checkData.hasConflicts) {
          setConflicts(checkData.conflicts);
          setCheckingConflicts(false);
          return; // Show conflict warning, don't assign
        }
      } catch { /* proceed if check fails */ }
      setCheckingConflicts(false);
    }

    // Step 2: Assign
    const res = await fetch("/api/admin/assign-driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservationId,
        driverId: selectedDriver,
        vehicleId: selectedVehicle,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setDriverLinkModal({
        driverLink: data.driverLink,
        whatsappUrl: data.whatsappUrl,
        driverName: drivers.find(d => d.id === selectedDriver)?.full_name || "Driver",
      });
      setAssigningId(null);
      setConflicts([]);
      setForceAssign(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const buildWhatsAppUrl = (r: Reservation) => {
    const da = r.driver_assignments?.[0];
    if (!da?.link_token || !da?.drivers?.phone) return null;
    const driverLink = `${window.location.origin}/driver/${da.link_token}`;
    const pickupDate = new Date(r.pickup_datetime);
    const voucherLink = `${window.location.origin}/api/driver-voucher?token=${da.link_token}`;
    const msg = encodeURIComponent(
      `🚗 VELORA — New Transfer Assignment\n\n` +
      `📋 Code: ${r.reservation_code}\n` +
      `👤 Customer: ${r.customers?.first_name} ${r.customers?.last_name}\n` +
      `📍 Destination: ${r.regions?.name_en}\n` +
      `📅 Date: ${pickupDate.toLocaleDateString()} ${pickupDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n\n` +
      `🔗 Driver Panel:\n${driverLink}\n\n` +
      `📄 Voucher:\n${voucherLink}`
    );
    const phone = da.drivers.phone.replace(/[^0-9]/g, "");
    return `https://wa.me/${phone}?text=${msg}`;
  };

  return (
    <div>
      {/* Driver Link Modal */}
      {driverLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Şoför Atandı!</h3>
              <button
                onClick={() => { setDriverLinkModal(null); window.location.reload(); }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Aşağıdaki linki <strong>{driverLinkModal.driverName}</strong> adlı şoföre gönderin.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={driverLinkModal.driverLink}
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
              />
              <button
                onClick={() => copyToClipboard(driverLinkModal.driverLink)}
                className="p-2 hover:bg-gray-200 rounded-lg transition"
                title="Copy link"
              >
                {copiedLink ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-500" />}
              </button>
            </div>
            <div className="flex gap-3">
              <a
                href={driverLinkModal.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm"
              >
                <MessageCircle size={16} />
                WhatsApp ile Gönder
              </a>
              <button
                onClick={() => { setDriverLinkModal(null); window.location.reload(); }}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kod, isim veya e-posta ile ara..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="pending">Beklemede</option>
          <option value="paid">Ödendi</option>
          <option value="driver_assigned">Şoför Atandı</option>
          <option value="passenger_picked_up">Alındı</option>
          <option value="completed">Tamamlandı</option>
          <option value="cancelled">İptal Edildi</option>
          <option value="cancel_requested">İptal Talep Edildi</option>
        </select>
      </div>

      {/* Reservation cards */}
      <div className="space-y-3">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          >
            {/* Summary row */}
            <div
              className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
              onClick={() =>
                setExpandedId(expandedId === r.id ? null : r.id)
              }
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {r.reservation_code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}
                  >
                    {r.status.replace("_", " ")}
                  </span>
                  {r.trip_type === "round_trip" && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Gidiş-Dönüş
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {r.customers?.first_name} {r.customers?.last_name} →{" "}
                  {r.regions?.name_en}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  ${r.total_price.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(r.pickup_datetime).toLocaleDateString()}{" "}
                  {new Date(r.pickup_datetime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform ${expandedId === r.id ? "rotate-180" : ""}`}
              />
            </div>

            {/* Expanded detail */}
            {expandedId === r.id && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">
                      Müşteri
                    </p>
                    <p className="font-medium">
                      {r.customers?.first_name} {r.customers?.last_name}
                    </p>
                    <p className="text-gray-500">{r.customers?.email}</p>
                    <p className="text-gray-500">{r.customers?.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">
                      Transfer
                    </p>
                    <p>Havalimanı → {r.regions?.name_en}</p>
                    <p className="text-gray-500">
                      Uçuş: {r.flight_code || "—"}
                    </p>
                    <p className="text-gray-500">
                      {r.adults} yetişkin, {r.children} çocuk
                    </p>
                    {r.child_seat && (
                      <p className="text-green-600 text-xs">
                        Çocuk koltuğu istendi
                      </p>
                    )}
                    {r.welcome_sign && (
                      <p className="text-blue-600 text-xs">
                        Karşılama tabelası istendi
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">
                      Detaylar
                    </p>
                    <p>Otel: {r.hotel_name || "—"}</p>
                    <p className="text-gray-500">
                      Notlar: {r.notes || "—"}
                    </p>
                    <p className="text-gray-500">
                      Rezervasyon:{" "}
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Driver assignment */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {/* Cancel request actions */}
                  {r.status === "cancel_requested" && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-2">⚠️ İptal Talebi</p>
                      {r.notes && <p className="text-xs text-amber-700 mb-3">{r.notes}</p>}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            await fetch("/api/admin/cancel-action", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ reservation_id: r.id, action: "approve" }),
                            });
                            window.location.reload();
                          }}
                          className="px-4 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                        >
                          İptali Onayla
                        </button>
                        <button
                          onClick={async () => {
                            await fetch("/api/admin/cancel-action", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ reservation_id: r.id, action: "reject" }),
                            });
                            window.location.reload();
                          }}
                          className="px-4 py-2 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                        >
                          Reddet (Aktif Tut)
                        </button>
                      </div>
                    </div>
                  )}
                  {r.driver_assignments?.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-medium text-gray-400">
                          Şoför:
                        </span>
                        <span className="font-medium text-sm">
                          {r.driver_assignments[0].drivers?.full_name}
                        </span>
                        <a
                          href={`tel:${r.driver_assignments[0].drivers?.phone}`}
                          className="text-blue-600 text-sm flex items-center gap-1"
                        >
                          <Phone size={12} />
                          {r.driver_assignments[0].drivers?.phone}
                        </a>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.driver_assignments[0].status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {r.driver_assignments[0].status}
                        </span>
                      </div>
                      {/* Driver link actions */}
                      {r.driver_assignments[0].link_token && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={buildWhatsAppUrl(r) || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs font-medium"
                          >
                            <MessageCircle size={13} />
                            WhatsApp ile Gönder
                          </a>
                          <button
                            onClick={() => copyToClipboard(`${window.location.origin}/driver/${r.driver_assignments[0].link_token}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium"
                          >
                            {copiedLink ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                            {copiedLink ? "Kopyalandı!" : "Linki Kopyala"}
                          </button>
                          <a
                            href={`/driver/${r.driver_assignments[0].link_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs font-medium"
                          >
                            <ExternalLink size={13} />
                            Şoför Sayfası
                          </a>
                        </div>
                      )}
                    </div>
                  ) : r.status === "paid" ? (
                    assigningId === r.id ? (
                      <div>
                      <div className="flex items-center gap-3">
                        <select
                          value={selectedDriver}
                          onChange={(e) => setSelectedDriver(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                        >
                          <option value="">Şoför Seçin</option>
                          {drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.full_name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selectedVehicle}
                          onChange={(e) => setSelectedVehicle(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                        >
                          <option value="">Araç Seçin</option>
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.plate_number} — {v.brand} {v.model}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => assignDriver(r.id)}
                          disabled={!selectedDriver || !selectedVehicle || checkingConflicts}
                          className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 flex items-center gap-1"
                        >
                          <Send size={14} />
                          {checkingConflicts ? "Kontrol ediliyor..." : "Ata ve Link Gönder"}
                        </button>
                        <button
                          onClick={() => { setAssigningId(null); setConflicts([]); setForceAssign(false); }}
                          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                          İptal
                        </button>
                      </div>
                      {/* Conflict warning */}
                      {conflicts.length > 0 && assigningId === r.id && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle size={14} className="text-amber-600" />
                            <p className="text-xs font-semibold text-amber-800">Zamanlama Çakışması Tespit Edildi</p>
                          </div>
                          <div className="space-y-1 mb-3">
                            {conflicts.map((c) => (
                              <p key={c.reservation_code} className="text-xs text-amber-700">
                                <span className="font-mono font-semibold">{c.reservation_code}</span>
                                {" — "}{c.region} — {new Date(c.pickup).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                {" "}({c.type})
                              </p>
                            ))}
                          </div>
                          <button
                            onClick={() => { setForceAssign(true); setTimeout(() => assignDriver(r.id), 50); }}
                            className="px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
                          >
                            Yine de Ata
                          </button>
                        </div>
                      )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAssigningId(r.id);
                          setSelectedDriver("");
                          setSelectedVehicle("");
                          setConflicts([]);
                          setForceAssign(false);
                        }}
                        className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
                      >
                        <UserPlus size={14} />
                        Şoför Ata
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Rezervasyon bulunamadı
          </div>
        )}
      </div>
    </div>
  );
}
