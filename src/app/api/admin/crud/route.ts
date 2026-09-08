import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateForTable } from "@/lib/revalidate";
import { logSeoChange } from "@/lib/seoAuditLog";
import { landingSlugProblem, regionSlugForms } from "@/lib/landingSlug";
import { locales } from "@/i18n/config";

const ALLOWED_TABLES = [
  "drivers",
  "vehicles",
  "vehicle_categories",
  "regions",
  "pricing",
  "coupons",
  "reviews",
  "settings",
  "exchange_rates",
  "blog_posts",
  "seo_pages",
  "landing_pages",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}

/**
 * Rejects any landing-page slug that cannot work as a URL.
 *
 * Lives on the write path rather than only in the form, because a slug is the
 * one field here whose mistakes are invisible: a page saved on `about` or on a
 * region's slug looks published in the panel, enters the sitemap, and serves
 * somebody else's page — the failure `FILE_ROUTE_SHADOWED` documents for the
 * land-of-legends region. The rules themselves live in landingSlug.ts so the
 * form can show the same message before the request is sent.
 *
 * Checks the shared slug and every per-locale override in the same write, so a
 * German address cannot land on a reserved route while the Turkish one passes.
 *
 * Returns the reason, in Turkish, or null when every submitted slug is usable.
 */
async function landingSlugErrors(
  supabase: ReturnType<typeof createAdminClient>,
  data: Record<string, unknown>,
  currentId: string | null
): Promise<string | null> {
  const columns = ["slug", ...locales.map((l) => `slug_${l}`)];
  const submitted = columns.filter((c) => c in data);
  if (submitted.length === 0) return null;

  const [{ data: regions }, { data: landings }] = await Promise.all([
    supabase.from("regions").select("slug"),
    // Written out rather than built from `columns`: the Supabase client parses
    // the select string at the type level, and a template literal defeats that.
    supabase
      .from("landing_pages")
      .select("id, slug, slug_tr, slug_en, slug_de, slug_pl, slug_ru, slug_nl, slug_ro"),
  ]);

  const regionSlugs = (regions ?? []).flatMap((r) =>
    regionSlugForms(String((r as Record<string, unknown>).slug))
  );

  // Every address another page already answers on, in any language. Read this
  // way rather than from the base slug alone because a page reached at
  // /de/<slug_de> is just as taken as one reached at /tr/<slug>, and two rows
  // sharing an address would make the lookup ambiguous.
  const takenSlugs = (landings ?? [])
    .filter((l) => String((l as Record<string, unknown>).id) !== currentId)
    .flatMap((l) =>
      columns
        .map((c) => String((l as Record<string, unknown>)[c] ?? "").trim())
        .filter(Boolean)
    );

  for (const column of submitted) {
    const raw = data[column];
    // A localised slug is optional; clearing it falls back to the base slug.
    if (column !== "slug" && (raw === null || raw === undefined || String(raw).trim() === "")) {
      continue;
    }
    if (typeof raw !== "string") return `${column}: slug metin olmalı.`;
    const problem = landingSlugProblem(raw.trim(), regionSlugs, takenSlugs);
    if (problem) {
      return column === "slug" ? problem : `${column.replace("slug_", "").toUpperCase()} adresi: ${problem}`;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const { error: authError, user } = await requireAdmin();
  if (authError) return authError;
  const changedBy = user?.email ?? null;

  try {
    const body = await request.json();
    const { table, action, data, id } = body;

    if (!table || !action) {
      return NextResponse.json(
        { error: "table and action are required" },
        { status: 400 }
      );
    }

    if (!isAllowedTable(table)) {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    if (table === "landing_pages" && (action === "create" || action === "update") && data) {
      // Runs only over the slug columns actually present in the write: the SEO
      // panel edits landing rows too, and a meta-title save must not be
      // refused because of a slug it never touched.
      const problem = await landingSlugErrors(
        supabase,
        data as Record<string, unknown>,
        action === "update" ? String(id ?? "") : null
      );
      if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    }

    switch (action) {
      case "create": {
        if (!data) {
          return NextResponse.json(
            { error: "data is required" },
            { status: 400 }
          );
        }
        const { data: result, error } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        await revalidateForTable(table, result);
        await logSeoChange({
          table,
          recordId: String(result?.id ?? ""),
          before: null,
          changes: data,
          after: result,
          changedBy,
        });
        return NextResponse.json({ data: result });
      }

      case "update": {
        if (!id || !data) {
          return NextResponse.json(
            { error: "id and data are required" },
            { status: 400 }
          );
        }
        const idCol = table === "settings" ? "key" : "id";
        // Read before writing: the audit log needs the value being replaced,
        // and after the update it is gone.
        const { data: before } = await supabase
          .from(table)
          .select("*")
          .eq(idCol, id)
          .maybeSingle();
        const { data: result, error } = await supabase
          .from(table)
          .update(data)
          .eq(idCol, id)
          .select()
          .single();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        await revalidateForTable(table, result);
        await logSeoChange({
          table,
          recordId: String(id),
          before: before as Record<string, unknown> | null,
          changes: data,
          after: result,
          changedBy,
        });
        return NextResponse.json({ data: result });
      }

      case "delete": {
        if (!id) {
          return NextResponse.json(
            { error: "id is required" },
            { status: 400 }
          );
        }
        const idCol = table === "settings" ? "key" : "id";
        const { error } = await supabase.from(table).delete().eq(idCol, id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        // No row to key off after a delete, so this purges the table's whole
        // surface rather than one path -- which is what a deletion needs anyway.
        await revalidateForTable(table, null);
        return NextResponse.json({ success: true });
      }

      case "toggle": {
        if (!id) {
          return NextResponse.json(
            { error: "id is required" },
            { status: 400 }
          );
        }
        const field = data?.field ?? "is_active";
        const { data: current } = await supabase
          .from(table)
          .select(field)
          .eq("id", id)
          .single();
        if (!current) {
          return NextResponse.json(
            { error: "Record not found" },
            { status: 404 }
          );
        }
        const { data: result, error } = await supabase
          .from(table)
          .update({ [field]: !current[field] })
          .eq("id", id)
          .select()
          .single();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        await revalidateForTable(table, result);
        await logSeoChange({
          table,
          recordId: String(id),
          before: current as unknown as Record<string, unknown>,
          changes: { [field]: result?.[field] },
          after: result,
          changedBy,
        });
        return NextResponse.json({ data: result });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("Admin CRUD error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
