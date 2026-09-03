"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import {
  formatBookingDateShort,
  formatBookingTime,
} from "@/lib/datetime";
import {
  type Driver,
  type Leg,
  type Reservation,
  type Vehicle,
  customerName,
  fmtDateTime,
  legDateTime,
  liveAssignment,
  regionName,
  LIVE_ASSIGNMENT_STATUSES,
} from "./types";

interface Conflict {
  type: string;
  reservation_code: string;
  pickup: string;
  region: string;
}

interface Props {
  reservation: Reservation;
  /** Every reservation on screen — used to show each driver's real workload. */
  allReservations: Reservation[];
  drivers: Driver[];
  vehicles: Vehicle[];
  initialLeg: Leg;
  onClose: () => void;
  onAssigned: (result: {
    driverLink: string;
    whatsappUrl: string;
    driverName: string;
  }) => void;
}

/** Transfers already on a driver's plate around the moment we are booking. */
function driverWorkload(all: Reservation[], driverId: string, target: Date) {
  const sameDay: Array<{ code: string; at: Date; region: string }> = [];
  for (const r of all) {
    for (const da of r.driver_assignments ?? []) {
      if (da.driver_id !== driverId) continue;
      if (!LIVE_ASSIGNMENT_STATUSES.includes(da.status)) continue;
      const at = new Date(legDateTime(r, da.leg));
      if (at.toDateString() !== target.toDateString()) continue;
      sameDay.push({ code: r.reservation_code, at, region: regionName(r) });
    }
  }
  sameDay.sort((a, b) => a.at.getTime() - b.at.getTime());
  const tight = sameDay.filter(
    (t) => Math.abs(t.at.getTime() - target.getTime()) < 3 * 60 * 60 * 1000
  );
  return { sameDay, tight };
}

export default function AssignDriverModal({
  reservation: r,
  allReservations,
  drivers,
  vehicles,
  initialLeg,
  onClose,
  onAssigned,
}: Props) {
  const [leg, setLeg] = useState<Leg>(initialLeg);
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverQuery, setDriverQuery] = useState("");
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [returnPickupTime, setReturnPickupTime] = useState("");
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [busy, setBusy] = useState<null | "checking" | "assigning">(null);
  const [error, setError] = useState<string | null>(null);

  const existing = liveAssignment(r, leg);
  const targetIso = legDateTime(r, leg);
  const isRoundTrip = r.trip_type === "round_trip";

  const filteredDrivers = useMemo(() => {
    const target = new Date(targetIso);
    const q = driverQuery.trim().toLowerCase();
    const list = q
      ? drivers.filter(
          (d) => d.full_name.toLowerCase().includes(q) || d.phone?.includes(q)
        )
      : drivers;
    // Least-loaded first so the obvious pick sits at the top.
    return [...list].sort(
      (a, b) =>
        driverWorkload(allReservations, a.id, target).sameDay.length -
        driverWorkload(allReservations, b.id, target).sameDay.length
    );
  }, [drivers, driverQuery, allReservations, targetIso]);

  const filteredVehicles = useMemo(() => {
    const q = vehicleQuery.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      `${v.plate_number} ${v.brand} ${v.model}`.toLowerCase().includes(q)
    );
  }, [vehicles, vehicleQuery]);

  const submit = async (force: boolean) => {
    if (!driverId || !vehicleId) return;
    setError(null);

    // Replacing an existing driver: free the slot first — the API rejects doubles.
    if (existing) {
      const un = await fetch("/api/admin/unassign-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: existing.id }),
      });
      if (!un.ok) {
        const d = await un.json().catch(() => null);
        setError(d?.error ?? "Mevcut şoför kaldırılamadı.");
        return;
      }
    }

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
        /* conflict check is advisory — carry on if it fails */
      }
    }

    setBusy("assigning");
    try {
      const res = await fetch("/api/admin/assign-driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: r.id,
          driverId,
          vehicleId,
          leg,
          ...(leg === "return" && returnPickupTime
            ? { pickupTime: returnPickupTime }
            : {}),
        }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok || !data?.driverLink) {
        setError(data?.error ?? `Atama başarısız (kod ${res.status}).`);
        setBusy(null);
        return;
      }

      onAssigned({
        driverLink: data.driverLink,
        whatsappUrl: data.whatsappUrl,
        driverName: drivers.find((d) => d.id === driverId)?.full_name ?? "Şoför",
      });
    } catch (err) {
      console.error("assign-driver", err);
      setError("Atama sırasında beklenmeyen bir hata oluştu.");
      setBusy(null);
    }
  };

  const legTab = (value: Leg, label: string) => {
    const assigned = liveAssignment(r, value);
    const active = leg === value;
    return (
      <button
        key={value}
        onClick={() => {
          setLeg(value);
          setConflicts([]);
          setError(null);
        }}
        className={`flex-1 rounded-lg px-3 py-2.5 text-left transition ${
          active ? "bg-white shadow-sm ring-1 ring-slate-900/10" : "hover:bg-white/60"
        }`}
      >
        <span
          className={`block text-sm font-semibold ${active ? "text-slate-900" : "text-slate-500"}`}
        >
          {label}
        </span>
        <span
          className={`block text-[11px] mt-0.5 ${
            assigned ? "text-amber-600 font-medium" : "text-slate-400"
          }`}
        >
          {assigned ? `${assigned.drivers?.full_name} — değiştir` : "Atanmadı"}
        </span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">Şoför Ata</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="font-mono font-semibold text-slate-700">
                {r.reservation_code}
              </span>
              <span className="inline-flex items-center gap-1">
                <UserRound size={12} />
                {customerName(r)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                Havalimanı → {regionName(r)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Leg selector */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Hangi bacak?
            </p>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {legTab("outbound", "Gidiş")}
              {isRoundTrip && legTab("return", "Dönüş")}
            </div>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={13} className="text-slate-400" />
              Transfer zamanı:{" "}
              <span className="font-semibold text-slate-700">
                {fmtDateTime(targetIso)}
              </span>
            </p>
          </div>

          {existing && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                Bu bacakta <strong>{existing.drivers?.full_name}</strong> atalı.
                Kaydettiğinizde mevcut atama kaldırılıp yenisi oluşturulacak, eski
                şoför linki geçersiz olacak.
              </span>
            </div>
          )}

          {/* Driver picker */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Şoför
              </p>
              <span className="text-[11px] text-slate-400">
                {filteredDrivers.length} aktif şoför · en müsait üstte
              </span>
            </div>
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={driverQuery}
                onChange={(e) => setDriverQuery(e.target.value)}
                placeholder="Şoför adı veya telefon ara..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
              {filteredDrivers.map((d) => {
                const { sameDay, tight } = driverWorkload(
                  allReservations,
                  d.id,
                  new Date(targetIso)
                );
                const selected = driverId === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDriverId(d.id)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                      selected
                        ? "border-slate-900 bg-slate-900/[0.03] ring-1 ring-slate-900"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {d.full_name}
                        </p>
                        <p className="text-[11px] text-slate-500">{d.phone}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {tight.length > 0 ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                            ±3sa içinde {tight.length} iş
                          </span>
                        ) : sameDay.length > 0 ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            O gün {sameDay.length} transfer
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                            Müsait
                          </span>
                        )}
                        {selected && <CheckCircle2 size={16} className="text-slate-900" />}
                      </div>
                    </div>
                    {selected && sameDay.length > 0 && (
                      <ul className="mt-2 space-y-0.5 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                        {sameDay.map((t) => (
                          <li key={`${t.code}-${t.at.toISOString()}`}>
                            {formatBookingTime(t.at)}{" "}
                            · {t.region} · <span className="font-mono">{t.code}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                );
              })}
              {filteredDrivers.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">
                  Şoför bulunamadı
                </p>
              )}
            </div>
          </div>

          {/* Vehicle picker */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Araç
            </p>
            <div className="relative mb-2">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={vehicleQuery}
                onChange={(e) => setVehicleQuery(e.target.value)}
                placeholder="Plaka, marka veya model ara..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div className="grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredVehicles.map((v) => {
                const selected = vehicleId === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVehicleId(v.id)}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                      selected
                        ? "border-slate-900 bg-slate-900/[0.03] ring-1 ring-slate-900"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Car size={15} className="shrink-0 text-slate-400" />
                      <span className="min-w-0">
                        <span className="block font-mono text-sm font-bold text-slate-900">
                          {v.plate_number}
                        </span>
                        <span className="block truncate text-[11px] text-slate-500">
                          {v.brand} {v.model}
                        </span>
                      </span>
                    </span>
                    {selected && <CheckCircle2 size={16} className="shrink-0 text-slate-900" />}
                  </button>
                );
              })}
              {filteredVehicles.length === 0 && (
                <p className="col-span-full py-6 text-center text-sm text-slate-400">
                  Araç bulunamadı
                </p>
              )}
            </div>
          </div>

          {/* Return pickup time */}
          {leg === "return" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Dönüş alış saati (otelden)
              </label>
              <input
                type="time"
                value={returnPickupTime}
                onChange={(e) => setReturnPickupTime(e.target.value)}
                className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              <p className="mt-1.5 text-[11px] text-slate-500">
                Uçuş saatinden geriye doğru hesaplanan alış saati. Şoför
                voucher&apos;ında bu saat görünür.
              </p>
            </div>
          )}

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <AlertTriangle size={14} />
                Zamanlama çakışması tespit edildi
              </p>
              <ul className="mb-3 space-y-1">
                {conflicts.map((c) => (
                  <li
                    key={`${c.reservation_code}-${c.type}`}
                    className="text-xs text-amber-700"
                  >
                    <span className="font-mono font-semibold">
                      {c.reservation_code}
                    </span>{" "}
                    — {c.region} —{" "}
                    {formatBookingDateShort(c.pickup)}{" "}
                    {formatBookingTime(c.pickup)}{" "}
                    ({c.type === "driver" ? "şoför" : "araç"})
                  </li>
                ))}
              </ul>
              <button
                onClick={() => submit(true)}
                disabled={busy !== null}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Çakışmaya rağmen ata
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3.5">
          <p className="hidden text-xs text-slate-500 sm:block">
            {driverId && vehicleId
              ? "Atama sonrası şoför linki ve WhatsApp mesajı hazırlanır."
              : "Devam etmek için şoför ve araç seçin."}
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 sm:flex-none"
            >
              Vazgeç
            </button>
            <button
              onClick={() => submit(false)}
              disabled={!driverId || !vehicleId || busy !== null}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 sm:flex-none"
            >
              <Send size={14} />
              {busy === "checking"
                ? "Kontrol ediliyor…"
                : busy === "assigning"
                  ? "Atanıyor…"
                  : existing
                    ? "Şoförü Değiştir"
                    : `${leg === "return" ? "Dönüş" : "Gidiş"} Şoförünü Ata`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
