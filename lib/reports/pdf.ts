// Builds the season report as a PDF, mirroring exactly what the Raporte page
// shows: the summary indicators, then the per-season table. Runs server-side
// (Node.js runtime) inside app/api/reports/pdf/route.ts.
//
// Library choice: pdfkit. It draws the PDF directly (vector text/shapes) in
// pure Node — no headless browser, no HTML/CSS render step — so it deploys on
// Vercel exactly like any other API route. The standard 14 PDF fonts (we use
// Helvetica) use WinAnsiEncoding by default, which already covers Albanian's
// two non-ASCII letters (ç, ë), so no custom font needs to be embedded.

import PDFDocument from "pdfkit";
import { formatEuro, formatPercent, formatQuantity } from "@/lib/format";
import type { ReportResponse, ReportSeasonRow } from "@/types/report";

export type ReportPdfFilters = {
  seasonLabel: string | null;
  parcelLabel: string | null;
  from: string | null;
  to: string | null;
};

function formatCostPerUnit(row: ReportSeasonRow): string {
  if (row.costPerUnit === null || !row.costPerUnitUnit) return "—";
  return `${formatEuro(row.costPerUnit)}/${row.costPerUnitUnit}`;
}

function formatYield(row: ReportSeasonRow): string {
  if (row.yieldPerHa === null || !row.yieldUnit) return "—";
  return `${formatQuantity(row.yieldPerHa)} ${row.yieldUnit}/ha`;
}

const PAGE_MARGIN = 40;

// Widths sum to exactly the A4 content width (515.28pt = page width 595.28
// minus PAGE_MARGIN*2), so the table never bleeds past the right margin.
const COLUMNS: {
  header: string;
  width: number;
  align: "left" | "right";
  value: (row: ReportSeasonRow) => string;
}[] = [
  { header: "Parcela", width: 80, align: "left", value: (r) => r.parcelName },
  { header: "Kultura", width: 68, align: "left", value: (r) => r.cropName },
  {
    header: "Sipërfaqja (ha)",
    width: 54,
    align: "right",
    value: (r) => formatQuantity(r.areaHa),
  },
  {
    header: "Shpenzime",
    width: 63,
    align: "right",
    value: (r) => formatEuro(r.totalCost),
  },
  {
    header: "Të ardhura",
    width: 63,
    align: "right",
    value: (r) => formatEuro(r.totalRevenue),
  },
  {
    header: "Fitimi neto",
    width: 63,
    align: "right",
    value: (r) => formatEuro(r.netProfit),
  },
  {
    header: "Kosto/njësi",
    width: 62,
    align: "right",
    value: (r) => formatCostPerUnit(r),
  },
  {
    header: "Rendimenti",
    width: 62.28,
    align: "right",
    value: (r) => formatYield(r),
  },
];

// Column text (especially headers like "Sipërfaqja (ha)", or a long crop
// name) can wrap onto a second line — measuring the tallest cell before
// drawing keeps the separator line below the text instead of through it.
function measureRowHeight(
  doc: PDFKit.PDFDocument,
  values: string[],
  font: string,
  fontSize: number
): number {
  doc.font(font).fontSize(fontSize);
  let maxHeight = 0;
  values.forEach((text, i) => {
    const height = doc.heightOfString(text, { width: COLUMNS[i].width });
    if (height > maxHeight) maxHeight = height;
  });
  return maxHeight;
}

function drawTableHeader(doc: PDFKit.PDFDocument, x: number, y: number) {
  const headers = COLUMNS.map((col) => col.header);
  const textHeight = measureRowHeight(doc, headers, "Helvetica-Bold", 8);

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#15803D");
  let colX = x;
  for (const col of COLUMNS) {
    doc.text(col.header, colX, y, {
      width: col.width,
      align: col.align,
    });
    colX += col.width;
  }

  const lineY = y + textHeight + 4;
  doc
    .moveTo(x, lineY)
    .lineTo(colX, lineY)
    .strokeColor("#DCFCE7")
    .lineWidth(1)
    .stroke();
  return lineY + 6;
}

function drawFiltersLine(filters: ReportPdfFilters): string {
  const parts: string[] = [];
  parts.push(filters.seasonLabel ? filters.seasonLabel : "Të gjitha sezonet");
  parts.push(
    filters.parcelLabel ? filters.parcelLabel : "Të gjitha parcelat"
  );
  if (filters.from || filters.to) {
    parts.push(`${filters.from ?? "…"} deri ${filters.to ?? "…"}`);
  }
  return parts.join("  ·  ");
}

export function generateReportPdf(
  report: ReportResponse,
  filters: ReportPdfFilters
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contentWidth = doc.page.width - PAGE_MARGIN * 2;

    // Header
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#15803D")
      .text("AgroDitari", PAGE_MARGIN, PAGE_MARGIN);
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#111827")
      .text("Raporti i sezoneve", PAGE_MARGIN, doc.y + 2);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#6b7280")
      .text(
        `Krijuar më ${new Date().toLocaleDateString("sq-AL")}`,
        PAGE_MARGIN,
        doc.y + 4
      );
    doc.text(drawFiltersLine(filters), PAGE_MARGIN, doc.y + 2, {
      width: contentWidth,
    });

    // Summary indicators
    const summary = report.summary;
    const summaryY = doc.y + 18;
    const summaryItems: { label: string; value: string }[] = [
      {
        label: "Kosto/njësi",
        value:
          summary.costPerUnit !== null && summary.costPerUnitUnit
            ? `${formatEuro(summary.costPerUnit)}/${summary.costPerUnitUnit}`
            : "—",
      },
      {
        label: "Marxhini",
        value:
          summary.marginPct !== null ? formatPercent(summary.marginPct) : "—",
      },
      { label: "Të ardhura totale", value: formatEuro(summary.totalRevenue) },
      { label: "Shpenzime totale", value: formatEuro(summary.totalCost) },
    ];
    const boxWidth = contentWidth / summaryItems.length - 8;
    summaryItems.forEach((item, i) => {
      const boxX = PAGE_MARGIN + i * (boxWidth + 8);
      doc
        .roundedRect(boxX, summaryY, boxWidth, 50, 6)
        .fillColor("#F0FDF4")
        .fill();
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#6b7280")
        .text(item.label, boxX + 8, summaryY + 8, { width: boxWidth - 16 });
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#111827")
        .text(item.value, boxX + 8, summaryY + 22, { width: boxWidth - 16 });
    });

    // Detail table
    let y = summaryY + 50 + 24;
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111827")
      .text("Detajet sipas sezonit", PAGE_MARGIN, y);
    y = doc.y + 10;

    const bottomLimit = doc.page.height - PAGE_MARGIN;
    y = drawTableHeader(doc, PAGE_MARGIN, y);

    if (report.rows.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6b7280")
        .text("Nuk ka sezone për filtrat e zgjedhur.", PAGE_MARGIN, y);
    }

    for (const row of report.rows) {
      const values = COLUMNS.map((col) => col.value(row));
      const textHeight = measureRowHeight(doc, values, "Helvetica", 8);
      const rowHeight = textHeight + 10;

      if (y + rowHeight > bottomLimit) {
        doc.addPage();
        y = PAGE_MARGIN;
        y = drawTableHeader(doc, PAGE_MARGIN, y);
      }

      doc.font("Helvetica").fontSize(8).fillColor("#374151");
      let colX = PAGE_MARGIN;
      values.forEach((text, i) => {
        doc.text(text, colX, y, {
          width: COLUMNS[i].width,
          align: COLUMNS[i].align,
        });
        colX += COLUMNS[i].width;
      });

      const lineY = y + textHeight + 4;
      doc
        .moveTo(PAGE_MARGIN, lineY)
        .lineTo(colX, lineY)
        .strokeColor("#e5e7eb")
        .lineWidth(0.5)
        .stroke();

      y = lineY + 6;
    }

    doc.end();
  });
}
