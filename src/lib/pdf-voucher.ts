import { jsPDF } from "jspdf";
import type { ReservationEmailData } from "./email";

// ─── i18n labels for PDF ───
const labels: Record<string, Record<string, string>> = {
  en: {
    title: "TRANSFER VOUCHER",
    code: "Reservation Code",
    route: "Route",
    type: "Trip Type",
    oneWay: "One Way",
    roundTrip: "Round Trip",
    pickup: "Pickup Date & Time",
    returnLabel: "Return Date & Time",
    flight: "Flight Code",
    hotel: "Hotel",
    vehicle: "Vehicle",
    passengers: "Passengers",
    adult: "adult",
    adults: "adults",
    child: "child",
    children: "children",
    luggage: "Luggage",
    pieces: "pcs",
    extras: "Extras",
    childSeat: "Child Seat",
    customer: "Customer",
    priceSummary: "PRICE SUMMARY",
    base: "Base Price",
    nightCharge: "Night Surcharge",
    childSeatFee: "Child Seat Fee",
    rtDiscount: "Round Trip Discount",
    couponDiscount: "Coupon Discount",
    total: "TOTAL PAID",
    qrLabel: "Show this QR to your driver",
    important: "IMPORTANT INFORMATION",
    imp1: "Your driver will track your flight — no need to worry about delays.",
    imp2: "The driver will wait at the airport exit with a name sign.",
    imp3: "Free waiting: 60 min for flights, 15 min for hotels.",
    imp4: "Free child seat & booster on request.",
    imp5: "Do not contact the driver directly for future bookings.",
    footer: "This document serves as your official transfer voucher.",
    contact: "24/7 Support: 0850 840 1327 | torviantransfer@gmail.com",
    paid: "PAID & CONFIRMED",
  },
  tr: {
    title: "TRANSFER VOUCHER",
    code: "Rezervasyon Kodu",
    route: "Güzergah",
    type: "Transfer Tipi",
    oneWay: "Tek Yön",
    roundTrip: "Gidiş - Dönüş",
    pickup: "Alış Tarih & Saat",
    returnLabel: "Dönüş Tarih & Saat",
    flight: "Uçuş Kodu",
    hotel: "Otel",
    vehicle: "Araç",
    passengers: "Yolcular",
    adult: "yetişkin",
    adults: "yetişkin",
    child: "çocuk",
    children: "çocuk",
    luggage: "Bagaj",
    pieces: "adet",
    extras: "Ekstralar",
    childSeat: "Çocuk Koltuğu",
    customer: "Müşteri",
    priceSummary: "FİYAT ÖZETİ",
    base: "Taban Fiyat",
    nightCharge: "Gece Tarifesi",
    childSeatFee: "Çocuk Koltuğu",
    rtDiscount: "Gidiş-Dönüş İndirimi",
    couponDiscount: "Kupon İndirimi",
    total: "TOPLAM ÖDENEN",
    qrLabel: "Bu QR kodu şoförünüze gösterin",
    important: "ÖNEMLİ BİLGİLER",
    imp1: "Şoförünüz uçuşunuzu takip eder — rötar için endişelenmeyin.",
    imp2: "Şoför havalimanı çıkışında isim tabelasıyla bekleyecektir.",
    imp3: "Ücretsiz bekleme: Uçuşlarda 60 dk, otellerden 15 dk.",
    imp4: "Talep üzerine ücretsiz çocuk koltuğu.",
    imp5: "Bir sonraki taşımalarda şoför ile doğrudan iletişime geçmeyiniz.",
    footer: "Bu belge resmi transfer voucherınız olarak geçerlidir.",
    contact: "7/24 Destek: 0850 840 1327 | torviantransfer@gmail.com",
    paid: "ÖDENDİ & ONAYLANDI",
  },
  de: {
    title: "TRANSFER VOUCHER",
    code: "Buchungscode",
    route: "Route",
    type: "Transferart",
    oneWay: "Einfache Fahrt",
    roundTrip: "Hin- und Rückfahrt",
    pickup: "Abholung Datum & Zeit",
    returnLabel: "Rückfahrt Datum & Zeit",
    flight: "Flugnummer",
    hotel: "Hotel",
    vehicle: "Fahrzeug",
    passengers: "Passagiere",
    adult: "Erwachsener",
    adults: "Erwachsene",
    child: "Kind",
    children: "Kinder",
    luggage: "Gepäck",
    pieces: "Stk",
    extras: "Extras",
    childSeat: "Kindersitz",
    customer: "Kunde",
    priceSummary: "PREISÜBERSICHT",
    base: "Grundpreis",
    nightCharge: "Nachtzuschlag",
    childSeatFee: "Kindersitz",
    rtDiscount: "Hin-/Rückfahrt-Rabatt",
    couponDiscount: "Gutschein-Rabatt",
    total: "GESAMT BEZAHLT",
    qrLabel: "Zeigen Sie diesen QR Ihrem Fahrer",
    important: "WICHTIGE INFORMATIONEN",
    imp1: "Ihr Fahrer verfolgt Ihren Flug — keine Sorge bei Verspätungen.",
    imp2: "Der Fahrer erwartet Sie am Ausgang mit einem Namensschild.",
    imp3: "Kostenlose Wartezeit: 60 Min Flüge, 15 Min Hotels.",
    imp4: "Kostenloser Kindersitz auf Anfrage.",
    imp5: "Kontaktieren Sie den Fahrer nicht direkt für zukünftige Buchungen.",
    footer: "Dieses Dokument dient als Ihr offizieller Transfer-Voucher.",
    contact: "24/7 Support: 0850 840 1327 | torviantransfer@gmail.com",
    paid: "BEZAHLT & BESTÄTIGT",
  },
  pl: {
    title: "VOUCHER TRANSFEROWY",
    code: "Kod Rezerwacji",
    route: "Trasa",
    type: "Typ Transferu",
    oneWay: "W jedną stronę",
    roundTrip: "W obie strony",
    pickup: "Data i godzina odbioru",
    returnLabel: "Data i godzina powrotu",
    flight: "Numer lotu",
    hotel: "Hotel",
    vehicle: "Pojazd",
    passengers: "Pasażerowie",
    adult: "dorosły",
    adults: "dorośli",
    child: "dziecko",
    children: "dzieci",
    luggage: "Bagaż",
    pieces: "szt",
    extras: "Dodatki",
    childSeat: "Fotelik dziecięcy",
    customer: "Klient",
    priceSummary: "PODSUMOWANIE CENY",
    base: "Cena podstawowa",
    nightCharge: "Dopłata nocna",
    childSeatFee: "Fotelik dziecięcy",
    rtDiscount: "Rabat w obie strony",
    couponDiscount: "Rabat kuponowy",
    total: "ZAPŁACONO ŁĄCZNIE",
    qrLabel: "Pokaż ten QR kierowcy",
    important: "WAŻNE INFORMACJE",
    imp1: "Kierowca śledzi Twój lot — nie martw się opóźnieniami.",
    imp2: "Kierowca będzie czekał przy wyjściu z tabliczką.",
    imp3: "Bezpłatne oczekiwanie: 60 min loty, 15 min hotele.",
    imp4: "Bezpłatny fotelik dziecięcy na życzenie.",
    imp5: "Nie kontaktuj się bezpośrednio z kierowcą w sprawie przyszłych rezerwacji.",
    footer: "Ten dokument służy jako oficjalny voucher transferowy.",
    contact: "24/7 Wsparcie: 0850 840 1327 | torviantransfer@gmail.com",
    paid: "OPŁACONO I POTWIERDZONE",
  },
  ru: {
    title: "ВАУЧЕР НА ТРАНСФЕР",
    code: "Код бронирования",
    route: "Маршрут",
    type: "Тип трансфера",
    oneWay: "В одну сторону",
    roundTrip: "Туда и обратно",
    pickup: "Дата и время подачи",
    returnLabel: "Дата и время возврата",
    flight: "Номер рейса",
    hotel: "Отель",
    vehicle: "Транспорт",
    passengers: "Пассажиры",
    adult: "взрослый",
    adults: "взрослых",
    child: "ребёнок",
    children: "детей",
    luggage: "Багаж",
    pieces: "шт",
    extras: "Дополнительно",
    childSeat: "Детское кресло",
    customer: "Клиент",
    priceSummary: "СВОДКА ПО ЦЕНЕ",
    base: "Базовая цена",
    nightCharge: "Ночная надбавка",
    childSeatFee: "Детское кресло",
    rtDiscount: "Скидка туда-обратно",
    couponDiscount: "Скидка по купону",
    total: "ИТОГО ОПЛАЧЕНО",
    qrLabel: "Покажите этот QR водителю",
    important: "ВАЖНАЯ ИНФОРМАЦИЯ",
    imp1: "Водитель отслеживает ваш рейс — не переживайте из-за задержек.",
    imp2: "Водитель встретит вас у выхода с табличкой.",
    imp3: "Бесплатное ожидание: 60 мин рейсы, 15 мин отели.",
    imp4: "Бесплатное детское кресло по запросу.",
    imp5: "Не связывайтесь с водителем напрямую для будущих бронирований.",
    footer: "Этот документ является вашим официальным ваучером на трансфер.",
    contact: "24/7 Поддержка: 0850 840 1327 | torviantransfer@gmail.com",
    paid: "ОПЛАЧЕНО И ПОДТВЕРЖДЕНО",
  },
};

function t(locale: string, key: string): string {
  return labels[locale]?.[key] ?? labels.en[key] ?? key;
}

export async function generatePDFVoucher(data: ReservationEmailData): Promise<Buffer> {
  const loc = data.locale;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth(); // 210
  const margin = 20;
  const contentW = pw - margin * 2; // 170
  const rightEdge = pw - margin;

  // Colors
  const orange = [249, 115, 22] as const;
  const darkText = [17, 24, 39] as const;
  const midGray = [107, 114, 128] as const;
  const lightGray = [156, 163, 175] as const;
  const lineGray = [229, 231, 235] as const;
  const green = [22, 163, 74] as const;
  const bgLight = [249, 250, 251] as const;

  let y = 0;

  // ─── HEADER STRIPE ───
  doc.setFillColor(...orange);
  doc.rect(0, 0, pw, 4, "F");

  y = 18;
  doc.setTextColor(...darkText);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("TORVIAN", margin, y);

  doc.setTextColor(...midGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("VIP AIRPORT TRANSFER", margin, y + 6);

  // Status badge (right side)
  const statusText = t(loc, "paid");
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(rightEdge - 50, y - 8, 50, 10, 2, 2, "F");
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(rightEdge - 50, y - 8, 50, 10, 2, 2, "S");
  doc.setTextColor(...green);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, rightEdge - 25, y - 2, { align: "center" });

  y += 14;

  // Divider
  doc.setDrawColor(...lineGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, rightEdge, y);
  y += 8;

  // ─── RESERVATION CODE ───
  doc.setTextColor(...lightGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(t(loc, "code").toUpperCase(), margin, y);

  doc.setTextColor(...orange);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(data.reservationCode, margin, y + 10);

  // Customer name (right aligned)
  doc.setTextColor(...lightGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(t(loc, "customer").toUpperCase(), rightEdge, y, { align: "right" });

  doc.setTextColor(...darkText);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.firstName} ${data.lastName}`, rightEdge, y + 10, { align: "right" });

  y += 20;

  // ─── ROUTE BANNER ───
  doc.setFillColor(...bgLight);
  doc.roundedRect(margin, y, contentW, 18, 2, 2, "F");

  doc.setTextColor(...midGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("ANTALYA AIRPORT (AYT)", margin + 6, y + 7);

  // Arrow
  doc.setFillColor(...orange);
  const arrowX = pw / 2;
  doc.circle(arrowX, y + 9, 3.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(">", arrowX, y + 10.5, { align: "center" });

  doc.setTextColor(...darkText);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const destMaxW = contentW / 2 - 16;
  const destLines = doc.splitTextToSize(data.regionName.toUpperCase(), destMaxW);
  doc.text(destLines, rightEdge - 6, y + (destLines.length > 1 ? 6 : 8), { align: "right" });

  // Trip type below route
  doc.setTextColor(...lightGray);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const tripLabel = data.tripType === "round_trip" ? t(loc, "roundTrip") : t(loc, "oneWay");
  doc.text(tripLabel.toUpperCase(), margin + 6, y + 14);

  y += 26;

  // ─── DETAILS GRID (2 columns) ───
  const colW = contentW / 2;
  const col1 = margin;
  const col2 = margin + colW;

  interface DetailItem { label: string; value: string }
  const leftCol: DetailItem[] = [];
  const rightCol: DetailItem[] = [];

  leftCol.push({ label: t(loc, "pickup"), value: `${data.pickupDate}  ${data.pickupTime}` });
  if (data.returnDate) leftCol.push({ label: t(loc, "returnLabel"), value: `${data.returnDate}  ${data.returnTime ?? ""}` });
  if (data.flightCode) leftCol.push({ label: t(loc, "flight"), value: data.flightCode });
  if (data.hotelName) leftCol.push({ label: t(loc, "hotel"), value: data.hotelName });

  const passengerParts: string[] = [];
  if (data.adults > 0) passengerParts.push(`${data.adults} ${data.adults === 1 ? t(loc, "adult") : t(loc, "adults")}`);
  if (data.children > 0) passengerParts.push(`${data.children} ${data.children === 1 ? t(loc, "child") : t(loc, "children")}`);
  rightCol.push({ label: t(loc, "passengers"), value: passengerParts.join(" + ") });
  rightCol.push({ label: t(loc, "luggage"), value: `${data.luggageCount} ${t(loc, "pieces")}` });
  if (data.vehicleName) rightCol.push({ label: t(loc, "vehicle"), value: data.vehicleName });

  const extras: string[] = [];
  if (data.childSeat) extras.push(t(loc, "childSeat"));
  if (extras.length > 0) rightCol.push({ label: t(loc, "extras"), value: extras.join(", ") });

  const maxRows = Math.max(leftCol.length, rightCol.length);
  const rowH = 14;
  const gridH = maxRows * rowH + 6;

  // Light background for grid
  doc.setDrawColor(...lineGray);
  doc.setLineWidth(0.3);

  for (let i = 0; i < maxRows; i++) {
    const ry = y + i * rowH;

    // Subtle row separator
    if (i > 0) {
      doc.setDrawColor(...lineGray);
      doc.line(col1, ry, rightEdge, ry);
    }

    // Left column
    if (leftCol[i]) {
      doc.setTextColor(...lightGray);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(leftCol[i].label.toUpperCase(), col1, ry + 5);

      doc.setTextColor(...darkText);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(leftCol[i].value, col1, ry + 11);
    }

    // Right column
    if (rightCol[i]) {
      doc.setTextColor(...lightGray);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(rightCol[i].label.toUpperCase(), col2, ry + 5);

      doc.setTextColor(...darkText);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(rightCol[i].value, col2, ry + 11);
    }
  }

  y += gridH;

  // ─── DASHED TEAR LINE ───
  y += 2;
  doc.setDrawColor(...lightGray);
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.4);
  doc.line(margin, y, rightEdge, y);
  doc.setLineDashPattern([], 0);
  y += 6;

  // ─── PRICE + QR SECTION (side by side) ───
  const priceColW = contentW * 0.58;
  const qrColW = contentW * 0.42;
  const sectionStartY = y;

  // Price section (left)
  doc.setTextColor(...darkText);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(t(loc, "priceSummary"), margin, y + 4);

  y += 10;

  const priceLines: { label: string; value: string; isGreen?: boolean }[] = [];
  priceLines.push({ label: t(loc, "base"), value: `€${data.basePrice.toFixed(2)}` });
  if (data.nightSurcharge > 0) priceLines.push({ label: t(loc, "nightCharge"), value: `€${data.nightSurcharge.toFixed(2)}` });
  if (data.childSeatFee > 0) priceLines.push({ label: t(loc, "childSeatFee"), value: `€${data.childSeatFee.toFixed(2)}` });
  if (data.roundTripDiscount > 0) priceLines.push({ label: t(loc, "rtDiscount"), value: `-€${data.roundTripDiscount.toFixed(2)}`, isGreen: true });
  if (data.couponDiscount > 0) priceLines.push({ label: t(loc, "couponDiscount"), value: `-€${data.couponDiscount.toFixed(2)}`, isGreen: true });

  for (const line of priceLines) {
    doc.setTextColor(...midGray);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(line.label, margin, y);

    if (line.isGreen) doc.setTextColor(...green);
    else doc.setTextColor(...darkText);
    doc.setFont("helvetica", "bold");
    doc.text(line.value, margin + priceColW - 10, y, { align: "right" });
    y += 6.5;
  }

  // Total divider
  doc.setDrawColor(...lineGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + priceColW - 10, y);
  y += 6;

  doc.setTextColor(...darkText);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(t(loc, "total"), margin, y);

  doc.setTextColor(...orange);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`€${data.totalEur.toFixed(2)}`, margin + priceColW - 10, y + 1, { align: "right" });

  const priceEndY = y + 4;

  // QR code (right side)
  if (data.qrCodeToken) {
    try {
      const QRCode = await import("qrcode");
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://torviantransfer.com";
      const qrDataUrl = await QRCode.toDataURL(`${siteUrl}/verify/${data.qrCodeToken}`, {
        width: 500, margin: 1, color: { dark: "#111827", light: "#FFFFFF" },
      });

      const qrSize = 36;
      const qrX = margin + priceColW + (qrColW - qrSize) / 2;
      const qrY = sectionStartY + 2;

      // Light rounded background
      doc.setFillColor(...bgLight);
      doc.roundedRect(qrX - 4, qrY - 2, qrSize + 8, qrSize + 14, 3, 3, "F");

      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      doc.setTextColor(...midGray);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.text(t(loc, "qrLabel"), qrX + qrSize / 2, qrY + qrSize + 6, { align: "center" });
    } catch {
      // skip
    }
  }

  y = Math.max(priceEndY, sectionStartY + 52) + 8;

  // ─── IMPORTANT INFO ───
  doc.setFillColor(254, 252, 232); // warm yellow bg
  doc.roundedRect(margin, y, contentW, 37, 2, 2, "F");
  doc.setDrawColor(253, 224, 71);
  doc.roundedRect(margin, y, contentW, 37, 2, 2, "S");

  doc.setTextColor(161, 98, 7);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(t(loc, "important"), margin + 5, y + 6);

  doc.setTextColor(120, 53, 15);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const infoItems = [t(loc, "imp1"), t(loc, "imp2"), t(loc, "imp3"), t(loc, "imp4"), t(loc, "imp5")];
  let iy = y + 12;
  for (const item of infoItems) {
    doc.text(`•  ${item}`, margin + 5, iy);
    iy += 5;
  }

  y += 45;

  // ─── FOOTER ───
  doc.setDrawColor(...lineGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, rightEdge, y);
  y += 5;

  doc.setTextColor(...lightGray);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(t(loc, "footer"), pw / 2, y, { align: "center" });
  y += 4;
  doc.text(t(loc, "contact"), pw / 2, y, { align: "center" });
  y += 4;
  doc.setTextColor(200, 200, 200);
  doc.text(`© ${new Date().getFullYear()} TORVIAN Transfer  ·  torviantransfer.com`, pw / 2, y, { align: "center" });

  // Bottom orange stripe
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...orange);
  doc.rect(0, pageH - 3, pw, 3, "F");

  return Buffer.from(doc.output("arraybuffer"));
}
