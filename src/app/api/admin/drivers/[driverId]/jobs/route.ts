import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInBookingTz } from "@/lib/datetime";
import { loadDriverLeaveDays, loadDriverUpcoming } from "@/lib/driversData";

/** A driver's next jobs and leave days, for the Şoförler drawer. */
export async function GET(_request: Request, { params }: { params: Promise<{ driverId: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { driverId } = await params;
  const db = createAdminClient();
  const today = todayInBookingTz();
  const [jobs, leaveDays] = await Promise.all([
    loadDriverUpcoming(db, driverId, today),
    loadDriverLeaveDays(db, driverId, today),
  ]);
  return NextResponse.json({ jobs, leaveDays }, { headers: { "Cache-Control": "no-store" } });
}
