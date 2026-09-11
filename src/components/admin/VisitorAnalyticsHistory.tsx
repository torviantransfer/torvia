"use client";

import { useEffect, useState } from "react";
import {
  Activity, Globe, TrendingUp, CheckCircle2, BarChart3, MapPin, Search, Users,
  BarChart2, ExternalLink, ChevronRight, ShoppingCart, CreditCard,
  ArrowDownRight, Megaphone, Smartphone, Wallet, ClipboardList, AlertTriangle,
} from "lucide-react";

/** One slice of visits — the shape every breakdown table on this page uses. */
interface Bucket {
  name: string;
  visitors: number;
  vehicle: number;
  form: number;
  checkout: number;
  purchased: number;
  revenue: number;
}

const RANGES = [
  { key: "today", label: "Bugün" },
  { key: "7d", label: "7 Gün" },
  { key: "30d", label: "30 Gün" },
  { key: "90d", label: "90 Gün" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

interface AnalyticsData {
  range: RangeKey;
  since: string;
  truncated: boolean;
  funnel: { name: string; value: number }[];
  countries: Bucket[];
  sources: Bucket[];
  campaigns: Bucket[];
  devices: Bucket[];
  browsers: Bucket[];
  landingPages: Bucket[];
  summary: {
    visitors: number;
    uniqueVisitors: number;
    returning: number;
    vehicleSessions: number;
    formSessions: number;
    checkoutSessions: number;
    purchasedSessions: number;
    revenue: number;
    conversionRate: number;
  };
}

const RANGE_SUBTITLE: Record<RangeKey, string> = {
  today: "bugün",
  "7d": "son 7 gün",
  "30d": "son 30 gün",
  "90d": "son 90 gün",
};

const COUNTRY_FLAGS: Record<string, string> = {
  TR: "🇹🇷", DE: "🇩🇪", GB: "🇬🇧", US: "🇺🇸", RU: "🇷🇺", NL: "🇳🇱", FR: "🇫🇷",
  PL: "🇵🇱", UA: "🇺🇦", BE: "🇧🇪", AT: "🇦🇹", SE: "🇸🇪", NO: "🇳🇴", DK: "🇩🇰",
  FI: "🇫🇮", CH: "🇨🇭", IT: "🇮🇹", ES: "🇪🇸", PT: "🇵🇹", CZ: "🇨🇿", SK: "🇸🇰",
  HU: "🇭🇺", RO: "🇷🇴", BG: "🇧🇬", HR: "🇭🇷", GR: "🇬🇷", IL: "🇮🇱", AE: "🇦🇪",
  SA: "🇸🇦", KW: "🇰🇼", QA: "🇶🇦", BH: "🇧🇭", OM: "🇴🇲", LB: "🇱🇧", JO: "🇯🇴",
  EG: "🇪🇬", IR: "🇮🇷", IQ: "🇮🇶", KZ: "🇰🇿", AZ: "🇦🇿", GE: "🇬🇪", AM: "🇦🇲",
  AU: "🇦🇺", CA: "🇨🇦", JP: "🇯🇵", CN: "🇨🇳", KR: "🇰🇷", IN: "🇮🇳", SG: "🇸🇬",
  IE: "🇮🇪", LT: "🇱🇹", LV: "🇱🇻", EE: "🇪🇪", RS: "🇷🇸", MD: "🇲🇩", BY: "🇧🇾",
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
  SG: "Singapur", IE: "İrlanda", LT: "Litvanya", LV: "Letonya", EE: "Estonya",
  RS: "Sırbistan", MD: "Moldova", BY: "Belarus",
};

function countryDisplay(code: string) {
  const upper = code.toUpperCase();
  if (upper === "UNKNOWN") return { flag: "🌐", name: "Bilinmiyor" };
  return { flag: COUNTRY_FLAGS[upper] ?? "🏳️", name: COUNTRY_NAMES[upper] ?? upper };
}

const FUNNEL_STEPS = [
  { icon: Users, color: "#3b82f6", bg: "bg-blue-50" },
  { icon: ShoppingCart, color: "#8b5cf6", bg: "bg-violet-50" },
  { icon: ClipboardList, color: "#0ea5e9", bg: "bg-sky-50" },
  { icon: CreditCard, color: "#f97316", bg: "bg-orange-50" },
  { icon: CheckCircle2, color: "#10b981", bg: "bg-emerald-50" },
];

const SOURCE_ICONS: Record<string, string> = {
  direct: "🔗", google: "🔍", google_ads: "💰", instagram: "📷", facebook: "📘",
  meta_ads: "💸", twitter: "🐦", tiktok: "🎵", email: "📧", whatsapp: "💬",
  bing: "🔎", youtube: "▶️", yandex: "🔴", referral: "↗️",
};

const SOURCE_LABELS: Record<string, string> = {
  direct: "Doğrudan", google: "Google (organik)", google_ads: "Google Ads",
  meta_ads: "Meta Reklamları", facebook: "Facebook", instagram: "Instagram",
  twitter: "Twitter / X", bing: "Bing", yandex: "Yandex", whatsapp: "WhatsApp",
  referral: "Yönlendirme",
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: "Telefon", tablet: "Tablet", desktop: "Masaüstü",
  bot: "Bot", unknown: "Bilinmiyor",
};

function money(value: number) {
  return "$" + value.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

function share(part: number, whole: number) {
  return whole > 0 ? "%" + Math.round((part / whole) * 100) : "%0";
}

function shortPath(raw: string) {
  const clean = raw.replace(/^\/(en|tr|de|ru|nl|ar|ro)(\/|$)/, "/");
  return clean.length > 34 ? clean.slice(0, 33) + "…" : clean || "/";
}

/**
 * Historical visitor traffic — the "Genel Analitik" tab next to the real-time
 * one. Every figure here counts visits, not events: the previous version
 * tallied rows of the analytics log, which meant the presence heartbeat voted
 * once every 25 seconds and the busiest country was really the slowest reader.
 */
export default function VisitorAnalyticsHistory() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Switching range is a click, so the spinner is raised here rather than in
     the effect: a setState in an effect body cascades a second render, and the
     lint rule that flags it is right to. */
  const selectRange = (key: RangeKey) => {
    if (key === range) return;
    setLoading(true);
    setRange(key);
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/admin/dashboard-analytics?range=" + range, {
          cache: "no-store",
        });
        const result = await res.json();
        // A slow answer for a range the admin has already clicked away from
        // must not overwrite the one they are looking at now.
        if (cancelled) return;
        if (result?.error) {
          setError(result.error);
        } else {
          setError(null);
          setData(result as AnalyticsData);
        }
      } catch {
        if (!cancelled) setError("Veriler yüklenemedi");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [range]);

  const subtitle = RANGE_SUBTITLE[range];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Genel Analitik</h2>
          <p className="text-[11px] text-slate-400">Ziyaretten ödemeye, kişi bazlı</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => selectRange(r.key)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                range === r.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 h-40 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
              <div className="h-full bg-slate-50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <p className="text-sm text-slate-400 text-center py-16">Veriler yüklenemedi</p>
      ) : (
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-50" : ""}`}>
          {data.truncated && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[12px] text-amber-700">
              <AlertTriangle size={14} className="shrink-0" />
              Bu aralıkta okunabilenden fazla ziyaret var, rakamlar eksik olabilir. Daha kısa bir aralık seçin.
            </div>
          )}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <SummaryCard
              icon={Users}
              value={data.summary.visitors.toLocaleString("tr-TR")}
              label="Ziyaret"
              sub={`${data.summary.uniqueVisitors.toLocaleString("tr-TR")} farklı kişi · ${subtitle}`}
              gradient="from-blue-500 to-indigo-600"
            />
            <SummaryCard
              icon={ShoppingCart}
              value={data.summary.vehicleSessions.toLocaleString("tr-TR")}
              label="Araç Seçti"
              sub={`ziyaretlerin ${share(data.summary.vehicleSessions, data.summary.visitors)}`}
              gradient="from-violet-500 to-purple-600"
            />
            <SummaryCard
              icon={TrendingUp}
              value={"%" + data.summary.conversionRate}
              label="Dönüşüm"
              sub={`${data.summary.purchasedSessions.toLocaleString("tr-TR")} satış`}
              gradient="from-emerald-500 to-teal-600"
            />
            <SummaryCard
              icon={Wallet}
              value={money(data.summary.revenue)}
              label="Ciro"
              sub="ödemesi tamamlanan"
              gradient="from-amber-500 to-orange-600"
            />
          </div>

          <Panel icon={BarChart3} title="Rezervasyon Hunisi" subtitle={`Ziyaretten ödemeye · ${subtitle}`}>
            <FunnelSteps funnel={data.funnel} />
          </Panel>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel icon={MapPin} title="Ülkeler" subtitle="Kim geliyor, kim satın alıyor">
              <BreakdownList
                buckets={data.countries}
                accent="#3b82f6"
                render={(name) => {
                  const country = countryDisplay(name);
                  return (
                    <>
                      <span className="text-base leading-none">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                    </>
                  );
                }}
              />
            </Panel>

            <Panel icon={Megaphone} title="Trafik Kaynakları" subtitle="Reklam, organik ve doğrudan">
              <BreakdownList
                buckets={data.sources}
                accent="#f97316"
                render={(name) => (
                  <>
                    <span className="text-sm leading-none">{SOURCE_ICONS[name] ?? "🌐"}</span>
                    <span className="truncate">{SOURCE_LABELS[name] ?? name}</span>
                  </>
                )}
              />
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel icon={Megaphone} title="Kampanyalar" subtitle="utm_campaign etiketi taşıyan ziyaretler">
              <BreakdownList
                buckets={data.campaigns}
                accent="#8b5cf6"
                empty="Etiketli kampanya trafiği yok"
              />
            </Panel>

            <Panel icon={Smartphone} title="Cihaz ve Tarayıcı" subtitle="Neyin üzerinden geliyorlar">
              <BreakdownList
                buckets={data.devices}
                accent="#0ea5e9"
                render={(name) => <span className="truncate">{DEVICE_LABELS[name] ?? name}</span>}
              />
              <div className="mt-4 border-t border-slate-100 pt-4">
                <BreakdownList buckets={data.browsers} accent="#64748b" />
              </div>
            </Panel>
          </div>

          <Panel icon={Search} title="Giriş Sayfaları" subtitle="Ziyaretin başladığı sayfa">
            <BreakdownList
              buckets={data.landingPages}
              accent="#10b981"
              render={(name) => <span className="font-mono text-[12px] truncate">{shortPath(name)}</span>}
            />
          </Panel>

          <Panel icon={BarChart2} title="Trafik & Analitik" subtitle="Dış paneller">
            <QuickLinks />
          </Panel>
        </div>
      )}
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 p-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
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

/**
 * A ranked list where each row carries its own funnel.
 *
 * Visitor counts on their own rank by volume and say nothing about quality —
 * the country sending the most traffic is often not the one sending the most
 * bookings. Sales and conversion sit on the same row so the two can be read
 * against each other, which is the whole point of splitting by source at all.
 */
function BreakdownList({
  buckets,
  accent,
  render,
  empty = "Henüz veri yok",
}: {
  buckets: Bucket[];
  accent: string;
  render?: (name: string) => React.ReactNode;
  empty?: string;
}) {
  const max = Math.max(...buckets.map((b) => b.visitors), 1);

  if (buckets.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-6">{empty}</p>;
  }

  return (
    <div className="space-y-2.5">
      {buckets.map((b) => (
        <div key={b.name}>
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2 min-w-0 text-[13px] font-medium text-slate-700">
              {render ? render(b.name) : <span className="truncate">{b.name}</span>}
            </div>
            <div className="flex items-center gap-2.5 shrink-0 text-[12px] tabular-nums">
              <span className="font-semibold text-slate-600">{b.visitors.toLocaleString("tr-TR")}</span>
              {b.purchased > 0 ? (
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {b.purchased} satış · {share(b.purchased, b.visitors)}
                </span>
              ) : (
                <span className="text-[11px] text-slate-300">satış yok</span>
              )}
            </div>
          </div>
          {/* Two tracks in one: the pale bar is everyone who arrived, the solid
              one inside it is the share that got as far as choosing a vehicle. */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: Math.round((b.visitors / max) * 100) + "%",
                backgroundColor: accent,
                opacity: 0.35,
              }}
            >
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: b.visitors > 0 ? Math.max(2, Math.round((b.vehicle / b.visitors) * 100)) + "%" : "0%",
                  backgroundColor: accent,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FunnelSteps({ funnel }: { funnel: { name: string; value: number }[] }) {
  const first = funnel[0]?.value ?? 0;

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-3">
      {funnel.map((step, i) => {
        const cfg = FUNNEL_STEPS[i];
        const Icon = cfg?.icon ?? CheckCircle2;
        const previous = funnel[i - 1]?.value ?? 0;
        const dropPct =
          i > 0 && previous > 0 ? Math.round(((previous - step.value) / previous) * 100) : null;
        const ofFirst = first > 0 ? Math.round((step.value / first) * 100) : 0;

        return (
          <div key={step.name} className="flex sm:flex-col items-center gap-2 flex-1">
            {i > 0 && (
              <div className="hidden sm:flex flex-col items-center self-start mt-6 -mx-1.5 z-10">
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            )}
            <div className={`flex-1 w-full rounded-xl border border-slate-100 p-4 ${cfg?.bg ?? "bg-slate-50"}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Icon size={15} style={{ color: cfg?.color ?? "#64748b" }} />
                </div>
                <p className="text-[11px] font-semibold text-slate-600 leading-tight">{step.name}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                {step.value.toLocaleString("tr-TR")}
              </p>
              <div className="w-full bg-white rounded-full h-1.5 mb-2">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: (first > 0 ? Math.max(4, ofFirst) : 0) + "%",
                    backgroundColor: cfg?.color ?? "#64748b",
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">%{ofFirst} ilk adımdan</span>
                {dropPct !== null && dropPct > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-medium">
                    <ArrowDownRight size={10} />%{dropPct} düşüş
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

/* Tailwind only ships the classes it can see in the source, so the hover
   colours are written out rather than built from a colour name at runtime —
   the previous interpolated version produced class strings that never
   existed and the cards had no hover state at all. */
const LINKS = [
  {
    href: "https://analytics.google.com/",
    label: "GA4 Realtime",
    sub: "Anlık ziyaretçiler · kaynak · sayfa",
    icon: Activity,
    hover: "hover:border-orange-200 hover:bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    href: "https://search.google.com/search-console",
    label: "Search Console",
    sub: "Google aramaları · tıklama · sıralama",
    icon: Search,
    hover: "hover:border-blue-200 hover:bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    href: "https://vercel.com/analytics",
    label: "Vercel Analytics",
    sub: "Tekil ziyaretçi · sayfa görüntüleme",
    icon: Globe,
    hover: "hover:border-violet-200 hover:bg-violet-50",
    iconColor: "text-violet-500",
  },
];

function QuickLinks() {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {LINKS.map(({ href, label, sub, icon: Icon, hover, iconColor }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3.5 transition-all ${hover}`}
        >
          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
            <Icon size={16} className={iconColor} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">{label}</p>
            <p className="text-[10px] text-slate-400 truncate">{sub}</p>
          </div>
          <ExternalLink size={13} className="text-slate-300 shrink-0 ms-auto" />
        </a>
      ))}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  value: string | number;
  sub: string;
  gradient: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-[10px] text-slate-300 mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  );
}
