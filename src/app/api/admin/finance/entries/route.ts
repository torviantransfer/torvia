import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { CASH_SYMBOL, defaultQuote, isCash, loadRates, perUnit, quoteBand, quotePair, type Cash } from "@/lib/rates";
import { isMissingTable } from "@/lib/supabaseFetchAll";

const round2 = (n: number) => Math.round(n * 100) / 100;

const MIGRATION = "Kasa tabloları yok: veritabanında 093 numaralı migration çalıştırılmalı.";

/**
 * Records one income or expense on the finance screen.
 *
 * Stored in the currency it was paid in, with its euro value fixed at the rate
 * of that day — the settings screen's, unless the admin typed the rate the
 * bank actually used — so a month's profit does not move when the rate does.
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const kind = body.kind === "income" || body.kind === "expense" ? body.kind : null;
    const amount = round2(Number(body.amount));
    const day = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;

    if (!kind) return NextResponse.json({ error: "Gelir mi gider mi seçilmedi." }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Tutar sıfırdan büyük olmalı." }, { status: 400 });
    }
    if (!day) return NextResponse.json({ error: "Tarih geçersiz." }, { status: 400 });

    const currency: Cash = isCash(body.currency) ? body.currency : "EUR";
    let eurPerUnit = 1;
    if (currency !== "EUR") {
      const given = Number(body.exchangeRate);
      const quoted = given > 0 ? given : defaultQuote(currency, "EUR", await loadRates(supabase));
      if (!quoted) {
        return NextResponse.json({ error: "Günlük kur bulunamadı. Kuru elle yazın." }, { status: 400 });
      }
      const [min, max] = quoteBand(currency, "EUR");
      if (quoted < min || quoted > max) {
        const { base, quote } = quotePair(currency, "EUR");
        return NextResponse.json(
          { error: `Kur ${min} ile ${max} arasında olmalı (1 ${CASH_SYMBOL[base]} kaç ${CASH_SYMBOL[quote]}).` },
          { status: 400 }
        );
      }
      eurPerUnit = Math.round(perUnit(currency, "EUR", quoted) * 1e10) / 1e10;
    }

    const description = typeof body.description === "string" ? body.description.trim() : "";
    const { data, error } = await supabase
      .from("finance_entries")
      .insert({
        entry_date: day,
        kind,
        category_id: typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null,
        amount,
        currency,
        exchange_rate: eurPerUnit,
        amount_eur: round2(amount * eurPerUnit),
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Finance entry error:", error);
      return NextResponse.json({ error: isMissingTable(error) ? MIGRATION : "Kaydedilemedi." }, { status: 500 });
    }
    return NextResponse.json({ entry: data });
  } catch (err) {
    console.error("Finance entry API error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;
  const supabase = createAdminClient();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Kayıt belirtilmedi." }, { status: 400 });

  const { error } = await supabase.from("finance_entries").delete().eq("id", id);
  if (error) {
    console.error("Finance entry delete error:", error);
    return NextResponse.json({ error: isMissingTable(error) ? MIGRATION : "Silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
