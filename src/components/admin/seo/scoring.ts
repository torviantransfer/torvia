import { scoreSeo, type SeoScore } from "@/lib/seoScore";
import { auditPage, type AuditFinding } from "@/lib/seoAudit";
import type { PageInspection } from "@/lib/seoInspect";
import {
  duplicateChecks,
  type DuplicateIndex,
} from "@/lib/seoDuplicates";
import { locales } from "@/i18n/config";
import { field, str, translatedLocales, type Entry, type FieldMap } from "./entries";
import type { Loc } from "./fields";

export type FieldName = keyof FieldMap;

/** Legal and utility pages are scored leniently — see scoreSeo's "lite" mode. */
export const LITE_KEYS = new Set(["privacy", "terms", "cookies", "kvkk", "cancellation"]);

/**
 * Scores a page on its EFFECTIVE values, not its overrides.
 *
 * This is the whole correctness question for the score. Reading only the
 * override columns reported "Meta başlık boş" for /tr/antalya-airport-transfer
 * — a page whose real title has come from a hardcoded map for months — and an
 * editor acting on that advice would have overwritten ranking copy to fix
 * nothing. So each field resolves override first, then the page's own DB
 * column, then what the rendered HTML actually carries.
 *
 * `inspection` is optional because the list renders before any scan finishes;
 * until it arrives the score falls back to the database values alone, which is
 * the same information the panel had before and no worse.
 */
export function scoreEntry(
  entry: Entry,
  locale: Loc,
  duplicates?: DuplicateIndex,
  inspection?: PageInspection | null
): SeoScore {
  const g = (name: FieldName) => str(entry.row, field(entry.fieldMap, name, locale));

  // A blocked reading carries no values; using it would score the Vercel
  // login page rather than ours.
  const live = inspection && !inspection.blocked ? inspection : null;

  /** override -> page's own column -> what the HTML serves. */
  const effective = (...candidates: (string | null | undefined)[]): string => {
    for (const c of candidates) {
      const v = (c ?? "").trim();
      if (v) return v;
    }
    return "";
  };

  const base = scoreSeo(
    {
      title: effective(g("metaTitle"), str(entry.row, `title_${locale}`), live?.title),
      description: effective(
        g("metaDescription"),
        str(entry.row, `excerpt_${locale}`),
        live?.description
      ),
      // Focus and secondary keywords have no runtime counterpart: they are
      // never emitted as tags, so there is nothing to fall back to.
      focusKeyword: g("focusKeyword"),
      keywords: g("keywords"),
      slug: entry.routeFor(locale),
      content: effective(g("intro"), str(entry.row, `content_${locale}`)),
      // The rendered page is the only place a landing page's body copy exists.
      contentWordCount: live?.wordCount,
      h1: effective(
        g("h1"),
        str(entry.row, `title_${locale}`),
        str(entry.row, `name_${locale}`),
        live?.h1s[0]
      ),
      imageUrl: effective(str(entry.row, "image_url"), live?.ogImage),
      ogImageUrl: effective(str(entry.row, "og_image_url"), live?.ogImage),
      imageAlt: effective(str(entry.row, "image_alt"), live?.ogImageAlt),
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

export function auditFor(
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
