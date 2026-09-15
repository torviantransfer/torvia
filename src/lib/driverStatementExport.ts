import ExcelJS from "exceljs";
import {
  balanceStatus,
  fmtDay,
  fmtMoney,
  LEDGER_TYPE_LABEL,
  rangeLabel,
  rateText,
  TRIP_LABEL,
  type JobRow,
  type LegCell,
  type MovementRow,
  type Statement,
} from "@/lib/driverStatement";
import {
  createPdf,
  drawHeader,
  drawNote,
  drawTable,
  drawTiles,
  generatedAt,
  MARGIN,
  pdfBuffer,
  sectionTitle,
  stampFooters,
  type RGB,
} from "@/lib/pdfKit";
import type { Cash } from "@/lib/rates";

/**
 * A driver's statement as a file to hand over: Excel for working with, PDF
 * for sending. Both print the figures lib/driverStatement.ts worked out; none
 * are recomputed here.
 */

const CURRENCY_NOTE =
  "Hesap dolar tutulur. Euro ve TL tutarlar kendi günlerinin kuruyla çevrilir: şoför ücreti rezervasyon gününün, ödeme ödeme gününün kuruyla.";

const flights = (j: JobRow) => {
  if (j.flightOut && j.flightReturn) return `G: ${j.flightOut} / D: ${j.flightReturn}`;
  return j.flightOut ?? (j.flightReturn ? `D: ${j.flightReturn}` : "—");
};

/** Plates of the legs this driver drove; one if both legs used the same car. */
const plates = (j: JobRow) =>
  [...new Set([j.outbound, j.ret].filter((c): c is LegCell => !!c?.mine && !!c.plate).map((c) => c.plate))].join(" / ") ||
  "—";

const legText = (cell: LegCell | null) => {
  if (!cell) return "—";
  const fee = cell.fee === null ? "ücret yok" : fmtMoney(cell.fee, cell.currency);
  return cell.mine ? fee : `${fee} (${cell.driverName})`;
};

const cashText = (j: JobRow) =>
  j.cash ? `${fmtMoney(j.cash.value, j.cash.currency)}${j.cash.collectedByMe ? "" : " (diğer şoför)"}` : "—";

const movementRate = (m: MovementRow) => (m.original && m.rate !== null ? rateText(m.original.currency, m.rate) : "");

// ─── Excel ───

const FMT: Record<Cash, string> = {
  USD: '"$"#,##0.00;[Red]-"$"#,##0.00',
  EUR: '"€"#,##0.00;[Red]-"€"#,##0.00',
  TRY: '#,##0.00" ₺";[Red]-#,##0.00" ₺"',
};

export function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.alignment = { vertical: "middle", wrapText: true };
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };
  });
}

export async function statementXlsx(s: Statement): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "TORVIAN Transfer";
  wb.created = new Date();

  // ── Özet
  const sum = wb.addWorksheet("Özet");
  sum.columns = [{ width: 44 }, { width: 22 }];
  sum.addRow(["Şoför Cari Ekstresi"]).font = { bold: true, size: 14 };
  sum.addRow(["Şoför", s.driver.name]);
  if (s.driver.phone) sum.addRow(["Telefon", s.driver.phone]);
  sum.addRow(["Dönem", rangeLabel(s.range)]);
  sum.addRow(["Oluşturulma", generatedAt()]);
  sum.addRow([]);

  const money = (label: string, value: number, currency: Cash, bold = false) => {
    const row = sum.addRow([label, value]);
    row.getCell(2).numFmt = FMT[currency];
    if (bold) row.font = { bold: true };
  };
  money("Devreden bakiye", s.opening, "USD");
  money("Dönemde hak ediş", s.periodTotals.earnings, "USD");
  money("Dönemde ödenen", s.periodTotals.payments, "USD");
  money("Dönemde düzeltme", s.periodTotals.adjustments, "USD");
  money("Dönem sonu bakiye", s.closing, "USD", true);
  sum.addRow([]);
  const status = balanceStatus(s.current.balance);
  money(`Bugün itibarıyla — ${status.label}`, Math.abs(s.current.balance), "USD", true);
  if (s.current.upcoming !== 0) money("İleri tarihli işlerden (bakiyeye henüz girmedi)", s.current.upcoming, "USD");
  sum.addRow([]);
  sum.addRow(["Transfer sayısı", s.jobTotals.count]);
  money("Müşteriden alınan", s.jobTotals.fareEur, "EUR");
  money("Şoförlere giden", s.jobTotals.feesEur, "EUR");
  money("Bize kalan", s.jobTotals.marginEur, "EUR", true);
  if (s.jobTotals.incomplete > 0) {
    sum.addRow([`${s.jobTotals.incomplete} transferde şoför ücreti eksik; euro toplamlarına katılmadı.`]);
  }
  sum.addRow([]);
  sum.addRow([CURRENCY_NOTE]);

  // ── İşler
  const jobs = wb.addWorksheet("İşler", { views: [{ state: "frozen", ySplit: 1 }] });
  jobs.columns = [
    { header: "Tarih", width: 17 },
    { header: "Rez. kodu", width: 14 },
    { header: "Tür", width: 12 },
    { header: "Güzergah", width: 26 },
    { header: "Uçuş", width: 22 },
    { header: "Otel", width: 28 },
    { header: "Plaka", width: 14 },
    { header: "Ödeme", width: 9 },
    { header: "Müşteriden", width: 13 },
    { header: "Gidiş ücreti", width: 13 },
    { header: "Gidiş şoförü", width: 18 },
    { header: "Dönüş ücreti", width: 13 },
    { header: "Dönüş şoförü", width: 18 },
    { header: "Nakit tahsilat", width: 13 },
    { header: "Bize kalan (€)", width: 14 },
    { header: "Şoför bakiyesine ($)", width: 18 },
  ];
  styleHeader(jobs.getRow(1));
  for (const j of s.jobs) {
    const row = jobs.addRow([
      `${fmtDay(j.day)} ${j.time}`,
      j.code,
      TRIP_LABEL(j.tripType),
      j.route,
      flights(j),
      j.hotel ?? "",
      plates(j),
      j.payment === "cash" ? "Nakit" : "Online",
      j.fare.value,
      j.outbound?.fee ?? null,
      j.outbound?.driverName ?? "",
      j.ret?.fee ?? null,
      j.ret?.driverName ?? "",
      j.cash?.value ?? null,
      j.marginEur,
      j.driverNetUsd,
    ]);
    row.getCell(9).numFmt = FMT[j.fare.currency];
    if (j.outbound) row.getCell(10).numFmt = FMT[j.outbound.currency];
    if (j.ret) row.getCell(12).numFmt = FMT[j.ret.currency];
    if (j.cash) row.getCell(14).numFmt = FMT[j.cash.currency];
    row.getCell(15).numFmt = FMT.EUR;
    row.getCell(16).numFmt = FMT.USD;
  }
  const jobTotal = jobs.addRow([
    `${s.jobTotals.count} transfer`,
    "", "", "", "", "", "", "",
    s.jobTotals.fareEur,
    "", "", "", "", "",
    s.jobTotals.marginEur,
    s.jobTotals.driverNetUsd,
  ]);
  jobTotal.font = { bold: true };
  jobTotal.getCell(9).numFmt = FMT.EUR;
  jobTotal.getCell(15).numFmt = FMT.EUR;
  jobTotal.getCell(16).numFmt = FMT.USD;

  // ── Hareketler
  const moves = wb.addWorksheet("Hareketler", { views: [{ state: "frozen", ySplit: 1 }] });
  moves.columns = [
    { header: "Tarih", width: 17 },
    { header: "Tür", width: 11 },
    { header: "Açıklama", width: 46 },
    { header: "Rez. kodu", width: 14 },
    { header: "Asıl tutar", width: 14 },
    { header: "Kur", width: 18 },
    { header: "Tutar ($)", width: 13 },
    { header: "Bakiye ($)", width: 14 },
    { header: "Kayıt", width: 10 },
  ];
  styleHeader(moves.getRow(1));
  const opening = moves.addRow(["", "", "Devreden bakiye", "", null, "", null, s.opening, ""]);
  opening.font = { italic: true };
  opening.getCell(8).numFmt = FMT.USD;
  for (const m of s.movements) {
    const row = moves.addRow([
      `${fmtDay(m.day)} ${m.time}`,
      LEDGER_TYPE_LABEL[m.type],
      m.usd === null ? `${m.description} (kur yok — bakiyeye katılmadı)` : m.description,
      m.code ?? "",
      m.original?.amount ?? null,
      movementRate(m),
      m.usd,
      m.balance,
      m.manual ? "Elle" : "Otomatik",
    ]);
    if (m.original) row.getCell(5).numFmt = FMT[m.original.currency];
    row.getCell(7).numFmt = FMT.USD;
    row.getCell(8).numFmt = FMT.USD;
  }
  const closing = moves.addRow(["", "", "Dönem sonu bakiye", "", null, "", null, s.closing, ""]);
  closing.font = { bold: true };
  closing.getCell(8).numFmt = FMT.USD;

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}

// ─── PDF ───

export async function statementPdf(s: Statement): Promise<Buffer> {
  const doc = createPdf();
  const pageW = doc.internal.pageSize.getWidth();

  let y = drawHeader(doc, {
    title: "Şoför Cari Ekstresi",
    subject: s.driver.name,
    detail: `${rangeLabel(s.range)}${s.driver.phone ? `  ·  ${s.driver.phone}` : ""}`,
  });

  const status = balanceStatus(s.current.balance);
  const statusFill: Record<typeof status.tone, RGB> = {
    owe: [254, 243, 199],
    owed: [255, 228, 230],
    closed: [220, 252, 231],
  };
  y = drawTiles(
    doc,
    [
      { label: "Devreden bakiye", value: fmtMoney(s.opening, "USD") },
      { label: "Dönemde hak ediş", value: fmtMoney(s.periodTotals.earnings, "USD") },
      { label: "Dönemde ödenen", value: fmtMoney(s.periodTotals.payments, "USD") },
      { label: "Dönemde düzeltme", value: fmtMoney(s.periodTotals.adjustments, "USD") },
      { label: "Dönem sonu bakiye", value: fmtMoney(s.closing, "USD") },
      {
        label: `Bugün itibarıyla: ${status.label}`,
        value: fmtMoney(Math.abs(s.current.balance), "USD"),
        fill: statusFill[status.tone],
      },
    ],
    y
  );

  doc.setFont("Inter", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const totals = [
    `${s.jobTotals.count} transfer`,
    `Müşteriden ${fmtMoney(s.jobTotals.fareEur, "EUR")}`,
    `Şoförlere ${fmtMoney(s.jobTotals.feesEur, "EUR")}`,
    `Bize kalan ${fmtMoney(s.jobTotals.marginEur, "EUR")}`,
  ].join("   ·   ");
  doc.text(
    s.jobTotals.incomplete > 0 ? `${totals}   (${s.jobTotals.incomplete} transferde ücret eksik, toplama katılmadı)` : totals,
    MARGIN,
    y + 2
  );
  if (s.current.upcoming !== 0) {
    doc.text(`İleri tarihli işlerden: ${fmtMoney(s.current.upcoming, "USD")}`, pageW - MARGIN, y + 2, { align: "right" });
  }
  y += 6;

  // ── Jobs
  y = sectionTitle(doc, "İşler", y);
  y = drawTable(
    doc,
    [
      { title: "Tarih", width: 20 },
      { title: "Kod", width: 19 },
      { title: "Tür", width: 17 },
      { title: "Güzergah", width: 28 },
      { title: "Uçuş", width: 22 },
      { title: "Otel", width: 29 },
      { title: "Plaka", width: 17 },
      { title: "Ödeme", width: 12 },
      { title: "Müşteriden", width: 17, right: true },
      { title: "Gidiş ücreti", width: 24, right: true },
      { title: "Dönüş ücreti", width: 24, right: true },
      { title: "Nakit", width: 16, right: true },
      { title: "Bize kalan", width: 17, right: true },
      { title: "Şoföre ($)", width: 15, right: true },
    ],
    [
      ...s.jobs.map((j, i) => ({
        shade: i % 2 === 1,
        cells: [
          `${fmtDay(j.day)} ${j.time}`,
          j.code,
          TRIP_LABEL(j.tripType),
          j.route,
          flights(j),
          j.hotel ?? "—",
          plates(j),
          j.payment === "cash" ? "Nakit" : "Online",
          fmtMoney(j.fare.value, j.fare.currency),
          legText(j.outbound),
          legText(j.ret),
          cashText(j),
          j.marginEur === null ? "eksik" : fmtMoney(j.marginEur, "EUR"),
          j.driverNetUsd === null ? "—" : fmtMoney(j.driverNetUsd, "USD"),
        ],
      })),
      {
        bold: true,
        cells: [
          `${s.jobTotals.count} transfer`,
          "", "", "", "", "", "", "",
          fmtMoney(s.jobTotals.fareEur, "EUR"),
          "", "", "",
          fmtMoney(s.jobTotals.marginEur, "EUR"),
          fmtMoney(s.jobTotals.driverNetUsd, "USD"),
        ],
      },
    ],
    y
  );
  y += 6;

  // ── Movements
  y = sectionTitle(doc, "Hareketler", y);
  y = drawTable(
    doc,
    [
      { title: "Tarih", width: 22 },
      { title: "Tür", width: 18 },
      { title: "Açıklama", width: 100 },
      { title: "Kod", width: 20 },
      { title: "Asıl tutar", width: 24, right: true },
      { title: "Kur", width: 28, right: true },
      { title: "Tutar ($)", width: 22, right: true },
      { title: "Bakiye ($)", width: 25, right: true },
      { title: "Kayıt", width: 18 },
    ],
    [
      { cells: ["", "", "Devreden bakiye", "", "", "", "", fmtMoney(s.opening, "USD"), ""], shade: true },
      ...s.movements.map((m) => ({
        cells: [
          `${fmtDay(m.day)} ${m.time}`,
          LEDGER_TYPE_LABEL[m.type],
          m.usd === null ? `${m.description} (kur yok — bakiyeye katılmadı)` : m.description,
          m.code ?? "",
          m.original ? fmtMoney(m.original.amount, m.original.currency) : "",
          movementRate(m),
          m.usd === null ? "—" : fmtMoney(m.usd, "USD"),
          fmtMoney(m.balance, "USD"),
          m.manual ? "Elle" : "Otomatik",
        ],
      })),
      { bold: true, cells: ["", "", "Dönem sonu bakiye", "", "", "", "", fmtMoney(s.closing, "USD"), ""] },
    ],
    y
  );

  drawNote(doc, CURRENCY_NOTE, y);
  stampFooters(doc, `${s.driver.name} · ${rangeLabel(s.range)}`);
  return pdfBuffer(doc);
}
