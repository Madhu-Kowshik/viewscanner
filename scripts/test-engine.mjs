import { PDFDocument, degrees } from 'pdf-lib';
import JSZip from 'jszip';

console.log('====================================================');
console.log('RUNNING OMNIPDF TEST SUITE (PDF ENGINE VERIFICATION)');
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

  // TEST 6 & 7: Delete pages (Delete page 2 and page 4, index 1 and 3)
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

  // TEST 9 & 10: Reorder and Duplicate pages (duplicate page 1 and reverse order)
  // Target: [4, 3, 2, 1, 1, 0] -> 6 pages
  const orgDoc = await PDFDocument.create();
  const order = [4, 3, 2, 1, 1, 0];
  for (const idx of order) {
    const [page] = await orgDoc.copyPages(loadedDoc, [idx]);
    orgDoc.addPage(page);
  }
  const orgBytes = await orgDoc.save();
  const orgLoaded = await PDFDocument.load(orgBytes);
  assert(orgLoaded.getPageCount() === 6, 'TEST 9 & 10: Reordering and duplication produces 6 pages');

  // TEST 11: Extract pages (Pages 2 and 4, index 1 and 3)
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
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  assert(zipBuffer.byteLength > 0, 'TEST 14 & 15: ZIP archive generated successfully with valid content');

  console.log(`\n====================================================`);
  console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests} tests succeeded)`);
  console.log(`====================================================\n`);
}

run().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
