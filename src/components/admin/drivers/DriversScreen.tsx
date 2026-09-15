"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Mail, Phone, Plus, Power, User, UserX, Wallet } from "lucide-react";
import { formatBookingDateTime } from "@/lib/datetime";
import {
  ACCOUNT_CURRENCY,
  balanceStatus,
  fmtMoney,
  type LedgerSummary,
} from "@/lib/driverStatement";
import {
  AssignmentStatusChip,
  Avatar,
  Button,
  ButtonLink,
  Card,
  Chip,
  DataGrid,
  Dialog,
  Drawer,
  DrawerSection,
  EmptyState,
  QuickAction,
  SearchInput,
  Tabs,
  Toolbar,
  cx,
  useToast,
  type GridColumn,
} from "@/components/admin/ui";
import DriverFormDialog, { type DriverFormValues } from "./DriverFormDialog";
import DriverPaymentForm from "@/components/admin/DriverPaymentForm";
import type { DriverJob, DriverRow } from "@/lib/driversData";
import type { Rates } from "@/lib/rates";

type Tab = "active" | "inactive" | "all";

function BalanceChip({ balance }: { balance: LedgerSummary }) {
  const status = balanceStatus(balance.balance);
  const tone = status.tone === "owe" ? "amber" : status.tone === "owed" ? "rose" : "green";
  return (
    <Chip tone={tone} plain>
      {fmtMoney(Math.abs(balance.balance), ACCOUNT_CURRENCY)}
    </Chip>
  );
}

/** Şoförler: docs/admin-tasarim.md, bölüm 5.5. */
export default function DriversScreen({
  drivers,
  rates,
  today,
  adminBase,
}: {
  drivers: DriverRow[];
  rates: Rates | null;
  today: string;
  adminBase: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("active");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<DriverFormValues | null>(null);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      active: drivers.filter((d) => d.is_active).length,
      inactive: drivers.filter((d) => !d.is_active).length,
      all: drivers.length,
    }),
    [drivers]
  );

  const rows = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("tr-TR");
    return drivers
      .filter((d) => (tab === "active" ? d.is_active : tab === "inactive" ? !d.is_active : true))
      .filter((d) => !query || d.full_name.toLocaleLowerCase("tr-TR").includes(query) || (d.phone ?? "").includes(query))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, "tr"));
  }, [drivers, tab, q]);

  const open = drivers.find((d) => d.id === openId) ?? null;

  const refresh = () => router.refresh();

  const toggle = async (d: DriverRow) => {
    setTogglingId(d.id);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "drivers", action: "toggle", id: d.id }),
    });
    setTogglingId(null);
    if (res.ok) {
      toast(d.is_active ? "Şoför pasife alındı." : "Şoför aktifleştirildi.");
      refresh();
    } else {
      toast("İşlem yapılamadı.", "error");
    }
  };

  const columns: GridColumn<DriverRow>[] = [
    {
      key: "name",
      header: "Şoför",
      width: "minmax(180px,1.4fr)",
      area: "body",
      cell: (d) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={d.full_name} />
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold">{d.full_name}</div>
            <div className="truncate text-xs text-adm-muted">{d.phone || "—"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "today",
      header: "Bugün",
      width: "90px",
      area: "top-end",
      cell: (d) => (d.todayJobs > 0 ? <Chip tone="blue" plain>{d.todayJobs} iş</Chip> : <span className="text-xs text-adm-faint">—</span>),
    },
    {
      key: "month",
      header: "Bu ay",
      width: "100px",
      area: "foot-start",
      cell: (d) => <span className="text-[13px] text-adm-ink-2">{d.balance.monthJobs} iş</span>,
    },
    {
      key: "balance",
      header: "Cari",
      width: "140px",
      area: "foot-end",
      cell: (d) => <BalanceChip balance={d.balance} />,
    },
    {
      key: "status",
      header: "Durum",
      width: "150px",
      wideOnly: true,
      cell: (d) => (
        <div className="flex flex-wrap gap-1">
          <Chip tone={d.is_active ? "green" : "neutral"} plain>
            {d.is_active ? "Aktif" : "Pasif"}
          </Chip>
          {d.onLeaveToday && (
            <Chip tone="rose" plain>
              İzinli
            </Chip>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-5 mt-3 flex flex-wrap items-end gap-4">
        <h1 className="text-[21px] font-bold tracking-[-0.02em] min-[761px]:text-2xl">Şoförler</h1>
        <Button variant="primary" icon={Plus} compact className="ms-auto" onClick={() => setCreating(true)}>
          Şoför ekle
        </Button>
      </div>

      <Tabs
        label="Şoför listesi"
        value={tab}
        onChange={setTab}
        items={[
          { key: "active", label: "Aktif", count: counts.active },
          { key: "inactive", label: "Pasif", count: counts.inactive },
          { key: "all", label: "Tümü" },
        ]}
      />
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Şoför adı veya telefon" />
      </Toolbar>

      <DataGrid
        label="Şoförler"
        columns={columns}
        rows={rows}
        rowKey={(d) => d.id}
        onRowClick={(d) => setOpenId(d.id)}
        activeKey={openId}
        empty={<EmptyState compact icon={User} title="Şoför bulunamadı" />}
      />

      <Drawer
        open={!!open}
        onClose={() => setOpenId(null)}
        label="Şoför"
        top={
          open && (
            <>
              <span className="text-[13px] font-semibold">{open.full_name}</span>
              <Chip tone={open.is_active ? "green" : "neutral"} plain>
                {open.is_active ? "Aktif" : "Pasif"}
              </Chip>
              {open.onLeaveToday && (
                <Chip tone="rose" plain>
                  Bugün izinli
                </Chip>
              )}
            </>
          )
        }
        title={open?.full_name}
        meta={open && <BalanceChip balance={open.balance} />}
        quick={
          open && (
            <>
              <QuickAction icon={Phone} label="Ara" href={open.phone ? `tel:${open.phone}` : undefined} disabled={!open.phone} />
              <QuickAction
                icon={Mail}
                label="E-posta"
                href={open.email ? `mailto:${open.email}` : undefined}
                disabled={!open.email}
              />
              <QuickAction icon={Wallet} label="Ödeme yap" onClick={() => setPaying(open.id)} />
              <QuickAction
                icon={open.is_active ? UserX : Power}
                label={open.is_active ? "Pasife al" : "Aktifleştir"}
                onClick={() => toggle(open)}
                loading={togglingId === open.id}
              />
              <QuickAction
                icon={Copy}
                label="Panel linki"
                disabled={!open.portal_token}
                onClick={async () => {
                  if (!open.portal_token) return;
                  await navigator.clipboard.writeText(`${window.location.origin}/driver/panel/${open.portal_token}`);
                  toast("Şoförün panel linki kopyalandı.");
                }}
              />
            </>
          )
        }
        footer={
          open && (
            <>
              <ButtonLink href={`${adminBase}/driver-payments/${open.id}`} variant="primary">
                Cariyi aç
              </ButtonLink>
              <Button
                className="ms-auto"
                onClick={() => setEditing({ id: open.id, full_name: open.full_name, phone: open.phone ?? "", email: open.email ?? "" })}
              >
                Düzenle
              </Button>
            </>
          )
        }
      >
        {open && <DriverDetail driver={open} today={today} />}
      </Drawer>

      {(creating || editing) && (
        <DriverFormDialog
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}

      <Dialog
        open={paying !== null}
        onClose={() => setPaying(null)}
        title={open ? `Ödeme yap · ${open.full_name}` : "Ödeme yap"}
        subtitle="Hesap dolar tutulur; € ve ₺ günün kuruyla çevrilir."
      >
        {paying !== null && (
          <DriverPaymentForm
            key={paying}
            driverId={paying}
            rates={rates}
            today={today}
            onDone={() => {
              setPaying(null);
              refresh();
            }}
            onCancel={() => setPaying(null)}
          />
        )}
      </Dialog>
    </>
  );
}

function DriverDetail({ driver, today }: { driver: DriverRow; today: string }) {
  const toast = useToast();
  // Keyed by driver id, so switching drivers shows "loading" for the new one
  // without a synchronous reset in the effect body.
  const [byDriver, setByDriver] = useState<Record<string, { jobs: DriverJob[]; leaveDays: string[] }>>({});
  const data = byDriver[driver.id] ?? null;
  const jobs = data?.jobs ?? null;
  const [leave, setLeave] = useState<Set<string>>(new Set());
  const [busyDate, setBusyDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/drivers/${driver.id}/jobs`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { jobs: [], leaveDays: [] }))
      .then((d) => {
        if (cancelled) return;
        setByDriver((prev) => ({ ...prev, [driver.id]: { jobs: d.jobs ?? [], leaveDays: d.leaveDays ?? [] } }));
        setLeave(new Set(d.leaveDays ?? []));
      })
      .catch(() => !cancelled && setByDriver((prev) => ({ ...prev, [driver.id]: { jobs: [], leaveDays: [] } })));
    return () => {
      cancelled = true;
    };
  }, [driver.id]);

  const workingDays = new Set((jobs ?? []).map((j) => j.wall.slice(0, 10)));

  const toggleLeave = async (date: string) => {
    const isLeave = leave.has(date);
    setBusyDate(date);
    try {
      const res = await fetch("/api/admin/driver-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driver.id, date, action: isLeave ? "remove" : "add" }),
      });
      if (!res.ok) {
        toast("İşlem yapılamadı.", "error");
        return;
      }
      setLeave((prev) => {
        const next = new Set(prev);
        if (isLeave) next.delete(date);
        else next.add(date);
        return next;
      });
    } finally {
      setBusyDate(null);
    }
  };

  return (
    <>
      <DrawerSection title="İletişim">
        <ul className="grid gap-1.5 text-[13px] text-adm-ink-2">
          <li className="flex items-center gap-2">
            <Phone size={14} aria-hidden="true" className="text-adm-faint" />
            {driver.phone || "—"}
          </li>
          <li className="flex items-center gap-2">
            <Mail size={14} aria-hidden="true" className="text-adm-faint" />
            {driver.email || "—"}
          </li>
        </ul>
      </DrawerSection>

      <DrawerSection title="Bugünkü ve yaklaşan işler">
        {jobs === null ? (
          <p className="text-[13px] text-adm-muted">Yükleniyor…</p>
        ) : jobs.length === 0 ? (
          <p className="text-[13px] text-adm-muted">Bekleyen iş yok.</p>
        ) : (
          <ul className="grid gap-1.5">
            {jobs.map((j) => (
              <li key={j.key} className="flex items-center gap-2.5 rounded-adm border border-adm-line-2 px-3 py-2">
                <span className="shrink-0 text-[13px] font-semibold tabular-nums">
                  {j.wall.slice(0, 10) === today ? formatBookingDateTime(j.wall).slice(-5) : formatBookingDateTime(j.wall)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-adm-ink-2">{j.route}</span>
                <AssignmentStatusChip status={j.status} />
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>

      <DrawerSection title="İzin günleri">
        <div className="grid grid-cols-7 gap-1.5">
          {nextDays(today, 14).map((date) => {
            const { weekday, day } = dayLabel(date);
            const isLeave = leave.has(date);
            const hasWork = workingDays.has(date);
            return (
              <button
                key={date}
                type="button"
                disabled={hasWork || busyDate === date}
                onClick={() => toggleLeave(date)}
                aria-pressed={isLeave}
                title={hasWork ? "Bu günde işi var" : undefined}
                className={cx(
                  "flex flex-col items-center gap-0.5 rounded-adm border px-1 py-1.5 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  isLeave ? "border-adm-rose bg-adm-rose-soft text-adm-rose" : "border-adm-line-2 text-adm-ink-2 hover:border-adm-line-strong"
                )}
              >
                <span className="text-[9.5px] font-bold uppercase text-adm-faint">{weekday}</span>
                <span className="text-[11.5px] font-semibold tabular-nums">{day}</span>
              </button>
            );
          })}
        </div>
      </DrawerSection>

      <DrawerSection title="Bu ayın özeti">
        <Card bodyClassName="grid grid-cols-2 gap-3 p-3.5">
          <div>
            <p className="text-[11.5px] text-adm-muted">Bu ay ödenen</p>
            <p className="text-sm font-semibold tabular-nums">{fmtMoney(driver.balance.monthPaid, ACCOUNT_CURRENCY)}</p>
          </div>
          <div>
            <p className="text-[11.5px] text-adm-muted">Bu ay iş</p>
            <p className="text-sm font-semibold tabular-nums">{driver.balance.monthJobs}</p>
          </div>
          <div>
            <p className="text-[11.5px] text-adm-muted">Yaklaşan hak ediş</p>
            <p className="text-sm font-semibold tabular-nums">{fmtMoney(driver.balance.upcoming, ACCOUNT_CURRENCY)}</p>
          </div>
          <div>
            <p className="text-[11.5px] text-adm-muted">Son ödeme</p>
            <p className="text-sm font-semibold">{driver.balance.lastPaymentDay ?? "—"}</p>
          </div>
        </Card>
      </DrawerSection>
    </>
  );
}

/** Next `count` days as "yyyy-mm-dd", starting today. */
function nextDays(today: string, count: number): string[] {
  const [y, m, d] = today.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(start);
    dt.setUTCDate(dt.getUTCDate() + i);
    return dt.toISOString().slice(0, 10);
  });
}

function dayLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    weekday: dt.toLocaleDateString("tr-TR", { timeZone: "UTC", weekday: "short" }),
    day: dt.toLocaleDateString("tr-TR", { timeZone: "UTC", day: "numeric", month: "short" }),
  };
}
