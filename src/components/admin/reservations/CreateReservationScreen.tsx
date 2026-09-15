"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { calculatePrice } from "@/lib/pricing";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Segmented,
  Select,
  Textarea,
  cx,
  useToast,
} from "@/components/admin/ui";
import { DIRECTIONS, legRoute, type Direction } from "@/lib/transfer-route";
import type { FilterOption } from "./ReservationsScreen";

const LOCALES = ["tr", "en", "de", "pl", "ru", "nl", "ro", "ar"] as const;

interface VehicleOption {
  categoryId: string;
  name: string;
  maxPassengers: number;
  maxLuggage: number;
  oneWayPrice: number;
  roundTripPrice: number | null;
  oneWayCashPrice: number | null;
  roundTripCashPrice: number | null;
  cashDepositAmount: number | null;
  roundTripCashDepositAmount: number | null;
}

interface PricingSettings {
  childSeatFee: number;
  welcomeSignFee: number;
  cashPaymentEnabled: boolean;
  nightTariffEnabled: boolean;
  nightTariffStart: string;
  nightTariffEnd: string;
  nightTariffPercent: number;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * A booking taken over the phone or WhatsApp, by an operator, for a customer
 * who cannot use the public wizard themselves. Full page rather than a
 * dialog — there is as much to fill in as the wizard itself, plus the
 * customer's contact details it collects for free from a signed-in visitor.
 *
 * Creates the reservation unpaid (`pending`); the next step is the
 * reservation's own "Ödeme linki gönder" action, which is what actually
 * starts the charge (see PaymentLinkDialog).
 */
export default function CreateReservationScreen({
  regions,
  adminBase,
}: {
  regions: FilterOption[];
  adminBase: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    locale: "tr" as (typeof LOCALES)[number],
    regionId: "",
    categoryId: "",
    tripType: "one_way" as "one_way" | "round_trip",
    direction: "airport_to_region" as Direction,
    pickupDate: today(),
    pickupTime: "12:00",
    returnDate: "",
    returnTime: "",
    flightCode: "",
    returnFlightCode: "",
    adults: 1,
    children: 0,
    luggage: 0,
    childSeat: false,
    welcomeSign: false,
    welcomeName: "",
    hotelName: "",
    hotelAddress: "",
    notes: "",
    paymentMethod: "online" as "online" | "cash",
  });
  const [vehicles, setVehicles] = useState<VehicleOption[] | null>(null);
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const regionName = regions.find((r) => r.id === form.regionId)?.name ?? "";

  useEffect(() => {
    if (!form.regionId) {
      setVehicles(null);
      setSettings(null);
      return;
    }
    let cancelled = false;
    setLoadingPricing(true);
    fetch(`/api/admin/region-pricing?regionId=${form.regionId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setVehicles(d.vehicles);
        setSettings(d.settings);
        set("categoryId", d.vehicles[0]?.categoryId ?? "");
      })
      .finally(() => !cancelled && setLoadingPricing(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.regionId]);

  const vehicle = vehicles?.find((v) => v.categoryId === form.categoryId) ?? null;

  const quote = useMemo(() => {
    if (!vehicle || !settings) return null;
    const parseHour = (v: string) => parseInt(v.includes(":") ? v.split(":")[0] : v, 10) || 0;
    const calc = calculatePrice({
      oneWayPrice: vehicle.oneWayPrice,
      roundTripPrice: vehicle.roundTripPrice,
      tripType: form.tripType,
      pickupTime: form.pickupTime,
      childSeat: form.childSeat,
      welcomeSign: form.welcomeSign,
      couponDiscountPercent: 0,
      couponDiscountFixed: 0,
      nightSurchargePercent: settings.nightTariffPercent,
      nightTariffEnabled: settings.nightTariffEnabled,
      nightTariffStart: parseHour(settings.nightTariffStart),
      nightTariffEnd: parseHour(settings.nightTariffEnd),
      childSeatFee: settings.childSeatFee,
      welcomeSignFee: settings.welcomeSignFee,
    });
    if (form.paymentMethod === "cash") {
      const cashBase = form.tripType === "round_trip" ? vehicle.roundTripCashPrice : vehicle.oneWayCashPrice;
      const deposit =
        (form.tripType === "round_trip" ? vehicle.roundTripCashDepositAmount : null) ?? vehicle.cashDepositAmount;
      if (!cashBase || !deposit) return null;
      const total = cashBase + calc.childSeatFee + calc.welcomeSignFee + calc.nightSurcharge;
      return { total, deposit, driverAmount: total - deposit };
    }
    return { total: calc.totalPrice, deposit: 0, driverAmount: 0 };
  }, [vehicle, settings, form.tripType, form.pickupTime, form.childSeat, form.welcomeSign, form.paymentMethod]);

  const cashAvailable = !!settings?.cashPaymentEnabled && !!vehicle && (form.tripType === "round_trip" ? !!vehicle.roundTripCashPrice : !!vehicle.oneWayCashPrice);

  const valid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    /.+@.+\..+/.test(form.email) &&
    form.phone.trim().length >= 7 &&
    form.regionId &&
    form.categoryId &&
    form.pickupDate &&
    form.pickupTime &&
    (form.tripType === "one_way" || (form.returnDate && form.returnTime));

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/create-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          returnDate: form.tripType === "round_trip" ? form.returnDate : null,
          returnTime: form.tripType === "round_trip" ? form.returnTime : null,
          flightCode: form.flightCode.trim() || null,
          returnFlightCode: form.returnFlightCode.trim() || null,
          welcomeName: form.welcomeName.trim() || null,
          hotelName: form.hotelName.trim() || null,
          hotelAddress: form.hotelAddress.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast(data?.error ?? "Rezervasyon oluşturulamadı.", "error");
        return;
      }
      toast("Rezervasyon oluşturuldu.");
      router.push(`${adminBase}/reservations/${data.reservationCode}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[760px] pb-10">
      <Link
        href={`${adminBase}/reservations`}
        className="mb-3 mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-adm-muted hover:text-adm-ink"
      >
        <ArrowLeft size={14} aria-hidden="true" className="rtl:rotate-180" />
        Rezervasyonlar
      </Link>

      <PageHeader title="Yeni rezervasyon" />
      <p className="-mt-2 mb-4 text-[13px] text-adm-muted">
        Online rezervasyon yapamayan bir müşteri için. Kayıt ödemesiz oluşturulur; ardından ödeme linki gönderilir.
      </p>

      <div className="grid gap-4">
        <Card title="Müşteri" flush>
          <div className="grid gap-3 p-3.5 sm:grid-cols-2">
            <Field label="Ad" htmlFor="cr-fn">
              <Input id="cr-fn" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </Field>
            <Field label="Soyad" htmlFor="cr-ln">
              <Input id="cr-ln" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </Field>
            <Field label="E-posta" htmlFor="cr-email">
              <Input id="cr-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Telefon" htmlFor="cr-phone">
              <Input id="cr-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+90…" />
            </Field>
            <Field label="Dil" htmlFor="cr-locale">
              <Select id="cr-locale" value={form.locale} onChange={(e) => set("locale", e.target.value as typeof form.locale)}>
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <Card title="Yolculuk" flush>
          <div className="grid gap-3 p-3.5 sm:grid-cols-2">
            <Field label="Bölge" htmlFor="cr-region">
              <Select id="cr-region" value={form.regionId} onChange={(e) => set("regionId", e.target.value)}>
                <option value="">Seçin…</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Araç" htmlFor="cr-vehicle" hint={loadingPricing ? "Fiyatlar yükleniyor…" : undefined}>
              <Select
                id="cr-vehicle"
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                disabled={!vehicles?.length}
              >
                {!vehicles?.length && <option value="">{form.regionId ? "Fiyat tanımlı değil" : "Önce bölge seçin"}</option>}
                {vehicles?.map((v) => (
                  <option key={v.categoryId} value={v.categoryId}>
                    {v.name} · max {v.maxPassengers} yolcu
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Gidiş türü">
              <Segmented
                value={form.tripType}
                onChange={(v) => set("tripType", v)}
                options={[
                  { value: "one_way", label: "Tek yön" },
                  { value: "round_trip", label: "Gidiş-dönüş" },
                ]}
              />
            </Field>
            <Field label="Ödeme">
              <Segmented
                value={form.paymentMethod}
                onChange={(v) => set("paymentMethod", v)}
                options={[
                  { value: "online", label: "Online" },
                  { value: "cash", label: "Nakit" },
                ]}
              />
              {form.paymentMethod === "cash" && !cashAvailable && vehicle && (
                <p className="mt-1.5 text-xs text-adm-rose">Bu araç/bölge için nakit fiyat tanımlı değil.</p>
              )}
            </Field>

            <Field label="Yön">
              <div className="grid gap-2">
                {DIRECTIONS.map((d) => {
                  const active = form.direction === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={active}
                      onClick={() => set("direction", d)}
                      className={cx(
                        "rounded-adm border px-3 py-2 text-start text-[12.5px] font-semibold transition-colors",
                        active
                          ? "border-adm-ink bg-adm-surface-2 ring-1 ring-inset ring-adm-ink"
                          : "border-adm-line hover:border-adm-line-strong hover:bg-adm-surface-2"
                      )}
                    >
                      {legRoute(d, "outbound", regionName || "Bölge")}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Uçuş kodu" htmlFor="cr-flight">
              <Input id="cr-flight" value={form.flightCode} onChange={(e) => set("flightCode", e.target.value)} placeholder="TK123" />
            </Field>

            <Field label="Gidiş tarihi" htmlFor="cr-pdate">
              <Input id="cr-pdate" type="date" value={form.pickupDate} onChange={(e) => set("pickupDate", e.target.value)} />
            </Field>
            <Field label="Gidiş saati" htmlFor="cr-ptime">
              <Input id="cr-ptime" type="time" value={form.pickupTime} onChange={(e) => set("pickupTime", e.target.value)} />
            </Field>

            {form.tripType === "round_trip" && (
              <>
                <Field label="Dönüş tarihi" htmlFor="cr-rdate">
                  <Input id="cr-rdate" type="date" value={form.returnDate} onChange={(e) => set("returnDate", e.target.value)} />
                </Field>
                <Field label="Dönüş saati" htmlFor="cr-rtime">
                  <Input id="cr-rtime" type="time" value={form.returnTime} onChange={(e) => set("returnTime", e.target.value)} />
                </Field>
                <Field label="Dönüş uçuş kodu" htmlFor="cr-rflight">
                  <Input id="cr-rflight" value={form.returnFlightCode} onChange={(e) => set("returnFlightCode", e.target.value)} placeholder="TK124" />
                </Field>
              </>
            )}
          </div>
        </Card>

        <Card title="Yolcu ve bagaj" flush>
          <div className="grid gap-3 p-3.5 sm:grid-cols-3">
            <Field label="Yetişkin" htmlFor="cr-adults">
              <Input id="cr-adults" type="number" min={1} max={20} value={form.adults} onChange={(e) => set("adults", Number(e.target.value) || 1)} />
            </Field>
            <Field label="Çocuk" htmlFor="cr-children">
              <Input id="cr-children" type="number" min={0} max={10} value={form.children} onChange={(e) => set("children", Number(e.target.value) || 0)} />
            </Field>
            <Field label="Bagaj" htmlFor="cr-luggage">
              <Input id="cr-luggage" type="number" min={0} max={20} value={form.luggage} onChange={(e) => set("luggage", Number(e.target.value) || 0)} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 px-3.5 pb-3.5">
            <ToggleChip active={form.childSeat} onClick={() => set("childSeat", !form.childSeat)}>
              Çocuk koltuğu
            </ToggleChip>
            <ToggleChip active={form.welcomeSign} onClick={() => set("welcomeSign", !form.welcomeSign)}>
              Karşılama tabelası
            </ToggleChip>
          </div>
          {form.welcomeSign && (
            <div className="px-3.5 pb-3.5">
              <Field label="Tabeladaki isim" htmlFor="cr-welcome-name">
                <Input id="cr-welcome-name" value={form.welcomeName} onChange={(e) => set("welcomeName", e.target.value)} />
              </Field>
            </div>
          )}
        </Card>

        <Card title="Otel ve not" flush>
          <div className="grid gap-3 p-3.5">
            <Field label="Otel adı" htmlFor="cr-hotel">
              <Input id="cr-hotel" value={form.hotelName} onChange={(e) => set("hotelName", e.target.value)} />
            </Field>
            <Field label="Otel adresi" htmlFor="cr-hotel-addr">
              <Input id="cr-hotel-addr" value={form.hotelAddress} onChange={(e) => set("hotelAddress", e.target.value)} />
            </Field>
            <Field label="Not" htmlFor="cr-notes">
              <Textarea id="cr-notes" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>
        </Card>

        {quote && (
          <div className="flex items-center justify-between rounded-adm border border-adm-line bg-adm-surface-2 px-4 py-3">
            <span className="text-[13px] text-adm-muted">
              {form.paymentMethod === "cash" ? "Toplam · kapora online alınır" : "Toplam"}
            </span>
            <span className="text-lg font-bold tabular-nums">
              €{quote.total.toFixed(2)}
              {form.paymentMethod === "cash" && (
                <span className="ms-2 text-[13px] font-medium text-adm-muted">(kapora €{quote.deposit.toFixed(2)})</span>
              )}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => router.push(`${adminBase}/reservations`)}>
            Vazgeç
          </Button>
          <Button variant="primary" disabled={!valid || !quote} loading={saving} onClick={submit}>
            Rezervasyonu oluştur
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
        active ? "border-adm-ink bg-adm-ink text-white" : "border-adm-line text-adm-ink-2 hover:border-adm-line-strong"
      )}
    >
      {children}
    </button>
  );
}
