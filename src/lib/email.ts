import { Resend } from "resend";
import { getConfig } from "@/lib/config";

let _resend: Resend | null = null;
let _resendKey: string = "";
async function getResend() {
  const apiKey = await getConfig("resend_api_key");
  if (!apiKey) return null;
  if (!_resend || _resendKey !== apiKey) {
    _resend = new Resend(apiKey);
    _resendKey = apiKey;
  }
  return _resend;
}

export interface ReservationEmailData {
  to: string;
  reservationCode: string;
  firstName: string;
  lastName: string;
  regionName: string;
  pickupDate: string;
  pickupTime: string;
  tripType: "one_way" | "round_trip";
  returnDate?: string;
  returnTime?: string;
  adults: number;
  children: number;
  luggageCount: number;
  childSeat: boolean;
  welcomeSign: boolean;
  welcomeName?: string;
  hotelName?: string;
  flightCode?: string;
  vehicleName?: string;
  basePrice: number;
  nightSurcharge: number;
  childSeatFee: number;
  welcomeSignFee: number;
  roundTripDiscount: number;
  couponDiscount: number;
  totalEur: number;
  qrCodeToken?: string;
  locale: string;
}

// ─── i18n labels ───
const i18n: Record<string, Record<string, string>> = {
  en: {
    subject: "Your TORVIAN Transfer Voucher",
    greeting: "Hello",
    confirmed: "Your VIP transfer has been confirmed and paid.",
    showVoucher: "Please present this voucher (printed or on screen) to your driver at pickup.",
    code: "Reservation Code",
    route: "Route",
    type: "Trip Type",
    oneWay: "One Way",
    roundTrip: "Round Trip",
    pickup: "Pickup",
    returnLabel: "Return",
    flight: "Flight",
    hotel: "Hotel",
    vehicle: "Vehicle",
    passengers: "Passengers",
    adult: "Adult",
    adults: "Adults",
    child: "Child",
    childrenLabel: "Children",
    luggage: "Luggage",
    pieces: "pcs",
    extras: "Extras",
    childSeatLabel: "Child Seat",
    welcomeSignLabel: "Welcome Sign",
    priceSummary: "Price Summary",
    base: "Base Price",
    nightCharge: "Night Surcharge",
    childSeatFee: "Child Seat Fee",
    welcomeSignFee: "Welcome Sign Fee",
    rtDiscount: "Round Trip Discount",
    couponDiscount: "Coupon Discount",
    total: "Total Paid",
    qrTitle: "Your QR Voucher",
    qrInfo: "Show this QR code to your driver for instant verification.",
    importantTitle: "Important Information",
    imp1: "Your driver will track your flight — no need to worry about delays.",
    imp2: "The driver will wait for you at the airport exit with a name sign.",
    imp3: "Free waiting time: 60 min for flights, 15 min for hotels.",
    imp4: "Free child seat & booster on request.",
    contact: "Need help? We're available 24/7",
    footer: "This e-mail serves as your official transfer voucher.",
  },
  tr: {
    subject: "TORVIAN Transfer Voucherınız",
    greeting: "Merhaba",
    confirmed: "VIP transferiniz onaylandı ve ödemeniz alındı.",
    showVoucher: "Lütfen bu voucher'ı (basılı veya ekranda) teslim noktasında şoförünüze gösterin.",
    code: "Rezervasyon Kodu",
    route: "Güzergah",
    type: "Transfer Tipi",
    oneWay: "Tek Yön",
    roundTrip: "Gidiş - Dönüş",
    pickup: "Alış",
    returnLabel: "Dönüş",
    flight: "Uçuş",
    hotel: "Otel",
    vehicle: "Araç",
    passengers: "Yolcular",
    adult: "Yetişkin",
    adults: "Yetişkin",
    child: "Çocuk",
    childrenLabel: "Çocuk",
    luggage: "Bagaj",
    pieces: "adet",
    extras: "Ekstralar",
    childSeatLabel: "Çocuk Koltuğu",
    welcomeSignLabel: "Karşılama Tabelası",
    priceSummary: "Fiyat Özeti",
    base: "Taban Fiyat",
    nightCharge: "Gece Tarifesi",
    childSeatFee: "Çocuk Koltuğu",
    welcomeSignFee: "Karşılama Tabelası",
    rtDiscount: "Gidiş-Dönüş İndirimi",
    couponDiscount: "Kupon İndirimi",
    total: "Toplam Ödenen",
    qrTitle: "QR Voucherınız",
    qrInfo: "Bu QR kodu anında doğrulama için şoförünüze gösterin.",
    importantTitle: "Önemli Bilgiler",
    imp1: "Şoförünüz uçuşunuzu takip eder — rötar konusunda endişelenmeyin.",
    imp2: "Şoför sizi havalimanı çıkışında isim tabelasıyla bekleyecektir.",
    imp3: "Ücretsiz bekleme: Uçuşlarda 60 dk, otellerden 15 dk.",
    imp4: "Talep üzerine ücretsiz çocuk koltuğu ve yükseltici.",
    contact: "Yardım mı lazım? 7/24 ulaşabilirsiniz",
    footer: "Bu e-posta resmi transfer voucherınız olarak geçerlidir.",
  },
  de: {
    subject: "Ihr TORVIAN Transfer Voucher",
    greeting: "Hallo",
    confirmed: "Ihr VIP-Transfer wurde bestätigt und bezahlt.",
    showVoucher: "Bitte zeigen Sie diesen Voucher (gedruckt oder digital) Ihrem Fahrer bei der Abholung.",
    code: "Buchungscode",
    route: "Route",
    type: "Transferart",
    oneWay: "Einfache Fahrt",
    roundTrip: "Hin- und Rückfahrt",
    pickup: "Abholung",
    returnLabel: "Rückfahrt",
    flight: "Flug",
    hotel: "Hotel",
    vehicle: "Fahrzeug",
    passengers: "Passagiere",
    adult: "Erwachsener",
    adults: "Erwachsene",
    child: "Kind",
    childrenLabel: "Kinder",
    luggage: "Gepäck",
    pieces: "Stk",
    extras: "Extras",
    childSeatLabel: "Kindersitz",
    welcomeSignLabel: "Namensschild",
    priceSummary: "Preisübersicht",
    base: "Grundpreis",
    nightCharge: "Nachtzuschlag",
    childSeatFee: "Kindersitz",
    welcomeSignFee: "Namensschild",
    rtDiscount: "Hin-/Rückfahrt-Rabatt",
    couponDiscount: "Gutschein-Rabatt",
    total: "Gesamt bezahlt",
    qrTitle: "Ihr QR-Voucher",
    qrInfo: "Zeigen Sie diesen QR-Code Ihrem Fahrer zur sofortigen Verifizierung.",
    importantTitle: "Wichtige Informationen",
    imp1: "Ihr Fahrer verfolgt Ihren Flug — keine Sorge bei Verspätungen.",
    imp2: "Der Fahrer erwartet Sie am Flughafenausgang mit einem Namensschild.",
    imp3: "Kostenlose Wartezeit: 60 Min für Flüge, 15 Min für Hotels.",
    imp4: "Kostenloser Kindersitz auf Anfrage.",
    contact: "Brauchen Sie Hilfe? Wir sind 24/7 erreichbar",
    footer: "Diese E-Mail dient als Ihr offizieller Transfer-Voucher.",
  },
  pl: {
    subject: "Twój Voucher TORVIAN Transfer",
    greeting: "Cześć",
    confirmed: "Twój transfer VIP został potwierdzony i opłacony.",
    showVoucher: "Prosimy o okazanie tego vouchera (wydrukowanego lub na ekranie) kierowcy przy odbiorze.",
    code: "Kod Rezerwacji",
    route: "Trasa",
    type: "Typ Transferu",
    oneWay: "W jedną stronę",
    roundTrip: "W obie strony",
    pickup: "Odbiór",
    returnLabel: "Powrót",
    flight: "Lot",
    hotel: "Hotel",
    vehicle: "Pojazd",
    passengers: "Pasażerowie",
    adult: "Dorosły",
    adults: "Dorośli",
    child: "Dziecko",
    childrenLabel: "Dzieci",
    luggage: "Bagaż",
    pieces: "szt",
    extras: "Dodatki",
    childSeatLabel: "Fotelik dziecięcy",
    welcomeSignLabel: "Tabliczka powitalna",
    priceSummary: "Podsumowanie ceny",
    base: "Cena podstawowa",
    nightCharge: "Dopłata nocna",
    childSeatFee: "Fotelik dziecięcy",
    welcomeSignFee: "Tabliczka powitalna",
    rtDiscount: "Rabat w obie strony",
    couponDiscount: "Rabat kuponowy",
    total: "Zapłacono łącznie",
    qrTitle: "Twój QR Voucher",
    qrInfo: "Pokaż ten kod QR kierowcy w celu natychmiastowej weryfikacji.",
    importantTitle: "Ważne informacje",
    imp1: "Kierowca śledzi Twój lot — nie martw się opóźnieniami.",
    imp2: "Kierowca będzie czekał na Ciebie przy wyjściu z lotniska z tabliczką.",
    imp3: "Bezpłatny czas oczekiwania: 60 min dla lotów, 15 min dla hoteli.",
    imp4: "Bezpłatny fotelik dziecięcy na życzenie.",
    contact: "Potrzebujesz pomocy? Jesteśmy dostępni 24/7",
    footer: "Ten e-mail służy jako oficjalny voucher transferowy.",
  },
  ru: {
    subject: "Ваш ваучер TORVIAN Transfer",
    greeting: "Здравствуйте",
    confirmed: "Ваш VIP-трансфер подтверждён и оплачен.",
    showVoucher: "Пожалуйста, покажите этот ваучер (распечатанный или на экране) водителю при посадке.",
    code: "Код бронирования",
    route: "Маршрут",
    type: "Тип трансфера",
    oneWay: "В одну сторону",
    roundTrip: "Туда и обратно",
    pickup: "Подача",
    returnLabel: "Возврат",
    flight: "Рейс",
    hotel: "Отель",
    vehicle: "Транспорт",
    passengers: "Пассажиры",
    adult: "взрослый",
    adults: "взрослых",
    child: "ребёнок",
    childrenLabel: "детей",
    luggage: "Багаж",
    pieces: "шт",
    extras: "Дополнительно",
    childSeatLabel: "Детское кресло",
    welcomeSignLabel: "Табличка с именем",
    priceSummary: "Сводка по цене",
    base: "Базовая цена",
    nightCharge: "Ночная надбавка",
    childSeatFee: "Детское кресло",
    welcomeSignFee: "Табличка с именем",
    rtDiscount: "Скидка туда-обратно",
    couponDiscount: "Скидка по купону",
    total: "Итого оплачено",
    qrTitle: "Ваш QR-ваучер",
    qrInfo: "Покажите этот QR-код водителю для мгновенной верификации.",
    importantTitle: "Важная информация",
    imp1: "Водитель отслеживает ваш рейс — не переживайте из-за задержек.",
    imp2: "Водитель встретит вас на выходе из аэропорта с табличкой.",
    imp3: "Бесплатное ожидание: 60 мин для рейсов, 15 мин для отелей.",
    imp4: "Бесплатное детское кресло по запросу.",
    contact: "Нужна помощь? Мы доступны 24/7",
    footer: "Это письмо является вашим официальным ваучером на трансфер.",
  },
};

function t(locale: string, key: string): string {
  return i18n[locale]?.[key] ?? i18n.en[key] ?? key;
}

// ─── QR Code generation (server-side, base64 PNG) ───
async function generateQRBase64(text: string): Promise<string> {
  try {
    const QRCode = await import("qrcode");
    return await QRCode.toDataURL(text, { width: 200, margin: 1, color: { dark: "#1B2E4B", light: "#FFFFFF" } });
  } catch {
    return "";
  }
}

// ─── Build voucher HTML (shared by email & PDF) ───
export function buildVoucherHTML(data: ReservationEmailData, qrDataUrl: string): string {
  const loc = data.locale;
  const tripLabel = data.tripType === "round_trip" ? t(loc, "roundTrip") : t(loc, "oneWay");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://torviantransfer.com";
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "905469407955";

  const passengerParts: string[] = [];
  if (data.adults > 0) passengerParts.push(`${data.adults} ${data.adults === 1 ? t(loc, "adult") : t(loc, "adults")}`);
  if (data.children > 0) passengerParts.push(`${data.children} ${data.children === 1 ? t(loc, "child") : t(loc, "childrenLabel")}`);
  const passengerText = passengerParts.join(" + ");

  const extras: string[] = [];
  if (data.childSeat) extras.push(t(loc, "childSeatLabel"));
  if (data.welcomeSign) extras.push(`${t(loc, "welcomeSignLabel")}${data.welcomeName ? ` — "${data.welcomeName}"` : ""}`);

  const priceRows: string[] = [];
  priceRows.push(row(t(loc, "base"), `€${data.basePrice.toFixed(2)}`));
  if (data.nightSurcharge > 0) priceRows.push(row(t(loc, "nightCharge"), `€${data.nightSurcharge.toFixed(2)}`));
  if (data.childSeatFee > 0) priceRows.push(row(t(loc, "childSeatFee"), `€${data.childSeatFee.toFixed(2)}`));
  if (data.welcomeSignFee > 0) priceRows.push(row(t(loc, "welcomeSignFee"), `€${data.welcomeSignFee.toFixed(2)}`));
  if (data.roundTripDiscount > 0) priceRows.push(row(t(loc, "rtDiscount"), `−€${data.roundTripDiscount.toFixed(2)}`, "#22c55e"));
  if (data.couponDiscount > 0) priceRows.push(row(t(loc, "couponDiscount"), `−€${data.couponDiscount.toFixed(2)}`, "#22c55e"));

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#111113;color:#e5e5e5;border-radius:12px;overflow:hidden;">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:4px;font-weight:800;">TORVIAN</h1>
    <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:13px;letter-spacing:1px;">VIP AIRPORT TRANSFER</p>
  </div>

  <!-- STATUS BAR -->
  <div style="background:#14532d;padding:12px 32px;text-align:center;">
    <span style="color:#4ade80;font-size:13px;font-weight:600;">✓ ${t(loc, "confirmed").toUpperCase()}</span>
  </div>

  <div style="padding:28px 32px;">

    <!-- GREETING -->
    <p style="font-size:16px;margin:0 0 6px;">${t(loc, "greeting")} ${data.firstName},</p>
    <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;">${t(loc, "showVoucher")}</p>

    <!-- RESERVATION CODE -->
    <div style="background:#1a1a1d;border:2px dashed #f97316;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <p style="color:#86868b;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">${t(loc, "code")}</p>
      <p style="color:#f97316;font-size:32px;font-weight:800;margin:0;letter-spacing:4px;">${data.reservationCode}</p>
    </div>

    <!-- TRANSFER DETAILS -->
    <div style="background:#1a1a1d;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#86868b;font-size:13px;width:35%;">${t(loc, "route")}</td>
          <td style="padding:8px 0;font-size:13px;font-weight:600;">Antalya Airport → ${data.regionName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#86868b;font-size:13px;">${t(loc, "type")}</td>
          <td style="padding:8px 0;font-size:13px;">${tripLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#86868b;font-size:13px;">📅 ${t(loc, "pickup")}</td>
          <td style="padding:8px 0;font-size:13px;font-weight:600;">${data.pickupDate} — ${data.pickupTime}</td>
        </tr>
        ${data.returnDate ? `<tr>
          <td style="padding:8px 0;color:#86868b;font-size:13px;">🔄 ${t(loc, "returnLabel")}</td>
          <td style="padding:8px 0;font-size:13px;font-weight:600;">${data.returnDate} — ${data.returnTime}</td>
        </tr>` : ""}
        ${data.flightCode ? `<tr>
          <td style="padding:8px 0;color:#86868b;font-size:13px;">✈ ${t(loc, "flight")}</td>
          <td style="padding:8px 0;font-size:13px;">${data.flightCode}</td>
        </tr>` : ""}
        ${data.hotelName ? `<tr>
          <td style="padding:8px 0;color:#86868b;font-size:13px;">🏨 ${t(loc, "hotel")}</td>
          <td style="padding:8px 0;font-size:13px;">${data.hotelName}</td>
        </tr>` : ""}
        ${data.vehicleName ? `<tr>
          <td style="padding:8px 0;color:#86868b;font-size:13px;">🚗 ${t(loc, "vehicle")}</td>
          <td style="padding:8px 0;font-size:13px;">${data.vehicleName}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:8px 0;color:#86868b;font-size:13px;">👥 ${t(loc, "passengers")}</td>
          <td style="padding:8px 0;font-size:13px;">${passengerText}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#86868b;font-size:13px;">🧳 ${t(loc, "luggage")}</td>
          <td style="padding:8px 0;font-size:13px;">${data.luggageCount} ${t(loc, "pieces")}</td>
        </tr>
        ${extras.length > 0 ? `<tr>
          <td style="padding:8px 0;color:#86868b;font-size:13px;">⭐ ${t(loc, "extras")}</td>
          <td style="padding:8px 0;font-size:13px;">${extras.join(", ")}</td>
        </tr>` : ""}
      </table>
    </div>

    <!-- PRICE SUMMARY -->
    <div style="background:#1a1a1d;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="color:#86868b;font-size:11px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">${t(loc, "priceSummary")}</p>
      <table style="width:100%;border-collapse:collapse;">
        ${priceRows.join("")}
        <tr style="border-top:2px solid #27272a;">
          <td style="padding:12px 0 0;font-size:15px;font-weight:700;">${t(loc, "total")}</td>
          <td style="padding:12px 0 0;text-align:right;font-size:20px;font-weight:800;color:#f97316;">€${data.totalEur.toFixed(2)}</td>
        </tr>
      </table>
    </div>

    <!-- QR CODE -->
    ${qrDataUrl ? `
    <div style="background:#ffffff;border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
      <p style="color:#111113;font-size:13px;font-weight:600;margin:0 0 12px;">${t(loc, "qrTitle")}</p>
      <img src="${qrDataUrl}" width="180" height="180" alt="QR Code" style="display:block;margin:0 auto;" />
      <p style="color:#6b7280;font-size:11px;margin:10px 0 0;">${t(loc, "qrInfo")}</p>
    </div>` : ""}

    <!-- IMPORTANT INFO -->
    <div style="background:#1a1a1d;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#f97316;font-size:13px;font-weight:700;margin:0 0 12px;">📋 ${t(loc, "importantTitle")}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;font-size:12px;color:#a1a1aa;">✈ ${t(loc, "imp1")}</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#a1a1aa;">🪧 ${t(loc, "imp2")}</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#a1a1aa;">⏳ ${t(loc, "imp3")}</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#a1a1aa;">👶 ${t(loc, "imp4")}</td></tr>
      </table>
    </div>

    <!-- CONTACT -->
    <div style="text-align:center;margin-bottom:8px;">
      <p style="color:#86868b;font-size:12px;margin:0 0 10px;">${t(loc, "contact")}</p>
      <a href="https://wa.me/${wa}" style="display:inline-block;background:#25D366;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;margin-right:8px;">WhatsApp</a>
      <a href="mailto:torviantransfer@gmail.com" style="display:inline-block;background:#f97316;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">E-mail</a>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="background:#0a0a0a;padding:16px 32px;text-align:center;border-top:1px solid #1a1a1d;">
    <p style="color:#52525b;font-size:11px;margin:0 0 4px;">${t(loc, "footer")}</p>
    <p style="color:#3f3f46;font-size:10px;margin:0;">© ${new Date().getFullYear()} TORVIAN Transfer · Antalya, Turkey · <a href="${siteUrl}" style="color:#3f3f46;">torviantransfer.com</a></p>
  </div>

</div>
</body>
</html>`;
}

function row(label: string, value: string, color?: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#86868b;font-size:13px;">${label}</td>
    <td style="padding:6px 0;text-align:right;font-size:13px;${color ? `color:${color};` : ""}">${value}</td>
  </tr>`;
}

// ─── Send reservation voucher email ───
export async function sendReservationEmail(data: ReservationEmailData) {
  const resend = await getResend();
  if (!resend) return;

  const qrDataUrl = data.qrCodeToken
    ? await generateQRBase64(`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://torviantransfer.com"}/verify/${data.qrCodeToken}`)
    : "";

  const subject = t(data.locale, "subject");
  const html = buildVoucherHTML(data, qrDataUrl);

  try {
    await resend.emails.send({
      from: "TORVIAN Transfer <noreply@torviantransfer.com>",
      to: data.to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send reservation email:", err);
  }
}
