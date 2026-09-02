"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  Search, Home, Rocket, FileText, MapPin, Newspaper, Save, Loader2, Check,
  ExternalLink, ChevronLeft, AlertCircle, Plus, Wand2, CopyX, RefreshCw,
  AlertOctagon, AlertTriangle, EyeOff, Link2,
} from "lucide-react";
import {
  scoreSeo, TITLE_MIN, TITLE_IDEAL_MIN, TITLE_IDEAL_MAX, TITLE_MAX,
  DESC_MIN, DESC_IDEAL_MIN, DESC_IDEAL_MAX, DESC_MAX,
  parseKeywords, type SeoScore,
} from "@/lib/seoScore";
import { auditPage, auditSummary, type AuditFinding } from "@/lib/seoAudit";
import type { PageInspection } from "@/lib/seoInspect";
import { safeCanonical } from "@/lib/seoOverrides";
import {
  buildDuplicateIndex, duplicateChecks, duplicateCount, type DuplicateIndex,
} from "@/lib/seoDuplicates";
import { locales } from "@/i18n/config";
import SerpPreview from "./seo/SerpPreview";
import SocialPreview from "./seo/SocialPreview";
import SeoScorePanel, { ScoreBadge } from "./seo/SeoScorePanel";
import EffectiveField, { fieldSource } from "./seo/EffectiveField";
import { TechnicalChecks, HreflangPanel, SchemaPanel, RuntimeSummary } from "./seo/RuntimePanels";
import SaveDiffDialog, { computeChanges, type FieldChange } from "./seo/SaveDiffDialog";
import BulkFillDialog, { type BulkTarget } from "./seo/BulkFillDialog";
import {
  LOCALES, type Loc, LocaleTabs, TextField, KeywordField, ImageField, Section,
} from "./seo/fields";
import {
  pageEntry, regionEntry, blogEntry, field, str, translatedLocales,
  type Entry, type FieldMap,
} from "./seo/entries";

const SITE_URL = "https://torviantransfer.com";

/**
 * The SEO control panel.
 *
 * Its central job is not editing — it is telling the truth about what the site
 * currently serves. An earlier version showed only the override columns, so
 * /en/antalya-airport-transfer appeared to have no title at all when in fact
 * it has had one from a hardcoded map for months. An editor reading that as
 * "SEO missing" and typing a replacement would overwrite ranking copy without
 * ever seeing it.
 *
 * So every field is shown three ways: the admin override, the value the page
 * actually serves (fetched from the rendered HTML rather than recomputed), and
 * the effective result with its source labelled. A field with no override does
 * not render an empty box; it renders the live value and an explicit "create
 * an override" action, which makes editing a deliberate act.
 */

type FieldName = keyof FieldMap;

const GROUP_META: Record<string, { label: string; icon: typeof Home; color: string }> = {
  home: { label: "Ana Sayfa", icon: Home, color: "#f97316" },
  landing: { label: "Landing", icon: Rocket, color: "#8b5cf6" },
  static: { label: "Statik", icon: FileText, color: "#0ea5e9" },
  region: { label: "Bölge", icon: MapPin, color: "#10b981" },
  blog: { label: "Blog", icon: Newspaper, color: "#ec4899" },
};

/** Legal and utility pages are scored leniently — see scoreSeo's "lite" mode. */
const LITE_KEYS = new Set(["privacy", "terms", "cookies", "kvkk", "cancellation"]);

const TWITTER_CARDS = ["summary_large_image", "summary"] as const;

export default function SeoManager({
  initialPages,
  initialRegions,
  initialPosts,
}: {
  initialPages: Record<string, unknown>[];
  initialRegions: Record<string, unknown>[];
  initialPosts: Record<string, unknown>[];
}) {
  const [pages, setPages] = useState(initialPages);
  const [regions, setRegions] = useState(initialRegions);
  const [posts, setPosts] = useState(initialPosts);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [issueFilter, setIssueFilter] = useState<"all" | "problems" | "missing" | "noindex">("all");
  const [locale, setLocale] = useState<Loc>("tr");
  const [creating, setCreating] = useState(false);
  const [bulk, setBulk] = useState(false);

  /**
   * Inspections keyed by the path they were taken from. Held at this level so
   * a whole-list scan survives navigating in and out of individual pages.
   */
  const [inspections, setInspections] = useState<Record<string, PageInspection>>({});
  const [scanning, setScanning] = useState<Set<string>>(new Set());

  const entries: Entry[] = useMemo(
    () => [...pages.map(pageEntry), ...regions.map(regionEntry), ...posts.map(blogEntry)],
    [pages, regions, posts]
  );

  const pathOf = useCallback((entry: Entry, loc: string) => {
    const route = entry.routeFor(loc);
    return `/${loc}${route ? `/${route}` : ""}`;
  }, []);

  /** Reads the live SEO surface for a set of pages, in batches. */
  const scan = useCallback(
    async (targets: { entry: Entry; loc: string }[]) => {
      const paths = [...new Set(targets.map((t) => pathOf(t.entry, t.loc)))];
      if (paths.length === 0) return;
      setScanning((prev) => new Set([...prev, ...paths]));
      // The endpoint caps a request at 12 renders so one call stays inside the
      // serverless timeout; a full-site scan is therefore several calls.
      for (let i = 0; i < paths.length; i += 10) {
        const batch = paths.slice(i, i + 10);
        try {
          const res = await fetch("/api/admin/seo-inspect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paths: batch }),
          });
          const json = await res.json();
          if (json.results) setInspections((prev) => ({ ...prev, ...json.results }));
        } catch {
          // A failed batch simply leaves those paths uninspected, which the UI
          // renders as "taranmadı" rather than as "no value".
        } finally {
          setScanning((prev) => {
            const next = new Set(prev);
            for (const p of batch) next.delete(p);
            return next;
          });
        }
      }
    },
    [pathOf]
  );

  const duplicates = useMemo(
    () =>
      buildDuplicateIndex(
        entries.map((e) => ({ id: e.id, label: e.label, row: e.row })),
        locale
      ),
    [entries, locale]
  );

  const scores = useMemo(() => {
    const map = new Map<string, SeoScore>();
    for (const e of entries) map.set(e.id, scoreEntry(e, locale, duplicates));
    return map;
  }, [entries, locale, duplicates]);

  const audits = useMemo(() => {
    const map = new Map<string, AuditFinding[]>();
    for (const e of entries) {
      const insp = inspections[pathOf(e, locale)];
      if (!insp) continue;
      map.set(e.id, auditFor(e, locale, insp, duplicates));
    }
    return map;
  }, [entries, inspections, locale, duplicates, pathOf]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (groupFilter !== "all" && e.pageType !== groupFilter) return false;

      if (issueFilter === "problems") {
        const a = audits.get(e.id);
        if (!a || auditSummary(a).level === "ok") return false;
      } else if (issueFilter === "missing") {
        const insp = inspections[pathOf(e, locale)];
        const hasTitle = str(e.row, field(e.fieldMap, "metaTitle", locale)) || insp?.title;
        const hasDesc = str(e.row, field(e.fieldMap, "metaDescription", locale)) || insp?.description;
        if (hasTitle && hasDesc) return false;
      } else if (issueFilter === "noindex") {
        const insp = inspections[pathOf(e, locale)];
        const off =
          e.row.noindex === true || /noindex/i.test(`${insp?.robots ?? ""} ${insp?.googlebot ?? ""}`);
        if (!off) return false;
      }

      if (!q) return true;
      return (
        e.label.toLowerCase().includes(q) ||
        e.key.toLowerCase().includes(q) ||
        e.routeFor(locale).toLowerCase().includes(q) ||
        str(e.row, field(e.fieldMap, "metaTitle", locale)).toLowerCase().includes(q)
      );
    });
  }, [entries, query, groupFilter, issueFilter, audits, inspections, locale, pathOf]);

  const current = entries.find((e) => e.id === selected) ?? null;

  const applyRow = useCallback((entry: Entry, next: Record<string, unknown>) => {
    const update = (rows: Record<string, unknown>[]) =>
      rows.map((r) => (String(r.id) === entry.id ? { ...r, ...next } : r));
    if (entry.table === "seo_pages") setPages(update);
    else if (entry.table === "regions") setRegions(update);
    else setPosts(update);
  }, []);

  const stats = useMemo(() => {
    const all = [...scores.values()];
    const findings = [...audits.values()].flat();
    return {
      total: entries.length,
      avg: all.length ? Math.round(all.reduce((s, x) => s + x.percent, 0) / all.length) : 0,
      errors: findings.filter((x) => x.level === "error").length,
      dup: duplicateCount(duplicates),
      scanned: audits.size,
    };
  }, [scores, audits, duplicates, entries.length]);

  if (current) {
    return (
      <SeoEditor
        entry={current}
        locale={locale}
        duplicates={duplicates}
        inspection={inspections[pathOf(current, locale)] ?? null}
        scanning={scanning.has(pathOf(current, locale))}
        onScan={() => scan([{ entry: current, loc: locale }])}
        onLocale={setLocale}
        onBack={() => setSelected(null)}
        onSaved={(next) => applyRow(current, next)}
      />
    );
  }

  const unscanned = filtered.filter((e) => !inspections[pathOf(e, locale)]).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Sayfa" value={String(stats.total)} />
        <Stat label={`Ortalama skor (${locale.toUpperCase()})`} value={`%${stats.avg}`} />
        <Stat label="Taranan" value={`${stats.scanned}/${stats.total}`} />
        <Stat label="Teknik hata" value={String(stats.errors)} tone={stats.errors > 0 ? "warn" : "ok"} />
        <Stat label="Yinelenen metin" value={String(stats.dup)} tone={stats.dup > 0 ? "warn" : "ok"} />
      </div>

      {/* Scanning is the only way this panel knows what the site actually
          serves, so its state is stated rather than left implicit. */}
      <div className="flex items-center gap-3 flex-wrap rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium text-slate-800">Yayındaki değerleri oku</p>
          <p className="text-[11.5px] text-slate-500 mt-0.5">
            Panel, sayfaların gerçek HTML çıktısını okuyarak mevcut title, canonical, robots,
            hreflang ve schema değerlerini gösterir.{" "}
            {unscanned > 0 ? `${unscanned} sayfa henüz taranmadı.` : "Listedeki tüm sayfalar tarandı."}
          </p>
        </div>
        <button
          onClick={() => scan(filtered.map((entry) => ({ entry, loc: locale })))}
          disabled={scanning.size > 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[12.5px] font-semibold cursor-pointer shrink-0"
        >
          {scanning.size > 0 ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {scanning.size > 0 ? `Taranıyor (${scanning.size})…` : `${filtered.length} sayfayı tara`}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sayfa adı, URL, slug veya başlık ara…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
          />
        </div>
        <button
          onClick={() => setBulk(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold cursor-pointer shrink-0"
        >
          <Wand2 size={15} /> Toplu doldur
        </button>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold cursor-pointer shrink-0"
        >
          <Plus size={15} /> Yeni bölge
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Pills
          value={groupFilter}
          onChange={setGroupFilter}
          options={[
            ["all", "Tümü"],
            ["home", "Ana sayfa"],
            ["landing", "Landing"],
            ["static", "Statik"],
            ["region", "Bölge"],
            ["blog", "Blog"],
          ]}
        />
        <Pills
          value={issueFilter}
          onChange={(v) => setIssueFilter(v as typeof issueFilter)}
          options={[
            ["all", "Hepsi"],
            ["problems", "Sorunlu"],
            ["missing", "Eksik metadata"],
            ["noindex", "noindex"],
          ]}
        />
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate-500">Dil:</span>
          <Pills
            value={locale}
            onChange={(v) => setLocale(v as Loc)}
            options={LOCALES.map((l) => [l, l.toUpperCase()] as [string, string])}
            compact
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-semibold">Sayfa</th>
                <th className="px-3 py-2.5 font-semibold">URL</th>
                <th className="px-3 py-2.5 font-semibold">Title</th>
                <th className="px-3 py-2.5 font-semibold text-center">Index</th>
                <th className="px-3 py-2.5 font-semibold text-center">Canonical</th>
                <th className="px-3 py-2.5 font-semibold text-center">Hreflang</th>
                <th className="px-3 py-2.5 font-semibold text-center">Sağlık</th>
                <th className="px-3 py-2.5 font-semibold text-center">Skor</th>
                <th className="px-3 py-2.5 font-semibold">Güncelleme</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[13px] text-slate-500">
                    Bu filtreye uyan sayfa yok.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <ListRow
                    key={e.id}
                    entry={e}
                    locale={locale}
                    score={scores.get(e.id)!}
                    findings={audits.get(e.id)}
                    inspection={inspections[pathOf(e, locale)]}
                    scanning={scanning.has(pathOf(e, locale))}
                    duplicate={duplicates.titles.has(e.id)}
                    onOpen={() => {
                      setSelected(e.id);
                      if (!inspections[pathOf(e, locale)]) scan([{ entry: e, loc: locale }]);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {bulk && (
        <BulkFillDialog
          targets={filtered.map<BulkTarget>((e) => ({
            id: e.id,
            table: e.table,
            name: e.label,
            route: e.routeFor(locale),
            row: e.row,
          }))}
          locale={locale}
          onClose={() => setBulk(false)}
          onApplied={(updates) => {
            for (const u of updates) {
              const entry = entries.find((x) => x.id === u.id);
              if (entry) applyRow(entry, u.data);
            }
          }}
        />
      )}

      {creating && (
        <NewRegionDialog
          onClose={() => setCreating(false)}
          onCreated={(row) => {
            setRegions((prev) => [...prev, row]);
            setCreating(false);
            setSelected(String(row.id));
          }}
        />
      )}
    </div>
  );
}

function auditFor(
  entry: Entry,
  locale: string,
  inspection: PageInspection,
  duplicates: DuplicateIndex
): AuditFinding[] {
  return auditPage(inspection, {
    route: entry.routeFor(locale),
    locale,
    translatedLocales: translatedLocales(entry, locales),
    isActive: entry.isPublic,
    shouldIndex: entry.shouldIndex,
    pageType: entry.pageType,
    duplicateTitleWith: duplicates.titles.get(entry.id)?.map((id) => duplicates.labels.get(id) ?? id),
  });
}

// ---------------------------------------------------------------------------
// List row
// ---------------------------------------------------------------------------

function ListRow({
  entry,
  locale,
  score,
  findings,
  inspection,
  scanning,
  duplicate,
  onOpen,
}: {
  entry: Entry;
  locale: Loc;
  score: SeoScore;
  findings?: AuditFinding[];
  inspection?: PageInspection;
  scanning: boolean;
  duplicate: boolean;
  onOpen: () => void;
}) {
  const meta = GROUP_META[entry.pageType] ?? GROUP_META.static;
  const route = entry.routeFor(locale);
  const override = str(entry.row, field(entry.fieldMap, "metaTitle", locale));
  const effectiveTitle = override || inspection?.title || "";
  const source = fieldSource(override, inspection?.title);

  const robotsText = `${inspection?.robots ?? ""} ${inspection?.googlebot ?? ""}`;
  const noindexed = entry.row.noindex === true || /noindex/i.test(robotsText);

  const canonicalState: "ok" | "other" | "missing" | "unknown" = !inspection
    ? "unknown"
    : !inspection.canonical
      ? "missing"
      : inspection.canonical.replace(/\/+$/, "") === inspection.url.replace(/\/+$/, "")
        ? "ok"
        : "other";

  const hreflangCount = inspection?.alternates.filter((a) => a.hreflang !== "x-default").length ?? 0;
  const health = findings ? auditSummary(findings) : null;

  return (
    <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={onOpen}>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${meta.color}14` }}
          >
            <meta.icon size={14} style={{ color: meta.color }} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-slate-900 truncate max-w-[220px]">
              {entry.label}
            </span>
            <span className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10.5px] text-slate-500">{meta.label}</span>
              {!entry.isPublic && (
                <span className="px-1 py-0.5 rounded text-[9.5px] font-medium bg-slate-100 text-slate-500">
                  yayında değil
                </span>
              )}
              {duplicate && (
                <span
                  className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9.5px] font-medium bg-amber-50 text-amber-700"
                  title="Meta başlığı başka bir sayfayla aynı"
                >
                  <CopyX size={9} /> yinelenen
                </span>
              )}
            </span>
          </span>
        </div>
      </td>

      <td className="px-3 py-2.5">
        <span className="text-[11.5px] text-slate-600 font-mono whitespace-nowrap">
          /{locale}
          {route ? `/${route}` : ""}
        </span>
      </td>

      <td className="px-3 py-2.5 max-w-[240px]">
        {scanning ? (
          <span className="text-[11.5px] text-slate-400">okunuyor…</span>
        ) : effectiveTitle ? (
          <span className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: source === "admin" ? "#7c3aed" : "#0ea5e9" }}
              title={source === "admin" ? "Admin override" : "Sayfa kodu / varsayılan"}
            />
            <span className="text-[12px] text-slate-700 truncate">{effectiveTitle}</span>
          </span>
        ) : inspection ? (
          <span className="text-[11.5px] text-red-600">yok</span>
        ) : (
          <span className="text-[11.5px] text-slate-400">taranmadı</span>
        )}
      </td>

      <td className="px-3 py-2.5 text-center">
        {!inspection ? (
          <Dash />
        ) : noindexed ? (
          <Chip
            icon={EyeOff}
            label="noindex"
            color={entry.shouldIndex ? "#dc2626" : "#64748b"}
            bg={entry.shouldIndex ? "#fef2f2" : "#f1f5f9"}
          />
        ) : (
          <Chip label="index" color="#16a34a" bg="#f0fdf4" />
        )}
      </td>

      <td className="px-3 py-2.5 text-center">
        {canonicalState === "unknown" ? (
          <Dash />
        ) : canonicalState === "ok" ? (
          <Chip icon={Link2} label="self" color="#16a34a" bg="#f0fdf4" />
        ) : canonicalState === "other" ? (
          <Chip
            icon={Link2}
            label="başka"
            color="#d97706"
            bg="#fffbeb"
            title={inspection?.canonical ?? undefined}
          />
        ) : (
          <Chip label="yok" color="#dc2626" bg="#fef2f2" />
        )}
      </td>

      <td className="px-3 py-2.5 text-center">
        {!inspection ? (
          <Dash />
        ) : hreflangCount === 0 ? (
          <Chip label="yok" color="#d97706" bg="#fffbeb" />
        ) : (
          <span className="text-[11.5px] text-slate-600 tabular-nums">
            {hreflangCount}/{locales.length}
          </span>
        )}
      </td>

      <td className="px-3 py-2.5 text-center">
        {!health ? (
          <Dash />
        ) : health.level === "ok" ? (
          <Chip label="temiz" color="#16a34a" bg="#f0fdf4" />
        ) : health.level === "error" ? (
          <Chip icon={AlertOctagon} label={String(health.errors)} color="#dc2626" bg="#fef2f2" />
        ) : (
          <Chip icon={AlertTriangle} label={String(health.warnings)} color="#d97706" bg="#fffbeb" />
        )}
      </td>

      <td className="px-3 py-2.5 text-center">
        <ScoreBadge percent={score.percent} />
      </td>

      <td className="px-3 py-2.5">
        <span className="text-[11px] text-slate-500 whitespace-nowrap">
          {entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString("tr-TR") : "—"}
        </span>
      </td>
    </tr>
  );
}

function Dash() {
  return <span className="text-[11.5px] text-slate-300">—</span>;
}

function Chip({
  label,
  color,
  bg,
  icon: Icon,
  title,
}: {
  label: string;
  color: string;
  bg: string;
  icon?: typeof AlertOctagon;
  title?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-semibold whitespace-nowrap"
      style={{ color, backgroundColor: bg }}
      title={title}
    >
      {Icon && <Icon size={10} />}
      {label}
    </span>
  );
}

function Pills({
  value,
  onChange,
  options,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100">
      {options.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`${compact ? "px-2.5 py-1" : "px-3 py-1.5"} rounded-lg text-[12px] font-medium transition-all cursor-pointer`}
          style={{
            backgroundColor: value === id ? "#fff" : "transparent",
            color: value === id ? "#0f172a" : "#64748b",
            boxShadow: value === id ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className="text-[22px] font-bold tabular-nums mt-0.5"
        style={{ color: tone === "warn" ? "#d97706" : tone === "ok" ? "#16a34a" : "#0f172a" }}
      >
        {value}
      </p>
    </div>
  );
}

function scoreEntry(entry: Entry, locale: Loc, duplicates?: DuplicateIndex): SeoScore {
  const g = (name: FieldName) => str(entry.row, field(entry.fieldMap, name, locale));
  const base = scoreSeo(
    {
      // A post with no meta_title falls back to its own title, which is what
      // the page actually emits — scoring it as "missing" would be false.
      title: g("metaTitle") || str(entry.row, `title_${locale}`),
      description: g("metaDescription") || str(entry.row, `excerpt_${locale}`),
      focusKeyword: g("focusKeyword"),
      keywords: g("keywords"),
      slug: entry.routeFor(locale),
      content: g("intro") || str(entry.row, `content_${locale}`),
      h1: g("h1") || str(entry.row, `title_${locale}`) || str(entry.row, `name_${locale}`),
      imageUrl: str(entry.row, "image_url"),
      ogImageUrl: str(entry.row, "og_image_url"),
      imageAlt: str(entry.row, "image_alt"),
    },
    { mode: LITE_KEYS.has(entry.key) ? "lite" : "full" }
  );

  const extra = duplicates ? duplicateChecks(duplicates, entry.id) : [];
  if (extra.length === 0) return base;

  const checks = [...base.checks, ...extra];
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce(
    (sum, c) => sum + (c.status === "pass" ? c.weight : c.status === "warn" ? c.weight / 2 : 0),
    0
  );
  const percent = total === 0 ? 0 : Math.round((earned / total) * 100);
  return {
    percent,
    grade: percent >= 85 ? "excellent" : percent >= 65 ? "good" : percent >= 40 ? "fair" : "poor",
    checks,
    passed: checks.filter((c) => c.status === "pass").length,
    total: checks.length,
  };
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

function SeoEditor({
  entry,
  locale,
  duplicates,
  inspection,
  scanning,
  onScan,
  onLocale,
  onBack,
  onSaved,
}: {
  entry: Entry;
  locale: Loc;
  duplicates: DuplicateIndex;
  inspection: PageInspection | null;
  scanning: boolean;
  onScan: () => void;
  onLocale: (l: Loc) => void;
  onBack: () => void;
  onSaved: (next: Record<string, unknown>) => void;
}) {
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...entry.row });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const requested = useRef<string | null>(null);

  const path = `${locale}${entry.routeFor(locale)}`;

  // The editor can open on a page whose live values have not been read yet.
  // Without them every field would claim "no value", which is precisely the
  // misreading this panel exists to prevent.
  useEffect(() => {
    if (!inspection && !scanning && requested.current !== path) {
      requested.current = path;
      onScan();
    }
  }, [inspection, scanning, onScan, path]);

  const col = useCallback(
    (name: FieldName) => field(entry.fieldMap, name, locale),
    [entry.fieldMap, locale]
  );
  const get = (name: FieldName) => str(draft, col(name));
  const set = (name: FieldName, v: unknown) => {
    const c = col(name);
    if (!c) return;
    setDraft((d) => ({ ...d, [c]: v }));
    setSaved(false);
  };
  const setRaw = (column: string, v: unknown) => {
    setDraft((d) => ({ ...d, [column]: v }));
    setSaved(false);
  };

  // The same function builds the confirmation diff and the save payload, so
  // the screen can never show one set of changes while writing another.
  const changes: FieldChange[] = useMemo(
    () => computeChanges(entry.row, draft),
    [draft, entry.row]
  );

  const dirty = changes.length > 0;

  const score = useMemo(
    () => scoreEntry({ ...entry, row: draft }, locale, duplicates),
    [entry, draft, locale, duplicates]
  );

  const findings = useMemo(
    () => (inspection ? auditFor(entry, locale, inspection, duplicates) : []),
    [inspection, entry, locale, duplicates]
  );

  const localeStatus = useMemo(() => {
    const out: Record<string, "full" | "partial" | "empty"> = {};
    for (const l of LOCALES) {
      const t = str(draft, field(entry.fieldMap, "metaTitle", l));
      const d = str(draft, field(entry.fieldMap, "metaDescription", l));
      out[l] = t && d ? "full" : t || d ? "partial" : "empty";
    }
    return out;
  }, [draft, entry.fieldMap]);

  const leave = () => {
    if (dirty && !confirm("Kaydedilmemiş değişiklikler var. Yine de listeye dönülsün mü?")) return;
    onBack();
  };

  const commit = async () => {
    setSaving(true);
    setError(null);
    // Only changed columns are sent. A whole-row update would resend fields
    // this screen does not manage — pricing joins, coordinates — and any stale
    // value in the client copy would overwrite a newer one.
    const payload: Record<string, unknown> = {};
    for (const c of changes) payload[c.field] = draft[c.field];
    payload.updated_at = new Date().toISOString();
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: entry.table, action: "update", id: entry.id, data: payload }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Kaydedilemedi");
      onSaved(json.data ?? payload);
      setSaved(true);
      setConfirming(false);
      // The save revalidated the page server-side; re-reading it is what
      // proves the change actually reached the HTML.
      requested.current = null;
      setTimeout(onScan, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) setConfirming(true);
      }
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onUnload);
    };
  });

  const focusField = (name: string) => {
    const el =
      document.getElementById(`seo-${name}-${locale}`) ?? document.getElementById(`seo-${name}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLInputElement | null)?.focus();
  };

  const route = entry.routeFor(locale);
  const liveUrl = `${SITE_URL}/${locale}${route ? `/${route}` : ""}`;
  const lite = LITE_KEYS.has(entry.key);

  const effTitle = get("metaTitle") || inspection?.title || "";
  const effDesc = get("metaDescription") || inspection?.description || "";
  const effOgImage = str(draft, "og_image_url") || str(draft, "image_url") || inspection?.ogImage || "";

  const canonicalDraft = get("canonical");
  const canonicalSafe = safeCanonical(canonicalDraft);
  const canonicalWarning = !canonicalDraft
    ? null
    : !canonicalSafe
      ? "Geçersiz veya site dışı bir adres — bu haliyle yok sayılır. Sadece torviantransfer.com adresleri kabul edilir."
      : canonicalSafe !== canonicalDraft
        ? `Kaydedilecek hali: ${canonicalSafe}`
        : null;

  const uploadFolder =
    entry.kind === "region" ? "regions" : entry.kind === "blog" ? "blog" : "pages";

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-slate-50/95 backdrop-blur border-b border-slate-200 flex items-center gap-3 flex-wrap">
        <button
          onClick={leave}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ChevronLeft size={16} /> Liste
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-slate-900 truncate">{entry.label}</p>
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11.5px] text-slate-500 hover:text-orange-600"
          >
            {liveUrl.replace("https://", "")} <ExternalLink size={11} />
          </a>
        </div>
        <ScoreBadge percent={score.percent} />
        <button
          onClick={() => setConfirming(true)}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: saved && !dirty ? "#16a34a" : "#f97316" }}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved && !dirty ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving
            ? "Kaydediliyor…"
            : saved && !dirty
              ? "Kaydedildi"
              : `Kaydet${dirty ? ` (${changes.length})` : ""}`}
        </button>
      </div>

      {error && (
        <p className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[12.5px] text-red-700">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      {!entry.isPublic && (
        <p className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-[12.5px] text-slate-600">
          <EyeOff size={14} /> Bu sayfa yayında değil — sitemap&apos;te yok. SEO alanları yine de
          doldurulabilir.
        </p>
      )}

      <LocaleTabs active={locale} onChange={onLocale} status={localeStatus} />

      <div className="grid xl:grid-cols-[minmax(0,1fr)_400px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <Section
            title="Arama sonucu"
            description="Boş bırakılan alanlar sayfanın mevcut değerini kullanmaya devam eder. Kutunun üstündeki etiket değerin nereden geldiğini gösterir."
          >
            <EffectiveField
              id={`seo-meta_title-${locale}`}
              label="Meta başlık"
              override={get("metaTitle")}
              onChange={(v) => set("metaTitle", v)}
              live={inspection?.title}
              loading={scanning}
              counter={{ min: TITLE_MIN, ideal: [TITLE_IDEAL_MIN, TITLE_IDEAL_MAX], max: TITLE_MAX }}
            />
            <EffectiveField
              id={`seo-meta_description-${locale}`}
              label="Meta açıklama"
              multiline
              rows={3}
              override={get("metaDescription")}
              onChange={(v) => set("metaDescription", v)}
              live={inspection?.description}
              loading={scanning}
              counter={{ min: DESC_MIN, ideal: [DESC_IDEAL_MIN, DESC_IDEAL_MAX], max: DESC_MAX }}
            />
          </Section>

          <Section
            title="Canonical"
            description="Aynı içeriğin asıl adresi. Yanlış bir değer sayfayı Google'dan düşürür."
          >
            <EffectiveField
              id={`seo-canonical_url-${locale}`}
              label="Canonical URL"
              override={canonicalDraft}
              onChange={(v) => set("canonical", v)}
              live={inspection?.canonical}
              loading={scanning}
              warning={canonicalWarning}
              hint="Boş bırakılırsa sistem otomatik üretir — normal durumda doğrusu budur."
            />
          </Section>

          <Section
            title="İndeksleme"
            description="Bu iki ayar sayfanın Google'da olup olmayacağını doğrudan belirler."
          >
            <TriToggle
              label="Google'dan gizle (noindex)"
              description="Açılırsa sayfa arama sonuçlarından çıkarılır. Sıralaması olan bir sayfada bu trafiği kaybettirir."
              value={draft.noindex === true ? true : draft.noindex === false ? false : null}
              onChange={(v) => setRaw("noindex", v)}
            />
            <TriToggle
              label="Linkleri izleme (nofollow)"
              description="Açılırsa bu sayfadaki linkler taranmaz, iç link gücü aktarılmaz."
              value={draft.nofollow === true ? true : draft.nofollow === false ? false : null}
              onChange={(v) => setRaw("nofollow", v)}
            />
            {inspection && (
              <p className="text-[11.5px] text-slate-500">
                Şu an yayında:{" "}
                <code className="font-mono text-slate-700">
                  {inspection.googlebot ?? inspection.robots ?? "direktif yok"}
                </code>
              </p>
            )}
          </Section>

          {!lite && (
            <Section
              title="Anahtar kelimeler"
              description="Sitede meta etiketi olarak yayınlanmaz — puanlama bunlara göre yapılır."
            >
              <TextField
                id={`seo-focus_keyword-${locale}`}
                label="Odak anahtar kelime"
                value={get("focusKeyword")}
                onChange={(v) => set("focusKeyword", v)}
                placeholder="belek transfer"
              />
              <KeywordField
                id={`seo-keywords-${locale}`}
                label="Yan anahtar kelimeler"
                value={get("keywords")}
                onChange={(v) => set("keywords", v)}
              />
            </Section>
          )}

          <Section title="Sayfa metni">
            {entry.fieldMap.h1 ? (
              <EffectiveField
                id={`seo-h1-${locale}`}
                label="H1 başlığı"
                override={get("h1")}
                onChange={(v) => set("h1", v)}
                live={inspection?.h1s[0]}
                loading={scanning}
              />
            ) : (
              <EffectiveField
                label="H1 başlığı"
                override=""
                onChange={() => {}}
                live={inspection?.h1s[0] ?? str(draft, `title_${locale}`)}
                readOnly={{
                  reason:
                    "Blog yazılarında H1, yazının başlığıdır ve Blog Yazıları ekranından düzenlenir. Arama sonucundaki başlığı ondan ayırmak için yukarıdaki meta başlığı doldurun.",
                }}
              />
            )}
            {entry.fieldMap.intro && (
              <TextField
                id={`seo-intro-${locale}`}
                label={
                  entry.kind === "region"
                    ? "Bölge açıklaması"
                    : entry.kind === "blog"
                      ? "Özet (excerpt)"
                      : "Giriş paragrafı"
                }
                multiline
                rows={5}
                value={get("intro")}
                onChange={(v) => set("intro", v)}
                hint={
                  entry.kind === "region"
                    ? "Bu dilde boş bırakılan bölgeler o dilde indekslenmez — mevcut davranış korunur."
                    : undefined
                }
              />
            )}
            {entry.kind === "region" && (
              <TextField
                id={`seo-name-${locale}`}
                label="Bölge adı"
                value={str(draft, `name_${locale}`)}
                onChange={(v) => setRaw(`name_${locale}`, v)}
              />
            )}
          </Section>

          <Section
            title="Open Graph"
            description="WhatsApp ve Facebook paylaşımlarında görünen bilgiler. Boş bırakılırsa yukarıdaki meta başlık ve açıklama kullanılır."
          >
            <EffectiveField
              id={`seo-og_title-${locale}`}
              label="OG başlık"
              override={get("ogTitle")}
              onChange={(v) => set("ogTitle", v)}
              live={inspection?.ogTitle}
              loading={scanning}
            />
            <EffectiveField
              id={`seo-og_description-${locale}`}
              label="OG açıklama"
              multiline
              rows={2}
              override={get("ogDescription")}
              onChange={(v) => set("ogDescription", v)}
              live={inspection?.ogDescription}
              loading={scanning}
            />
            <ImageField
              label="OG görseli (1200×630)"
              value={str(draft, "og_image_url")}
              onChange={(v) => setRaw("og_image_url", v)}
              folder={uploadFolder}
              aspect="1.91/1"
              hint={
                inspection?.ogImage
                  ? `Şu an yayında: ${inspection.ogImage.replace(SITE_URL, "")}`
                  : "Boş bırakılırsa kart görseli kullanılır."
              }
            />
          </Section>

          <Section
            title="X / Twitter"
            description="Boş bırakılan alanlar önce Open Graph, sonra meta değerlerine düşer."
          >
            <EffectiveField
              id={`seo-twitter_title-${locale}`}
              label="Twitter başlık"
              override={get("twitterTitle")}
              onChange={(v) => set("twitterTitle", v)}
              live={inspection?.twitterTitle}
              loading={scanning}
            />
            <EffectiveField
              id={`seo-twitter_description-${locale}`}
              label="Twitter açıklama"
              multiline
              rows={2}
              override={get("twitterDescription")}
              onChange={(v) => set("twitterDescription", v)}
              live={inspection?.twitterDescription}
              loading={scanning}
            />
            <ImageField
              label="Twitter görseli"
              value={str(draft, "twitter_image_url")}
              onChange={(v) => setRaw("twitter_image_url", v)}
              folder={uploadFolder}
              aspect="1.91/1"
              hint="Boş bırakılırsa OG görseli kullanılır."
            />
            <div>
              <label
                htmlFor="seo-twitter_card"
                className="block text-[12.5px] font-medium text-slate-700 mb-1.5"
              >
                Kart tipi
              </label>
              <select
                id="seo-twitter_card"
                value={str(draft, "twitter_card")}
                onChange={(e) => setRaw("twitter_card", e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-[13.5px] focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                <option value="">
                  Varsayılan ({inspection?.twitterCard ?? "summary_large_image"})
                </option>
                {TWITTER_CARDS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          <Section title="Görsel ve alt metni">
            <ImageField
              label="Kart / sayfa görseli"
              value={str(draft, "image_url")}
              onChange={(v) => setRaw("image_url", v)}
              folder={uploadFolder}
              hint="Repodaki bir dosyayı kullanmak için yolu yapıştırın: /images/regions/belek-golf.jpg"
            />
            <TextField
              id="seo-image_alt"
              label="Görsel alt metni"
              value={str(draft, "image_alt")}
              onChange={(v) => setRaw("image_alt", v)}
              hint={
                inspection && inspection.images.filter((i) => i.alt === null).length > 0
                  ? `Sayfada alt metni olmayan ${inspection.images.filter((i) => i.alt === null).length} görsel var.`
                  : "Google Görseller bu metinle eşleştirir."
              }
            />
          </Section>

          <Section
            title="URL"
            description="URL değiştirmek 301 yönlendirme gerektirir; bu panel yönlendirme yönetmediği için adres salt okunurdur."
          >
            <EffectiveField
              label="Sayfa adresi"
              override=""
              onChange={() => {}}
              live={liveUrl}
              readOnly={{
                reason:
                  entry.kind === "region"
                    ? "Bölge URL'i değiştirilirse mevcut sıralama sıfırlanır. Değişiklik gerekiyorsa önce 301 yönlendirme kurulmalıdır."
                    : "URL değişiklikleri bu panelden yapılmaz; 301 yönlendirme kurulumu gerekir.",
              }}
            />
          </Section>
        </div>

        <div className="space-y-4 xl:sticky xl:top-20">
          <SerpPreview
            title={effTitle}
            description={effDesc}
            path={route}
            locale={locale}
            keywords={[get("focusKeyword"), ...parseKeywords(get("keywords"))].filter(Boolean)}
            imageUrl={effOgImage || null}
          />
          <SocialPreview
            title={get("ogTitle") || effTitle}
            description={get("ogDescription") || effDesc}
            imageUrl={effOgImage || null}
            path={route}
            locale={locale}
          />
          <TechnicalChecks
            findings={findings}
            loading={scanning}
            onRefresh={onScan}
            onFieldClick={focusField}
            fetchedAt={inspection?.fetchedAt}
          />
          <SeoScorePanel score={score} onFieldClick={focusField} />
          <RuntimeSummary inspection={inspection} loading={scanning} />
          <HreflangPanel inspection={inspection} locale={locale} />
          <SchemaPanel inspection={inspection} />
        </div>
      </div>

      {confirming && (
        <SaveDiffDialog
          changes={changes}
          saving={saving}
          onConfirm={commit}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

/**
 * A three-state switch for the tri-state boolean columns.
 *
 * "Varsayılan" is a real, distinct value and the default: it means the page's
 * own decision stands. Collapsing it into false would make every save assert
 * "definitely index this", overriding the deliberate noindex that region and
 * blog pages apply to locales they are not translated into.
 */
function TriToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  const options: [string, boolean | null][] = [
    ["Varsayılan", null],
    ["Kapalı", false],
    ["Açık", true],
  ];
  return (
    <div>
      <p className="text-[13px] font-medium text-slate-800">{label}</p>
      <p className="text-[11.5px] text-slate-500 mt-0.5 mb-2 leading-snug">{description}</p>
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit">
        {options.map(([text, v]) => {
          const on = value === v;
          const danger = v === true;
          return (
            <button
              key={text}
              type="button"
              onClick={() => {
                if (v === true && !confirm(`"${label}" açılıyor.\n\n${description}\n\nDevam edilsin mi?`)) {
                  return;
                }
                onChange(v);
              }}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer"
              style={{
                backgroundColor: on ? (danger ? "#dc2626" : "#fff") : "transparent",
                color: on ? (danger ? "#fff" : "#0f172a") : "#64748b",
                boxShadow: on && !danger ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New region
// ---------------------------------------------------------------------------

function NewRegionDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (row: Record<string, unknown>) => void;
}) {
  const [slug, setSlug] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bare = slug
    .toLowerCase()
    .replace(/-transfer$/, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // name_tr … name_ru are NOT NULL in the schema; Dutch was added later.
  const required: Loc[] = ["tr", "en", "de", "pl", "ru"];
  const missing = required.filter((l) => !(names[l] ?? "").trim());
  const canSave = bare.length > 1 && missing.length === 0 && !saving;

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "regions",
          action: "create",
          data: {
            slug: bare,
            name_tr: names.tr.trim(),
            name_en: names.en.trim(),
            name_de: names.de.trim(),
            name_pl: names.pl.trim(),
            name_ru: names.ru.trim(),
            name_nl: (names.nl ?? "").trim() || null,
            distance_km: distance ? parseFloat(distance) : null,
            duration_minutes: duration ? parseInt(duration, 10) : null,
            // Inactive on purpose: a region with no copy, no photo and no price
            // should not enter the sitemap. Activate it from Bölgeler once its
            // SEO is filled in.
            is_active: false,
            is_popular: false,
            sort_order: 999,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Bölge eklenemedi");
      onCreated(json.data as Record<string, unknown>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bölge eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  const input =
    "w-full px-3 py-2 rounded-lg border border-slate-300 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
          <h2 className="text-[15px] font-semibold text-slate-900">Yeni bölge</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg leading-none"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">
              URL adresi
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="belek"
              className={input}
            />
            <p className="mt-1.5 text-[11px] text-slate-500">
              Sayfa adresi:{" "}
              <span className="font-medium text-slate-700">
                torviantransfer.com/tr/{bare || "…"}-transfer
              </span>
              <br />
              Yayına girdikten sonra bu adresi değiştirmek sıralamayı sıfırlar.
            </p>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">
              Bölge adı — her dilde
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LOCALES.map((l) => (
                <input
                  key={l}
                  value={names[l] ?? ""}
                  onChange={(e) => setNames((n) => ({ ...n, [l]: e.target.value }))}
                  placeholder={`${l.toUpperCase()}${required.includes(l) ? " *" : ""}`}
                  className={input}
                />
              ))}
            </div>
            {missing.length > 0 && (
              <p className="mt-1.5 text-[11px] text-amber-700">
                Zorunlu diller eksik: {missing.map((l) => l.toUpperCase()).join(", ")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">
                Mesafe (km)
              </label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="35"
                className={input}
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-slate-700 mb-1.5">
                Süre (dakika)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="40"
                className={input}
              />
            </div>
          </div>

          <p className="text-[11.5px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
            Bölge <b>pasif</b> olarak oluşturulur — sitemap&apos;e ve site menüsüne girmez.
            Kaydettikten sonra SEO editörü açılır.
          </p>

          {error && (
            <p className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[12.5px] text-red-700">
              <AlertCircle size={14} /> {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 px-5 py-3.5 border-t border-slate-200 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            onClick={submit}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-[13px] font-semibold cursor-pointer"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? "Ekleniyor…" : "Ekle ve SEO'yu düzenle"}
          </button>
        </div>
      </div>
    </div>
  );
}
