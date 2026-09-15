import fs from "fs";
import path from "path";
import { jsPDF } from "jspdf";
import { BOOKING_TZ } from "@/lib/datetime";

/**
 * The pieces every admin PDF is drawn with: the fonts, a header, tiles, and a
 * table that carries its header onto each new page. The driver statement and
 * the finance report share them so the two documents look like one company's.
 */

export const FONT = "Inter";
export const MARGIN = 10;

export type RGB = [number, number, number];

export const INK: RGB = [15, 23, 42];
export const MUTED: RGB = [100, 116, 139];
export const TILE: RGB = [241, 245, 249];

/** A landscape A4 with Inter loaded — jsPDF's built-in faces have no ş, ğ, ı or ₺. */
export function createPdf(): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  doc.addFileToVFS("Inter-Regular.ttf", fs.readFileSync(path.join(fontsDir, "Inter-Regular.ttf")).toString("base64"));
  doc.addFont("Inter-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("Inter-Bold.ttf", fs.readFileSync(path.join(fontsDir, "Inter-Bold.ttf")).toString("base64"));
  doc.addFont("Inter-Bold.ttf", FONT, "bold");
  return doc;
}

export const generatedAt = () =>
  new Date().toLocaleString("tr-TR", {
    timeZone: BOOKING_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function text(doc: jsPDF, style: "normal" | "bold", size: number, color: RGB) {
  doc.setFont(FONT, style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

/** Title, subject and period on the left; the company and the time of printing on the right. Returns the y below it. */
export function drawHeader(doc: jsPDF, opts: { title: string; subject: string; detail: string }): number {
  const pageW = doc.internal.pageSize.getWidth();
  let y = MARGIN + 4;
  text(doc, "bold", 15, INK);
  doc.text(opts.title, MARGIN, y);
  text(doc, "normal", 9, MUTED);
  doc.text("TORVIAN Transfer", pageW - MARGIN, y, { align: "right" });
  y += 6;
  text(doc, "bold", 11, INK);
  doc.text(opts.subject, MARGIN, y);
  text(doc, "normal", 8, MUTED);
  doc.text(`Oluşturulma: ${generatedAt()}`, pageW - MARGIN, y, { align: "right" });
  doc.text(opts.detail, MARGIN, y + 4.5);
  return y + 9;
}

export interface Tile {
  label: string;
  value: string;
  fill?: RGB;
}

/** A row of figure tiles across the page. Returns the y below them. */
export function drawTiles(doc: jsPDF, tiles: Tile[], y: number): number {
  const pageW = doc.internal.pageSize.getWidth();
  const gap = 3;
  const w = (pageW - MARGIN * 2 - gap * (tiles.length - 1)) / tiles.length;
  tiles.forEach((tile, i) => {
    const x = MARGIN + i * (w + gap);
    doc.setFillColor(...(tile.fill ?? TILE));
    doc.roundedRect(x, y, w, 14, 1.5, 1.5, "F");
    text(doc, "normal", 6.5, MUTED);
    doc.text(tile.label, x + 3, y + 5);
    text(doc, "bold", 11, INK);
    doc.text(tile.value, x + 3, y + 11);
  });
  return y + 18;
}

export interface Column {
  title: string;
  width: number;
  right?: boolean;
}

export interface TableRow {
  cells: string[];
  bold?: boolean;
  shade?: boolean;
}

/** Draws a table from `startY`, carrying the header onto every new page. Returns the y it ended at. */
export function drawTable(doc: jsPDF, columns: Column[], rows: TableRow[], startY: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  const bottom = pageH - 12;
  const tableW = columns.reduce((w, c) => w + c.width, 0);
  const padX = 1.2;
  const lineH = 3;
  let y = startY;

  const cellX = (x: number, c: Column) => (c.right ? x + c.width - padX : x + padX);

  const header = () => {
    doc.setFillColor(...TILE);
    doc.rect(MARGIN, y, tableW, 6, "F");
    text(doc, "bold", 6.5, [71, 85, 105]);
    let x = MARGIN;
    for (const c of columns) {
      doc.text(c.title, cellX(x, c), y + 4, { align: c.right ? "right" : "left" });
      x += c.width;
    }
    y += 6;
  };

  header();
  for (const row of rows) {
    text(doc, row.bold ? "bold" : "normal", 7, INK);
    // An empty string is a deliberately blank cell (a totals row); a missing
    // value in a data row is passed in as "—" by the caller.
    const lines = row.cells.map((cell, i) => {
      if (!cell) return [] as string[];
      const wrapped = doc.splitTextToSize(cell, columns[i].width - padX * 2) as string[];
      if (wrapped.length <= 2) return wrapped;
      return [wrapped[0], `${wrapped[1].slice(0, -1)}…`];
    });
    const rowH = Math.max(1, ...lines.map((l) => l.length)) * lineH + 2.6;

    if (y + rowH > bottom) {
      doc.addPage();
      y = MARGIN;
      header();
      text(doc, row.bold ? "bold" : "normal", 7, INK);
    }

    if (row.shade) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGIN, y, tableW, rowH, "F");
    }
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

/** A section heading, moved to a new page when there is no room for anything under it. */
export function sectionTitle(doc: jsPDF, title: string, y: number): number {
  if (y + 24 > doc.internal.pageSize.getHeight() - 12) {
    doc.addPage();
    y = MARGIN;
  }
  text(doc, "bold", 10, INK);
  doc.text(title, MARGIN, y + 4);
  return y + 7;
}

/** One line of small grey text, e.g. how figures were converted. */
export function drawNote(doc: jsPDF, note: string, y: number): number {
  if (y + 10 > doc.internal.pageSize.getHeight() - 12) {
    doc.addPage();
    y = MARGIN;
  }
  text(doc, "normal", 7, MUTED);
  doc.text(note, MARGIN, y + 6);
  return y + 8;
}

/** Page numbers and a running title on every page; call last. */
export function stampFooters(doc: jsPDF, left: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    text(doc, "normal", 7, [148, 163, 184]);
    doc.text(left, MARGIN, pageH - 5);
    doc.text(`Sayfa ${i} / ${pages}`, pageW - MARGIN, pageH - 5, { align: "right" });
  }
}

export const pdfBuffer = (doc: jsPDF) => Buffer.from(doc.output("arraybuffer"));
