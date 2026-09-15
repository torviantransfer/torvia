"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Globe,
  Radio,
  RefreshCw,
  Search,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  Button,
  Card,
  Chip,
  DataGrid,
  EmptyState,
  PageHeader,
  Segmented,
  StatStrip,
  Tabs,
  type GridColumn,
} from "@/components/admin/ui";
import BookingCharts from "./BookingCharts";
import { Country, RankedBars, STAGE, shortPath, sourceLabel, timeAgo, vehicleLabel, type Stage } from "./labels";

interface Visitor {
  sessionId: string;
  page: string | null;
  lastPage?: string | null;
  source: string;
  country?: string | null;
  city?: string | null;
  lastSeen: string;
  vehicleName: string | null;
  vehiclePrice: number | null;
  stage: Stage;
}

interface LiveResponse {
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
  recentlyExited: Visitor[];
}

type RangeKey = "today" | "7d" | "30d" | "90d";

interface AnalyticsResponse {
  range: RangeKey;
  truncated: boolean;
  recoveredVisits: number;
  funnel: { name: string; value: number }[];
  countries: { name: string; visitors: number; purchased?: number }[];
  sources: { name: string; visitors: number; purchased?: number }[];
  pages: { name: string; visitors: number; purchased?: number }[];
}

const REFRESH_MS = 10_000;
const FUNNEL_ICONS = [Users, ShoppingCart, ClipboardList, CreditCard, CheckCircle2];
const RANGE_LABEL: Record<RangeKey, string> = { today: "bugün", "7d": "son 7 gün", "30d": "son 30 gün", "90d": "son 90 gün" };

const LINKS = [
  { href: "https://analytics.google.com/", label: "GA4", sub: "Anlık ziyaretçi, kaynak, sayfa", icon: Activity },
  { href: "https://search.google.com/search-console", label: "Search Console", sub: "Aramalar, tıklama, sıralama", icon: Search },
  { href: "https://vercel.com/analytics", label: "Vercel Analytics", sub: "Tekil ziyaretçi, görüntüleme", icon: Globe },
];

function Vehicle({ v }: { v: Visitor }) {
  if (!v.vehicleName) return <span className="text-adm-faint">—</span>;
  return (
    <span className="truncate">
      {vehicleLabel(v.vehicleName)}
      {v.vehiclePrice != null && <span className="ms-1.5 tabular-nums text-adm-muted">${v.vehiclePrice}</span>}
    </span>
  );
}

const stageChip = (stage: Stage) => (
  <Chip tone={STAGE[stage]?.tone ?? "neutral"}>{STAGE[stage]?.label ?? stage}</Chip>
);

/** Canlı Ziyaretçiler, with its Analitik tab. docs/admin-tasarim.md, 5.4. */
export default function VisitorsScreen({ initialTab }: { initialTab: "live" | "analytics" }) {
  const pathname = usePathname();
  const [tab, setTab] = useState(initialTab);

  const changeTab = (next: "live" | "analytics") => {
    setTab(next);
    window.history.replaceState(window.history.state, "", next === "analytics" ? `${pathname}?tab=analitik` : pathname);
  };

  return (
    <>
      <PageHeader
        title="Canlı Ziyaretçiler"
        description={tab === "live" ? "Sitede şu an kim var, hangi sayfada, nereden geldi. 10 saniyede bir yenilenir." : "Ziyaretten ödemeye kadar, ve rezervasyonların genel görünümü."}
      />
      <Tabs
        label="Ziyaretçi ekranı"
        value={tab}
        onChange={changeTab}
        items={[
          { key: "live", label: "Canlı" },
          { key: "analytics", label: "Analitik" },
        ]}
      />
      {tab === "live" ? <LiveTab /> : <AnalyticsTab />}
    </>
  );
}

function LiveTab() {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-visitors", { cache: "no-store" });
      if (!res.ok) throw new Error("live");
      setData((await res.json()) as LiveResponse);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const visitorColumns: GridColumn<Visitor>[] = [
    { key: "page", header: "Sayfa", width: "minmax(160px,1.3fr)", area: "body", cell: (v) => <span className="block truncate font-mono text-[12.5px]">{shortPath(v.page)}</span> },
    { key: "source", header: "Kaynak", width: "minmax(110px,.8fr)", area: "foot-start", cell: (v) => <span className="truncate text-[13px]">{sourceLabel(v.source)}</span> },
    { key: "country", header: "Ülke", width: "minmax(130px,1fr)", cell: (v) => <span className="text-[13px]"><Country code={v.country ?? null} city={v.city} /></span> },
    { key: "vehicle", header: "Seçtiği araç", width: "minmax(120px,.9fr)", cell: (v) => <span className="text-[13px]"><Vehicle v={v} /></span> },
    { key: "stage", header: "Aşama", width: "130px", area: "top-end", cell: (v) => stageChip(v.stage) },
    { key: "seen", header: "Son görülme", width: "100px", area: "top-start", cell: (v) => <span className="text-xs text-adm-muted">{timeAgo(v.lastSeen)}</span> },
  ];

  const exitedColumns: GridColumn<Visitor>[] = [
    { key: "page", header: "Son sayfa", width: "minmax(180px,1.4fr)", area: "body", cell: (v) => <span className="block truncate font-mono text-[12.5px]">{shortPath(v.lastPage ?? v.page)}</span> },
    { key: "source", header: "Kaynak", width: "minmax(110px,.8fr)", area: "foot-start", cell: (v) => <span className="truncate text-[13px]">{sourceLabel(v.source)}</span> },
    { key: "vehicle", header: "Seçtiği araç", width: "minmax(120px,.9fr)", cell: (v) => <span className="text-[13px]"><Vehicle v={v} /></span> },
    { key: "stage", header: "Nerede bıraktı", width: "130px", area: "top-end", cell: (v) => stageChip(v.stage) },
    { key: "seen", header: "Ayrılma", width: "100px", area: "top-start", cell: (v) => <span className="text-xs text-adm-muted">{timeAgo(v.lastSeen)}</span> },
  ];

  const total = data?.liveCount ?? 0;

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-2">
        {error && (
          <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-adm-rose">
            <AlertTriangle size={14} aria-hidden="true" />
            Veriler yüklenemedi
          </span>
        )}
        <Button
          size="sm"
          icon={RefreshCw}
          loading={refreshing}
          className="ms-auto"
          onClick={() => {
            setRefreshing(true);
            void load();
          }}
        >
          Yenile
        </Button>
      </div>

      <StatStrip
        className="mb-0"
        items={[
          { label: "Şu an sitede", icon: Radio, value: data?.activeNowCount ?? "—", hint: "son 90 saniye" },
          { label: "Son 5 dakika", icon: Users, value: data?.liveCount ?? "—" },
          { label: "Araç seçti", value: data?.vehicleSelectedCount ?? "—" },
          { label: "Form dolduruyor", value: data?.formStartedCount ?? "—" },
          { label: "Ödeme adımında", value: data?.checkoutCount ?? "—", warn: (data?.checkoutCount ?? 0) > 0 },
          { label: "Satın aldı", value: data?.purchasedCount ?? "—" },
        ]}
      />

      <div className="grid gap-5 min-[1181px]:grid-cols-3">
        <Card title="Sayfalar" subtitle="Şu an hangi sayfada" flush>
          <RankedBars
            empty="Şu an sitede kimse yok"
            rows={(data?.pageDistribution ?? []).map((p) => ({ key: p.page, label: <span className="truncate font-mono text-[12.5px]">{shortPath(p.page)}</span>, value: p.count }))}
          />
        </Card>
        <Card title="Trafik kaynağı" subtitle={total ? `${total} ziyaretçi` : undefined} flush>
          <RankedBars
            empty="Şu an sitede kimse yok"
            rows={(data?.sourceDistribution ?? []).map((s) => ({ key: s.source, label: sourceLabel(s.source), value: s.count }))}
          />
        </Card>
        <Card title="Ülkeler" subtitle="Şu an sitedekiler" flush>
          <RankedBars
            empty="Şu an sitede kimse yok"
            rows={(data?.countryDistribution ?? []).map((c) => ({ key: c.country, label: <Country code={c.country} />, value: c.count }))}
          />
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Sitedeki ziyaretçiler</h2>
        <DataGrid
          label="Sitedeki ziyaretçiler"
          columns={visitorColumns}
          rows={data?.visitors ?? []}
          rowKey={(v) => v.sessionId}
          empty={<EmptyState compact icon={Users} title="Şu an sitede kimse yok" />}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Az önce ayrılanlar</h2>
        <DataGrid
          label="Az önce ayrılanlar"
          columns={exitedColumns}
          rows={data?.recentlyExited ?? []}
          rowKey={(v) => v.sessionId}
          empty={<EmptyState compact icon={Users} title="Son yarım saatte ayrılan yok" />}
        />
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [range, setRange] = useState<RangeKey>("today");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loadedRange, setLoadedRange] = useState<RangeKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/dashboard-analytics?range=${range}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((result) => {
        if (cancelled) return;
        if (result?.error) setError(result.error);
        else {
          setError(null);
          setData(result as AnalyticsResponse);
        }
        setLoadedRange(range);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Veriler yüklenemedi");
          setLoadedRange(range);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const loading = loadedRange !== range;
  const funnel = data?.funnel ?? [];
  const first = funnel[0]?.value ?? 0;

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">Ziyaretten ödemeye</h2>
        <span className="text-[12.5px] text-adm-muted">{RANGE_LABEL[range]}</span>
        <Segmented
          className="ms-auto"
          label="Aralık"
          value={range}
          onChange={setRange}
          options={[
            { value: "today", label: "Bugün" },
            { value: "7d", label: "7 gün" },
            { value: "30d", label: "30 gün" },
            { value: "90d", label: "90 gün" },
          ]}
        />
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-adm border border-[#f6c9d1] bg-adm-rose-soft px-3 py-2 text-[13px] text-adm-rose">
          <AlertTriangle size={14} aria-hidden="true" />
          {error}
        </p>
      )}
      {data?.truncated && (
        <p className="flex items-center gap-2 rounded-adm border border-adm-amber-line bg-adm-amber-soft px-3 py-2 text-[12.5px] text-[#7a4a06]">
          <AlertTriangle size={14} aria-hidden="true" />
          Bu aralıkta okunabilenden fazla ziyaret var, rakamlar eksik olabilir. Daha kısa bir aralık seçin.
        </p>
      )}

      <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={loading}>
        {funnel.length > 0 ? (
          <StatStrip
            className="mb-0"
            items={funnel.map((step, i) => {
              const previous = funnel[i - 1]?.value ?? 0;
              const drop = i > 0 && previous > 0 ? Math.round(((previous - step.value) / previous) * 100) : null;
              return {
                label: step.name,
                icon: FUNNEL_ICONS[i],
                value: step.value.toLocaleString("tr-TR"),
                hint:
                  i === 0
                    ? "ilk adım"
                    : `%${first ? Math.round((step.value / first) * 100) : 0} ilk adımdan${drop ? ` · %${drop} düşüş` : ""}`,
              };
            })}
          />
        ) : (
          <div className="h-24 animate-pulse rounded-adm-lg border border-adm-line bg-adm-surface" />
        )}

        {data && data.recoveredVisits > 0 && (
          <p className="mt-2 px-1 text-[11.5px] text-adm-muted">
            Bu aralıktaki {data.recoveredVisits.toLocaleString("tr-TR")} ziyaret eski kayıtlardan geri getirildi; o dönemde form
            adımı ve ülke toplanmıyordu, bu yüzden “Form doldurdu”ya girmez ve çoğu “Bilinmiyor” ülkesinde görünür.
          </p>
        )}

        <div className="mt-5 grid gap-5 min-[1181px]:grid-cols-3">
          <Card title="Ülkeler" subtitle="Nereden geliyorlar" flush>
            <RankedBars
              rows={(data?.countries ?? []).map((r) => ({
                key: r.name,
                label: <Country code={r.name} />,
                value: r.visitors,
                extra: r.purchased ? <Chip tone="green" plain>{r.purchased} satış</Chip> : undefined,
              }))}
            />
          </Card>
          <Card title="Sayfalar" subtitle="En çok açılanlar" flush>
            <RankedBars
              rows={(data?.pages ?? []).map((r) => ({
                key: r.name,
                label: <span className="truncate font-mono text-[12.5px]">{shortPath(r.name)}</span>,
                value: r.visitors,
              }))}
            />
          </Card>
          <Card title="Trafik kaynakları" subtitle="Reklam, organik, doğrudan" flush>
            <RankedBars
              rows={(data?.sources ?? []).map((r) => ({
                key: r.name,
                label: sourceLabel(r.name),
                value: r.visitors,
                extra: r.purchased ? <Chip tone="green" plain>{r.purchased} satış</Chip> : undefined,
              }))}
            />
          </Card>
        </div>
      </div>

      <h2 className="mt-2 text-sm font-semibold">Rezervasyonlar</h2>
      <BookingCharts />

      <Card title="Dış paneller">
        <div className="grid gap-3 min-[761px]:grid-cols-3">
          {LINKS.map(({ href, label, sub, icon: Icon }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-adm border border-adm-line bg-adm-surface-2 px-3.5 py-3 transition-colors hover:border-adm-line-strong hover:bg-adm-surface"
            >
              <Icon size={17} aria-hidden="true" className="shrink-0 text-adm-muted" />
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold">{label}</span>
                <span className="block truncate text-[11.5px] text-adm-muted">{sub}</span>
              </span>
              <ExternalLink size={13} aria-hidden="true" className="ms-auto shrink-0 text-adm-faint" />
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
