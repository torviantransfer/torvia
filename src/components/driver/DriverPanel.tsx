"use client";

import { Fragment, useCallback, useState } from "react";
import type { ReactNode } from "react";
import {
  Baby,
  CalendarClock,
  Car,
  CheckCircle,
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
  Clock,
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

const TZ = "Europe/Istanbul";

function fmtDate(dt: string | null | undefined) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("tr-TR", {
    timeZone: TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(dt: string | null | undefined) {
  if (!dt) return "—";
  return new Date(dt).toLocaleTimeString("tr-TR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateShort(dt: string | null | undefined) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("tr-TR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<string, { label: string; tone: string; step: number }> = {
  assigned:  { label: "Atama Bekliyor",   tone: "border-amber-200 bg-amber-50 text-amber-800",      step: 1 },
  accepted:  { label: "Şoför Kabul Etti", tone: "border-blue-200 bg-blue-50 text-blue-800",          step: 2 },
  picked_up: { label: "Yolculuk Başladı", tone: "border-indigo-200 bg-indigo-50 text-indigo-800",    step: 3 },
  completed: { label: "Tamamlandı",       tone: "border-emerald-200 bg-emerald-50 text-emerald-800", step: 4 },
};

const STEPS = ["Kabul", "QR", "Yolculuk", "Bitiş"];

export default function DriverPanel({ assignment, token }: Props) {
  const [status, setStatus]         = useState(assignment.status);
  const [loading, setLoading]       = useState(false);
  const [qrVerified, setQrVerified] = useState(status === "picked_up" || status === "completed");
  const [error, setError]           = useState("");

  const res        = assignment.reservations;
  const customer   = res?.customers;
  const region     = res?.regions;
  const regionName = region?.name_tr || region?.name_en || "—";
  const vehicle    = assignment.vehicles;
  const statusConf = STATUS_CONFIG[status] ?? STATUS_CONFIG.assigned;
  const isReturn   = assignment.leg === "return";

  const activeDatetime = isReturn && res?.return_datetime
    ? res.return_datetime
    : res?.pickup_datetime ?? null;

  const pickupTimeDisplay = isReturn && assignment.pickup_time
    ? assignment.pickup_time
    : fmtTime(activeDatetime);

  const routeText = isReturn
    ? `${regionName} → Antalya Havalimanı`
    : `Antalya Havalimanı → ${regionName}`;

  const canStartRide = status === "accepted" && qrVerified;

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
    const code  = res?.reservation_code ?? "";
    const vehicleText = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})` : "—";
    const messages: Record<string, string> = {
      accepted:  `TORVIAN Transfer\n\n${code} numaralı transferiniz şoför tarafından kabul edildi.\nŞoför: ${assignment.drivers?.full_name ?? "—"}\nAraç: ${vehicleText}`,
      picked_up: `TORVIAN Transfer\n\n${code} numaralı transferiniz başladı. Keyifli yolculuklar dileriz.`,
      completed: `TORVIAN Transfer\n\n${code} numaralı transferiniz tamamlandı. Bizi tercih ettiğiniz için teşekkür ederiz.`,
    };
    const text = messages[newStatus];
    if (text) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const onQrVerified = useCallback(() => setQrVerified(true), []);

  if (!res) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Rezervasyon verisi bulunamadı.
      </div>
    );
  }

  const primaryAction =
    status === "assigned"  ? { label: "Transferi Kabul Et",  icon: <CheckCircle size={18} />, cls: "bg-blue-600 hover:bg-blue-700",      next: "accepted"  } :
    status === "accepted"  ? { label: "Yolculuğu Başlat",    icon: <Navigation  size={18} />, cls: "bg-indigo-600 hover:bg-indigo-700",  next: "picked_up", disabled: !canStartRide } :
    status === "picked_up" ? { label: "Transferi Tamamla",   icon: <CheckCircle size={18} />, cls: "bg-emerald-600 hover:bg-emerald-700", next: "completed" } :
    null;

  return (
    <div className="space-y-3 pb-28">

      {/* ── HERO CARD — tek bakışta tüm kritik bilgiler ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Koyu başlık: kod + güzergah + durum */}
        <div className="bg-slate-950 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-sm font-bold text-orange-400 tracking-widest">
                {res.reservation_code}
              </p>
              <h2 className="mt-1 text-lg font-black leading-snug">{routeText}</h2>
              {(region?.distance_km || region?.duration_minutes) && (
                <p className="mt-1 text-xs text-slate-400">
                  {region.distance_km && `${region.distance_km} km`}
                  {region.distance_km && region.duration_minutes && " · "}
                  {region.duration_minutes && `~${region.duration_minutes} dk`}
                </p>
              )}
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${statusConf.tone}`}>
              {statusConf.label}
            </span>
          </div>
        </div>

        {/* Tarih + Saat — en büyük, en önemli */}
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 bg-white">
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tarih</p>
            <p className="mt-1 text-sm font-bold text-slate-900 leading-tight">
              {fmtDate(activeDatetime)}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alış Saati</p>
            <p className="mt-1 text-4xl font-black tabular-nums text-orange-600 leading-none">
              {pickupTimeDisplay}
            </p>
          </div>
        </div>

        {/* Müşteri + Uçuş — ikinci en kritik bilgiler */}
        <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
          {/* Müşteri adı + telefon */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Müşteri</p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {customer?.first_name} {customer?.last_name}
            </p>
            {customer?.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="mt-1.5 flex items-center gap-1 text-sm font-bold text-blue-600"
              >
                <Phone size={13} />
                {customer.phone}
              </a>
            )}
          </div>
          {/* Uçuş kodu */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Uçuş</p>
            <p className="mt-1 flex items-center gap-1.5 text-xl font-black text-slate-900">
              <Plane size={16} className="text-slate-400" />
              {res.flight_code || <span className="text-slate-300 font-normal text-sm">—</span>}
            </p>
          </div>
        </div>

        {/* Otel */}
        {res.hotel_name && (
          <div className="border-b border-slate-100 px-5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Otel</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">{res.hotel_name}</p>
            {res.hotel_address && (
              <p className="mt-0.5 text-xs text-slate-400">{res.hotel_address}</p>
            )}
          </div>
        )}

        {/* Progress stepper */}
        <div className="px-5 py-4">
          <div className="flex items-center">
            {STEPS.map((step, index) => {
              const done   = statusConf.step > index + 1 || (index === 1 && qrVerified);
              const active = statusConf.step === index + 1 || (index === 1 && status === "accepted" && !qrVerified);
              return (
                <Fragment key={step}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-colors ${
                      done ? "bg-emerald-500 text-white" : active ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      {done ? <CheckCircle size={15} /> : <span>{index + 1}</span>}
                    </div>
                    <span className={`text-[10px] font-bold ${
                      done ? "text-emerald-600" : active ? "text-orange-600" : "text-slate-400"
                    }`}>
                      {step}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`mb-5 h-0.5 flex-1 mx-1 rounded-full transition-colors ${done ? "bg-emerald-300" : "bg-slate-200"}`} />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Hızlı iletişim butonları ── */}
      {customer?.phone && (
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Phone size={16} />
            Ara
          </a>
          <a
            href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white hover:bg-emerald-600"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
        </div>
      )}

      {/* ── Detay kartları ── */}
      <div className="grid gap-3 sm:grid-cols-2">

        {/* Yolcu + Araç */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
            <Users size={14} />
            Yolcular & Araç
          </h3>
          <div className="space-y-2">
            <Info icon={<Users size={14} />}   label="Yolcu"  value={`${res.adults} yetişkin${res.children > 0 ? `, ${res.children} çocuk` : ""}`} />
            <Info icon={<Luggage size={14} />} label="Bagaj"  value={`${res.luggage_count} adet`} />
            {vehicle && (
              <>
                <Info icon={<Car size={14} />} label="Araç"  value={`${vehicle.brand} ${vehicle.model}`} />
                <div className="rounded-xl bg-slate-900 px-3 py-2 text-center font-mono text-lg font-black tracking-widest text-white">
                  {vehicle.plate_number}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Transfer detayı */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
            <Route size={14} />
            Transfer Detayı
          </h3>
          <div className="space-y-2">
            <Info icon={<MapPin size={14} />}       label="Güzergah" value={routeText} />
            <Info icon={<CalendarClock size={14} />} label="Tarih"   value={`${fmtDateShort(activeDatetime)} – ${pickupTimeDisplay}`} />
            {res.trip_type === "round_trip" && res.return_datetime && (
              <Info icon={<Route size={14} />} label="Dönüş" value={`${fmtDateShort(res.return_datetime)} – ${fmtTime(res.return_datetime)}`} />
            )}
          </div>
        </div>
      </div>

      {/* ── Özel notlar / uyarılar ── */}
      {(res.child_seat || res.welcome_sign || res.notes) && (
        <div className="space-y-2">
          {res.child_seat && (
            <Notice tone="green" icon={<Baby size={14} />} text="Çocuk koltuğu gerekli" />
          )}
          {res.welcome_sign && (
            <Notice tone="blue" icon={<ShieldCheck size={14} />} text={`Karşılama tabelası: ${res.welcome_name || "İsim belirtilmedi"}`} />
          )}
          {res.notes && (
            <Notice tone="amber" icon={<Clock size={14} />} text={res.notes} />
          )}
        </div>
      )}

      {/* ── QR Doğrulama ── */}
      {status === "accepted" && !qrVerified && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="mb-1.5 flex items-center gap-2 text-sm font-black text-blue-950">
            <QrCode size={16} />
            Yolcu QR Doğrulama
          </h3>
          <p className="mb-4 text-sm text-blue-700">
            Yolculuğu başlatmak için müşterinin QR kodunu okutun.
          </p>
          <QRScanner token={token} onVerified={onQrVerified} />
        </section>
      )}

      {qrVerified && status === "accepted" && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          <CheckCircle size={16} />
          QR doğrulandı — yolculuğu başlatabilirsiniz.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {/* ── Navigasyon butonu ── */}
      {res.hotel_address && (status === "accepted" || status === "picked_up") && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(res.hotel_address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
        >
          <Navigation size={15} />
          Navigasyonu Aç
        </a>
      )}

      {/* ── Sticky primary CTA ── */}
      {primaryAction && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white/90 p-4 shadow-[0_-1px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => updateStatus(primaryAction.next)}
              disabled={loading || !!primaryAction.disabled}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 font-black text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${primaryAction.cls}`}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : primaryAction.icon}
              {primaryAction.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
      <div className="mt-0.5 shrink-0 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Notice({ icon, text, tone }: { icon: ReactNode; text: string; tone: "green" | "blue" | "amber" | "slate" }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue:  "border-blue-200 bg-blue-50 text-blue-800",
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
