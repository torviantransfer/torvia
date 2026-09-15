import ExcelJS from "exceljs";
import { styleHeader } from "@/lib/driverStatementExport";
import type { FinanceReport } from "@/lib/finance";
import {
  createPdf,
  drawHeader,
  drawNote,
  drawTable,
  drawTiles,
  generatedAt,
  pdfBuffer,
  sectionTitle,
  stampFooters,
} from "@/lib/pdfKit";
import { fmtDay, rangeLabel } from "@/lib/period";
import { fmtCash, fmtQuote } from "@/lib/rates";

/**
 * The finance report as a file: Excel to work with, PDF to keep or send to an
 * accountant. Every figure comes from lib/finance.ts.
 */

const NOTE =
  "Tutarlar euro. Ciro ve şoför maliyeti transfer tarihine göre rezervasyonlardan gelir; dolar ücretler rezervasyon gününün kuruyla, elle girilen kayıtlar girildikleri günün kuruyla euroya çevrilir.";

const EUR_FMT = '"€"#,##0.00;[Red]-"€"#,##0.00';
const pct = (v: number | null) => (v === null ? "—" : `%${v.toLocaleString("tr-TR")}`);
const TRIP = (t: string) => (t === "round_trip" ? "Gidiş-dönüş" : "Tek yön");

/** "1 € = 1,1600 $" for a row whose rate is stored as euro per unit. */
const entryRate = (currency: "EUR" | "USD" | "TRY", eurPerUnit: number) =>
  currency === "EUR" ? "" : fmtQuote(currency, "EUR", 1 / eurPerUnit);

export async function financeXlsx(r: FinanceReport): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "TORVIAN Transfer";
  wb.created = new Date();
  const t = r.totals;

  // ── Özet
  const sum = wb.addWorksheet("Özet");
  sum.columns = [{ width: 40 }, { width: 20 }, { width: 20 }];
  sum.addRow(["Kasa Raporu (kâr / zarar)"]).font = { bold: true, size: 14 };
  sum.addRow(["Dönem", rangeLabel(r.range)]);
  if (r.previousRange) sum.addRow(["Önceki dönem", rangeLabel(r.previousRange)]);
  sum.addRow(["Oluşturulma", generatedAt()]);
  sum.addRow([]);
  const head = sum.addRow(["", "Bu dönem", r.previous ? "Önceki dönem" : ""]);
  head.font = { bold: true };
  const line = (label: string, now: number, before: number | undefined, bold = false) => {
    const row = sum.addRow([label, now, before ?? null]);
    row.getCell(2).numFmt = EUR_FMT;
    row.getCell(3).numFmt = EUR_FMT;
    if (bold) row.font = { bold: true };
  };
  line("Ciro", t.revenue, r.previous?.revenue);
  line("Şoför maliyeti", t.driverCost, r.previous?.driverCost);
  line("Brüt kâr", t.grossProfit, r.previous?.grossProfit, true);
  line("Diğer gelir", t.otherIncome, r.previous?.otherIncome);
  line("Giderler", t.expenses, r.previous?.expenses);
  line("Net kâr", t.net, r.previous?.net, true);
  sum.addRow(["Kâr marjı", pct(t.marginPct), r.previous ? pct(r.previous.marginPct) : ""]);
  sum.addRow(["Transfer sayısı", t.transfers, r.previous?.transfers ?? ""]);
  if (t.missingFees > 0) sum.addRow([`${t.missingFees} transferde şoför ücreti eksik; net kâr bu kadar yüksek görünebilir.`]);
  if (t.unconvertible > 0) sum.addRow([`${t.unconvertible} eski transfer kur olmadığı için ciroya katılmadı.`]);
  sum.addRow([]);
  sum.addRow(["Gider kategorisi", "Tutar", "Pay"]).font = { bold: true };
  for (const c of r.expenseCategories) {
    const row = sum.addRow([c.name, c.total, `%${Math.round(c.share * 100)}`]);
    row.getCell(2).numFmt = EUR_FMT;
  }
  if (r.incomeCategories.length) {
    sum.addRow([]);
    sum.addRow(["Gelir kategorisi", "Tutar", "Pay"]).font = { bold: true };
    for (const c of r.incomeCategories) {
      const row = sum.addRow([c.name, c.total, `%${Math.round(c.share * 100)}`]);
      row.getCell(2).numFmt = EUR_FMT;
    }
  }
  sum.addRow([]);
  sum.addRow([NOTE]);

  // ── Aylık
  const months = wb.addWorksheet("Aylık", { views: [{ state: "frozen", ySplit: 1 }] });
  months.columns = [
    { header: "Ay", width: 12 },
    { header: "Transfer", width: 10 },
    { header: "Ciro", width: 14 },
    { header: "Şoför maliyeti", width: 15 },
    { header: "Giderler", width: 14 },
    { header: "Diğer gelir", width: 14 },
    { header: "Net kâr", width: 14 },
  ];
  styleHeader(months.getRow(1));
  for (const m of r.months) {
    const row = months.addRow([m.label, m.transfers, m.revenue, m.driverCost, m.expenses, m.otherIncome, m.net]);
    [3, 4, 5, 6, 7].forEach((i) => (row.getCell(i).numFmt = EUR_FMT));
  }

  // ── Transferler
  const transfers = wb.addWorksheet("Transferler", { views: [{ state: "frozen", ySplit: 1 }] });
  transfers.columns = [
    { header: "Tarih", width: 17 },
    { header: "Rez. kodu", width: 14 },
    { header: "Bölge", width: 18 },
    { header: "Tür", width: 12 },
    { header: "Ödeme", width: 9 },
    { header: "Şoför(ler)", width: 26 },
    { header: "Ciro", width: 13 },
    { header: "Şoför maliyeti", width: 15 },
    { header: "Kâr", width: 13 },
    { header: "Not", width: 18 },
  ];
  styleHeader(transfers.getRow(1));
  for (const x of r.transfers) {
    const row = transfers.addRow([
      `${fmtDay(x.day)} ${x.time}`,
      x.code,
      x.region,
      TRIP(x.tripType),
      x.payment === "cash" ? "Nakit" : "Online",
      x.drivers.join(", "),
      x.fareEur,
      x.driverCostEur,
      x.profitEur,
      x.fareEur === null ? "kur yok" : x.missingFee ? "ücret eksik" : "",
    ]);
    [7, 8, 9].forEach((i) => (row.getCell(i).numFmt = EUR_FMT));
  }

  // ── Gelir-Gider
  const entries = wb.addWorksheet("Gelir-Gider", { views: [{ state: "frozen", ySplit: 1 }] });
  entries.columns = [
    { header: "Tarih", width: 12 },
    { header: "Tür", width: 9 },
    { header: "Kategori", width: 20 },
    { header: "Açıklama", width: 36 },
    { header: "Tutar", width: 14 },
    { header: "Para birimi", width: 11 },
    { header: "Kur", width: 18 },
    { header: "Euro", width: 14 },
  ];
  styleHeader(entries.getRow(1));
  for (const e of r.entries) {
    const row = entries.addRow([
      fmtDay(e.day),
      e.kind === "income" ? "Gelir" : "Gider",
      e.category,
      e.description ?? "",
      e.amount,
      e.currency,
      entryRate(e.currency, e.eurPerUnit),
      e.kind === "income" ? e.amountEur : -e.amountEur,
    ]);
    row.getCell(5).numFmt = "#,##0.00";
    row.getCell(8).numFmt = EUR_FMT;
  }

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}

export async function financePdf(r: FinanceReport): Promise<Buffer> {
  const doc = createPdf();
  const t = r.totals;

  let y = drawHeader(doc, {
    title: "Kasa Raporu",
    subject: rangeLabel(r.range),
    detail: "Kâr / zarar · tutarlar euro",
  });

  y = drawTiles(
    doc,
    [
      { label: "Ciro", value: fmtCash(t.revenue, "EUR") },
      { label: "Şoför maliyeti", value: fmtCash(t.driverCost, "EUR") },
      { label: "Brüt kâr", value: fmtCash(t.grossProfit, "EUR") },
      { label: "Giderler", value: fmtCash(t.expenses, "EUR") },
      { label: "Diğer gelir", value: fmtCash(t.otherIncome, "EUR") },
      {
        label: `Net kâr · marj ${pct(t.marginPct)}`,
        value: fmtCash(t.net, "EUR"),
        fill: t.net < 0 ? [255, 228, 230] : [220, 252, 231],
      },
    ],
    y
  );

  const notes = [`${t.transfers} transfer`];
  if (t.missingFees > 0) notes.push(`${t.missingFees} transferde şoför ücreti eksik`);
  if (r.previous && r.previousRange) {
    notes.push(`Önceki dönem (${rangeLabel(r.previousRange)}): ciro ${fmtCash(r.previous.revenue, "EUR")}, net ${fmtCash(r.previous.net, "EUR")}`);
  }
  doc.setFont("Inter", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(notes.join("   ·   "), 10, y + 2);
  y += 6;

  y = sectionTitle(doc, "Aylık özet", y);
  y = drawTable(
    doc,
    [
      { title: "Ay", width: 37 },
      { title: "Transfer", width: 30, right: true },
      { title: "Ciro", width: 42, right: true },
      { title: "Şoför maliyeti", width: 42, right: true },
      { title: "Giderler", width: 42, right: true },
      { title: "Diğer gelir", width: 42, right: true },
      { title: "Net kâr", width: 42, right: true },
    ],
    r.months.map((m, i) => ({
      shade: i % 2 === 1,
      cells: [
        m.label,
        String(m.transfers),
        fmtCash(m.revenue, "EUR"),
        fmtCash(m.driverCost, "EUR"),
        fmtCash(m.expenses, "EUR"),
        fmtCash(m.otherIncome, "EUR"),
        fmtCash(m.net, "EUR"),
      ],
    })),
    y
  );
  y += 6;

  if (r.entries.length) {
    y = sectionTitle(doc, "Gelir ve giderler", y);
    y = drawTable(
      doc,
      [
        { title: "Tarih", width: 24 },
        { title: "Tür", width: 18 },
        { title: "Kategori", width: 40 },
        { title: "Açıklama", width: 95 },
        { title: "Tutar", width: 32, right: true },
        { title: "Kur", width: 32, right: true },
        { title: "Euro", width: 36, right: true },
      ],
      r.entries.map((e, i) => ({
        shade: i % 2 === 1,
        cells: [
          fmtDay(e.day),
          e.kind === "income" ? "Gelir" : "Gider",
          e.category,
          e.description ?? "—",
          fmtCash(e.amount, e.currency),
          entryRate(e.currency, e.eurPerUnit),
          fmtCash(e.kind === "income" ? e.amountEur : -e.amountEur, "EUR"),
        ],
      })),
      y
    );
    y += 6;
  }

  y = sectionTitle(doc, "Transfer bazında kâr", y);
  y = drawTable(
    doc,
    [
      { title: "Tarih", width: 26 },
      { title: "Kod", width: 24 },
      { title: "Bölge", width: 32 },
      { title: "Tür", width: 22 },
      { title: "Ödeme", width: 16 },
      { title: "Şoför(ler)", width: 55 },
      { title: "Ciro", width: 30, right: true },
      { title: "Şoför", width: 30, right: true },
      { title: "Kâr", width: 42, right: true },
    ],
    r.transfers.map((x, i) => ({
      shade: i % 2 === 1,
      cells: [
        `${fmtDay(x.day)} ${x.time}`,
        x.code,
        x.region,
        TRIP(x.tripType),
        x.payment === "cash" ? "Nakit" : "Online",
        x.drivers.join(", ") || "—",
        x.fareEur === null ? "kur yok" : fmtCash(x.fareEur, "EUR"),
        fmtCash(x.driverCostEur, "EUR"),
        x.profitEur === null ? "—" : `${fmtCash(x.profitEur, "EUR")}${x.missingFee ? " (ücret eksik)" : ""}`,
      ],
    })),
    y
  );

  drawNote(doc, NOTE, y);
  stampFooters(doc, `Kasa raporu · ${rangeLabel(r.range)}`);
  return pdfBuffer(doc);
}
