import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { todayInBookingTz } from "@/lib/datetime";
import { parseRange } from "@/lib/driverStatement";
import { loadDriverStatement } from "@/lib/driverStatementData";
import { statementPdf, statementXlsx } from "@/lib/driverStatementExport";

// jsPDF reads the Inter fonts from disk and exceljs needs Node streams: not the edge.
export const runtime = "nodejs";

/** "Şükrü Yılmaz" -> "sukru-yilmaz", for a filename every system accepts. */
function slug(value: string): string {
  return (
    value
      .replace(/ı/g, "i")
      .replace(/İ/g, "I")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "sofor"
  );
}

/** One driver's statement for a period, as `?format=xlsx` or `?format=pdf`. */
export async function GET(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const sp = request.nextUrl.searchParams;
  const driverId = sp.get("driverId");
  if (!driverId) return NextResponse.json({ error: "Şoför belirtilmedi." }, { status: 400 });

  const format = sp.get("format") === "pdf" ? "pdf" : "xlsx";
  const today = todayInBookingTz();
  const { range } = parseRange({ from: sp.get("from"), to: sp.get("to"), period: sp.get("period") }, today);

  try {
    const loaded = await loadDriverStatement(createAdminClient(), driverId, range, today);
    if (!loaded) return NextResponse.json({ error: "Şoför bulunamadı." }, { status: 404 });

    const { statement } = loaded;
    const file = format === "pdf" ? await statementPdf(statement) : await statementXlsx(statement);
    const period = [range.from ?? "baslangic", range.to ?? "bugun"].join("_");
    const filename = `cari-${slug(statement.driver.name)}-${period}.${format}`;

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type":
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("Driver statement export error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Ekstre oluşturulamadı." }, { status: 500 });
  }
}
