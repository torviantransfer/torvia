import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { isMissingTable } from "@/lib/supabaseFetchAll";

/**
 * Adds a category from inside the entry form. A name that already exists is
 * handed back rather than refused, so typing "Google Ads" twice selects the one
 * there is instead of failing.
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
    const kind = body.kind === "income" ? "income" : "expense";
    if (name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: "Kategori adı 2-60 karakter olmalı." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("finance_categories")
      .insert({ name, kind })
      .select("id, name, kind, sort_order, is_active")
      .single();

    if (error?.code === "23505") {
      const { data: existing } = await supabase
        .from("finance_categories")
        .select("id, name, kind, sort_order, is_active")
        .eq("name", name)
        .maybeSingle();
      if (existing) return NextResponse.json({ category: existing });
    }
    if (error) {
      console.error("Finance category error:", error);
      return NextResponse.json(
        {
          error: isMissingTable(error)
            ? "Kasa tabloları yok: veritabanında 093 numaralı migration çalıştırılmalı."
            : "Kategori eklenemedi.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ category: data });
  } catch (err) {
    console.error("Finance category API error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
