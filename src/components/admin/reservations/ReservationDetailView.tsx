"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Send,
  Trash2,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import ActionMenu, {
  MENU_ITEM,
  MENU_ITEM_DANGER,
  MenuSeparator,
} from "./ActionMenu";
import AssignDriverModal from "./AssignDriverModal";
import AssignmentCard from "./AssignmentCard";
import DriverLinkModal from "./DriverLinkModal";
import EditReservationModal from "./EditReservationModal";
import {
  type Driver,
  type DriverAssignment,
  type Leg,
  type Reservation,
  type Vehicle,
  customerName,
  fmtDateTime,
  fmtStamp,
  isCash,
  money,
  regionName,
  reservationProfit,
  routeFor,
  statusMeta,
} from "./types";

interface Props {
  reservation: Reservation;
  /** Bookings around the same date — the assign panel reads each driver's load. */
  nearbyReservations: Reservation[];
  drivers: Driver[];
  vehicles: Vehicle[];
  /** "/tr/admin" — computed on the server so the link never guesses a locale. */
  adminBase: string;
}

/**
 * One reservation, on its own page.
 *
 * It used to be an expansion inside the list, which on a phone meant the row
 * grew to several screens, pushed everything after it down, and had no way out
 * but scrolling back to the row you started from. A page gets the whole width,
 * a URL that can be sent to someone, and a back button that means back.
 *
 * Nothing is hidden here. The list is the place to be brief; this is the place
 * you came to because you needed the detail.
 */
export default function ReservationDetailView({
  reservation: r,
  nearbyReservations,
  drivers,
  vehicles,
  adminBase,
}: Props) {
  const router = useRouter();
  const [assignLeg, setAssignLeg] = useState<Leg | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);
  const [telegramSending, setTelegramSending] = useState(false);
  const [linkModal, setLinkModal] = useState<{
    driverLink: string;
    whatsappUrl: string;
    driverName: string;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "ok" | "error" } | null>(
    null
  );

  const showToast = (message: string, tone: "ok" | "error" = "ok") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const cash = isCash(r);
  const meta = statusMeta(r.status);
  const listHref = `${adminBase}/reservations`;

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

  const driverStatus = (() => {
    if (!assignable) return { label: "—", tone: undefined as "ok" | "warning" | undefined };
    const needsReturn = r.trip_type === "round_trip" && !ret;
    if (outbound && !needsReturn) return { label: "Atandı", tone: "ok" as const };
    if (outbound && needsReturn) return { label: "Dönüş bekliyor", tone: "warning" as const };
    return { label: "Bekliyor", tone: "warning" as const };
  })();

  const unassign = async (assignmentId: string) => {
    if (!window.confirm("Bu şoför ataması kaldırılsın mı? Şoförün linki geçersiz olacak."))
      return;
    setUnassigningId(assignmentId);
    const res = await fetch("/api/admin/unassign-driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId }),
    });
    setUnassigningId(null);
    if (res.ok) {
      showToast("Şoför ataması kaldırıldı.");
      router.refresh();
    } else {
      const d = await res.json().catch(() => null);
      showToast(d?.error ?? "Atama kaldırılamadı.", "error");
    }
  };

  const sendToTelegram = async () => {
    setTelegramSending(true);
    const res = await fetch("/api/admin/send-to-telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: r.id }),
    });
    setTelegramSending(false);
    if (res.ok) showToast("Şoför grubuna gönderildi.");
    else {
      const d = await res.json().catch(() => null);
      showToast(d?.error ?? "Telegram'a gönderilemedi.", "error");
    }
  };

  const cancelAction = async (action: "approve" | "reject") => {
    const res = await fetch("/api/admin/cancel-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservation_id: r.id, action }),
    });
    if (res.ok) {
      showToast(action === "approve" ? "İptal onaylandı." : "İptal talebi reddedildi.");
      router.refresh();
    } else {
      const d = await res.json().catch(() => null);
      showToast(d?.error ?? "İşlem başarısız.", "error");
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    const res = await fetch("/api/admin/delete-reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: r.id }),
    });
    setDeleting(false);
    setDeleteOpen(false);
    if (res.ok) {
      // The row this page describes is gone or cancelled; the list is where to land.
      router.push(listHref);
      router.refresh();
    } else {
      const d = await res.json().catch(() => null);
      showToast(d?.error ?? "İşlem başarısız.", "error");
    }
  };

  return (
    <div className="pb-16">
      <Link
        href={listHref}
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} />
        Rezervasyonlar
      </Link>

      {/* ── Header ─────────────────────────────────────────────────────
          Deliberately no overflow-hidden: the action menu opens out of this
          box, and clipping it was what cut the menu in half. The rounded
          bottom corners live on the summary strip instead. */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3 p-4 sm:gap-4 sm:p-5">
          <div className="min-w-0">
            <h1 className="font-mono text-xl font-bold tracking-wide text-slate-900 sm:text-2xl">
              {r.reservation_code}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.chip}`}
              >
                {meta.label}
              </span>
              {r.trip_type === "round_trip" && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Gidiş-Dönüş
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  cash
                    ? "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {cash ? <Banknote size={11} /> : <CreditCard size={11} />}
                {cash ? "Nakit" : "Online"}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-2">
            <div className="text-end">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Toplam
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {money(r.total_price)}
              </span>
              {/* On a cash booking the figure above is not what we hold — the
                  driver collects the rest at the airport. */}
              {cash && Number(r.driver_amount) > 0 && (
                <span className="mt-0.5 block whitespace-nowrap text-[10px] font-semibold text-orange-600">
                  Şoförde {money(r.driver_amount)}
                </span>
              )}
            </div>

            <ActionMenu>
              {(close) => (
                <>
                  <a
                    href={`/api/voucher?code=${encodeURIComponent(r.reservation_code)}&locale=${r.locale ?? "tr"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={MENU_ITEM}
                    onClick={close}
                  >
                    <FileText size={15} className="text-slate-400" />
                    Müşteri voucher
                    <ExternalLink size={11} className="ms-auto text-slate-300" />
                  </a>
                  <a
                    href={`/api/admin/voucher-pdf?code=${encodeURIComponent(r.reservation_code)}&locale=${r.locale ?? "tr"}`}
                    className={MENU_ITEM}
                    onClick={close}
                  >
                    <Download size={15} className="text-slate-400" />
                    PDF indir
                  </a>
                  <button
                    onClick={() => {
                      close();
                      sendToTelegram();
                    }}
                    disabled={telegramSending}
                    className={`${MENU_ITEM} disabled:opacity-60`}
                  >
                    <Send size={15} className="text-sky-500" />
                    {telegramSending ? "Gönderiliyor…" : "Telegram'a gönder"}
                  </button>

                  <MenuSeparator />

                  <button
                    onClick={() => {
                      close();
                      setEditing(true);
                    }}
                    className={MENU_ITEM}
                  >
                    <Pencil size={15} className="text-slate-400" />
                    Düzenle
                  </button>
                  {r.status !== "completed" && (
                    <button
                      onClick={() => {
                        close();
                        setDeleteOpen(true);
                      }}
                      className={MENU_ITEM_DANGER}
                    >
                      <Trash2 size={15} />
                      {["pending", "cancelled"].includes(r.status)
                        ? "Kaydı sil"
                        : "İptal et"}
                    </button>
                  )}
                </>
              )}
            </ActionMenu>
          </div>
        </div>

        {/* The four facts you check before doing anything else. They used to be
            repeated word for word in a subtitle directly above this strip. */}
        <div className="grid grid-cols-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 sm:grid-cols-4">
          <SummaryItem label="Alış" value={fmtDateTime(r.pickup_datetime)} />
          <SummaryItem label="Rota" value={routeFor(r)} />
          <SummaryItem label="Müşteri" value={customerName(r)} />
          <SummaryItem
            label="Şoför"
            value={driverStatus.label}
            tone={driverStatus.tone}
          />
        </div>
      </div>


      {r.status === "cancel_requested" && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="mb-1 text-sm font-bold text-rose-800">Müşteri iptal talep etti</p>
          {r.notes && <p className="mb-3 text-xs text-rose-700">{r.notes}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => cancelAction("approve")}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              İptali Onayla
            </button>
            <button
              onClick={() => cancelAction("reject")}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Reddet (aktif tut)
            </button>
          </div>
        </div>
      )}

      {/* ── Drivers ────────────────────────────────────────────────────── */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Şoförler
        </h2>

        {assignments.length > 0 ? (
          <div className="space-y-2">
            {assignments.map((da) => (
              <AssignmentCard
                key={da.id}
                reservation={r}
                assignment={da}
                unassigning={unassigningId === da.id}
                onReplace={() => setAssignLeg(da.leg === "return" ? "return" : "outbound")}
                onUnassign={() => unassign(da.id)}
                onToast={showToast}
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

        {assignable && !assignLeg && (!outbound || (r.trip_type === "round_trip" && !ret)) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!outbound && (
              <button
                onClick={() => setAssignLeg("outbound")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <UserPlus size={13} />
                Gidiş şoförü ata
              </button>
            )}
            {r.trip_type === "round_trip" && !ret && (
              <button
                onClick={() => setAssignLeg("return")}
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
          <p className="mt-3 text-xs text-slate-500">
            Bu rezervasyondan kalan{" "}
            <strong className={profit < 0 ? "text-rose-600" : "text-emerald-700"}>
              {money(profit)}
            </strong>
          </p>
        )}

        {/* The assign flow opens here rather than over the page — see `inline`. */}
        {assignLeg && (
          <div className="mt-3">
            <AssignDriverModal
              reservation={r}
              allReservations={nearbyReservations}
              drivers={drivers}
              vehicles={vehicles}
              initialLeg={assignLeg}
              inline
              onClose={() => setAssignLeg(null)}
              onAssigned={(result) => {
                setAssignLeg(null);
                setLinkModal(result);
                router.refresh();
              }}
            />
          </div>
        )}
      </section>

      {/* ── Everything about the booking ───────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Müşteri" icon={<UserRound size={13} />}>
          <p className="text-sm font-semibold text-slate-900">{customerName(r)}</p>
          {r.customers?.email && (
            <a
              href={`mailto:${r.customers.email}`}
              className="mt-2 flex items-center gap-2 break-all text-sm text-slate-600 hover:text-slate-900"
            >
              <Mail size={13} className="shrink-0 text-slate-400" />
              {r.customers.email}
            </a>
          )}
          {r.customers?.phone && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <a
                href={`tel:${r.customers.phone}`}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <Phone size={13} className="shrink-0 text-slate-400" />
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
            </div>
          )}
          <p className="mt-2 text-[11px] text-slate-400">Kayıt: {fmtStamp(r.created_at)}</p>
        </Panel>

        <Panel title="Transfer" icon={<MapPin size={13} />}>
          <p className="text-sm font-semibold text-slate-900">{routeFor(r)}</p>
          <dl className="mt-2 space-y-1.5">
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
            <Row label="Uçuş" value={r.flight_code || "—"} />
            {r.return_flight_code && (
              <Row label="Dönüş uçuşu" value={r.return_flight_code} />
            )}
            <Row label="Araç sınıfı" value={r.vehicle_categories?.name || "—"} />
            <Row
              label="Yolcu"
              value={`${r.adults} yetişkin, ${r.children} çocuk${
                r.luggage_count ? ` · ${r.luggage_count} bagaj` : ""
              }`}
            />
            {r.hotel_name && <Row label="Otel" value={r.hotel_name} />}
            {r.hotel_address && <Row label="Adres" value={r.hotel_address} />}
          </dl>
          <div className="mt-2 flex flex-wrap gap-1.5">
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
        </Panel>

        <Panel
          title="Ödeme &amp; Fiyat"
          icon={cash ? <Banknote size={13} /> : <CreditCard size={13} />}
        >
          <p className="text-sm font-semibold text-slate-900">
            {cash ? "Araçta nakit ödeme" : "Online ödeme"}
          </p>
          <dl className="mt-2 space-y-1.5">
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
              <Row label="Gidiş-dönüş indirimi" value={`−${money(r.round_trip_discount)}`} />
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
        </Panel>
      </div>

      {r.notes && r.status !== "cancel_requested" && (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
            Müşteri notu
          </p>
          <p className="mt-0.5 text-sm text-amber-900">{r.notes}</p>
        </div>
      )}

      {/* ── Overlays ───────────────────────────────────────────────────── */}
      {editing && (
        <EditReservationModal
          reservation={r}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
          onToast={showToast}
        />
      )}

      {linkModal && (
        <DriverLinkModal
          driverLink={linkModal.driverLink}
          whatsappUrl={linkModal.whatsappUrl}
          driverName={linkModal.driverName}
          onClose={() => setLinkModal(null)}
          onToast={showToast}
        />
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {["pending", "cancelled"].includes(r.status)
                  ? "Kaydı sil"
                  : "Rezervasyonu iptal et"}
              </h3>
              <button
                onClick={() => setDeleteOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-5 text-sm text-slate-600">
              <span className="font-mono font-semibold">{r.reservation_code}</span> —{" "}
              {customerName(r)}.{" "}
              {["pending", "cancelled"].includes(r.status)
                ? "Bu kayıt kalıcı olarak silinecek."
                : "Rezervasyon iptal edilecek."}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Vazgeç
              </button>
              <button
                onClick={doDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "İşleniyor…" : "Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-5 start-1/2 z-[60] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg ${
            toast.tone === "error" ? "bg-rose-600 text-white" : "bg-slate-900 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warning";
}) {
  return (
    <div className="min-w-0 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-e sm:last:border-e-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p
        className={`mt-1 truncate text-xs font-semibold ${
          tone === "ok"
            ? "text-emerald-700"
            : tone === "warning"
              ? "text-amber-700"
              : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {icon}
        {title}
      </div>
      {children}
    </section>
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
