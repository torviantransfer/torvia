"use client";

import { useEffect, useState } from "react";
import {
  Activity, Globe, CheckCircle2, MapPin, Search, Users, BarChart2,
  ExternalLink, ChevronRight, ShoppingCart, CreditCard, ArrowDownRight,
  Megaphone, ClipboardList, AlertTriangle, Info,
} from "lucide-react";

const RANGES = [
  { key: "today", label: "Bugün" },
  { key: "7d", label: "7 Gün" },
  { key: "30d", label: "30 Gün" },
  { key: "90d", label: "90 Gün" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

/** One row of a ranked list. `purchased` is absent where sales make no sense. */
interface Row {
  name: string;
  visitors: number;
  purchased?: number;
}

interface AnalyticsData {
  range: RangeKey;
  truncated: boolean;
  /** Visits rebuilt from the old event log, which carry no form or country data. */
  recoveredVisits: number;
  funnel: { name: string; value: number }[];
  countries: Row[];
  sources: Row[];
  pages: Row[];
}

const RANGE_SUBTITLE: Record<RangeKey, string> = {
  today: "bugün",
  "7d": "son 7 gün",
  "30d": "son 30 gün",
  "90d": "son 90 gün",
};

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

function countryDisplay(raw: string) {
  const code = raw.toUpperCase();
  if (!code || code === "UNKNOWN") return { flag: "🌐", name: "Bilinmiyor" };
  return { flag: flagOf(code), name: COUNTRY_NAMES[code] ?? code };
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

function shortPath(raw: string) {
  const clean = raw.replace(/^\/(en|tr|de|ru|nl|ar|ro)(\/|$)/, "/");
  return clean.length > 32 ? clean.slice(0, 31) + "…" : clean || "/";
}

/**
 * Historical visitor traffic — the "Genel Analitik" tab next to the real-time
 * one. Four questions, in this order: how many arrived, how far down the
 * booking they got, where they came from, and what they looked at.
 *
 * Every figure counts visits, not events. The version before this tallied rows
 * of the analytics log, where the presence heartbeat voted once every 25
 * seconds, so the busiest country was really the slowest reader.
 */
export default function VisitorAnalyticsHistory() {
  const [range, setRange] = useState<RangeKey>("today");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Switching range is a click, so the spinner is raised here rather than in
     the effect: a setState in an effect body cascades a second render. */
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
          <p className="text-[11px] text-slate-400">Kaç kişi geldi, ne kadarı rezervasyona gitti</p>
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
        <div className="space-y-4">
          <div className="h-32 rounded-2xl border border-slate-100 bg-white animate-pulse" />
          <div className="grid lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-56 rounded-2xl border border-slate-100 bg-white animate-pulse" />
            ))}
          </div>
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

          <FunnelSteps funnel={data.funnel} subtitle={subtitle} />

          {data.recoveredVisits > 0 && (
            <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-slate-400">
              <Info size={13} className="mt-px shrink-0" />
              <span>
                Bu aralıktaki {data.recoveredVisits.toLocaleString("tr-TR")} ziyaret eski
                kayıtlardan geri getirildi. O dönemde form adımı ve gerçek ülke bilgisi
                toplanmıyordu, bu yüzden onlar &quot;Form Doldurdu&quot; sayısına girmez ve
                çoğu &quot;Bilinmiyor&quot; ülkesinde görünür.
              </span>
            </p>
          )}

          <div className="grid lg:grid-cols-3 gap-4">
            <Panel icon={MapPin} title="Ülkeler" subtitle="Nereden geliyorlar">
              <RankedList
                rows={data.countries}
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

            <Panel icon={Search} title="Sayfalar" subtitle="En çok açılan sayfalar">
              <RankedList
                rows={data.pages}
                accent="#10b981"
                render={(name) => <span className="font-mono text-[12px] truncate">{shortPath(name)}</span>}
              />
            </Panel>

            <Panel icon={Megaphone} title="Trafik Kaynakları" subtitle="Reklam, organik ve doğrudan">
              <RankedList
                rows={data.sources}
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
 * A ranked list of visits, with the sales that came out of them where the
 * split has any: the country sending the most traffic is often not the one
 * sending the most bookings, and volume alone hides that.
 */
function RankedList({
  rows,
  accent,
  render,
}: {
  rows: Row[];
  accent: string;
  render?: (name: string) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-6">Henüz veri yok</p>;
  }

  const max = Math.max(...rows.map((r) => r.visitors), 1);

  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div key={row.name}>
          <div className="flex items-center justify-between gap-3 mb-1">
            <div className="flex items-center gap-2 min-w-0 text-[13px] font-medium text-slate-700">
              {render ? render(row.name) : <span className="truncate">{row.name}</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0 text-[12px] tabular-nums">
              <span className="font-semibold text-slate-600">
                {row.visitors.toLocaleString("tr-TR")}
              </span>
              {row.purchased !== undefined && row.purchased > 0 && (
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {row.purchased} satış
                </span>
              )}
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: Math.round((row.visitors / max) * 100) + "%",
                backgroundColor: accent,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The five counts, in the order a customer walks them. This is the whole
 * answer to "how many came in and how many got as far as paying", so it sits
 * at the top with nothing above it repeating the same figures.
 */
function FunnelSteps({
  funnel,
  subtitle,
}: {
  funnel: { name: string; value: number }[];
  subtitle: string;
}) {
  const first = funnel[0]?.value ?? 0;

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 p-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <p className="text-[10px] text-slate-400 mb-3">Ziyaretten ödemeye · {subtitle}</p>
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
