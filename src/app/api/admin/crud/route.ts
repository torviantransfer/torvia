import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

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
        const { data: result, error } = await supabase
          .from(table)
          .update(data)
          .eq(idCol, id)
          .select()
          .single();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
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
