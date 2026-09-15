"use client";

import { useState, type ReactNode } from "react";
import {
  Building2,
  CalendarClock,
  Download,
  FileText,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  PlaneLanding,
  PlaneTakeoff,
  Send,
  Trash2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { formatInstant } from "@/lib/datetime";
import { convertSettlement, settlementOf, type Settlement } from "@/lib/currency";
import { ASSIGNABLE_STATUSES } from "@/lib/reservation-status";
import { legEndpoints } from "@/lib/transfer-route";
import {
  Button,
  Chip,
  ConfirmDialog,
  DrawerSection,
  IconButton,
  Menu,
  QuickAction,
  ReservationStatusChip,
  cx,
  useToast,
} from "@/components/admin/ui";
import AssignDriverPanel, { type AssignResult } from "./AssignDriverPanel";
import AssignmentBlock from "./AssignmentBlock";
import DriverLinkDialog from "./DriverLinkDialog";
import EditReservationDialog from "./EditReservationDialog";
import {
  type Leg,
  type Reservation,
  type ReservationDetail,
  customerName,
  dayHeading,
  dayKey,
  fmtStamp,
  fmtTime,
  isArrivalLeg,
  isCash,
  legDateTime,
  legFlight,
  legsOf,
  liveAssignment,
  LIVE_ASSIGNMENT_STATUSES,
  moneyText,
  regionName,
  reservationProfit,
} from "./types";

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "İşlem yapılamadı.");
  }
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : "İşlem yapılamadı.");

export interface ReservationPanelParts {
  top: ReactNode;
  title: ReactNode;
  meta: ReactNode;
  quick: ReactNode;
  body: ReactNode;
  footer: ReactNode;
  /** Rendered outside the drawer, so a dialog covers the whole screen. */
  dialogs: ReactNode;
}

/**
 * Everything about one reservation, as the parts a drawer or a full page lays
 * out: header, quick actions, sections, footer. The drawer beside the list and
 * `/admin/reservations/[kod]` both build from here, so they cannot drift apart.
 */
export function useReservationPanel(
  detail: ReservationDetail,
  {
    onChanged,
    onRemoved,
    initialAssignLeg = null,
  }: { onChanged: () => void; onRemoved: () => void; initialAssignLeg?: Leg | null }
): ReservationPanelParts {
  const r = detail.reservation;
  const toast = useToast();
  const [assignLeg, setAssignLeg] = useState<Leg | null>(initialAssignLeg);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<null | "delete" | "approve">(null);
  const [busy, setBusy] = useState<null | "telegram" | "delete" | "approve" | "reject">(null);
  const [handover, setHandover] = useState<AssignResult | null>(null);

  const code = r.reservation_code;
  const currency = settlementOf(r.currency);
  const cash = isCash(r);
  const assignable = ASSIGNABLE_STATUSES.includes(r.status);
  const hardDelete = ["pending", "cancelled"].includes(r.status);
  const phone = r.customers?.phone ?? "";
  const digits = phone.replace(/[^0-9]/g, "");
  const locale = r.locale ?? "tr";
  const voucherHref = `/api/voucher?code=${encodeURIComponent(code)}&locale=${locale}`;
  const pdfHref = `/api/admin/voucher-pdf?code=${encodeURIComponent(code)}&locale=${locale}`;

  const sendTelegram = async () => {
    setBusy("telegram");
    try {
      await post("/api/admin/send-to-telegram", { reservationId: r.id });
      toast("Şoför grubuna gönderildi.");
    } catch (e) {
      toast(errorText(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const cancelAction = async (action: "approve" | "reject") => {
    setBusy(action);
    try {
      await post("/api/admin/cancel-action", { reservation_id: r.id, action });
      toast(action === "approve" ? "İptal onaylandı." : "İptal talebi reddedildi.");
      setConfirm(null);
      onChanged();
    } catch (e) {
      toast(errorText(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await post("/api/admin/delete-reservation", { reservationId: r.id });
      toast(hardDelete ? "Kayıt silindi." : "Rezervasyon iptal edildi.");
      setConfirm(null);
      if (hardDelete) onRemoved();
      else onChanged();
    } catch (e) {
      toast(errorText(e), "error");
    } finally {
      setBusy(null);
    }
  };

  const pax = (r.adults ?? 0) + (r.children ?? 0);

  const top = (
    <>
      <span className="font-mono text-[13px] font-semibold text-adm-ink">{code}</span>
      <ReservationStatusChip status={r.status} />
      {r.trip_type === "round_trip" && <Chip plain>Gidiş-dönüş</Chip>}
    </>
  );

  const meta = [
    r.locale ? r.locale.toUpperCase() : null,
    `${pax} yolcu`,
    r.luggage_count ? `${r.luggage_count} bavul` : null,
    regionName(r),
  ]
    .filter(Boolean)
    .join(" · ");

  const quick = (
    <>
      <QuickAction
        icon={MessageCircle}
        label="WhatsApp"
        href={digits ? `https://wa.me/${digits}` : undefined}
        newTab
        disabled={!digits}
      />
      <QuickAction icon={Phone} label="Ara" href={phone ? `tel:${phone}` : undefined} disabled={!phone} />
      <QuickAction icon={FileText} label="Voucher" href={voucherHref} newTab />
      <QuickAction icon={Send} label="Telegram" onClick={sendTelegram} loading={busy === "telegram"} />
    </>
  );

  // ─── money ───
  const liveAssignments = (r.driver_assignments ?? []).filter((da) => LIVE_ASSIGNMENT_STATUSES.includes(da.status));
  const fees = liveAssignments
    .filter((da) => da.driver_fee != null)
    .map((da) => {
      const feeCurrency = settlementOf(da.driver_fee_currency);
      const amount = Number(da.driver_fee) || 0;
      return {
        amount,
        currency: feeCurrency,
        inFare: convertSettlement(amount, feeCurrency, currency, r.exchange_rate_usd, r.exchange_rate_eur),
      };
    });
  const unpriced = liveAssignments.length - fees.length;
  const feesInFare = fees.every((f) => f.inFare !== null) ? fees.reduce((sum, f) => sum + (f.inFare ?? 0), 0) : null;
  const profit = reservationProfit(r);
  const noteVisible = !!r.notes && r.status !== "cancel_requested";
  const history = buildHistory(r);

  const body = (
    <>
      {r.status === "cancel_requested" && (
        <div className="rounded-adm border border-[#f6c9d1] bg-adm-rose-soft p-3.5">
          <p className="text-[13.5px] font-semibold text-adm-rose">Müşteri iptal talep etti</p>
          {r.notes && <p className="mt-1 whitespace-pre-line text-[13px] text-[#7a1a2c]">{r.notes}</p>}
          <p className="mt-1 text-xs text-[#7a1a2c]/80">
            Onaylanınca rezervasyon iptal edilir ve şoför atamaları kapanır. Ödeme iadesi Stripe panelinden yapılır.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" loading={busy === "reject"} onClick={() => cancelAction("reject")}>
              Reddet
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirm("approve")}>
              İptali onayla
            </Button>
          </div>
        </div>
      )}

      <DrawerSection title="Yolculuk">
        <div className="grid gap-3">
          {legsOf(r).map((leg) => (
            <LegCard
              key={leg}
              reservation={r}
              leg={leg}
              detail={detail}
              assignable={assignable}
              assigning={assignLeg === leg}
              onAssign={() => setAssignLeg(leg)}
              onCloseAssign={() => setAssignLeg(null)}
              onAssigned={(result) => {
                setAssignLeg(null);
                setHandover(result);
                onChanged();
              }}
              onChanged={onChanged}
            />
          ))}
        </div>
      </DrawerSection>

      <DrawerSection title="Para">
        <div className="grid grid-cols-2 gap-2.5">
          <Fact
            label="Müşteri ödemesi"
            value={moneyText(r.total_price, currency)}
            sub={r.status === "pending" ? "Ödeme bekliyor" : cash ? "Nakit · kapora online" : "Online"}
            subTone={r.status === "pending" ? "rose" : undefined}
          />
          {cash && (
            <Fact
              label="Şoförde kalan"
              value={moneyText(r.driver_amount, currency)}
              tone="amber"
              sub={`Kapora ${moneyText(r.deposit_amount, currency)}`}
            />
          )}
          <Fact
            label="Şoförlere"
            value={fees.length ? fees.map((f) => moneyText(f.amount, f.currency)).join(" + ") : "—"}
            sub={
              unpriced > 0
                ? `${unpriced} bacağın ücreti girilmedi`
                : fees.some((f) => f.currency !== currency) && feesInFare !== null
                  ? `≈ ${moneyText(feesInFare, currency)}`
                  : undefined
            }
            subTone={unpriced > 0 ? "amber" : undefined}
          />
          <Fact
            label="Bize kalan"
            value={profit === null ? "—" : moneyText(profit, currency)}
            tone={profit === null ? undefined : profit < 0 ? "rose" : "green"}
            sub={
              profit !== null
                ? undefined
                : liveAssignments.length === 0
                  ? "Şoför atanınca hesaplanır"
                  : unpriced > 0
                    ? "Ücretler girilince hesaplanır"
                    : "Kur kaydı yok"
            }
          />
        </div>
        <PriceBreakdown r={r} currency={currency} />
      </DrawerSection>

      <DrawerSection title="Müşteri">
        <ul className="grid gap-1.5 text-[13px] text-adm-ink-2">
          {r.customers?.email && (
            <ContactRow icon={Mail}>
              <a href={`mailto:${r.customers.email}`} className="break-all hover:text-adm-ink">
                {r.customers.email}
              </a>
            </ContactRow>
          )}
          {phone && (
            <ContactRow icon={Phone}>
              <a href={`tel:${phone}`} className="hover:text-adm-ink">
                {phone}
              </a>
              {digits && (
                <a
                  href={`https://wa.me/${digits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ms-2 text-xs font-semibold text-adm-brand-ink hover:underline"
                >
                  WhatsApp
                </a>
              )}
            </ContactRow>
          )}
          {r.locale && <ContactRow icon={Globe}>Dil: {r.locale.toUpperCase()}</ContactRow>}
          {r.hotel_name && <ContactRow icon={Building2}>{r.hotel_name}</ContactRow>}
          {r.hotel_address && <ContactRow icon={MapPin}>{r.hotel_address}</ContactRow>}
          <ContactRow icon={CalendarClock}>Kayıt {fmtStamp(r.created_at)}</ContactRow>
        </ul>
      </DrawerSection>

      {(noteVisible || r.child_seat || r.welcome_sign) && (
        <DrawerSection title="Not">
          {noteVisible && (
            <p className="whitespace-pre-line rounded-adm bg-[#fff8e8] px-3 py-2.5 text-[13px] text-[#6b4b0c]">{r.notes}</p>
          )}
          {(r.child_seat || r.welcome_sign) && (
            <div className={cx("flex flex-wrap gap-1.5", noteVisible && "mt-2")}>
              {r.child_seat && (
                <Chip tone="green" plain>
                  Çocuk koltuğu
                </Chip>
              )}
              {r.welcome_sign && (
                <Chip tone="blue" plain>
                  Karşılama tabelası{r.welcome_name ? `: ${r.welcome_name}` : ""}
                </Chip>
              )}
            </div>
          )}
        </DrawerSection>
      )}

      <DrawerSection title="Geçmiş">
        <ol className="grid">
          {history.map((h, i) => (
            <li key={`${h.at}-${i}`} className="grid grid-cols-[16px_1fr_auto] items-start gap-2.5 py-1.5 text-[12.5px]">
              <span
                aria-hidden="true"
                className={cx("ms-1 mt-[5px] size-2 rounded-full", i === history.length - 1 ? "bg-adm-brand" : "bg-[#cfcec8]")}
              />
              <span className="text-adm-ink-2">{h.text}</span>
              <span className="whitespace-nowrap text-adm-faint">{formatInstant(h.at)}</span>
            </li>
          ))}
        </ol>
      </DrawerSection>
    </>
  );

  const footer = (
    <>
      <Button icon={Pencil} onClick={() => setEditing(true)}>
        Düzenle
      </Button>
      <Menu
        side="top"
        align="start"
        items={[
          { label: "Müşteri voucher", icon: FileText, href: voucherHref, newTab: true },
          { label: "PDF indir", icon: Download, href: pdfHref },
          { label: "Telegram'a gönder", icon: Send, onSelect: sendTelegram, disabled: busy === "telegram" },
        ]}
        trigger={({ open, toggle }) => (
          <IconButton icon={MoreHorizontal} label="Diğer işlemler" aria-expanded={open} onClick={toggle} />
        )}
      />
      {r.status !== "completed" && (
        <Button variant="danger-ghost" icon={Trash2} className="ms-auto" onClick={() => setConfirm("delete")}>
          {hardDelete ? "Kaydı sil" : "İptal et"}
        </Button>
      )}
    </>
  );

  const dialogs = (
    <>
      {editing && (
        <EditReservationDialog
          reservation={r}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChanged();
          }}
        />
      )}
      {handover && <DriverLinkDialog {...handover} onClose={() => setHandover(null)} />}
      <ConfirmDialog
        open={confirm === "delete"}
        title={hardDelete ? "Kaydı sil" : "Rezervasyonu iptal et"}
        message={
          hardDelete
            ? `${code} · ${customerName(r)} kalıcı olarak silinecek.`
            : `${code} · ${customerName(r)} iptal edilecek. Ödeme iadesi gerekiyorsa Stripe panelinden yapılır.`
        }
        confirmLabel={hardDelete ? "Kaydı sil" : "İptal et"}
        danger
        busy={busy === "delete"}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "approve"}
        title="İptali onayla"
        message="Rezervasyon iptal edilecek ve şoför atamaları kapanacak. Ödeme iadesi Stripe panelinden ayrıca yapılır."
        confirmLabel="İptali onayla"
        danger
        busy={busy === "approve"}
        onConfirm={() => cancelAction("approve")}
        onClose={() => setConfirm(null)}
      />
    </>
  );

  return { top, title: customerName(r), meta, quick, body, footer, dialogs };
}

// ─── pieces ───

function LegCard({
  reservation: r,
  leg,
  detail,
  assignable,
  assigning,
  onAssign,
  onCloseAssign,
  onAssigned,
  onChanged,
}: {
  reservation: Reservation;
  leg: Leg;
  detail: ReservationDetail;
  assignable: boolean;
  assigning: boolean;
  onAssign: () => void;
  onCloseAssign: () => void;
  onAssigned: (result: AssignResult) => void;
  onChanged: () => void;
}) {
  const at = legDateTime(r, leg);
  const arrival = isArrivalLeg(r, leg);
  const { from, to } = legEndpoints(r.direction, leg, regionName(r));
  const hotel = [r.hotel_name, r.hotel_address].filter(Boolean).join(" · ");
  const flight = legFlight(r, leg);
  const live = liveAssignment(r, leg);
  const assignments = (r.driver_assignments ?? [])
    .filter((da) => da.leg === leg)
    .sort(
      (a, b) =>
        Number(LIVE_ASSIGNMENT_STATUSES.includes(b.status)) - Number(LIVE_ASSIGNMENT_STATUSES.includes(a.status))
    );
  const Icon = arrival ? PlaneLanding : PlaneTakeoff;

  return (
    <div className="rounded-xl border border-adm-line">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-t-xl border-b border-adm-line-2 bg-adm-surface-2 px-3.5 py-2.5 text-[12.5px]">
        <Icon size={15} aria-hidden="true" className={arrival ? "text-adm-blue" : "text-adm-violet"} />
        <b className="font-semibold">{leg === "return" ? "Dönüş" : "Gidiş"}</b>
        <span className="text-adm-muted">
          {arrival ? "Karşılama" : "Çıkış"} · {dayHeading(dayKey(at))} ·{" "}
          <span className="font-semibold tabular-nums text-adm-ink-2">{fmtTime(at)}</span>
        </span>
        {flight && <span className="ms-auto font-mono text-xs font-semibold">{flight}</span>}
      </div>

      <div className="grid grid-cols-[14px_1fr] gap-x-2.5 px-3.5 pb-1 pt-3">
        <span aria-hidden="true" className="mt-[5px] size-2.5 rounded-full border-2 border-adm-ink bg-adm-surface" />
        <Place name={from} sub={arrival ? undefined : hotel} />
        <span
          aria-hidden="true"
          className="ms-[4px] h-4 w-0.5 bg-[repeating-linear-gradient(to_bottom,#cfcec8_0_3px,transparent_3px_6px)]"
        />
        <span />
        <span aria-hidden="true" className="mt-[5px] size-2.5 rounded-full border-2 border-adm-ink bg-adm-ink" />
        <Place name={to} sub={arrival ? hotel : undefined} />
      </div>

      <div className="grid gap-2 px-3.5 pb-3.5 pt-2">
        {assignments.map((da) => (
          <AssignmentBlock key={da.id} reservation={r} assignment={da} onReplace={onAssign} onChanged={onChanged} />
        ))}
        {!live && !assigning && assignable && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-adm-amber">Şoför atanmadı</span>
            <Button size="sm" variant="primary" icon={UserPlus} className="ms-auto" onClick={onAssign}>
              Şoför ata
            </Button>
          </div>
        )}
        {!live && !assignable && assignments.length === 0 && (
          <p className="text-[12.5px] text-adm-muted">
            {r.status === "pending" ? "Ödeme alınmadan şoför atanamaz." : "Şoför atanmadı."}
          </p>
        )}
        {assigning && (
          <AssignDriverPanel
            reservation={r}
            nearby={detail.nearby}
            drivers={detail.drivers}
            vehicles={detail.vehicles}
            leg={leg}
            onClose={onCloseAssign}
            onAssigned={onAssigned}
          />
        )}
      </div>
    </div>
  );
}

function Place({ name, sub }: { name: string; sub?: string }) {
  return (
    <div className="min-w-0 text-[13.5px] font-semibold">
      {name}
      {sub && <span className="block truncate text-xs font-normal text-adm-muted">{sub}</span>}
    </div>
  );
}

const TONE_CLASS = { green: "text-adm-green", amber: "text-adm-amber", rose: "text-adm-rose" };

function Fact({
  label,
  value,
  sub,
  tone,
  subTone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: keyof typeof TONE_CLASS;
  subTone?: keyof typeof TONE_CLASS;
}) {
  return (
    <div className="min-w-0 rounded-adm border border-adm-line-2 bg-adm-surface-2 px-3 py-2.5">
      <div className="text-[11.5px] text-adm-muted">{label}</div>
      <div className={cx("truncate text-sm font-semibold tabular-nums", tone ? TONE_CLASS[tone] : "text-adm-ink")}>
        {value}
      </div>
      {sub && <div className={cx("text-[11.5px]", subTone ? TONE_CLASS[subTone] : "text-adm-muted")}>{sub}</div>}
    </div>
  );
}

function ContactRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Icon size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-adm-faint" />
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function PriceBreakdown({ r, currency }: { r: Reservation; currency: Settlement }) {
  const lines: [string, number][] = (
    [
      ["Temel ücret", Number(r.base_price) || 0],
      ["Gece farkı", Number(r.night_surcharge) || 0],
      ["Çocuk koltuğu", Number(r.child_seat_fee) || 0],
      ["Gidiş-dönüş indirimi", -(Number(r.round_trip_discount) || 0)],
      ["Kupon indirimi", -(Number(r.coupon_discount) || 0)],
    ] as [string, number][]
  ).filter(([, value]) => value !== 0);

  if (lines.length === 0) return null;

  return (
    <dl className="mt-2.5">
      {lines.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 border-t border-dashed border-adm-line py-1.5 text-[12.5px]">
          <dt className="text-adm-muted">{label}</dt>
          <dd className="tabular-nums text-adm-ink-2">{moneyText(value, currency)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-3 border-t border-dashed border-adm-line py-1.5 text-[13px]">
        <dt className="font-semibold">Toplam</dt>
        <dd className="font-semibold tabular-nums">{moneyText(r.total_price, currency)}</dd>
      </div>
    </dl>
  );
}

/**
 * The booking's timeline, pieced together from the timestamps it already has.
 * A proper event log (who changed what) is on the list for later.
 */
function buildHistory(r: Reservation) {
  const events: { at: string; text: string }[] = [{ at: r.created_at, text: "Rezervasyon oluşturuldu" }];
  for (const da of r.driver_assignments ?? []) {
    const who = `${da.drivers?.full_name ?? "Şoför"} · ${da.leg === "return" ? "dönüş" : "gidiş"}`;
    if (da.assigned_at) events.push({ at: da.assigned_at, text: `Şoföre gönderildi — ${who}` });
    if (da.accepted_at) events.push({ at: da.accepted_at, text: `Şoför kabul etti — ${who}` });
    if (da.picked_up_at) events.push({ at: da.picked_up_at, text: `Yolcu alındı — ${who}` });
    if (da.completed_at) events.push({ at: da.completed_at, text: `Tamamlandı — ${who}` });
  }
  return events
    .filter((e) => e.at)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
