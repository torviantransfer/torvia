"use client";

import { useMemo } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CopyX,
  EyeOff,
  Link2,
  Search,
  ShieldAlert,
} from "lucide-react";
import type { SeoScore } from "@/lib/seoScore";
import { auditSummary, type AuditFinding } from "@/lib/seoAudit";
import type { PageInspection } from "@/lib/seoInspect";
import { locales } from "@/i18n/config";
import { Chip, DataGrid, EmptyState, type GridColumn } from "@/components/admin/ui";
import { ScoreBadge } from "./SeoScorePanel";
import { fieldSource } from "./EffectiveField";
import { field, str, type Entry } from "./entries";
import type { Loc } from "./fields";
import { GROUP_META } from "./pageTypes";
import { pathOf } from "./useInspections";

function Dash() {
  return <span className="text-[11.5px] text-adm-faint">—</span>;
}

/** Whether the page's canonical points at itself, elsewhere, or is missing. */
function canonicalState(inspection?: PageInspection): "ok" | "other" | "missing" | "unknown" {
  if (!inspection || inspection.blocked) return "unknown";
  if (!inspection.canonical) return "missing";
  return inspection.canonical.replace(/\/+$/, "") === inspection.url.replace(/\/+$/, "")
    ? "ok"
    : "other";
}

/** SEO Yönetimi listesi: docs/admin-tasarim.md, bölüm 5.16. */
export default function SeoList({
  entries,
  locale,
  scores,
  audits,
  inspections,
  scanning,
  duplicateIds,
  activeId,
  onOpen,
}: {
  entries: Entry[];
  locale: Loc;
  scores: Map<string, SeoScore>;
  audits: Map<string, AuditFinding[]>;
  inspections: Record<string, PageInspection>;
  scanning: ReadonlySet<string>;
  duplicateIds: ReadonlySet<string>;
  activeId: string | null;
  onOpen: (entry: Entry) => void;
}) {
  const columns: GridColumn<Entry>[] = useMemo(
    () => [
      {
        key: "page",
        header: "Sayfa",
        width: "minmax(180px,1.4fr)",
        area: "body",
        cell: (e) => {
          const meta = GROUP_META[e.pageType] ?? GROUP_META.static;
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-adm-sm"
                style={{ backgroundColor: `${meta.color}14` }}
              >
                <meta.icon size={14} style={{ color: meta.color }} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold">{e.label}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-[11px] text-adm-muted">{meta.label}</span>
                  {!e.isPublic && (
                    <Chip tone="neutral" plain>
                      yayında değil
                    </Chip>
                  )}
                  {duplicateIds.has(e.id) && (
                    <Chip tone="amber" plain title="Meta başlığı başka bir sayfayla aynı">
                      <CopyX size={9} aria-hidden="true" /> yinelenen
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "url",
        header: "URL",
        width: "minmax(130px,1fr)",
        area: "top-start",
        cell: (e) => (
          <span className="truncate font-mono text-[11.5px] text-adm-ink-2">
            {pathOf(e, locale)}
          </span>
        ),
      },
      {
        key: "title",
        header: "Title",
        width: "minmax(150px,1.4fr)",
        area: "body",
        cell: (e) => {
          const path = pathOf(e, locale);
          const inspection = inspections[path];
          const override = str(e.row, field(e.fieldMap, "metaTitle", locale));
          const effective = override || inspection?.title || "";
          if (scanning.has(path)) {
            return <span className="text-[11.5px] text-adm-muted">okunuyor…</span>;
          }
          if (effective) {
            const from = fieldSource(override, inspection?.title);
            return (
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: from === "admin" ? "#7c3aed" : "#0ea5e9" }}
                  title={from === "admin" ? "Admin override" : "Sayfa kodu / varsayılan"}
                />
                <span className="truncate text-[12px] text-adm-ink-2">{effective}</span>
              </span>
            );
          }
          if (inspection?.blocked) {
            return (
              <span className="inline-flex items-center gap-1 text-[11.5px] text-adm-amber">
                <ShieldAlert size={11} aria-hidden="true" /> okunamadı
              </span>
            );
          }
          return inspection ? (
            <span className="text-[11.5px] text-adm-rose">yok</span>
          ) : (
            <span className="text-[11.5px] text-adm-muted">taranmadı</span>
          );
        },
      },
      {
        key: "index",
        header: "Index",
        width: "82px",
        cell: (e) => {
          const inspection = inspections[pathOf(e, locale)];
          if (!inspection || inspection.blocked) return <Dash />;
          const robots = `${inspection.robots ?? ""} ${inspection.googlebot ?? ""}`;
          const off = e.row.noindex === true || /noindex/i.test(robots);
          if (!off) {
            return (
              <Chip tone="green" plain>
                index
              </Chip>
            );
          }
          return (
            <Chip tone={e.shouldIndex ? "rose" : "neutral"} plain>
              <EyeOff size={10} aria-hidden="true" /> noindex
            </Chip>
          );
        },
      },
      {
        key: "canonical",
        header: "Canonical",
        width: "92px",
        cell: (e) => {
          const inspection = inspections[pathOf(e, locale)];
          const state = canonicalState(inspection);
          if (state === "unknown") return <Dash />;
          if (state === "ok") {
            return (
              <Chip tone="green" plain>
                <Link2 size={10} aria-hidden="true" /> self
              </Chip>
            );
          }
          if (state === "other") {
            return (
              <Chip tone="amber" plain title={inspection?.canonical ?? undefined}>
                <Link2 size={10} aria-hidden="true" /> başka
              </Chip>
            );
          }
          return (
            <Chip tone="rose" plain>
              yok
            </Chip>
          );
        },
      },
      {
        key: "hreflang",
        header: "Hreflang",
        width: "84px",
        cell: (e) => {
          const inspection = inspections[pathOf(e, locale)];
          if (!inspection || inspection.blocked) return <Dash />;
          const count = inspection.alternates.filter((a) => a.hreflang !== "x-default").length;
          if (count === 0) {
            return (
              <Chip tone="amber" plain>
                yok
              </Chip>
            );
          }
          return (
            <span className="tabular-nums text-[12px] text-adm-ink-2">
              {count}/{locales.length}
            </span>
          );
        },
      },
      {
        key: "health",
        header: "Sağlık",
        width: "84px",
        area: "foot-start",
        cell: (e) => {
          const findings = audits.get(e.id);
          if (!findings) return <Dash />;
          const health = auditSummary(findings);
          if (health.level === "ok") {
            return (
              <Chip tone="green" plain>
                temiz
              </Chip>
            );
          }
          if (health.level === "error") {
            return (
              <Chip tone="rose" plain>
                <AlertOctagon size={10} aria-hidden="true" /> {health.errors}
              </Chip>
            );
          }
          return (
            <Chip tone="amber" plain>
              <AlertTriangle size={10} aria-hidden="true" /> {health.warnings}
            </Chip>
          );
        },
      },
      {
        key: "score",
        header: "Skor",
        width: "70px",
        area: "top-end",
        cell: (e) => <ScoreBadge percent={scores.get(e.id)?.percent ?? 0} />,
      },
      {
        key: "updated",
        header: "Güncelleme",
        width: "96px",
        area: "foot-end",
        wideOnly: true,
        cell: (e) => (
          <span className="whitespace-nowrap text-[11.5px] text-adm-muted">
            {e.updatedAt ? new Date(e.updatedAt).toLocaleDateString("tr-TR") : "—"}
          </span>
        ),
      },
    ],
    [locale, inspections, scanning, audits, scores, duplicateIds]
  );

  return (
    <DataGrid
      label="SEO sayfaları"
      columns={columns}
      rows={entries}
      rowKey={(e) => e.id}
      activeKey={activeId}
      onRowClick={onOpen}
      empty={
        <EmptyState
          compact
          icon={Search}
          title="Bu filtreye uyan sayfa yok"
          description="Aramayı veya filtreleri değiştirin."
        />
      }
    />
  );
}
