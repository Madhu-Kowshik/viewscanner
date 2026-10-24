import assert from 'node:assert/strict';
import { PDFDocument, degrees } from 'pdf-lib';
import { bookletOrder, runPrintTool } from '../src/lib/pdf/print-tools';
const source = await PDFDocument.create();
for (let i = 0; i < 5; i++) { const page = source.addPage([300, 500]); page.drawText(`Page ${i + 1}`, { x: 20, y: 200 }); if(i === 1) page.setRotation(degrees(90)); }
const bytes = await source.save();
assert.deepEqual(bookletOrder(5), [null, 0, 1, null, null, 2, 3, 4]);
assert.deepEqual(bookletOrder(4), [3, 0, 1, 2]);
for (let count = 1; count <= 25; count++) {
  const order = bookletOrder(count); assert.equal(order.length % 4, 0);
  assert.deepEqual(order.filter((i): i is number => i !== null).sort((a,b)=>a-b), Array.from({length:count},(_,i)=>i));
}
for (const [mode, expected] of [['resize', 5], ['nup', 2], ['booklet', 4], ['margins', 5], ['parity', 2], ['flatten', 5], ['metadata', 5]] as const) {
  const out = await PDFDocument.load(await runPrintTool(bytes, { mode, perSheet: 4, parity: 'even', title: 'Updated', margin: 18 }));
  assert.equal(out.getPageCount(), expected, mode);
  if (mode === 'resize') assert.equal(out.getPage(0).getWidth(), 595.28);
  if (mode === 'margins') { assert.equal(out.getPage(0).getWidth(), 336); assert.equal(out.getPage(1).getWidth(), 536); }
  if (mode === 'metadata') assert.equal(out.getTitle(), 'Updated');
}
const formDoc = await PDFDocument.create(); const p = formDoc.addPage();
const field = formDoc.getForm().createTextField('name'); field.setText('Madhu'); field.addToPage(p);
const flat = await PDFDocument.load(await runPrintTool(await formDoc.save(), { mode: 'flatten' }));
assert.equal(flat.getForm().getFields().length, 0);
await assert.rejects(runPrintTool(bytes, { mode: 'resize', margin: NaN }), /Margin/);
await assert.rejects(runPrintTool(bytes, { mode: 'resize', margin: -1 }), /Margin/);
const single = await PDFDocument.create(); single.addPage();
await assert.rejects(runPrintTool(await single.save(), {mode:'parity',parity:'even'}), /no even/);
for (const mode of ['resize', 'nup', 'booklet', 'margins'] as const) {
  const blank = await PDFDocument.load(await runPrintTool(await single.save(), {mode}));
  assert.ok(blank.getPageCount() > 0, 'Blank page should export without a missing-content error');
}
assert.equal((await PDFDocument.load(bytes)).getPageCount(), 5);
console.log('Print tools: 25 booklet permutations, 7 export modes, rotation dimensions, form flattening, input validation, and source preservation passed.');
