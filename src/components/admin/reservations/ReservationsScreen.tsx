"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  List,
  MessageCircle,
  PlaneLanding,
  PlaneTakeoff,
  Send,
  Ticket,
  UserPlus,
  X,
} from "lucide-react";
import { formatBookingDateShort } from "@/lib/datetime";
import { settlementOf } from "@/lib/currency";
import {
  hasReservationFilters,
  reservationQueryString,
  type PaymentFilter,
  type ReservationQuery,
  type ReservationSort,
  type ReservationTab,
} from "@/lib/reservationQuery";
import {
  AssignButton,
  Button,
  ConfirmDialog,
  DataGrid,
  EmptyState,
  Field,
  FilterButton,
  FilterSelect,
  IconLink,
  Input,
  Menu,
  PageHeader,
  Person,
  Popover,
  ReservationStatusChip,
  RowActions,
  SearchInput,
  Segmented,
  SelectionAction,
  SelectionBar,
  Tabs,
  Toolbar,
  cx,
  useToast,
  type GridColumn,
  type GridGroup,
  type TabItem,
} from "@/components/admin/ui";
import ReservationDrawer from "./ReservationDrawer";
import {
  type Leg,
  type Reservation,
  type ReservationListResult,
  customerName,
  dayHeading,
  dayKey,
  fareInEur,
  fmtTime,
  focusLeg,
  isArrivalLeg,
  isCash,
  legDateTime,
  legFlight,
  legsWithoutDriver,
  liveAssignment,
  moneyText,
  shortRouteFor,
} from "./types";

const PAGE = 60;

export interface FilterOption {
  id: string;
  name: string;
}

const EMPTY_TEXT: Record<ReservationTab, string> = {
  upcoming: "Yaklaşan transfer yok",
  today: "Bugün transfer yok",
  driver: "Şoför bekleyen transfer yok",
  pending: "Ödeme bekleyen rezervasyon yok",
  cancel: "İptal talebi yok",
  past: "Geçmiş kayıt yok",
  all: "Henüz rezervasyon yok",
};

const shortDay = (day: string) => formatBookingDateShort(`${day}T00:00:00Z`);

/** Rows under a heading per day, with what the day adds up to. */
function groupRows(rows: Reservation[], legOf: (r: Reservation) => Leg, today: string): GridGroup<Reservation>[] {
  const days = new Map<string, Reservation[]>();
  for (const r of rows) {
    const key = dayKey(legDateTime(r, legOf(r)));
    const list = days.get(key);
    if (list) list.push(r);
    else days.set(key, [r]);
  }
  return [...days.entries()].map(([key, list]) => {
    const waiting = list.filter((r) => legsWithoutDriver(r, today).length > 0).length;
    const total = list.reduce((sum, r) => sum + fareInEur(r), 0);
    return {
      key,
      label: dayHeading(key),
      rows: list,
      meta: (
        <>
          {list.length} transfer · {moneyText(total)}
          {waiting > 0 && (
            <>
              {" "}
              · <span className="font-medium text-adm-amber">{waiting} şoför bekliyor</span>
            </>
          )}
        </>
      ),
    };
  });
}

/**
 * The reservations screen: tabs, filters, a list grouped by day, and the
 * reservation drawer beside it. docs/admin-tasarim.md, bölüm 5.2.
 */
export default function ReservationsScreen({
  initial,
  initialQuery,
  regions,
  drivers,
  adminBase,
  openCode,
}: {
  initial: ReservationListResult;
  initialQuery: ReservationQuery;
  regions: FilterOption[];
  drivers: FilterOption[];
  adminBase: string;
  openCode: string | null;
}) {
  const pathname = usePathname();
  const toast = useToast();
  const [query, setQuery] = useState(initialQuery);
  const [searchText, setSearchText] = useState(initialQuery.q);
  const [result, setResult] = useState(initial);
  const [rows, setRows] = useState(initial.rows);
  const [loading, setLoading] = useState<null | "replace" | "more">(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [open, setOpen] = useState<{ code: string; leg: Leg | null } | null>(
    openCode ? { code: openCode, leg: null } : null
  );
  const [bulk, setBulk] = useState<string[] | null>(null);
  const [telegramConfirm, setTelegramConfirm] = useState(false);
  const [telegramBusy, setTelegramBusy] = useState(false);

  const queryRef = useRef(initialQuery);
  const openRef = useRef<string | null>(openCode);
  const seq = useRef(0);
  const busyRef = useRef(false);
  const searchTimer = useRef<number | undefined>(undefined);
  const sentinel = useRef<HTMLDivElement>(null);

  const today = result.today;
  const nextOffset = result.nextOffset;

  const syncUrl = useCallback(() => {
    const qs = reservationQueryString(queryRef.current, { open: openRef.current ?? undefined });
    window.history.replaceState(window.history.state, "", qs ? `${pathname}?${qs}` : pathname);
  }, [pathname]);

  const fetchList = useCallback(
    async (q: ReservationQuery, options: { offset?: number; append?: boolean; limit?: number } = {}) => {
      const id = ++seq.current;
      busyRef.current = true;
      setLoading(options.append ? "more" : "replace");
      try {
        const qs = reservationQueryString(q, { offset: options.offset || undefined, limit: options.limit });
        const res = await fetch(`/api/admin/reservations${qs ? `?${qs}` : ""}`, { cache: "no-store" });
        if (!res.ok) throw new Error("list");
        const data = (await res.json()) as ReservationListResult;
        if (id !== seq.current) return;
        setResult(data);
        setRows((prev) => {
          if (!options.append) return data.rows;
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...data.rows.filter((r) => !seen.has(r.id))];
        });
      } catch {
        if (id === seq.current) toast("Liste yüklenemedi, tekrar deneyin.", "error");
      } finally {
        if (id === seq.current) {
          setLoading(null);
          busyRef.current = false;
        }
      }
    },
    [toast]
  );

  // The next page arrives as the end of the list scrolls into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || nextOffset === null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !busyRef.current) {
          void fetchList(queryRef.current, { offset: nextOffset, append: true });
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextOffset, fetchList]);

  const update = (patch: Partial<ReservationQuery>) => {
    const next = { ...queryRef.current, ...patch };
    queryRef.current = next;
    setQuery(next);
    setSelected(new Set());
    syncUrl();
    void fetchList(next);
  };

  const onSearch = (value: string) => {
    setSearchText(value);
    window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => update({ q: value.trim() }), 300);
  };

  const clearFilters = () => {
    window.clearTimeout(searchTimer.current);
    setSearchText("");
    update({ q: "", from: "", to: "", region: "", driver: "", payment: "" });
  };

  const refresh = () => fetchList(queryRef.current, { limit: Math.max(rows.length, PAGE) });

  const openDrawer = (code: string, leg: Leg | null = null) => {
    openRef.current = code;
    setOpen({ code, leg });
    syncUrl();
  };

  const closeDrawer = () => {
    openRef.current = null;
    setOpen(null);
    setBulk(null);
    syncUrl();
  };

  // ─── rows ───
  const legOf = (r: Reservation) => focusLeg(r, query.tab, today);
  const grouped = query.sort === "pickup";
  const groups: GridGroup<Reservation>[] = grouped
    ? groupRows(rows, legOf, today)
    : [{ key: "all", label: null, rows }];

  const columns: GridColumn<Reservation>[] = [
    {
      key: "time",
      header: "Saat",
      width: "88px",
      area: "top-start",
      cell: (r) => {
        const leg = legOf(r);
        const at = legDateTime(r, leg);
        const arrival = isArrivalLeg(r, leg);
        const Icon = arrival ? PlaneLanding : PlaneTakeoff;
        return (
          <div className="max-[760px]:flex max-[760px]:items-baseline max-[760px]:gap-2">
            <div className="text-[15px] font-bold leading-tight tabular-nums">{fmtTime(at)}</div>
            <div className="flex items-center gap-1 whitespace-nowrap text-[11.5px] text-adm-muted">
              <Icon size={12} aria-hidden="true" />
              {arrival ? "Karşılama" : "Çıkış"}
              {!grouped && <span>· {shortDay(dayKey(at))}</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: "reservation",
      header: "Rezervasyon",
      width: "minmax(170px,1.25fr)",
      area: "body",
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-semibold">{customerName(r)}</div>
          <div className="truncate text-xs text-adm-muted">
            <span className="font-mono">{r.reservation_code}</span>
            {r.locale && (
              <>
                {" "}
                · <span className="rounded bg-adm-line-2 px-1 text-[10.5px] font-bold uppercase">{r.locale}</span>
              </>
            )}{" "}
            · {(r.adults ?? 0) + (r.children ?? 0)} yolcu
            {r.luggage_count ? ` · ${r.luggage_count} bavul` : ""}
          </div>
        </div>
      ),
    },
    {
      key: "route",
      header: "Güzergah",
      width: "minmax(170px,1.2fr)",
      area: "body",
      cell: (r) => {
        const leg = legOf(r);
        const route = shortRouteFor(r, leg);
        return (
          <div className="min-w-0">
            <div className="truncate text-[13.5px]">
              {route.from} → {route.to}
            </div>
            <div className="truncate text-xs text-adm-muted">
              {r.hotel_name || "Otel belirtilmedi"}
              {r.trip_type === "round_trip" && (
                <>
                  {" "}
                  · <b className="font-semibold text-adm-ink-2">{leg === "return" ? "dönüş bacağı" : "gidiş-dönüş"}</b>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "flight",
      header: "Uçuş",
      width: "96px",
      cell: (r) => {
        const flight = legFlight(r, legOf(r));
        return flight ? (
          <span className="font-mono text-[12.5px] font-semibold">{flight}</span>
        ) : (
          <span className="text-adm-faint">—</span>
        );
      },
    },
    {
      key: "driver",
      header: "Şoför",
      width: "minmax(150px,.9fr)",
      area: "foot-start",
      cell: (r) => {
        const leg = legOf(r);
        const assignment = liveAssignment(r, leg);
        const missing = legsWithoutDriver(r, today);
        if (assignment) {
          const other = missing.find((l) => l !== leg);
          return (
            <div className="min-w-0">
              <Person name={assignment.drivers?.full_name ?? "Şoför"} sub={assignment.vehicles?.plate_number} />
              {other && (
                <div className="mt-0.5 text-[11px] font-medium text-adm-amber">
                  {other === "return" ? "Dönüş" : "Gidiş"} şoförsüz
                </div>
              )}
            </div>
          );
        }
        if (missing.includes(leg)) return <AssignButton onClick={() => openDrawer(r.reservation_code, leg)} />;
        return <span className="text-xs text-adm-faint">—</span>;
      },
    },
    {
      key: "payment",
      header: "Ödeme",
      width: "136px",
      area: "foot-end",
      cell: (r) => {
        const currency = settlementOf(r.currency);
        return (
          <div>
            <div className="text-[13.5px] font-semibold tabular-nums">{moneyText(r.total_price, currency)}</div>
            {r.status === "pending" ? (
              <div className="text-xs font-medium text-adm-rose">Ödeme bekliyor</div>
            ) : isCash(r) ? (
              <div className="truncate text-xs font-medium text-adm-amber">
                Nakit{Number(r.driver_amount) > 0 ? ` · şoförde ${moneyText(r.driver_amount, currency)}` : ""}
              </div>
            ) : (
              <div className="text-xs text-adm-muted">Online</div>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Durum",
      width: "128px",
      area: "top-end",
      cell: (r) => <ReservationStatusChip status={r.status} />,
    },
    {
      key: "actions",
      header: "",
      width: "64px",
      wideOnly: true,
      cell: (r) => {
        const digits = (r.customers?.phone ?? "").replace(/[^0-9]/g, "");
        return (
          <RowActions>
            {digits && (
              <IconLink size="sm" icon={MessageCircle} label="Müşteriye WhatsApp" href={`https://wa.me/${digits}`} newTab />
            )}
            <IconLink
              size="sm"
              icon={ExternalLink}
              label="Tam sayfada aç"
              href={`${adminBase}/reservations/${encodeURIComponent(r.reservation_code)}`}
            />
          </RowActions>
        );
      },
    },
  ];

  // ─── selection ───
  const selectedRows = rows.filter((r) => selected.has(r.reservation_code));

  const assignSelected = () => {
    const waiting = selectedRows.filter((r) => legsWithoutDriver(r, today).length > 0);
    if (waiting.length === 0) {
      toast("Seçilenlerde şoför bekleyen transfer yok.", "error");
      return;
    }
    setBulk(waiting.map((r) => r.reservation_code));
    openDrawer(waiting[0].reservation_code, legsWithoutDriver(waiting[0], today)[0] ?? null);
  };

  const sendSelectedToTelegram = async () => {
    setTelegramBusy(true);
    try {
      const res = await fetch("/api/admin/send-to-telegram-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationIds: selectedRows.map((r) => r.id) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast(data?.error ?? "Gönderilemedi.", "error");
        return;
      }
      toast(
        data.messages > 1
          ? `${data.sent} rezervasyon, ${data.messages} mesajda şoför grubuna gönderildi.`
          : `${data.sent} rezervasyon tek mesajda şoför grubuna gönderildi.`
      );
    } finally {
      setTelegramBusy(false);
      setTelegramConfirm(false);
    }
  };

  const downloadSelectedVouchers = () => {
    selectedRows.forEach((r, i) => {
      window.setTimeout(() => {
        const link = document.createElement("a");
        link.href = `/api/admin/voucher-pdf?code=${encodeURIComponent(r.reservation_code)}&locale=${r.locale ?? "tr"}`;
        link.download = "";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, i * 600);
    });
    toast(`${selectedRows.length} voucher indiriliyor.`);
  };

  // ─── drawer navigation: the visible list, or the ticked rows when assigning in bulk ───
  const navList = bulk ?? rows.map((r) => r.reservation_code);
  const navIndex = open ? navList.indexOf(open.code) : -1;
  const step = (delta: number) => {
    const code = navList[navIndex + delta];
    if (!code) return;
    const row = rows.find((r) => r.reservation_code === code);
    openDrawer(code, bulk && row ? (legsWithoutDriver(row, today)[0] ?? null) : null);
  };

  const exportHref = (format: "csv" | "excel") => {
    const params = new URLSearchParams({ format });
    if (query.tab === "pending") params.set("status", "pending");
    if (query.tab === "cancel") params.set("status", "cancel_requested");
    if (query.from) params.set("from", query.from);
    if (query.to) params.set("to", query.to);
    return `/api/admin/export?${params}`;
  };

  const counts = result.counts;
  const tabs: TabItem<ReservationTab>[] = [
    { key: "upcoming", label: "Yaklaşan" },
    { key: "today", label: "Bugün", count: counts.today },
    { key: "driver", label: "Şoför bekleyen", count: counts.driver, tone: counts.driver ? "warn" : "neutral" },
    { key: "pending", label: "Ödeme bekleyen", count: counts.pending, tone: counts.pending ? "warn" : "neutral" },
    { key: "cancel", label: "İptal talebi", count: counts.cancel, tone: counts.cancel ? "bad" : "neutral" },
    { key: "past", label: "Geçmiş" },
    { key: "all", label: "Tümü" },
  ];

  const filtersOn = hasReservationFilters(query);

  return (
    <>
      <PageHeader
        title="Rezervasyonlar"
        actions={
          // "Yeni rezervasyon" is already in the top bar on every screen.
          <Menu
            items={[
              { label: "CSV olarak", icon: FileText, href: exportHref("csv"), newTab: true },
              { label: "Excel olarak", icon: FileSpreadsheet, href: exportHref("excel"), newTab: true },
            ]}
            trigger={({ open: menuOpen, toggle }) => (
              <Button icon={Download} compact aria-expanded={menuOpen} onClick={toggle}>
                Dışa aktar
              </Button>
            )}
          />
        }
      />

      <Tabs label="Rezervasyon listesi" items={tabs} value={query.tab} onChange={(tab) => update({ tab })} />

      <Toolbar
        end={
          <>
            <Segmented
              label="Görünüm"
              value="list"
              options={[
                {
                  value: "list",
                  label: (
                    <>
                      <List size={14} aria-hidden="true" />
                      Liste
                    </>
                  ),
                },
                {
                  value: "calendar",
                  href: `${adminBase}/calendar`,
                  label: (
                    <>
                      <CalendarDays size={14} aria-hidden="true" />
                      Takvim
                    </>
                  ),
                },
              ]}
            />
            <FilterSelect
              label="Sırala"
              value={query.sort}
              options={[
                { value: "pickup", label: "Alış saati" },
                { value: "created", label: "Kayıt tarihi" },
              ]}
              onChange={(value) => update({ sort: value as ReservationSort })}
            />
          </>
        }
      >
        <SearchInput
          value={searchText}
          onChange={onSearch}
          placeholder="Kod, müşteri, e-posta, telefon, uçuş, otel, bölge, şoför…"
        />
        <DateFilter from={query.from} to={query.to} onApply={(from, to) => update({ from, to })} />
        <FilterSelect
          label="Bölge"
          value={query.region}
          options={[{ value: "", label: "Tümü" }, ...regions.map((r) => ({ value: r.id, label: r.name }))]}
          onChange={(region) => update({ region })}
        />
        <FilterSelect
          label="Şoför"
          value={query.driver}
          options={[{ value: "", label: "Tümü" }, ...drivers.map((d) => ({ value: d.id, label: d.name }))]}
          onChange={(driver) => update({ driver })}
        />
        <FilterSelect
          label="Ödeme"
          value={query.payment}
          options={[
            { value: "", label: "Tümü" },
            { value: "online", label: "Online" },
            { value: "cash", label: "Nakit" },
            { value: "pending", label: "Ödeme bekliyor" },
          ]}
          onChange={(payment) => update({ payment: payment as PaymentFilter })}
        />
        {filtersOn && (
          <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>
            Temizle
          </Button>
        )}
      </Toolbar>

      <div aria-busy={loading === "replace"} className={cx("transition-opacity", loading === "replace" && "opacity-60")}>
        <DataGrid
          label="Rezervasyonlar"
          columns={columns}
          groups={groups}
          rowKey={(r) => r.reservation_code}
          onRowClick={(r) => openDrawer(r.reservation_code)}
          activeKey={open?.code ?? null}
          selected={selected}
          onSelectedChange={setSelected}
          empty={
            <EmptyState
              compact
              icon={Ticket}
              title={filtersOn ? "Bu filtrelerle rezervasyon yok" : EMPTY_TEXT[query.tab]}
              description={filtersOn ? "Aramayı ya da filtreleri değiştirip tekrar bakın." : undefined}
              action={
                filtersOn && (
                  <Button size="sm" onClick={clearFilters}>
                    Filtreleri temizle
                  </Button>
                )
              }
            />
          }
          footer={
            nextOffset !== null && (
              <div ref={sentinel} className="border-t border-adm-line-2 p-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  loading={loading === "more"}
                  onClick={() => fetchList(queryRef.current, { offset: nextOffset, append: true })}
                >
                  Daha fazla göster
                </Button>
              </div>
            )
          }
        />
      </div>

      <SelectionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <SelectionAction icon={Send} onClick={() => setTelegramConfirm(true)}>
          Telegram&apos;a gönder
        </SelectionAction>
        <SelectionAction icon={UserPlus} onClick={assignSelected}>
          Şoför ata
        </SelectionAction>
        <SelectionAction icon={FileText} onClick={downloadSelectedVouchers}>
          Voucher
        </SelectionAction>
      </SelectionBar>

      <ConfirmDialog
        open={telegramConfirm}
        title="Telegram'a gönder"
        message={`${selectedRows.length} rezervasyon şoför grubuna tek mesajda gönderilecek.`}
        confirmLabel="Gönder"
        busy={telegramBusy}
        onConfirm={sendSelectedToTelegram}
        onClose={() => setTelegramConfirm(false)}
      />

      <ReservationDrawer
        code={open?.code ?? null}
        initialAssignLeg={open?.leg ?? null}
        onClose={closeDrawer}
        onChanged={refresh}
        adminBase={adminBase}
        nav={
          navIndex >= 0
            ? {
                index: navIndex,
                total: navList.length,
                label: bulk ? "Seçim" : undefined,
                onPrev: navIndex > 0 ? () => step(-1) : undefined,
                onNext: navIndex < navList.length - 1 ? () => step(1) : undefined,
              }
            : undefined
        }
      />
    </>
  );
}

function DateFilter({ from, to, onApply }: { from: string; to: string; onApply: (from: string, to: string) => void }) {
  const value = from || to ? `${from ? shortDay(from) : "…"} – ${to ? shortDay(to) : "…"}` : undefined;
  return (
    <Popover
      width="w-64"
      trigger={({ open, toggle }) => (
        <FilterButton label="Tarih" value={value} icon={CalendarRange} aria-expanded={open} onClick={toggle} />
      )}
    >
      {(close) => (
        <DateRangeForm
          from={from}
          to={to}
          onApply={(f, t) => {
            onApply(f, t);
            close();
          }}
        />
      )}
    </Popover>
  );
}

function DateRangeForm({ from, to, onApply }: { from: string; to: string; onApply: (from: string, to: string) => void }) {
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);
  return (
    <div className="grid gap-2.5 p-1.5">
      <Field label="Başlangıç" htmlFor="reservation-range-from">
        <Input id="reservation-range-from" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
      </Field>
      <Field label="Bitiş" htmlFor="reservation-range-to">
        <Input id="reservation-range-to" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => onApply("", "")}>
          Temizle
        </Button>
        <Button size="sm" variant="primary" className="ms-auto" onClick={() => onApply(start, end)}>
          Uygula
        </Button>
      </div>
    </div>
  );
}
