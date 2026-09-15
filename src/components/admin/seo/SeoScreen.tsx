"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Plus, Wand2 } from "lucide-react";
import { Button, PageHeader } from "@/components/admin/ui";
import BulkFillDialog, { type BulkTarget } from "./BulkFillDialog";
import NewRegionDialog from "./NewRegionDialog";
import SeoList from "./SeoList";
import SeoPanel from "./SeoPanel";
import SeoToolbar from "./SeoToolbar";
import { LOCALES, type Loc } from "./fields";
import {
  blogEntry,
  landingEntry,
  pageEntry,
  regionEntry,
  type Entry,
} from "./entries";
import { pathOf, useInspections } from "./useInspections";
import { useSeoTable, type IssueFilter } from "./useSeoTable";

export interface SeoScreenQuery {
  locale?: string;
  group?: string;
  issue?: string;
  q?: string;
  open?: string;
}

const ISSUES: IssueFilter[] = ["all", "problems", "missing", "noindex"];

function asLocale(v: string | undefined): Loc {
  return LOCALES.includes(v as Loc) ? (v as Loc) : "tr";
}

function asIssue(v: string | undefined): IssueFilter {
  return ISSUES.includes(v as IssueFilter) ? (v as IssueFilter) : "all";
}

/** SEO Yönetimi: docs/admin-tasarim.md, bölüm 5.16. */
export default function SeoScreen({
  initialPages,
  initialRegions,
  initialPosts,
  initialLandings,
  initialQuery,
}: {
  initialPages: Record<string, unknown>[];
  initialRegions: Record<string, unknown>[];
  initialPosts: Record<string, unknown>[];
  /**
   * Admin-created landing pages. Optional so the prop can be added without
   * every existing render site having to pass it on the same commit.
   */
  initialLandings?: Record<string, unknown>[];
  initialQuery?: SeoScreenQuery;
}) {
  const pathname = usePathname();

  const [pages, setPages] = useState(initialPages);
  const [regions, setRegions] = useState(initialRegions);
  const [posts, setPosts] = useState(initialPosts);
  const [landings, setLandings] = useState(initialLandings ?? []);

  const [selected, setSelected] = useState<string | null>(initialQuery?.open ?? null);
  const [query, setQuery] = useState(initialQuery?.q ?? "");
  const [groupFilter, setGroupFilter] = useState(initialQuery?.group ?? "all");
  const [issueFilter, setIssueFilter] = useState<IssueFilter>(asIssue(initialQuery?.issue));
  const [locale, setLocale] = useState<Loc>(asLocale(initialQuery?.locale));
  const [creating, setCreating] = useState(false);
  const [bulk, setBulk] = useState(false);

  const { inspections, scanning, source, target, scan, switchTarget } = useInspections();

  const entries: Entry[] = useMemo(
    () => [
      ...pages.map(pageEntry),
      ...landings.map(landingEntry),
      ...regions.map(regionEntry),
      ...posts.map(blogEntry),
    ],
    [pages, landings, regions, posts]
  );

  const table = useSeoTable({ entries, locale, inspections, query, groupFilter, issueFilter });

  const current = entries.find((e) => e.id === selected) ?? null;

  // The address carries the filters and the open page, so a link to a problem
  // opens the same screen for whoever it is sent to.
  useEffect(() => {
    const p = new URLSearchParams();
    if (locale !== "tr") p.set("locale", locale);
    if (groupFilter !== "all") p.set("group", groupFilter);
    if (issueFilter !== "all") p.set("issue", issueFilter);
    if (query.trim()) p.set("q", query.trim());
    if (selected) p.set("open", selected);
    const qs = p.toString();
    window.history.replaceState(window.history.state, "", qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, locale, groupFilter, issueFilter, query, selected]);

  const applyRow = useCallback((entry: Entry, next: Record<string, unknown>) => {
    const update = (rows: Record<string, unknown>[]) =>
      rows.map((r) => (String(r.id) === entry.id ? { ...r, ...next } : r));
    if (entry.table === "seo_pages") setPages(update);
    else if (entry.table === "landing_pages") setLandings(update);
    else if (entry.table === "regions") setRegions(update);
    else setPosts(update);
  }, []);

  const open = useCallback(
    (entry: Entry) => {
      setSelected(entry.id);
      if (!inspections[pathOf(entry, locale)]) scan([{ entry, loc: locale }]);
    },
    [inspections, locale, scan]
  );

  return (
    <>
      <PageHeader
        title="SEO Yönetimi"
        description="Ana sayfa, landing ve statik sayfalar, panelden oluşturulan landing sayfaları, bölgeler ve blog yazıları. Panel her alanın yayındaki gerçek değerini sayfanın HTML çıktısından okur — boş görünen bir alan “değer yok” anlamına gelmez."
        actions={
          <>
            <Button icon={Wand2} compact onClick={() => setBulk(true)}>
              Toplu doldur
            </Button>
            <Button variant="primary" icon={Plus} compact onClick={() => setCreating(true)}>
              Yeni bölge
            </Button>
          </>
        }
      />

      <SeoToolbar
        table={table}
        locale={locale}
        onLocale={setLocale}
        query={query}
        onQuery={setQuery}
        groupFilter={groupFilter}
        onGroupFilter={setGroupFilter}
        issueFilter={issueFilter}
        onIssueFilter={setIssueFilter}
        target={target}
        onTarget={switchTarget}
        source={source}
        scanningCount={scanning.size}
        filteredCount={table.filtered.length}
        onScanAll={() => scan(table.filtered.map((entry) => ({ entry, loc: locale })))}
      />

      <SeoList
        entries={table.filtered}
        locale={locale}
        scores={table.scores}
        audits={table.audits}
        inspections={inspections}
        scanning={scanning}
        duplicateIds={new Set(table.duplicates.titles.keys())}
        activeId={selected}
        onOpen={open}
      />

      <SeoPanel
        entry={current}
        locale={locale}
        duplicates={table.duplicates}
        inspection={current ? (inspections[pathOf(current, locale)] ?? null) : null}
        scanning={current ? scanning.has(pathOf(current, locale)) : false}
        onScan={() => current && scan([{ entry: current, loc: locale }])}
        onLocale={setLocale}
        onClose={() => setSelected(null)}
        onSaved={applyRow}
      />

      {bulk && (
        <BulkFillDialog
          targets={table.filtered.map<BulkTarget>((e) => ({
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
    </>
  );
}
