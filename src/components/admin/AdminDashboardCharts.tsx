"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  CalendarCheck,
  AlertTriangle,
  BarChart3,
  PieChart as PieIcon,
  MapPin,
  Activity,
} from "lucide-react";

interface DashboardData {
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
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#3b82f6",
  driver_assigned: "#8b5cf6",
  passenger_picked_up: "#6366f1",
  completed: "#10b981",
  cancelled: "#ef4444",
  cancel_requested: "#f97316",
};

const PIE_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1", "#f97316"];

export default function AdminDashboardCharts() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 h-72 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
            <div className="h-full bg-slate-50 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { monthlyRevenue, statusDistribution, topRegions, tripTypes, dailyBookings, summary } = data;

  return (
    <div className="space-y-6 mt-8">
      {/* Summary cards row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          icon={CalendarCheck}
          label="Bu Ay"
          value={summary.thisMonthCount}
          sub="rezervasyon"
          gradient="from-blue-500 to-indigo-600"
        />
        <SummaryCard
          icon={DollarSign}
          label="Bu Ay Gelir"
          value={`$${summary.thisMonthRevenue.toLocaleString()}`}
          sub="kazanılan"
          gradient="from-emerald-500 to-teal-600"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Toplam Gelir"
          value={`$${summary.totalRevenue.toLocaleString()}`}
          sub="tüm zamanlar"
          gradient="from-violet-500 to-purple-600"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="İptal Talepleri"
          value={summary.cancelRequested}
          sub="inceleme bekliyor"
          gradient="from-amber-500 to-orange-600"
        />
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Monthly Revenue Chart */}
        <ChartCard icon={BarChart3} title="Aylık Gelir" subtitle="Son 12 ay">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, "Gelir"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily Bookings */}
        <ChartCard icon={Activity} title="Günlük Rezervasyonlar" subtitle="Son 30 gün">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailyBookings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Rezervasyon" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status Distribution */}
        <ChartCard icon={PieIcon} title="Durum Dağılımı" subtitle="Tüm rezervasyonlar">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {statusDistribution.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                formatter={(value, name) => [Number(value), String(name).replace(/_/g, " ")]}
              />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs text-slate-600 capitalize">{value.replace(/_/g, " ")}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Regions */}
        <ChartCard icon={MapPin} title="Popüler Bölgeler" subtitle="Rezervasyon sayısına göre">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topRegions} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                formatter={(value, name) => {
                  if (name === "count") return [Number(value), "Rezervasyon"];
                  return [`$${Number(value).toLocaleString()}`, "Gelir"];
                }}
              />
              <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} name="count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Trip type + Monthly bookings count */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Trip type pie */}
        <ChartCard icon={PieIcon} title="Transfer Türleri" subtitle="Tek yön vs Gidiş-dönüş">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={tripTypes} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {tripTypes.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#3b82f6" : "#10b981"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly booking count */}
        <div className="lg:col-span-2">
          <ChartCard icon={CalendarCheck} title="Aylık Rezervasyonlar" subtitle="Aylara göre rezervasyon sayısı">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Rezervasyon" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

/* ---- Helper components ---- */

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: React.ComponentType<{ size: number; className: string }>;
  label: string;
  value: string | number;
  sub: string;
  gradient: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-[10px] text-slate-300 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function ChartCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ size: number; className: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon size={14} className="text-slate-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-[10px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
