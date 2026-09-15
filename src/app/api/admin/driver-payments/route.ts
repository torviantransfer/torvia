import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { loadUsdRate } from "@/lib/driverStatementData";

const TYPES = ["earning", "payment", "adjustment"] as const;
type LedgerType = (typeof TYPES)[number];

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A euro-to-dollar rate outside this band is a typo — 11.6 for 1.16 — and
 * would put a tenfold figure on a driver's account. The pair has not left it
 * in living memory.
 */
const RATE_MIN = 0.5;
const RATE_MAX = 3;

/** `YYYY-MM-DD` as noon in Antalya, so the day survives any timezone it is read in. */
function dayToInstant(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const at = new Date(`${value}T12:00:00+03:00`);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

/** The one failure that is not the request's fault: migration 092 has not been run. */
function missingMigration(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /original_amount|original_currency|exchange_rate|paid_at/.test(error.message ?? "")
  );
}

/**
 * Records one hand-entered movement on a driver's account.
 *
 * The account is kept in dollars. Money handed over in euro is converted at
 * the day's rate — the one on the settings screen, unless the admin typed the
 * rate agreed with the driver — and the row keeps the euro amount and the rate
 * beside the dollar figure, so the statement can say "€85 × 1.16 = $98.60"
 * rather than a bare number nobody can check.
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

    const currency = body.currency === "EUR" ? "EUR" : "USD";
    let rate: number | null = null;
    if (currency === "EUR") {
      const given = Number(body.exchangeRate);
      rate = Number.isFinite(given) && given > 0 ? given : (await loadUsdRate(supabase))?.rate ?? null;
      if (!rate) {
        return NextResponse.json(
          { error: "Günlük kur bulunamadı. Kuru elle yazın." },
          { status: 400 }
        );
      }
      if (rate < RATE_MIN || rate > RATE_MAX) {
        return NextResponse.json(
          { error: `Kur ${RATE_MIN} ile ${RATE_MAX} arasında olmalı (1 € kaç $).` },
          { status: 400 }
        );
      }
    }

    // Payments and earnings are sizes; only an adjustment may take money off.
    const signed = round2(type === "adjustment" ? entered : Math.abs(entered));
    const amount = rate ? round2(signed * rate) : signed;
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
        exchange_rate: rate,
        description: description || null,
        ...(paidAt ? { paid_at: paidAt } : {}),
      })
      .select()
      .single();

    if (error) {
      console.error("Driver payment error:", error);
      return NextResponse.json(
        {
          error: missingMigration(error)
            ? "Veritabanında yeni kolonlar yok: 092 numaralı migration çalıştırılmalı."
            : "Kayıt oluşturulamadı.",
        },
        { status: 500 }
      );
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
