import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { defaultQuote, isCash, loadRates, perUnit, quoteBand, quotePair, CASH_SYMBOL, type Cash } from "@/lib/rates";

const TYPES = ["earning", "payment", "adjustment"] as const;
type LedgerType = (typeof TYPES)[number];

const round2 = (n: number) => Math.round(n * 100) / 100;

/** `YYYY-MM-DD` as noon in Antalya, so the day survives any timezone it is read in. */
function dayToInstant(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const at = new Date(`${value}T12:00:00+03:00`);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

/** The failures that are not the request's fault: a migration has not been run. */
function migrationHint(error: { code?: string; message?: string }): string | null {
  const message = error.message ?? "";
  if (/driver_payments_original_currency_valid/.test(message)) {
    return "TL ödeme için veritabanında 093 numaralı migration çalıştırılmalı.";
  }
  if (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /original_amount|original_currency|exchange_rate|paid_at/.test(message)
  ) {
    return "Veritabanında yeni kolonlar yok: 092 numaralı migration çalıştırılmalı.";
  }
  return null;
}

/**
 * Records one hand-entered movement on a driver's account.
 *
 * The account is kept in dollars. Money handed over in euro or lira is
 * converted at the day's rate — the one on the settings screen, unless the
 * admin typed the rate agreed with the driver — and the row keeps the original
 * amount and the rate beside the dollar figure, so the statement can say
 * "3.500 ₺ at 1 $ = 41,20 ₺" rather than a bare number nobody can check.
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const driverId = typeof body.driverId === "string" ? body.driverId : "";
    const type = body.type as LedgerType;
    const entered = Number(body.amount);

    if (!driverId) {
      return NextResponse.json({ error: "Şoför seçilmedi." }, { status: 400 });
    }
    if (!TYPES.includes(type)) {
      return NextResponse.json({ error: "Geçersiz işlem türü." }, { status: 400 });
    }
    if (!Number.isFinite(entered) || entered === 0) {
      return NextResponse.json({ error: "Tutar geçersiz." }, { status: 400 });
    }

    const currency: Cash = isCash(body.currency) ? body.currency : "USD";
    let usdPerUnit: number | null = null;
    if (currency !== "USD") {
      const given = Number(body.exchangeRate);
      const quoted =
        Number.isFinite(given) && given > 0 ? given : defaultQuote(currency, "USD", await loadRates(supabase));
      if (!quoted) {
        return NextResponse.json({ error: "Günlük kur bulunamadı. Kuru elle yazın." }, { status: 400 });
      }
      const [min, max] = quoteBand(currency, "USD");
      if (quoted < min || quoted > max) {
        const { base, quote } = quotePair(currency, "USD");
        return NextResponse.json(
          { error: `Kur ${min} ile ${max} arasında olmalı (1 ${CASH_SYMBOL[base]} kaç ${CASH_SYMBOL[quote]}).` },
          { status: 400 }
        );
      }
      usdPerUnit = Math.round(perUnit(currency, "USD", quoted) * 1e10) / 1e10;
    }

    // Payments and earnings are sizes; only an adjustment may take money off.
    const signed = round2(type === "adjustment" ? entered : Math.abs(entered));
    const amount = usdPerUnit === null ? signed : round2(signed * usdPerUnit);
    const paidAt = dayToInstant(body.paidAt);
    const description = typeof body.description === "string" ? body.description.trim() : "";

    const { data, error } = await supabase
      .from("driver_payments")
      .insert({
        driver_id: driverId,
        reservation_id: typeof body.reservationId === "string" && body.reservationId ? body.reservationId : null,
        type,
        amount,
        currency: "USD",
        original_amount: signed,
        original_currency: currency,
        exchange_rate: usdPerUnit,
        description: description || null,
        ...(paidAt ? { paid_at: paidAt } : {}),
      })
      .select()
      .single();

    if (error) {
      console.error("Driver payment error:", error);
      return NextResponse.json({ error: migrationHint(error) ?? "Kayıt oluşturulamadı." }, { status: 500 });
    }

    return NextResponse.json({ payment: data });
  } catch (err) {
    console.error("Driver payment API error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

/**
 * Removes a hand-entered movement. A row generated from a fee is refused: it
 * belongs to the assignment and is rewritten whenever the fee is, so deleting
 * it here would only last until the next edit — and would hide a debt until then.
 */
export async function DELETE(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;
  const supabase = createAdminClient();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Kayıt belirtilmedi." }, { status: 400 });

  const { data: row } = await supabase
    .from("driver_payments")
    .select("id, assignment_id")
    .eq("id", id)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  if (row.assignment_id) {
    return NextResponse.json(
      { error: "Bu kayıt şoför ücretinden otomatik oluştu. Rezervasyondaki ücret değiştirilince kendiliğinden güncellenir." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("driver_payments").delete().eq("id", id);
  if (error) {
    console.error("Driver payment delete error:", error);
    return NextResponse.json({ error: "Silinemedi." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
