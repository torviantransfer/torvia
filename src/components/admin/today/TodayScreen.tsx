"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Banknote, MessageCircle, Plane, UserPlus, Users, Wallet, XCircle } from "lucide-react";
import { formatBookingDateShort } from "@/lib/datetime";
import { settlementOf } from "@/lib/currency";
import { ASSIGNABLE_STATUSES } from "@/lib/reservation-status";
import {
  AssignButton,
  Button,
  ButtonLink,
  Card,
  Chip,
  ConfirmDialog,
  Delta,
  EmptyState,
  InboxItem,
  PageHeader,
  Person,
  Segmented,
  StatStrip,
  TimelineHour,
  TimelineItem,
  buttonClass,
  cx,
  textLinkClass,
  useToast,
  type StatItem,
} from "@/components/admin/ui";
import ReservationDrawer from "@/components/admin/reservations/ReservationDrawer";
import {
  type Leg,
  type Reservation,
  customerName,
  dayHeading,
  dayKey,
  fmtTime,
  isArrivalLeg,
  isCash,
  legFlight,
  liveAssignment,
  moneyText,
  shortRouteFor,
} from "@/components/admin/reservations/types";
import type { DriverDay, TodayData, TodayLeg } from "@/lib/todayData";

const INBOX_LIMIT = 5;

const timeOf = (wall: string) => wall.slice(11, 16);
const shortDay = (day: string) => formatBookingDateShort(`${day}T00:00:00Z`);

function greeting(now: string) {
  const hour = Number(now.slice(11, 13));
  if (hour < 5) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

/** "Salı, 15 Eylül 2026" — weekday first, as it is said. */
function longDate(day: string) {
  const date = new Date(`${day}T00:00:00Z`);
  const weekday = date.toLocaleDateString("tr-TR", { timeZone: "UTC", weekday: "long" });
  const rest = date.toLocaleDateString("tr-TR", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
  return `${weekday}, ${rest}`;
}

const pax = (r: Reservation) => (r.adults ?? 0) + (r.children ?? 0);

const DRIVER_STATE: Record<DriverDay["state"], { label: string; tone: "violet" | "neutral" | "green"; dot: string }> = {
  road: { label: "Yolda", tone: "violet", dot: "bg-adm-violet shadow-[0_0_0_3px_#eeeafc]" },
  busy: { label: "İşi var", tone: "neutral", dot: "bg-adm-blue shadow-[0_0_0_3px_#e5edfd]" },
  free: { label: "Müsait", tone: "green", dot: "bg-[#16a34a] shadow-[0_0_0_3px_#d9f2e1]" },
};

/** The panel's first screen. docs/admin-tasarim.md, bölüm 5.1. */
export default function TodayScreen({ data, adminBase }: { data: TodayData; adminBase: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState<{ code: string; leg: Leg | null } | null>(null);
  const [approving, setApproving] = useState<Reservation | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const { scope, stats, now } = data;
  const week = scope === "week";

  /** A time, with its day when the screen covers more than one. */
  const whenLabel = (wall: string) =>
    week && wall.slice(0, 10) !== data.today ? `${shortDay(wall.slice(0, 10))} ${timeOf(wall)}` : timeOf(wall);

  const openDrawer = (code: string, leg: Leg | null = null) => setOpen({ code, leg });

  const cancelAction = async (r: Reservation, action: "approve" | "reject") => {
    setBusy(`${action}-${r.id}`);
    try {
      const res = await fetch("/api/admin/cancel-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: r.id, action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "İşlem yapılamadı.");
      }
      toast(action === "approve" ? "İptal onaylandı." : "İptal talebi reddedildi.");
      setApproving(null);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "İşlem yapılamadı.", "error");
    } finally {
      setBusy(null);
    }
  };

  // ─── header ───
  const when = scope === "today" ? "bugün" : scope === "tomorrow" ? "yarın" : "bu hafta";
  const title = `${greeting(now)}, ${when} ${stats.transfers > 0 ? `${stats.transfers} transfer var` : "transfer yok"}`;
  const periodWord = scope === "today" ? "Günün" : scope === "tomorrow" ? "Yarının" : "Haftanın";
  const previousWord = scope === "today" ? "Düne" : scope === "tomorrow" ? "Bugüne" : "Önceki 7 güne";

  const statItems: StatItem[] = [
    {
      label: "Transfer",
      icon: Plane,
      value: stats.transfers,
      hint: `${stats.arrivals} karşılama · ${stats.departures} çıkış`,
    },
    { label: "Yolcu", icon: Users, value: stats.passengers, hint: `${stats.bags} bavul` },
    {
      label: "Şoför bekleyen",
      icon: UserPlus,
      value: stats.waiting,
      warn: stats.waiting > 0,
      hint: stats.nextWaiting ? `En yakını ${whenLabel(stats.nextWaiting)}` : "Hepsine şoför atandı",
    },
    {
      label: "Nakit tahsilat",
      icon: Banknote,
      value: moneyText(stats.cash),
      hint: stats.cashJobs ? `${stats.cashJobs} işte şoförde` : "Nakit iş yok",
    },
    {
      label: `${periodWord} cirosu`,
      icon: Wallet,
      value: moneyText(stats.revenue),
      hint:
        stats.revenueChange === null
          ? "Karşılaştırma yok"
          : `${previousWord} göre %${Math.abs(stats.revenueChange).toLocaleString("tr-TR")} ${
              stats.revenueChange >= 0 ? "fazla" : "az"
            }`,
    },
  ];

  const listHref =
    scope === "today"
      ? `${adminBase}/reservations?tab=today`
      : `${adminBase}/reservations?from=${data.from}&to=${data.to}`;

  // ─── needs attention ───
  const inbox: ReactNode[] = [];

  for (const l of data.waiting.slice(0, INBOX_LIMIT)) {
    const r = l.reservation;
    const route = shortRouteFor(r, l.leg);
    inbox.push(
      <InboxItem
        key={`waiting-${l.key}`}
        icon={UserPlus}
        tone="amber"
        title={`Şoför yok · ${whenLabel(l.wall)} ${route.from} → ${route.to}`}
        meta={`${r.reservation_code} · ${customerName(r)} · ${pax(r)} yolcu${l.leg === "return" ? " · dönüş" : ""}`}
        actions={
          <Button size="sm" variant="primary" icon={UserPlus} onClick={() => openDrawer(r.reservation_code, l.leg)}>
            Şoför ata
          </Button>
        }
      />
    );
  }
  if (data.waiting.length > INBOX_LIMIT) {
    inbox.push(
      <div key="waiting-more" className="border-b border-adm-line-2 px-[18px] py-2.5 last:border-b-0">
        <a href={`${adminBase}/reservations?tab=driver`} className={textLinkClass}>
          {data.waiting.length - INBOX_LIMIT} şoför bekleyen transfer daha
        </a>
      </div>
    );
  }

  for (const r of data.cancelRequests.slice(0, INBOX_LIMIT)) {
    inbox.push(
      <InboxItem
        key={`cancel-${r.id}`}
        icon={XCircle}
        tone="rose"
        title={`İptal talebi · ${r.reservation_code}`}
        meta={`${customerName(r)} · ${dayHeading(dayKey(r.pickup_datetime))} ${fmtTime(r.pickup_datetime)}`}
        actions={
          <>
            <Button size="sm" onClick={() => openDrawer(r.reservation_code)}>
              Aç
            </Button>
            <Button size="sm" loading={busy === `reject-${r.id}`} onClick={() => cancelAction(r, "reject")}>
              Reddet
            </Button>
            <Button size="sm" variant="danger-ghost" onClick={() => setApproving(r)}>
              İptali onayla
            </Button>
          </>
        }
      />
    );
  }
  if (data.cancelRequests.length > INBOX_LIMIT) {
    inbox.push(
      <div key="cancel-more" className="border-b border-adm-line-2 px-[18px] py-2.5 last:border-b-0">
        <a href={`${adminBase}/reservations?tab=cancel`} className={textLinkClass}>
          {data.cancelRequests.length - INBOX_LIMIT} iptal talebi daha
        </a>
      </div>
    );
  }

  for (const l of data.pendingPayments.slice(0, INBOX_LIMIT)) {
    const r = l.reservation;
    const digits = (r.customers?.phone ?? "").replace(/[^0-9]/g, "");
    inbox.push(
      <InboxItem
        key={`pending-${l.key}`}
        icon={Wallet}
        tone="amber"
        title={`Ödeme bekliyor · ${r.reservation_code}`}
        meta={`${customerName(r)} · ${moneyText(r.total_price, settlementOf(r.currency))} · ${whenLabel(l.wall)}`}
        actions={
          <>
            {digits && (
              <a
                href={`https://wa.me/${digits}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass({ size: "sm" })}
              >
                <MessageCircle size={14} aria-hidden="true" />
                WhatsApp
              </a>
            )}
            <Button size="sm" onClick={() => openDrawer(r.reservation_code)}>
              Aç
            </Button>
          </>
        }
      />
    );
  }

  const attentionCount = data.waiting.length + data.cancelRequests.length + data.pendingPayments.length;

  // ─── the day's flow ───
  const flow = data.legs.filter((l) => l.reservation.status !== "pending");
  const flowNodes: ReactNode[] = [];
  const nowIndex = scope === "today" ? flow.findIndex((l) => l.wall >= now) : -2;
  let lastGroup = "";
  flow.forEach((l, i) => {
    if (i === nowIndex) {
      flowNodes.push(
        <TimelineHour key="now" now label={`ŞİMDİ · ${timeOf(now)} → sıradaki ${timeOf(l.wall)}`} />
      );
    }
    const group = week ? l.wall.slice(0, 10) : l.wall.slice(11, 13);
    if (group !== lastGroup) {
      flowNodes.push(
        <TimelineHour key={`group-${group}`} label={week ? dayHeading(group) : `${group}:00`} />
      );
      lastGroup = group;
    }
    flowNodes.push(<FlowItem key={l.key} item={l} onOpen={openDrawer} />);
  });
  if (scope === "today" && nowIndex === -1 && flow.length > 0) {
    flowNodes.push(<TimelineHour key="now" now label={`ŞİMDİ · ${timeOf(now)} · bugünün transferleri geride kaldı`} />);
  }

  const month = data.month;
  const barMax = month ? Math.max(1, ...month.months.map((m) => Math.abs(m.net))) : 1;

  return (
    <>
      <PageHeader
        eyebrow={`${longDate(data.today)} · Antalya ${timeOf(now)}`}
        title={title}
        actions={
          <Segmented
            label="Gün"
            value={scope}
            options={[
              { value: "today", label: "Bugün", href: adminBase },
              { value: "tomorrow", label: "Yarın", href: `${adminBase}?day=tomorrow` },
              { value: "week", label: "Bu hafta", href: `${adminBase}?day=week` },
            ]}
          />
        }
      />

      <StatStrip items={statItems} />

      <div className="grid items-start gap-5 min-[1181px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-5">
          <Card title="Dikkat gerektiriyor" subtitle={attentionCount ? `${attentionCount} iş` : undefined} flush>
            {inbox.length ? (
              inbox
            ) : (
              <EmptyState
                compact
                icon={Plane}
                title={`${scope === "today" ? "Bugün" : scope === "tomorrow" ? "Yarın" : "Bu hafta"} için bekleyen iş yok`}
                description="Şoförsüz transfer, iptal talebi ya da bekleyen ödeme çıkınca burada görünür."
              />
            )}
          </Card>

          <Card
            title={week ? "Haftanın akışı" : scope === "tomorrow" ? "Yarının akışı" : "Günün akışı"}
            subtitle={flow.length ? `${flow.length} transfer` : undefined}
            actions={
              <ButtonLink href={listHref} size="sm" variant="ghost">
                Liste olarak aç
              </ButtonLink>
            }
            flush
          >
            {flow.length ? (
              <div className="pb-1.5">{flowNodes}</div>
            ) : (
              <EmptyState compact icon={Plane} title="Bu aralıkta transfer yok" />
            )}
          </Card>
        </div>

        <div className="grid min-w-0 gap-5">
          <Card
            title="Şoförler"
            subtitle={scope === "today" ? "bugün" : scope === "tomorrow" ? "yarın" : "bu hafta"}
            actions={
              <ButtonLink href={`${adminBase}/drivers`} size="sm" variant="ghost">
                Tümü
              </ButtonLink>
            }
            flush
          >
            {data.drivers.length ? (
              data.drivers.map((d) => {
                const look = DRIVER_STATE[d.state];
                return (
                  <a
                    key={d.id}
                    href={`${adminBase}/driver-payments/${d.id}`}
                    className="flex items-center gap-2.5 border-b border-adm-line-2 px-[18px] py-2.5 transition-colors last:border-b-0 hover:bg-adm-surface-2"
                  >
                    <span aria-hidden="true" className={cx("size-2 shrink-0 rounded-full", look.dot)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold">{d.name}</span>
                      <span className="block truncate text-xs text-adm-muted">
                        {d.jobs ? `${d.jobs} iş${d.next ? ` · sıradaki ${whenLabel(d.next)}` : ""}` : "İş yok"}
                      </span>
                    </span>
                    <Chip tone={look.tone} plain>
                      {look.label}
                    </Chip>
                  </a>
                );
              })
            ) : (
              <EmptyState compact icon={Users} title="Aktif şoför yok" />
            )}
          </Card>

          {month && (
            <Card
              title="Bu ay"
              actions={
                <ButtonLink href={`${adminBase}/finance`} size="sm" variant="ghost">
                  Kasa
                </ButtonLink>
              }
            >
              <p className="text-[12.5px] text-adm-muted">Net kâr</p>
              <p
                className={cx(
                  "text-[28px] font-bold leading-tight tracking-[-0.02em]",
                  month.net < 0 ? "text-adm-rose" : "text-adm-ink"
                )}
              >
                {moneyText(month.net)}
              </p>
              <p className="text-[12.5px]">
                <Delta value={month.change} suffix="geçen aya göre" />
              </p>

              <div
                role="img"
                aria-label={`Son altı ayın net kârı: ${month.months.map((m) => moneyText(m.net)).join(", ")}`}
                className="mt-3.5 flex h-16 items-end gap-1.5"
              >
                {month.months.map((m, i) => {
                  const current = i === month.months.length - 1;
                  return (
                    <span
                      key={m.key}
                      title={moneyText(m.net)}
                      className={cx(
                        "flex-1 rounded-t-[4px]",
                        m.net < 0
                          ? current
                            ? "bg-adm-rose"
                            : "bg-[#f3c1ca]"
                          : current
                            ? "bg-adm-brand"
                            : "bg-[#cfe9de]"
                      )}
                      style={{ height: `${Math.max(4, (Math.abs(m.net) / barMax) * 100)}%` }}
                    />
                  );
                })}
              </div>
              <div aria-hidden="true" className="mt-1.5 flex gap-1.5 text-[11px] text-adm-faint">
                {month.months.map((m) => (
                  <span key={m.key} className="flex-1 text-center">
                    {new Date(`${m.key}-01T00:00:00Z`).toLocaleDateString("tr-TR", { month: "short", timeZone: "UTC" })}
                  </span>
                ))}
              </div>

              <dl className="mt-3.5">
                <Kv label="Bu ay ciro" value={moneyText(month.revenue)} />
                <Kv
                  label="Şoförlere borç"
                  value={moneyText(month.owedToDrivers, "USD")}
                  tone={month.owedToDrivers > 0 ? "text-adm-amber" : undefined}
                />
                <Kv label="Bu ay reklam" value={moneyText(month.ads)} />
              </dl>
              {month.missingFees > 0 && (
                <p className="mt-1 text-[11.5px] text-adm-amber">
                  {month.missingFees} transferin şoför ücreti girilmedi; net kâr o kadar yüksek görünüyor.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={approving !== null}
        title="İptali onayla"
        message={
          approving
            ? `${approving.reservation_code} · ${customerName(approving)} iptal edilecek ve şoför atamaları kapanacak. Ödeme iadesi Stripe panelinden ayrıca yapılır.`
            : ""
        }
        confirmLabel="İptali onayla"
        danger
        busy={approving !== null && busy === `approve-${approving.id}`}
        onConfirm={() => approving && cancelAction(approving, "approve")}
        onClose={() => setApproving(null)}
      />

      <ReservationDrawer
        code={open?.code ?? null}
        initialAssignLeg={open?.leg ?? null}
        onClose={() => setOpen(null)}
        onChanged={() => router.refresh()}
        adminBase={adminBase}
      />
    </>
  );
}

function FlowItem({ item, onOpen }: { item: TodayLeg; onOpen: (code: string, leg?: Leg | null) => void }) {
  const r = item.reservation;
  const route = shortRouteFor(r, item.leg);
  const flight = legFlight(r, item.leg);
  const currency = settlementOf(r.currency);
  const assignment =
    liveAssignment(r, item.leg) ??
    (r.driver_assignments ?? []).find((da) => da.leg === item.leg && da.status === "completed");

  const who = assignment ? (
    <Person name={assignment.drivers?.full_name ?? "Şoför"} sub={assignment.vehicles?.plate_number} />
  ) : r.status === "cancel_requested" ? (
    <Chip tone="rose">İptal talebi</Chip>
  ) : ASSIGNABLE_STATUSES.includes(r.status) ? (
    <AssignButton onClick={() => onOpen(r.reservation_code, item.leg)} />
  ) : (
    <span className="text-xs text-adm-faint">—</span>
  );

  const sub = [
    customerName(r),
    `${pax(r)} yolcu`,
    `${moneyText(r.total_price, currency)}${isCash(r) && item.leg === "outbound" ? " nakit" : ""}`,
    r.hotel_name,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <TimelineItem
      time={timeOf(item.wall)}
      direction={isArrivalLeg(r, item.leg) ? "arrival" : "departure"}
      title={`${route.from} → ${route.to}`}
      sub={sub}
      flight={flight && <span className="font-mono text-[12.5px] font-semibold">{flight}</span>}
      who={who}
      onClick={() => onOpen(r.reservation_code)}
    />
  );
}

function Kv({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-dashed border-adm-line py-2 text-[13px]">
      <dt className="text-adm-muted">{label}</dt>
      <dd className={cx("font-semibold tabular-nums", tone ?? "text-adm-ink")}>{value}</dd>
    </div>
  );
}
