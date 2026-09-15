/**
 * TORVIAN Transfer — Telegram Notification Helper
 * Sends beautifully formatted HTML messages to Telegram group
 */
import { formatBookingDate, formatBookingTime } from "@/lib/datetime";
import { legEndpoints } from "@/lib/transfer-route";
import { convertFromUSD, formatEUR, formatMoney } from "@/lib/currency";

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

/**
 * A declined card. Unlike every other notification here this one is a
 * prompt to act: the customer wanted the transfer, filled the whole form and
 * got as far as the card, and a call back while they are still deciding is
 * worth more than the row it leaves in the log. Hence the phone number.
 */
export function notifyPaymentFailed(data: {
  code: string;
  email: string;
  phone?: string;
  name?: string;
  region?: string;
  reason?: string;
}) {
  return sendTelegram({
    icon: "\u26A0",
    title: "ODEME BASARISIZ",
    fields: [
      { label: "Kod:", value: data.code },
      { label: "Musteri:", value: data.name },
      { label: "Telefon:", value: data.phone },
      { label: "E-posta:", value: data.email },
      { label: "Guzergah:", value: data.region },
      { label: "Sebep:", value: data.reason },
    ],
    footer: "REZERVASYON BEKLEMEDE - MUSTERI ARANABILIR",
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
  returnFlightCode?: string;
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
  /** As stored, in the reservation's own currency. Only for a cash booking. */
  depositAmountUsd?: number | null;
  driverAmountUsd?: number | null;
  /** "EUR" since the euro switch, "USD" on everything taken before it. */
  currency?: string | null;
  /** EUR per one USD, captured at booking time. Null on euro rows. */
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
 * in euro — which is what the driver has to collect.
 *
 * A reservation taken since the euro switch is already in euro and is printed
 * as it stands. An older one is in dollars, and then both figures are shown:
 * the euro the passenger hands over, and the dollar amount the panel and the
 * books carry. Reading the row's currency is what keeps the two apart —
 * printing a dollar sign whenever no euro rate was stored would have labelled
 * every new euro fare as dollars, on the message the driver collects from.
 */
function amountPair(
  amount: number | null | undefined,
  currency: string | null | undefined,
  ratePerUsd: number | null | undefined
): string {
  const value = Number(amount) || 0;
  if (currency === "EUR") return formatMoney(value, "EUR");

  const dollarText = `$${value.toFixed(2)}`;
  if (!ratePerUsd) return dollarText;
  return `${formatEUR(convertFromUSD(value, ratePerUsd))} (${dollarText})`;
}

/**
 * The message the transfer group reads.
 *
 * It deliberately carries no prices: the operator sees those in the panel, and
 * this message is what drivers pick a job from, so money does not belong in it.
 */
/** A thin rule between blocks — Telegram has no real separators. */
const RULE = "──────────────────";

/**
 * The message the operator forwards into the driver group.
 *
 * It is read on a phone, so it is built as short labelled blocks rather than a
 * paragraph: one block per leg, then the passenger, then what to collect. Every
 * line answers a question a driver asks before accepting a job.
 */
export function buildTransferMessage(data: DriverVoucherData): string {
  const out = legEndpoints(data.direction, "outbound", data.regionName);
  const ret = legEndpoints(data.direction, "return", data.regionName);
  const isRoundTrip = data.tripType === "round_trip" && !!data.returnDatetime;

  const L: string[] = [];

  // ── header ──
  L.push(`🚘 <b>TORVIAN TRANSFER</b>`);
  L.push(`<code>${esc(data.reservationCode)}</code>`);

  /** One leg block: when, where, who is waiting where. */
  const legBlock = (
    heading: string,
    when: string,
    endpoints: { from: string; to: string },
    time: string,
    flightCode?: string,
    trailer?: string
  ) => {
    L.push("", RULE, `<b>${heading}</b>`, "");
    L.push(`📅 ${esc(when)}`);
    // From the airport the clock is the flight's; from a hotel it is the
    // moment the driver has to be at the door.
    const fromAirport = endpoints.from !== data.regionName;
    L.push(
      `${clockEmoji(time)} <b>${fromAirport ? "Uçuş saati" : "Otelden alınış"}: ${esc(time)}</b>`
    );
    if (flightCode) L.push(`✈️ Uçuş kodu: <b>${esc(flightCode)}</b>`);
    L.push(`📍 ${esc(endpoints.from)}`);
    L.push(`     ↓`);
    L.push(`📍 ${esc(endpoints.to)}`);
    if (data.hotelName) L.push(`🏨 ${esc(data.hotelName)}`);
    if (trailer) L.push(trailer);
  };

  legBlock(
    isRoundTrip ? "GİDİŞ TRANSFERİ" : "TRANSFER",
    longDay(data.pickupDatetime),
    out,
    formatBookingTime(data.pickupDatetime),
    data.flightCode
  );

  if (isRoundTrip) {
    const retTime = data.returnPickupTime || formatBookingTime(data.returnDatetime!);
    legBlock(
      "DÖNÜŞ TRANSFERİ",
      longDay(data.returnDatetime!),
      ret,
      retTime,
      data.returnFlightCode,
      ret.from === data.regionName ? `✈️ Dönüş uçuş saati kontrol edilecektir.` : undefined
    );
  }

  // ── passenger ──
  const load = [
    `${data.adults} yetişkin`,
    data.children > 0 ? `${data.children} çocuk` : "",
    `${data.luggageCount} bagaj`,
  ]
    .filter(Boolean)
    .join(" · ");

  L.push("", RULE, `<b>YOLCU</b>`, "");
  L.push(`👤 <b>${esc(data.customerFirstName)} ${esc(data.customerLastName)}</b>`);
  if (data.customerPhone) L.push(`📞 ${esc(data.customerPhone)}`);
  L.push(`👥 ${esc(load)}`);
  if (data.childSeat) L.push(`🪑 Çocuk koltuğu istendi`);
  if (data.notes) L.push(`📝 ${esc(data.notes)}`);

  // ── payment ──
  // This message is copied into the driver group, so the cash figure is an
  // instruction, not accounting. Online jobs say so outright, so nobody asks a
  // prepaid passenger for money.
  L.push("", RULE, `<b>ÖDEME</b>`, "");
  if (data.paymentMethod === "cash") {
    L.push(
      `💵 Araçta tahsil edilecek: <b>${amountPair(data.driverAmountUsd, data.currency, data.exchangeRateEur)}</b>`
    );
    if ((data.depositAmountUsd ?? 0) > 0) {
      L.push(`✔️ Kapora alındı: ${amountPair(data.depositAmountUsd, data.currency, data.exchangeRateEur)}`);
    }
  } else {
    L.push(`💳 Online ödendi — <b>araçta tahsilat yok</b>.`);
  }

  return L.join("\n");
}

export async function sendDriverVoucherToTelegram(data: DriverVoucherData): Promise<void> {
  await sendTelegramRaw(buildTransferMessage(data));
}

/** Telegram rejects a text message over this many characters. */
const TELEGRAM_MAX_LENGTH = 4096;

/**
 * Several reservations offered to the transfer group at once, from the
 * reservations list's bulk "Telegram'a gönder" action. Previously that action
 * looped the single-reservation endpoint once per selected row, so ticking
 * five bookings put five separate messages in the group in quick succession.
 *
 * Built as one message so the group reads it as one batch. Only split into
 * more than one send if the combined text would exceed what Telegram accepts
 * — packed greedily, so a handful of reservations still lands as a single
 * message in the common case, and only a very large selection is broken up.
 */
export async function sendBulkTransferToTelegram(items: DriverVoucherData[]): Promise<{ messages: number }> {
  if (items.length === 0) return { messages: 0 };

  const header = (n: number, of: number) =>
    of > 1 ? `🚘 <b>TORVIAN TRANSFER — ${n} adet (${of} mesajın parçası)</b>` : `🚘 <b>TORVIAN TRANSFER — ${n} adet</b>`;
  const divider = "\n\n━━━━━━━━━━━━━━━━━━━━\n\n";
  const bodies = items.map((item) => buildTransferMessage(item).replace(/^🚘 <b>TORVIAN TRANSFER<\/b>\n/, ""));

  // Greedily pack bodies into as few messages as fit under the limit.
  const groups: string[][] = [[]];
  let length = header(0, 1).length;
  for (const body of bodies) {
    const added = divider.length + body.length;
    if (length + added > TELEGRAM_MAX_LENGTH && groups[groups.length - 1].length > 0) {
      groups.push([]);
      length = header(0, 1).length;
    }
    groups[groups.length - 1].push(body);
    length += added;
  }

  for (let i = 0; i < groups.length; i++) {
    const text = [header(items.length, groups.length), ...groups[i]].join(divider);
    await sendTelegramRaw(text);
  }

  return { messages: groups.length };
}

// ────────── Send price list table to Telegram ──────────

/**
 * Takes one table per vehicle rather than a flat region list: prices are keyed
 * (region, vehicle), so with a second vehicle on the fleet a flat list repeats
 * every region once per vehicle with no way to tell the rows apart. A single
 * vehicle renders exactly as it always did, with no heading.
 */
export async function sendPriceListToTelegram(
  groups: { vehicle: string; regions: { name: string; costTL: number; costEUR: number }[] }[],
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
  for (const group of groups) {
    lines.push("");
    if (groups.length > 1) lines.push(`<b>${esc(group.vehicle).toUpperCase()}</b>`);
    lines.push("<pre>");
    lines.push(`${'BOLGE'.padEnd(16)} ${'TL'.padStart(8)} ${'EUR'.padStart(8)}`);
    lines.push("─".repeat(34));
    for (const r of group.regions) {
      const name = esc(r.name).length > 14 ? esc(r.name).slice(0, 13) + "…" : esc(r.name);
      const tl = r.costTL.toLocaleString("tr-TR");
      const eur = r.costEUR.toFixed(2);
      lines.push(`${name.padEnd(16)} ${tl.padStart(8)} ${eur.padStart(8)}`);
    }
    lines.push("─".repeat(34));
    lines.push("</pre>");
  }
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
