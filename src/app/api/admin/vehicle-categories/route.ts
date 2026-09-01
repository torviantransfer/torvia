import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * Create a vehicle category, and give it a price for every region.
 *
 * The generic /api/admin/crud endpoint can insert the category row on its
 * own, but that is not enough to make a vehicle bookable. `pricing` is keyed
 * UNIQUE(region_id, category_id), so a brand new category has no price
 * anywhere, and /admin/pricing can only edit rows that already exist — it has
 * no "add" action. A category created without this endpoint would be
 * unpriceable from the panel and would show up in the booking flow with
 * nothing to charge.
 *
 * So every new category is seeded from an existing one: for each region, the
 * new category gets a copy of that region's current price. /admin/pricing
 * stays the single place prices are edited; this only decides where the new
 * rows start.
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();

  let body: {
    name?: string;
    slug?: string;
    description?: string | null;
    image_url?: string | null;
    max_passengers?: number;
    max_luggage?: number;
    features?: string[];
    sort_order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const name = body.name?.trim();
  const slug = body.slug?.trim().toLowerCase();

  if (!name || !slug) {
    return NextResponse.json({ error: "Araç adı ve slug zorunlu" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "Slug sadece küçük harf, rakam ve tire içerebilir" },
      { status: 400 },
    );
  }

  const { data: clash } = await supabase
    .from("vehicle_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (clash) {
    return NextResponse.json({ error: "Bu slug zaten kullanılıyor" }, { status: 409 });
  }

  // Pick the template before creating anything, so a failure here does not
  // leave a priceless category behind.
  const { data: templates } = await supabase
    .from("vehicle_categories")
    .select("id, name")
    .order("sort_order", { ascending: true });

  const template = templates?.[0] ?? null;
  if (!template) {
    return NextResponse.json(
      { error: "Fiyatları kopyalayacak mevcut bir araç bulunamadı" },
      { status: 409 },
    );
  }

  const { data: created, error: createError } = await supabase
    .from("vehicle_categories")
    .insert({
      name,
      slug,
      description: body.description?.trim() || null,
      image_url: body.image_url?.trim() || null,
      max_passengers: body.max_passengers ?? 5,
      max_luggage: body.max_luggage ?? 5,
      features: body.features ?? [],
      sort_order: body.sort_order ?? 0,
      is_active: true,
    })
    .select()
    .single();

  if (createError || !created) {
    return NextResponse.json(
      { error: createError?.message ?? "Araç oluşturulamadı" },
      { status: 500 },
    );
  }

  // Copy whole rows rather than a named list of price columns: the pricing
  // table has picked up columns since the migrations were written (the cash
  // prices, the deposit), and a hard-coded list would silently drop whichever
  // ones it does not know about.
  const { data: sourceRows, error: sourceError } = await supabase
    .from("pricing")
    .select("*")
    .eq("category_id", template.id);

  if (sourceError) {
    return NextResponse.json(
      { error: `Araç oluşturuldu ama fiyatlar kopyalanamadı: ${sourceError.message}` },
      { status: 500 },
    );
  }

  let clonedCount = 0;
  if (sourceRows && sourceRows.length > 0) {
    const clones = sourceRows.map((row) => {
      const copy: Record<string, unknown> = { ...row };
      delete copy.id;
      delete copy.created_at;
      copy.category_id = created.id;
      return copy;
    });

    const { error: cloneError } = await supabase.from("pricing").insert(clones);
    if (cloneError) {
      return NextResponse.json(
        { error: `Araç oluşturuldu ama fiyatlar kopyalanamadı: ${cloneError.message}` },
        { status: 500 },
      );
    }
    clonedCount = clones.length;
  }

  return NextResponse.json({
    data: created,
    clonedFrom: template.name,
    clonedCount,
  });
}
