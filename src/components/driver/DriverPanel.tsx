"use client";

import { useState, useCallback } from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Plane,
  Phone,
  Hotel,
  Baby,
  Tag,
  Navigation,
  CheckCircle,
  Loader2,
  QrCode,
  FileText,
  ChevronDown,
  MessageCircle,
  Download,
} from "lucide-react";
import QRCodeCanvas from "@/components/QRCodeCanvas";
import QRScanner from "@/components/driver/QRScanner";

interface Props {
  assignment: {
    id: string;
    status: string;
    reservations: {
      reservation_code: string;
      trip_type: string;
      pickup_datetime: string;
      return_datetime: string | null;
      flight_code: string | null;
      adults: number;
      children: number;
      luggage_count: number;
      child_seat: boolean;
      welcome_sign: boolean;
      welcome_name: string | null;
      hotel_name: string | null;
      hotel_address: string | null;
      notes: string | null;
      status: string;
      qr_code_token: string | null;
      customers: {
        first_name: string;
        last_name: string;
        phone: string;
        email: string;
      } | null;
      regions: {
        name_en: string;
        name_tr: string;
        distance_km: number;
        duration_minutes: number;
      } | null;
    } | null;
    drivers: { full_name: string; phone: string } | null;
    vehicles: {
      plate_number: string;
      brand: string;
      model: string;
    } | null;
  };
  token: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  assigned: { color: "text-yellow-800", bg: "bg-yellow-50 border-yellow-200", label: "Awaiting Acceptance", icon: "🔔" },
  accepted: { color: "text-blue-800", bg: "bg-blue-50 border-blue-200", label: "Transfer Accepted", icon: "✅" },
  picked_up: { color: "text-purple-800", bg: "bg-purple-50 border-purple-200", label: "Passenger Picked Up", icon: "🚗" },
  completed: { color: "text-green-800", bg: "bg-green-50 border-green-200", label: "Completed", icon: "🏁" },
};

export default function DriverPanel({ assignment, token }: Props) {
  const [status, setStatus] = useState(assignment.status);
  const [loading, setLoading] = useState(false);
  const [qrVerified, setQrVerified] = useState(false);

  const res = assignment.reservations;
  const customer = res?.customers;
  const region = res?.regions;
  const vehicle = assignment.vehicles;

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/driver/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, status: newStatus }),
      });
      if (response.ok) {
        setStatus(newStatus);
        // Send WhatsApp notification to customer
        if (customer?.phone) {
          sendWhatsAppNotify(newStatus);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppNotify = (newStatus: string) => {
    if (!customer?.phone) return;
    const phone = customer.phone.replace(/[^0-9]/g, "");
    const code = res?.reservation_code ?? "";

    const messages: Record<string, string> = {
      accepted: `✅ TORVIAN Transfer\n\nYour transfer ${code} has been accepted.\nYour driver: ${assignment.drivers?.full_name ?? "—"}\nVehicle: ${vehicle?.brand ?? ""} ${vehicle?.model ?? ""} (${vehicle?.plate_number ?? ""})\n\nWe'll be at the airport on time! 🚗`,
      picked_up: `🚗 TORVIAN Transfer\n\nYour driver has confirmed pickup for transfer ${code}.\nYou're on your way! Enjoy the ride. 🌟`,
      completed: `🏁 TORVIAN Transfer\n\nTransfer ${code} is complete.\nThank you for choosing TORVIAN! We hope you had a great experience.\n\n⭐ Rate us: torviantransfer.com`,
    };

    const text = messages[newStatus];
    if (text) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const onQrVerified = useCallback(() => {
    setQrVerified(true);
  }, []);

  if (!res) {
    return (
      <div className="text-center py-12 text-gray-400">
        Reservation data not found
      </div>
    );
  }

  const pickupDate = new Date(res.pickup_datetime);
  const isCompleted = status === "completed";
  const statusConf = STATUS_CONFIG[status] ?? STATUS_CONFIG.assigned;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`rounded-xl p-4 text-center border ${statusConf.bg}`}>
        <span className="text-lg mr-2">{statusConf.icon}</span>
        <span className={`text-sm font-bold uppercase ${statusConf.color}`}>
          {statusConf.label}
        </span>
      </div>

      {/* Countdown / time highlight */}
      {!isCompleted && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-center text-white">
          <p className="text-xs opacity-80 mb-1">Pickup Time</p>
          <p className="text-2xl font-bold">
            {pickupDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {pickupDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      )}

      {/* Reservation info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Transfer Details</h2>
          <span className="font-mono text-sm font-bold text-slate-900">
            {res.reservation_code}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          {/* Route */}
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-orange-500 mt-0.5" />
            <div>
              <p className="font-medium">
                Antalya Airport → {region?.name_en}
              </p>
              <p className="text-xs text-gray-400">
                ~{region?.duration_minutes} min • {region?.distance_km} km
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-gray-400" />
            <div>
              <p className="font-medium">
                {pickupDate.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-orange-500 font-bold">
                {pickupDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Flight */}
          {res.flight_code && (
            <div className="flex items-center gap-3">
              <Plane size={16} className="text-gray-400" />
              <p className="font-medium">{res.flight_code}</p>
            </div>
          )}

          {/* Passengers */}
          <div className="flex items-center gap-3">
            <Users size={16} className="text-gray-400" />
            <p>
              {res.adults} adults, {res.children} children, {res.luggage_count}{" "}
              luggage
            </p>
          </div>

          {/* Child seat */}
          {res.child_seat && (
            <div className="flex items-center gap-3">
              <Baby size={16} className="text-green-500" />
              <p className="text-green-700">Child seat required</p>
            </div>
          )}

          {/* Welcome sign */}
          {res.welcome_sign && (
            <div className="flex items-center gap-3">
              <Tag size={16} className="text-blue-500" />
              <p className="text-blue-700">
                Welcome sign: {res.welcome_name || "Customer name"}
              </p>
            </div>
          )}

          {/* Hotel */}
          {res.hotel_name && (
            <div className="flex items-start gap-3">
              <Hotel size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{res.hotel_name}</p>
                {res.hotel_address && (
                  <p className="text-xs text-gray-400">{res.hotel_address}</p>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {res.notes && (
            <div className="p-3 bg-yellow-50 rounded-lg text-yellow-800 text-xs">
              📝 {res.notes}
            </div>
          )}

          {/* Return trip */}
          {res.trip_type === "round_trip" && res.return_datetime && (
            <div className="p-3 bg-blue-50 rounded-lg text-blue-800 text-xs">
              🔄 Return:{" "}
              {new Date(res.return_datetime).toLocaleDateString("en-GB")}{" "}
              {new Date(res.return_datetime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>

      {/* Customer contact card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-3">Customer</h3>
        <div className="space-y-2">
          <p className="font-medium text-gray-800">
            {customer?.first_name} {customer?.last_name}
          </p>
          <div className="flex gap-2">
            <a
              href={`tel:${customer?.phone}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium"
            >
              <Phone size={14} />
              Call
            </a>
            <a
              href={`https://wa.me/${customer?.phone?.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white text-sm rounded-lg font-medium"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Vehicle info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-2">Vehicle</h3>
        <p className="text-sm">
          {vehicle?.brand} {vehicle?.model} —{" "}
          <span className="font-mono font-bold">{vehicle?.plate_number}</span>
        </p>
      </div>

      {/* QR Scanner — show when accepted (so driver can verify passenger) */}
      {(status === "accepted" || status === "picked_up") && !qrVerified && (
        <QRScanner token={token} onVerified={onQrVerified} />
      )}

      {qrVerified && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-sm font-bold text-green-700">
          ✅ Passenger QR verified successfully
        </div>
      )}

      {/* QR Code section — for passenger to scan */}
      {res.qr_code_token && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
          <h3 className="font-bold text-gray-900 mb-2">
            <QrCode size={16} className="inline mr-2" />
            Verification QR Code
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Show this to verify the transfer
          </p>
          <div className="inline-block p-4 bg-gray-50 rounded-lg">
            <QRCodeCanvas value={res.qr_code_token} size={192} />
          </div>
        </div>
      )}

      {/* Driver Voucher */}
      <a
        href={`/api/driver-voucher?token=${encodeURIComponent(token)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <Download size={16} />
        View / Print Voucher
      </a>

      {/* Action buttons */}
      {!isCompleted && (
        <div className="space-y-3">
          {status === "assigned" && (
            <button
              onClick={() => updateStatus("accepted")}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              Accept Transfer
            </button>
          )}

          {status === "accepted" && (
            <button
              onClick={() => updateStatus("picked_up")}
              disabled={loading}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Navigation size={18} />
              )}
              Passenger Picked Up
            </button>
          )}

          {status === "picked_up" && (
            <button
              onClick={() => updateStatus("completed")}
              disabled={loading}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              Transfer Completed
            </button>
          )}

          {/* Navigate button */}
          {res.hotel_address && (status === "accepted" || status === "picked_up") && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(res.hotel_address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-gray-800 text-white font-medium rounded-xl flex items-center justify-center gap-2"
            >
              <Navigation size={16} />
              Navigate to Destination
            </a>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="text-center py-8">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <p className="text-lg font-bold text-green-800">
            Transfer Completed!
          </p>
          <p className="text-sm text-gray-400">Thank you for your service.</p>
        </div>
      )}
    </div>
  );
}
