import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const reservationId = body?.reservationId;
    if (!reservationId) {
      return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
    }

    const allowed: Record<string, any> = {};
    const fields = ["hotel_name", "hotel_address", "flight_code", "pickup_datetime", "return_datetime", "notes", "status"];
    for (const f of fields) {
      if (body[f] !== undefined) allowed[f] = body[f];
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("reservations")
      .update(allowed)
      .eq("id", reservationId);

    if (error) {
      console.error("Edit reservation error:", error.message);
      return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Edit reservation exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
