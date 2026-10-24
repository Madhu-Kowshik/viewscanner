import { PDFDocument, PDFPage, degrees } from 'pdf-lib';

export type PrintMode = 'resize' | 'nup' | 'booklet' | 'margins' | 'parity' | 'flatten' | 'metadata';
export interface PrintOptions {
  mode: PrintMode;
  paper?: 'a4' | 'letter' | 'a3';
  landscape?: boolean;
  perSheet?: 2 | 4;
  margin?: number;
  parity?: 'odd' | 'even';
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
}
export const PAPER_SIZES = { a4: [595.28, 841.89], letter: [612, 792], a3: [841.89, 1190.55] } as const;

/** Zero-based page order for left-bound, duplex booklets. Nulls are blank padding. */
export function bookletOrder(count: number): (number | null)[] {
  if (!Number.isInteger(count) || count < 1) throw new Error('A booklet needs at least one page.');
  const padded = Math.ceil(count / 4) * 4;
  const order: (number | null)[] = [];
  for (let i = 0; i < padded / 4; i++) {
    for (const p of [padded - 1 - i * 2, i * 2, i * 2 + 1, padded - 2 - i * 2]) order.push(p < count ? p : null);
  }
  return order;
}

async function placePage(out: PDFDocument, sheet: PDFPage, source: PDFPage, x: number, y: number, width: number, height: number) {
  if (!source.node.Contents()) return; // Truly blank pages have no content stream to embed.
  const box = source.getCropBox();
  const embedded = await out.embedPage(source, { left: box.x, bottom: box.y, right: box.x + box.width, top: box.y + box.height });
  const angle = ((source.getRotation().angle % 360) + 360) % 360;
  const sideways = angle === 90 || angle === 270;
  const visibleW = sideways ? box.height : box.width;
  const visibleH = sideways ? box.width : box.height;
  const scale = Math.min(width / visibleW, height / visibleH);
  const left = x + (width - visibleW * scale) / 2;
  const bottom = y + (height - visibleH * scale) / 2;
  sheet.drawPage(embedded, {
    x: left + (angle === 180 || angle === 270 ? visibleW * scale : 0),
    y: bottom + (angle === 90 || angle === 180 ? visibleH * scale : 0),
    xScale: scale, yScale: scale, rotate: degrees(-angle),
  });
}

export async function runPrintTool(data: ArrayBuffer | Uint8Array, options: PrintOptions): Promise<Uint8Array> {
  const source = await PDFDocument.load(data);
  if (!source.getPageCount()) throw new Error('This PDF has no pages.');
  if (options.mode === 'metadata') {
    source.setTitle(options.title ?? ''); source.setAuthor(options.author ?? '');
    source.setSubject(options.subject ?? ''); source.setKeywords((options.keywords ?? '').split(',').map(s => s.trim()).filter(Boolean));
    return source.save();
  }
  if (options.mode === 'flatten') {
    source.getForm().flatten();
    return source.save();
  }
  const out = await PDFDocument.create();
  if (options.mode === 'parity') {
    const indices = source.getPageIndices().filter(i => i % 2 === (options.parity === 'even' ? 1 : 0));
    if (!indices.length) throw new Error('There are no even-numbered pages in this PDF.');
    for (const page of await out.copyPages(source, indices)) out.addPage(page);
    return out.save();
  }
  const margin = options.margin ?? 18;
  if (!Number.isFinite(margin) || margin < 0 || margin > 144) throw new Error('Margin must be between 0 and 144 points.');
  // Preserve filled field appearances before converting pages to print artwork.
  source.getForm().flatten();
  let [width, height]: number[] = [...PAPER_SIZES[options.paper ?? 'a4']];
  if (options.landscape || options.mode === 'booklet') [width, height] = [height, width];
  const count = source.getPageCount();
  const perSheet = options.mode === 'booklet' ? 2 : options.mode === 'nup' ? (options.perSheet ?? 2) : 1;
  const columns = perSheet > 1 ? 2 : 1;
  const rows = perSheet === 4 ? 2 : 1;
  const order = options.mode === 'booklet' ? bookletOrder(count) : source.getPageIndices();
  for (let start = 0; start < order.length; start += perSheet) {
    let sheetWidth = width, sheetHeight = height;
    if (options.mode === 'margins') {
      const page = source.getPage(order[start]!); const crop = page.getCropBox();
      const sideways = Math.abs(page.getRotation().angle % 180) === 90;
      sheetWidth = (sideways ? crop.height : crop.width) + margin * 2;
      sheetHeight = (sideways ? crop.width : crop.height) + margin * 2;
    }
    const cellW = (sheetWidth - margin * (columns + 1)) / columns;
    const cellH = (sheetHeight - margin * (rows + 1)) / rows;
    if (cellW <= 0 || cellH <= 0) throw new Error('Margins leave no printable area.');
    const sheet = out.addPage([sheetWidth, sheetHeight]);
    for (let slot = 0; slot < perSheet; slot++) {
      const index = order[start + slot]; if (index === null || index === undefined) continue;
      const col = slot % columns, row = Math.floor(slot / columns);
      await placePage(out, sheet, source.getPage(index), margin + col * (cellW + margin), sheetHeight - margin - (row + 1) * cellH - row * margin, cellW, cellH);
    }
  }
  return out.save();
}
