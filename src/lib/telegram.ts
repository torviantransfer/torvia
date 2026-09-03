/**
 * TORVIAN Transfer — Telegram Notification Helper
 * Sends beautifully formatted HTML messages to Telegram group
 */
import { formatBookingDateLong, formatBookingTime } from "@/lib/datetime";
import { legEndpoints } from "@/lib/transfer-route";

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

/** Sends an already-formatted HTML message body as-is. */
export async function sendTelegramRaw(text: string): Promise<void> {
  const { getConfig } = await import("@/lib/config");
  const token = await getConfig("telegram_bot_token");
  const chatId = await getConfig("telegram_chat_id");

  if (!token || !chatId || token === "placeholder") return;

  try {
    await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("Telegram sendMessage failed:", err);
  }
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
  } catch (err) {
    console.error("Telegram sendMessage failed:", err);
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

export function notifyNewCashBooking(data: {
  code: string;
  amount: string;
  cashTotal?: string;
  driverAmount?: string;
  email: string;
  region?: string;
}) {
  return sendTelegram({
    icon: "\u{1F4B5}",  // banknote emoji
    title: "DEPOZITLI REZERVASYON",
    fields: [
      { label: "Kod:", value: data.code },
      { label: "Depozit:", value: data.amount },
      { label: "Toplam:", value: data.cashTotal },
      { label: "Soföre:", value: data.driverAmount },
      { label: "E-posta:", value: data.email },
      { label: "Guzergah:", value: data.region },
    ],
    footer: "ARAÇTA ÖDEME",
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
  } catch (err) {
    console.error("Telegram sendDocument failed:", err);
  }
}

// ────────── Build & send driver voucher to Telegram ──────────

export interface DriverVoucherData {
  reservationCode: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
  tripType: "one_way" | "round_trip";
  direction?: string | null;
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
  notes?: string;
}

/**
 * Telegram renders a plain message inline; an HTML attachment has to be
 * downloaded and opened in a browser before anyone can read it. The driver
 * sheet is short enough to be a message, so it is sent as one — and it is also
 * the text an operator can forward straight to a driver on WhatsApp.
 */
function buildDriverVoucherText(data: DriverVoucherData): string {
  const { from, to } = legEndpoints(data.direction, "outbound", data.regionName);
  const passengers =
    `${data.adults} yetiskin` + (data.children > 0 ? ` + ${data.children} cocuk` : "");

  const lines: string[] = [
    `<b>TORVIAN — TRANSFER GOREVI</b>`,
    `<code>${esc(data.reservationCode)}</code>`,
    ``,
    `<b>${esc(from)} → ${esc(to)}</b>`,
    data.distanceKm ? `${data.distanceKm} km · ${data.durationMinutes ?? "?"} dk` : "",
    ``,
    `Tarih : <b>${formatBookingDateLong(data.pickupDatetime)}</b>`,
    `Saat  : <b>${formatBookingTime(data.pickupDatetime)}</b>`,
  ].filter(Boolean);

  if (data.tripType === "round_trip" && data.returnDatetime) {
    lines.push(
      `Donus : <b>${formatBookingDateLong(data.returnDatetime)} ${formatBookingTime(data.returnDatetime)}</b>`
    );
  }
  if (data.flightCode) lines.push(`Ucus  : <b>${esc(data.flightCode)}</b>`);

  lines.push("", `Musteri: <b>${esc(data.customerFirstName)} ${esc(data.customerLastName)}</b>`);
  if (data.customerPhone) lines.push(`Telefon: <b>${esc(data.customerPhone)}</b>`);
  lines.push(`Yolcu  : ${esc(passengers)} · ${data.luggageCount} bagaj`);
  if (data.childSeat) lines.push(`Ekstra : Cocuk koltugu`);

  if (data.hotelName) {
    lines.push("", `Otel: <b>${esc(data.hotelName)}</b>`);
    if (data.hotelAddress) lines.push(esc(data.hotelAddress));
  }
  if (data.notes) lines.push("", `Not: ${esc(data.notes)}`);

  lines.push("", `7/24 Destek: 0546 940 79 55`);
  return lines.join("\n");
}


export async function sendDriverVoucherToTelegram(data: DriverVoucherData): Promise<void> {
  await sendTelegramRaw(buildDriverVoucherText(data));
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
