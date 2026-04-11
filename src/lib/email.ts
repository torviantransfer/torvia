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
  hotelName?: string;
  flightCode?: string;
  vehicleName?: string;
  basePrice: number;
  nightSurcharge: number;
  childSeatFee: number;
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
    priceSummary: "Price Summary",
    base: "Base Price",
    nightCharge: "Night Surcharge",
    childSeatFee: "Child Seat Fee",
    rtDiscount: "Round Trip Discount",
    couponDiscount: "Coupon Discount",
    total: "Total Paid",
    qrTitle: "Your QR Voucher",
    qrInfo: "Show this QR code to your driver for instant verification.",
    importantTitle: "Important Information",
    imp1: "Your driver will track your flight — no need to worry about delays.",
    imp2: "The driver will wait for you at the airport exit with a name sign.",
    imp3: "Free waiting time: 60 min for flights, 15 min for hotels.",
    imp4: "Child seat & booster available for $10 per booking.",
    imp5: "Do not contact the driver directly for future bookings. Our company is not responsible for any issues that may arise.",
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
    priceSummary: "Fiyat Özeti",
    base: "Taban Fiyat",
    nightCharge: "Gece Tarifesi",
    childSeatFee: "Çocuk Koltuğu",
    rtDiscount: "Gidiş-Dönüş İndirimi",
    couponDiscount: "Kupon İndirimi",
    total: "Toplam Ödenen",
    qrTitle: "QR Voucherınız",
    qrInfo: "Bu QR kodu anında doğrulama için şoförünüze gösterin.",
    importantTitle: "Önemli Bilgiler",
    imp1: "Şoförünüz uçuşunuzu takip eder — rötar konusunda endişelenmeyin.",
    imp2: "Şoför sizi havalimanı çıkışında isim tabelasıyla bekleyecektir.",
    imp3: "Ücretsiz bekleme: Uçuşlarda 60 dk, otellerden 15 dk.",
    imp4: "Talep üzerine 10$ karşılığında çocuk koltuğu ve yükseltici.",
    imp5: "Bir sonraki taşımalarda şoför ile doğrudan iletişime geçmeyiniz. Yaşanan olumsuzluklardan firmamız sorumlu değildir.",
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
    priceSummary: "Preisübersicht",
    base: "Grundpreis",
    nightCharge: "Nachtzuschlag",
    childSeatFee: "Kindersitz",
    rtDiscount: "Hin-/Rückfahrt-Rabatt",
    couponDiscount: "Gutschein-Rabatt",
    total: "Gesamt bezahlt",
    qrTitle: "Ihr QR-Voucher",
    qrInfo: "Zeigen Sie diesen QR-Code Ihrem Fahrer zur sofortigen Verifizierung.",
    importantTitle: "Wichtige Informationen",
    imp1: "Ihr Fahrer verfolgt Ihren Flug — keine Sorge bei Verspätungen.",
    imp2: "Der Fahrer erwartet Sie am Flughafenausgang mit einem Namensschild.",
    imp3: "Kostenlose Wartezeit: 60 Min für Flüge, 15 Min für Hotels.",
    imp4: "Kindersitz für $10 pro Buchung verfügbar.",
    imp5: "Kontaktieren Sie den Fahrer nicht direkt für zukünftige Buchungen. Unser Unternehmen übernimmt keine Verantwortung für mögliche Probleme.",
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
    priceSummary: "Podsumowanie ceny",
    base: "Cena podstawowa",
    nightCharge: "Dopłata nocna",
    childSeatFee: "Fotelik dziecięcy",
    rtDiscount: "Rabat w obie strony",
    couponDiscount: "Rabat kuponowy",
    total: "Zapłacono łącznie",
    qrTitle: "Twój QR Voucher",
    qrInfo: "Pokaż ten kod QR kierowcy w celu natychmiastowej weryfikacji.",
    importantTitle: "Ważne informacje",
    imp1: "Kierowca śledzi Twój lot — nie martw się opóźnieniami.",
    imp2: "Kierowca będzie czekał na Ciebie przy wyjściu z lotniska z tabliczką.",
    imp3: "Bezpłatny czas oczekiwania: 60 min dla lotów, 15 min dla hoteli.",
    imp4: "Fotelik dziecięcy dostępny za $10 za rezerwację.",
    imp5: "Nie kontaktuj się bezpośrednio z kierowcą w sprawie przyszłych rezerwacji. Nasza firma nie ponosi odpowiedzialności za ewentualne problemy.",
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
    priceSummary: "Сводка по цене",
    base: "Базовая цена",
    nightCharge: "Ночная надбавка",
    childSeatFee: "Детское кресло",
    rtDiscount: "Скидка туда-обратно",
    couponDiscount: "Скидка по купону",
    total: "Итого оплачено",
    qrTitle: "Ваш QR-ваучер",
    qrInfo: "Покажите этот QR-код водителю для мгновенной верификации.",
    importantTitle: "Важная информация",
    imp1: "Водитель отслеживает ваш рейс — не переживайте из-за задержек.",
    imp2: "Водитель встретит вас на выходе из аэропорта с табличкой.",
    imp3: "Бесплатное ожидание: 60 мин для рейсов, 15 мин для отелей.",
    imp4: "Детское кресло доступно за $10 за бронирование.",
    imp5: "Не связывайтесь с водителем напрямую для будущих бронирований. Наша компания не несёт ответственности за возможные проблемы.",
    contact: "Нужна помощь? Мы доступны 24/7",
    footer: "Это письмо является вашим официальным ваучером на трансфер.",
  },
};

function t(locale: string, key: string): string {
  return i18n[locale]?.[key] ?? i18n.en[key] ?? key;
}

// ─── QR Code URL (external API — data: URLs are blocked by most email clients) ───
function generateQRUrl(text: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}&color=1B2E4B&bgcolor=FFFFFF&margin=10`;
}

// ─── Build voucher HTML (shared by email & PDF) ───
export function buildVoucherHTML(data: ReservationEmailData, qrDataUrl: string): string {
  const loc = data.locale;
  const tripLabel = data.tripType === "round_trip" ? t(loc, "roundTrip") : t(loc, "oneWay");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://torviantransfer.com";
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "908508401327";

  const passengerParts: string[] = [];
  if (data.adults > 0) passengerParts.push(`${data.adults} ${data.adults === 1 ? t(loc, "adult") : t(loc, "adults")}`);
  if (data.children > 0) passengerParts.push(`${data.children} ${data.children === 1 ? t(loc, "child") : t(loc, "childrenLabel")}`);
  const passengerText = passengerParts.join(" + ");

  const extras: string[] = [];
  if (data.childSeat) extras.push(t(loc, "childSeatLabel"));

  const priceRows: string[] = [];
  priceRows.push(row(t(loc, "base"), `€${data.basePrice.toFixed(2)}`));
  if (data.nightSurcharge > 0) priceRows.push(row(t(loc, "nightCharge"), `€${data.nightSurcharge.toFixed(2)}`));
  if (data.childSeatFee > 0) priceRows.push(row(t(loc, "childSeatFee"), `€${data.childSeatFee.toFixed(2)}`));
  if (data.roundTripDiscount > 0) priceRows.push(row(t(loc, "rtDiscount"), `−€${data.roundTripDiscount.toFixed(2)}`, "#22c55e"));
  if (data.couponDiscount > 0) priceRows.push(row(t(loc, "couponDiscount"), `−€${data.couponDiscount.toFixed(2)}`, "#22c55e"));

  const detailRows: string[] = [
    detailRow("✈", t(loc, "route"), `Antalya Airport &rarr; ${data.regionName}`, true),
    detailRow("🔁", t(loc, "type"), tripLabel),
    detailRow("📅", t(loc, "pickup"), `${data.pickupDate} &nbsp;|&nbsp; ${data.pickupTime}`, true),
    ...(data.returnDate ? [detailRow("🔄", t(loc, "returnLabel"), `${data.returnDate} &nbsp;|&nbsp; ${data.returnTime}`, true)] : []),
    ...(data.flightCode ? [detailRow("🛫", t(loc, "flight"), data.flightCode)] : []),
    ...(data.hotelName ? [detailRow("🏨", t(loc, "hotel"), data.hotelName)] : []),
    ...(data.vehicleName ? [detailRow("🚘", t(loc, "vehicle"), data.vehicleName)] : []),
    detailRow("👥", t(loc, "passengers"), passengerText),
    detailRow("🧳", t(loc, "luggage"), `${data.luggageCount} ${t(loc, "pieces")}`),
    ...(extras.length > 0 ? [detailRow("⭐", t(loc, "extras"), extras.join(" &bull; "))] : []),
  ];

  return `
<!DOCTYPE html>
<html lang="${loc}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${t(loc, "subject")}</title>
</head>
<body style="margin:0;padding:20px 0;background:#0d0d0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- ══ HEADER ══ -->
  <tr>
    <td style="background:linear-gradient(135deg,#f97316 0%,#c2410c 100%);border-radius:16px 16px 0 0;padding:36px 40px 32px;text-align:center;">
      <div style="display:inline-block;border:2px solid rgba(255,255,255,0.25);border-radius:8px;padding:4px 16px;margin-bottom:14px;">
        <span style="color:rgba(255,255,255,0.85);font-size:10px;letter-spacing:3px;font-weight:600;text-transform:uppercase;">VIP AIRPORT TRANSFER</span>
      </div>
      <h1 style="color:#ffffff;margin:0;font-size:42px;letter-spacing:8px;font-weight:900;line-height:1;text-shadow:0 2px 12px rgba(0,0,0,0.3);">TORVIAN</h1>
      <p style="color:rgba(255,255,255,0.7);margin:10px 0 0;font-size:12px;letter-spacing:1px;">ANTALYA · TÜRKIYE</p>
    </td>
  </tr>

  <!-- ══ CONFIRMED BANNER ══ -->
  <tr>
    <td style="background:#052e16;padding:14px 40px;text-align:center;border-left:4px solid #16a34a;border-right:4px solid #16a34a;">
      <span style="font-size:13px;color:#4ade80;font-weight:700;letter-spacing:1px;">&#10003; &nbsp;${t(loc, "confirmed").toUpperCase()}</span>
    </td>
  </tr>

  <!-- ══ BODY ══ -->
  <tr>
    <td style="background:#111113;padding:36px 40px 28px;">

      <!-- Greeting -->
      <p style="font-size:18px;color:#f4f4f5;margin:0 0 4px;font-weight:600;">${t(loc, "greeting")} ${data.firstName},</p>
      <p style="margin:0 0 32px;color:#71717a;font-size:14px;line-height:1.6;">${t(loc, "showVoucher")}</p>

      <!-- Reservation Code -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td style="background:#18181b;border:2px dashed #f97316;border-radius:14px;padding:22px 16px;text-align:center;">
            <p style="color:#71717a;font-size:10px;margin:0 0 6px;text-transform:uppercase;letter-spacing:2px;">${t(loc, "code")}</p>
            <p style="color:#f97316;font-size:36px;font-weight:900;margin:0;letter-spacing:6px;font-variant-numeric:tabular-nums;">${data.reservationCode}</p>
          </td>
        </tr>
      </table>

      <!-- Section: Transfer Details -->
      <p style="color:#a1a1aa;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;border-bottom:1px solid #27272a;padding-bottom:8px;">${t(loc, "type")} &amp; ${t(loc, "route")}</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#18181b;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tr><td style="padding:4px 0;"></td></tr>
        ${detailRows.join("")}
        <tr><td style="padding:4px 0;"></td></tr>
      </table>

      <!-- Section: Price -->
      <p style="color:#a1a1aa;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;border-bottom:1px solid #27272a;padding-bottom:8px;">${t(loc, "priceSummary")}</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#18181b;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tr><td colspan="2" style="padding:4px 0;"></td></tr>
        ${priceRows.join("")}
        <!-- Total row -->
        <tr>
          <td colspan="2" style="padding:0 0 4px;"><div style="height:1px;background:#27272a;margin:8px 20px;"></div></td>
        </tr>
        <tr>
          <td style="padding:8px 20px 16px;font-size:15px;font-weight:700;color:#f4f4f5;">${t(loc, "total")}</td>
          <td style="padding:8px 20px 16px;text-align:right;font-size:26px;font-weight:900;color:#f97316;font-variant-numeric:tabular-nums;">€${data.totalEur.toFixed(2)}</td>
        </tr>
      </table>

      ${qrDataUrl ? `
      <!-- Section: QR Code -->
      <p style="color:#a1a1aa;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;border-bottom:1px solid #27272a;padding-bottom:8px;">${t(loc, "qrTitle")}</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td style="background:#ffffff;border-radius:12px;padding:24px;text-align:center;">
            <img src="${qrDataUrl}" width="160" height="160" alt="QR Code" style="display:block;margin:0 auto;border-radius:4px;" />
            <p style="color:#6b7280;font-size:11px;margin:12px 0 0;">${t(loc, "qrInfo")}</p>
          </td>
        </tr>
      </table>
      ` : ""}

      <!-- Section: Important Info -->
      <p style="color:#a1a1aa;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;border-bottom:1px solid #27272a;padding-bottom:8px;">${t(loc, "importantTitle")}</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#18181b;border-radius:12px;overflow:hidden;margin-bottom:28px;">
        <tr><td style="padding:16px 20px 8px;font-size:13px;color:#d4d4d8;border-left:3px solid #f97316;margin-left:20px;">&#9992; &nbsp;${t(loc, "imp1")}</td></tr>
        <tr><td style="padding:8px 20px;font-size:13px;color:#d4d4d8;border-left:3px solid #f97316;">&#128697; &nbsp;${t(loc, "imp2")}</td></tr>
        <tr><td style="padding:8px 20px;font-size:13px;color:#d4d4d8;border-left:3px solid #f97316;">&#8987; &nbsp;${t(loc, "imp3")}</td></tr>
        <tr><td style="padding:8px 20px;font-size:13px;color:#d4d4d8;border-left:3px solid #f97316;">&#128118; &nbsp;${t(loc, "imp4")}</td></tr>
        <tr><td style="padding:8px 20px 16px;font-size:13px;color:#fbbf24;border-left:3px solid #ef4444;font-weight:600;">&#9888; &nbsp;${t(loc, "imp5")}</td></tr>
      </table>

      <!-- Contact -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:4px;">
        <tr>
          <td style="text-align:center;padding-bottom:14px;">
            <p style="color:#71717a;font-size:12px;margin:0 0 14px;">${t(loc, "contact")}</p>
            <a href="https://wa.me/${wa}" style="display:inline-block;background:#25D366;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;margin-right:10px;">WhatsApp</a>
            <a href="mailto:torviantransfer@gmail.com" style="display:inline-block;background:#f97316;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">E-mail</a>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- ══ FOOTER ══ -->
  <tr>
    <td style="background:#0a0a0b;border-top:1px solid #1c1c1e;border-radius:0 0 16px 16px;padding:18px 40px;text-align:center;">
      <p style="color:#3f3f46;font-size:11px;margin:0 0 4px;">${t(loc, "footer")}</p>
      <p style="color:#27272a;font-size:10px;margin:0;">&#169; ${new Date().getFullYear()} TORVIAN Transfer &middot; Antalya, Turkey &middot; <a href="${siteUrl}" style="color:#3f3f46;text-decoration:none;">torviantransfer.com</a></p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}

function row(label: string, value: string, color?: string): string {
  return `<tr>
    <td style="padding:7px 20px;color:#71717a;font-size:13px;">${label}</td>
    <td style="padding:7px 20px;text-align:right;font-size:13px;color:#d4d4d8;${color ? `color:${color};font-weight:600;` : ""}">${value}</td>
  </tr>`;
}

function detailRow(icon: string, label: string, value: string, bold = false): string {
  return `<tr>
    <td style="padding:9px 20px;color:#71717a;font-size:13px;white-space:nowrap;width:38%;">${icon} &nbsp;${label}</td>
    <td style="padding:9px 20px;font-size:13px;color:#f4f4f5;${bold ? "font-weight:600;" : ""}">${value}</td>
  </tr>`;
}

// ─── Send reservation voucher email ───
export async function sendReservationEmail(data: ReservationEmailData) {
  const resend = await getResend();
  if (!resend) return;

  const qrDataUrl = data.qrCodeToken
    ? generateQRUrl(`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://torviantransfer.com"}/verify/${data.qrCodeToken}`)
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

// ─── Driver assignment email to customer ───
interface DriverAssignmentEmailData {
  to: string;
  customerFirstName: string;
  reservationCode: string;
  leg: "outbound" | "return";
  driverName: string;
  driverPhone: string;
  vehicleInfo: string;
  pickupTime?: string;
  regionName: string;
  pickupDatetime: string;
  returnDatetime?: string | null;
}

export async function sendDriverAssignmentEmail(data: DriverAssignmentEmailData) {
  const resend = await getResend();
  if (!resend) return;

  const isReturn = data.leg === "return";
  const legLabel = isReturn ? "Dönüş" : "Gidiş";
  const subject = `TORVIAN — ${legLabel} Şoför Bilgileri | ${data.reservationCode}`;

  const datetime = isReturn && data.returnDatetime
    ? new Date(data.returnDatetime)
    : new Date(data.pickupDatetime);
  const dateStr = datetime.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = datetime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });

  const direction = isReturn
    ? `${data.regionName} &rarr; Antalya Airport`
    : `Antalya Airport &rarr; ${data.regionName}`;

  const pickupTimeRow = isReturn && data.pickupTime
    ? `<tr>
        <td style="padding:9px 20px;color:#71717a;font-size:13px;white-space:nowrap;width:38%;">&#9200; &nbsp;Alış Saati</td>
        <td style="padding:9px 20px;font-size:14px;color:#f97316;font-weight:700;">${data.pickupTime}</td>
      </tr>`
    : "";

  const earlyWarning = isReturn
    ? `<tr>
        <td colspan="2" style="padding:12px 20px;background:#422006;border-left:3px solid #f97316;">
          <p style="color:#fbbf24;font-size:13px;font-weight:700;margin:0;">&#9888; Lütfen alış saatinden en az 2 saat önce hazır olunuz.</p>
          <p style="color:#d4d4d8;font-size:12px;margin:4px 0 0;">Şoförünüz belirtilen saatte otel/adresinizde olacaktır.</p>
        </td>
      </tr>`
    : "";

  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "908508401327";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://torviantransfer.com";

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:20px 0;background:#0d0d0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td style="background:linear-gradient(135deg,#f97316 0%,#c2410c 100%);border-radius:16px 16px 0 0;padding:28px 40px 24px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:32px;letter-spacing:6px;font-weight:900;">TORVIAN</h1>
      <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:11px;letter-spacing:1px;">VIP AIRPORT TRANSFER</p>
    </td>
  </tr>

  <!-- BANNER -->
  <tr>
    <td style="background:#1e3a5f;padding:14px 40px;text-align:center;">
      <span style="font-size:14px;color:#93c5fd;font-weight:700;letter-spacing:1px;">&#128663; &nbsp;${legLabel.toUpperCase()} ŞOFÖRÜNÜZ ATANDI</span>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background:#111113;padding:32px 40px 24px;">

      <p style="font-size:17px;color:#f4f4f5;margin:0 0 4px;font-weight:600;">Merhaba ${data.customerFirstName},</p>
      <p style="margin:0 0 28px;color:#71717a;font-size:13px;line-height:1.6;">${isReturn ? "Dönüş" : "Gidiş"} transferiniz için şoför ataması yapılmıştır. Aşağıda detayları bulabilirsiniz.</p>

      <!-- Reservation Code -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr>
          <td style="background:#18181b;border:2px dashed #f97316;border-radius:12px;padding:16px;text-align:center;">
            <p style="color:#71717a;font-size:10px;margin:0 0 4px;text-transform:uppercase;letter-spacing:2px;">Rezervasyon Kodu</p>
            <p style="color:#f97316;font-size:28px;font-weight:900;margin:0;letter-spacing:4px;">${data.reservationCode}</p>
          </td>
        </tr>
      </table>

      <!-- Driver Info -->
      <p style="color:#a1a1aa;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;border-bottom:1px solid #27272a;padding-bottom:8px;">Şoför Bilgileri</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#18181b;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tr><td style="padding:4px 0;"></td></tr>
        <tr>
          <td style="padding:9px 20px;color:#71717a;font-size:13px;white-space:nowrap;width:38%;">&#128100; &nbsp;Şoför</td>
          <td style="padding:9px 20px;font-size:13px;color:#f4f4f5;font-weight:600;">${data.driverName}</td>
        </tr>
        <tr>
          <td style="padding:9px 20px;color:#71717a;font-size:13px;white-space:nowrap;width:38%;">&#128222; &nbsp;Telefon</td>
          <td style="padding:9px 20px;font-size:13px;color:#f4f4f5;">${data.driverPhone}</td>
        </tr>
        <tr>
          <td style="padding:9px 20px;color:#71717a;font-size:13px;white-space:nowrap;width:38%;">&#128663; &nbsp;Araç</td>
          <td style="padding:9px 20px;font-size:13px;color:#f4f4f5;">${data.vehicleInfo}</td>
        </tr>
        <tr><td style="padding:4px 0;"></td></tr>
      </table>

      <!-- Transfer Info -->
      <p style="color:#a1a1aa;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;border-bottom:1px solid #27272a;padding-bottom:8px;">Transfer Detayları</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#18181b;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tr><td style="padding:4px 0;"></td></tr>
        <tr>
          <td style="padding:9px 20px;color:#71717a;font-size:13px;white-space:nowrap;width:38%;">&#9992; &nbsp;Güzergah</td>
          <td style="padding:9px 20px;font-size:13px;color:#f4f4f5;font-weight:600;">${direction}</td>
        </tr>
        <tr>
          <td style="padding:9px 20px;color:#71717a;font-size:13px;white-space:nowrap;width:38%;">&#128197; &nbsp;Tarih</td>
          <td style="padding:9px 20px;font-size:13px;color:#f4f4f5;font-weight:600;">${dateStr} — ${timeStr}</td>
        </tr>
        ${pickupTimeRow}
        ${earlyWarning}
        <tr><td style="padding:4px 0;"></td></tr>
      </table>

      <!-- Warning -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#422006;border-radius:12px;overflow:hidden;margin-bottom:28px;border-left:4px solid #ef4444;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="color:#fbbf24;font-size:13px;font-weight:700;margin:0 0 4px;">&#9888; Önemli Uyarı</p>
            <p style="color:#d4d4d8;font-size:12px;margin:0;line-height:1.5;">Bir sonraki taşımalarda şoför ile doğrudan iletişime geçmeyiniz. Yaşanan olumsuzluklardan firmamız sorumlu değildir.</p>
          </td>
        </tr>
      </table>

      <!-- Contact -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:4px;">
        <tr>
          <td style="text-align:center;padding-bottom:14px;">
            <p style="color:#71717a;font-size:12px;margin:0 0 14px;">Soru veya sorun için 7/24 ulaşabilirsiniz</p>
            <a href="https://wa.me/${wa}" style="display:inline-block;background:#25D366;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;margin-right:10px;">WhatsApp</a>
            <a href="mailto:torviantransfer@gmail.com" style="display:inline-block;background:#f97316;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700;">E-mail</a>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#0a0a0b;border-top:1px solid #1c1c1e;border-radius:0 0 16px 16px;padding:18px 40px;text-align:center;">
      <p style="color:#3f3f46;font-size:11px;margin:0 0 4px;">Bu e-posta transferiniz hakkında bilgilendirme amaçlıdır.</p>
      <p style="color:#27272a;font-size:10px;margin:0;">&#169; ${new Date().getFullYear()} TORVIAN Transfer &middot; Antalya, Turkey &middot; <a href="${siteUrl}" style="color:#3f3f46;text-decoration:none;">torviantransfer.com</a></p>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;

  try {
    await resend.emails.send({
      from: "TORVIAN Transfer <noreply@torviantransfer.com>",
      to: data.to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send driver assignment email:", err);
  }
}
