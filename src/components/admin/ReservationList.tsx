"use client";

import { useState } from "react";
import {
  Search,
  UserPlus,
  Phone,
  Send,
  ChevronDown,
  AlertTriangle,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  X,
  CalendarClock,
  Mail,
  MapPin,
  Plane,
  Trash2,
  Pencil,
  Users,
  Hotel,
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
    leg: string;
    pickup_time: string | null;
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
  const [statusFilter, setStatusFilter] = useState("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assigningLeg, setAssigningLeg] = useState<"outbound" | "return">("outbound");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [returnPickupTime, setReturnPickupTime] = useState("");
  const [conflicts, setConflicts] = useState<Array<{ type: string; reservation_code: string; pickup: string; region: string }>>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [forceAssign, setForceAssign] = useState(false);
  const [driverLinkModal, setDriverLinkModal] = useState<{
    driverLink: string;
    whatsappUrl: string;
    driverName: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [emailSendingId, setEmailSendingId] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<{ assignmentId?: string; reservationId?: string; field?: string; value?: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ reservationId?: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = reservations.filter((r) => {
    const matchesSearch =
      search === "" ||
      r.reservation_code.toLowerCase().includes(search.toLowerCase()) ||
      r.customers?.first_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customers?.last_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customers?.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !["pending", "cancelled"].includes(r.status)) ||
      r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

    const statusLabels: Record<string, string> = {
      pending: "Beklemede",
      paid: "Ödendi",
      driver_assigned: "Şoför Atandı",
      passenger_picked_up: "Alındı",
      completed: "Tamamlandı",
      cancelled: "İptal Edildi",
      cancel_requested: "İptal Talep Edildi",
    };

    const assignmentStatusLabels: Record<string, string> = {
      assigned: "Atandı",
      accepted: "Kabul Etti",
      picked_up: "Yolda",
      completed: "Tamamlandı",
    };

  const formatPickupDate = (date: string) =>
    new Date(date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatPickupTime = (date: string) =>
    new Date(date).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const deleteReservation = async (reservationId: string) => {
    setDeletingId(reservationId);
    const res = await fetch("/api/admin/delete-reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    });

    if (res.ok) {
      window.location.reload();
      return;
    }

    setDeletingId(null);
    alert("Rezervasyon silinemedi.");
  };

  const assignDriver = async (reservationId: string) => {
    console.log('assignDriver called', { reservationId, selectedDriver, selectedVehicle, assigningLeg, forceAssign });
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

    // Step 2: Assign (robust handling)
    try {
      const res = await fetch("/api/admin/assign-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId,
          driverId: selectedDriver,
          vehicleId: selectedVehicle,
          leg: assigningLeg,
          ...(assigningLeg === "return" && returnPickupTime ? { pickupTime: returnPickupTime } : {}),
        }),
      });

      console.log('assign-driver response status', res.status);

      const text = await res.text();
      let data: Record<string, string> | null = null;
      try {
        data = text ? (JSON.parse(text) as Record<string, string>) : null;
      } catch {
        console.error('assign-driver invalid JSON response', text);
      }

      if (!res.ok) {
        console.error('assign-driver failed', res.status, JSON.stringify(data || text, null, 2));
        alert((data && data.error) || `Atama başarısız (kod ${res.status})\nDetay: ${JSON.stringify(data || text)}`);
        setAssigningId(null);
        return;
      }

      if (!data || !data.driverLink) {
        console.error('assign-driver missing fields', JSON.stringify(data, null, 2));
        alert('Atama başarılı ama sunucudan beklenen veri gelmedi. Konsolu kontrol et.');
        setAssigningId(null);
        return;
      }

      setDriverLinkModal({
        driverLink: data.driverLink,
        whatsappUrl: data.whatsappUrl,
        driverName: drivers.find((d) => d.id === selectedDriver)?.full_name || "Driver",
      });
      setAssigningId(null);
      setConflicts([]);
      setForceAssign(false);
    } catch (err) {
      console.error('assign-driver exception', err);
      alert('Atama sırasında bir hata oluştu. Konsolu kontrol et.');
      setAssigningId(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const sendDriverAssignmentEmail = async (assignmentId: string) => {
    setEmailSendingId(assignmentId);
    setEmailMessage(null);

    const res = await fetch("/api/admin/send-driver-assignment-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId }),
    });

    if (res.ok) {
      setEmailMessage("E-posta müşteriye başarıyla gönderildi.");
    } else {
      const data = await res.json().catch(() => null);
      setEmailMessage(data?.error ?? "E-posta gönderilemedi.");
    }

    setEmailSendingId(null);
    setTimeout(() => setEmailMessage(null), 4000);
  };

  const unassignDriver = async (assignmentId: string) => {
    if (!window.confirm("Bu şoför atamasını kaldırmak istediğinize emin misiniz?")) {
      return;
    }

    setUnassigningId(assignmentId);
    try {
      const res = await fetch("/api/admin/unassign-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Şoför ataması kaldırılamadı.");
      }
    } catch (err) {
      console.error(err);
      alert("Şoför ataması kaldırılırken bir hata oluştu.");
    } finally {
      setUnassigningId(null);
    }
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
          <option value="active">Aktif (varsayılan)</option>
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
            className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
              r.status === "pending" ? "border-yellow-200" : "border-gray-100"
            }`}
          >
            {/* Summary row */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50"
              onClick={() =>
                setExpandedId(expandedId === r.id ? null : r.id)
              }
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-sm tracking-wide">
                      {r.reservation_code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[r.status]}`}
                    >
                      {statusLabels[r.status] ?? r.status.replace("_", " ")}
                    </span>
                    {r.trip_type === "round_trip" && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        Gidiş-Dönüş
                      </span>
                    )}
                  </div>

                  <p className="text-base font-semibold text-gray-950 truncate">
                    {r.customers?.first_name} {r.customers?.last_name}
                    <span className="mx-2 text-gray-300">→</span>
                    {r.regions?.name_en}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock size={13} />
                      {formatPickupDate(r.pickup_datetime)} {formatPickupTime(r.pickup_datetime)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={13} />
                      {r.adults} yetişkin, {r.children} çocuk
                    </span>
                    {r.flight_code && (
                      <span className="inline-flex items-center gap-1">
                        <Plane size={13} />
                        {r.flight_code}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="text-right min-w-[84px]">
                    <p className="text-lg font-bold text-gray-950">
                      ${r.total_price.toFixed(2)}
                    </p>
                    <p className="text-xs font-medium text-gray-400">
                      {r.status === "pending" ? "Tahsilat bekliyor" : statusLabels[r.status] ?? r.status}
                    </p>
                  </div>
                  {r.status === "pending" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal({ reservationId: r.id });
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      title="Bekleyen rezervasyonu sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <ChevronDown
                    size={18}
                    className={`mt-2 text-gray-400 transition-transform ${expandedId === r.id ? "rotate-180" : ""}`}
                  />
                </div>
              </div>
            </div>

            {/* Expanded detail */}
            {expandedId === r.id && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 text-sm">
                  <section>
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-gray-400">
                      <Users size={14} />
                      Müşteri
                    </div>
                    <p className="font-semibold text-gray-950">
                      {r.customers?.first_name} {r.customers?.last_name}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-gray-600 break-all">
                      <Mail size={14} className="text-gray-400 shrink-0" />
                      {r.customers?.email || "—"}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-gray-600">
                      <Phone size={14} className="text-gray-400 shrink-0" />
                      {r.customers?.phone || "—"}
                    </p>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-gray-400">
                      <MapPin size={14} />
                      Transfer
                    </div>
                    <p className="font-semibold text-gray-950">Havalimanı → {r.regions?.name_en}</p>
                    <p className="mt-2 flex items-center gap-2 text-gray-600">
                      <Plane size={14} className="text-gray-400 shrink-0" />
                      Uçuş: {r.flight_code || "—"}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-gray-600">
                      <Users size={14} className="text-gray-400 shrink-0" />
                      {r.adults} yetişkin, {r.children} çocuk
                    </p>
                    {r.child_seat && (
                      <p className="mt-2 text-green-600 text-xs font-medium">
                        Çocuk koltuğu istendi
                      </p>
                    )}
                    {r.welcome_sign && (
                      <p className="mt-1 text-blue-600 text-xs font-medium">
                        Karşılama tabelası istendi
                      </p>
                    )}
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-gray-400">
                      <Hotel size={14} />
                      Detaylar
                    </div>
                    <p className="font-semibold text-gray-950">Otel: {r.hotel_name || "—"}</p>
                    <p className="mt-2 text-gray-600">
                      Notlar: {r.notes || "—"}
                    </p>
                    <p className="mt-1 text-gray-500">
                      Rezervasyon:{" "}
                      {formatPickupDate(r.created_at)}
                    </p>
                  </section>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setEditModal({ reservationId: r.id })}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-xs font-semibold"
                  >
                    <Pencil size={13} />
                    Rezervasyonu Düzenle
                  </button>
                  {r.status === "pending" && (
                    <button
                      onClick={() => setDeleteModal({ reservationId: r.id })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-xs font-semibold"
                    >
                      <Trash2 size={13} />
                      Sil
                    </button>
                  )}
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
                  {r.driver_assignments?.length > 0 && (
                    <div className="space-y-3">
                      {r.driver_assignments.map((da) => {
                        const legLabel = da.leg === "return" ? "Dönüş" : "Gidiş";
                        const waUrl = da.link_token && da.drivers?.phone
                          ? (() => {
                              const driverLink = `${window.location.origin}/driver/${da.link_token}`;
                              const voucherLink = `${window.location.origin}/api/driver-voucher?token=${da.link_token}`;
                              const pickupDate = new Date(r.pickup_datetime);
                              const msg = encodeURIComponent(
                                `🚗 TORVIAN — New Transfer Assignment (${legLabel})\n\n` +
                                `📋 Code: ${r.reservation_code}\n` +
                                `👤 Customer: ${r.customers?.first_name} ${r.customers?.last_name}\n` +
                                `📍 Destination: ${r.regions?.name_en}\n` +
                                `📅 Date: ${pickupDate.toLocaleDateString()} ${pickupDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n` +
                                (da.leg === "return" && da.pickup_time ? `⏰ Pickup: ${da.pickup_time}\n` : "") +
                                `\n🔗 Driver Panel:\n${driverLink}\n\n` +
                                `📄 Voucher:\n${voucherLink}`
                              );
                              const phone = da.drivers!.phone.replace(/[^0-9]/g, "");
                              return `https://wa.me/${phone}?text=${msg}`;
                            })()
                          : null;
                        return (
                          <div key={da.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                            {/* Driver header */}
                            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${da.leg === "return" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                                  {legLabel}
                                </span>
                                <span className="font-semibold text-sm text-gray-900 truncate">{da.drivers?.full_name}</span>
                                <a href={`tel:${da.drivers?.phone}`} className="text-blue-600 text-xs flex items-center gap-1 shrink-0 hover:underline">
                                  <Phone size={11} />
                                  {da.drivers?.phone}
                                </a>
                                {da.pickup_time && (
                                  <span className="text-xs text-orange-600 font-medium shrink-0">· Alış: {da.pickup_time}</span>
                                )}
                              </div>
                              <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[da.status] || "bg-gray-100 text-gray-600"}`}>
                                {assignmentStatusLabels[da.status] ?? da.status}
                              </span>
                            </div>

                            {/* Actions */}
                            {da.link_token && (
                              <div className="px-4 py-3 flex flex-wrap items-center gap-2">
                                {/* Communication */}
                                {waUrl && (
                                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs font-semibold">
                                    <MessageCircle size={13} />
                                    WhatsApp
                                  </a>
                                )}
                                <button
                                  onClick={() => sendDriverAssignmentEmail(da.id)}
                                  disabled={emailSendingId === da.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-xs font-semibold"
                                >
                                  {emailSendingId === da.id ? "Gönderiliyor…" : <><Send size={13} />E-posta</>}
                                </button>

                                {/* Divider */}
                                <span className="w-px h-5 bg-gray-200 mx-0.5" />

                                {/* Utilities */}
                                <a href={`/api/driver-voucher?token=${da.link_token}`} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-xs font-semibold">
                                  <ExternalLink size={13} />
                                  Voucher
                                </a>
                                <button
                                  onClick={() => copyToClipboard(`${window.location.origin}/driver/${da.link_token}`)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-xs font-semibold"
                                >
                                  {copiedLink ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                                  {copiedLink ? "Kopyalandı!" : "Link Kopyala"}
                                </button>

                                {/* Divider */}
                                <span className="w-px h-5 bg-gray-200 mx-0.5" />

                                {/* Danger zone */}
                                <button
                                  onClick={() => unassignDriver(da.id)}
                                  disabled={unassigningId === da.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-60 text-xs font-semibold"
                                >
                                  {unassigningId === da.id ? "Kaldırılıyor…" : "Atamayı Kaldır"}
                                </button>
                                <button
                                  onClick={() => setDeleteModal({ reservationId: r.id })}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-xs font-semibold"
                                >
                                  <Trash2 size={13} />
                                  Sil
                                </button>
                              </div>
                            )}
                            {emailMessage && emailSendingId === null && (
                              <p className="px-4 pb-3 text-xs text-slate-500">{emailMessage}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Assign buttons per leg */}
                  {(r.status === "paid" || r.status === "driver_assigned") && (() => {
                    const outboundAssigned = r.driver_assignments?.some(da => da.leg === "outbound" && ["assigned", "accepted", "picked_up"].includes(da.status));
                    const returnAssigned = r.driver_assignments?.some(da => da.leg === "return" && ["assigned", "accepted", "picked_up"].includes(da.status));
                    const canAssignOutbound = !outboundAssigned;
                    const canAssignReturn = r.trip_type === "round_trip" && !returnAssigned;

                    if (!canAssignOutbound && !canAssignReturn) return null;

                    if (assigningId === r.id) {
                      return (
                        <div className="mt-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <select
                              value={assigningLeg}
                              onChange={(e) => setAssigningLeg(e.target.value as "outbound" | "return")}
                              className="px-3 py-2 text-sm border border-gray-200 rounded-lg font-medium"
                            >
                              {canAssignOutbound && <option value="outbound">Gidiş</option>}
                              {canAssignReturn && <option value="return">Dönüş</option>}
                            </select>
                            <select
                              value={selectedDriver}
                              onChange={(e) => setSelectedDriver(e.target.value)}
                              className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                            >
                              <option value="">Şoför Seçin</option>
                              {drivers.map((d) => (
                                <option key={d.id} value={d.id}>{d.full_name}</option>
                              ))}
                            </select>
                            <select
                              value={selectedVehicle}
                              onChange={(e) => setSelectedVehicle(e.target.value)}
                              className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                            >
                              <option value="">Araç Seçin</option>
                              {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>{v.plate_number} — {v.brand} {v.model}</option>
                              ))}
                            </select>
                          </div>
                          {assigningLeg === "return" && (
                            <div className="mt-2 flex items-center gap-2">
                              <label className="text-xs font-medium text-gray-500">Dönüş Alış Saati:</label>
                              <input
                                type="time"
                                value={returnPickupTime}
                                onChange={(e) => setReturnPickupTime(e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
                              />
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => assignDriver(r.id)}
                              disabled={!selectedDriver || !selectedVehicle || checkingConflicts}
                              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 flex items-center gap-1"
                            >
                              <Send size={14} />
                              {checkingConflicts ? "Kontrol ediliyor..." : `${assigningLeg === "return" ? "Dönüş" : "Gidiş"} Şoför Ata`}
                            </button>
                            <button
                              onClick={() => { setAssigningId(null); setConflicts([]); setForceAssign(false); setReturnPickupTime(""); }}
                              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                            >
                              İptal
                            </button>
                          </div>
                          {/* Conflict warning */}
                          {conflicts.length > 0 && (
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
                      );
                    }

                    return (
                      <div className="mt-3 flex items-center gap-2">
                        {canAssignOutbound && (
                            <button
                            onClick={() => {
                              console.log('Assign outbound button clicked', r.id);
                              setAssigningId(r.id);
                              setAssigningLeg("outbound");
                              setSelectedDriver("");
                              setSelectedVehicle("");
                              setConflicts([]);
                              setForceAssign(false);
                              setReturnPickupTime("");
                            }}
                            className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
                          >
                            <UserPlus size={14} />
                            Gidiş Şoför Ata
                          </button>
                        )}
                        {canAssignReturn && (
                          <button
                              onClick={() => {
                                console.log('Assign return button clicked', r.id);
                                setAssigningId(r.id);
                                setAssigningLeg("return");
                                setSelectedDriver("");
                                setSelectedVehicle("");
                                setConflicts([]);
                                setForceAssign(false);
                                setReturnPickupTime("");
                              }}
                              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                              <UserPlus size={14} />
                              Dönüş Şoför Ata
                            </button>
                        )}
                      </div>
                    );
                  })()}
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

      {/* Edit Reservation Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Rezervasyonu Düzenle</h3>
              <button onClick={() => setEditModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Uçuş Kodu</label>
                <input
                  type="text"
                  placeholder="TK123"
                  onChange={(e) => setEditModal({ ...editModal, field: "flight_code", value: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Otel Adı</label>
                <input
                  type="text"
                  placeholder="REGNUN CARYA"
                  onChange={(e) => setEditModal({ ...editModal, field: "hotel_name", value: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Notlar</label>
                <textarea
                  placeholder="Lütfen zamanında gelin"
                  onChange={(e) => setEditModal({ ...editModal, field: "notes", value: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mt-1 resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={async () => {
                  if (!editModal.reservationId) return;
                  const body: Record<string, string> = { reservationId: editModal.reservationId };
                  if (editModal.field && editModal.value) {
                    body[editModal.field] = editModal.value;
                  }
                  const res = await fetch("/api/admin/edit-reservation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                  });
                  if (res.ok) {
                    window.location.reload();
                  } else {
                    alert("Güncelleme başarısız.");
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium text-sm"
              >
                Kaydet
              </button>
              <button
                onClick={() => setEditModal(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reservation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Rezervasyonu Sil</h3>
              <button onClick={() => setDeleteModal(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Bu rezervasyon panelde iptal edilmiş olarak işaretlenecek. Emin misiniz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!deleteModal.reservationId) return;
                  deleteReservation(deleteModal.reservationId);
                }}
                disabled={deletingId === deleteModal.reservationId}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-sm"
              >
                {deletingId === deleteModal.reservationId ? "Siliniyor..." : "Sil"}
              </button>
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
