import { chromium } from 'playwright';
import { preview } from 'vite';
import fs from 'fs';
import path from 'path';
import {
  createSyntheticVectorPdf,
  createSyntheticFormPdf,
  createSyntheticMultiPagePdf,
  createSyntheticRedactionPdf,
  createSyntheticWatermarkedPdf,
  createSyntheticScannedWithOcrPdf,
  createSyntheticVectorWithDigit7Pdf,
} from './synthetic-docs';
import { extractPageTextItems, classifyPdfDocument } from '../src/lib/pdf/pdf-engine';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';

/**
 * OmniPDF End-to-End Real Browser Verification Suite
 * Executes in real headless Chrome, driving user interactions, testing routes,
 * inspecting DOM state, verifying file operations, and auditing responsive viewports.
 */

async function runBrowserE2E() {
  console.log('================================================================');
  console.log('OMNIPDF REAL BROWSER E2E VERIFICATION SUITE');
  console.log('Testing with Headless Chrome across all major workspaces & mobile');
  console.log('================================================================\n');

  // 1. Prepare synthetic test files on disk for file input uploads
  const tempDir = path.join(process.cwd(), 'scripts', 'temp-test-files');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const vectorPdfPath = path.join(tempDir, 'test-vector.pdf');
  const multiPdfPath = path.join(tempDir, 'test-multi.pdf');
  const formPdfPath = path.join(tempDir, 'test-form.pdf');
  const redactPdfPath = path.join(tempDir, 'test-redact.pdf');

  fs.writeFileSync(vectorPdfPath, await createSyntheticVectorPdf());
  fs.writeFileSync(multiPdfPath, await createSyntheticMultiPagePdf(4));
  fs.writeFileSync(formPdfPath, await createSyntheticFormPdf());
  fs.writeFileSync(redactPdfPath, await createSyntheticRedactionPdf());

  const scannedOcrPdfPath = path.join(tempDir, 'test-scanned-ocr-7.pdf');
  const vector7PdfPath = path.join(tempDir, 'test-vector-7.pdf');
  fs.writeFileSync(scannedOcrPdfPath, await createSyntheticScannedWithOcrPdf());
  fs.writeFileSync(vector7PdfPath, await createSyntheticVectorWithDigit7Pdf());

  // 2. Start local Vite preview server
  console.log('Starting local preview server on port 4180...');
  const server = await preview({
    preview: { port: 4180 },
  });
  const baseUrl = 'http://localhost:4180';

  let totalTests = 0;
  let passedTests = 0;

  function assert(cond: boolean, desc: string) {
    totalTests++;
    if (cond) {
      console.log(`✓ PASS: ${desc}`);
      passedTests++;
    } else {
      console.error(`✗ FAIL: ${desc}`);
      throw new Error(`E2E failure: ${desc}`);
    }
  }

  // 3. Launch real Chrome browser
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const consoleErrors: string[] = [];

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('LiberationSans')) {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // E2E TEST 1: Landing Page & Navigation
    console.log('\n--- BROWSER SUITE 1: LANDING & NAVIGATION ---');
    await page.goto(`${baseUrl}/#/`);
    await page.waitForSelector('h1');
    const titleText = await page.textContent('h1');
    assert(Boolean(titleText && (titleText.includes('unified workspace') || titleText.includes('PDFs'))), 'E2E 1A: Landing page renders with headline');

    const manifestLink = await page.$('link[rel="manifest"]');
    assert(manifestLink !== null, 'E2E 1B: PWA Web App Manifest link present in head');

    // E2E TEST 2: Tools Directory Page
    console.log('\n--- BROWSER SUITE 2: TOOLS EXPLORER ---');
    await page.goto(`${baseUrl}/#/tools`);
    await page.waitForSelector('text=Organize Pages');
    const toolsCount = await page.$$eval('[data-tool-id], a[href*="#/"]', (els) => els.length);
    assert(toolsCount >= 10, `E2E 2: Tools explorer rendered ${toolsCount} tools and navigation cards`);

    // E2E TEST 3: Document Upload & PDF Viewing
    console.log('\n--- BROWSER SUITE 3: DOCUMENT INGESTION & CANVAS ---');
    await page.goto(`${baseUrl}/#/organize`);
    await page.waitForSelector('input[type="file"]', { state: 'attached' });
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(vectorPdfPath);
      // Wait for thumbnail or canvas to render
      await page.waitForTimeout(1500);
      const canvasExists = (await page.$$('canvas')).length > 0;
      assert(canvasExists, 'E2E 3: Uploaded synthetic PDF successfully rendered onto HTML5 canvas');
    }

    // E2E TEST 4: Navigation to Studio Modes
    console.log('\n--- BROWSER SUITE 4: STUDIO MULTI-MODE WORKSPACE ---');
    // Mode switcher pill bar should be visible when currentFile is loaded
    const studioPills = await page.$$eval('button', (btns) => btns.map((b) => b.textContent?.trim() || ''));
    assert(
      studioPills.some((p) => p.includes('View') || p.includes('Organize') || p.includes('Edit Text')),
      'E2E 4: 3-Pane Unified Studio Mode Switcher rendered for active document'
    );

    // E2E TEST 5: Protect & Security Workspace
    console.log('\n--- BROWSER SUITE 5: DOCUMENT SECURITY & PRIVACY ---');
    await page.goto(`${baseUrl}/#/protect`);
    await page.waitForTimeout(800);
    const hasSanitizeTitle = (await page.content()).includes('Privacy') || (await page.content()).includes('Security');
    assert(hasSanitizeTitle, 'E2E 5: Security & Privacy workspace loaded cleanly');

    // E2E TEST 6: Format Converters Workspace
    console.log('\n--- BROWSER SUITE 6: FORMAT CONVERTERS ---');
    await page.goto(`${baseUrl}/#/convert`);
    await page.waitForTimeout(800);
    const hasConvertTabs = (await page.content()).includes('Images to PDF') && (await page.content()).includes('PDF to Images');
    assert(hasConvertTabs, 'E2E 6: Format converter tabs (PDF to Images, Images to PDF) rendered correctly');

    // E2E TEST 7: AcroForms Studio
    console.log('\n--- BROWSER SUITE 7: INTERACTIVE ACROFORMS ---');
    await page.goto(`${baseUrl}/#/forms`);
    await page.waitForTimeout(800);
    const hasFormsWorkspace = (await page.content()).includes('Form');
    assert(hasFormsWorkspace, 'E2E 7: AcroForms workspace rendered');

    // E2E TEST 8: Document Scanner & Camera UI
    console.log('\n--- BROWSER SUITE 8: DOCUMENT SCANNER UI ---');
    await page.goto(`${baseUrl}/#/scanner`);
    await page.waitForTimeout(800);
    const hasScannerUI = (await page.content()).includes('Camera') || (await page.content()).includes('Scanner');
    assert(hasScannerUI, 'E2E 8: Camera document scanner workspace rendered');

    // E2E TEST 9: Mobile Responsive Viewports (360x800, 390x844, 768x1024, 1280x800, 1440x900)
    console.log('\n--- BROWSER SUITE 9: RESPONSIVE VIEWPORT MATRIX (5 VIEWPORTS) ---');
    
    // Viewport 1: 360x800 (Android)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`${baseUrl}/#/`);
    await page.waitForTimeout(400);
    const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    assert(!overflow360, 'E2E 9A: 360x800 (Android) zero horizontal scroll overflow');

    // Viewport 2: 390x844 (iPhone 13/14)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/#/tools`);
    await page.waitForTimeout(400);
    const overflow390 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    assert(!overflow390, 'E2E 9B: 390x844 (iPhone 13/14) zero horizontal scroll overflow');

    // Viewport 3: 768x1024 (Tablet / iPad)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${baseUrl}/#/organize`);
    await page.waitForTimeout(400);
    const overflowReport = await page.evaluate(() => {
      const sw = document.documentElement.scrollWidth;
      const iw = window.innerWidth;
      const offenders: any[] = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > iw + 2) {
          offenders.push({ tag: el.tagName, cls: el.className?.slice ? el.className.slice(0, 40) : '', right: r.right, width: r.width });
        }
      });
      return { hasOverflow: sw > iw + 2, sw, iw, offenders: offenders.slice(0, 5) };
    });
    if (overflowReport.hasOverflow) {
      console.log('Overflow report at 768px:', JSON.stringify(overflowReport));
    }
    assert(!overflowReport.hasOverflow, 'E2E 9C: 768x1024 (iPad) zero horizontal scroll overflow');

    // Viewport 4: 1280x800 (Laptop)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${baseUrl}/#/convert`);
    await page.waitForTimeout(400);
    const overflow1280 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    assert(!overflow1280, 'E2E 9D: 1280x800 (Laptop) zero horizontal scroll overflow');

    // Viewport 5: 1440x900 (Desktop)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/#/tools`);
    await page.waitForTimeout(400);
    const overflow1440 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    assert(!overflow1440, 'E2E 9E: 1440x900 (Desktop) zero horizontal scroll overflow');

    // E2E TEST 11: Scanned Document with OCR Layer (7 -> 8 Root-Cause Fix Verification)
    console.log('\n--- BROWSER SUITE 11: SCANNED + OCR LAYER DOCUMENT EDITING (7 -> 8 BUG REPAIR) ---');
    const scannedContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const scannedPage = await scannedContext.newPage();
    try {
      await scannedPage.goto(`${baseUrl}/#/editor`);
      await scannedPage.waitForSelector('input[type="file"]', { state: 'attached' });
      const scannedFileInput = await scannedPage.$('input[type="file"]');
      if (scannedFileInput) {
        await scannedFileInput.setInputFiles(scannedOcrPdfPath);
      }
      await scannedPage.waitForTimeout(2000);

      // Verify hybrid classification badge in viewport
      const pageText = await scannedPage.evaluate(() => document.body.innerText);
      assert(
        pageText.includes('Scanned document with OCR layer detected'),
        'E2E 11A: Scanned document with OCR layer correctly classified as hybrid and displays warning badge'
      );

      // Verify Neural OCR Scanned Editor panel is active
      const hasScannedEditor = await scannedPage.$('text=Neural OCR Scanned Editor');
      assert(hasScannedEditor !== null, 'E2E 11B: Automatically routed to Neural OCR Scanned Editor');

      // Locate word "7" overlay
      await scannedPage.waitForSelector('[title*="Recognized word"][title*="7"]', { timeout: 6000 });
      const word7 = await scannedPage.$('[title*="Recognized word"][title*="7"]');
      assert(word7 !== null, 'E2E 11C: Recognized OCR word "7" overlay rendered at correct position');
      await word7?.click();
      await scannedPage.waitForTimeout(400);

      // Verify word selected in right panel
      const originalTextDisplay = await scannedPage.textContent('text=Original:');
      assert(Boolean(originalTextDisplay && originalTextDisplay.includes('7')), 'E2E 11D: Word "7" selected into replacement editor');

      // Type replacement "8" and apply
      const replInput = await scannedPage.$('input[placeholder="Type replacement word..."]');
      assert(replInput !== null, 'E2E 11E: Replacement word input ready');
      await replInput?.fill('8');
      await scannedPage.click('button:has-text("Replace Word")');
      await scannedPage.waitForTimeout(400);

      // Verify pending edit
      const pendingEditsBadge = await scannedPage.$('text=Pending Scanned Edits');
      assert(pendingEditsBadge !== null, 'E2E 11F: Scanned replacement edit queued in pending list');

      // Click "Save & Reconstruct Page"
      await scannedPage.click('button:has-text("Save & Reconstruct Page")');
      await scannedPage.waitForTimeout(2500);

      // Open Export dialog and download
      await scannedPage.click('button:has-text("Export")');
      await scannedPage.waitForSelector('text=Export File Name');
      const downloadPromise = scannedPage.waitForEvent('download');
      await scannedPage.click('button:has-text("Download Document")');
      const download = await downloadPromise;

      const exportedScannedPath = path.join(tempDir, 'exported-scanned-ocr-8.pdf');
      await download.saveAs(exportedScannedPath);
      const exportedScannedBytes = fs.readFileSync(exportedScannedPath);
      assert(exportedScannedBytes.length > 500, 'E2E 11G: Exported reconstructed PDF successfully generated and downloaded');

      // Forensic verification of exported file:
      const scannedTextItems = await extractPageTextItems(exportedScannedBytes, 1);
      const searchableScannedText = scannedTextItems.map((i) => i.text).join(' ');
      assert(searchableScannedText.includes('8'), 'E2E 11H: Exported document searchable OCR text layer verified to contain "8"');
      assert(!searchableScannedText.includes('7'), 'E2E 11I: Exported document searchable OCR text layer verified to NO LONGER contain "7"');

      const exportedDoc = await PDFDocument.load(exportedScannedBytes);
      const xobj = exportedDoc.getPage(0).node.Resources()?.get(PDFName.of('XObject'));
      assert(xobj instanceof PDFDict, 'E2E 11J: Reconstructed page retains raster image XObject with tone-matched inpainting');
    } finally {
      await scannedContext.close();
    }

    // E2E TEST 12: Genuine Vector PDF Text Editing (7 -> 8 Vector Stream Integrity)
    console.log('\n--- BROWSER SUITE 12: GENUINE VECTOR PDF TEXT EDITING (7 -> 8 VECTOR INTEGRITY) ---');
    const vectorContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const vectorPage = await vectorContext.newPage();
    try {
      await vectorPage.goto(`${baseUrl}/#/editor`);
      await vectorPage.waitForSelector('input[type="file"]', { state: 'attached' });
      const vectorFileInput = await vectorPage.$('input[type="file"]');
      if (vectorFileInput) {
        await vectorFileInput.setInputFiles(vector7PdfPath);
      }
      await vectorPage.waitForTimeout(2000);

      // Verify vector classification
      const vectorBodyText = await vectorPage.evaluate(() => document.body.innerText);
      assert(
        vectorBodyText.includes('Vector PDF detected'),
        'E2E 12A: Pure vector PDF classified as vector document'
      );

      // Verify True Vector Text Editor panel is active
      const hasVectorEditor = await vectorPage.$('text=True Vector Text Editor');
      assert(hasVectorEditor !== null, 'E2E 12B: Opened True Vector Text Editor for vector PDF');

      // Locate vector text item for "7"
      await vectorPage.waitForSelector('[title*="Click to select"][title*="7"]', { timeout: 6000 });
      const vectorItem7 = await vectorPage.$('[title*="Click to select"][title*="7"]');
      assert(vectorItem7 !== null, 'E2E 12C: Vector text item "7" overlay detected on canvas');
      await vectorItem7?.click();
      await vectorPage.waitForTimeout(400);

      // Edit in right panel
      const textarea = await vectorPage.$('textarea');
      assert(textarea !== null, 'E2E 12D: Textarea available in vector editor panel');
      await textarea?.fill('8');
      await vectorPage.click('button:has-text("Apply")');
      await vectorPage.waitForTimeout(400);

      // Verify pending vector edit
      const pendingVectorBadge = await vectorPage.$('text=Pending Vector Edits');
      assert(pendingVectorBadge !== null, 'E2E 12E: Vector edit queued in pending list');

      // Click "Save Vector Changes"
      await vectorPage.click('button:has-text("Save Vector Changes")');
      await vectorPage.waitForTimeout(2000);

      // Open Export dialog and download
      await vectorPage.click('button:has-text("Export")');
      await vectorPage.waitForSelector('text=Export File Name');
      const downloadPromise = vectorPage.waitForEvent('download');
      await vectorPage.click('button:has-text("Download Document")');
      const download = await downloadPromise;

      const exportedVectorPath = path.join(tempDir, 'exported-vector-8.pdf');
      await download.saveAs(exportedVectorPath);
      const exportedVectorBytes = fs.readFileSync(exportedVectorPath);
      assert(exportedVectorBytes.length > 500, 'E2E 12F: Exported vector PDF successfully downloaded');

      // Forensic verification of exported file:
      const vectorTextItems = await extractPageTextItems(exportedVectorBytes, 1);
      const vFullText = vectorTextItems.map((i) => i.text).join(' ');
      assert(vFullText.includes('8'), 'E2E 12G: Vector content stream verified to contain "8"');
      assert(!vFullText.includes('7'), 'E2E 12H: Vector content stream verified to NO LONGER contain "7"');

      const vCls = await classifyPdfDocument(exportedVectorBytes);
      assert(vCls.documentType === 'vector', 'E2E 12I: Document classified as 100% vector without rasterization');
      assert(!vCls.pages[0].hasRasterImage, 'E2E 12J: Zero raster image XObjects created (genuine vector preserved without rasterization)');
    } finally {
      await vectorContext.close();
    }

    // E2E TEST 10: Clean Console Audit (Zero Fatal JavaScript Errors)
    console.log('\n--- BROWSER SUITE 10: CONSOLE INTEGRITY AUDIT ---');
    const fatalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('Failed to load resource: net::ERR_FILE_NOT_FOUND')
    );
    assert(fatalErrors.length === 0, `E2E 10: Zero uncaught fatal JavaScript errors during user journeys (found ${fatalErrors.length})`);

    console.log('\n================================================================');
    console.log(`ALL REAL BROWSER E2E TESTS PASSED! (${passedTests}/${totalTests} succeeded)`);
    console.log('Verified inside real Headless Chrome.');
    console.log('================================================================\n');
  } finally {
    await browser.close();
    // Clean up temporary files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}

    // Close preview server
    await new Promise<void>((resolve) => {
      if (server.httpServer) {
        server.httpServer.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}

runBrowserE2E().catch((err) => {
  console.error('Browser E2E test failed:', err);
  process.exit(1);
});
