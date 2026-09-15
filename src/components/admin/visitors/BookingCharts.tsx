"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, RESERVATION_STATUS, StatStrip } from "@/components/admin/ui";
import { moneyText } from "@/components/admin/reservations/types";
import { RankedBars } from "./labels";

interface DashboardStats {
  monthlyRevenue: { month: string; revenue: number; count: number }[];
  statusDistribution: { name: string; value: number }[];
  topRegions: { name: string; count: number; revenue: number }[];
  tripTypes: { name: string; value: number }[];
  dailyBookings: { date: string; count: number }[];
  summary: {
    totalReservations: number;
    totalRevenue: number;
    thisMonthCount: number;
    thisMonthRevenue: number;
    cancelRequested: number;
    paymentInitiated: number;
    paymentCompleted: number;
    paymentPending: number;
    paymentConversion: number;
  };
}

const BLUE = "#2a78d6";
const AXIS = { fontSize: 11, fill: "#71757d" };

function Bars({
  data,
  x,
  y,
  label,
  format,
}: {
  data: Record<string, string | number>[];
  x: string;
  y: string;
  label: string;
  format: (n: number) => string;
}) {
  return (
    <div className="h-56 px-2 pb-3 pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f0efeb" />
          <XAxis dataKey={x} tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} width={52} allowDecimals={false} tickFormatter={(v) => format(Number(v))} />
          <Tooltip
            cursor={{ fill: "#f5f5f2" }}
            contentStyle={{ borderRadius: 10, border: "1px solid #e7e6e1", fontSize: 12.5 }}
            formatter={(value) => [format(Number(value)), label]}
          />
          <Bar dataKey={y} fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const count = (n: number) => n.toLocaleString("tr-TR");

/**
 * The booking side of the analytics tab: revenue and bookings by month, the
 * last thirty days, statuses, regions and trip types. Revenue is in euro and
 * by transfer date, as on the finance screen.
 */
export default function BookingCharts() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/dashboard-stats", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: DashboardStats) => !cancelled && setData(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <p className="py-6 text-center text-[13px] text-adm-muted">Rezervasyon grafikleri yüklenemedi.</p>;
  if (!data) return <div className="h-64 animate-pulse rounded-adm-lg border border-adm-line bg-adm-surface" />;

  const s = data.summary;
  const tripTotal = data.tripTypes.reduce((sum, t) => sum + t.value, 0);

  return (
    <div className="grid gap-5">
      <StatStrip
        className="mb-0"
        items={[
          { label: "Bu ay rezervasyon", value: count(s.thisMonthCount), hint: "kayıt tarihine göre" },
          { label: "Bu ay ciro", value: moneyText(s.thisMonthRevenue), hint: "transfer tarihine göre" },
          { label: "Ödemeye geçen", value: count(s.paymentInitiated), hint: `${count(s.paymentCompleted)} tamamlandı` },
          { label: "Ödeme dönüşümü", value: `%${s.paymentConversion}`, hint: `${count(s.paymentPending)} bekliyor` },
          { label: "İptal talebi", value: count(s.cancelRequested), warn: s.cancelRequested > 0, hint: "yanıt bekliyor" },
        ]}
      />

      <div className="grid gap-5 min-[1181px]:grid-cols-2">
        <Card title="Aylık ciro" subtitle="Son 12 ay · euro, transfer tarihine göre" flush>
          <Bars data={data.monthlyRevenue} x="month" y="revenue" label="Ciro" format={(n) => moneyText(Math.round(n))} />
        </Card>
        <Card title="Aylık rezervasyon" subtitle="Son 12 ay · kayıt tarihine göre" flush>
          <Bars data={data.monthlyRevenue} x="month" y="count" label="Rezervasyon" format={count} />
        </Card>
        <Card title="Günlük rezervasyon" subtitle="Son 30 gün" flush>
          <Bars data={data.dailyBookings} x="date" y="count" label="Rezervasyon" format={count} />
        </Card>
        <Card title="Durum dağılımı" subtitle="İptal edilmemiş bütün kayıtlar" flush>
          <RankedBars
            rows={[...data.statusDistribution]
              .sort((a, b) => b.value - a.value)
              .map((row) => ({ key: row.name, label: RESERVATION_STATUS[row.name]?.label ?? row.name, value: row.value }))}
          />
        </Card>
        <Card title="Popüler bölgeler" subtitle="Rezervasyon sayısına göre" flush>
          <RankedBars
            rows={data.topRegions.map((r) => ({
              key: r.name,
              label: r.name,
              value: r.count,
              extra: <span className="text-xs text-adm-muted">{moneyText(r.revenue)}</span>,
            }))}
          />
        </Card>
        <Card title="Transfer türleri" subtitle={`${count(tripTotal)} rezervasyon`} flush>
          <RankedBars
            rows={data.tripTypes.map((t) => ({
              key: t.name,
              label: t.name,
              value: t.value,
              extra: <span className="text-xs text-adm-muted">%{tripTotal ? Math.round((t.value / tripTotal) * 100) : 0}</span>,
            }))}
          />
        </Card>
      </div>
    </div>
  );
}
