import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateForTable } from "@/lib/revalidate";
import { logSeoChange } from "@/lib/seoAuditLog";

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
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
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
