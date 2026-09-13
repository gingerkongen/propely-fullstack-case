import type { Task } from './types';

import { TASK_COLUMNS } from './columns';

interface PdfContent {
  tasks: Task[];
  /** What was exported, e.g. "Side 2 av 5 (oppgave 51–100 av 230)". */
  scope: string;
  /** The active filters in words, one entry each. */
  filters: string[];
}

const MARGIN = 14; // mm

const columnIndex = (header: string) => TASK_COLUMNS.findIndex((column) => column.header === header);

/** Builds an A4 landscape PDF with the table's columns and cell text, and downloads it. */
export async function downloadTasksPdf({ tasks, scope, filters }: PdfContent): Promise<void> {
  // Loaded on the first export only: the PDF libraries are large and most visits never need them.
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('-');

  doc.setFontSize(14);
  doc.text('Vedlikeholdsoppgaver', MARGIN, 15);
  doc.setFontSize(9);
  doc.setTextColor(90);
  const summary = doc.splitTextToSize(
    `Eksportert ${today} · ${scope}\n${filters.length > 0 ? `Filtre: ${filters.join(' · ')}` : 'Ingen filtre'}`,
    pageWidth - 2 * MARGIN,
  );
  doc.text(summary, MARGIN, 21);

  autoTable(doc, {
    startY: 21 + summary.length * 4 + 2,
    head: [TASK_COLUMNS.map((column) => column.header)],
    body: tasks.map((task) => TASK_COLUMNS.map((column) => column.text(task))),
    margin: { left: MARGIN, right: MARGIN, bottom: MARGIN },
    styles: { fontSize: 7.5, cellPadding: 1.5, valign: 'top' },
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105] },
    columnStyles: {
      [columnIndex('ID')]: { cellWidth: 17 },
      [columnIndex('Beskrivelse')]: { cellWidth: 70 },
      [columnIndex('Kostnad (NOK)')]: { halign: 'right' },
    },
  });

  // Page numbers go on last, once the total page count is known.
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(120);
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.text(`Side ${page} av ${pageCount}`, pageWidth - MARGIN, pageHeight - 7, { align: 'right' });
  }

  doc.save(`vedlikeholdsoppgaver-${today}.pdf`);
}
