"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Car, Check, Clock, Search, UserPlus, X } from "lucide-react";
import { formatBookingDateShort, formatBookingTime } from "@/lib/datetime";
// Fare in euro, driver paid in dollars — never subtract without converting.
import { convertSettlement, settlementOf } from "@/lib/currency";
import { Button, Chip, Field, IconButton, Input, Select, cx } from "@/components/admin/ui";
import {
  type Driver,
  type Leg,
  type Reservation,
  type Vehicle,
  dayKey,
  fmtDateTime,
  isCash,
  legDateTime,
  liveAssignment,
  LIVE_ASSIGNMENT_STATUSES,
  moneyText,
  regionName,
} from "./types";

interface Conflict {
  type: string;
  reservation_code: string;
  pickup: string;
  region: string;
}

/** What the assign call hands back: the driver's link and a ready WhatsApp message. */
export interface AssignResult {
  driverLink: string;
  whatsappUrl: string;
  driverName: string;
}

const CLOSE_BY_MS = 3 * 60 * 60 * 1000;

/** Every driver's jobs on the day of this leg, and how many sit within three hours of it. */
function workloads(all: Reservation[], targetIso: string) {
  const day = dayKey(targetIso);
  const target = new Date(targetIso).getTime();
  const map = new Map<string, { jobs: { code: string; at: string; region: string }[]; closeBy: number }>();
  for (const r of all) {
    for (const da of r.driver_assignments ?? []) {
      if (!da.driver_id || !LIVE_ASSIGNMENT_STATUSES.includes(da.status)) continue;
      const at = legDateTime(r, da.leg);
      if (dayKey(at) !== day) continue;
      const entry = map.get(da.driver_id) ?? { jobs: [], closeBy: 0 };
      entry.jobs.push({ code: r.reservation_code, at, region: regionName(r) });
      if (Math.abs(new Date(at).getTime() - target) < CLOSE_BY_MS) entry.closeBy += 1;
      map.set(da.driver_id, entry);
    }
  }
  for (const entry of map.values()) entry.jobs.sort((a, b) => a.at.localeCompare(b.at));
  return map;
}

function Step({
  n,
  title,
  done,
  hint,
  disabled,
  children,
}: {
  n: number;
  title: string;
  done?: boolean;
  hint?: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cx(disabled && "pointer-events-none opacity-40")}>
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className={cx(
            "grid size-[18px] place-items-center rounded-full text-[10px] font-bold",
            done ? "bg-adm-ink text-white" : "bg-adm-line-2 text-adm-muted"
          )}
        >
          {n}
        </span>
        <span className="text-[12.5px] font-semibold text-adm-ink-2">{title}</span>
        {hint && <span className="ms-auto text-[11.5px] text-adm-faint">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Chosen({ title, sub, onChange }: { title: string; sub?: ReactNode; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center gap-2 rounded-adm-sm border border-adm-ink bg-adm-surface-2 px-3 py-2 text-start"
    >
      <Check size={15} aria-hidden="true" className="shrink-0 text-adm-brand" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{title}</span>
        {sub && <span className="block truncate text-[11.5px] text-adm-muted">{sub}</span>}
      </span>
      <span className="text-xs font-semibold text-adm-muted">Değiştir</span>
    </button>
  );
}

/**
 * Books a driver and a vehicle onto one leg, inside the reservation it belongs
 * to. Drivers are listed least busy first, with what they already have that
 * day; the fee is agreed in the same step, in the currency it is paid in.
 */
export default function AssignDriverPanel({
  reservation: r,
  nearby,
  drivers,
  vehicles,
  leg,
  onClose,
  onAssigned,
}: {
  reservation: Reservation;
  nearby: Reservation[];
  drivers: Driver[];
  vehicles: Vehicle[];
  leg: Leg;
  onClose: () => void;
  onAssigned: (result: AssignResult) => void;
}) {
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverQuery, setDriverQuery] = useState("");
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [returnPickupTime, setReturnPickupTime] = useState("");
  // Empty rather than prefilled from an earlier assignment: an agreed rate is
  // changed on the driver's card, where it belongs to one leg unambiguously.
  const [driverFee, setDriverFee] = useState("");
  const [feeCurrency, setFeeCurrency] = useState<"USD" | "EUR">("USD");
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [busy, setBusy] = useState<null | "checking" | "assigning">(null);
  const [error, setError] = useState<string | null>(null);

  const existing = liveAssignment(r, leg);
  const targetIso = legDateTime(r, leg);
  const fareCurrency = settlementOf(r.currency);
  const load = useMemo(() => workloads(nearby, targetIso), [nearby, targetIso]);
  const driver = drivers.find((d) => d.id === driverId);
  const vehicle = vehicles.find((v) => v.id === vehicleId);

  /**
   * What this booking leaves once every driver on it is paid, in the fare's
   * currency. The other leg counts; a leg with no rate yet is called out rather
   * than treated as free.
   */
  const feeMath = useMemo(() => {
    const fare = Number(r.total_price) || 0;
    const entered = driverFee.trim() === "" ? null : Number(driverFee);
    const thisLeg = entered !== null && Number.isFinite(entered) && entered >= 0 ? entered : null;
    const inFare = (amount: number, currency: string | null | undefined) =>
      convertSettlement(amount, settlementOf(currency), fareCurrency, r.exchange_rate_usd, r.exchange_rate_eur);

    let othersTotal = 0;
    let othersUnpriced = 0;
    let unconvertible = false;
    for (const da of r.driver_assignments ?? []) {
      if (da.leg === leg || !LIVE_ASSIGNMENT_STATUSES.includes(da.status)) continue;
      if (da.driver_fee == null) {
        othersUnpriced += 1;
        continue;
      }
      const converted = inFare(Number(da.driver_fee) || 0, da.driver_fee_currency);
      if (converted === null) unconvertible = true;
      else othersTotal += converted;
    }
    const thisInFare = thisLeg === null ? 0 : inFare(thisLeg, feeCurrency);
    if (thisInFare === null) unconvertible = true;
    const driversTotal = (thisInFare ?? 0) + othersTotal;
    return {
      fare,
      thisLeg,
      othersTotal,
      othersUnpriced,
      driversTotal,
      profit: unconvertible ? null : fare - driversTotal,
    };
  }, [r, leg, driverFee, feeCurrency, fareCurrency]);

  const driverList = useMemo(() => {
    const q = driverQuery.trim().toLocaleLowerCase("tr-TR");
    const list = q
      ? drivers.filter((d) => d.full_name.toLocaleLowerCase("tr-TR").includes(q) || (d.phone ?? "").includes(q))
      : drivers;
    return [...list].sort((a, b) => (load.get(a.id)?.jobs.length ?? 0) - (load.get(b.id)?.jobs.length ?? 0));
  }, [drivers, driverQuery, load]);

  const vehicleList = useMemo(() => {
    const q = vehicleQuery.trim().toLocaleLowerCase("tr-TR");
    if (!q) return vehicles;
    return vehicles.filter((v) => `${v.plate_number} ${v.brand} ${v.model}`.toLocaleLowerCase("tr-TR").includes(q));
  }, [vehicles, vehicleQuery]);

  const submit = async (force: boolean) => {
    if (!driverId || !vehicleId) return;
    setError(null);

    // Checked before anything is removed, so backing out of a clash leaves the
    // current driver where he was.
    if (!force) {
      setBusy("checking");
      try {
        const check = await fetch("/api/admin/check-conflicts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId: r.id, driverId, vehicleId }),
        });
        const data = await check.json();
        if (data.hasConflicts) {
          setConflicts(data.conflicts ?? []);
          setBusy(null);
          return;
        }
      } catch {
        // The clash check is advisory; carry on without it.
      }
    }

    setBusy("assigning");
    try {
      // Replacing: free the slot first — the API refuses a second live driver on a leg.
      if (existing) {
        const un = await fetch("/api/admin/unassign-driver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentId: existing.id }),
        });
        if (!un.ok) {
          const d = await un.json().catch(() => null);
          setError(d?.error ?? "Mevcut şoför kaldırılamadı.");
          setBusy(null);
          return;
        }
      }

      const res = await fetch("/api/admin/assign-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: r.id,
          driverId,
          vehicleId,
          leg,
          ...(leg === "return" && returnPickupTime ? { pickupTime: returnPickupTime } : {}),
          driverFee: driverFee.trim() === "" ? null : driverFee.trim(),
          driverFeeCurrency: feeCurrency,
        }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok || !data?.driverLink) {
        setError(data?.error ?? `Atama yapılamadı (kod ${res.status}).`);
        setBusy(null);
        return;
      }
      onAssigned({
        driverLink: data.driverLink,
        whatsappUrl: data.whatsappUrl,
        driverName: driver?.full_name ?? "Şoför",
      });
    } catch {
      setError("Atama sırasında beklenmeyen bir hata oluştu.");
      setBusy(null);
    }
  };

  const plateSearchId = `vehicle-search-${r.id}-${leg}`;
  const driverSearchId = `driver-search-${r.id}-${leg}`;

  return (
    <div className="overflow-hidden rounded-adm border border-adm-line bg-adm-surface shadow-adm-sm">
      <div className="flex items-center gap-2 border-b border-adm-line-2 px-3.5 py-2.5">
        <UserPlus size={15} aria-hidden="true" className="text-adm-muted" />
        <span className="text-[13.5px] font-semibold">{existing ? "Şoförü değiştir" : "Şoför ata"}</span>
        <span className="flex items-center gap-1 text-xs text-adm-muted">
          <Clock size={12} aria-hidden="true" />
          {fmtDateTime(targetIso)}
        </span>
        <IconButton icon={X} label="Kapat" size="sm" className="ms-auto" onClick={onClose} />
      </div>

      <div className="grid gap-4 p-3.5">
        {existing && (
          <p className="flex items-start gap-2 rounded-adm-sm border border-adm-amber-line bg-adm-amber-soft px-3 py-2 text-[12.5px] text-[#7a4a06]">
            <AlertTriangle size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              Bu bacakta <b className="font-semibold">{existing.drivers?.full_name}</b> var. Kaydedince mevcut atama
              kaldırılır ve eski şoför linki geçersiz olur.
            </span>
          </p>
        )}

        <Step n={1} title="Şoför" done={!!driver} hint={driver ? undefined : `${driverList.length} aktif · en müsait üstte`}>
          {driver ? (
            <Chosen title={driver.full_name} sub={driver.phone} onChange={() => setDriverId("")} />
          ) : (
            <>
              <Input
                id={driverSearchId}
                icon={Search}
                value={driverQuery}
                onChange={(e) => setDriverQuery(e.target.value)}
                placeholder="Şoför adı veya telefon"
                aria-label="Şoför ara"
              />
              <div className="mt-2 grid max-h-56 gap-1 overflow-y-auto pe-0.5">
                {driverList.map((d) => {
                  const w = load.get(d.id);
                  const jobs = w?.jobs ?? [];
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDriverId(d.id)}
                      className="rounded-adm-sm border border-adm-line px-3 py-2 text-start transition-colors hover:border-adm-line-strong hover:bg-adm-surface-2"
                    >
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold">{d.full_name}</span>
                          <span className="block text-[11.5px] text-adm-muted">{d.phone}</span>
                        </span>
                        {w && w.closeBy > 0 ? (
                          <Chip tone="amber" plain>
                            ±3 sa içinde {w.closeBy} iş
                          </Chip>
                        ) : jobs.length > 0 ? (
                          <Chip plain>O gün {jobs.length} transfer</Chip>
                        ) : (
                          <Chip tone="green" plain>
                            Müsait
                          </Chip>
                        )}
                      </span>
                      {jobs.length > 0 && (
                        <span className="mt-1 block truncate text-[11px] text-adm-muted">
                          {jobs.map((t) => `${formatBookingTime(t.at)} ${t.region}`).join(" · ")}
                        </span>
                      )}
                    </button>
                  );
                })}
                {driverList.length === 0 && (
                  <p className="py-5 text-center text-[13px] text-adm-muted">Şoför bulunamadı</p>
                )}
              </div>
            </>
          )}
        </Step>

        <Step n={2} title="Araç" done={!!vehicle} disabled={!driver} hint={driver ? undefined : "önce şoför seçin"}>
          {vehicle ? (
            <Chosen
              title={vehicle.plate_number}
              sub={`${vehicle.brand} ${vehicle.model}`}
              onChange={() => setVehicleId("")}
            />
          ) : (
            <>
              <Input
                id={plateSearchId}
                icon={Search}
                value={vehicleQuery}
                onChange={(e) => setVehicleQuery(e.target.value)}
                placeholder="Plaka, marka veya model"
                aria-label="Araç ara"
              />
              <div className="mt-2 grid max-h-44 grid-cols-1 gap-1 overflow-y-auto pe-0.5 min-[420px]:grid-cols-2">
                {vehicleList.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVehicleId(v.id)}
                    className="flex items-center gap-2 rounded-adm-sm border border-adm-line px-3 py-2 text-start transition-colors hover:border-adm-line-strong hover:bg-adm-surface-2"
                  >
                    <Car size={15} aria-hidden="true" className="shrink-0 text-adm-faint" />
                    <span className="min-w-0">
                      <span className="block font-mono text-[13px] font-semibold">{v.plate_number}</span>
                      <span className="block truncate text-[11.5px] text-adm-muted">
                        {v.brand} {v.model}
                      </span>
                    </span>
                  </button>
                ))}
                {vehicleList.length === 0 && (
                  <p className="col-span-full py-5 text-center text-[13px] text-adm-muted">Araç bulunamadı</p>
                )}
              </div>
            </>
          )}
        </Step>

        <Step n={3} title="Şoföre ödenecek" done={feeMath.thisLeg !== null}>
          {/* The currency sits beside the amount: it is agreed per job, and a
              rate typed under the wrong one cannot be told from the number. */}
          <div className="flex items-center gap-2">
            <Select
              aria-label="Şoför ücretinin para birimi"
              value={feeCurrency}
              onChange={(e) => setFeeCurrency(e.target.value === "EUR" ? "EUR" : "USD")}
              className="w-24"
            >
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </Select>
            <Input
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={driverFee}
              onChange={(e) => setDriverFee(e.target.value)}
              placeholder="örn. 110"
              aria-label="Şoför ücreti"
              className="w-32"
            />
          </div>
          {feeMath.thisLeg === null ? (
            <p className="mt-1.5 text-[11.5px] text-adm-muted">
              Şimdi girmek zorunda değil, sonra şoför kartından da yazılır. Girilene kadar bu iş “ücreti girilmemiş”
              sayılır.
            </p>
          ) : (
            <p className="mt-1.5 flex flex-wrap gap-x-1.5 text-[11.5px] text-adm-muted">
              <span>
                Müşteri <b className="font-semibold text-adm-ink-2">{moneyText(feeMath.fare, fareCurrency)}</b>
              </span>
              <span>
                · Şoför{feeMath.othersTotal > 0 ? "ler" : ""}{" "}
                <b className="font-semibold text-adm-ink-2">{moneyText(feeMath.driversTotal, fareCurrency)}</b>
                {feeCurrency !== fareCurrency && ` (girilen ${moneyText(feeMath.thisLeg, feeCurrency)})`}
              </span>
              <span>
                ·{" "}
                {feeMath.profit === null ? (
                  <b className="font-semibold text-adm-amber">kur kaydı yok, kalan hesaplanamıyor</b>
                ) : (
                  <b className={cx("font-semibold", feeMath.profit < 0 ? "text-adm-rose" : "text-adm-green")}>
                    Kalan {moneyText(feeMath.profit, fareCurrency)}
                  </b>
                )}
              </span>
              {feeMath.othersUnpriced > 0 && <span className="text-adm-amber">· diğer bacağın ücreti girilmedi</span>}
            </p>
          )}
          {isCash(r) && Number(r.driver_amount) > 0 && leg === "outbound" && (
            <p className="mt-2 rounded-adm-sm bg-adm-amber-soft px-2.5 py-2 text-[11.5px] text-[#7a4a06]">
              Nakit rezervasyon: şoför müşteriden {moneyText(r.driver_amount, fareCurrency)} tahsil edecek. Bu tutar
              cari hesabında borcundan düşülür.
            </p>
          )}
        </Step>

        {leg === "return" && (
          <Field
            label="Otelden alış saati"
            htmlFor={`return-pickup-${r.id}`}
            hint="Uçuş saatinden geriye hesaplanan alış saati; şoför voucher'ında görünür."
          >
            <Input
              id={`return-pickup-${r.id}`}
              type="time"
              value={returnPickupTime}
              onChange={(e) => setReturnPickupTime(e.target.value)}
              className="w-36"
            />
          </Field>
        )}

        {conflicts.length > 0 && (
          <div className="rounded-adm-sm border border-adm-amber-line bg-adm-amber-soft p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-adm-amber">
              <AlertTriangle size={14} aria-hidden="true" />
              Aynı saatlerde başka iş var
            </p>
            <ul className="mb-2.5 grid gap-0.5 text-xs text-[#7a4a06]">
              {conflicts.map((c) => (
                <li key={`${c.reservation_code}-${c.type}`}>
                  <span className="font-mono font-semibold">{c.reservation_code}</span> · {c.region} ·{" "}
                  {formatBookingDateShort(c.pickup)} {formatBookingTime(c.pickup)} (
                  {c.type === "driver" ? "şoför" : "araç"})
                </li>
              ))}
            </ul>
            <Button size="sm" variant="warn" onClick={() => submit(true)} disabled={busy !== null}>
              Yine de ata
            </Button>
          </div>
        )}

        {error && (
          <p className="rounded-adm-sm border border-[#f6c9d1] bg-adm-rose-soft px-3 py-2 text-[12.5px] text-adm-rose">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-adm-line-2 bg-adm-surface-2 px-3.5 py-2.5">
        <span className="text-xs text-adm-muted max-[760px]:hidden">
          {driverId && vehicleId
            ? "Atamadan sonra şoför linki ve WhatsApp mesajı hazırlanır."
            : "Şoför ve araç seçin."}
        </span>
        <Button variant="ghost" size="sm" className="ms-auto" onClick={onClose}>
          Vazgeç
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={UserPlus}
          loading={busy !== null}
          disabled={!driverId || !vehicleId}
          onClick={() => submit(false)}
        >
          {busy === "checking"
            ? "Kontrol ediliyor…"
            : busy === "assigning"
              ? "Atanıyor…"
              : existing
                ? "Şoförü değiştir"
                : "Şoförü ata"}
        </Button>
      </div>
    </div>
  );
}
