import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function esc(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  // Find assignment by link_token
  const { data: assignment } = await supabase
    .from("driver_assignments")
    .select(
      `*,
       drivers(full_name, phone),
       vehicles(plate_number, brand, model),
       reservations(
         reservation_code, trip_type, pickup_datetime, return_datetime,
         flight_code, adults, children, luggage_count, child_seat,
         welcome_sign, welcome_name, hotel_name, hotel_address, notes,
         status,
         customers(first_name, last_name, phone, email),
         regions(name_en, name_tr, distance_km, duration_minutes)
       )`
    )
    .eq("link_token", token)
    .single();

  if (!assignment?.reservations) {
    return new NextResponse("Assignment not found", { status: 404 });
  }

  // Expire voucher 2 hours after transfer completion
  if (assignment.status === "completed" && assignment.completed_at) {
    const completedAt = new Date(assignment.completed_at).getTime();
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    if (now - completedAt > twoHours) {
      return new NextResponse(
        `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Link Expired</title></head><body style="font-family:system-ui;background:#f5f5f7;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
        <div style="background:#fff;border-radius:20px;padding:40px;text-align:center;max-width:400px;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <div style="font-size:48px;margin-bottom:16px">🔒</div>
        <h1 style="font-size:24px;margin:0 0 8px;color:#1d1d1f">Link Expired</h1>
        <p style="color:#888;font-size:14px">This voucher link has expired. Transfer links are deactivated 2 hours after completion.</p>
        <p style="color:#ccc;font-size:11px;margin-top:24px;letter-spacing:2px">TORVIAN VIP TRANSFER</p>
        </div></body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
  }

  const res = assignment.reservations as Record<string, unknown>;
  const customer = res.customers as Record<string, string> | null;
  const region = res.regions as Record<string, unknown> | null;
  const driver = assignment.drivers as Record<string, string> | null;
  const vehicle = assignment.vehicles as Record<string, string> | null;

  const pickupDate = new Date(res.pickup_datetime as string);
  const pickupDateStr = pickupDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const pickupTimeStr = pickupDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let returnInfo = "";
  if (res.trip_type === "round_trip" && res.return_datetime) {
    const retDate = new Date(res.return_datetime as string);
    returnInfo = `
      <div class="detail-row">
        <div class="detail-icon">🔄</div>
        <div>
          <div class="detail-label">Return</div>
          <div class="detail-value">${esc(retDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }))} — ${esc(retDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }))}</div>
        </div>
      </div>`;
  }

  const extras: string[] = [];
  if (res.child_seat) extras.push("🪑 Child Seat");
  if (res.welcome_sign) extras.push(`📋 Welcome Sign: ${esc(String(res.welcome_name || customer?.first_name || ""))}`);

  const extrasHtml = extras.length > 0
    ? `<div class="detail-row">
        <div class="detail-icon">✨</div>
        <div>
          <div class="detail-label">Extras</div>
          <div class="detail-value">${extras.join(" &nbsp;•&nbsp; ")}</div>
        </div>
      </div>`
    : "";

  const notesHtml = res.notes
    ? `<div class="notes-box">📝 ${esc(String(res.notes))}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TORVIAN — Driver Voucher ${res.reservation_code}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f7;
      color: #1d1d1f;
      min-height: 100vh;
      padding: 20px;
    }
    .voucher {
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #1d1d1f 0%, #2a2a2e 100%);
      padding: 28px 24px;
      text-align: center;
      color: #fff;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: 4px;
      margin-bottom: 4px;
    }
    .header .subtitle {
      font-size: 11px;
      letter-spacing: 3px;
      color: #f97316;
      text-transform: uppercase;
      font-weight: 600;
    }
    .status-badge {
      display: inline-block;
      margin-top: 12px;
      padding: 6px 18px;
      background: rgba(249, 115, 22, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.3);
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      color: #f97316;
      letter-spacing: 1px;
    }
    .code-bar {
      background: #f97316;
      padding: 14px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .code-bar .code {
      font-family: 'SF Mono', Menlo, monospace;
      font-size: 20px;
      font-weight: 800;
      color: #fff;
      letter-spacing: 2px;
    }
    .code-bar .trip-type {
      font-size: 11px;
      color: rgba(255,255,255,0.85);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .route-banner {
      padding: 20px 24px;
      background: #fafafa;
      border-bottom: 1px solid #eee;
      text-align: center;
    }
    .route-banner .from-to {
      font-size: 16px;
      font-weight: 700;
      color: #1d1d1f;
    }
    .route-banner .arrow {
      display: inline-block;
      margin: 0 10px;
      color: #f97316;
      font-size: 18px;
    }
    .route-banner .distance {
      font-size: 12px;
      color: #888;
      margin-top: 4px;
    }
    .body { padding: 24px; }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #f0f0f0;
    }
    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }
    .detail-icon {
      font-size: 18px;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .detail-label {
      font-size: 11px;
      color: #888;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-value {
      font-size: 15px;
      font-weight: 600;
      color: #1d1d1f;
      margin-top: 1px;
    }
    .detail-value.highlight {
      color: #f97316;
      font-size: 18px;
      font-weight: 800;
    }
    .customer-card {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 16px;
    }
    .customer-card .name {
      font-size: 16px;
      font-weight: 700;
      color: #0c4a6e;
      margin-bottom: 6px;
    }
    .customer-card .contact {
      font-size: 13px;
      color: #0369a1;
    }
    .customer-card .contact a {
      color: #0369a1;
      text-decoration: none;
      font-weight: 600;
    }
    .vehicle-card {
      background: #f8f8f8;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .vehicle-card .icon { font-size: 28px; }
    .vehicle-card .info .name { font-size: 15px; font-weight: 700; }
    .vehicle-card .info .plate {
      font-family: 'SF Mono', Menlo, monospace;
      font-size: 14px;
      font-weight: 700;
      color: #f97316;
      margin-top: 2px;
    }
    .notes-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 13px;
      color: #92400e;
      margin-top: 12px;
    }
    .divider {
      border: none;
      border-top: 2px dashed #e5e5e5;
      margin: 20px 0;
    }
    .footer {
      background: #fafafa;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid #eee;
    }
    .footer .support {
      font-size: 12px;
      color: #888;
      margin-bottom: 4px;
    }
    .footer .brand {
      font-size: 11px;
      color: #ccc;
      letter-spacing: 2px;
    }
    .print-btn {
      display: block;
      max-width: 600px;
      margin: 8px auto;
      padding: 14px;
      background: #1d1d1f;
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      letter-spacing: 1px;
    }
    .print-btn:hover { background: #333; }
    .save-btn {
      display: block;
      max-width: 600px;
      margin: 8px auto;
      padding: 14px;
      background: #25D366;
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      width: 100%;
      letter-spacing: 1px;
    }
    .save-btn:hover { background: #1da851; }
    .btn-row {
      display: flex;
      gap: 8px;
      max-width: 600px;
      margin: 16px auto;
    }
    .btn-row button { flex: 1; }
    @media print {
      body { background: #fff; padding: 0; }
      .voucher { box-shadow: none; border-radius: 0; }
      .btn-row { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="voucher">
    <div class="header">
      <h1>TORVIAN</h1>
      <div class="subtitle">Driver Transfer Voucher</div>
      <div class="status-badge">TRANSFER ASSIGNMENT</div>
    </div>

    <div class="code-bar">
      <span class="code">${esc(String(res.reservation_code))}</span>
      <span class="trip-type">${res.trip_type === "round_trip" ? "Round Trip" : "One Way"}</span>
    </div>

    <div class="route-banner">
      <div class="from-to">
        ANTALYA AIRPORT (AYT) <span class="arrow">→</span> ${esc(region?.name_en as string ?? "—")}
      </div>
      ${region?.distance_km ? `<div class="distance">~${region.distance_km} km • ${region.duration_minutes} min</div>` : ""}
    </div>

    <div class="body">
      <!-- Pickup Details -->
      <div class="section">
        <div class="section-title">Pickup Details</div>
        <div class="detail-row">
          <div class="detail-icon">📅</div>
          <div>
            <div class="detail-label">Date</div>
            <div class="detail-value">${pickupDateStr}</div>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-icon">⏰</div>
          <div>
            <div class="detail-label">Time</div>
            <div class="detail-value highlight">${pickupTimeStr}</div>
          </div>
        </div>
        ${res.flight_code ? `
        <div class="detail-row">
          <div class="detail-icon">✈️</div>
          <div>
            <div class="detail-label">Flight</div>
            <div class="detail-value">${esc(String(res.flight_code))}</div>
          </div>
        </div>` : ""}
        ${returnInfo}
      </div>

      <!-- Passengers -->
      <div class="section">
        <div class="section-title">Passengers</div>
        <div class="detail-row">
          <div class="detail-icon">👥</div>
          <div>
            <div class="detail-label">Count</div>
            <div class="detail-value">${res.adults} Adults${(res.children as number) > 0 ? `, ${res.children} Children` : ""}</div>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-icon">🧳</div>
          <div>
            <div class="detail-label">Luggage</div>
            <div class="detail-value">${res.luggage_count ?? 0} pcs</div>
          </div>
        </div>
        ${extrasHtml}
      </div>

      <!-- Customer -->
      <div class="section">
        <div class="section-title">Customer</div>
        <div class="customer-card">
          <div class="name">${esc(customer?.first_name)} ${esc(customer?.last_name)}</div>
          <div class="contact">
            📞 <a href="tel:${esc(customer?.phone)}">${esc(customer?.phone) || "—"}</a>
          </div>
        </div>
      </div>

      ${res.hotel_name ? `
      <!-- Hotel -->
      <div class="section">
        <div class="section-title">Destination</div>
        <div class="detail-row">
          <div class="detail-icon">🏨</div>
          <div>
            <div class="detail-label">Hotel</div>
            <div class="detail-value">${esc(String(res.hotel_name))}</div>
            ${res.hotel_address ? `<div style="font-size:12px;color:#888;margin-top:2px">${esc(String(res.hotel_address))}</div>` : ""}
          </div>
        </div>
      </div>` : ""}

      ${notesHtml}

      <hr class="divider">

      <!-- Vehicle & Driver -->
      <div class="section">
        <div class="section-title">Vehicle & Driver</div>
        <div class="vehicle-card">
          <div class="icon">🚗</div>
          <div class="info">
            <div class="name">${esc(vehicle?.brand)} ${esc(vehicle?.model)}</div>
            <div class="plate">${esc(vehicle?.plate_number) || "—"}</div>
          </div>
        </div>
        ${driver ? `
        <div class="detail-row" style="margin-top:12px">
          <div class="detail-icon">👤</div>
          <div>
            <div class="detail-label">Driver</div>
            <div class="detail-value">${esc(driver.full_name)}</div>
            <div style="font-size:12px;color:#888;margin-top:2px">${esc(driver.phone)}</div>
          </div>
        </div>` : ""}
      </div>
    </div>

    <div class="footer">
      <div class="support">24/7 Support: +90 546 940 79 55 | torviantransfer@gmail.com</div>
      <div class="brand">TORVIAN VIP TRANSFER</div>
    </div>
  </div>

  <div class="btn-row">
    <button class="save-btn" onclick="saveAsImage()">📷 Save as Image</button>
    <button class="print-btn" onclick="window.print()">🖨️ Print</button>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script>
    async function saveAsImage() {
      const btn = document.querySelector('.save-btn');
      btn.textContent = '⏳ Generating...';
      btn.disabled = true;
      try {
        const el = document.querySelector('.voucher');
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#f5f5f7',
        });
        const link = document.createElement('a');
        link.download = 'TORVIAN-voucher-${res.reservation_code}.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        btn.textContent = '✅ Saved!';
        setTimeout(() => { btn.textContent = '📷 Save as Image'; btn.disabled = false; }, 2000);
      } catch(e) {
        btn.textContent = '📷 Save as Image';
        btn.disabled = false;
        alert('Error saving image. Try screenshot instead.');
      }
    }
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
