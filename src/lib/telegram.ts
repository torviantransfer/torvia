/**
 * TORVIAN Transfer — Telegram Notification Helper
 * Sends beautifully formatted HTML messages to admin Telegram
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
