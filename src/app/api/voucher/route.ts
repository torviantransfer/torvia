import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildVoucherHTML, generateQRUrlForDownload } from "@/lib/email";
import { buildVoucherData, VOUCHER_SELECT } from "@/lib/voucher-data";
import { verifyAdmin } from "@/lib/admin-auth";

// Statuses a customer may pull their own voucher for. Admins bypass this list so
// they can reprint a voucher for a completed or cancelled transfer.
const PUBLIC_STATUSES = ["paid", "driver_assigned", "passenger_picked_up", "completed"];

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const code = request.nextUrl.searchParams.get("code");
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";

  if (!code) {
    return NextResponse.json({ error: "Missing reservation code" }, { status: 400 });
  }

  const { data: res } = await supabase
    .from("reservations")
    .select(VOUCHER_SELECT)
    .eq("reservation_code", code)
    .single();

  if (!res) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  if (!PUBLIC_STATUSES.includes(res.status as string) && !(await verifyAdmin())) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const emailData = buildVoucherData(res, locale);

  const qrDataUrl = emailData.qrCodeToken
    ? generateQRUrlForDownload(
        `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://torviantransfer.com"}/verify/${emailData.qrCodeToken}`
      )
    : "";

  const html = buildVoucherHTML(emailData, qrDataUrl);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
