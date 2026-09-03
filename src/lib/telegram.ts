/**
 * TORVIAN Transfer — Telegram Notification Helper
 * Sends beautifully formatted HTML messages to Telegram group
 */
import { formatBookingDate, formatBookingTime } from "@/lib/datetime";
import { legEndpoints } from "@/lib/transfer-route";
import { convertFromUSD, formatEUR } from "@/lib/currency";

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

// Amounts are deliberately absent from every group message: the transfer group
// is where drivers pick up jobs, and the operator reads the money in the panel.
export function notifyNewPayment(data: {
  code: string;
  email: string;
  region?: string;
}) {
  return sendTelegram({
    icon: "\u2705",
    title: "ODEME ALINDI",
    fields: [
      { label: "Kod:", value: data.code },
      { label: "E-posta:", value: data.email },
      { label: "Guzergah:", value: data.region },
    ],
  });
}

export function notifyNewCashBooking(data: {
  code: string;
  email: string;
  region?: string;
}) {
  return sendTelegram({
    icon: "\u2705",
    title: "DEPOZITLI REZERVASYON",
    fields: [
      { label: "Kod:", value: data.code },
      { label: "E-posta:", value: data.email },
      { label: "Guzergah:", value: data.region },
    ],
    footer: "ARACTA ODEME",
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
  /** Hotel pickup time agreed for the return leg, when one has been set. */
  returnPickupTime?: string | null;
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
  /** "cash" means the driver collects the balance in the vehicle. */
  paymentMethod?: string | null;
  /** USD, as stored. Only meaningful for a cash booking. */
  depositAmountUsd?: number | null;
  driverAmountUsd?: number | null;
  /** EUR per one USD, captured at booking time. */
  exchangeRateEur?: number | null;
}

/** Clock face matching the time, e.g. 10:10 -> 🕙 and 06:30 -> 🕡. */
function clockEmoji(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h)) return "\u{1F550}";
  const hour12 = ((h + 11) % 12) + 1;
  // U+1F550 is 1 o'clock and U+1F55C is 1:30, so each series starts at hour 1.
  const base = m >= 30 ? 0x1f55c : 0x1f550;
  return String.fromCodePoint(base + (hour12 - 1));
}

/** "26.09.2026 Cumartesi" */
function longDay(value: string): string {
  const weekday = new Date(value).toLocaleDateString("tr-TR", {
    timeZone: "UTC",
    weekday: "long",
  });
  return `${formatBookingDate(value)} ${weekday}`;
}

/**
 * Cash is quoted the way the customer was quoted it — the voucher they hold is
 * in euro — with the stored dollar amount alongside, since that is the figure
 * the panel and the books carry.
 */
function amountPair(usd: number | null | undefined, ratePerUsd: number | null | undefined): string {
  const dollars = Number(usd) || 0;
  const dollarText = `$${dollars.toFixed(2)}`;
  if (!ratePerUsd) return dollarText;
  return `${formatEUR(convertFromUSD(dollars, ratePerUsd))} (${dollarText})`;
}

/**
 * The message the transfer group reads.
 *
 * It deliberately carries no prices: the operator sees those in the panel, and
 * this message is what drivers pick a job from, so money does not belong in it.
 */
export function buildTransferMessage(data: DriverVoucherData): string {
  const out = legEndpoints(data.direction, "outbound", data.regionName);
  const ret = legEndpoints(data.direction, "return", data.regionName);
  const isRoundTrip = data.tripType === "round_trip" && !!data.returnDatetime;

  const passengers =
    `${data.adults} Yetişkin` + (data.children > 0 ? `, ${data.children} Çocuk` : "");

  const L: string[] = [];
  L.push(`<b>${esc(data.reservationCode)}</b>`, "");

  // ── outbound ──
  L.push(`<b>${isRoundTrip ? "GİDİŞ TRANSFERİ" : "TRANSFER"}</b>`, "");
  L.push(`📅 ${esc(longDay(data.pickupDatetime))}`);
  if (data.flightCode) L.push(`✈️ Uçuş Kodu: ${esc(data.flightCode)}`);

  // Leaving the airport, the time is the flight's; leaving a hotel it is when
  // the driver collects the passenger — so the label cannot be fixed.
  const outTime = formatBookingTime(data.pickupDatetime);
  const outFromAirport = out.from !== data.regionName;
  L.push(
    `${clockEmoji(outTime)} ${outFromAirport ? "Uçuş Saati" : "Otelden Alınış Saati"}: ${esc(outTime)}`
  );
  L.push(`📍 ${esc(out.from)} → ${esc(out.to)}`);
  if (data.hotelName) L.push(`🏨 Otel: ${esc(data.hotelName)}`);
  L.push(`👥 ${esc(passengers)}`);
  L.push(`🧳 ${data.luggageCount} Bagaj`);
  if (data.childSeat) L.push(`🪑 Çocuk koltuğu istendi`);

  // ── return ──
  if (isRoundTrip) {
    L.push("", `<b>DÖNÜŞ TRANSFERİ</b>`, "");
    L.push(`📅 ${esc(longDay(data.returnDatetime!))}`);

    const retTime = data.returnPickupTime || formatBookingTime(data.returnDatetime!);
    const retFromAirport = ret.from !== data.regionName;
    L.push(
      `${clockEmoji(retTime)} ${retFromAirport ? "Uçuş Saati" : "Otelden Alınış Saati"}: ${esc(retTime)}`
    );
    L.push(`📍 ${esc(ret.from)} → ${esc(ret.to)}`);
    if (data.hotelName) L.push(`🏨 Otel: ${esc(data.hotelName)}`);
    if (!retFromAirport) L.push(`✈️ Dönüş uçuş saati kontrol edilecektir.`);
  }

  // ── customer ──
  L.push("", `👤 ${esc(data.customerFirstName)} ${esc(data.customerLastName)}`);
  if (data.customerPhone) L.push(`📞 Telefon: ${esc(data.customerPhone)}`);

  // ── payment ──
  // The group is read by the operator first and only forwarded to drivers on
  // approval, so the cash figure belongs here: whoever takes the job has to know
  // what to collect in the vehicle. Online bookings say so explicitly, so nobody
  // asks a prepaid passenger for money.
  if (data.paymentMethod === "cash") {
    L.push("", `\u{1F4B5} <b>ARA\u00c7TA NAK\u0130T TAHS\u0130LAT</b>`);
    L.push(
      `\u015e\u00f6f\u00f6r tahsil edecek: <b>${amountPair(data.driverAmountUsd, data.exchangeRateEur)}</b>`
    );
    if ((data.depositAmountUsd ?? 0) > 0) {
      L.push(`Al\u0131nan kapora: ${amountPair(data.depositAmountUsd, data.exchangeRateEur)}`);
    }
  } else {
    L.push("", `\u{1F4B3} \u00d6deme: Online al\u0131nd\u0131 \u2014 ara\u00e7ta tahsilat yok.`);
  }

  if (data.notes) L.push("", `📝 Not: ${esc(data.notes)}`);

  return L.join("\n");
}

export async function sendDriverVoucherToTelegram(data: DriverVoucherData): Promise<void> {
  await sendTelegramRaw(buildTransferMessage(data));
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
