import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadReservationList, RESERVATION_PAGE } from "@/lib/adminReservationsData";
import { parseReservationQuery } from "@/lib/reservationQuery";

/** The reservations screen's list: one page, and the counts on its tabs. */
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const params = request.nextUrl.searchParams;
  const offset = Math.max(0, Math.floor(Number(params.get("offset")) || 0));
  const limit = Math.min(300, Math.max(1, Math.floor(Number(params.get("limit")) || RESERVATION_PAGE)));

  try {
    const result = await loadReservationList(createAdminClient(), parseReservationQuery(params), offset, limit);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("reservations list:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Liste yüklenemedi." }, { status: 500 });
  }
}
