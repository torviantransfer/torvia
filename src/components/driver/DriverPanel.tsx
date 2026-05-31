"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import {
  Baby,
  CalendarClock,
  Car,
  CheckCircle,
  Circle,
  Clock,
  Download,
  Hotel,
  Loader2,
  Luggage,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Plane,
  QrCode,
  Route,
  ShieldCheck,
  Users,
} from "lucide-react";
import QRScanner from "@/components/driver/QRScanner";

interface Props {
  assignment: {
    id: string;
    status: string;
    leg: "outbound" | "return";
    pickup_time: string | null;
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

const STATUS_CONFIG: Record<string, { label: string; tone: string; step: number }> = {
  assigned: { label: "Atama Bekliyor", tone: "border-amber-200 bg-amber-50 text-amber-800", step: 1 },
  accepted: { label: "Şoför Kabul Etti", tone: "border-blue-200 bg-blue-50 text-blue-800", step: 2 },
  picked_up: { label: "Yolculuk Başladı", tone: "border-indigo-200 bg-indigo-50 text-indigo-800", step: 3 },
  completed: { label: "Tamamlandı", tone: "border-emerald-200 bg-emerald-50 text-emerald-800", step: 4 },
};

const STEPS = ["Kabul", "QR", "Yolculuk", "Bitiş"];

export default function DriverPanel({ assignment, token }: Props) {
  const [status, setStatus] = useState(assignment.status);
  const [loading, setLoading] = useState(false);
  const [qrVerified, setQrVerified] = useState(status === "picked_up" || status === "completed");
  const [error, setError] = useState("");

  const res = assignment.reservations;
  const customer = res?.customers;
  const region = res?.regions;
  const regionName = region?.name_tr || region?.name_en || "—";
  const vehicle = assignment.vehicles;
  const statusConf = STATUS_CONFIG[status] ?? STATUS_CONFIG.assigned;
  const isReturn = assignment.leg === "return";

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/driver/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, status: newStatus }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Durum güncellenemedi.");
        return;
      }

      setStatus(newStatus);
      if (newStatus === "picked_up") setQrVerified(true);
      if (customer?.phone) sendWhatsAppNotify(newStatus);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppNotify = (newStatus: string) => {
    if (!customer?.phone) return;
    const phone = customer.phone.replace(/[^0-9]/g, "");
    const code = res?.reservation_code ?? "";
    const vehicleText = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})` : "—";

    const messages: Record<string, string> = {
      accepted: `TORVIAN Transfer\n\n${code} numaralı transferiniz şoför tarafından kabul edildi.\nŞoför: ${assignment.drivers?.full_name ?? "—"}\nAraç: ${vehicleText}`,
      picked_up: `TORVIAN Transfer\n\n${code} numaralı transferiniz başladı. Keyifli yolculuklar dileriz.`,
      completed: `TORVIAN Transfer\n\n${code} numaralı transferiniz tamamlandı. Bizi tercih ettiğiniz için teşekkür ederiz.`,
    };

    const text = messages[newStatus];
    if (text) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const onQrVerified = useCallback(() => {
    setQrVerified(true);
  }, []);

  if (!res) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Rezervasyon verisi bulunamadı.
      </div>
    );
  }

  const pickupDate = new Date(isReturn && res.return_datetime ? res.return_datetime : res.pickup_datetime);
  const pickupTime =
    isReturn && assignment.pickup_time
      ? assignment.pickup_time
      : pickupDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const routeText = isReturn
    ? `${regionName} → Antalya Havalimanı`
    : `Antalya Havalimanı → ${regionName}`;
  const canStartRide = status === "accepted" && qrVerified;

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-950 px-5 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-bold text-orange-300">{res.reservation_code}</p>
              <h2 className="mt-1 text-xl font-black">{routeText}</h2>
              <p className="mt-2 text-sm text-slate-300">
                {region?.duration_minutes ? `~${region.duration_minutes} dk` : "Süre —"}
                {region?.distance_km ? ` • ${region.distance_km} km` : ""}
              </p>
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${statusConf.tone}`}>
              {statusConf.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 border-b border-slate-100">
          <div className="p-5">
            <p className="text-xs font-bold uppercase text-slate-400">Alış Tarihi</p>
            <p className="mt-1 font-bold text-slate-950">
              {pickupDate.toLocaleDateString("tr-TR", { weekday: "long", day: "2-digit", month: "long" })}
            </p>
          </div>
          <div className="border-l border-slate-100 p-5">
            <p className="text-xs font-bold uppercase text-slate-400">Alış Saati</p>
            <p className="mt-1 text-3xl font-black text-orange-600">{pickupTime}</p>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-4">
          {STEPS.map((step, index) => {
            const done = statusConf.step > index + 1 || (index === 1 && qrVerified);
            const active = statusConf.step === index + 1 || (index === 1 && status === "accepted" && !qrVerified);
            return (
              <div
                key={step}
                className={`rounded-xl border p-3 ${
                  done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : active
                      ? "border-orange-200 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  {done ? <CheckCircle size={16} /> : <Circle size={16} />}
                  <span className="text-xs font-bold">{step}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 flex items-center gap-2 font-black text-slate-950">
            <Route size={18} className="text-orange-500" />
            Transfer Detayları
          </h3>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info icon={<MapPin size={16} />} label="Güzergah" value={routeText} />
            <Info
              icon={<CalendarClock size={16} />}
              label="Tarih"
              value={`${pickupDate.toLocaleDateString("tr-TR")} ${pickupTime}`}
            />
            <Info icon={<Plane size={16} />} label="Uçuş" value={res.flight_code || "—"} />
            <Info
              icon={<Users size={16} />}
              label="Yolcu"
              value={`${res.adults} yetişkin, ${res.children} çocuk`}
            />
            <Info icon={<Luggage size={16} />} label="Bagaj" value={`${res.luggage_count} bagaj`} />
            <Info icon={<Hotel size={16} />} label="Otel" value={res.hotel_name || "—"} />
          </div>

          {(res.child_seat || res.welcome_sign || res.notes || (res.trip_type === "round_trip" && res.return_datetime)) && (
            <div className="mt-4 space-y-2">
              {res.child_seat && (
                <Notice tone="green" icon={<Baby size={15} />} text="Çocuk koltuğu gerekli" />
              )}
              {res.welcome_sign && (
                <Notice tone="blue" icon={<ShieldCheck size={15} />} text={`Karşılama tabelası: ${res.welcome_name || "İsim belirtilmedi"}`} />
              )}
              {res.notes && (
                <Notice tone="amber" icon={<Clock size={15} />} text={res.notes} />
              )}
              {res.trip_type === "round_trip" && res.return_datetime && (
                <Notice
                  tone="slate"
                  icon={<Route size={15} />}
                  text={`Dönüş: ${new Date(res.return_datetime).toLocaleDateString("tr-TR")} ${new Date(res.return_datetime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`}
                />
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-black text-slate-950">Müşteri</h3>
            <p className="font-bold text-slate-900">
              {customer?.first_name} {customer?.last_name}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a
                href={`tel:${customer?.phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100"
              >
                <Phone size={15} />
                Ara
              </a>
              <a
                href={`https://wa.me/${customer?.phone?.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 font-black text-slate-950">
              <Car size={17} className="text-orange-500" />
              Araç
            </h3>
            <p className="text-sm font-semibold text-slate-800">
              {vehicle ? `${vehicle.brand} ${vehicle.model}` : "—"}
            </p>
            <p className="mt-1 font-mono text-lg font-black text-slate-950">
              {vehicle?.plate_number || "—"}
            </p>
          </div>
        </div>
      </section>

      {status === "accepted" && !qrVerified && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="mb-2 flex items-center gap-2 font-black text-blue-950">
            <QrCode size={18} />
            Yolcu QR Doğrulama
          </h3>
          <p className="mb-4 text-sm text-blue-700">
            Yolculuğu başlatmak için müşterinin mailindeki veya müşteri panelindeki QR kodu okutun.
          </p>
          <QRScanner token={token} onVerified={onQrVerified} />
        </section>
      )}

      {qrVerified && status === "accepted" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          QR doğrulandı. Yolculuğu başlatabilirsiniz.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {status === "assigned" && (
          <ActionButton
            loading={loading}
            icon={<CheckCircle size={18} />}
            label="Transferi Kabul Et"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => updateStatus("accepted")}
          />
        )}

        {status === "accepted" && (
          <ActionButton
            loading={loading}
            disabled={!canStartRide}
            icon={<Navigation size={18} />}
            label="Yolculuğu Başlat"
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => updateStatus("picked_up")}
          />
        )}

        {status === "picked_up" && (
          <ActionButton
            loading={loading}
            icon={<CheckCircle size={18} />}
            label="Transferi Tamamla"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => updateStatus("completed")}
          />
        )}

        {res.hotel_address && (status === "accepted" || status === "picked_up") && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(res.hotel_address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-bold text-white hover:bg-slate-800"
          >
            <Navigation size={16} />
            Navigasyonu Aç
          </a>
        )}

        {status !== "completed" && (
          <a
            href={`/api/driver-voucher?token=${encodeURIComponent(token)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            <Download size={16} />
            Voucher Görüntüle / Yazdır
          </a>
        )}
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
        <p className="mt-0.5 break-words font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Notice({
  icon,
  text,
  tone,
}: {
  icon: ReactNode;
  text: string;
  tone: "green" | "blue" | "amber" | "slate";
}) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${tones[tone]}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function ActionButton({
  className,
  disabled,
  icon,
  label,
  loading,
  onClick,
}: {
  className: string;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 font-black text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : icon}
      {label}
    </button>
  );
}
