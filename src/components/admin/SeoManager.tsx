"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  Search, Home, Rocket, FileText, MapPin, Save, Loader2, Check,
  ExternalLink, ChevronLeft, AlertCircle, Plus, X, Wand2, CopyX,
} from "lucide-react";
import {
  scoreSeo, TITLE_MIN, TITLE_IDEAL_MIN, TITLE_IDEAL_MAX, TITLE_MAX,
  DESC_MIN, DESC_IDEAL_MIN, DESC_IDEAL_MAX, DESC_MAX,
  parseKeywords, type SeoScore,
} from "@/lib/seoScore";
import SerpPreview from "./seo/SerpPreview";
import SocialPreview from "./seo/SocialPreview";
import SeoScorePanel, { ScoreBadge } from "./seo/SeoScorePanel";
import {
  LOCALES, type Loc, LocaleTabs, CountedField, TextField, KeywordField,
  ImageField, Section,
} from "./seo/fields";
import BulkFillDialog, { type BulkTarget } from "./seo/BulkFillDialog";
import {
  buildDuplicateIndex,
  duplicateChecks,
  duplicateCount,
  type DuplicateIndex,
} from "@/lib/seoDuplicates";

const SITE_URL = "https://torviantransfer.com";

/**
 * Two different tables are edited through one screen: `seo_pages` (homepage,
 * landing pages, static pages) and `regions`. They are unified here rather
 * than given two admin screens because the editor's question is "which of my
 * pages has bad SEO", and that question does not care which table a page
 * happens to live in.
 */
export interface SeoPageRow {
  id: string;
  page_key: string;
  page_type: "home" | "landing" | "static";
  route: string;
  label: string;
  image_url: string | null;
  og_image_url: string | null;
  image_alt: string | null;
  noindex: boolean | null;
  [key: string]: unknown;
}

export interface RegionRow {
  id: string;
  slug: string;
  is_active: boolean;
  image_url: string | null;
  og_image_url: string | null;
  image_alt: string | null;
  [key: string]: unknown;
}

type Kind = "page" | "region";

interface Entry {
  kind: Kind;
  /** DB table the save writes to. */
  table: "seo_pages" | "regions";
  id: string;
  key: string;
  label: string;
  /** 'home' | 'landing' | 'static' | 'region' */
  group: string;
  /** Path after the locale segment. */
  route: string;
  row: Record<string, unknown>;
}

const GROUP_META: Record<string, { label: string; icon: typeof Home; color: string }> = {
  home: { label: "Ana Sayfa", icon: Home, color: "#f97316" },
  landing: { label: "Landing Sayfaları", icon: Rocket, color: "#8b5cf6" },
  static: { label: "Statik Sayfalar", icon: FileText, color: "#0ea5e9" },
  region: { label: "Bölge Sayfaları", icon: MapPin, color: "#10b981" },
};

/** Legal/utility pages are scored leniently — see scoreSeo's "lite" mode. */
const LITE_KEYS = new Set(["privacy", "terms", "cookies", "kvkk", "cancellation"]);

function str(row: Record<string, unknown>, field: string): string {
  const v = row[field];
  return typeof v === "string" ? v : "";
}

export default function SeoManager({
  initialPages,
  initialRegions,
}: {
  initialPages: SeoPageRow[];
  initialRegions: RegionRow[];
}) {
  const [pages, setPages] = useState(initialPages);
  const [regions, setRegions] = useState(initialRegions);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [locale, setLocale] = useState<Loc>("tr");
  const [creating, setCreating] = useState(false);
  const [bulk, setBulk] = useState(false);

  const entries: Entry[] = useMemo(() => {
    const fromPages: Entry[] = pages.map((p) => ({
      kind: "page" as const,
      table: "seo_pages" as const,
      id: p.id,
      key: p.page_key,
      label: p.label,
      group: p.page_type,
      route: p.route,
      row: p as Record<string, unknown>,
    }));
    const fromRegions: Entry[] = regions.map((r) => ({
      kind: "region" as const,
      table: "regions" as const,
      id: r.id,
      key: r.slug,
      label: str(r, "name_tr") || str(r, "name_en") || r.slug,
      group: "region",
      // Region routes always carry the -transfer suffix; the DB slug may or
      // may not, and the live route is what the preview must show.
      route: r.slug.endsWith("-transfer") ? r.slug : `${r.slug}-transfer`,
      row: r as Record<string, unknown>,
    }));
    return [...fromPages, ...fromRegions];
  }, [pages, regions]);

  // Collisions are a property of the whole set, not of one page, so they are
  // computed once here and folded into each row's score below.
  const duplicates = useMemo(() => buildDuplicateIndex(entries, locale), [entries, locale]);

  /**
   * Scores are computed for the currently selected language only. Scoring all
   * six for every row on every keystroke is what would make this list crawl
   * once there are 40 regions.
   */
  const scores = useMemo(() => {
    const map = new Map<string, SeoScore>();
    for (const e of entries) map.set(e.id, scoreEntry(e, locale, duplicates));
    return map;
  }, [entries, locale, duplicates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (groupFilter !== "all" && e.group !== groupFilter) return false;
      if (!q) return true;
      return e.label.toLowerCase().includes(q) || e.key.toLowerCase().includes(q);
    });
  }, [entries, query, groupFilter]);

  const current = entries.find((e) => e.id === selected) ?? null;

  const applyRow = useCallback((entry: Entry, next: Record<string, unknown>) => {
    if (entry.table === "seo_pages") {
      setPages((prev) => prev.map((p) => (p.id === entry.id ? ({ ...p, ...next } as SeoPageRow) : p)));
    } else {
      setRegions((prev) => prev.map((r) => (r.id === entry.id ? ({ ...r, ...next } as RegionRow) : r)));
    }
  }, []);

  // ---- Overview stats ---------------------------------------------------
  const stats = useMemo(() => {
    const all = [...scores.values()];
    if (all.length === 0) return { avg: 0, poor: 0, dup: 0 };
    return {
      avg: Math.round(all.reduce((s, x) => s + x.percent, 0) / all.length),
      poor: all.filter((x) => x.percent < 65).length,
      dup: duplicateCount(duplicates),
    };
  }, [scores, duplicates]);

  if (current) {
    return (
      <SeoEditor
        entry={current}
        locale={locale}
        duplicates={duplicates}
        onLocale={setLocale}
        onBack={() => setSelected(null)}
        onSaved={(next) => applyRow(current, next)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Toplam sayfa" value={String(entries.length)} />
        <Stat label={`Ortalama skor (${locale.toUpperCase()})`} value={`%${stats.avg}`} />
        <Stat label="İyileştirme gereken" value={String(stats.poor)} tone={stats.poor > 0 ? "warn" : "ok"} />
        <Stat
          label="Yinelenen metin"
          value={String(stats.dup)}
          tone={stats.dup > 0 ? "warn" : "ok"}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sayfa veya bölge ara…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
          />
        </div>
        <button
          onClick={() => setBulk(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-semibold transition-colors cursor-pointer shrink-0"
        >
          <Wand2 size={15} /> Toplu doldur
        </button>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[13px] font-semibold transition-colors cursor-pointer shrink-0"
        >
          <Plus size={15} /> Yeni bölge
        </button>
        <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100">
          {["all", "home", "landing", "static", "region"].map((g) => {
            const on = groupFilter === g;
            const meta = GROUP_META[g];
            return (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor: on ? "#fff" : "transparent",
                  color: on ? "#0f172a" : "#64748b",
                  boxShadow: on ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {g === "all" ? "Tümü" : meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* The language picker is global on this screen: it decides which
          translation the whole list is scored against. */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[12px] text-slate-500">Puanlanan dil:</span>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className="px-3 py-1 rounded-lg text-[12px] font-semibold uppercase transition-all cursor-pointer"
              style={{
                backgroundColor: locale === l ? "#0f172a" : "transparent",
                color: locale === l ? "#fff" : "#64748b",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-[13px] text-slate-500">Sonuç bulunamadı.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((e) => {
              const score = scores.get(e.id)!;
              const meta = GROUP_META[e.group] ?? GROUP_META.static;
              const title = str(e.row, `meta_title_${locale}`);
              const desc = str(e.row, `meta_description_${locale}`);
              const missing: string[] = [];
              if (!title) missing.push("başlık");
              if (!desc) missing.push("açıklama");
              if (!e.row.og_image_url && !e.row.image_url) missing.push("görsel");

              return (
                <li key={e.id}>
                  <button
                    onClick={() => setSelected(e.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${meta.color}14` }}
                    >
                      <meta.icon size={15} style={{ color: meta.color }} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[13.5px] font-medium text-slate-900 truncate">
                          {e.label}
                        </span>
                        {e.kind === "region" && e.row.is_active === false && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                            pasif
                          </span>
                        )}
                        {e.row.noindex === true && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600">
                            noindex
                          </span>
                        )}
                        {duplicates.titles.has(e.id) && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700"
                            title="Meta başlığı başka bir sayfayla aynı"
                          >
                            <CopyX size={10} /> yinelenen
                          </span>
                        )}
                      </span>
                      <span className="block text-[11.5px] text-slate-500 truncate mt-0.5">
                        /{locale}
                        {e.route ? `/${e.route}` : ""}
                        {missing.length > 0 && (
                          <span className="text-amber-600"> · eksik: {missing.join(", ")}</span>
                        )}
                      </span>
                    </span>

                    <ScoreBadge percent={score.percent} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {bulk && (
        <BulkFillDialog
          // Only what the list is currently showing, so the filter above is
          // also the way an editor scopes a bulk run to, say, regions only.
          targets={filtered.map<BulkTarget>((e) => ({
            id: e.id,
            table: e.table,
            name: e.label,
            route: e.route,
            row: e.row,
          }))}
          locale={locale}
          onClose={() => setBulk(false)}
          onApplied={(updates) => {
            for (const u of updates) {
              const entry = entries.find((e) => e.id === u.id);
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
            // Drop straight into the SEO editor for the region just created,
            // which is the only reason to add one from this screen.
            setSelected(row.id);
          }}
        />
      )}
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

/** Shared by the list and the editor so a row's badge and its panel agree. */
function scoreEntry(entry: Entry, locale: Loc, duplicates?: DuplicateIndex): SeoScore {
  const row = entry.row;
  const base = scoreSeo(
    {
      title: str(row, `meta_title_${locale}`),
      description: str(row, `meta_description_${locale}`),
      focusKeyword: str(row, `focus_keyword_${locale}`),
      keywords: str(row, `keywords_${locale}`),
      slug: entry.route,
      content: str(row, `intro_${locale}`) || str(row, `description_${locale}`),
      h1: str(row, `h1_${locale}`) || str(row, `name_${locale}`),
      imageUrl: str(row, "image_url"),
      ogImageUrl: str(row, "og_image_url"),
      imageAlt: str(row, "image_alt"),
    },
    { mode: LITE_KEYS.has(entry.key) ? "lite" : "full" }
  );

  const extra = duplicates ? duplicateChecks(duplicates, entry.id) : [];
  if (extra.length === 0) return base;

  // Re-derive the percentage over the combined set rather than averaging two
  // scores, so a duplicate title costs the same whether or not the page had
  // other problems.
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
  onLocale,
  onBack,
  onSaved,
}: {
  entry: Entry;
  locale: Loc;
  duplicates: DuplicateIndex;
  onLocale: (l: Loc) => void;
  onBack: () => void;
  onSaved: (next: Record<string, unknown>) => void;
}) {
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...entry.row });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string, value: unknown) => {
    setDraft((d) => ({ ...d, [field]: value }));
    setSaved(false);
  };
  const get = (field: string) => str(draft, field);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(entry.row),
    [draft, entry.row]
  );

  const score = useMemo(
    () => scoreEntry({ ...entry, row: draft }, locale, duplicates),
    [entry, draft, locale, duplicates]
  );

  /** Per-language dots on the tab strip. */
  const localeStatus = useMemo(() => {
    const out: Record<string, "full" | "partial" | "empty"> = {};
    for (const l of LOCALES) {
      const t = str(draft, `meta_title_${l}`);
      const d = str(draft, `meta_description_${l}`);
      out[l] = t && d ? "full" : t || d ? "partial" : "empty";
    }
    return out;
  }, [draft]);

  // Ctrl/Cmd+S saves, and the browser asks before a reload or tab close
  // discards the draft. Both hang off `dirty`, so a clean editor is silent.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !saving) void save();
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

  const focusField = (field: string) => {
    const id = `seo-${field}`;
    const el = document.getElementById(id) ?? document.getElementById(`${id}_${locale}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLInputElement | null)?.focus();
  };

  // Leaving the editor with edits in the draft used to discard them without
  // a word — six languages of copy gone on one misclick.
  const leave = () => {
    if (dirty && !confirm("Kaydedilmemiş değişiklikler var. Yine de listeye dönülsün mü?")) {
      return;
    }
    onBack();
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    // Only send what changed. A full-row update would resend every column,
    // including ones this screen does not manage (pricing joins, coordinates),
    // and any stale value in the client copy would overwrite a newer one.
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(draft)) {
      if (JSON.stringify(v) !== JSON.stringify(entry.row[k])) payload[k] = v;
    }
    if (Object.keys(payload).length === 0) {
      setSaving(false);
      setSaved(true);
      return;
    }
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const isRegion = entry.kind === "region";
  const lite = LITE_KEYS.has(entry.key);
  const liveUrl = `${SITE_URL}/${locale}${entry.route ? `/${entry.route}` : ""}`;
  const socialImage = get("og_image_url") || get("image_url");

  return (
    <div className="space-y-4">
      {/* Sticky action bar — an editor moving between six languages should
          never have to scroll back up to find Save. */}
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
          onClick={save}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: saved && !dirty ? "#16a34a" : "#f97316" }}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved && !dirty ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Kaydediliyor…" : saved && !dirty ? "Kaydedildi" : "Kaydet"}
        </button>
      </div>

      {error && (
        <p className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-[12.5px] text-red-700">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      <LocaleTabs active={locale} onChange={onLocale} status={localeStatus} />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
        {/* ---- Form ---- */}
        <div className="space-y-4 min-w-0">
          <Section
            title="Arama sonucu"
            description="Google'da bu sayfanın başlığı ve açıklaması olarak çıkacak metinler."
          >
            <CountedField
              id={`seo-meta_title_${locale}`}
              label="Meta başlık"
              value={get(`meta_title_${locale}`)}
              onChange={(v) => set(`meta_title_${locale}`, v)}
              min={TITLE_MIN}
              ideal={[TITLE_IDEAL_MIN, TITLE_IDEAL_MAX]}
              max={TITLE_MAX}
              placeholder="Antalya Havalimanı Belek Transfer | TORVIAN"
              hint="Boş bırakılırsa sayfanın kodundaki mevcut başlık kullanılmaya devam eder."
            />
            <CountedField
              id={`seo-meta_description_${locale}`}
              label="Meta açıklama"
              multiline
              rows={3}
              value={get(`meta_description_${locale}`)}
              onChange={(v) => set(`meta_description_${locale}`, v)}
              min={DESC_MIN}
              ideal={[DESC_IDEAL_MIN, DESC_IDEAL_MAX]}
              max={DESC_MAX}
              placeholder="Antalya Havalimanı'ndan Belek'e sabit fiyatlı özel VIP transfer…"
              hint="Boş bırakılırsa mevcut açıklama korunur."
            />
          </Section>

          {!lite && (
            <Section
              title="Anahtar kelimeler"
              description="Sayfanın hangi aramalarda çıkmasını istediğiniz. Sitede meta etiketi olarak yayınlanmaz — puanlama bunlara göre yapılır."
            >
              <TextField
                id={`seo-focus_keyword_${locale}`}
                label="Odak anahtar kelime"
                value={get(`focus_keyword_${locale}`)}
                onChange={(v) => set(`focus_keyword_${locale}`, v)}
                placeholder="belek transfer"
                hint="Tek bir terim. Başlık, açıklama ve URL bu terime göre puanlanır."
              />
              <KeywordField
                id={`seo-keywords_${locale}`}
                label="Yan anahtar kelimeler"
                value={get(`keywords_${locale}`)}
                onChange={(v) => set(`keywords_${locale}`, v)}
                hint="Virgülle ayırın veya Enter'a basın."
              />
            </Section>
          )}

          {!isRegion && !lite && (
            <Section title="Sayfa metni" description="Sayfada görünen başlık ve giriş paragrafı.">
              <TextField
                id={`seo-h1_${locale}`}
                label="H1 başlığı"
                value={get(`h1_${locale}`)}
                onChange={(v) => set(`h1_${locale}`, v)}
                hint="Boş bırakılırsa sayfanın mevcut başlığı korunur."
              />
              <TextField
                id={`seo-intro_${locale}`}
                label="Giriş paragrafı"
                multiline
                rows={5}
                value={get(`intro_${locale}`)}
                onChange={(v) => set(`intro_${locale}`, v)}
              />
            </Section>
          )}

          {isRegion && (
            <Section title="Bölge metni" description="Bölge sayfasında görünen açıklama.">
              <TextField
                id={`seo-name_${locale}`}
                label="Bölge adı"
                value={get(`name_${locale}`)}
                onChange={(v) => set(`name_${locale}`, v)}
              />
              <TextField
                id={`seo-description_${locale}`}
                label="Açıklama"
                multiline
                rows={6}
                value={get(`description_${locale}`)}
                onChange={(v) => set(`description_${locale}`, v)}
                hint="Bu dilde boş bırakılan bölgeler o dilde indekslenmez — mevcut davranış korunur."
              />
            </Section>
          )}

          <Section
            title="Görseller"
            description="Kart görseli sayfada ve Google Görseller'de; paylaşım görseli WhatsApp, Facebook ve X'te çıkar."
          >
            <ImageField
              label="Kart / sayfa görseli"
              value={get("image_url")}
              onChange={(v) => set("image_url", v)}
              folder={isRegion ? "regions" : "pages"}
              hint="Repodaki bir dosyayı kullanmak için yolu yapıştırın: /images/regions/belek-golf.jpg"
            />
            <ImageField
              label="Paylaşım görseli (1200×630)"
              value={get("og_image_url")}
              onChange={(v) => set("og_image_url", v)}
              folder={isRegion ? "regions" : "pages"}
              aspect="1.91/1"
              hint="Boş bırakılırsa kart görseli kullanılır. WebP dosyaları Facebook'ta tutarsız görünür — JPG tercih edin."
            />
            <TextField
              id="seo-image_alt"
              label="Görsel alt metni"
              value={get("image_alt")}
              onChange={(v) => set("image_alt", v)}
              placeholder="Belek golf sahası ve TORVIAN transfer aracı"
              hint="Google Görseller bu metinle eşleştirir."
            />
          </Section>

          <Section
            title="İndeksleme"
            description="Bu ayarları değiştirmek sıralamayı doğrudan etkiler — emin olmadan dokunmayın."
          >
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.noindex === true}
                onChange={(e) => set("noindex", e.target.checked ? true : null)}
                className="mt-0.5 w-4 h-4 accent-red-600 cursor-pointer"
              />
              <span>
                <span className="block text-[13px] font-medium text-slate-800">
                  Google&apos;dan gizle (noindex)
                </span>
                <span className="block text-[11.5px] text-slate-500 mt-0.5">
                  İşaretlenirse bu sayfa arama sonuçlarından çıkarılır. Şu anda sıralaması olan bir
                  sayfada bunu açmak o trafiği kaybettirir.
                </span>
              </span>
            </label>
          </Section>
        </div>

        {/* ---- Previews + score ---- */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <SerpPreview
            title={get(`meta_title_${locale}`)}
            description={get(`meta_description_${locale}`)}
            path={entry.route}
            locale={locale}
            keywords={[
              get(`focus_keyword_${locale}`),
              ...parseKeywords(get(`keywords_${locale}`)),
            ].filter(Boolean)}
            imageUrl={socialImage || null}
          />
          <SocialPreview
            title={get(`meta_title_${locale}`)}
            description={get(`meta_description_${locale}`)}
            imageUrl={socialImage || null}
            path={entry.route}
            locale={locale}
          />
          <SeoScorePanel
            score={score}
            onFieldClick={(field) => {
              // Locale-scoped fields carry a suffix; shared ones do not.
              const scoped = ["meta_title", "meta_description", "focus_keyword", "keywords", "h1", "content"];
              focusField(scoped.includes(field) ? `${field}_${locale}` : field);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New region
// ---------------------------------------------------------------------------

/**
 * Creating a region needs only the columns the database insists on plus the
 * two the route depends on. Everything SEO — meta copy, keywords, images —
 * is deliberately left to the editor this dialog hands off to, so the person
 * filling those fields in can see the Google preview and the score while they
 * type rather than guessing in a create form.
 */
function NewRegionDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (row: RegionRow) => void;
}) {
  const [slug, setSlug] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The live route is always "<bare slug>-transfer"; the region page redirects
  // anything else. Storing the bare slug keeps it consistent with every row
  // already in the table.
  const bare = slug
    .toLowerCase()
    .replace(/-transfer$/, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // name_tr … name_ru are NOT NULL in the schema, so the form cannot submit
  // without them; Dutch was added later and is nullable.
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
            // Created inactive on purpose: a region with no meta copy, no
            // photo and no price should not go straight into the sitemap.
            // Activate it from Bölgeler once its SEO is filled in.
            is_active: false,
            is_popular: false,
            sort_order: 999,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Bölge eklenemedi");
      onCreated(json.data as RegionRow);
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
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
            aria-label="Kapat"
          >
            <X size={18} />
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
            Kaydettikten sonra SEO editörü açılır; meta metinleri, anahtar kelimeleri ve
            görselleri doldurup Bölgeler sayfasından aktifleştirin.
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
