"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Baby,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  Loader2,
  Luggage,
  MessageCircle,
  Navigation,
  Phone,
  Plane,
  QrCode,
  StickyNote,
  Users,
  X,
} from "lucide-react";
import QRScanner from "@/components/driver/QRScanner";
import QRCodeCanvas from "@/components/QRCodeCanvas";
import { formatBookingDate, formatBookingDateLong, formatBookingTime } from "@/lib/datetime";

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
      return_flight_code: string | null;
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
      locale: string | null;
      payment_method?: string | null;
      driver_amount?: number | string | null;
      currency?: string | null;
      balance_paid_at?: string | null;
      balance_amount?: number | string | null;
      customers: { first_name: string; last_name: string; phone: string; email: string } | null;
      regions: { name_en: string; name_tr: string; distance_km: number; duration_minutes: number } | null;
    } | null;
    drivers: { full_name: string; phone: string } | null;
    vehicles: { plate_number: string; brand: string; model: string } | null;
  };
  token: string;
}

// Pickup/return values are stored Antalya wall clocks, so they are read back as
// such rather than converted again. See lib/datetime.
const fmtDate = (dt: string | null | undefined) => (dt ? formatBookingDateLong(dt) : "—");
const fmtTime = (dt: string | null | undefined) => (dt ? formatBookingTime(dt) : "—");
const fmtDateShort = (dt: string | null | undefined) => (dt ? formatBookingDate(dt) : "—");

const STATUS: Record<string, { label: string; dot: string }> = {
  assigned: { label: "Onay bekliyor", dot: "bg-[#FF9500]" },
  accepted: { label: "Kabul edildi", dot: "bg-[#007AFF]" },
  picked_up: { label: "Yolculukta", dot: "bg-[#5856D6]" },
  completed: { label: "Tamamlandı", dot: "bg-[#34C759]" },
};

const STEPS = [
  { key: "assigned", label: "Kabul" },
  { key: "accepted", label: "Karşılama" },
  { key: "picked_up", label: "Yolculuk" },
  { key: "completed", label: "Bitiş" },
];

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(amount);

type Balance = { due: number | null; paid: boolean; paidAmount: number | null; currency: string };

/**
 * One transfer, for the driver doing it. Grouped white cards on the system grey,
 * one primary action pinned to the bottom, the things a driver needs on the
 * kerb — time, passenger, flight, plate — before anything else.
 *
 * Two changes to how the job moves:
 *  - A scanned passenger QR starts the ride. It used to only unlock the "start"
 *    button, so drivers scanned, saw nothing happen and gave up on the panel.
 *    A passenger with no QR (lost email, a booking taken by hand) no longer
 *    strands the driver either: the ride can be started without one.
 *  - The cash balance can be taken by card: the driver shows a QR, the passenger
 *    pays on their own phone, and the card here turns green once Stripe has
 *    confirmed it. Completing a job with a balance still due asks first whether
 *    the cash was collected.
 */
export default function DriverPanel({ assignment, token }: Props) {
  const [status, setStatus] = useState(assignment.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<null | "noqr" | "complete">(null);

  const res = assignment.reservations;
  const customer = res?.customers;
  const region = res?.regions;
  const regionName = region?.name_tr || region?.name_en || "—";
  const vehicle = assignment.vehicles;
  const isReturn = assignment.leg === "return";
  const st = STATUS[status] ?? STATUS.assigned;

  const activeDatetime = isReturn && res?.return_datetime ? res.return_datetime : res?.pickup_datetime ?? null;
  const pickupTime = isReturn && assignment.pickup_time ? assignment.pickup_time : fmtTime(activeDatetime);
  const routeText = isReturn ? `${regionName} → Antalya Havalimanı` : `Antalya Havalimanı → ${regionName}`;
  const flight = isReturn ? res?.return_flight_code : res?.flight_code;

  // ─── balance by card ───
  const initialDue =
    !isReturn && res?.payment_method === "cash" && !res?.balance_paid_at && Number(res?.driver_amount) > 0
      ? Number(res?.driver_amount)
      : null;
  const [balance, setBalance] = useState<Balance>({
    due: initialDue,
    paid: !!res?.balance_paid_at,
    paidAmount: res?.balance_amount == null ? null : Number(res.balance_amount),
    currency: (res?.currency || "EUR").toUpperCase(),
  });
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [justPaid, setJustPaid] = useState(false);

  const refreshBalance = useCallback(async () => {
    const r = await fetch(`/api/driver/balance?token=${encodeURIComponent(token)}`, { cache: "no-store" }).catch(() => null);
    if (!r?.ok) return;
    const d = await r.json();
    setBalance((prev) => {
      // Only a payment that lands while the driver is watching gets the flash;
      // reopening a job paid earlier just shows the green card.
      if (d.paid && !prev.paid) setJustPaid(true);
      return { due: d.due, paid: d.paid, paidAmount: d.paidAmount, currency: d.currency };
    });
    if (d.paid) setPayUrl(null);
  }, [token]);

  // While the QR is on screen, watch for Stripe's confirmation.
  const polling = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!payUrl) return;
    polling.current = setInterval(refreshBalance, 3000);
    return () => {
      if (polling.current) clearInterval(polling.current);
    };
  }, [payUrl, refreshBalance]);

  // The driver may close the QR and pocket the phone while the passenger is
  // still paying; look again whenever the panel comes back into view.
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && refreshBalance();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshBalance]);

  const openCardPayment = async () => {
    setPayBusy(true);
    setError("");
    try {
      const r = await fetch("/api/driver/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        setError(d?.error ?? "Ödeme sayfası açılamadı.");
        if (r.status === 409) refreshBalance();
        return;
      }
      setPayUrl(d.url);
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setPayBusy(false);
    }
  };

  // ─── status ───
  const updateStatus = async (next: string, notify = true) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/driver/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, status: next }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Durum güncellenemedi.");
        return;
      }
      setStatus(next);
      setSheet(null);
      if (notify && customer?.phone) sendWhatsAppNotify(next);
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // A verified QR starts the ride. No WhatsApp here: this runs after an async
  // scan, not a tap, and a phone browser blocks the window it would open.
  const onQrVerified = useCallback(() => {
    updateStatus("picked_up", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendWhatsAppNotify = (next: string) => {
    if (!customer?.phone) return;
    const phone = customer.phone.replace(/[^0-9]/g, "");
    const code = res?.reservation_code ?? "";
    const driverName = assignment.drivers?.full_name ?? "—";
    const vehicleText = vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate_number})` : "—";
    const loc = res?.locale ?? "en";

    const waMessages: Record<string, Record<string, string>> = {
      accepted: {
        tr: `TORVIAN Transfer\n\n${code} numaralı transferiniz şoför tarafından kabul edildi.\nŞoför: ${driverName}\nAraç: ${vehicleText}`,
        en: `TORVIAN Transfer\n\nYour transfer ${code} has been accepted by the driver.\nDriver: ${driverName}\nVehicle: ${vehicleText}`,
        de: `TORVIAN Transfer\n\nIhre Fahrt ${code} wurde vom Fahrer angenommen.\nFahrer: ${driverName}\nFahrzeug: ${vehicleText}`,
        pl: `TORVIAN Transfer\n\nTwój transfer ${code} został przyjęty przez kierowcę.\nKierowca: ${driverName}\nPojazd: ${vehicleText}`,
        ru: `TORVIAN Transfer\n\nВаш трансфер ${code} принят водителем.\nВодитель: ${driverName}\nАвтомобиль: ${vehicleText}`,
      },
      picked_up: {
        tr: `TORVIAN Transfer\n\n${code} numaralı transferiniz başladı. Keyifli yolculuklar dileriz.`,
        en: `TORVIAN Transfer\n\nYour transfer ${code} has started. Have a pleasant journey!`,
        de: `TORVIAN Transfer\n\nIhre Fahrt ${code} hat begonnen. Gute Reise!`,
        pl: `TORVIAN Transfer\n\nTwój transfer ${code} się rozpoczął. Miłej podróży!`,
        ru: `TORVIAN Transfer\n\nВаш трансфер ${code} начался. Хорошей поездки!`,
      },
      completed: {
        tr: `TORVIAN Transfer\n\n${code} numaralı transferiniz tamamlandı. Bizi tercih ettiğiniz için teşekkür ederiz.`,
        en: `TORVIAN Transfer\n\nYour transfer ${code} has been completed. Thank you for choosing TORVIAN.`,
        de: `TORVIAN Transfer\n\nIhre Fahrt ${code} wurde abgeschlossen. Vielen Dank für Ihr Vertrauen.`,
        pl: `TORVIAN Transfer\n\nTwój transfer ${code} został ukończony. Dziękujemy za skorzystanie z TORVIAN.`,
        ru: `TORVIAN Transfer\n\nВаш трансфер ${code} завершён. Спасибо, что выбрали TORVIAN.`,
      },
    };
    const text = waMessages[next]?.[loc] ?? waMessages[next]?.en;
    if (text) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!res) {
    return <div className="rounded-[18px] bg-white p-8 text-center text-[15px] text-[#86868b]">Rezervasyon verisi bulunamadı.</div>;
  }

  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.key === status));
  const balanceOpen = balance.due !== null && !balance.paid && status !== "completed";

  const primary =
    status === "assigned"
      ? { label: "Transferi kabul et", onClick: () => updateStatus("accepted") }
      : status === "accepted"
        ? null // started by scanning the passenger's QR, or "QR olmadan başlat"
        : status === "picked_up"
          ? { label: "Transferi tamamla", onClick: () => (balanceOpen ? setSheet("complete") : updateStatus("completed")) }
          : null;

  return (
    <div className="space-y-4 pb-32">
      {/* ── Header ── */}
      <header className="px-1 pt-1">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[13px] font-semibold tracking-wider text-[#86868b]">{res.reservation_code}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12.5px] font-semibold text-[#1d1d1f] ring-1 ring-black/[0.06]">
            <span className={`size-2 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#1d1d1f]">{routeText}</h1>
        {(region?.distance_km || region?.duration_minutes) && (
          <p className="mt-1 text-[14px] text-[#86868b]">
            {[region?.distance_km && `${region.distance_km} km`, region?.duration_minutes && `~${region.duration_minutes} dk`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </header>

      {/* ── When ── */}
      <Card>
        <div className="flex items-end justify-between gap-4 p-4">
          <div className="min-w-0">
            <Label>Alış</Label>
            <p className="mt-1 text-[15px] font-medium text-[#1d1d1f]">{fmtDate(activeDatetime)}</p>
          </div>
          <p className="text-[40px] font-semibold leading-none tracking-[-0.03em] text-[#1d1d1f] tabular-nums">{pickupTime}</p>
        </div>
        <Progress index={stepIndex} />
      </Card>

      {/* ── Balance by card ── */}
      {(balanceOpen || balance.paid) && !isReturn && (
        <Card>
          {balance.paid ? (
            <div className="flex items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#34C759] text-white">
                <Check size={20} strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <p className="text-[16px] font-semibold text-[#1d1d1f]">
                  {balance.paidAmount != null ? money(balance.paidAmount, balance.currency) : "Kalan tutar"} kartla ödendi
                </p>
                <p className="text-[14px] font-medium text-[#248A3D]">Müşteriden nakit almayın.</p>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <Label>Araçta alınacak</Label>
              <p className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.02em] text-[#1d1d1f] tabular-nums">
                {money(balance.due!, balance.currency)}
              </p>
              <p className="mt-2 text-[14px] text-[#6e6e73]">
                {status === "assigned"
                  ? "Karşılamada nakit alınır; müşteri isterse kartla da ödeyebilir."
                  : "Nakit alın ya da müşteri kartla ödemek isterse aşağıdan ödeme açın."}
              </p>
              {/* Not before the job is accepted: until then the one action on the
                  screen is accepting it, and a second blue button competed with it. */}
              {status !== "assigned" && (
              <button
                type="button"
                onClick={openCardPayment}
                disabled={payBusy}
                className="mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#007AFF] text-[16px] font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
              >
                {payBusy ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                Kartla ödeme al
              </button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Start: QR or without ── */}
      {status === "accepted" && (
        <Card>
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-[9px] bg-[#007AFF] text-white">
                <QrCode size={17} />
              </span>
              <div>
                <p className="text-[16px] font-semibold text-[#1d1d1f]">Yolcuyu karşıla</p>
                <p className="text-[13px] text-[#86868b]">QR okutulunca yolculuk başlar.</p>
              </div>
            </div>
            <QRScanner token={token} onVerified={onQrVerified} />
            <button
              type="button"
              onClick={() => setSheet("noqr")}
              className="mt-3 w-full text-center text-[14px] font-medium text-[#007AFF]"
            >
              Yolcunun QR kodu yok mu? QR olmadan başlat
            </button>
          </div>
        </Card>
      )}

      {/* ── Passenger ── */}
      <Section title="Yolcu">
        <Row icon={<Users size={17} />} tint="bg-[#007AFF]" label={`${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim() || "—"}
          value={`${res.adults} yetişkin${res.children > 0 ? ` · ${res.children} çocuk` : ""}`} />
        <Row icon={<Luggage size={17} />} tint="bg-[#8E8E93]" label="Bagaj" value={`${res.luggage_count} adet`} />
        {flight && <Row icon={<Plane size={17} />} tint="bg-[#5856D6]" label="Uçuş" value={flight} mono />}
      </Section>

      {customer?.phone && (
        <div className="grid grid-cols-2 gap-3">
          <a href={`tel:${customer.phone}`} className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-white text-[16px] font-semibold text-[#007AFF] ring-1 ring-black/[0.06] active:bg-black/[0.03]">
            <Phone size={17} /> Ara
          </a>
          <a
            href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-[14px] bg-white text-[16px] font-semibold text-[#248A3D] ring-1 ring-black/[0.06] active:bg-black/[0.03]"
          >
            <MessageCircle size={17} /> WhatsApp
          </a>
        </div>
      )}

      {/* ── Where ── */}
      <Section title="Güzergah">
        {res.hotel_name && <Row icon={<Navigation size={17} />} tint="bg-[#FF3B30]" label={res.hotel_name} value={res.hotel_address ?? undefined}
          href={res.hotel_address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(res.hotel_address)}` : undefined} />}
        {res.trip_type === "round_trip" && res.return_datetime && (
          <Row icon={<Car size={17} />} tint="bg-[#8E8E93]" label="Dönüş" value={`${fmtDateShort(res.return_datetime)} · ${fmtTime(res.return_datetime)}`} />
        )}
      </Section>

      {/* ── Car ── */}
      {vehicle && (
        <Section title="Araç">
          <Row icon={<Car size={17} />} tint="bg-[#1d1d1f]" label={`${vehicle.brand} ${vehicle.model}`} value={vehicle.plate_number} mono />
        </Section>
      )}

      {/* ── Notes ── */}
      {(res.child_seat || res.welcome_sign || res.notes) && (
        <Section title="Notlar">
          {res.child_seat && <Row icon={<Baby size={17} />} tint="bg-[#34C759]" label="Çocuk koltuğu gerekli" />}
          {res.welcome_sign && <Row icon={<StickyNote size={17} />} tint="bg-[#FF9500]" label="Karşılama tabelası" value={res.welcome_name || "İsim belirtilmedi"} />}
          {res.notes && <Row icon={<StickyNote size={17} />} tint="bg-[#8E8E93]" label="Müşteri notu" value={res.notes} />}
        </Section>
      )}

      {error && <p className="rounded-[14px] bg-[#FFF2F1] px-4 py-3 text-[14px] font-medium text-[#D70015]">{error}</p>}

      {/* ── Primary action ── */}
      {primary && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-[rgba(242,242,247,0.85)] px-4 pt-3 backdrop-blur-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-xl">
            <button
              type="button"
              onClick={primary.onClick}
              disabled={loading}
              className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#007AFF] text-[17px] font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {primary.label}
            </button>
          </div>
        </div>
      )}

      {/* ── Sheets ── */}
      {payUrl && (
        <Sheet
          onClose={() => {
            setPayUrl(null);
            refreshBalance();
          }}
          title="Kartla ödeme"
        >
          <p className="text-center text-[15px] text-[#6e6e73]">Müşteri kendi telefonunun kamerasıyla okutsun.</p>
          <div className="mx-auto my-4 w-fit rounded-[18px] bg-white p-3 ring-1 ring-black/[0.06]">
            <QRCodeCanvas value={payUrl} size={232} />
          </div>
          <p className="text-center text-[28px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">{balance.due != null ? money(balance.due, balance.currency) : ""}</p>
          <p className="mt-2 flex items-center justify-center gap-2 text-[14px] text-[#86868b]">
            <Loader2 size={14} className="animate-spin" /> Ödeme bekleniyor…
          </p>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(payUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#F2F2F7] text-[16px] font-semibold text-[#007AFF]"
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? "Kopyalandı" : "Linki kopyala (WhatsApp'tan gönder)"}
          </button>
        </Sheet>
      )}

      {justPaid && <PaidFlash onDone={() => setJustPaid(false)} />}

      {sheet === "noqr" && (
        <Sheet onClose={() => setSheet(null)} title="QR olmadan başlat">
          <p className="text-[15px] leading-relaxed text-[#6e6e73]">
            Yolcunun adını ve rezervasyon kodunu (<span className="font-mono font-semibold text-[#1d1d1f]">{res.reservation_code}</span>) kontrol ettiyseniz başlatın.
          </p>
          <button
            type="button"
            onClick={() => updateStatus("picked_up")}
            disabled={loading}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#007AFF] text-[16px] font-semibold text-white disabled:opacity-60"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Yolculuğu başlat
          </button>
        </Sheet>
      )}

      {sheet === "complete" && balance.due != null && (
        <Sheet onClose={() => setSheet(null)} title="Ödeme alındı mı?">
          <p className="text-[15px] leading-relaxed text-[#6e6e73]">
            Bu transferde müşteriden <b className="text-[#1d1d1f]">{money(balance.due, balance.currency)}</b> alınacaktı.
          </p>
          <button
            type="button"
            onClick={() => updateStatus("completed")}
            disabled={loading}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#007AFF] text-[16px] font-semibold text-white disabled:opacity-60"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Nakit aldım, tamamla
          </button>
          <button
            type="button"
            onClick={() => {
              setSheet(null);
              openCardPayment();
            }}
            className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#F2F2F7] text-[16px] font-semibold text-[#007AFF]"
          >
            <CreditCard size={17} /> Kartla ödeme al
          </button>
        </Sheet>
      )}
    </div>
  );
}

// ─── pieces ───

function Card({ children }: { children: ReactNode }) {
  return <section className="overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.04]">{children}</section>;
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-medium text-[#86868b]">{children}</p>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 px-4 text-[13px] font-medium uppercase tracking-[0.04em] text-[#86868b]">{title}</h2>
      <div className="divide-y divide-black/[0.06] overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.04]">{children}</div>
    </section>
  );
}

/** A settings-style row: small solid tile with a white glyph, a title, a detail. */
function Row({
  icon,
  tint,
  label,
  value,
  mono,
  href,
}: {
  icon: ReactNode;
  tint: string;
  label: string;
  value?: string;
  mono?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <span className={`grid size-8 shrink-0 place-items-center rounded-[8px] text-white ${tint}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-medium text-[#1d1d1f]">{label}</span>
        {value && <span className={`block break-words text-[14px] text-[#6e6e73] ${mono ? "font-mono tracking-wide" : ""}`}>{value}</span>}
      </span>
      {href && <ChevronRight size={18} className="shrink-0 text-[#c7c7cc]" />}
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 active:bg-black/[0.03]">
      {inner}
    </a>
  ) : (
    <div className="flex items-center gap-3 px-4 py-3">{inner}</div>
  );
}

function Progress({ index }: { index: number }) {
  return (
    <div className="border-t border-black/[0.06] px-4 py-3">
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex-1">
            <div className={`h-1 rounded-full ${i < index ? "bg-[#34C759]" : i === index ? "bg-[#007AFF]" : "bg-[#E5E5EA]"}`} />
            <p className={`mt-1.5 text-[12px] font-medium ${i === index ? "text-[#1d1d1f]" : "text-[#86868b]"}`}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-t-[22px] bg-white px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[22px] sm:pb-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[18px] font-semibold text-[#1d1d1f]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Kapat" className="grid size-8 place-items-center rounded-full bg-[#F2F2F7] text-[#6e6e73]">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** A moment of confirmation when a card payment lands, so the driver cannot miss it. */
function PaidFlash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-full bg-[#34C759] px-5 py-3 text-[16px] font-semibold text-white shadow-lg">
        <CheckCircle2 size={20} /> Ödeme alındı — nakit almayın
      </div>
    </div>
  );
}
