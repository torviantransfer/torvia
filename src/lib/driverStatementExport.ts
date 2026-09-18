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
 * A driver's statement as a file to hand over — and it is handed over: these
 * are what the office sends the driver. So they carry the driver's own account
 * and nothing about the business behind it: no customer fare, no margin, no
 * other driver's name or pay. Those stay on the admin screen, which reads the
 * same Statement.
 *
 * Only payments and hand-made adjustments are listed as movements. The ledger
 * also holds a generated row per job (the fee, and cash taken from a customer),
 * and printing those under the jobs table printed every job twice.
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

/** This driver's fee for a leg. A leg someone else drove shows as not theirs, without saying who or for how much. */
const myLeg = (cell: LegCell | null) => {
  if (!cell || !cell.mine) return "—";
  return cell.fee === null ? "girilmedi" : fmtMoney(cell.fee, cell.currency);
};

/** Cash this driver took from the customer; cash another driver collected is not theirs to see. */
const myCash = (j: JobRow) => (j.cash?.collectedByMe ? fmtMoney(j.cash.value, j.cash.currency) : "—");

const movementRate = (m: MovementRow) => (m.original && m.rate !== null ? rateText(m.original.currency, m.rate) : "");

const handMade = (s: Statement) => s.movements.filter((m) => m.manual);

/* balanceStatus words it for the office ("Şoförün size borcu"); this file is read by
   the driver, so the same balance is put to them directly. */
const driverBalance = (balance: number) => {
  const status = balanceStatus(balance);
  const label = status.tone === "owe" ? "Alacağınız" : status.tone === "owed" ? "Borcunuz" : "Hesap kapalı";
  return { ...status, label };
};

const describe = (m: MovementRow) =>
  m.usd === null ? `${m.description} (kur yok — bakiyeye katılmadı)` : m.description;

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
  const status = driverBalance(s.current.balance);
  money(`Bugün itibarıyla — ${status.label}`, Math.abs(s.current.balance), "USD", true);
  if (s.current.upcoming !== 0) money("İleri tarihli işlerden (bakiyeye henüz girmedi)", s.current.upcoming, "USD");
  sum.addRow([]);
  sum.addRow(["Transfer sayısı", s.jobTotals.count]);
  sum.addRow([]);
  sum.addRow([CURRENCY_NOTE]);

  // ── İşler
  const jobs = wb.addWorksheet("İşler", { views: [{ state: "frozen", ySplit: 1 }] });
  jobs.columns = [
    { header: "Tarih", width: 17 },
    { header: "Rez. kodu", width: 14 },
    { header: "Tür", width: 12 },
    { header: "Güzergah", width: 30 },
    { header: "Uçuş", width: 22 },
    { header: "Otel", width: 30 },
    { header: "Plaka", width: 14 },
    { header: "Gidiş ücreti", width: 13 },
    { header: "Dönüş ücreti", width: 13 },
    { header: "Tahsil edilen nakit", width: 16 },
    { header: "Bakiyenize ($)", width: 15 },
  ];
  styleHeader(jobs.getRow(1));
  for (const j of s.jobs) {
    const out = j.outbound?.mine ? j.outbound : null;
    const ret = j.ret?.mine ? j.ret : null;
    const cash = j.cash?.collectedByMe ? j.cash : null;
    const row = jobs.addRow([
      `${fmtDay(j.day)} ${j.time}`,
      j.code,
      TRIP_LABEL(j.tripType),
      j.route,
      flights(j),
      j.hotel ?? "",
      plates(j),
      out?.fee ?? null,
      ret?.fee ?? null,
      cash?.value ?? null,
      j.driverNetUsd,
    ]);
    if (out) row.getCell(8).numFmt = FMT[out.currency];
    if (ret) row.getCell(9).numFmt = FMT[ret.currency];
    if (cash) row.getCell(10).numFmt = FMT[cash.currency];
    row.getCell(11).numFmt = FMT.USD;
  }
  const jobTotal = jobs.addRow([`${s.jobTotals.count} transfer`, "", "", "", "", "", "", "", "", "", s.jobTotals.driverNetUsd]);
  jobTotal.font = { bold: true };
  jobTotal.getCell(11).numFmt = FMT.USD;

  // ── Ödemeler ve düzeltmeler
  const moves = wb.addWorksheet("Ödemeler", { views: [{ state: "frozen", ySplit: 1 }] });
  moves.columns = [
    { header: "Tarih", width: 17 },
    { header: "Tür", width: 11 },
    { header: "Açıklama", width: 46 },
    { header: "Rez. kodu", width: 14 },
    { header: "Asıl tutar", width: 14 },
    { header: "Kur", width: 18 },
    { header: "Tutar ($)", width: 13 },
  ];
  styleHeader(moves.getRow(1));
  const manual = handMade(s);
  for (const m of manual) {
    const row = moves.addRow([
      `${fmtDay(m.day)} ${m.time}`,
      LEDGER_TYPE_LABEL[m.type],
      describe(m),
      m.code ?? "",
      m.original?.amount ?? null,
      movementRate(m),
      m.usd,
    ]);
    if (m.original) row.getCell(5).numFmt = FMT[m.original.currency];
    row.getCell(7).numFmt = FMT.USD;
  }
  if (manual.length === 0) moves.addRow(["", "", "Bu dönemde ödeme veya düzeltme yok."]);

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

  const status = driverBalance(s.current.balance);
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

  if (s.current.upcoming !== 0) {
    doc.setFont("Inter", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`İleri tarihli işlerden: ${fmtMoney(s.current.upcoming, "USD")}`, pageW - MARGIN, y + 2, { align: "right" });
    y += 6;
  }

  // ── Jobs
  y = sectionTitle(doc, "İşler", y);
  y = drawTable(
    doc,
    [
      { title: "Tarih", width: 22 },
      { title: "Kod", width: 20 },
      { title: "Tür", width: 18 },
      { title: "Güzergah", width: 40 },
      { title: "Uçuş", width: 26 },
      { title: "Otel", width: 44 },
      { title: "Plaka", width: 20 },
      { title: "Gidiş", width: 22, right: true },
      { title: "Dönüş", width: 22, right: true },
      { title: "Nakit", width: 20, right: true },
      { title: "Bakiyenize ($)", width: 23, right: true },
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
          myLeg(j.outbound),
          j.tripType === "round_trip" ? myLeg(j.ret) : "—",
          myCash(j),
          j.driverNetUsd === null ? "—" : fmtMoney(j.driverNetUsd, "USD"),
        ],
      })),
      {
        bold: true,
        cells: [`${s.jobTotals.count} transfer`, "", "", "", "", "", "", "", "", "", fmtMoney(s.jobTotals.driverNetUsd, "USD")],
      },
    ],
    y
  );
  y += 6;

  // ── Payments and adjustments
  const manual = handMade(s);
  y = sectionTitle(doc, "Ödemeler ve düzeltmeler", y);
  if (manual.length === 0) {
    y = drawNote(doc, "Bu dönemde ödeme veya düzeltme yok.", y - 5);
  } else {
    y = drawTable(
      doc,
      [
        { title: "Tarih", width: 24 },
        { title: "Tür", width: 22 },
        { title: "Açıklama", width: 120 },
        { title: "Kod", width: 22 },
        { title: "Asıl tutar", width: 28, right: true },
        { title: "Kur", width: 32, right: true },
        { title: "Tutar ($)", width: 29, right: true },
      ],
      manual.map((m, i) => ({
        shade: i % 2 === 1,
        cells: [
          `${fmtDay(m.day)} ${m.time}`,
          LEDGER_TYPE_LABEL[m.type],
          describe(m),
          m.code ?? "",
          m.original ? fmtMoney(m.original.amount, m.original.currency) : "",
          movementRate(m),
          m.usd === null ? "—" : fmtMoney(m.usd, "USD"),
        ],
      })),
      y
    );
  }

  drawNote(doc, CURRENCY_NOTE, y);
  stampFooters(doc, `${s.driver.name} · ${rangeLabel(s.range)}`);
  return pdfBuffer(doc);
}
