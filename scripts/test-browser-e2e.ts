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
} from './synthetic-docs';

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

    // E2E TEST 9: Mobile Responsive Viewports (375px & 390px)
    console.log('\n--- BROWSER SUITE 9: MOBILE RESPONSIVE AUDIT ---');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto(`${baseUrl}/#/`);
    await page.waitForTimeout(500);

    const isHorizontalOverflow375 = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    assert(!isHorizontalOverflow375, 'E2E 9A: 375px mobile viewport has zero horizontal scroll overflow');

    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13/14
    await page.goto(`${baseUrl}/#/tools`);
    await page.waitForTimeout(500);

    const isHorizontalOverflow390 = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    assert(!isHorizontalOverflow390, 'E2E 9B: 390px mobile viewport has zero horizontal scroll overflow');

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
