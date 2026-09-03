import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { generatePDFVoucher } from "@/lib/pdf-voucher";
import { buildVoucherData, VOUCHER_SELECT } from "@/lib/voucher-data";

// jsPDF + the bundled Inter fonts are read from disk, so this must not run on the edge.
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const code = request.nextUrl.searchParams.get("code");
  const locale = request.nextUrl.searchParams.get("locale") ?? "tr";

  if (!code) {
    return NextResponse.json({ error: "Missing reservation code" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: res } = await supabase
    .from("reservations")
    .select(VOUCHER_SELECT)
    .eq("reservation_code", code)
    .single();

  if (!res) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  try {
    const pdf = await generatePDFVoucher(buildVoucherData(res, locale));
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="TORVIAN-${code}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("Voucher PDF error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Failed to generate voucher PDF" }, { status: 500 });
  }
}
