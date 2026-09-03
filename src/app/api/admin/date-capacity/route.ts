import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import {
  capacityFor,
  countBookingsByDate,
  getDateOverrides,
  getGlobalMaxDaily,
} from "@/lib/availability";

const MAX_CAPACITY = 100;

/**
 * Postgres reports a missing column as 42703. Every write here touches columns
 * added by migration 059, so that code almost always means the migration has
 * not been applied to this environment yet — say so instead of "kaydedilemedi".
 */
function describeDbError(error: { code?: string; message?: string } | null) {
  if (error?.code === "42703") {
    return "Veritabanı güncel değil: supabase/migrations/059_per_date_capacity.sql henüz çalıştırılmamış. Supabase SQL Editor'de bu dosyayı çalıştırın.";
  }
  if (error?.code === "42P01") {
    return "blocked_dates tablosu bulunamadı. Supabase migration'larını çalıştırın.";
  }
  return error?.message ?? null;
}

/** GET ?from=YYYY-MM-DD&to=YYYY-MM-DD — capacity picture for a date range. */
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const [globalMax, overrides, counts] = await Promise.all([
    getGlobalMaxDaily(supabase),
    getDateOverrides(supabase, from, to),
    countBookingsByDate(supabase, from, to),
  ]);

  return NextResponse.json({
    globalMax,
    counts,
    overrides: [...overrides.values()].map((o) => ({
      date: o.blocked_date,
      maxBookings: o.max_bookings,
      reason: o.reason,
      capacity: capacityFor(o, globalMax),
      closed: capacityFor(o, globalMax) === 0,
    })),
  });
}

/** PUT { globalMax } — the default capacity every non-overridden date uses. */
export async function PUT(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const globalMax = Number(body?.globalMax);

  if (!Number.isInteger(globalMax) || globalMax < 1 || globalMax > MAX_CAPACITY) {
    return NextResponse.json(
      { error: `Günlük varsayılan kapasite 1 ile ${MAX_CAPACITY} arasında olmalı.` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  // Upsert: migration 012 seeded this row, but an environment restored without
  // it would otherwise silently keep falling back to the built-in default.
  const { error } = await supabase
    .from("settings")
    .upsert({ key: "max_daily_bookings", value: globalMax }, { onConflict: "key" });

  if (error) {
    console.error("Global capacity update failed:", error.code, error.message);
    return NextResponse.json(
      { error: describeDbError(error) ?? "Kapasite kaydedilemedi." },
      { status: 500 }
    );
  }

  return NextResponse.json({ globalMax });
}

/**
 * POST { date, maxBookings, reason } — set one date's override.
 * `maxBookings: null` (or 0) closes the date; a number raises or lowers it.
 */
export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const date = body?.date;
  const reason = typeof body?.reason === "string" && body.reason.trim() ? body.reason.trim() : null;

  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Geçerli bir tarih gerekli." }, { status: 400 });
  }

  let maxBookings: number | null = null;
  if (body?.maxBookings !== null && body?.maxBookings !== undefined) {
    const n = Number(body.maxBookings);
    if (!Number.isInteger(n) || n < 0 || n > MAX_CAPACITY) {
      return NextResponse.json(
        { error: `Kapasite 0 ile ${MAX_CAPACITY} arasında bir tam sayı olmalı.` },
        { status: 400 }
      );
    }
    maxBookings = n;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blocked_dates")
    .upsert(
      {
        blocked_date: date,
        max_bookings: maxBookings,
        reason,
        created_by: "admin",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "blocked_date" }
    )
    .select()
    .single();

  if (error) {
    console.error("Date override upsert failed:", error.code, error.message);
    return NextResponse.json(
      { error: describeDbError(error) ?? "Tarih ayarı kaydedilemedi." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    date: data.blocked_date,
    maxBookings: data.max_bookings,
    reason: data.reason,
  });
}

/** DELETE ?date=YYYY-MM-DD — drop the override so the date follows the global default. */
export async function DELETE(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("blocked_dates").delete().eq("blocked_date", date);

  if (error) {
    console.error("Date override delete failed:", error.code, error.message);
    return NextResponse.json(
      { error: describeDbError(error) ?? "Tarih ayarı kaldırılamadı." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
