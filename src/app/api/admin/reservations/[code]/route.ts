import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadReservationDetail } from "@/lib/adminReservationsData";

/** One reservation for the drawer: the booking, nearby jobs, drivers and vehicles. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { code } = await params;
  const detail = await loadReservationDetail(createAdminClient(), decodeURIComponent(code));
  if (!detail) return NextResponse.json({ error: "Rezervasyon bulunamadı." }, { status: 404 });

  return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
}
