"use client";

import {
  AlertOctagon, AlertTriangle, Info, CheckCircle2, RefreshCw, Loader2,
  ExternalLink, Languages, Braces, FileCode2,
} from "lucide-react";
import type { AuditFinding, AuditLevel } from "@/lib/seoAudit";
import type { PageInspection } from "@/lib/seoInspect";
import { locales } from "@/i18n/config";
import { ShieldAlert } from "lucide-react";

/**
 * The read-only half of the SEO editor: what the page actually serves.
 *
 * Everything here is derived from a fetch of the rendered page, not from the
 * database, so it stays true even for the fields the admin cannot override —
 * hreflang and structured data, both of which are generated in code.
 */

const LEVEL_ICON: Record<AuditLevel, typeof Info> = {
  error: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

const LEVEL_COLOR: Record<AuditLevel, string> = {
  error: "#dc2626",
  warning: "#d97706",
  info: "#0284c7",
};

const LEVEL_RANK: Record<AuditLevel, number> = { error: 0, warning: 1, info: 2 };

export function TechnicalChecks({
  findings,
  loading,
  onRefresh,
  onFieldClick,
  fetchedAt,
}: {
  findings: AuditFinding[];
  loading: boolean;
  onRefresh: () => void;
  onFieldClick?: (field: string) => void;
  fetchedAt?: string;
}) {
  const sorted = [...findings].sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
  const errors = findings.filter((x) => x.level === "error").length;
  const warnings = findings.filter((x) => x.level === "warning").length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-900">Teknik SEO kontrolleri</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {loading
              ? "Sayfa okunuyor…"
              : errors === 0 && warnings === 0
                ? "Sorun bulunamadı"
                : `${errors} hata · ${warnings} uyarı`}
            {fetchedAt && !loading && ` · ${new Date(fetchedAt).toLocaleTimeString("tr-TR")}`}
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 text-[12px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Yeniden tara
        </button>
      </div>

      {loading && findings.length === 0 ? (
        <p className="px-4 py-6 text-center text-[12.5px] text-slate-400">
          Sayfanın HTML çıktısı okunuyor…
        </p>
      ) : sorted.length === 0 ? (
        <p className="flex items-center gap-2 px-4 py-6 text-[12.5px] text-green-700">
          <CheckCircle2 size={15} /> Teknik bir sorun tespit edilmedi.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
          {sorted.map((finding) => {
            const Icon = LEVEL_ICON[finding.level];
            const clickable = Boolean(finding.field && onFieldClick);
            return (
              <li key={finding.id}>
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => finding.field && onFieldClick?.(finding.field)}
                  className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left enabled:hover:bg-slate-50 enabled:cursor-pointer"
                >
                  <Icon size={15} style={{ color: LEVEL_COLOR[finding.level] }} className="mt-0.5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-medium text-slate-800">
                      {finding.label}
                    </span>
                    <span className="block text-[11.5px] text-slate-500 leading-snug mt-0.5">
                      {finding.detail}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function HreflangPanel({
  inspection,
  locale,
}: {
  inspection: PageInspection | null;
  locale: string;
}) {
  if (inspection?.blocked) return <Unreadable label="Hreflang" reason={inspection.blocked.message} />;
  const map = new Map((inspection?.alternates ?? []).map((a) => [a.hreflang.toLowerCase(), a.href]));
  const xDefault = map.get("x-default");

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
          <Languages size={14} /> Hreflang
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Otomatik üretiliyor — panelden düzenlenmez. Yanlış bir hreflang tüm dil kümesini
          Google&apos;a geçersiz kılar, bu yüzden elle override edilmiyor.
        </p>
      </div>
      <ul className="divide-y divide-slate-100">
        {locales.map((l) => {
          const href = map.get(l);
          const isSelf = l === locale;
          return (
            <li key={l} className="flex items-center gap-2 px-4 py-2">
              <span
                className="w-8 shrink-0 text-[11px] font-bold uppercase"
                style={{ color: isSelf ? "#0f172a" : "#64748b" }}
              >
                {l}
              </span>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 text-[11.5px] text-slate-600 hover:text-orange-600 truncate"
                >
                  {href.replace("https://torviantransfer.com", "")}
                </a>
              ) : (
                <span className="flex-1 text-[11.5px] text-slate-400">— bildirilmemiş</span>
              )}
              {isSelf && (
                <span className="shrink-0 text-[10px] font-semibold text-slate-500">bu sayfa</span>
              )}
            </li>
          );
        })}
        <li className="flex items-center gap-2 px-4 py-2 bg-slate-50">
          <span className="w-8 shrink-0 text-[10px] font-bold uppercase text-slate-500">x-d</span>
          <span className="min-w-0 flex-1 text-[11.5px] text-slate-600 truncate">
            {xDefault?.replace("https://torviantransfer.com", "") ?? "— yok"}
          </span>
        </li>
      </ul>
    </div>
  );
}

export function SchemaPanel({ inspection }: { inspection: PageInspection | null }) {
  if (inspection?.blocked)
    return <Unreadable label="Structured data" reason={inspection.blocked.message} />;
  const schemas = inspection?.schemas ?? [];

  // Counted across blocks so a type emitted twice is visible as such.
  const counts = new Map<string, number>();
  for (const s of schemas) for (const t of s.types) counts.set(t, (counts.get(t) ?? 0) + 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
          <Braces size={14} /> Structured data
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {schemas.length} JSON-LD bloğu — sayfa kodundan üretiliyor.
        </p>
      </div>

      {schemas.length === 0 ? (
        <p className="px-4 py-5 text-[12.5px] text-slate-400">Bu sayfada JSON-LD yok.</p>
      ) : (
        <>
          <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-slate-100">
            {[...counts.entries()]
              .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
              .map(([type, count]) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                  style={{
                    backgroundColor: count > 1 ? "#fffbeb" : "#f1f5f9",
                    color: count > 1 ? "#b45309" : "#475569",
                  }}
                  title={count > 1 ? `${count} kez basılıyor` : undefined}
                >
                  {type}
                  {count > 1 && <span className="font-bold">×{count}</span>}
                </span>
              ))}
          </div>

          <ul className="divide-y divide-slate-100">
            {schemas.map((s, i) => (
              <li key={i} className="flex items-start gap-2 px-4 py-2">
                <FileCode2
                  size={13}
                  className="mt-0.5 shrink-0"
                  style={{ color: s.valid ? "#64748b" : "#dc2626" }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-medium text-slate-700">
                    {s.types.length ? s.types.join(", ") : "tip yok"}
                  </span>
                  {!s.valid && (
                    <span className="block text-[11px] text-red-600 mt-0.5">
                      Geçersiz JSON: {s.error}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[10.5px] text-slate-400 tabular-nums">
                  {(s.size / 1024).toFixed(1)} KB
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** The raw head values, for when someone needs to see exactly what shipped. */
export function RuntimeSummary({
  inspection,
  loading,
}: {
  inspection: PageInspection | null;
  loading: boolean;
}) {
  if (loading && !inspection) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-[12.5px] text-slate-400">
        Sayfanın canlı SEO değerleri okunuyor…
      </div>
    );
  }
  if (!inspection) return null;

  // A blocked read is rendered as a refusal, never as values. The
  // intercepting page's own title and canonical are already discarded in
  // seoInspect; this is the visible half of the same rule.
  if (inspection.blocked) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-amber-900">
          <ShieldAlert size={14} /> {inspection.blocked.message}
        </p>
        <p className="text-[11.5px] text-amber-800 mt-1 leading-snug">
          {inspection.blocked.detail}
        </p>
        <p className="text-[11.5px] text-slate-600 mt-2 leading-snug">
          Panel bu sayfanın gerçek SEO değerlerini okuyamadı, bu yüzden hiçbir değer
          gösterilmiyor. Okuma kaynağı <code className="font-mono">SEO_INSPECT_BASE_URL</code>{" "}
          ile ayarlanır; varsayılan public production adresidir.
        </p>
      </div>
    );
  }

  if (inspection.error || inspection.status >= 400) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-[12.5px] font-medium text-red-800">Sayfa okunamadı</p>
        <p className="text-[11.5px] text-red-700 mt-0.5">
          {inspection.error ?? `HTTP ${inspection.status}`} — {inspection.url}
        </p>
      </div>
    );
  }

  const rows: [string, string | null][] = [
    ["title", inspection.title],
    ["meta description", inspection.description],
    ["canonical", inspection.canonical],
    ["robots", inspection.robots],
    ["googlebot", inspection.googlebot],
    ["html lang", inspection.htmlLang],
    ["H1", inspection.h1s.join(" | ") || null],
    ["og:title", inspection.ogTitle],
    ["og:description", inspection.ogDescription],
    ["og:image", inspection.ogImage],
    ["og:locale", inspection.ogLocale],
    ["twitter:card", inspection.twitterCard],
    ["twitter:image", inspection.twitterImage],
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-900">Yayındaki HTML değerleri</p>
          {inspection.origin && (
            <p className="text-[10.5px] text-slate-500 mt-0.5 truncate">
              kaynak: {inspection.origin.replace(/^https?:\/\//, "")}
            </p>
          )}
        </div>
        <a
          href={inspection.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-orange-600"
        >
          Sayfayı aç <ExternalLink size={10} />
        </a>
      </div>
      <dl className="divide-y divide-slate-100">
        {rows.map(([term, value]) => (
          <div key={term} className="grid grid-cols-[110px_1fr] gap-2 px-4 py-1.5">
            <dt className="text-[11px] text-slate-500 font-mono">{term}</dt>
            <dd
              className={`text-[11.5px] break-words ${value ? "text-slate-800" : "text-slate-400"}`}
            >
              {value ?? "—"}
            </dd>
          </div>
        ))}
        <div className="grid grid-cols-[110px_1fr] gap-2 px-4 py-1.5">
          <dt className="text-[11px] text-slate-500 font-mono">içerik</dt>
          <dd className="text-[11.5px] text-slate-800">
            {inspection.wordCount} kelime · {inspection.h2Count} H2 ·{" "}
            {inspection.images.length} görsel
            {inspection.images.filter((i) => i.alt === null).length > 0 &&
              ` (${inspection.images.filter((i) => i.alt === null).length} alt&apos;sız)`}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Stands in for a panel whose data could not be read.
 *
 * Rendering the empty state instead would say "this page has no hreflang",
 * which is a claim about the page rather than about the reading — and the
 * whole point of the blocked path is never to make claims about a page that
 * was not actually fetched.
 */
function Unreadable({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[13px] font-semibold text-slate-900">{label}</p>
      </div>
      <p className="flex items-start gap-2 px-4 py-3 text-[12px] text-amber-800">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        {reason}
      </p>
    </div>
  );
}
