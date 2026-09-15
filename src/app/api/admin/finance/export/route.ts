import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { todayInBookingTz } from "@/lib/datetime";
import { loadFinance } from "@/lib/financeData";
import { financePdf, financeXlsx } from "@/lib/financeExport";
import { parseRange } from "@/lib/period";

// jsPDF reads the Inter fonts from disk and exceljs needs Node streams: not the edge.
export const runtime = "nodejs";

/** The finance report for a period, as `?format=xlsx` or `?format=pdf`. */
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const sp = request.nextUrl.searchParams;
  const format = sp.get("format") === "pdf" ? "pdf" : "xlsx";
  const today = todayInBookingTz();
  const { range } = parseRange({ from: sp.get("from"), to: sp.get("to"), period: sp.get("period") }, today);

  try {
    const { report } = await loadFinance(createAdminClient(), range, today);
    const file = format === "pdf" ? await financePdf(report) : await financeXlsx(report);
    const filename = `kasa-${range.from ?? "baslangic"}_${range.to ?? "bugun"}.${format}`;
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type":
          format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("Finance export error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Rapor oluşturulamadı." }, { status: 500 });
  }
}
