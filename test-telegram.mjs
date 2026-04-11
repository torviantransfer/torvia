/**
 * Telegram Test Script — Sends sample notifications to verify the bot
 * Run: node test-telegram.mjs
 */

const TOKEN = "8747170445:AAEE3ivmdB2dJOZ-nXWjPwqje2-fFjcUSSI";
const CHAT_ID = "-1003819202596"; // TORVİAN grubu (supergroup)
const API = `https://api.telegram.org/bot${TOKEN}`;

function esc(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendMessage(text) {
  const res = await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  return res.json();
}

async function sendDocument(htmlContent, filename, caption) {
  const blob = new Blob([htmlContent], { type: "text/html" });
  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("document", blob, filename);
  if (caption) {
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");
  }
  const res = await fetch(`${API}/sendDocument`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─────────── TEST DATA ───────────

async function main() {
  const ts = () => new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  console.log("Sending test notifications...\n");

  // 1) ODEME ALINDI
  console.log("1) Odeme alindi...");
  await sendMessage(
    `\u{1F4B3} <b>ODEME ALINDI</b>\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    `Kod:  <b>TRV-28471</b>\n` +
    `Tutar:  <b>85.00 USD</b>\n` +
    `E-posta:  <b>john.doe@gmail.com</b>\n` +
    `Guzergah:  <b>Belek</b>\n\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    ts()
  );
  await sleep(1500);

  // 2) VOUCHER (fiyatsiz HTML dosya)
  console.log("2) Voucher (HTML dosya)...");
  const voucherHTML = buildDriverVoucherHTML({
    reservationCode: "TRV-28471",
    customerFirstName: "John",
    customerLastName: "Doe",
    customerPhone: "+44 7911 123456",
    tripType: "round_trip",
    pickupDatetime: "2026-04-15T14:30:00",
    returnDatetime: "2026-04-22T10:00:00",
    flightCode: "TK 1234",
    hotelName: "Regnum Carya Golf & Spa Resort",
    hotelAddress: "Belek, Serik, Antalya",
    regionName: "Belek",
    distanceKm: 35,
    durationMinutes: 35,
    adults: 2,
    children: 1,
    luggageCount: 3,
    childSeat: true,
    notes: "VIP customer, needs wheelchair accessible vehicle",
  });

  const caption =
    `<b>YENI SIPARIS VOUCHER</b>\n\n` +
    `Kod: <b>TRV-28471</b>\n` +
    `Musteri: <b>John Doe</b>\n` +
    `Guzergah: <b>Belek</b>\n` +
    `Tarih: <b>15.04.2026 14:30</b>\n` +
    `Ucus: <b>TK 1234</b>`;

  await sendDocument(voucherHTML, "TORVIAN-voucher-TRV-28471.html", caption);
  await sleep(1500);

  // 3) SOFOR ATANDI
  console.log("3) Sofor atandi...");
  await sendMessage(
    `\u{1F698} <b>SOFOR ATANDI</b>\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    `Kod:  <b>TRV-28471</b>\n` +
    `Sofor:  <b>Beytullah</b>\n` +
    `Arac:  <b>Mercedes Vito - 07 CJD 037</b>\n` +
    `Guzergah:  <b>Belek</b>\n` +
    `Tarih:  <b>15.04.2026 14:30</b>\n\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    ts()
  );
  await sleep(1500);

  // 4) SOFOR KABUL ETTI
  console.log("4) Sofor kabul etti...");
  await sendMessage(
    `\u2705 <b>SOFOR KABUL ETTI</b>\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    `Kod:  <b>TRV-28471</b>\n` +
    `Sofor:  <b>Beytullah</b>\n\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    ts()
  );
  await sleep(1500);

  // 5) IPTAL TALEBI
  console.log("5) Iptal talebi...");
  await sendMessage(
    `\u{1F6D1} <b>IPTAL TALEBI</b>\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    `Kod:  <b>TRV-28471</b>\n` +
    `Musteri:  <b>John Doe</b>\n` +
    `Guzergah:  <b>Belek</b>\n` +
    `Tarih:  <b>15.04.2026 14:30</b>\n` +
    `Sebep:  <b>Flight cancelled</b>\n\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    ts()
  );
  await sleep(1500);

  // 6) IPTAL ONAYLANDI
  console.log("6) Iptal onaylandi...");
  await sendMessage(
    `\u274C <b>IPTAL ONAYLANDI</b>\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    `Kod:  <b>TRV-28471</b>\n` +
    `Musteri:  <b>John Doe</b>\n` +
    `Admin:  <b>Luck</b>\n\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    ts()
  );
  await sleep(1500);

  // 7) ILETISIM FORMU
  console.log("7) Iletisim formu...");
  await sendMessage(
    `\u{1F4E9} <b>ILETISIM FORMU</b>\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    `Isim:  <b>Anna Schmidt</b>\n` +
    `E-posta:  <b>anna@example.de</b>\n` +
    `Mesaj:  <b>Can you arrange a transfer from Antalya to Kemer?</b>\n\n` +
    `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
    ts()
  );

  console.log("\nTamamlandi! Telegram grubunu kontrol et.");
}

// ─── Build driver voucher HTML (emojisiz, sade) ───

function buildDriverVoucherHTML(data) {
  const pickupDate = new Date(data.pickupDatetime);
  const pickupDateStr = pickupDate.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const pickupTimeStr = pickupDate.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });

  let returnInfo = "";
  if (data.tripType === "round_trip" && data.returnDatetime) {
    const retDate = new Date(data.returnDatetime);
    returnInfo = `
      <tr>
        <td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;">Return</td>
        <td style="padding:8px 16px;font-size:14px;font-weight:600;color:#1d1d1f;">${retDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} — ${retDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</td>
      </tr>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TORVIAN — Voucher ${esc(data.reservationCode)}</title>
</head>
<body style="margin:0;padding:20px;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <tr>
    <td style="background:linear-gradient(135deg,#1d1d1f,#2a2a2e);padding:24px;text-align:center;color:#fff;">
      <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:4px;">TORVIAN</h1>
      <div style="font-size:11px;letter-spacing:3px;color:#f97316;text-transform:uppercase;font-weight:600;margin-top:4px;">Transfer Voucher</div>
    </td>
  </tr>

  <tr>
    <td style="background:#f97316;padding:12px 24px;">
      <table width="100%"><tr>
        <td style="font-family:monospace;font-size:20px;font-weight:800;color:#fff;letter-spacing:2px;">${esc(data.reservationCode)}</td>
        <td style="text-align:right;font-size:11px;color:rgba(255,255,255,0.85);font-weight:600;text-transform:uppercase;letter-spacing:1px;">${data.tripType === "round_trip" ? "Round Trip" : "One Way"}</td>
      </tr></table>
    </td>
  </tr>

  <tr>
    <td style="padding:16px 24px;background:#fafafa;border-bottom:1px solid #eee;text-align:center;">
      <div style="font-size:16px;font-weight:700;color:#1d1d1f;">AYT &rarr; ${esc(data.regionName)}</div>
      ${data.distanceKm ? `<div style="font-size:12px;color:#888;margin-top:4px;">~${data.distanceKm} km | ${data.durationMinutes} min</div>` : ""}
    </td>
  </tr>

  <tr>
    <td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr><td colspan="2" style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;padding-bottom:10px;border-bottom:1px solid #f0f0f0;">Transfer Details</td></tr>
        <tr>
          <td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;">Date</td>
          <td style="padding:8px 16px;font-size:14px;font-weight:600;color:#1d1d1f;">${pickupDateStr}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;">Time</td>
          <td style="padding:8px 16px;font-size:18px;font-weight:800;color:#f97316;">${pickupTimeStr}</td>
        </tr>
        ${data.flightCode ? `<tr>
          <td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;">Flight</td>
          <td style="padding:8px 16px;font-size:14px;font-weight:600;color:#1d1d1f;">${esc(data.flightCode)}</td>
        </tr>` : ""}
        ${returnInfo}
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr><td colspan="2" style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;padding-bottom:10px;border-bottom:1px solid #f0f0f0;">Passengers</td></tr>
        <tr>
          <td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;">Pax</td>
          <td style="padding:8px 16px;font-size:14px;font-weight:600;color:#1d1d1f;">${data.adults} Adults${data.children > 0 ? `, ${data.children} Children` : ""}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;">Luggage</td>
          <td style="padding:8px 16px;font-size:14px;font-weight:600;color:#1d1d1f;">${data.luggageCount} pcs</td>
        </tr>
        ${data.childSeat ? `<tr>
          <td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;">Child Seat</td>
          <td style="padding:8px 16px;font-size:14px;font-weight:600;color:#1d1d1f;">Yes</td>
        </tr>` : ""}
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr><td colspan="2" style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;padding-bottom:10px;border-bottom:1px solid #f0f0f0;">Customer</td></tr>
        <tr>
          <td colspan="2" style="padding:12px 16px;">
            <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:14px 16px;">
              <div style="font-size:16px;font-weight:700;color:#0c4a6e;margin-bottom:4px;">${esc(data.customerFirstName)} ${esc(data.customerLastName)}</div>
              ${data.customerPhone ? `<div style="font-size:13px;color:#0369a1;">${esc(data.customerPhone)}</div>` : ""}
            </div>
          </td>
        </tr>
      </table>

      ${data.hotelName ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr><td colspan="2" style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;padding-bottom:10px;border-bottom:1px solid #f0f0f0;">Destination</td></tr>
        <tr>
          <td style="padding:8px 16px;color:#888;font-size:12px;text-transform:uppercase;">Hotel</td>
          <td style="padding:8px 16px;font-size:14px;font-weight:600;color:#1d1d1f;">${esc(data.hotelName)}</td>
        </tr>
        ${data.hotelAddress ? `<tr>
          <td style="padding:8px 16px;color:#888;font-size:12px;"></td>
          <td style="padding:0 16px;font-size:12px;color:#888;">${esc(data.hotelAddress)}</td>
        </tr>` : ""}
      </table>` : ""}

      ${data.notes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;font-size:13px;color:#92400e;">${esc(data.notes)}</div>` : ""}
    </td>
  </tr>

  <tr>
    <td style="background:#fafafa;padding:16px 24px;text-align:center;border-top:1px solid #eee;">
      <div style="font-size:12px;color:#888;">24/7 Support: 0850 840 1327 | torviantransfer@gmail.com</div>
      <div style="font-size:11px;color:#ccc;letter-spacing:2px;margin-top:4px;">TORVIAN VIP TRANSFER</div>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}

main().catch(console.error);
