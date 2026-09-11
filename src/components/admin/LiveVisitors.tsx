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
  ClipboardList,
  MapPin,
} from "lucide-react";
import VisitorAnalyticsHistory from "./VisitorAnalyticsHistory";

type Stage = "browsing" | "vehicle" | "form" | "payment" | "purchased";

interface Visitor {
  sessionId: string;
  page: string | null;
  source: string;
  region: string | null;
  locale: string | null;
  country: string | null;
  city: string | null;
  lastSeen: string;
  firstSeen: string;
  selectedVehicle: boolean;
  formStarted: boolean;
  reachedCheckout: boolean;
  purchased: boolean;
  vehicleName: string | null;
  vehiclePrice: number | null;
  stage: Stage;
}

interface ExitedVisitor {
  sessionId: string;
  lastPage: string | null;
  source: string;
  lastSeen: string;
  selectedVehicle: boolean;
  formStarted: boolean;
  reachedCheckout: boolean;
  purchased: boolean;
  vehicleName: string | null;
  vehiclePrice: number | null;
  stage: Stage;
}

interface LiveVisitorsResponse {
  activeNowCount: number;
  liveCount: number;
  vehicleSelectedCount: number;
  formStartedCount: number;
  checkoutCount: number;
  purchasedCount: number;
  visitors: Visitor[];
  pageDistribution: { page: string; count: number }[];
  sourceDistribution: { source: string; count: number }[];
  countryDistribution: { country: string; count: number }[];
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

/* Only the countries Antalya actually sells to are named; anything else falls
   back to its ISO code, which is still more use than a blank. */
const COUNTRY_NAMES: Record<string, string> = {
  TR: "Türkiye", DE: "Almanya", GB: "İngiltere", US: "ABD", RU: "Rusya",
  NL: "Hollanda", FR: "Fransa", PL: "Polonya", UA: "Ukrayna", BE: "Belçika",
  AT: "Avusturya", SE: "İsveç", NO: "Norveç", DK: "Danimarka", FI: "Finlandiya",
  CH: "İsviçre", IT: "İtalya", ES: "İspanya", PT: "Portekiz", CZ: "Çekya",
  SK: "Slovakya", HU: "Macaristan", RO: "Romanya", BG: "Bulgaristan",
  HR: "Hırvatistan", GR: "Yunanistan", IL: "İsrail", AE: "BAE",
  SA: "S. Arabistan", KW: "Kuveyt", QA: "Katar", BH: "Bahreyn", OM: "Umman",
  LB: "Lübnan", JO: "Ürdün", EG: "Mısır", IR: "İran", IQ: "Irak",
  KZ: "Kazakistan", AZ: "Azerbaycan", GE: "Gürcistan", AM: "Ermenistan",
  AU: "Avustralya", CA: "Kanada", JP: "Japonya", CN: "Çin", KR: "G. Kore",
  IN: "Hindistan", SG: "Singapur", IE: "İrlanda", LT: "Litvanya",
  LV: "Letonya", EE: "Estonya", RS: "Sırbistan", MD: "Moldova", BY: "Belarus",
};

/* The flag comes from the ISO code itself: regional indicator symbols are the
   code's two letters offset into their own Unicode block, so every country
   gets one without a lookup table to keep in step with the names above. */
function flagOf(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function countryDisplay(raw: string | null) {
  const code = (raw ?? "").toUpperCase();
  if (!code || code === "UNKNOWN") return { flag: "🌐", name: "Bilinmiyor" };
  return { flag: flagOf(code), name: COUNTRY_NAMES[code] ?? code };
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}sn önce`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk önce`;
  const hours = Math.floor(minutes / 60);
  return `${hours}sa önce`;
}

/**
 * Where this visitor is right now, as one badge.
 *
 * Only the stage they are actually on is named. A track of every step would
 * spend most of its width on milestones that have not happened, and the
 * question the live view answers is "who is on the payment page", not "which
 * of the five stages has each of forty people passed".
 *
 * `dropped` is the same badge for someone who has already left, where the live
 * pulse would be a lie: it marks where the visit ended instead.
 */
const STAGE_LABELS: Record<Stage, string> = {
  browsing: "Geziniyor",
  vehicle: "Araç Seçti",
  form: "Form Dolduruyor",
  payment: "Ödemede",
  purchased: "Satın Aldı",
};

const STAGE_STYLES: Record<Stage, string> = {
  browsing: "bg-slate-100 text-slate-500",
  vehicle: "bg-violet-50 text-violet-700",
  form: "bg-sky-50 text-sky-700",
  payment: "bg-amber-50 text-amber-700",
  purchased: "bg-emerald-500 text-white",
};

function StageBadge({ stage, dropped = false }: { stage: Stage; dropped?: boolean }) {
  const live = !dropped && stage !== "browsing" && stage !== "purchased";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${STAGE_STYLES[stage]}`}
    >
      {stage === "purchased" && <CheckCircle2 size={11} />}
      {live && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {STAGE_LABELS[stage]}
    </span>
  );
}

/* Slugs are what the booking wizard reports, so "mercedes-vito-vip" is what
   lands in the event. Title-case it rather than joining a lookup table that
   would go stale the next time a category is renamed. */
function vehicleLabel(slug: string | null) {
  if (!slug) return null;
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * One ranked list of who is on the site right now, split whichever way the
 * card asks for. Four of these sat inline as near-identical copies of the same
 * markup, which is how two of them ended up with different empty states.
 */
function DistributionCard({
  icon: Icon,
  title,
  subtitle,
  accent,
  rows,
  total,
  ready,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  subtitle: string;
  accent: string;
  rows: { key: string; label: React.ReactNode; count: number }[];
  total: number;
  ready: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-slate-600" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
        {rows.map((row) => (
          <div key={row.key} className="px-6 py-3 flex items-center gap-3">
            <span className="flex-1 text-[13px] text-slate-700 truncate">{row.label}</span>
            <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
              <div
                className={`h-full ${accent}`}
                style={{ width: `${total > 0 ? Math.round((row.count / total) * 100) : 0}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 w-8 text-end">{row.count}</span>
          </div>
        ))}
        {ready && rows.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-slate-400">Şu anda aktif ziyaretçi yok</p>
        )}
      </div>
    </div>
  );
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
      label: "Form Dolduruyor",
      value: data?.formStartedCount ?? 0,
      icon: ClipboardList,
      gradient: "from-sky-500 to-cyan-600",
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
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
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

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <DistributionCard
          icon={Globe}
          title="Sayfa Bazlı Dağılım"
          subtitle="Şu an kim hangi sayfada"
          accent="bg-orange-400"
          total={data?.liveCount ?? 0}
          rows={(data?.pageDistribution ?? []).map((p) => ({
            key: p.page,
            label: <span className="font-mono">{p.page}</span>,
            count: p.count,
          }))}
          ready={Boolean(data)}
        />

        <DistributionCard
          icon={Radio}
          title="Trafik Kaynağı"
          subtitle="Google, Instagram, Facebook vb."
          accent="bg-indigo-400"
          total={data?.liveCount ?? 0}
          rows={(data?.sourceDistribution ?? []).map((s) => ({
            key: s.source,
            label: <span>{sourceLabel(s.source)}</span>,
            count: s.count,
          }))}
          ready={Boolean(data)}
        />

        <DistributionCard
          icon={MapPin}
          title="Ülkeler"
          subtitle="Şu an sitede olanların konumu"
          accent="bg-blue-400"
          total={data?.liveCount ?? 0}
          rows={(data?.countryDistribution ?? []).map((c) => {
            const country = countryDisplay(c.country);
            return {
              key: c.country,
              label: (
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">{country.flag}</span>
                  {country.name}
                </span>
              ),
              count: c.count,
            };
          })}
          ready={Boolean(data)}
        />

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
                <th className="px-6 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sayfa</th>
                <th className="px-6 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-400">Kaynak</th>
                <th className="px-6 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ülke</th>
                <th className="px-6 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-400">Seçtiği Araç</th>
                <th className="px-6 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-400">Aşama</th>
                <th className="px-6 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-400">Son Görülme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data?.visitors ?? []).map((v) => (
                <tr key={v.sessionId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-[13px] text-slate-700 max-w-[220px] truncate">{v.page}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{sourceLabel(v.source)}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600 whitespace-nowrap">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base leading-none">{countryDisplay(v.country).flag}</span>
                      <span>{countryDisplay(v.country).name}</span>
                      {v.city && <span className="text-slate-400">· {v.city}</span>}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] whitespace-nowrap">
                    {v.vehicleName ? (
                      <>
                        <span className="text-slate-700">{vehicleLabel(v.vehicleName)}</span>
                        {v.vehiclePrice != null && (
                          <span className="ms-1.5 text-slate-400 tabular-nums">${v.vehiclePrice}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5"><StageBadge stage={v.stage} /></td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-500">{timeAgo(v.lastSeen)}</td>
                </tr>
              ))}
              {data && data.visitors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
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
                <th className="px-6 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-400">Son Sayfa</th>
                <th className="px-6 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-400">Kaynak</th>
                <th className="px-6 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-400">Seçtiği Araç</th>
                <th className="px-6 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-400">Nerede Bıraktı</th>
                <th className="px-6 py-3 text-start text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ayrılma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(data?.recentlyExited ?? []).map((v) => (
                <tr key={v.sessionId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-[13px] text-slate-700 max-w-[260px] truncate">{v.lastPage}</td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-600">{sourceLabel(v.source)}</td>
                  <td className="px-6 py-3.5 text-[13px] whitespace-nowrap">
                    {v.vehicleName ? (
                      <>
                        <span className="text-slate-700">{vehicleLabel(v.vehicleName)}</span>
                        {v.vehiclePrice != null && (
                          <span className="ms-1.5 text-slate-400 tabular-nums">${v.vehiclePrice}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5"><StageBadge stage={v.stage} dropped /></td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-500">{timeAgo(v.lastSeen)}</td>
                </tr>
              ))}
              {data && data.recentlyExited.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
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
