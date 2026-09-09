"use client";

import { useState } from "react";
import {
  Banknote,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Plane,
  Send,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import AssignmentCard from "./AssignmentCard";
import {
  type DriverAssignment,
  type Leg,
  type Reservation,
  customerName,
  fmtDateTime,
  fmtStamp,
  isCash,
  money,
  regionName,
  reservationProfit,
  routeFor,
} from "./types";

interface Props {
  reservation: Reservation;
  onAssign: (leg: Leg) => void;
  onReplaceAssignment: (leg: Leg) => void;
  onUnassign: (assignmentId: string) => void;
  unassigningId: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onCancelAction: (action: "approve" | "reject") => void;
  onSendTelegram: () => void;
  telegramSending: boolean;
  onToast: (message: string, tone?: "ok" | "error") => void;
}

const MENU_ITEM =
  "flex w-full items-center gap-2.5 px-3.5 py-2 text-start text-xs font-medium text-slate-700 hover:bg-slate-50";

/**
 * The open reservation.
 *
 * Reordered around the job rather than around the database. It used to lead
 * with three columns of every field the row holds, then a toolbar of five
 * labelled buttons in three captioned groups, and only then the drivers — so
 * the one thing an open reservation is usually open *for* was last, and
 * nothing on screen read as "do this next".
 *
 * Drivers come first now. The facts that get looked at in passing — who, which
 * flight, which hotel — sit under them on two lines. Everything else is behind
 * "Detayları göster", and the paperwork behind a single menu.
 */
export default function ReservationDetail({
  reservation: r,
  onAssign,
  onReplaceAssignment,
  onUnassign,
  unassigningId,
  onEdit,
  onDelete,
  onCancelAction,
  onSendTelegram,
  telegramSending,
  onToast,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const cash = isCash(r);
  const assignments = [...(r.driver_assignments ?? [])].sort(
    (a, b) => (a.leg === "return" ? 1 : 0) - (b.leg === "return" ? 1 : 0)
  );
  const live = (leg: string) =>
    assignments.find(
      (da: DriverAssignment) =>
        da.leg === leg && ["assigned", "accepted", "picked_up"].includes(da.status)
    );
  const outbound = live("outbound");
  const ret = live("return");
  const assignable = ["paid", "driver_assigned"].includes(r.status);
  const profit = reservationProfit(r);

  const copyCode = async () => {
    await navigator.clipboard.writeText(r.reservation_code);
    setCopiedCode(true);
    onToast("Rezervasyon kodu kopyalandı.");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="border-t border-slate-100 px-5 pb-4 pt-4">
      {r.status === "cancel_requested" && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="mb-1 text-sm font-bold text-rose-800">
            Müşteri iptal talep etti
          </p>
          {r.notes && <p className="mb-3 text-xs text-rose-700">{r.notes}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => onCancelAction("approve")}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              İptali Onayla
            </button>
            <button
              onClick={() => onCancelAction("reject")}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Reddet (aktif tut)
            </button>
          </div>
        </div>
      )}

      {/* ── Drivers: the reason this row gets opened ────────────────────── */}
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Şoförler
        </h4>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Diğer işlemler"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <>
              {/* Closes the menu on any click elsewhere, without a document listener. */}
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute end-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <a
                  href={`/api/voucher?code=${encodeURIComponent(r.reservation_code)}&locale=${r.locale ?? "tr"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={MENU_ITEM}
                  onClick={() => setMenuOpen(false)}
                >
                  <FileText size={13} className="text-slate-400" />
                  Müşteri voucher
                  <ExternalLink size={10} className="ms-auto text-slate-300" />
                </a>
                <a
                  href={`/api/admin/voucher-pdf?code=${encodeURIComponent(r.reservation_code)}&locale=${r.locale ?? "tr"}`}
                  className={MENU_ITEM}
                  onClick={() => setMenuOpen(false)}
                >
                  <Download size={13} className="text-slate-400" />
                  PDF indir
                </a>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSendTelegram();
                  }}
                  disabled={telegramSending}
                  className={`${MENU_ITEM} disabled:opacity-60`}
                >
                  <Send size={13} className="text-sky-500" />
                  {telegramSending ? "Gönderiliyor…" : "Telegram'a gönder"}
                </button>
                <button onClick={copyCode} className={MENU_ITEM}>
                  {copiedCode ? (
                    <Check size={13} className="text-emerald-600" />
                  ) : (
                    <Copy size={13} className="text-slate-400" />
                  )}
                  {copiedCode ? "Kopyalandı" : "Kodu kopyala"}
                </button>

                <div className="my-1 h-px bg-slate-100" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className={MENU_ITEM}
                >
                  <Pencil size={13} className="text-slate-400" />
                  Düzenle
                </button>
                {r.status !== "completed" && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className={`${MENU_ITEM} text-rose-600 hover:bg-rose-50`}
                  >
                    <Trash2 size={13} />
                    {["pending", "cancelled"].includes(r.status)
                      ? "Kaydı sil"
                      : "İptal et"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-2">
          {assignments.map((da) => (
            <AssignmentCard
              key={da.id}
              reservation={r}
              assignment={da}
              unassigning={unassigningId === da.id}
              onReplace={() =>
                onReplaceAssignment(da.leg === "return" ? "return" : "outbound")
              }
              onUnassign={() => onUnassign(da.id)}
              onToast={onToast}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-4 text-center text-xs text-slate-400">
          {assignable
            ? "Henüz şoför atanmadı."
            : "Şoför ataması için rezervasyonun ödenmiş olması gerekir."}
        </p>
      )}

      {assignable && (!outbound || (r.trip_type === "round_trip" && !ret)) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {!outbound && (
            <button
              onClick={() => onAssign("outbound")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <UserPlus size={13} />
              Gidiş şoförü ata
            </button>
          )}
          {r.trip_type === "round_trip" && !ret && (
            <button
              onClick={() => onAssign("return")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold ${
                outbound
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <UserPlus size={13} />
              Dönüş şoförü ata
            </button>
          )}
        </div>
      )}

      {profit !== null && (
        <p className="mt-2.5 text-xs text-slate-500">
          Bu rezervasyondan kalan{" "}
          <strong className={profit < 0 ? "text-rose-600" : "text-emerald-700"}>
            {money(profit)}
          </strong>
        </p>
      )}

      {/* ── The facts worth a glance ───────────────────────────────────── */}
      <div className="mt-4 border-t border-slate-100 pt-3.5">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <UserRound size={13} className="text-slate-400" />
            {customerName(r)}
          </span>
          {r.customers?.phone && (
            <>
              <a
                href={`tel:${r.customers.phone}`}
                className="inline-flex items-center gap-1 hover:text-slate-900"
              >
                <Phone size={12} className="text-slate-400" />
                {r.customers.phone}
              </a>
              <a
                href={`https://wa.me/${r.customers.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <MessageCircle size={11} />
                WhatsApp
              </a>
            </>
          )}
          {r.customers?.email && (
            <a
              href={`mailto:${r.customers.email}`}
              className="inline-flex items-center gap-1 break-all hover:text-slate-900"
            >
              <Mail size={12} className="text-slate-400" />
              {r.customers.email}
            </a>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-slate-500">
          {r.flight_code && (
            <span className="inline-flex items-center gap-1">
              <Plane size={12} className="text-slate-400" />
              {r.flight_code}
              {r.return_flight_code && ` / ${r.return_flight_code}`}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users size={12} className="text-slate-400" />
            {r.adults} yetişkin, {r.children} çocuk
            {r.luggage_count ? ` · ${r.luggage_count} bagaj` : ""}
          </span>
          {r.hotel_name && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin size={12} className="text-slate-400" />
              <span className="truncate">{r.hotel_name}</span>
            </span>
          )}
          {r.child_seat && (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Çocuk koltuğu
            </span>
          )}
          {r.welcome_sign && (
            <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
              Karşılama tabelası{r.welcome_name ? `: ${r.welcome_name}` : ""}
            </span>
          )}
        </div>

        {r.notes && r.status !== "cancel_requested" && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span className="font-bold">Not: </span>
            {r.notes}
          </p>
        )}

        <button
          onClick={() => setDetailsOpen((v) => !v)}
          className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          {detailsOpen ? "Detayları gizle" : "Detayları göster"}
          <ChevronDown
            size={13}
            className={`transition-transform ${detailsOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* ── Everything else ────────────────────────────────────────────── */}
      {detailsOpen && (
        <div className="mt-3.5 grid gap-x-6 gap-y-5 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
          <section>
            <SectionTitle icon={<MapPin size={13} />}>Transfer</SectionTitle>
            <p className="font-semibold text-slate-900">{routeFor(r)}</p>
            <dl className="mt-2 space-y-1.5 text-slate-600">
              <Row label="Gidiş" value={fmtDateTime(r.pickup_datetime)} />
              {r.trip_type === "round_trip" && (
                <>
                  <Row label="Dönüş rotası" value={routeFor(r, "return")} />
                  <Row
                    label="Dönüş"
                    value={r.return_datetime ? fmtDateTime(r.return_datetime) : "—"}
                  />
                </>
              )}
              <Row label="Bölge" value={regionName(r)} />
              <Row label="Araç sınıfı" value={r.vehicle_categories?.name || "—"} />
              {r.hotel_address && <Row label="Adres" value={r.hotel_address} />}
            </dl>
          </section>

          <section>
            <SectionTitle icon={cash ? <Banknote size={13} /> : <CreditCard size={13} />}>
              Ödeme &amp; Fiyat
            </SectionTitle>
            <p className="font-semibold text-slate-900">
              {cash ? "Araçta nakit ödeme" : "Online ödeme"}
            </p>
            <dl className="mt-2 space-y-1.5 text-slate-600">
              {Number(r.base_price) > 0 && (
                <Row label="Temel ücret" value={money(r.base_price)} />
              )}
              {Number(r.night_surcharge) > 0 && (
                <Row label="Gece farkı" value={money(r.night_surcharge)} />
              )}
              {Number(r.child_seat_fee) > 0 && (
                <Row label="Çocuk koltuğu" value={money(r.child_seat_fee)} />
              )}
              {Number(r.round_trip_discount) > 0 && (
                <Row
                  label="Gidiş-dönüş indirimi"
                  value={`−${money(r.round_trip_discount)}`}
                />
              )}
              {Number(r.coupon_discount) > 0 && (
                <Row label="Kupon indirimi" value={`−${money(r.coupon_discount)}`} />
              )}
              <Row label="Toplam" value={money(r.total_price)} strong />
              {cash && (
                <>
                  <Row label="Alınan kapora" value={money(r.deposit_amount)} />
                  <Row
                    label="Şoför tahsil edecek"
                    value={money(r.driver_amount)}
                    strong
                    tone="orange"
                  />
                </>
              )}
            </dl>
            <p className="mt-2 text-[11px] text-slate-400">
              Kayıt: {fmtStamp(r.created_at)}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
      {icon}
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "orange";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd
        className={`text-end text-xs ${
          tone === "orange"
            ? "text-orange-600"
            : strong
              ? "text-slate-900"
              : "text-slate-600"
        } ${strong ? "font-bold" : "font-medium"}`}
      >
        {value}
      </dd>
    </div>
  );
}
