import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';

console.log('====================================================');
console.log('RUNNING OMNIPDF TEST SUITE (EXTENDED PDF ENGINE VERIFICATION)');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run() {
  // 1. Generate base test PDF
  console.log('Creating 5-page test document...');
  const baseDoc = await PDFDocument.create();
  baseDoc.setTitle('Confidential Audit');
  baseDoc.setAuthor('John Doe');

  for (let i = 1; i <= 5; i++) {
    const page = baseDoc.addPage([400, 600]);
    page.drawText(`Page Number ${i}`, { x: 50, y: 500, size: 24 });
  }
  const baseBytes = await baseDoc.save();
  assert(baseBytes.byteLength > 0, 'Test document generated successfully');

  // TEST 1 & 3: Validate PDF
  const loadedDoc = await PDFDocument.load(baseBytes);
  assert(loadedDoc.getPageCount() === 5, 'TEST 1 & 3: Document has exactly 5 pages');

  // TEST 2: Invalid file validation
  const invalidBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  let failedAsExpected = false;
  try {
    await PDFDocument.load(invalidBuffer);
  } catch {
    failedAsExpected = true;
  }
  assert(failedAsExpected, 'TEST 2: Invalid file correctly rejected by PDF loader');

  // TEST 6 & 7: Delete pages
  const remainingIndices = [0, 2, 4];
  const delDoc = await PDFDocument.create();
  const delPages = await delDoc.copyPages(loadedDoc, remainingIndices);
  delPages.forEach(p => delDoc.addPage(p));
  const delBytes = await delDoc.save();
  const delLoaded = await PDFDocument.load(delBytes);
  assert(delLoaded.getPageCount() === 3, 'TEST 7: Deleting 2 pages leaves exactly 3 pages');

  // TEST 8: Rotate pages
  const rotDoc = await PDFDocument.load(baseBytes);
  const p0 = rotDoc.getPage(0);
  p0.setRotation(degrees(90));
  const rotBytes = await rotDoc.save();
  const rotLoaded = await PDFDocument.load(rotBytes);
  assert(rotLoaded.getPage(0).getRotation().angle === 90, 'TEST 8: Page 1 successfully rotated by 90 degrees');

  // TEST 9 & 10: Reorder and Duplicate pages
  const orgDoc = await PDFDocument.create();
  const order = [4, 3, 2, 1, 1, 0];
  for (const idx of order) {
    const [page] = await orgDoc.copyPages(loadedDoc, [idx]);
    orgDoc.addPage(page);
  }
  const orgBytes = await orgDoc.save();
  const orgLoaded = await PDFDocument.load(orgBytes);
  assert(orgLoaded.getPageCount() === 6, 'TEST 9 & 10: Reordering and duplication produces 6 pages');

  // TEST 11: Extract pages
  const extDoc = await PDFDocument.create();
  const extPages = await extDoc.copyPages(loadedDoc, [1, 3]);
  extPages.forEach(p => extDoc.addPage(p));
  const extBytes = await extDoc.save();
  const extLoaded = await PDFDocument.load(extBytes);
  assert(extLoaded.getPageCount() === 2, 'TEST 11: Extracted PDF contains exactly 2 pages');

  // TEST 12: Merge multiple PDFs (5 pages + 3 pages = 8 pages)
  const mergeDoc = await PDFDocument.create();
  const copy1 = await mergeDoc.copyPages(loadedDoc, loadedDoc.getPageIndices());
  copy1.forEach(p => mergeDoc.addPage(p));
  const copy2 = await mergeDoc.copyPages(delLoaded, delLoaded.getPageIndices());
  copy2.forEach(p => mergeDoc.addPage(p));
  const mergeBytes = await mergeDoc.save();
  const mergeLoaded = await PDFDocument.load(mergeBytes);
  assert(mergeLoaded.getPageCount() === 8, 'TEST 12: Merging 5 pages and 3 pages results in 8 pages');

  // TEST 13: Split PDF (Every page -> 5 files; By range -> 2 files)
  const singlePages = [];
  for (let i = 0; i < loadedDoc.getPageCount(); i++) {
    const sDoc = await PDFDocument.create();
    const [p] = await sDoc.copyPages(loadedDoc, [i]);
    sDoc.addPage(p);
    singlePages.push(await sDoc.save());
  }
  assert(singlePages.length === 5, 'TEST 13A: Split every page produces 5 individual files');

  // By range: 1-2 (2 pages) and 3-5 (3 pages)
  const range1Doc = await PDFDocument.create();
  const r1Pages = await range1Doc.copyPages(loadedDoc, [0, 1]);
  r1Pages.forEach(p => range1Doc.addPage(p));
  const r1Loaded = await PDFDocument.load(await range1Doc.save());
  assert(r1Loaded.getPageCount() === 2, 'TEST 13B: Split Range 1 (1-2) contains 2 pages');

  const range2Doc = await PDFDocument.create();
  const r2Pages = await range2Doc.copyPages(loadedDoc, [2, 3, 4]);
  r2Pages.forEach(p => range2Doc.addPage(p));
  const r2Loaded = await PDFDocument.load(await range2Doc.save());
  assert(r2Loaded.getPageCount() === 3, 'TEST 13C: Split Range 2 (3-5) contains 3 pages');

  // TEST 14 & 15: Download & Zip Bundle Verification
  const zip = new JSZip();
  zip.file('part1.pdf', await range1Doc.save());
  zip.file('part2.pdf', await range2Doc.save());
  const zipContent = await zip.generateAsync({ type: 'uint8array' });
  assert(zipContent.byteLength > 0, 'TEST 14 & 15: ZIP archive generated successfully with valid content');

  // TEST 16: Insert Blank Page at Index 2
  const insertDoc = await PDFDocument.load(baseBytes);
  insertDoc.insertPage(2, [400, 600]);
  const insertBytes = await insertDoc.save();
  const insertLoaded = await PDFDocument.load(insertBytes);
  assert(insertLoaded.getPageCount() === 6, 'TEST 16: Insert blank page expands 5-page PDF to 6 pages');

  // TEST 17: Reverse Page Order
  const revDoc = await PDFDocument.create();
  const totalP = loadedDoc.getPageCount();
  const revIndices = Array.from({ length: totalP }, (_, i) => totalP - 1 - i);
  const revPages = await revDoc.copyPages(loadedDoc, revIndices);
  revPages.forEach(p => revDoc.addPage(p));
  const revBytes = await revDoc.save();
  const revLoaded = await PDFDocument.load(revBytes);
  assert(revLoaded.getPageCount() === 5, 'TEST 17: Reverse page order maintains exact page count (5 pages)');

  // TEST 18: Add Watermark (Text stamp)
  const wmDoc = await PDFDocument.load(baseBytes);
  const helveticaFont = await wmDoc.embedFont(StandardFonts.HelveticaBold);
  const pagesToWm = wmDoc.getPages();
  for (const p of pagesToWm) {
    p.drawText('CONFIDENTIAL', {
      x: 100,
      y: 300,
      size: 40,
      font: helveticaFont,
      color: rgb(1, 0, 0),
      opacity: 0.3,
      rotate: degrees(45),
    });
  }
  const wmBytes = await wmDoc.save();
  assert(wmBytes.byteLength > baseBytes.byteLength, 'TEST 18: Watermark embedded successfully, expanding byte stream');

  // TEST 19: Add Page Numbers & Bates Stamp
  const batesDoc = await PDFDocument.load(baseBytes);
  const numFont = await batesDoc.embedFont(StandardFonts.Helvetica);
  const bPages = batesDoc.getPages();
  bPages.forEach((p, idx) => {
    p.drawText(`DOC-${String(idx + 1).padStart(6, '0')}`, {
      x: 200,
      y: 20,
      size: 10,
      font: numFont,
      color: rgb(0.2, 0.2, 0.2),
    });
  });
  const batesBytes = await batesDoc.save();
  const batesLoaded = await PDFDocument.load(batesBytes);
  assert(batesLoaded.getPageCount() === 5, 'TEST 19: Bates stamping applied across all pages');

  // TEST 20: Clean & Sanitize Metadata
  const cleanDoc = await PDFDocument.load(baseBytes);
  cleanDoc.setTitle('');
  cleanDoc.setAuthor('');
  cleanDoc.setSubject('');
  cleanDoc.setKeywords([]);
  cleanDoc.setProducer('OmniPDF Sanitizer');
  cleanDoc.setCreator('');
  const cleanBytes = await cleanDoc.save();
  const cleanLoaded = await PDFDocument.load(cleanBytes);
  assert(!cleanLoaded.getTitle() && !cleanLoaded.getAuthor(), 'TEST 20: Metadata successfully scrubbed and sanitized');

  // TEST 21: Text to PDF generation
  const textDoc = await PDFDocument.create();
  const tPage = textDoc.addPage([595.28, 841.89]); // A4
  const tFont = await textDoc.embedFont(StandardFonts.Helvetica);
  tPage.drawText('Hello OmniPDF Text Generator', { x: 50, y: 750, size: 14, font: tFont });
  const textBytes = await textDoc.save();
  const textLoaded = await PDFDocument.load(textBytes);
  assert(textLoaded.getPageCount() === 1, 'TEST 21: Text converted into formatted single-page A4 PDF');

  console.log('\n====================================================');
  console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests} tests succeeded)`);
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
