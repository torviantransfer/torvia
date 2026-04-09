import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const { driverId, type, amount, description, reservationId } =
      await request.json();

    if (!driverId || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validTypes = ["earning", "payment", "adjustment"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("driver_payments")
      .insert({
        driver_id: driverId,
        reservation_id: reservationId || null,
        type,
        amount: Math.abs(amount),
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Driver payment error:", error);
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ payment: data });
  } catch (err) {
    console.error("Driver payment API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
