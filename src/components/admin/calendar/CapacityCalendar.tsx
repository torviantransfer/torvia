"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Lock, Minus, Plus, RotateCcw, Settings2, Unlock, X } from "lucide-react";
import { bookingDayKey, formatBookingTime, todayInBookingTz } from "@/lib/datetime";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageHeader,
  ReservationStatusChip,
  cx,
  useToast,
} from "@/components/admin/ui";
import ReservationDrawer from "@/components/admin/reservations/ReservationDrawer";
import { dayHeading } from "@/components/admin/reservations/types";

interface CalendarEvent {
  id: string;
  code: string;
  status: string;
  pickup: string;
  region: string;
  route: string;
  customer: string;
  leg: "outbound" | "return";
}

interface DateOverride {
  date: string;
  /** null closes the date outright; a number is that date's own capacity. */
  maxBookings: number | null;
  reason: string | null;
}

interface MonthData {
  key: string;
  events: CalendarEvent[];
  overrides: DateOverride[];
  counts: Record<string, number>;
  globalMax: number;
}

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const PRESETS = [2, 3, 4, 5, 6, 8, 10];
const MAX_CAPACITY = 100;

const pad = (n: number) => String(n).padStart(2, "0");
const clamp = (n: number, min: number) => (Number.isFinite(n) ? Math.min(MAX_CAPACITY, Math.max(min, Math.trunc(n))) : min);

function Stepper({
  value,
  min,
  onChange,
  label,
}: {
  value: number;
  min: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <IconButton icon={Minus} label="Azalt" onClick={() => onChange(clamp(value - 1, min))} disabled={value <= min} className="border border-adm-line" />
      <Input
        type="number"
        min={min}
        max={MAX_CAPACITY}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(clamp(Number(e.target.value), min))}
        className="text-center text-base font-bold"
      />
      <IconButton icon={Plus} label="Artır" onClick={() => onChange(clamp(value + 1, min))} disabled={value >= MAX_CAPACITY} className="border border-adm-line" />
    </div>
  );
}

/**
 * Takvim & Kapasite: how full each day is, which days are closed or have their
 * own limit, and the transfers of the day picked. docs/admin-tasarim.md, 5.3.
 */
export default function CapacityCalendar({ adminBase }: { adminBase: string }) {
  const toast = useToast();
  const today = todayInBookingTz();
  const [year, setYear] = useState(Number(today.slice(0, 4)));
  const [month, setMonth] = useState(Number(today.slice(5, 7)));
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<MonthData | null>(null);
  const [selected, setSelected] = useState<string | null>(today);
  const [draft, setDraft] = useState<{ date: string; capacity: number; reason: string } | null>(null);
  const [draftGlobal, setDraftGlobal] = useState<number | null>(null);
  const [saving, setSaving] = useState<null | "day" | "close" | "reset" | "global">(null);
  const [open, setOpen] = useState<string | null>(null);

  const key = `${year}-${month}-${version}`;
  const monthStart = `${year}-${pad(month)}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthEnd = `${year}-${pad(month)}-${pad(daysInMonth)}`;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/admin/calendar?year=${year}&month=${month}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/admin/date-capacity?from=${monthStart}&to=${monthEnd}`, { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([cal, cap]) => {
        if (cancelled) return;
        setData({
          key,
          events: cal.events ?? [],
          overrides: cap.overrides ?? [],
          counts: cap.counts ?? {},
          globalMax: typeof cap.globalMax === "number" ? cap.globalMax : 3,
        });
      })
      .catch(() => {
        if (!cancelled) toast("Takvim yüklenemedi.", "error");
      });
    return () => {
      cancelled = true;
    };
  }, [key, year, month, monthStart, monthEnd, toast]);

  const loading = data?.key !== key;
  const events = data?.events ?? [];
  const overrides = data?.overrides ?? [];
  const counts = data?.counts ?? {};
  const globalMax = data?.globalMax ?? 3;

  const overrideFor = (date: string) => overrides.find((o) => o.date === date) ?? null;
  const capacityOf = (date: string) => {
    const o = overrideFor(date);
    return o ? (o.maxBookings ?? 0) : globalMax;
  };
  const eventsOn = (date: string) => events.filter((e) => bookingDayKey(e.pickup) === date);

  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth() + 1);
    setSelected(null);
    setDraft(null);
  };

  const goToday = () => {
    setYear(Number(today.slice(0, 4)));
    setMonth(Number(today.slice(5, 7)));
    setSelected(today);
    setDraft(null);
  };

  const selectDay = (date: string) => {
    setSelected(date === selected ? null : date);
    setDraft(null);
  };

  // ─── the selected day ───
  const sel = selected;
  const selOverride = sel ? overrideFor(sel) : null;
  const selCapacity = sel ? capacityOf(sel) : globalMax;
  const selBooked = sel ? (counts[sel] ?? 0) : 0;
  const selClosed = selCapacity === 0;
  const selEvents = sel ? eventsOn(sel) : [];
  const current = draft && draft.date === sel ? draft : { date: sel ?? "", capacity: selClosed ? globalMax : selCapacity, reason: selOverride?.reason ?? "" };
  const editDraft = (patch: Partial<{ capacity: number; reason: string }>) => setDraft({ ...current, ...patch });
  const globalValue = draftGlobal ?? globalMax;

  const refresh = () => {
    setDraft(null);
    setVersion((v) => v + 1);
  };

  const saveOverride = async (maxBookings: number | null) => {
    if (!sel) return;
    setSaving(maxBookings === null ? "close" : "day");
    const res = await fetch("/api/admin/date-capacity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: sel, maxBookings, reason: current.reason || null }),
    });
    setSaving(null);
    if (res.ok) {
      toast(maxBookings === null ? "Gün kapatıldı, yeni rezervasyon alınmayacak." : `Bu güne özel kapasite ${maxBookings} oldu.`);
      refresh();
    } else {
      const d = await res.json().catch(() => null);
      toast(d?.error ?? "Kaydedilemedi.", "error");
    }
  };

  const clearOverride = async () => {
    if (!sel) return;
    setSaving("reset");
    const res = await fetch(`/api/admin/date-capacity?date=${sel}`, { method: "DELETE" });
    setSaving(null);
    if (res.ok) {
      toast(`Gün varsayılana döndü (${globalMax} rezervasyon).`);
      refresh();
    } else {
      toast("Varsayılana döndürülemedi.", "error");
    }
  };

  const saveGlobal = async () => {
    setSaving("global");
    const res = await fetch("/api/admin/date-capacity", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ globalMax: globalValue }),
    });
    setSaving(null);
    if (res.ok) {
      toast(`Varsayılan günlük kapasite ${globalValue} oldu.`);
      setDraftGlobal(null);
      refresh();
    } else {
      const d = await res.json().catch(() => null);
      toast(d?.error ?? "Varsayılan kapasite kaydedilemedi.", "error");
    }
  };

  // ─── grid ───
  const firstDow = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${pad(month)}-${pad(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);

  const closedCount = overrides.filter((o) => (o.maxBookings ?? 0) === 0).length;
  const customCount = overrides.filter((o) => (o.maxBookings ?? 0) > 0).length;

  return (
    <>
      <PageHeader
        title="Takvim & Kapasite"
        description="Bir güne tıklayıp o günün kapasitesini değiştirin, günü kapatın ya da transferlerini açın."
      />

      <div className="grid items-start gap-5 min-[1181px]:grid-cols-[minmax(0,1fr)_340px]">
        <Card
          flush
          title={`${MONTHS[month - 1]} ${year}`}
          subtitle={
            <span className="inline-flex flex-wrap gap-1.5">
              <Chip plain>{events.length} transfer</Chip>
              {customCount > 0 && (
                <Chip tone="blue" plain>
                  {customCount} özel kapasite
                </Chip>
              )}
              {closedCount > 0 && (
                <Chip tone="rose" plain>
                  {closedCount} kapalı gün
                </Chip>
              )}
            </span>
          }
          actions={
            <>
              <Button size="sm" onClick={goToday}>
                Bugün
              </Button>
              <IconButton size="sm" icon={ChevronLeft} label="Önceki ay" onClick={() => shiftMonth(-1)} />
              <IconButton size="sm" icon={ChevronRight} label="Sonraki ay" onClick={() => shiftMonth(1)} />
            </>
          }
        >
          <div className={cx("transition-opacity", loading && "opacity-60")} aria-busy={loading}>
            <div className="grid grid-cols-7 border-b border-adm-line bg-adm-surface-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2 text-center text-[11.5px] font-semibold text-adm-muted">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((date, i) => {
                if (!date) return <div key={`empty-${i}`} className="min-h-[92px] border-b border-e border-adm-line-2 bg-adm-surface-2/60 max-[760px]:min-h-[60px]" />;
                const dayEvents = eventsOn(date);
                const capacity = capacityOf(date);
                const booked = counts[date] ?? 0;
                const closed = capacity === 0;
                const full = !closed && booked >= capacity;
                const custom = !!overrideFor(date) && !closed;
                const isSelected = selected === date;
                return (
                  <button
                    key={date}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => selectDay(date)}
                    className={cx(
                      "relative min-h-[92px] border-b border-e border-adm-line-2 p-1.5 text-start align-top transition-colors hover:brightness-[0.98] max-[760px]:min-h-[60px]",
                      closed ? "bg-adm-rose-soft" : full ? "bg-adm-amber-soft" : booked > 0 ? "bg-adm-blue-soft/50" : "bg-adm-surface",
                      isSelected && "ring-2 ring-inset ring-adm-ink",
                      date < today && "opacity-55"
                    )}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span
                        className={cx(
                          "grid size-6 place-items-center rounded-full text-xs font-semibold",
                          date === today ? "bg-adm-ink text-white" : "text-adm-ink-2"
                        )}
                      >
                        {Number(date.slice(8))}
                      </span>
                      <span className="flex items-center gap-1 text-[10.5px] font-semibold tabular-nums">
                        {custom && <Settings2 size={11} aria-label="Özel kapasite" className="text-adm-blue" />}
                        {closed ? (
                          <Lock size={11} aria-label="Kapalı" className="text-adm-rose" />
                        ) : (
                          <span className={full ? "text-adm-amber" : booked > 0 ? "text-adm-ink-2" : "text-adm-faint"}>
                            {booked}/{capacity}
                          </span>
                        )}
                      </span>
                    </span>
                    {closed ? (
                      <span className="mt-1 block text-[10px] font-bold uppercase text-adm-rose">Kapalı</span>
                    ) : (
                      <>
                        <span className="mt-1 grid gap-0.5 max-[760px]:hidden">
                          {dayEvents.slice(0, 2).map((ev) => (
                            <span key={ev.id} className="truncate rounded bg-adm-surface/80 px-1 text-[10.5px] text-adm-ink-2">
                              {formatBookingTime(ev.pickup)} {ev.region}
                            </span>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="ps-1 text-[10px] text-adm-muted">+{dayEvents.length - 2} daha</span>
                          )}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="mt-1 hidden text-[10px] text-adm-muted max-[760px]:block">{dayEvents.length} iş</span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-adm-line-2 px-4 py-2.5 text-[11.5px] text-adm-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-adm-blue-soft" />
                Rezervasyon var
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-adm-amber-soft" />
                Dolu
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-adm-rose-soft" />
                Kapalı
              </span>
              <span className="flex items-center gap-1.5">
                <Settings2 size={11} className="text-adm-blue" />
                Bu güne özel kapasite
              </span>
            </div>
          </div>
        </Card>

        <div className="grid min-w-0 gap-5">
          <Card
            title={sel ? dayHeading(sel) : "Gün seçin"}
            actions={sel && <IconButton size="sm" icon={X} label="Seçimi kaldır" onClick={() => setSelected(null)} />}
          >
            {!sel ? (
              <p className="py-3 text-center text-[13px] text-adm-muted">Kapasiteyi değiştirmek için takvimden bir gün seçin.</p>
            ) : (
              <div className="grid gap-4">
                <div className={cx("rounded-adm px-3 py-2.5", selClosed ? "bg-adm-rose-soft" : "bg-adm-surface-2")}>
                  {selClosed ? (
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-adm-rose">
                      <Lock size={14} aria-hidden="true" />
                      Kapalı, yeni rezervasyon alınmıyor
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold tabular-nums">
                        {selBooked} / {selCapacity} rezervasyon
                        <span className="ms-1.5 text-xs font-medium text-adm-muted">({Math.max(0, selCapacity - selBooked)} boş)</span>
                      </p>
                      <p className="text-[11.5px] text-adm-muted">
                        {selOverride ? "Bu güne özel kapasite uygulanıyor" : `Varsayılan kapasite (${globalMax}) uygulanıyor`}
                      </p>
                    </>
                  )}
                  {selOverride?.reason && <p className="mt-1 text-[11.5px] italic text-adm-muted">“{selOverride.reason}”</p>}
                </div>

                <Field label="Bu güne özel kapasite">
                  <Stepper value={current.capacity} min={0} label="Günün kapasitesi" onChange={(capacity) => editDraft({ capacity })} />
                  <div className="mt-2 flex flex-wrap gap-1">
                    {PRESETS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => editDraft({ capacity: n })}
                        className={cx(
                          "h-7 min-w-8 rounded-adm-sm px-2 text-xs font-semibold transition-colors",
                          current.capacity === n ? "bg-adm-ink text-white" : "bg-adm-line-2 text-adm-ink-2 hover:bg-adm-seg"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <Input
                    className="mt-2"
                    value={current.reason}
                    onChange={(e) => editDraft({ reason: e.target.value })}
                    placeholder="Not (isteğe bağlı): bayram, ek araç…"
                    aria-label="Not"
                  />
                  {current.capacity > 0 && current.capacity < selBooked && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-adm-sm bg-adm-amber-soft px-2.5 py-2 text-[11.5px] text-[#7a4a06]">
                      <AlertTriangle size={13} aria-hidden="true" className="mt-px shrink-0" />
                      Bu günde zaten {selBooked} rezervasyon var. Düşük kapasite mevcutları iptal etmez, yalnızca yenisini durdurur.
                    </p>
                  )}
                </Field>

                <div className="grid gap-2">
                  <Button variant="primary" loading={saving === "day"} disabled={current.capacity === 0} onClick={() => saveOverride(current.capacity)}>
                    Kapasiteyi {current.capacity} yap
                  </Button>
                  {selOverride && !selClosed && (
                    <Button icon={RotateCcw} loading={saving === "reset"} onClick={clearOverride}>
                      Varsayılana dön ({globalMax})
                    </Button>
                  )}
                  {selClosed ? (
                    <Button icon={Unlock} loading={saving === "reset"} onClick={clearOverride} className="text-adm-green">
                      Günü aç
                    </Button>
                  ) : (
                    <Button variant="danger-ghost" icon={Lock} loading={saving === "close"} onClick={() => saveOverride(null)}>
                      Günü tamamen kapat
                    </Button>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[.06em] text-adm-muted">Bu günün transferleri</p>
                  {selEvents.length === 0 ? (
                    <p className="py-2 text-center text-[13px] text-adm-muted">Bu gün transfer yok</p>
                  ) : (
                    <ul className="grid max-h-[40vh] gap-1.5 overflow-y-auto">
                      {selEvents.map((ev) => (
                        <li key={ev.id}>
                          <button
                            type="button"
                            onClick={() => setOpen(ev.code)}
                            className="w-full rounded-adm border border-adm-line-2 px-3 py-2 text-start transition-colors hover:border-adm-line hover:bg-adm-surface-2"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-[13.5px] font-bold tabular-nums">{formatBookingTime(ev.pickup)}</span>
                              <Chip plain>{ev.leg === "return" ? "Dönüş" : "Gidiş"}</Chip>
                              <span className="ms-auto">
                                <ReservationStatusChip status={ev.status} />
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-adm-ink-2">{ev.route}</span>
                            <span className="block truncate text-xs text-adm-muted">
                              <span className="font-mono">{ev.code}</span> · {ev.customer}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card title="Varsayılan günlük kapasite" subtitle="Özel ayarı olmayan bütün günler">
            {data ? (
              <>
                <Stepper value={globalValue} min={1} label="Varsayılan kapasite" onChange={setDraftGlobal} />
                <Button className="mt-2 w-full" loading={saving === "global"} disabled={globalValue === globalMax} onClick={saveGlobal}>
                  {globalValue === globalMax ? `Varsayılan: ${globalMax}` : `Varsayılanı ${globalValue} yap`}
                </Button>
              </>
            ) : (
              <EmptyState compact icon={Settings2} title="Yükleniyor…" />
            )}
          </Card>
        </div>
      </div>

      <ReservationDrawer code={open} onClose={() => setOpen(null)} onChanged={refresh} adminBase={adminBase} />
    </>
  );
}
