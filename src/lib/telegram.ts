/**
 * TORVIAN Transfer — Telegram Notification Helper
 * Sends beautifully formatted HTML messages to Telegram group
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

function esc(text: string | number | null | undefined): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface TelegramMessageOptions {
  title: string;
  icon: string;
  fields: { label: string; value: string | number | null | undefined }[];
  footer?: string;
}

function buildHTML({ title, icon, fields, footer }: TelegramMessageOptions): string {
  const lines: string[] = [];

  // Header with icon
  lines.push(`${icon} <b>${esc(title)}</b>`);
  lines.push("━━━━━━━━━━━━━━━━━━━━");

  // Fields
  for (const f of fields) {
    if (f.value === null || f.value === undefined || f.value === "") continue;
    lines.push(`${esc(f.label)}  <b>${esc(f.value)}</b>`);
  }

  // Footer with timestamp
  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━");
  const now = new Date();
  const ts = now.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  lines.push(`${footer ? esc(footer) + " | " : ""}${ts}`);

  return lines.join("\n");
}

export async function sendTelegram(options: TelegramMessageOptions): Promise<void> {
  const { getConfig } = await import("@/lib/config");
  const token = await getConfig("telegram_bot_token");
  const chatId = await getConfig("telegram_chat_id");

  if (!token || !chatId || token === "placeholder") return;

  const html = buildHTML(options);

  try {
    await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // Telegram failure should never block business logic
  }
}

// ────────── Pre-built notification types ──────────

export function notifyNewPayment(data: {
  code: string;
  amount: string;
  email: string;
  region?: string;
}) {
  return sendTelegram({
    icon: "\u{1F4B3}",  // credit card emoji
    title: "ODEME ALINDI",
    fields: [
      { label: "Kod:", value: data.code },
      { label: "Tutar:", value: data.amount },
      { label: "E-posta:", value: data.email },
      { label: "Guzergah:", value: data.region },
    ],
  });
}

export function notifyDriverAssigned(data: {
  code: string;
  driver: string;
  destination: string;
  date: string;
  vehicle?: string;
}) {
  return sendTelegram({
    icon: "\u{1F698}",  // car emoji
    title: "SOFOR ATANDI",
    fields: [
      { label: "Kod:", value: data.code },
      { label: "Sofor:", value: data.driver },
      { label: "Arac:", value: data.vehicle },
      { label: "Guzergah:", value: data.destination },
      { label: "Tarih:", value: data.date },
    ],
  });
}

export function notifyDriverStatus(data: {
  code: string;
  driver: string;
  status: string;
}) {
  const statusMap: Record<string, { icon: string; label: string }> = {
    accepted:   { icon: "\u2705", label: "SOFOR KABUL ETTI" },
    picked_up:  { icon: "\u{1F698}", label: "YOLCU ALINDI" },
    completed:  { icon: "\u{1F3C1}", label: "TRANSFER TAMAMLANDI" },
  };
  const info = statusMap[data.status] ?? { icon: "\u{1F504}", label: `DURUM: ${data.status.toUpperCase()}` };

  return sendTelegram({
    icon: info.icon,
    title: info.label,
    fields: [
      { label: "Kod:", value: data.code },
      { label: "Sofor:", value: data.driver },
    ],
  });
}

export function notifyCancelRequest(data: {
  code: string;
  customer: string;
  route: string;
  pickup: string;
  previousStatus: string;
  reason?: string;
}) {
  return sendTelegram({
    icon: "\u{1F6D1}",  // stop sign
    title: "IPTAL TALEBI",
    fields: [
      { label: "Kod:", value: data.code },
      { label: "Musteri:", value: data.customer },
      { label: "Guzergah:", value: data.route },
      { label: "Alinma:", value: data.pickup },
      { label: "Onceki Durum:", value: data.previousStatus },
      { label: "Sebep:", value: data.reason },
    ],
  });
}

export function notifyCancelAction(data: {
  action: "approve" | "reject";
  code: string;
  customer: string;
  admin: string;
}) {
  const isApprove = data.action === "approve";
  return sendTelegram({
    icon: isApprove ? "\u2705" : "\u274C",
    title: isApprove ? "IPTAL ONAYLANDI" : "IPTAL REDDEDILDI",
    fields: [
      { label: "Kod:", value: data.code },
      { label: "Musteri:", value: data.customer },
      { label: "Admin:", value: data.admin },
    ],
  });
}

export function notifyContactForm(data: {
  name: string;
  email: string;
  message: string;
}) {
  return sendTelegram({
    icon: "\u{1F4E9}",  // envelope
    title: "ILETISIM FORMU",
    fields: [
      { label: "Isim:", value: data.name },
      { label: "E-posta:", value: data.email },
      { label: "Mesaj:", value: data.message },
    ],
  });
}

// ────────── Send HTML document to Telegram ──────────

export async function sendTelegramDocument(
  htmlContent: string,
  filename: string,
  caption?: string
): Promise<void> {
  const { getConfig } = await import("@/lib/config");
  const token = await getConfig("telegram_bot_token");
  const chatId = await getConfig("telegram_chat_id");

  if (!token || !chatId || token === "placeholder") return;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("document", blob, filename);
  if (caption) {
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");
  }

  try {
    await fetch(`${TELEGRAM_API}${token}/sendDocument`, {
      method: "POST",
      body: formData,
    });
  } catch {
    // Telegram failure should never block business logic
  }
}

// ────────── Build & send driver voucher to Telegram ──────────

export interface DriverVoucherData {
  reservationCode: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
  tripType: "one_way" | "round_trip";
  pickupDatetime: string;
  returnDatetime?: string;
  flightCode?: string;
  hotelName?: string;
  hotelAddress?: string;
  regionName: string;
  distanceKm?: number;
  durationMinutes?: number;
  adults: number;
  children: number;
  luggageCount: number;
  childSeat: boolean;
  welcomeSign: boolean;
  welcomeName?: string;
  notes?: string;
}

function buildDriverVoucherHTML(data: DriverVoucherData): string {
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
        <td style="padding:8px 16px;font-size:14px;font-weight:600;color:#1d1d1f;">${esc(retDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }))} — ${esc(retDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }))}</td>
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

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#1d1d1f,#2a2a2e);padding:24px;text-align:center;color:#fff;">
      <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:4px;">TORVIAN</h1>
      <div style="font-size:11px;letter-spacing:3px;color:#f97316;text-transform:uppercase;font-weight:600;margin-top:4px;">Transfer Voucher</div>
    </td>
  </tr>

  <!-- Code Bar -->
  <tr>
    <td style="background:#f97316;padding:12px 24px;">
      <table width="100%"><tr>
        <td style="font-family:monospace;font-size:20px;font-weight:800;color:#fff;letter-spacing:2px;">${esc(data.reservationCode)}</td>
        <td style="text-align:right;font-size:11px;color:rgba(255,255,255,0.85);font-weight:600;text-transform:uppercase;letter-spacing:1px;">${data.tripType === "round_trip" ? "Round Trip" : "One Way"}</td>
      </tr></table>
    </td>
  </tr>

  <!-- Route -->
  <tr>
    <td style="padding:16px 24px;background:#fafafa;border-bottom:1px solid #eee;text-align:center;">
      <div style="font-size:16px;font-weight:700;color:#1d1d1f;">AYT <span style="color:#f97316;">&rarr;</span> ${esc(data.regionName)}</div>
      ${data.distanceKm ? `<div style="font-size:12px;color:#888;margin-top:4px;">~${data.distanceKm} km | ${data.durationMinutes} min</div>` : ""}
    </td>
  </tr>

  <!-- Details -->
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

      <!-- Customer -->
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

  <!-- Footer -->
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

export async function sendDriverVoucherToTelegram(data: DriverVoucherData): Promise<void> {
  const html = buildDriverVoucherHTML(data);
  const caption = `<b>YENI SIPARIS VOUCHER</b>\n\n` +
    `Kod: <b>${esc(data.reservationCode)}</b>\n` +
    `Musteri: <b>${esc(data.customerFirstName)} ${esc(data.customerLastName)}</b>\n` +
    `Guzergah: <b>${esc(data.regionName)}</b>\n` +
    `Tarih: <b>${new Date(data.pickupDatetime).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</b>` +
    (data.flightCode ? `\nUcus: <b>${esc(data.flightCode)}</b>` : "");

  await sendTelegramDocument(
    html,
    `TORVIAN-voucher-${data.reservationCode}.html`,
    caption
  );
}

// ────────── Send price list table to Telegram ──────────

export async function sendPriceListToTelegram(
  regions: { name: string; costTL: number; costUSD: number }[],
  driverName?: string,
  vehiclePlate?: string,
): Promise<void> {
  const { getConfig } = await import("@/lib/config");
  const token = await getConfig("telegram_bot_token");
  const chatId = await getConfig("telegram_chat_id");

  if (!token || !chatId || token === "placeholder") return;

  const lines: string[] = [];
  lines.push(`<b>TORVIAN TRANSFER — MALIYET LISTESI</b>`);
  if (driverName) lines.push(`<b>SOFOR ${esc(driverName).toUpperCase()}</b>${vehiclePlate ? ` | ${esc(vehiclePlate)}` : ""}`);
  lines.push("");
  lines.push("<pre>");
  lines.push(`${'BOLGE'.padEnd(16)} ${'TL'.padStart(8)} ${'USD'.padStart(8)}`);
  lines.push("─".repeat(34));
  for (const r of regions) {
    const name = esc(r.name).length > 14 ? esc(r.name).slice(0, 13) + "…" : esc(r.name);
    const tl = r.costTL.toLocaleString("tr-TR");
    const usd = r.costUSD.toFixed(2);
    lines.push(`${name.padEnd(16)} ${tl.padStart(8)} ${usd.padStart(8)}`);
  }
  lines.push("─".repeat(34));
  lines.push("</pre>");
  lines.push(`${new Date().toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}`);

  const text = lines.join("\n");

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    // Try to pin the message
    const json = await res.json();
    if (json.ok && json.result?.message_id) {
      await fetch(`${TELEGRAM_API}${token}/pinChatMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: json.result.message_id,
          disable_notification: true,
        }),
      }).catch(() => {});
    }
  } catch {
    // Telegram failure should never block business logic
  }
}
