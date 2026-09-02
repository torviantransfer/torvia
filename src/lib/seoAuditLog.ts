import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records what an admin write changed, field by field.
 *
 * An SEO edit can cost a ranking weeks after it is made, by which time nobody
 * remembers making it. "Traffic on the Belek page dropped in March" has no
 * answer without a record of what its title held in February.
 *
 * Only the tables whose columns reach a crawler are logged. Logging driver
 * assignments and coupon toggles here would bury the handful of rows that
 * matter under thousands that do not.
 */

const TRACKED_TABLES = new Set(["seo_pages", "regions", "blog_posts"]);

/**
 * Columns worth a log entry: anything a search engine or a social crawler
 * reads. Matched by prefix so the six locale variants of each are covered
 * without listing ninety column names.
 */
const TRACKED_PREFIXES = [
  "meta_title",
  "meta_description",
  "canonical_url",
  "og_title",
  "og_description",
  "og_image_url",
  "twitter_title",
  "twitter_description",
  "twitter_image_url",
  "twitter_card",
  "h1",
  "intro",
  "keywords",
  "focus_keyword",
  "image_url",
  "image_alt",
  "noindex",
  "nofollow",
  "slug",
  "is_active",
  "is_published",
  "description",
  "name",
  "title",
  "excerpt",
];

function isTracked(field: string): boolean {
  return TRACKED_PREFIXES.some((p) => field === p || field.startsWith(`${p}_`));
}

/** Values go into a TEXT column; booleans and nulls are stringified readably. */
function asText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function labelFor(row: Record<string, unknown> | null): string | null {
  if (!row) return null;
  for (const key of ["label", "name_tr", "name_en", "title_tr", "title_en", "slug", "page_key"]) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export interface SeoChangeParams {
  table: string;
  recordId: string;
  /** The row as it was before the write. Null for a create. */
  before: Record<string, unknown> | null;
  /** The fields being written. */
  changes: Record<string, unknown>;
  /** The row after the write, used only for the label. */
  after?: Record<string, unknown> | null;
  changedBy: string | null;
}

/**
 * Turns one write into the log rows it deserves. Pure, so the old/new-value
 * contract can be asserted without a database — see scripts/verify-seo-overrides.ts.
 */
export function buildAuditRows(params: SeoChangeParams): Record<string, unknown>[] {
  const { table, recordId, before, changes, after, changedBy } = params;
  if (!TRACKED_TABLES.has(table)) return [];

  const rows: Record<string, unknown>[] = [];
  const label = labelFor(after ?? before);

  for (const [field, next] of Object.entries(changes)) {
    if (!isTracked(field)) continue;
    const previous = before ? before[field] : null;
    // A write that does not change the value is not a change. Admin forms
    // resend whole objects, so without this the log fills with no-ops.
    if (asText(previous) === asText(next)) continue;
    rows.push({
      table_name: table,
      record_id: recordId,
      record_label: label,
      field,
      old_value: asText(previous),
      new_value: asText(next),
      changed_by: changedBy,
    });
  }
  return rows;
}

export async function logSeoChange(params: SeoChangeParams): Promise<void> {
  const { table, recordId } = params;
  const rows = buildAuditRows(params);

  if (rows.length === 0) return;

  try {
    const supabase = createAdminClient();
    await supabase.from("seo_audit_log").insert(rows);
  } catch (err) {
    // The write it describes has already succeeded. Failing the request
    // because the log could not be written would be worse than losing the
    // log entry, and a missing seo_audit_log table (migration 058 not applied
    // yet) must not break saving.
    console.error("logSeoChange failed", { table, recordId, err });
  }
}
