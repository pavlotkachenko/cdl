/**
 * PDF Service — server-side PDF generation using pdfkit.
 * Sprint 035 PE-2
 */

const PDFDocument = require('pdfkit');

const COLS = [
  { header: 'Case #',    key: 'case_number',    width: 70 },
  { header: 'Driver',    key: 'driver_name',    width: 90 },
  { header: 'CDL',       key: 'cdl_number',     width: 80 },
  { header: 'Violation', key: 'violation_type', width: 100 },
  { header: 'State',     key: 'state',          width: 40 },
  { header: 'Status',    key: 'status',         width: 60 },
  { header: 'Date',      key: 'incident_date',  width: 75 },
  { header: 'Attorney',  key: 'attorney_name',  width: 100 },
];

const PAGE = { size: 'A4', layout: 'landscape', margin: 30 };
const ROW_HEIGHT = 18;
const HEADER_HEIGHT = 22;
const HEADER_COLOR = '#1565C0';
const ALT_ROW_COLOR = '#F5F5F5';
const TEXT_COLOR = '#212121';
const BORDER_COLOR = '#E0E0E0';

/**
 * Generate a compliance report PDF buffer.
 *
 * @param {Array<Object>} rows  — compliance report rows from DB
 * @param {string|null}   from  — optional start date (YYYY-MM-DD)
 * @param {string|null}   to    — optional end date (YYYY-MM-DD)
 * @returns {Promise<Buffer>}
 */
const generateComplianceReport = (rows, from, to) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: PAGE.size, layout: PAGE.layout, margin: PAGE.margin });
  const chunks = [];
  doc.on('data', chunk => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  const pageWidth = doc.page.width - PAGE.margin * 2;
  let y = PAGE.margin;

  // ── Title ────────────────────────────────────────────────────────────────────
  doc.fillColor(HEADER_COLOR).fontSize(16).font('Helvetica-Bold')
     .text('CDL Ticket Management — DOT Compliance Report', PAGE.margin, y);
  y += 22;

  // ── Date range subtitle ───────────────────────────────────────────────────────
  const dateRange = (from || to)
    ? `Period: ${from || 'all time'} → ${to || 'present'}`
    : 'All dates';
  doc.fillColor('#555').fontSize(9).font('Helvetica')
     .text(`${dateRange}   |   Generated: ${new Date().toLocaleString()}   |   ${rows.length} violation(s)`,
           PAGE.margin, y);
  y += 18;

  // ── Table header ──────────────────────────────────────────────────────────────
  doc.fillColor(HEADER_COLOR).rect(PAGE.margin, y, pageWidth, HEADER_HEIGHT).fill();
  let xh = PAGE.margin;
  doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
  COLS.forEach(col => {
    doc.text(col.header, xh + 3, y + 6, { width: col.width - 6, ellipsis: true });
    xh += col.width;
  });
  y += HEADER_HEIGHT;

  // ── Rows ──────────────────────────────────────────────────────────────────────
  rows.forEach((row, idx) => {
    // New page check
    if (y + ROW_HEIGHT > doc.page.height - PAGE.margin - 20) {
      doc.addPage({ size: PAGE.size, layout: PAGE.layout, margin: PAGE.margin });
      y = PAGE.margin;
    }

    // Alternating background
    if (idx % 2 === 1) {
      doc.fillColor(ALT_ROW_COLOR).rect(PAGE.margin, y, pageWidth, ROW_HEIGHT).fill();
    }

    // Row border
    doc.strokeColor(BORDER_COLOR).lineWidth(0.5)
       .rect(PAGE.margin, y, pageWidth, ROW_HEIGHT).stroke();

    // Cell text
    doc.fillColor(TEXT_COLOR).fontSize(7.5).font('Helvetica');
    let xr = PAGE.margin;
    COLS.forEach(col => {
      const val = String(row[col.key] ?? '—');
      doc.text(val, xr + 3, y + 5, { width: col.width - 6, ellipsis: true });
      xr += col.width;
    });
    y += ROW_HEIGHT;
  });

  // ── Footer ────────────────────────────────────────────────────────────────────
  const footerY = doc.page.height - PAGE.margin + 5;
  doc.fillColor('#999').fontSize(7).font('Helvetica')
     .text(`CDL Ticket Management — Confidential — Page 1`, PAGE.margin, footerY);

  doc.end();
});

module.exports = { generateComplianceReport };
