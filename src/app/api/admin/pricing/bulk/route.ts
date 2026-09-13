import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateForTable } from "@/lib/revalidate";
import {
  adjustFields,
  adjustProblem,
  isAdjustField,
  type AdjustField,
  type AdjustMode,
  type PriceFields,
} from "@/lib/priceAdjust";

/**
 * Apply one adjustment to every region price of a vehicle.
 *
 * /admin/pricing edits a single row at a time, which is fine for correcting a
 * price and unusable for setting up a vehicle: a fleet on 24 regions means 24
 * edits before a new vehicle can be sold, and the prices being entered are
 * usually the existing ones plus a flat markup. This does that in one write.
 *
 * `sourceCategoryId` is what makes it useful beyond a self-adjustment: pricing
 * a Sprinter as "the Vito list plus $20" reads the Vito rows and writes the
 * Sprinter ones, leaving the Vito prices alone.
 *
 * The arithmetic is redone here from the stored prices rather than accepting
 * the numbers the panel previewed. The preview is a rendering of this, not an
 * input to it — otherwise the prices the site charges would be whatever a
 * browser posted.
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();

  let body: {
    categoryId?: string;
    sourceCategoryId?: string;
    mode?: string;
    value?: number;
    fields?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const categoryId = body.categoryId?.trim();
  const sourceCategoryId = body.sourceCategoryId?.trim() || categoryId;
  const mode = body.mode as AdjustMode;
  const value = Number(body.value);

  if (!categoryId) {
    return NextResponse.json({ error: "Araç seçilmedi" }, { status: 400 });
  }
  if (mode !== "amount" && mode !== "percent") {
    return NextResponse.json({ error: "Geçersiz işlem türü" }, { status: 400 });
  }
  if (!Number.isFinite(value)) {
    return NextResponse.json({ error: "Geçerli bir değer girin" }, { status: 400 });
  }

  const fields = (body.fields ?? []).filter(isAdjustField) as AdjustField[];
  if (fields.length === 0) {
    return NextResponse.json(
      { error: "Güncellenecek en az bir fiyat alanı seçin" },
      { status: 400 },
    );
  }

  // Copying a vehicle's prices onto itself with no change would be a no-op
  // write across every region; nothing breaks, but it is never what was meant.
  if (value === 0 && sourceCategoryId === categoryId) {
    return NextResponse.json({ error: "Değer sıfır olamaz" }, { status: 400 });
  }

  const { data: sourceRows, error: sourceError } = await supabase
    .from("pricing")
    .select("region_id, one_way_price, round_trip_price, one_way_cash_price, round_trip_cash_price, cash_deposit_amount, currency")
    .eq("category_id", sourceCategoryId);

  if (sourceError) {
    return NextResponse.json({ error: sourceError.message }, { status: 500 });
  }
  if (!sourceRows || sourceRows.length === 0) {
    return NextResponse.json(
      { error: "Kaynak araç için fiyat bulunamadı" },
      { status: 404 },
    );
  }

  // Compute every row before writing any of it, so an adjustment that would
  // zero out one region's price fails with nothing half-applied — a partial
  // price list is worse than an unchanged one.
  const updates: (PriceFields & {
    region_id: string;
    category_id: string;
    currency: string;
  })[] = [];
  for (const row of sourceRows) {
    const adjusted = adjustFields(row as PriceFields, { mode, value, fields });
    const problem = adjustProblem(adjusted, fields);
    if (problem) {
      return NextResponse.json(
        { error: `${problem} (bir veya daha fazla bölgede). Değeri düşürün.` },
        { status: 400 },
      );
    }
    updates.push({
      region_id: row.region_id,
      category_id: categoryId,
      currency: row.currency ?? "USD",
      ...adjusted,
    });
  }

  // upsert on the table's UNIQUE(region_id, category_id): regions the target
  // vehicle already has are updated, regions it never had are created. Only
  // the columns present here are written, so an unselected price field keeps
  // whatever the target row already holds.
  const { data: written, error: writeError } = await supabase
    .from("pricing")
    .upsert(updates, { onConflict: "region_id,category_id" })
    .select();

  if (writeError) {
    return NextResponse.json({ error: writeError.message }, { status: 500 });
  }

  await revalidateForTable("pricing", null);

  return NextResponse.json({ data: written ?? [], count: written?.length ?? 0 });
}
