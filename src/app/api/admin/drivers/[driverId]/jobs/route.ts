import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInBookingTz } from "@/lib/datetime";
import { loadDriverUpcoming } from "@/lib/driversData";

/** A driver's next jobs, for the Şoförler drawer. */
export async function GET(_request: Request, { params }: { params: Promise<{ driverId: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { driverId } = await params;
  const jobs = await loadDriverUpcoming(createAdminClient(), driverId, todayInBookingTz());
  return NextResponse.json({ jobs }, { headers: { "Cache-Control": "no-store" } });
}
