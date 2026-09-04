import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { legEndpoints } from "@/lib/transfer-route";
import {
  formatBookingDateLong,
  formatBookingTime,
  formatBookingDate,
} from "@/lib/datetime";
import { convertFromUSD, formatEUR } from "@/lib/currency";

function esc(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Line-art icons, sized and coloured by CSS. Emoji rendered differently on every
 * driver's phone and printed as grey blobs; these stay legible on paper.
 */
const ICONS: Record<string, string> = {
  calendar: `<path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  plane: `<path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8L8 11l-2 2H3.5a.5.5 0 0 0-.4.8L6 17l3.2 2.9a.5.5 0 0 0 .8-.4V17l2-2 3.9 3.7a.5.5 0 0 0 .8-.5z"/>`,
  users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>`,
  luggage: `<rect x="6" y="7" width="12" height="14" rx="2"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M10 12v5M14 12v5"/>`,
  hotel: `<path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v16M9 8h.01M15 8h.01M9 12h.01M15 12h.01M10 21v-4h4v4"/>`,
  phone: `<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>`,
  car: `<path d="M5 17h14M5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM23 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/><path d="M3 17v-4l2-5h14l2 5v4"/><path d="M5 12h14"/>`,
  user: `<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>`,
  seat: `<path d="M6 4v8a4 4 0 0 0 4 4h5M6 20h12M18 10v10"/>`,
  note: `<path d="M4 4h16v12l-4 4H4z"/><path d="M20 16h-4v4"/><path d="M8 9h8M8 13h5"/>`,
  cash: `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>`,
  check: `<path d="M20 6 9 17l-5-5"/>`,
  refresh: `<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>`,
};

const icon = (name: string) =>
  `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ""}</svg>`;

/** One label/value line with its icon. */
const row = (name: string, label: string, value: string, strong = false) =>
  value
    ? `<div class="row">${icon(name)}<div class="rt"><span class="lbl">${esc(label)}</span><span class="val${strong ? " big" : ""}">${value}</span></div></div>`
    : "";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const { data: assignment } = await supabase
    .from("driver_assignments")
    .select(
      `*,
       drivers(full_name, phone),
       vehicles(plate_number, brand, model),
       reservations(
         reservation_code, trip_type, direction, pickup_datetime, return_datetime,
         flight_code, return_flight_code, adults, children, luggage_count, child_seat,
         hotel_name, hotel_address, notes,
         status, payment_method, deposit_amount, driver_amount, exchange_rate_eur,
         customers(first_name, last_name, phone, email),
         regions(name_en, name_tr, distance_km, duration_minutes)
       )`
    )
    .eq("link_token", token)
    .single();

  if (!assignment?.reservations) {
    return new NextResponse("Assignment not found", { status: 404 });
  }

  // Single-use operational rule, same as the driver panel. Admins are exempt so
  // they can reprint the sheet for a finished transfer.
  if (assignment.status === "completed" && !(await verifyAdmin())) {
    return new NextResponse(
      `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Transfer Tamamlandı</title></head><body style="font-family:system-ui;background:#f5f5f7;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
      <div style="background:#fff;border:1px solid #e5e5ea;border-radius:16px;padding:40px;text-align:center;max-width:400px">
      <h1 style="font-size:20px;margin:0 0 8px;color:#1d1d1f">Transfer tamamlandı</h1>
      <p style="color:#6e6e73;font-size:14px;margin:0">Bu belge artık kullanılamaz.</p>
      <p style="color:#aeaeb2;font-size:11px;margin-top:24px;letter-spacing:2px;font-weight:700">TORVIAN</p>
      </div></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const res = assignment.reservations as Record<string, unknown>;
  const customer = res.customers as Record<string, string> | null;
  const region = res.regions as Record<string, unknown> | null;
  const driver = assignment.drivers as Record<string, string> | null;
  const vehicle = assignment.vehicles as Record<string, string> | null;

  // The sheet describes THIS assignment's leg. It used to always print the
  // outbound date, time and route, so a return-leg driver was sent on the wrong
  // day in the wrong direction.
  const leg = assignment.leg === "return" ? "return" : "outbound";
  const legDatetime =
    leg === "return" && res.return_datetime
      ? (res.return_datetime as string)
      : (res.pickup_datetime as string);

  const regionLabel =
    (region?.name_tr as string) || (region?.name_en as string) || "—";
  const { from: legFrom, to: legTo } = legEndpoints(res.direction, leg, regionLabel, "tr");

  const isRoundTrip = res.trip_type === "round_trip";
  const legLabel = !isRoundTrip ? "Tek yön" : leg === "return" ? "Dönüş" : "Gidiş";

  const passengers =
    `${res.adults} yetişkin` +
    ((res.children as number) > 0 ? `, ${res.children} çocuk` : "");

  // The other leg is context for the outbound driver, not an instruction.
  const otherLeg =
    leg === "outbound" && isRoundTrip && res.return_datetime
      ? row(
          "refresh",
          "Dönüş (bilgi)",
          `${esc(formatBookingDate(res.return_datetime as string))} — ${esc(formatBookingTime(res.return_datetime as string))}`
        )
      : "";

  // What the driver has to collect. Absent from the sheet until now, so a cash
  // job arrived with no amount attached to it.
  const isCash = res.payment_method === "cash";
  const rate = Number(res.exchange_rate_eur) || 0;
  const asMoney = (usd: unknown) => {
    const dollars = Number(usd) || 0;
    const dollarText = `$${dollars.toFixed(2)}`;
    return rate
      ? `${formatEUR(convertFromUSD(dollars, rate))} <span class="sub" style="display:inline">(${dollarText})</span>`
      : dollarText;
  };

  const paymentBlock = isCash
    ? `<div class="sec cash">
        <div class="sec-t">Araçta nakit tahsilat</div>
        <div class="row">${icon("cash")}<div class="rt"><span class="lbl">Şoför tahsil edecek</span><span class="val big">${asMoney(res.driver_amount)}</span></div></div>
        ${Number(res.deposit_amount) > 0 ? `<div class="row" style="padding-top:0">${icon("check")}<div class="rt"><span class="lbl">Alınan kapora</span><span class="val">${asMoney(res.deposit_amount)}</span></div></div>` : ""}
      </div>`
    : `<div class="sec">
        <div class="sec-t">Ödeme</div>
        <div class="row">${icon("check")}<div class="rt"><span class="lbl">Online alındı</span><span class="val">Araçta tahsilat yok</span></div></div>
      </div>`;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TORVIAN — Transfer Belgesi ${esc(String(res.reservation_code))}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:#f5f5f7;color:#1d1d1f;padding:16px;
    -webkit-font-smoothing:antialiased;
  }
  .sheet{max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e5ea;border-radius:14px;overflow:hidden}

  .head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid #e5e5ea}
  .brand{font-size:15px;font-weight:800;letter-spacing:3px}
  .brand span{display:block;font-size:9px;letter-spacing:2px;color:#8e8e93;font-weight:600;margin-top:2px}
  .code{font-family:'SF Mono',Menlo,Consolas,monospace;font-size:17px;font-weight:700;letter-spacing:1px;text-align:right}
  .code span{display:block;font-size:10px;font-family:inherit;letter-spacing:1px;color:#8e8e93;font-weight:600;text-transform:uppercase;margin-top:2px}

  .route{padding:18px 20px;border-bottom:1px solid #e5e5ea}
  .route .pts{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:700;line-height:1.3}
  .route .arw{color:#8e8e93;flex:0 0 auto}
  .route .meta{font-size:12px;color:#8e8e93;margin-top:6px}

  .when{display:flex;border-bottom:1px solid #e5e5ea}
  .when > div{flex:1;padding:16px 20px}
  .when > div + div{border-left:1px solid #e5e5ea}
  .when .lbl{display:block;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#8e8e93;font-weight:700;margin-bottom:4px}
  .when .v{font-size:15px;font-weight:600}
  .when .v.time{font-size:28px;font-weight:800;letter-spacing:-0.5px;line-height:1}

  .sec{padding:14px 20px;border-bottom:1px solid #e5e5ea}
  .sec:last-of-type{border-bottom:0}
  .sec-t{font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#8e8e93;font-weight:700;margin-bottom:10px}

  .row{display:flex;gap:11px;align-items:flex-start;padding:5px 0}
  .ic{width:17px;height:17px;flex:0 0 auto;color:#8e8e93;margin-top:2px}
  .rt{min-width:0}
  .lbl{display:block;font-size:11px;color:#8e8e93;line-height:1.4}
  .val{display:block;font-size:14px;font-weight:600;line-height:1.4;word-break:break-word}
  .val.big{font-size:16px;font-weight:700}
  .val a{color:inherit;text-decoration:none}
  .sub{display:block;font-size:12px;color:#8e8e93;font-weight:400;margin-top:1px}

  .note{margin:0 20px 14px;padding:11px 13px;background:#fffbeb;border:1px solid #fde68a;border-radius:9px;font-size:13px;line-height:1.5}
  .note b{display:block;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#a16207;margin-bottom:3px}

  .plate{display:inline-block;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:15px;font-weight:700;letter-spacing:1px;border:1.5px solid #1d1d1f;border-radius:5px;padding:2px 8px;margin-top:2px}

  .sec.cash{background:#fffbeb}
  .foot{padding:13px 20px;background:#fafafa;text-align:center;font-size:11px;color:#8e8e93;line-height:1.6}

  .actions{max-width:520px;margin:14px auto 0;display:flex;gap:8px}
  .actions button{flex:1;padding:11px;border:1px solid #d1d1d6;border-radius:9px;background:#fff;font-size:13px;font-weight:600;color:#1d1d1f;cursor:pointer;font-family:inherit}
  .actions button:hover{background:#f5f5f7}

  @media print{
    body{background:#fff;padding:0}
    .sheet{border:0;border-radius:0;max-width:100%}
    .actions{display:none}
  }
</style>
</head>
<body>
<div class="sheet">

  <div class="head">
    <div class="brand">TORVIAN<span>VIP TRANSFER</span></div>
    <div class="code">${esc(String(res.reservation_code))}<span>${esc(legLabel)}</span></div>
  </div>

  <div class="route">
    <div class="pts">
      <span>${esc(legFrom)}</span>
      <svg class="arw" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      <span>${esc(legTo)}</span>
    </div>
    ${region?.distance_km ? `<div class="meta">Yaklaşık ${region.distance_km} km · ${region.duration_minutes} dk</div>` : ""}
  </div>

  <div class="when">
    <div>
      <span class="lbl">Tarih</span>
      <span class="v">${esc(formatBookingDateLong(legDatetime))}</span>
    </div>
    <div>
      <span class="lbl">Alış saati</span>
      <span class="v time">${esc(assignment.pickup_time || formatBookingTime(legDatetime))}</span>
    </div>
  </div>

  <div class="sec">
    <div class="sec-t">Yolcu</div>
    ${row("user", "İsim", `${esc(customer?.first_name)} ${esc(customer?.last_name)}`, true)}
    ${customer?.phone ? row("phone", "Telefon", `<a href="tel:${esc(customer.phone)}">${esc(customer.phone)}</a>`, true) : ""}
    ${row("users", "Kişi", esc(passengers))}
    ${row("luggage", "Bagaj", `${res.luggage_count ?? 0} adet`)}
    ${res.child_seat ? row("seat", "Ekstra", "Çocuk koltuğu istendi") : ""}
  </div>

  <div class="sec">
    <div class="sec-t">Transfer</div>
    ${res.flight_code ? row("plane", "Uçuş kodu", esc(String(res.flight_code)), true) : ""}
    ${res.return_flight_code ? row("plane", "Dönüş uçuş kodu", esc(String(res.return_flight_code)), true) : ""}
    ${
      res.hotel_name
        ? `<div class="row">${icon("hotel")}<div class="rt"><span class="lbl">Otel</span><span class="val">${esc(String(res.hotel_name))}</span>${res.hotel_address ? `<span class="sub">${esc(String(res.hotel_address))}</span>` : ""}</div></div>`
        : ""
    }
    ${otherLeg}
  </div>

  ${
    res.notes
      ? `<div class="note"><b>Müşteri notu</b>${esc(String(res.notes))}</div>`
      : ""
  }

  ${paymentBlock}

  <div class="sec">
    <div class="sec-t">Araç &amp; Şoför</div>
    ${
      vehicle
        ? `<div class="row">${icon("car")}<div class="rt"><span class="lbl">${esc(vehicle.brand)} ${esc(vehicle.model)}</span><span class="plate">${esc(vehicle.plate_number)}</span></div></div>`
        : ""
    }
    ${
      driver
        ? `<div class="row">${icon("user")}<div class="rt"><span class="lbl">Şoför</span><span class="val">${esc(driver.full_name)}</span><span class="sub">${esc(driver.phone)}</span></div></div>`
        : ""
    }
  </div>

  <div class="foot">
    7/24 Destek: 0546 940 79 55<br>torviantransfer@gmail.com
  </div>
</div>

<div class="actions">
  <button onclick="window.print()">Yazdır / PDF</button>
  <button onclick="copyText()" id="cp">Metni kopyala</button>
</div>

<script>
  // Lets an operator paste the same details straight into WhatsApp.
  var SUMMARY = ${JSON.stringify(
    [
      `TORVIAN — Transfer Görevi (${legLabel})`,
      ``,
      `Kod: ${res.reservation_code}`,
      `${legFrom} -> ${legTo}`,
      `Tarih: ${formatBookingDateLong(legDatetime)}`,
      `Alış saati: ${assignment.pickup_time || formatBookingTime(legDatetime)}`,
      res.flight_code ? `Uçuş: ${res.flight_code}` : "",
      res.return_flight_code ? `Dönüş uçuşu: ${res.return_flight_code}` : "",
      ``,
      `Müşteri: ${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim(),
      customer?.phone ? `Telefon: ${customer.phone}` : "",
      `Yolcu: ${passengers} · ${res.luggage_count ?? 0} bagaj`,
      res.child_seat ? `Çocuk koltuğu istendi` : "",
      res.hotel_name ? `Otel: ${res.hotel_name}` : "",
      res.hotel_address ? `Adres: ${res.hotel_address}` : "",
      res.notes ? `Not: ${res.notes}` : "",
      vehicle ? `Araç: ${vehicle.brand} ${vehicle.model} — ${vehicle.plate_number}` : "",
      isCash
        ? `ARAÇTA NAKİT TAHSİLAT: ${rate ? formatEUR(convertFromUSD(Number(res.driver_amount) || 0, rate)) : ""} ($${(Number(res.driver_amount) || 0).toFixed(2)})`
        : `Ödeme: Online alındı — araçta tahsilat yok.`,
    ]
      .filter((line) => line !== "" || true)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  )};

  function copyText() {
    var b = document.getElementById('cp');
    navigator.clipboard.writeText(SUMMARY).then(function () {
      b.textContent = 'Kopyalandı';
      setTimeout(function () { b.textContent = 'Metni kopyala'; }, 2000);
    });
  }
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
