import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import type { Settlement } from "@/lib/currency";
import { BOOKING_TZ } from "@/lib/datetime";
import {
  balanceStatus,
  fmtDay,
  fmtMoney,
  fmtRate,
  LEDGER_TYPE_LABEL,
  rangeLabel,
  TRIP_LABEL,
  type JobRow,
  type LegCell,
  type Statement,
} from "@/lib/driverStatement";

/**
 * A driver's statement as a file to hand over: Excel for working with, PDF
 * for sending. Both print the figures lib/driverStatement.ts worked out; none
 * are recomputed here.
 */

const CURRENCY_NOTE =
  "Hesap dolar tutulur. Euro tutarlar kendi günlerinin kuruyla çevrilir: şoför ücreti rezervasyon gününün, ödeme ödeme gününün kuruyla.";

const generatedAt = () =>
  new Date().toLocaleString("tr-TR", {
    timeZone: BOOKING_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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

const originalText = (m: Statement["movements"][number]) =>
  m.original ? fmtMoney(m.original.amount, m.original.currency) : "";

// ─── Excel ───

const USD_FMT = '"$"#,##0.00;[Red]-"$"#,##0.00';
const EUR_FMT = '"€"#,##0.00;[Red]-"€"#,##0.00';
const moneyFmt = (currency: Settlement) => (currency === "EUR" ? EUR_FMT : USD_FMT);

function styleHeader(row: ExcelJS.Row) {
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

  const money = (label: string, value: number, currency: Settlement, bold = false) => {
    const row = sum.addRow([label, value]);
    row.getCell(2).numFmt = moneyFmt(currency);
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
    row.getCell(9).numFmt = moneyFmt(j.fare.currency);
    if (j.outbound) row.getCell(10).numFmt = moneyFmt(j.outbound.currency);
    if (j.ret) row.getCell(12).numFmt = moneyFmt(j.ret.currency);
    if (j.cash) row.getCell(14).numFmt = moneyFmt(j.cash.currency);
    row.getCell(15).numFmt = EUR_FMT;
    row.getCell(16).numFmt = USD_FMT;
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
  jobTotal.getCell(9).numFmt = EUR_FMT;
  jobTotal.getCell(15).numFmt = EUR_FMT;
  jobTotal.getCell(16).numFmt = USD_FMT;

  // ── Hareketler
  const moves = wb.addWorksheet("Hareketler", { views: [{ state: "frozen", ySplit: 1 }] });
  moves.columns = [
    { header: "Tarih", width: 17 },
    { header: "Tür", width: 11 },
    { header: "Açıklama", width: 46 },
    { header: "Rez. kodu", width: 14 },
    { header: "Asıl tutar", width: 13 },
    { header: "Kur (1 € = $)", width: 12 },
    { header: "Tutar ($)", width: 13 },
    { header: "Bakiye ($)", width: 14 },
    { header: "Kayıt", width: 10 },
  ];
  styleHeader(moves.getRow(1));
  const opening = moves.addRow(["", "", "Devreden bakiye", "", null, null, null, s.opening, ""]);
  opening.font = { italic: true };
  opening.getCell(8).numFmt = USD_FMT;
  for (const m of s.movements) {
    const row = moves.addRow([
      `${fmtDay(m.day)} ${m.time}`,
      LEDGER_TYPE_LABEL[m.type],
      m.usd === null ? `${m.description} (kur yok — bakiyeye katılmadı)` : m.description,
      m.code ?? "",
      m.original?.amount ?? null,
      m.rate,
      m.usd,
      m.balance,
      m.manual ? "Elle" : "Otomatik",
    ]);
    if (m.original) row.getCell(5).numFmt = moneyFmt(m.original.currency);
    row.getCell(6).numFmt = "0.0000";
    row.getCell(7).numFmt = USD_FMT;
    row.getCell(8).numFmt = USD_FMT;
  }
  const closing = moves.addRow(["", "", "Dönem sonu bakiye", "", null, null, null, s.closing, ""]);
  closing.font = { bold: true };
  closing.getCell(8).numFmt = USD_FMT;

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}

// ─── PDF ───

interface Column {
  title: string;
  width: number;
  right?: boolean;
}

interface TableRow {
  cells: string[];
  bold?: boolean;
  shade?: boolean;
}

const MARGIN = 10;
const FONT = "Inter";

/** Draws a table from `startY`, carrying the header onto every new page. Returns the y it ended at. */
function drawTable(doc: jsPDF, columns: Column[], rows: TableRow[], startY: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  const bottom = pageH - 12;
  const tableW = columns.reduce((w, c) => w + c.width, 0);
  const padX = 1.2;
  const lineH = 3;
  let y = startY;

  const cellX = (x: number, c: Column) => (c.right ? x + c.width - padX : x + padX);

  const header = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(MARGIN, y, tableW, 6, "F");
    doc.setFont(FONT, "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    let x = MARGIN;
    for (const c of columns) {
      doc.text(c.title, cellX(x, c), y + 4, { align: c.right ? "right" : "left" });
      x += c.width;
    }
    y += 6;
  };

  header();
  for (const row of rows) {
    doc.setFont(FONT, row.bold ? "bold" : "normal");
    doc.setFontSize(7);
    // An empty string is a deliberately blank cell (a totals row); a missing
    // value in a data row is passed in as "—" by the caller.
    const lines = row.cells.map((text, i) => {
      if (!text) return [] as string[];
      const wrapped = doc.splitTextToSize(text, columns[i].width - padX * 2) as string[];
      if (wrapped.length <= 2) return wrapped;
      return [wrapped[0], `${wrapped[1].slice(0, -1)}…`];
    });
    const rowH = Math.max(1, ...lines.map((l) => l.length)) * lineH + 2.6;

    if (y + rowH > bottom) {
      doc.addPage();
      y = MARGIN;
      header();
      doc.setFont(FONT, row.bold ? "bold" : "normal");
      doc.setFontSize(7);
    }

    if (row.shade) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGIN, y, tableW, rowH, "F");
    }
    doc.setTextColor(15, 23, 42);
    let x = MARGIN;
    lines.forEach((l, i) => {
      doc.text(l, cellX(x, columns[i]), y + 3.6, { align: columns[i].right ? "right" : "left" });
      x += columns[i].width;
    });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(MARGIN, y + rowH, MARGIN + tableW, y + rowH);
    y += rowH;
  }
  return y;
}

function sectionTitle(doc: jsPDF, title: string, y: number): number {
  if (y + 24 > doc.internal.pageSize.getHeight() - 12) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFont(FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(title, MARGIN, y + 4);
  return y + 7;
}

export async function statementPdf(s: Statement): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Inter carries ş, ğ, ı and the rest; jsPDF's built-in faces do not.
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  doc.addFileToVFS("Inter-Regular.ttf", fs.readFileSync(path.join(fontsDir, "Inter-Regular.ttf")).toString("base64"));
  doc.addFont("Inter-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("Inter-Bold.ttf", fs.readFileSync(path.join(fontsDir, "Inter-Bold.ttf")).toString("base64"));
  doc.addFont("Inter-Bold.ttf", FONT, "bold");

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = MARGIN + 4;

  // ── Header
  doc.setFont(FONT, "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text("Şoför Cari Ekstresi", MARGIN, y);
  doc.setFont(FONT, "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("TORVIAN Transfer", pageW - MARGIN, y, { align: "right" });
  y += 6;
  doc.setFont(FONT, "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(s.driver.name, MARGIN, y);
  doc.setFont(FONT, "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Oluşturulma: ${generatedAt()}`, pageW - MARGIN, y, { align: "right" });
  doc.text(`${rangeLabel(s.range)}${s.driver.phone ? `  ·  ${s.driver.phone}` : ""}`, MARGIN, y + 4.5);
  y += 9;

  // ── Balance tiles
  const status = balanceStatus(s.current.balance);
  const tiles: [string, string][] = [
    ["Devreden bakiye", fmtMoney(s.opening, "USD")],
    ["Dönemde hak ediş", fmtMoney(s.periodTotals.earnings, "USD")],
    ["Dönemde ödenen", fmtMoney(s.periodTotals.payments, "USD")],
    ["Dönemde düzeltme", fmtMoney(s.periodTotals.adjustments, "USD")],
    ["Dönem sonu bakiye", fmtMoney(s.closing, "USD")],
    [`Bugün itibarıyla: ${status.label}`, fmtMoney(Math.abs(s.current.balance), "USD")],
  ];
  const gap = 3;
  const tileW = (pageW - MARGIN * 2 - gap * (tiles.length - 1)) / tiles.length;
  const statusFill: Record<typeof status.tone, [number, number, number]> = {
    owe: [254, 243, 199],
    owed: [255, 228, 230],
    closed: [220, 252, 231],
  };
  tiles.forEach(([label, value], i) => {
    const x = MARGIN + i * (tileW + gap);
    const last = i === tiles.length - 1;
    const fill = last ? statusFill[status.tone] : ([241, 245, 249] as [number, number, number]);
    doc.setFillColor(...fill);
    doc.roundedRect(x, y, tileW, 14, 1.5, 1.5, "F");
    doc.setFont(FONT, "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + 3, y + 5);
    doc.setFont(FONT, "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(value, x + 3, y + 11);
  });
  y += 18;

  doc.setFont(FONT, "normal");
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
  if (s.jobs.length === 0) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Bu dönemde iş yok.", MARGIN, y + 5);
    y += 6;
  }
  y += 6;

  // ── Movements
  y = sectionTitle(doc, "Hareketler", y);
  y = drawTable(
    doc,
    [
      { title: "Tarih", width: 22 },
      { title: "Tür", width: 18 },
      { title: "Açıklama", width: 110 },
      { title: "Kod", width: 20 },
      { title: "Asıl tutar", width: 24, right: true },
      { title: "Kur", width: 18, right: true },
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
          originalText(m),
          m.rate === null ? "" : fmtRate(m.rate),
          m.usd === null ? "—" : fmtMoney(m.usd, "USD"),
          fmtMoney(m.balance, "USD"),
          m.manual ? "Elle" : "Otomatik",
        ],
      })),
      { bold: true, cells: ["", "", "Dönem sonu bakiye", "", "", "", "", fmtMoney(s.closing, "USD"), ""] },
    ],
    y
  );

  // ── Note and page numbers
  if (y + 10 > pageH - 12) {
    doc.addPage();
    y = MARGIN;
  }
  doc.setFont(FONT, "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(CURRENCY_NOTE, MARGIN, y + 6);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont(FONT, "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`${s.driver.name} · ${rangeLabel(s.range)}`, MARGIN, pageH - 5);
    doc.text(`Sayfa ${i} / ${pages}`, pageW - MARGIN, pageH - 5, { align: "right" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
