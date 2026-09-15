"use client";

import { useMemo } from "react";
import type { SeoScore } from "@/lib/seoScore";
import { auditSummary, type AuditFinding } from "@/lib/seoAudit";
import type { PageInspection } from "@/lib/seoInspect";
import {
  buildDuplicateIndex,
  duplicateCount,
  type DuplicateIndex,
} from "@/lib/seoDuplicates";
import { field, str, type Entry } from "./entries";
import type { Loc } from "./fields";
import { auditFor, scoreEntry } from "./scoring";
import { pathOf } from "./useInspections";

export type IssueFilter = "all" | "problems" | "missing" | "noindex";

export interface SeoTable {
  duplicates: DuplicateIndex;
  scores: Map<string, SeoScore>;
  audits: Map<string, AuditFinding[]>;
  filtered: Entry[];
  stats: { total: number; avg: number; errors: number; dup: number; scanned: number };
  /** Pages in the current filter whose live values have not been read yet. */
  unscanned: number;
  /** Readings that came back as a protection page rather than our own HTML. */
  blocked: number;
}

/**
 * Everything the list derives from the four tables it edits: which pages are
 * duplicates of each other, what each scores, what the live reading says about
 * it, and which of them the current filter lets through.
 *
 * It is one hook rather than several because every value here depends on the
 * same two inputs — the entries and the chosen locale — and splitting them
 * would only recompute the same memos under different names.
 */
export function useSeoTable({
  entries,
  locale,
  inspections,
  query,
  groupFilter,
  issueFilter,
}: {
  entries: Entry[];
  locale: Loc;
  inspections: Record<string, PageInspection>;
  query: string;
  groupFilter: string;
  issueFilter: IssueFilter;
}): SeoTable {
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
    for (const e of entries)
      map.set(e.id, scoreEntry(e, locale, duplicates, inspections[pathOf(e, locale)]));
    return map;
  }, [entries, locale, duplicates, inspections]);

  const audits = useMemo(() => {
    const map = new Map<string, AuditFinding[]>();
    for (const e of entries) {
      const insp = inspections[pathOf(e, locale)];
      if (!insp) continue;
      map.set(e.id, auditFor(e, locale, insp, duplicates));
    }
    return map;
  }, [entries, inspections, locale, duplicates]);

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
  }, [entries, query, groupFilter, issueFilter, audits, inspections, locale]);

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

  const unscanned = useMemo(
    () => filtered.filter((e) => !inspections[pathOf(e, locale)]).length,
    [filtered, inspections, locale]
  );

  const blocked = useMemo(
    () => Object.values(inspections).filter((i) => i.blocked).length,
    [inspections]
  );

  return { duplicates, scores, audits, filtered, stats, unscanned, blocked };
}
