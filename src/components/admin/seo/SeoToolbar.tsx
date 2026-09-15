"use client";

import { Globe, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import {
  Button,
  Chip,
  SearchInput,
  Segmented,
  StatStrip,
  Toolbar,
  type SegmentOption,
} from "@/components/admin/ui";
import { LOCALES, type Loc } from "./fields";
import { GROUP_OPTIONS, ISSUE_OPTIONS } from "./pageTypes";
import type { IssueFilter, SeoTable } from "./useSeoTable";
import type { InspectionSource, ScanTarget } from "./useInspections";

const TARGETS: SegmentOption<ScanTarget>[] = [
  { value: "public", label: "Public site" },
  { value: "deployment", label: "Bu deployment" },
];

/**
 * The figures, the scan bar and the filters above the list.
 *
 * Scanning is the only way this panel knows what the site actually serves, so
 * its state is stated rather than left implicit — including which deployment
 * was read.
 */
export default function SeoToolbar({
  table,
  locale,
  onLocale,
  query,
  onQuery,
  groupFilter,
  onGroupFilter,
  issueFilter,
  onIssueFilter,
  target,
  onTarget,
  source,
  scanningCount,
  filteredCount,
  onScanAll,
}: {
  table: SeoTable;
  locale: Loc;
  onLocale: (l: Loc) => void;
  query: string;
  onQuery: (v: string) => void;
  groupFilter: string;
  onGroupFilter: (v: string) => void;
  issueFilter: IssueFilter;
  onIssueFilter: (v: IssueFilter) => void;
  target: ScanTarget;
  onTarget: (t: ScanTarget) => void;
  source: InspectionSource | null;
  scanningCount: number;
  filteredCount: number;
  onScanAll: () => void;
}) {
  const { stats, unscanned, blocked } = table;
  const busy = scanningCount > 0;

  return (
    <>
      <StatStrip
        items={[
          { label: "Sayfa", value: String(stats.total) },
          { label: `Ortalama skor (${locale.toUpperCase()})`, value: `%${stats.avg}` },
          { label: "Taranan", value: `${stats.scanned}/${stats.total}` },
          { label: "Teknik hata", value: String(stats.errors), warn: stats.errors > 0 },
          { label: "Yinelenen metin", value: String(stats.dup), warn: stats.dup > 0 },
        ]}
      />

      {blocked > 0 && (
        <div className="mb-4 flex items-start gap-2.5 rounded-adm border border-adm-amber-line bg-adm-amber-soft px-4 py-3">
          <ShieldAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-adm-amber" />
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-adm-amber">
              {blocked} sayfa okunamadı — koruma sayfasına yönlendirildi
            </p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-adm-amber">
              Bu sayfalar için hiçbir SEO değeri gösterilmiyor. Okuma kaynağı{" "}
              <code className="font-mono">SEO_INSPECT_BASE_URL</code> ile ayarlanır; varsayılan
              public production adresidir. &quot;Bu deployment&quot; seçiliyken Vercel Deployment
              Protection açıksa bu beklenen bir sonuçtur.
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-adm border border-adm-line bg-adm-surface px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium text-adm-ink">Yayındaki değerleri oku</p>
          <p className="mt-0.5 text-[11.5px] text-adm-muted">
            Panel, sayfaların gerçek HTML çıktısını okuyarak mevcut title, canonical, robots,
            hreflang ve schema değerlerini gösterir.{" "}
            {unscanned > 0 ? `${unscanned} sayfa henüz taranmadı.` : "Listedeki tüm sayfalar tarandı."}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px]">
            <Globe size={11} aria-hidden="true" className="text-adm-muted" />
            <span className="text-adm-muted">Kaynak:</span>
            <span className="font-medium text-adm-ink">
              {source ? source.origin.replace(/^https?:\/\//, "") : "henüz okunmadı"}
            </span>
            {source && (
              <Chip tone={source.target === "public" ? "blue" : "amber"} plain>
                {source.target === "public" ? "public production" : "bu deployment"}
              </Chip>
            )}
          </p>
        </div>
        <Segmented
          options={TARGETS}
          value={target}
          onChange={onTarget}
          label="Okuma kaynağı"
        />
        <Button
          variant="primary"
          compact
          icon={busy ? Loader2 : RefreshCw}
          disabled={busy}
          onClick={onScanAll}
        >
          {busy ? `Taranıyor (${scanningCount})…` : `${filteredCount} sayfayı tara`}
        </Button>
      </div>

      <Toolbar
        end={
          <>
            <span className="text-[12px] text-adm-muted">Dil:</span>
            <Segmented
              options={LOCALES.map((l) => ({ value: l, label: l.toUpperCase() }))}
              value={locale}
              onChange={onLocale}
              label="Dil"
            />
          </>
        }
      >
        <SearchInput
          value={query}
          onChange={onQuery}
          placeholder="Sayfa adı, URL, slug veya başlık ara…"
        />
        <Segmented
          options={GROUP_OPTIONS}
          value={groupFilter}
          onChange={onGroupFilter}
          label="Sayfa türü"
        />
        <Segmented
          options={ISSUE_OPTIONS}
          value={issueFilter}
          onChange={(v) => onIssueFilter(v as IssueFilter)}
          label="Sorun filtresi"
        />
      </Toolbar>
    </>
  );
}
