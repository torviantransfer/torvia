"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Radio,
  Users,
  Globe,
  LogOut,
  Car,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import VisitorAnalyticsHistory from "./VisitorAnalyticsHistory";

interface Visitor {
  sessionId: string;
  page: string | null;
  source: string;
  region: string | null;
  locale: string | null;
  country: string | null;
  lastSeen: string;
  firstSeen: string;
  selectedVehicle: boolean;
  reachedCheckout: boolean;
  purchased: boolean;
}

interface ExitedVisitor {
  sessionId: string;
  lastPage: string | null;
  source: string;
  lastSeen: string;
  selectedVehicle: boolean;
  reachedCheckout: boolean;
  purchased: boolean;
}

interface LiveVisitorsResponse {
  activeNowCount: number;
  liveCount: number;
  vehicleSelectedCount: number;
  checkoutCount: number;
  purchasedCount: number;
  visitors: Visitor[];
  pageDistribution: { page: string; count: number }[];
  sourceDistribution: { source: string; count: number }[];
  recentlyExited: ExitedVisitor[];
}

const SOURCE_LABELS: Record<string, string> = {
  direct: "Doğrudan",
  google: "Google (organik)",
  google_ads: "Google Ads",
  instagram: "Instagram",
  facebook: "Facebook",
  meta_ads: "Meta Reklamları",
  twitter: "Twitter / X",
  bing: "Bing",
  yandex: "Yandex",
  whatsapp: "WhatsApp",
  referral: "Yönlendirme",
};

function sourceLabel(source: string) {
  return SOURCE_LABELS[source] ?? source;
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}sn önce`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk önce`;
  const hours = Math.floor(minutes / 60);
  return `${hours}sa önce`;
}

const REFRESH_INTERVAL_MS = 10_000;

export default function LiveVisitors() {
  const [data, setData] = useState<LiveVisitorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"live" | "history">("live");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-visitors", { cache: "no-store" });
      if (!res.ok) throw new Error("İstek başarısız");
      const json = (await res.json()) as LiveVisitorsResponse;
      setData(json);
      setError(null);
    } catch {
      setError("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const stats = [
    {
      label: "Şu An Aktif",
      value: data?.activeNowCount ?? 0,
      icon: Radio,
      gradient: "from-emerald-500 to-teal-600",
      pulse: true,
    },
    {
      label: "Son 5 Dakika",
      value: data?.liveCount ?? 0,
      icon: Users,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Araç Seçti",
      value: data?.vehicleSelectedCount ?? 0,
      icon: Car,
      gradient: "from-violet-500 to-purple-600",
    },
    {
      label: "Ödeme Adımında",
      value: data?.checkoutCount ?? 0,
      icon: CreditCard,
      gradient: "from-orange-500 to-amber-600",
    },
    {
      label: "Satın Aldı",
      value: data?.purchasedCount ?? 0,
      icon: CheckCircle2,
      gradient: "from-rose-500 to-pink-600",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Canlı Ziyaretçiler
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sitede şu anda kim var, hangi sayfada ve nereden geldi. 10 saniyede bir güncellenir.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Yenile
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-8">
        <button
          onClick={() => setTab("live")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "live" ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Radio size={14} />
          Canlı
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "history" ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <BarChart3 size={14} />
          Genel Analitik
          <span className="text-[10px] text-slate-400 font-normal">(30 gün)</span>
        </button>
      </div>

      {tab === "history" ? (
        <VisitorAnalyticsHistory />
      ) : (
        <>
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="relative bg-white rounded-2xl p-4 sm:p-5 overflow-hidden"
            style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3`}
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            >
              <s.icon size={18} className="text-white" strokeWidth={2} />
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Page distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Globe size={16} className="text-slate-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Sayfa Bazlı Dağılım</h2>
              <p className="text-xs text-slate-400">Şu an kim hangi sayfada</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {(data?.pageDistribution ?? []).map((p) => {
              const pct = data?.liveCount ? Math.round((p.count / data.liveCount) * 100) : 0;
              return (
                <div key={p.page} className="px-6 py-3 flex items-center gap-3">
                  <span className="flex-1 text-[13px] text-slate-700 truncate font-mono">{p.page}</span>
                  <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                    <div className="h-full bg-orange-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 w-8 text-right">{p.count}</span>
                </div>
              );
            })}
            {data && data.pageDistribution.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-400">Şu anda aktif ziyaretçi yok</p>
            )}
          </div>
        </div>

        {/* Source distribution */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Radio size={16} className="text-slate-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Trafik Kaynağı</h2>
              <p className="text-xs text-slate-400">Google, Instagram, Facebook vb.</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {(data?.sourceDistribution ?? []).map((s) => {
              const pct = data?.liveCount ? Math.round((s.count / data.liveCount) * 100) : 0;
              return (
                <div key={s.source} className="px-6 py-3 flex items-center gap-3">
                  <span className="flex-1 text-[13px] text-slate-700 truncate">{sourceLabel(s.source)}</span>
                  <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                    <div className="h-full bg-indigo-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 w-8 text-right">{s.count}</span>
                </div>
              );
            })}
            {data && data.sourceDistribution.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-400">Şu anda aktif ziyaretçi yok</p>
            )}
          </div>
        </div>
      </div>

      {/* Live visitor list */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-sm">Aktif Ziyaretçiler</h2>
          <p className="text-xs text-slate-400">Son 5 dakika içinde görülen tüm oturumlar</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sayfa</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Kaynak</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ülke</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Durum</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Son Görülme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data?.visitors ?? []).map((v) => (
                <tr key={v.sessionId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-[13px] text-slate-700 max-w-[220px] truncate">{v.page}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{sourceLabel(v.source)}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-500">{v.country ?? "—"}</td>
                  <td className="px-6 py-3.5">
                    {v.purchased ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">Satın aldı</span>
                    ) : v.reachedCheckout ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">Ödemede</span>
                    ) : v.selectedVehicle ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700">Araç seçti</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">Geziniyor</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-500">{timeAgo(v.lastSeen)}</td>
                </tr>
              ))}
              {data && data.visitors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} className="text-slate-300" strokeWidth={1} />
                      <p>Şu anda sitede aktif ziyaretçi yok</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recently exited */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <LogOut size={16} className="text-slate-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Az Önce Siteden Ayrılanlar</h2>
            <p className="text-xs text-slate-400">Son 5–30 dakika içinde ayrılan ziyaretçilerin son sayfası</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Son Sayfa</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Kaynak</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Durum</th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ayrılma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data?.recentlyExited ?? []).map((v) => (
                <tr key={v.sessionId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-[13px] text-slate-700 max-w-[260px] truncate">{v.lastPage}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{sourceLabel(v.source)}</td>
                  <td className="px-6 py-3.5">
                    {v.purchased ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">Satın aldı</span>
                    ) : v.reachedCheckout ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">Ödemede bıraktı</span>
                    ) : v.selectedVehicle ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700">Araç seçti</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">Sadece gezindi</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-500">{timeAgo(v.lastSeen)}</td>
                </tr>
              ))}
              {data && data.recentlyExited.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Henüz veri yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
