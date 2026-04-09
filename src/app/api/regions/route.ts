import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const popularOnly = searchParams.get("popular") === "true";

  let query = supabase
    .from("regions")
    .select(
      "id, slug, name_tr, name_en, name_de, name_pl, name_ru, distance_km, duration_minutes, is_popular, sort_order, latitude, longitude"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (popularOnly) {
    query = query.eq("is_popular", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
