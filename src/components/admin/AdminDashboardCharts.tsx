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
  ExternalLink,
  Users,
  Search,
  BarChart2,
  Globe,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  MousePointerClick,
  ShoppingCart,
  ArrowDownRight,
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
    paymentInitiated: number;
    paymentCompleted: number;
    paymentPending: number;
    paymentConversion: number;
  };
}

interface AnalyticsData {
  funnel: { name: string; value: number }[];
  topCountries: { name: string; value: number }[];
  topPages: { name: string; value: number }[];
  topSources: { name: string; value: number }[];
  summary: {
    eventsLast30Days: number;
    uniqueSessions: number;
    bookingSessions: number;
    paymentSuccessSessions: number;
    conversionRate: number;
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

const COUNTRY_FLAGS: Record<string, string> = {
  TR: "🇹🇷", DE: "🇩🇪", GB: "🇬🇧", US: "🇺🇸", RU: "🇷🇺", NL: "🇳🇱", FR: "🇫🇷",
  PL: "🇵🇱", UA: "🇺🇦", BE: "🇧🇪", AT: "🇦🇹", SE: "🇸🇪", NO: "🇳🇴", DK: "🇩🇰",
  FI: "🇫🇮", CH: "🇨🇭", IT: "🇮🇹", ES: "🇪🇸", PT: "🇵🇹", CZ: "🇨🇿", SK: "🇸🇰",
  HU: "🇭🇺", RO: "🇷🇴", BG: "🇧🇬", HR: "🇭🇷", GR: "🇬🇷", IL: "🇮🇱", AE: "🇦🇪",
  SA: "🇸🇦", KW: "🇰🇼", QA: "🇶🇦", BH: "🇧🇭", OM: "🇴🇲", LB: "🇱🇧", JO: "🇯🇴",
  EG: "🇪🇬", IR: "🇮🇷", IQ: "🇮🇶", KZ: "🇰🇿", AZ: "🇦🇿", GE: "🇬🇪", AM: "🇦🇲",
  AU: "🇦🇺", CA: "🇨🇦", JP: "🇯🇵", CN: "🇨🇳", KR: "🇰🇷", IN: "🇮🇳", SG: "🇸🇬",
};

const COUNTRY_NAMES: Record<string, string> = {
  TR: "Türkiye", DE: "Almanya", GB: "İngiltere", US: "ABD", RU: "Rusya",
  NL: "Hollanda", FR: "Fransa", PL: "Polonya", UA: "Ukrayna", BE: "Belçika",
  AT: "Avusturya", SE: "İsveç", NO: "Norveç", DK: "Danimarka", FI: "Finlandiya",
  CH: "İsviçre", IT: "İtalya", ES: "İspanya", PT: "Portekiz", CZ: "Çekya",
  SK: "Slovakya", HU: "Macaristan", RO: "Romanya", BG: "Bulgaristan",
  HR: "Hırvatistan", GR: "Yunanistan", IL: "İsrail", AE: "BAE", SA: "S. Arabistan",
  KW: "Kuveyt", QA: "Katar", BH: "Bahreyn", OM: "Umman", LB: "Lübnan",
  JO: "Ürdün", EG: "Mısır", IR: "İran", IQ: "Irak", KZ: "Kazakistan",
  AZ: "Azerbaycan", GE: "Gürcistan", AM: "Ermenistan", AU: "Avustralya",
  CA: "Kanada", JP: "Japonya", CN: "Çin", KR: "G. Kore", IN: "Hindistan",
  SG: "Singapur",
};

function getCountryDisplay(code: string): { flag: string; name: string } {
  const upper = code.toUpperCase();
  if (upper === "UNKNOWN" || code === "unknown") {
    return { flag: "🌐", name: "Bilinmiyor" };
  }
  return {
    flag: COUNTRY_FLAGS[upper] ?? "🏳️",
    name: COUNTRY_NAMES[upper] ?? upper,
  };
}

const FUNNEL_STEPS = [
  { icon: MousePointerClick, label: "Booking Açılışları", color: "#3b82f6", bg: "bg-blue-50", text: "text-blue-600" },
  { icon: ShoppingCart, label: "Araç Seçimi", color: "#8b5cf6", bg: "bg-violet-50", text: "text-violet-600" },
  { icon: CreditCard, label: "Ödeme Başlatıldı", color: "#f97316", bg: "bg-orange-50", text: "text-orange-600" },
  { icon: CheckCircle2, label: "Ödeme Tamamlandı", color: "#10b981", bg: "bg-emerald-50", text: "text-emerald-600" },
];

export default function AdminDashboardCharts() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));

    fetch("/api/admin/dashboard-analytics")
      .then((r) => r.json())
      .then((result) => {
        if (!result?.error) setAnalyticsData(result);
      });
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
  const paymentFunnelData = [
    { name: "Başlatılan", value: summary.paymentInitiated },
    { name: "Tamamlanan", value: summary.paymentCompleted },
    { name: "Beklemede", value: summary.paymentPending },
  ];
  const analyticsSummary = analyticsData?.summary;

  return (
    <div className="space-y-6 mt-8">
      {/* Summary cards row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard icon={CalendarCheck} label="Bu Ay" value={summary.thisMonthCount} sub="rezervasyon" gradient="from-blue-500 to-indigo-600" />
        <SummaryCard icon={DollarSign} label="Bu Ay Gelir" value={`$${summary.thisMonthRevenue.toLocaleString()}`} sub="kazanılan" gradient="from-emerald-500 to-teal-600" />
        <SummaryCard icon={TrendingUp} label="Toplam Gelir" value={`$${summary.totalRevenue.toLocaleString()}`} sub="tüm zamanlar" gradient="from-violet-500 to-purple-600" />
        <SummaryCard icon={AlertTriangle} label="İptal Talepleri" value={summary.cancelRequested} sub="inceleme bekliyor" gradient="from-amber-500 to-orange-600" />
      </div>

      {/* Payment funnel mini */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard icon={DollarSign} title="Ödeme Funnel" subtitle="Ödemeye geçen / tamamlayan">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={paymentFunnelData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {paymentFunnelData.map((_, i) => (
                  <Cell key={i} fill={["#3b82f6", "#10b981", "#f59e0b"][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-between px-1">
            <span className="text-xs text-slate-400">Dönüşüm oranı</span>
            <span className="text-sm font-bold text-slate-800">{summary.paymentConversion}%</span>
          </div>
        </ChartCard>
      </div>

      {/* Analytics section */}
      {analyticsData && (
        <div className="space-y-4">
          {/* Analytics summary cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard icon={Activity} label="Son 30 Gün" value={analyticsSummary?.eventsLast30Days ?? 0} sub="toplam olay" gradient="from-slate-500 to-slate-700" />
            <SummaryCard icon={Globe} label="Benzersiz Oturumlar" value={analyticsSummary?.uniqueSessions ?? 0} sub="ziyaretçi" gradient="from-cyan-500 to-blue-600" />
            <SummaryCard icon={TrendingUp} label="Dönüşüm" value={`${analyticsSummary?.conversionRate ?? 0}%`} sub="rezervasyon oranı" gradient="from-emerald-500 to-teal-600" />
            <SummaryCard icon={CheckCircle2} label="Tamamlanan Ödemeler" value={analyticsSummary?.paymentSuccessSessions ?? 0} sub="başarılı ödeme" gradient="from-violet-500 to-purple-600" />
          </div>

          {/* Booking Funnel — full width, visual step layout */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <BarChart3 size={14} className="text-slate-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Booking Funnel</h3>
                <p className="text-[10px] text-slate-400">Ziyaretçiden ödemeye dönüşüm adımları</p>
              </div>
            </div>
            <BookingFunnelSteps funnel={analyticsData.funnel} />
          </div>

          {/* Country + Pages + Sources */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Countries */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <MapPin size={14} className="text-slate-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">En Önemli Ülkeler</h3>
                  <p className="text-[10px] text-slate-400">Ziyaretçi kaynak ülkeleri</p>
                </div>
              </div>
              <CountryList countries={analyticsData.topCountries} />
            </div>

            {/* Top Pages */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Search size={14} className="text-slate-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">En Popüler Sayfalar</h3>
                  <p className="text-[10px] text-slate-400">En çok ziyaret edilen URL&apos;ler</p>
                </div>
              </div>
              <PageList pages={analyticsData.topPages} />
            </div>

            {/* Sources */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Users size={14} className="text-slate-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Trafik Kaynakları</h3>
                  <p className="text-[10px] text-slate-400">UTM & direkt kaynaklar</p>
                </div>
              </div>
              <SourceList sources={analyticsData.topSources} />
            </div>
          </div>
        </div>
      )}

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-4">
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

        <ChartCard icon={PieIcon} title="Durum Dağılımı" subtitle="Tüm rezervasyonlar">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                {statusDistribution.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                formatter={(value, name) => [Number(value), String(name).replace(/_/g, " ")]}
              />
              <Legend formatter={(value: string) => (
                <span className="text-xs text-slate-600 capitalize">{value.replace(/_/g, " ")}</span>
              )} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={MapPin} title="Popüler Bölgeler" subtitle="Rezervasyon sayısına göre">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topRegions} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={100} />
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

      {/* Traffic quick links */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
            <BarChart2 size={14} className="text-slate-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Trafik &amp; Analitik</h3>
            <p className="text-[10px] text-slate-400">Ziyaretçi ve arama verileri</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { href: "https://analytics.google.com/", label: "GA4 Realtime", sub: "Anlık ziyaretçiler · kaynak · sayfa", icon: Activity, color: "orange" },
            { href: "https://search.google.com/search-console", label: "Search Console", sub: "Google aramaları · tıklama · sıralama", icon: Search, color: "blue" },
            { href: "https://vercel.com/analytics", label: "Vercel Analytics", sub: "Tekil ziyaretçi · sayfa görüntüleme", icon: Users, color: "violet" },
          ].map(({ href, label, sub, icon: Icon, color }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 hover:border-${color}-200 hover:bg-${color}-50 transition-all`}
            >
              <div className={`w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-${color}-200`}>
                <Icon size={16} className={`text-${color}-500`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-[10px] text-slate-400 truncate">{sub}</p>
              </div>
              <ExternalLink size={13} className={`text-slate-300 shrink-0 group-hover:text-${color}-400`} />
            </a>
          ))}
        </div>
      </div>

      {/* Trip type + monthly bookings count */}
      <div className="grid lg:grid-cols-3 gap-4">
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

/* ---- Booking Funnel Steps ---- */

function BookingFunnelSteps({ funnel }: { funnel: { name: string; value: number }[] }) {
  const first = funnel[0]?.value ?? 0;

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-3">
      {funnel.map((step, i) => {
        const cfg = FUNNEL_STEPS[i];
        const Icon = cfg?.icon ?? CheckCircle2;
        const dropPct = i > 0 && (funnel[i - 1]?.value ?? 0) > 0
          ? Math.round(((funnel[i - 1].value - step.value) / funnel[i - 1].value) * 100)
          : null;
        const ofFirst = first > 0 ? Math.round((step.value / first) * 100) : 0;
        const barWidth = first > 0 ? Math.max(8, Math.round((step.value / first) * 100)) : 0;

        return (
          <div key={step.name} className="flex sm:flex-col items-center gap-2 flex-1">
            {/* Arrow between steps */}
            {i > 0 && (
              <div className="hidden sm:flex flex-col items-center self-start mt-6 -mx-1.5 z-10">
                <ChevronRight size={16} className="text-slate-300 rotate-0 sm:rotate-0" />
              </div>
            )}
            <div className={`flex-1 rounded-xl border border-slate-100 p-4 ${cfg?.bg ?? "bg-slate-50"}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Icon size={15} style={{ color: cfg?.color ?? "#64748b" }} />
                </div>
                <p className="text-[11px] font-semibold text-slate-600 leading-tight">{step.name}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight mb-1">{step.value.toLocaleString()}</p>
              <div className="w-full bg-white rounded-full h-1.5 mb-2">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%`, backgroundColor: cfg?.color ?? "#64748b" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{ofFirst}% ilk adımdan</span>
                {dropPct !== null && (
                  <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-medium">
                    <ArrowDownRight size={10} />
                    {dropPct}% düşüş
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Country List ---- */

function CountryList({ countries }: { countries: { name: string; value: number }[] }) {
  const max = Math.max(...countries.map((c) => c.value), 1);
  return (
    <div className="space-y-2.5">
      {countries.map((c) => {
        const { flag, name } = getCountryDisplay(c.name);
        const pct = Math.round((c.value / max) * 100);
        return (
          <div key={c.name} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{flag}</span>
                <span className="text-[13px] font-medium text-slate-700">{name}</span>
              </div>
              <span className="text-[12px] font-semibold text-slate-500">{c.value.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      {countries.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">Henüz veri yok</p>
      )}
    </div>
  );
}

/* ---- Page List ---- */

function PageList({ pages }: { pages: { name: string; value: number }[] }) {
  const max = Math.max(...pages.map((p) => p.value), 1);

  function formatPage(raw: string) {
    const clean = raw.replace(/^\/(en|tr)(\/|$)/, "/");
    return clean.length > 28 ? clean.slice(0, 27) + "…" : clean || "/";
  }

  return (
    <div className="space-y-2.5">
      {pages.map((p) => {
        const pct = Math.round((p.value / max) * 100);
        return (
          <div key={p.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-mono text-slate-600 truncate max-w-[65%]">{formatPage(p.name)}</span>
              <span className="text-[12px] font-semibold text-slate-500">{p.value.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      {pages.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">Henüz veri yok</p>
      )}
    </div>
  );
}

/* ---- Source List ---- */

const SOURCE_ICONS: Record<string, string> = {
  direct: "🔗", google: "🔍", instagram: "📷", facebook: "📘", twitter: "🐦",
  tiktok: "🎵", email: "📧", whatsapp: "💬", bing: "🔎", youtube: "▶️",
};

function SourceList({ sources }: { sources: { name: string; value: number }[] }) {
  const max = Math.max(...sources.map((s) => s.value), 1);
  return (
    <div className="space-y-2.5">
      {sources.map((s) => {
        const pct = Math.round((s.value / max) * 100);
        const icon = SOURCE_ICONS[s.name.toLowerCase()] ?? "🌐";
        return (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">{icon}</span>
                <span className="text-[13px] font-medium text-slate-700 capitalize">{s.name}</span>
              </div>
              <span className="text-[12px] font-semibold text-slate-500">{s.value.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-orange-400 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      {sources.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-6">Henüz veri yok</p>
      )}
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
