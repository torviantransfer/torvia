import type { SeoCheck } from "@/lib/seoScore";

/**
 * Duplicate meta title / description detection across pages.
 *
 * This cannot live in `scoreSeo`, which judges one page in isolation. Two
 * pages can each score 100 and still both be wrong, because they carry the
 * same title — and Search Console reports exactly that ("Duplicate meta
 * descriptions", "Duplicate title tags") more often than anything else on a
 * site with thirty near-identical region pages generated from one template.
 *
 * Google's own behaviour is the reason it matters: when two pages compete on
 * the same title for the same query, it usually picks one and drops the other
 * from the result, so the duplicate does not just look sloppy — it costs a
 * listing.
 */

export interface DuplicateIndex {
  /** entry id -> ids of the other entries sharing its title. */
  titles: Map<string, string[]>;
  /** entry id -> ids of the other entries sharing its description. */
  descriptions: Map<string, string[]>;
  /** entry id -> display label, for the message. */
  labels: Map<string, string>;
}

/**
 * Normalises before comparing. Two titles differing only in trailing
 * whitespace or a stray double space are the same title to Google, and
 * reporting them as distinct would let a real duplicate hide.
 */
function normalise(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr");
}

export function buildDuplicateIndex(
  rows: { id: string; label: string; row: Record<string, unknown> }[],
  locale: string
): DuplicateIndex {
  const titleGroups = new Map<string, string[]>();
  const descGroups = new Map<string, string[]>();
  const labels = new Map<string, string>();

  for (const entry of rows) {
    labels.set(entry.id, entry.label);
    const title = entry.row[`meta_title_${locale}`];
    const desc = entry.row[`meta_description_${locale}`];

    // Empty is not a duplicate — it is a separate failure the scorer already
    // reports, and grouping every blank page together would drown the real
    // collisions in noise.
    if (typeof title === "string" && title.trim()) {
      const key = normalise(title);
      titleGroups.set(key, [...(titleGroups.get(key) ?? []), entry.id]);
    }
    if (typeof desc === "string" && desc.trim()) {
      const key = normalise(desc);
      descGroups.set(key, [...(descGroups.get(key) ?? []), entry.id]);
    }
  }

  const invert = (groups: Map<string, string[]>) => {
    const out = new Map<string, string[]>();
    for (const ids of groups.values()) {
      if (ids.length < 2) continue;
      for (const id of ids) out.set(id, ids.filter((other) => other !== id));
    }
    return out;
  };

  return { titles: invert(titleGroups), descriptions: invert(descGroups), labels };
}

/** How many pages in the set are involved in at least one collision. */
export function duplicateCount(index: DuplicateIndex): number {
  return new Set([...index.titles.keys(), ...index.descriptions.keys()]).size;
}

function describe(index: DuplicateIndex, ids: string[]): string {
  const names = ids.map((id) => index.labels.get(id) ?? id);
  if (names.length <= 2) return names.join(" ve ");
  return `${names.slice(0, 2).join(", ")} ve ${names.length - 2} sayfa daha`;
}

/**
 * The checks to append to a page's own score.
 *
 * Returns an empty array when the page is unique, so a clean page's checklist
 * does not grow two always-green rows it never has to think about.
 */
export function duplicateChecks(index: DuplicateIndex, entryId: string): SeoCheck[] {
  const checks: SeoCheck[] = [];

  const titleTwins = index.titles.get(entryId);
  if (titleTwins?.length) {
    checks.push({
      id: "duplicate-title",
      label: "Meta başlık başka sayfayla aynı",
      status: "fail",
      weight: 12,
      detail: `Aynı başlık şurada da var: ${describe(index, titleTwins)}. Google aynı başlıklı iki sayfadan genellikle birini sonuçlardan düşürür.`,
      field: "meta_title",
    });
  }

  const descTwins = index.descriptions.get(entryId);
  if (descTwins?.length) {
    checks.push({
      id: "duplicate-description",
      label: "Meta açıklama başka sayfayla aynı",
      status: "warn",
      weight: 8,
      detail: `Aynı açıklama şurada da var: ${describe(index, descTwins)}. Search Console bunu "yinelenen meta açıklama" olarak raporlar.`,
      field: "meta_description",
    });
  }

  return checks;
}
