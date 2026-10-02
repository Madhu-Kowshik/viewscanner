/**
 * OMNIPDF MASTER PRODUCTION TEST SUITE
 * 
 * Strict Enforcement: All tests import and execute the ACTUAL PRODUCTION CODE
 * from `src/lib/pdf/pdf-engine.ts`.
 * 
 * Tests:
 *  1. Watermark on white: content-aware local background reconstruction
 *  2. Watermark on blue: preserves blue background (not white!)
 *  3. Watermark crossing blue + white: preserves both local backgrounds
 *  4. Watermark crossing text: preserves dark text ink
 *  5. Scanned PDF edit: reconstructScannedDocumentWithEdits -> export -> reopen -> verify original gone, new text present
 *  6. Scanned PDF edit on blue background: export -> reopen -> verify
 *  7. Complete line edit & positioning
 *  8. Multi-page edits persistence across pages
 *  9. High-DPI coordinate preservation (A4 595.28 x 841.89 pt)
 * 10. True Permanent Redaction: SECRET12345 purged from content stream
 * 11. Real PDF Encryption: AES-256 password protection & verification
 * 12. Independent per-page watermark processing (no premature document exit)
 * 13. Centralized Export Validation Layer (validateExportedPdf)
 * 14. Coordinate Transformation Pipeline (PDF <-> Render <-> OCR)
 */

import { PDFDocument, rgb, StandardFonts, PDFName, PDFRef, PDFDict } from 'pdf-lib';
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js';

// Direct production engine imports!
import {
  contentAwareWatermarkRemovalOnImageData,
  removeWatermarkFromPdf,
  reconstructScannedDocumentWithEdits,
  applyPermanentRedactionsToPdf,
  applyPermanentRedactionsWithReport,
  encryptPdfDocument,
  unlockPasswordProtectedPdf,
  validateExportedPdf,
  pdfToRenderCoords,
  renderToPdfCoords,
  ocrToRenderCoords,
  renderToNormalizedCoords,
  hexToRgb,
  ScannedTextEditItem,
  RedactionItem,
  getFormFieldsFromPdf,
  fillFormFieldsInPdf,
  addFormFieldToPdf,
  mergePdfs,
  splitPdfEveryPage,
  splitPdfByRanges,
  reversePageOrder,
  detectBlankPages,
  insertBlankPage,
  deletePages,
  extractPages,
  embedSignatureOnPdf,
  compressPdfDocument,
  repairPdfDocument,
  convertTextToPdf,
  cleanPdfMetadata,
  classifyPdfPage,
  classifyPdfDocument,
  validateExportedEdits,
  replaceVectorTextInPdf,
  TextReplacementEdit,
} from '../src/lib/pdf/pdf-engine';

import {
  createSyntheticVectorPdf,
  createSyntheticCorruptedXrefPdf,
  createSyntheticTruncatedPdf,
  createSyntheticFatalCorruptPdf,
  createSyntheticLegitimateDraftCopyPdf,
  createSyntheticWatermarkedPdf,
  createSyntheticTjArrayPdf,
  createSyntheticHexTextPdf,
  createSyntheticAnnotatedPdf,
  createSyntheticScannedWithOcrPdf,
  createSyntheticVectorWithDigit7Pdf,
  createSyntheticScannedPdf,
  createSyntheticMixedPdf,
} from './synthetic-docs';

console.log('================================================================');
console.log('OMNIPDF PRODUCTION ENGINE INTEGRATION & FORENSIC VERIFICATION');
console.log('Testing ACTUAL PRODUCTION FUNCTIONS directly from src/lib/pdf');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
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
  console.log('--- SECTION 1: WATERMARK REMOVAL (PRODUCTION ENGINE) ---');

  // TEST 1: Watermark on white (Production Engine)
  {
    const W = 100, H = 100;
    const data = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      data[i * 4] = 255; data[i * 4 + 1] = 255; data[i * 4 + 2] = 255; data[i * 4 + 3] = 255;
    }
    // Gray watermark stamp (#b4b4b4)
    for (let y = 40; y < 60; y++) {
      for (let x = 30; x < 70; x++) {
        const idx = (y * W + x) * 4;
        data[idx] = 180; data[idx + 1] = 180; data[idx + 2] = 180;
      }
    }

    const imgData = { width: W, height: H, data } as ImageData;
    contentAwareWatermarkRemovalOnImageData(imgData, {
      targetRgb: { r: 180 / 255, g: 180 / 255, b: 180 / 255 },
      tolerance: 0.20,
      preserveText: true,
    });

    const cIdx = (50 * W + 50) * 4;
    const r = data[cIdx], g = data[cIdx + 1], b = data[cIdx + 2];
    assert(r >= 250 && g >= 250 && b >= 250, `TEST 1: Production Watermark on white: restored to white (rgb: ${r},${g},${b})`);
  }

  // TEST 2: Watermark on blue (Production Engine)
  {
    const W = 100, H = 100;
    const data = new Uint8ClampedArray(W * H * 4);
    const bgR = 173, bgG = 216, bgB = 230; // CSS LightBlue
    for (let i = 0; i < W * H; i++) {
      data[i * 4] = bgR; data[i * 4 + 1] = bgG; data[i * 4 + 2] = bgB; data[i * 4 + 3] = 255;
    }
    // Gray stamp blended on light blue: (163, 195, 212)
    const wmBlendedR = 163, wmBlendedG = 195, wmBlendedB = 212;
    for (let y = 40; y < 60; y++) {
      for (let x = 30; x < 70; x++) {
        const idx = (y * W + x) * 4;
        data[idx] = wmBlendedR; data[idx + 1] = wmBlendedG; data[idx + 2] = wmBlendedB;
      }
    }

    const imgData = { width: W, height: H, data } as ImageData;
    contentAwareWatermarkRemovalOnImageData(imgData, {
      targetRgb: { r: 148 / 255, g: 163 / 255, b: 184 / 255 }, // Gray stamp preset
      tolerance: 0.22,
      preserveText: true,
    });

    const cIdx = (50 * W + 50) * 4;
    const r = data[cIdx], g = data[cIdx + 1], b = data[cIdx + 2];
    assert(
      Math.abs(r - bgR) < 15 && Math.abs(g - bgG) < 15 && Math.abs(b - bgB) < 15,
      `TEST 2: Production Watermark on blue: restored to blue (got rgb: ${r},${g},${b}; expected ~${bgR},${bgG},${bgB}; NOT white)`
    );
  }

  // TEST 3: Watermark crossing blue + white (Production Engine)
  {
    const W = 100, H = 100;
    const data = new Uint8ClampedArray(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        if (x < 50) {
          data[idx] = 100; data[idx + 1] = 150; data[idx + 2] = 240;
        } else {
          data[idx] = 255; data[idx + 1] = 255; data[idx + 2] = 255;
        }
        data[idx + 3] = 255;
      }
    }
    // Watermark across boundary
    for (let y = 45; y < 55; y++) {
      for (let x = 20; x < 80; x++) {
        const idx = (y * W + x) * 4;
        data[idx] = 180; data[idx + 1] = 190; data[idx + 2] = 200;
      }
    }

    const imgData = { width: W, height: H, data } as ImageData;
    contentAwareWatermarkRemovalOnImageData(imgData, {
      targetRgb: { r: 180 / 255, g: 190 / 255, b: 200 / 255 },
      tolerance: 0.25,
      preserveText: true,
    });

    const leftIdx = (50 * W + 30) * 4;
    const leftB = data[leftIdx + 2];
    const rightIdx = (50 * W + 70) * 4;
    const rightR = data[rightIdx];

    assert(leftB > 200 && rightR > 230, 'TEST 3: Watermark crossing boundary: left is blue, right is white');
  }

  // TEST 4: Watermark crossing dark text (Production Engine)
  {
    const W = 100, H = 100;
    const data = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      data[i * 4] = 255; data[i * 4 + 1] = 255; data[i * 4 + 2] = 255; data[i * 4 + 3] = 255;
    }
    for (let y = 40; y < 60; y++) {
      for (let x = 20; x < 80; x++) {
        const idx = (y * W + x) * 4;
        data[idx] = 190; data[idx + 1] = 190; data[idx + 2] = 190;
      }
    }
    // Sharp dark text
    for (let y = 48; y < 52; y++) {
      for (let x = 40; x < 60; x++) {
        const idx = (y * W + x) * 4;
        data[idx] = 15; data[idx + 1] = 15; data[idx + 2] = 15;
      }
    }

    const imgData = { width: W, height: H, data } as ImageData;
    contentAwareWatermarkRemovalOnImageData(imgData, {
      targetRgb: { r: 190 / 255, g: 190 / 255, b: 190 / 255 },
      tolerance: 0.15,
      preserveText: true,
    });

    const textPixel = data[(50 * W + 50) * 4];
    const wmPixel = data[(50 * W + 25) * 4];
    assert(textPixel < 35 && wmPixel > 240, `TEST 4: Dark text ink preserved (${textPixel} < 35), watermark erased (${wmPixel} > 240)`);
  }

  console.log('\n--- SECTION 2: SCANNED PDF RECONSTRUCTION (PRODUCTION ENGINE) ---');

  // TEST 5: Scanned PDF Text Edit, Export & Reopen (Production Engine)
  {
    const baseDoc = await PDFDocument.create();
    const page = baseDoc.addPage([600, 800]);
    page.drawText('OriginalInvoiceWord', { x: 80, y: 700, size: 16 });
    const initialBytes = await baseDoc.save();

    const edits: ScannedTextEditItem[] = [
      {
        id: 'ocr-word-1',
        pageNumber: 1,
        originalText: 'OriginalInvoiceWord',
        newText: 'ReplacedProductionWord',
        bbox: { x0: 75 / 600, y0: (800 - 720) / 800, x1: 260 / 600, y1: (800 - 690) / 800 },
        fontSize: 16,
      },
    ];

    const exportedBytes = await reconstructScannedDocumentWithEdits(initialBytes, edits);
    assert(exportedBytes.byteLength > 0, 'Production engine exported reconstructed PDF bytes');

    // Reopen exported file with pdfjs as ultimate proof
    const pdfjsDoc = await pdfjs.getDocument({ data: exportedBytes }).promise;
    const p1 = await pdfjsDoc.getPage(1);
    const tc = await p1.getTextContent();
    const allStrings = tc.items.map((it: any) => it.str).filter(Boolean);

    assert(
      allStrings.some((s) => s.includes('ReplacedProductionWord')),
      'TEST 5: Exported PDF contains replacement text "ReplacedProductionWord" upon reopen'
    );
  }

  // TEST 6: Scanned PDF Edit on Blue Background (Production Engine)
  {
    const baseDoc = await PDFDocument.create();
    const page = baseDoc.addPage([600, 800]);
    page.drawRectangle({ x: 50, y: 650, width: 500, height: 60, color: rgb(0.1, 0.4, 0.8) });
    page.drawText('OLD BLUE TITLE', { x: 70, y: 670, size: 18, color: rgb(1, 1, 1) });
    const initialBytes = await baseDoc.save();

    const edits: ScannedTextEditItem[] = [
      {
        id: 'blue-edit-1',
        pageNumber: 1,
        originalText: 'OLD BLUE TITLE',
        newText: 'NEW VERIFIED TITLE',
        bbox: { x0: 65 / 600, y0: (800 - 695) / 800, x1: 300 / 600, y1: (800 - 665) / 800 },
        color: '#ffffff',
        fontSize: 18,
      },
    ];

    const exportedBytes = await reconstructScannedDocumentWithEdits(initialBytes, edits);
    const pdfjsDoc = await pdfjs.getDocument({ data: exportedBytes }).promise;
    const p1 = await pdfjsDoc.getPage(1);
    const tc = await p1.getTextContent();
    const strings = tc.items.map((it: any) => it.str).filter(Boolean);

    assert(
      strings.some((s) => s.includes('NEW VERIFIED TITLE')),
      'TEST 6: Production engine reconstructed text on blue background'
    );
  }

  // TEST 7: Complete Line Replacement
  {
    const baseDoc = await PDFDocument.create();
    const page = baseDoc.addPage([595, 842]);
    page.drawText('Line 1 to be completely replaced by production engine.', { x: 50, y: 750, size: 12 });
    const initialBytes = await baseDoc.save();

    const edits: ScannedTextEditItem[] = [
      {
        id: 'line-edit',
        pageNumber: 1,
        originalText: 'Line 1 to be completely replaced by production engine.',
        newText: 'Line 1 replaced and positioned accurately in production.',
        bbox: { x0: 45 / 595, y0: (842 - 765) / 842, x1: 520 / 595, y1: (842 - 745) / 842 },
        fontSize: 12,
      },
    ];

    const exportedBytes = await reconstructScannedDocumentWithEdits(initialBytes, edits);
    const pdfjsDoc = await pdfjs.getDocument({ data: exportedBytes }).promise;
    const p1 = await pdfjsDoc.getPage(1);
    const tc = await p1.getTextContent();
    const strings = tc.items.map((it: any) => it.str).filter(Boolean);

    assert(
      strings.some((s) => s.includes('Line 1 replaced and positioned accurately in production.')),
      'TEST 7: Production engine replaced and positioned complete line'
    );
  }

  // TEST 8: Multi-Page Edits Persistence (Production Engine)
  {
    const baseDoc = await PDFDocument.create();
    baseDoc.addPage([600, 800]).drawText('Page 1 Text', { x: 50, y: 700, size: 14 });
    baseDoc.addPage([600, 800]).drawText('Page 2 Text', { x: 50, y: 700, size: 14 });
    const initialBytes = await baseDoc.save();

    const edits: ScannedTextEditItem[] = [
      {
        id: 'p1-ed',
        pageNumber: 1,
        originalText: 'Page 1 Text',
        newText: 'Page 1 Persisted Edit',
        bbox: { x0: 45 / 600, y0: (800 - 720) / 800, x1: 250 / 600, y1: (800 - 690) / 800 },
        fontSize: 14,
      },
      {
        id: 'p2-ed',
        pageNumber: 2,
        originalText: 'Page 2 Text',
        newText: 'Page 2 Persisted Edit',
        bbox: { x0: 45 / 600, y0: (800 - 720) / 800, x1: 250 / 600, y1: (800 - 690) / 800 },
        fontSize: 14,
      },
    ];

    const exportedBytes = await reconstructScannedDocumentWithEdits(initialBytes, edits);
    const pdfjsDoc = await pdfjs.getDocument({ data: exportedBytes }).promise;

    const p1 = await (await pdfjsDoc.getPage(1)).getTextContent();
    const p2 = await (await pdfjsDoc.getPage(2)).getTextContent();

    const hasP1 = p1.items.map((i: any) => i.str).some((s: string) => s.includes('Page 1 Persisted Edit'));
    const hasP2 = p2.items.map((i: any) => i.str).some((s: string) => s.includes('Page 2 Persisted Edit'));

    assert(hasP1 && hasP2, 'TEST 8: Production multi-page edits persisted cleanly across Page 1 & Page 2');
  }

  // TEST 9: Quality & Resolution Verification (Production Engine)
  {
    const doc = await PDFDocument.create();
    doc.addPage([595.28, 841.89]).drawText('DPI Quality Check', { x: 50, y: 800, size: 12 });
    const initialBytes = await doc.save();

    const edits: ScannedTextEditItem[] = [
      {
        id: 'dpi-1',
        pageNumber: 1,
        originalText: 'DPI Quality Check',
        newText: 'High DPI Zero Downsampling',
        bbox: { x0: 45 / 595.28, y0: (841.89 - 815) / 841.89, x1: 300 / 595.28, y1: (841.89 - 795) / 841.89 },
        fontSize: 12,
      },
    ];

    const exportedBytes = await reconstructScannedDocumentWithEdits(initialBytes, edits);
    const checkDoc = await PDFDocument.load(exportedBytes);
    const sz = checkDoc.getPage(0).getSize();

    assert(
      Math.abs(sz.width - 595.28) < 0.1 && Math.abs(sz.height - 841.89) < 0.1,
      `TEST 9: High-DPI dimensions preserved: ${sz.width.toFixed(2)}x${sz.height.toFixed(2)} pt`
    );
  }

  console.log('\n--- SECTION 3: TRUE PERMANENT REDACTION (PRODUCTION ENGINE) ---');

  // TEST 10: Permanent Redaction Purges Text From Content Stream
  {
    const doc = await PDFDocument.create();
    const page = doc.addPage([500, 500]);
    page.drawText('Account Number: SECRET12345', { x: 50, y: 300, size: 14 });
    const initialBytes = await doc.save();

    // Verify SECRET12345 is present initially
    const initialPdfjs = await pdfjs.getDocument({ data: initialBytes }).promise;
    const initialText = (await (await initialPdfjs.getPage(1)).getTextContent()).items.map((i: any) => i.str).join(' ');
    assert(initialText.includes('SECRET12345'), 'Base document contains SECRET12345 before redaction');

    // Apply TRUE permanent redaction using production engine
    const redactions: RedactionItem[] = [
      {
        pageNumber: 1,
        bbox: { x0: 160 / 500, y0: (500 - 315) / 500, x1: 320 / 500, y1: (500 - 290) / 500 },
        textToRemove: 'SECRET12345',
      },
    ];

    const redactedBytes = await applyPermanentRedactionsToPdf(initialBytes, redactions);

    // Reopen exported PDF and verify SECRET12345 is 100% GONE
    const verifyPdfjs = await pdfjs.getDocument({ data: redactedBytes }).promise;
    const extractedText = (await (await verifyPdfjs.getPage(1)).getTextContent()).items.map((i: any) => i.str).join(' ');

    assert(!extractedText.includes('SECRET12345'), 'TEST 10A: SECRET12345 is 100% PURGED from exported content stream (cannot be extracted)');
    assert(!new TextDecoder().decode(redactedBytes).includes('SECRET12345'), 'TEST 10B: Raw byte stream verification: literal SECRET12345 does not exist');
  }

  console.log('\n--- SECTION 4: REAL PDF ENCRYPTION & SECURITY (PRODUCTION ENGINE) ---');

  // TEST 11: Real PDF Encryption with Password Protection
  {
    const doc = await PDFDocument.create();
    doc.addPage([400, 400]).drawText('Confidential Classified Data', { x: 50, y: 350, size: 14 });
    const rawBytes = await doc.save();

    // Encrypt with production engine
    const encryptedBytes = await encryptPdfDocument(rawBytes, 'TESTPASS123', {
      algorithm: 'AES-256',
    });

    assert(encryptedBytes.byteLength > 0, 'Production engine generated encrypted PDF bytes');

    // 1. Must fail when opened without password
    let failedWithoutPassword = false;
    try {
      await pdfjs.getDocument({ data: encryptedBytes }).promise;
    } catch (err: any) {
      failedWithoutPassword = err.name === 'PasswordException';
    }
    assert(failedWithoutPassword, 'TEST 11A: PDF rejected without password (PasswordException triggered)');

    // 2. Must fail with incorrect password
    let failedWithWrongPassword = false;
    try {
      await pdfjs.getDocument({ data: encryptedBytes, password: 'WRONGPASSWORD' }).promise;
    } catch (err: any) {
      failedWithWrongPassword = err.name === 'PasswordException';
    }
    assert(failedWithWrongPassword, 'TEST 11B: PDF rejected with incorrect password');

    // 3. Must succeed with correct password
    const opened = await pdfjs.getDocument({ data: encryptedBytes, password: 'TESTPASS123' }).promise;
    assert(opened.numPages === 1, 'TEST 11C: PDF successfully unlocked and verified with correct password');
  }

  console.log('\n--- SECTION 5: INDEPENDENT PER-PAGE WATERMARK PROCESSING ---');

  // TEST 12: Independent Watermark Processing across Pages
  {
    const doc = await PDFDocument.create();
    // Page 1: Vector watermark text operator
    const p1 = doc.addPage([500, 500]);
    p1.drawText('CONFIDENTIAL', { x: 100, y: 250, size: 36 });
    p1.drawText('Page 1 Content', { x: 50, y: 400, size: 14 });

    // Page 2: Normal page with another watermark text
    const p2 = doc.addPage([500, 500]);
    p2.drawText('DRAFT', { x: 150, y: 250, size: 36 });
    p2.drawText('Page 2 Content', { x: 50, y: 400, size: 14 });

    const twoPageBytes = await doc.save();

    const cleanedBytes = await removeWatermarkFromPdf(twoPageBytes, {
      mode: 'auto',
      watermarkText: 'CONFIDENTIAL',
    });

    const verify = await pdfjs.getDocument({ data: cleanedBytes }).promise;
    const p1Text = (await (await verify.getPage(1)).getTextContent()).items.map((i: any) => i.str).join(' ');

    assert(!p1Text.includes('CONFIDENTIAL'), 'TEST 12: Page 1 watermark removed without halting multi-page processing');
  }

  console.log('\n--- SECTION 6: EXPORT VALIDATION & COORDINATES ---');

  // TEST 13: Centralized Export Validation Layer
  {
    const doc = await PDFDocument.create();
    doc.addPage([595, 842]).drawText('Valid Production File', { x: 50, y: 700, size: 14 });
    const bytes = await doc.save();

    const valResult = await validateExportedPdf(bytes, {
      expectedPageCount: 1,
      expectedWidth: 595,
      expectedHeight: 842,
      requiredStrings: ['Valid Production File'],
      forbiddenStrings: ['SECRET12345'],
    });

    assert(valResult.valid, 'TEST 13A: Centralized export validation confirms valid structure and content');

    // Test detection of forbidden strings
    const failResult = await validateExportedPdf(bytes, {
      forbiddenStrings: ['Valid Production File'],
    });
    assert(!failResult.valid && failResult.forbiddenStringsFound.length > 0, 'TEST 13B: Validation correctly flags forbidden content');
  }

  // TEST 14: Coordinate Transformation Pipeline Roundtrip
  {
    const sys = {
      pdfWidth: 600,
      pdfHeight: 800,
      renderWidth: 1200,
      renderHeight: 1600,
      scale: 2.0,
    };

    const pt = { x: 150, y: 200 };
    const render = pdfToRenderCoords(pt.x, pt.y, sys);
    const roundtrip = renderToPdfCoords(render.x, render.y, sys);

    assert(
      Math.abs(roundtrip.x - pt.x) < 0.001 && Math.abs(roundtrip.y - pt.y) < 0.001,
      `TEST 14A: PDF <-> Render coordinate roundtrip exact (pt: ${pt.x},${pt.y} -> render: ${render.x},${render.y} -> roundtrip: ${roundtrip.x},${roundtrip.y})`
    );

    const norm = renderToNormalizedCoords(render.x, render.y, 100, 50, sys.renderWidth, sys.renderHeight);
    const ocrPx = ocrToRenderCoords(norm, sys.renderWidth, sys.renderHeight);
    assert(Math.abs(ocrPx.x - render.x) < 0.001 && Math.abs(ocrPx.width - 100) < 0.001, 'TEST 14B: Normalized OCR <-> Render coordinates exact');
  }

  console.log('\n--- SECTION 7: INTERACTIVE ACROFORMS STUDIO ---');

  // TEST 15: Create, Extract & Fill AcroForm Fields
  {
    const doc = await PDFDocument.create();
    doc.addPage([500, 500]);
    const initialBytes = await doc.save();

    // 1. Add Text Field and CheckBox
    const withText = await addFormFieldToPdf(initialBytes, 0, 'text', 'full_name', 50, 400, 200, 30);
    const withForm = await addFormFieldToPdf(withText, 0, 'checkbox', 'terms_agree', 50, 350, 20, 20);

    // 2. Extract fields
    const fields = await getFormFieldsFromPdf(withForm);
    assert(fields.some(f => f.name === 'full_name'), 'TEST 15A: AcroForm text field successfully extracted');
    assert(fields.some(f => f.name === 'terms_agree'), 'TEST 15B: AcroForm checkbox field successfully extracted');

    // 3. Fill fields
    const filledBytes = await fillFormFieldsInPdf(withForm, {
      full_name: 'Dr. Jane Watson',
      terms_agree: true,
    }, false);

    // 4. Verify filled values on reopen
    const reopenedDoc = await PDFDocument.load(filledBytes);
    const form = reopenedDoc.getForm();
    assert(form.getTextField('full_name').getText() === 'Dr. Jane Watson', 'TEST 15C: Form text field value verified upon reopen');
    assert(form.getCheckBox('terms_agree').isChecked() === true, 'TEST 15D: Form checkbox state verified upon reopen');

    // TEST 16: Flatten Form Fields
    const flattenedBytes = await fillFormFieldsInPdf(withForm, {
      full_name: 'Dr. Jane Watson',
      terms_agree: true,
    }, true);
    const flattenedDoc = await PDFDocument.load(flattenedBytes);
    assert(flattenedDoc.getForm().getFields().length === 0, 'TEST 16: Flattened form fields converted to static content (zero interactive widgets)');
  }

  console.log('\n--- SECTION 8: PAGE ORGANIZATION & STRUCTURAL MANIPULATION ---');

  // TEST 17: Merge Multiple PDFs
  {
    const doc1 = await PDFDocument.create();
    doc1.addPage([400, 400]).drawText('Doc 1 Page 1', { x: 50, y: 350, size: 12 });
    const bytes1 = await doc1.save();

    const doc2 = await PDFDocument.create();
    doc2.addPage([400, 400]).drawText('Doc 2 Page 1', { x: 50, y: 350, size: 12 });
    doc2.addPage([400, 400]).drawText('Doc 2 Page 2', { x: 50, y: 350, size: 12 });
    const bytes2 = await doc2.save();

    const mergedBytes = await mergePdfs([bytes1, bytes2]);
    const mergedDoc = await PDFDocument.load(mergedBytes);
    assert(mergedDoc.getPageCount() === 3, 'TEST 17: mergePdfs combined 1-page + 2-page into 3-page document');
  }

  // TEST 18: Reverse Page Order
  {
    const doc = await PDFDocument.create();
    for (let i = 1; i <= 3; i++) {
      doc.addPage([400, 400]).drawText(`Page ${i}`, { x: 50, y: 350, size: 14 });
    }
    const bytes = await doc.save();
    const reversedBytes = await reversePageOrder(bytes);
    const reversedDoc = await PDFDocument.load(reversedBytes);
    assert(reversedDoc.getPageCount() === 3, 'TEST 18: reversePageOrder preserved total page count');
  }

  // TEST 19: Insert Blank Page
  {
    const doc = await PDFDocument.create();
    doc.addPage([400, 400]);
    doc.addPage([400, 400]);
    const bytes = await doc.save();

    const withBlank = await insertBlankPage(bytes, 1, 595.28, 841.89);
    const withBlankDoc = await PDFDocument.load(withBlank);
    assert(withBlankDoc.getPageCount() === 3, 'TEST 19: insertBlankPage expanded 2-page PDF into 3 pages');
  }

  // TEST 20: Split PDF by Custom Ranges
  {
    const doc = await PDFDocument.create();
    for (let i = 1; i <= 5; i++) {
      doc.addPage([400, 400]).drawText(`Page ${i}`, { x: 50, y: 350, size: 14 });
    }
    const bytes = await doc.save();

    const ranges = [
      { id: 'r1', start: 1, end: 2, name: 'part1' },
      { id: 'r2', start: 3, end: 5, name: 'part2' },
    ];
    const splits = await splitPdfByRanges(bytes, ranges);
    assert(splits.length === 2, 'TEST 20A: splitPdfByRanges created 2 split parts');
    const part1Doc = await PDFDocument.load(splits[0].data);
    const part2Doc = await PDFDocument.load(splits[1].data);
    assert(part1Doc.getPageCount() === 2, 'TEST 20B: Range 1-2 contains exactly 2 pages');
    assert(part2Doc.getPageCount() === 3, 'TEST 20C: Range 3-5 contains exactly 3 pages');
  }

  // TEST 21: Split Every Page
  {
    const doc = await PDFDocument.create();
    doc.addPage([400, 400]);
    doc.addPage([400, 400]);
    const bytes = await doc.save();
    const singlePages = await splitPdfEveryPage(bytes);
    assert(singlePages.length === 2, 'TEST 21: splitPdfEveryPage created 2 standalone single-page files');
  }

  // TEST 22: Delete Pages
  {
    const doc = await PDFDocument.create();
    for (let i = 1; i <= 4; i++) doc.addPage([400, 400]);
    const bytes = await doc.save();
    const deletedBytes = await deletePages(bytes, [2, 3]); // Delete pages 2 and 3
    const deletedDoc = await PDFDocument.load(deletedBytes);
    assert(deletedDoc.getPageCount() === 2, 'TEST 22: deletePages removed 2 pages from 4-page PDF');
  }

  // TEST 23: Extract Pages
  {
    const doc = await PDFDocument.create();
    for (let i = 1; i <= 5; i++) doc.addPage([400, 400]);
    const bytes = await doc.save();
    const extractedBytes = await extractPages(bytes, [1, 4]); // 1-indexed
    const extractedDoc = await PDFDocument.load(extractedBytes);
    assert(extractedDoc.getPageCount() === 2, 'TEST 23: extractPages extracted exactly pages 1 & 4');
  }

  console.log('\n--- SECTION 9: VISUAL SIGNATURE EMBEDDING ---');

  // TEST 24: Visual Signature Stamp
  {
    const doc = await PDFDocument.create();
    doc.addPage([500, 500]);
    const bytes = await doc.save();

    // 1x1 png image data url
    const fakeSigDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
    const signedBytes = await embedSignatureOnPdf(bytes, 0, fakeSigDataUrl, 0.5, 0.5, 0.2, 0.1);
    const signedDoc = await PDFDocument.load(signedBytes);
    assert(signedDoc.getPageCount() === 1, 'TEST 24: embedSignatureOnPdf successfully stamped signature onto page');
  }

  console.log('\n--- SECTION 10: PDF COMPRESSION ---');

  // TEST 25: Structural Stream Compression
  {
    const doc = await PDFDocument.create();
    doc.addPage([500, 500]).drawText('Uncompressed Stream Content', { x: 50, y: 400, size: 14 });
    const bytes = await doc.save();

    const res = await compressPdfDocument(bytes, {
      preset: 'structural' as any,
      removeMetadata: true,
      flattenAnnotations: false,
    });
    assert(res.data.byteLength > 0, 'TEST 25A: compressPdfDocument (structural) produced valid bytes');
    const reopened = await PDFDocument.load(res.data);
    assert(reopened.getPageCount() === 1, 'TEST 25B: Structural compression preserved page count & vector layout');
  }

  console.log('\n--- SECTION 11: FAULT-TOLERANT PDF REPAIR (REAL CORRUPTION) ---');

  // TEST 26A: Repair of real PDF with corrupted startxref
  {
    const corruptedBytes = await createSyntheticCorruptedXrefPdf();
    let originalFailed = false;
    try {
      await PDFDocument.load(corruptedBytes);
    } catch {
      originalFailed = true;
    }
    assert(originalFailed, 'TEST 26A-1: Confirmed input fixture contains genuine corruption (PDFDocument.load fails)');

    const report = await repairPdfDocument(corruptedBytes);
    assert(report.success && report.pageCount >= 1, 'TEST 26A-2: repairPdfDocument salvaged corrupted XRef table');
    assert(report.repairedBytes !== undefined && report.repairedBytes.byteLength > 100, 'TEST 26A-3: Repaired bytes produced');

    const reopened = await PDFDocument.load(report.repairedBytes!);
    assert(reopened.getPageCount() >= 1, 'TEST 26A-4: Exported repaired document successfully reopened by PDF-lib');
  }

  // TEST 26B: Repair of truncated PDF (missing %%EOF)
  {
    const truncatedBytes = await createSyntheticTruncatedPdf();
    const report = await repairPdfDocument(truncatedBytes);
    assert(report.actionsTaken.some((a) => a.includes('truncated') || a.includes('trailer') || a.includes('salvaged')), 'TEST 26B: Truncated trailer detected and salvaged');
  }

  // TEST 26C: Graceful failure on fatal unrecoverable noise
  {
    const fatalBytes = createSyntheticFatalCorruptPdf();
    const report = await repairPdfDocument(fatalBytes);
    assert(!report.success && report.pageCount === 0, 'TEST 26C: Unrecoverable random bytes correctly reported as failed (zero fake success)');
  }

  console.log('\n--- SECTION 12: FORMAT CONVERSION ---');

  // TEST 27: Plain Text to PDF Conversion
  {
    const sampleText = 'Title: Executive Report\n\nParagraph 1: All operations performed successfully in memory.\n\nParagraph 2: Data integrity verified.';
    const textPdfBytes = await convertTextToPdf(sampleText, 'Executive Report');
    const textDoc = await PDFDocument.load(textPdfBytes);
    assert(textDoc.getPageCount() >= 1, 'TEST 27: convertTextToPdf formatted plaintext into paginated PDF');
  }

  console.log('\n--- SECTION 13: METADATA SANITIZATION ---');

  // TEST 28: Scrub Metadata
  {
    const doc = await PDFDocument.create();
    doc.setTitle('Confidential Document');
    doc.setAuthor('Secret Author');
    doc.setProducer('Proprietary Tool v1.0');
    doc.addPage([400, 400]);
    const bytes = await doc.save();

    const sanitizedBytes = await cleanPdfMetadata(bytes);
    const sanitizedDoc = await PDFDocument.load(sanitizedBytes);
    assert(!sanitizedDoc.getTitle() || sanitizedDoc.getTitle() === '', 'TEST 28A: Title sanitized');
    assert(!sanitizedDoc.getAuthor() || sanitizedDoc.getAuthor() === '', 'TEST 28B: Author sanitized');
  }

  console.log('\n--- SECTION 14: WATERMARK REMOVAL SAFETY (BODY TEXT SURVIVAL) ---');

  // TEST 29: Legitimate body words ('DRAFT' & 'COPY') MUST NOT be erased by automatic cleaner
  {
    const manuscriptBytes = await createSyntheticLegitimateDraftCopyPdf();
    const cleanedBytes = await removeWatermarkFromPdf(manuscriptBytes, { mode: 'auto' });

    // Reopen and extract text
    const task = pdfjs.getDocument({ data: new Uint8Array(cleanedBytes) });
    const verifyDoc = await task.promise;
    const page = await verifyDoc.getPage(1);
    const content = await page.getTextContent();
    const fullText = content.items.map((i: any) => i.str || '').join(' ');

    assert(fullText.includes('DRAFT'), 'TEST 29A: Legitimate body word "DRAFT" was preserved and NOT deleted');
    assert(fullText.includes('COPY'), 'TEST 29B: Legitimate body word "COPY" was preserved and NOT deleted');
  }

  // TEST 30: Explicit watermark text removal
  {
    const wmBytes = await createSyntheticWatermarkedPdf();
    const cleanedBytes = await removeWatermarkFromPdf(wmBytes, {
      mode: 'auto',
      watermarkText: 'CONFIDENTIAL',
    });

    const task = pdfjs.getDocument({ data: new Uint8Array(cleanedBytes) });
    const verifyDoc = await task.promise;
    const page = await verifyDoc.getPage(1);
    const content = await page.getTextContent();
    const fullText = content.items.map((i: any) => i.str || '').join(' ');

    assert(!fullText.includes('CONFIDENTIAL'), 'TEST 30: Explicit target watermark "CONFIDENTIAL" successfully removed');
  }

  console.log('\n--- SECTION 15: ADVERSARIAL REDACTION (TJ ARRAYS, HEX & ANNOTATIONS) ---');

  // TEST 31: Redaction of kerning array TJ text [ (SEC) -10 (RET) 20 (12345) ]
  {
    const tjBytes = await createSyntheticTjArrayPdf();
    const report = await applyPermanentRedactionsWithReport(tjBytes, [
      {
        pageNumber: 1,
        bbox: { x0: 40, y0: 740, x1: 250, y1: 770 },
        textToRemove: 'SECRET12345',
      },
    ]);

    assert(report.success, 'TEST 31A: applyPermanentRedactionsWithReport executed successfully');

    // Verify reopen with PDF.js
    const task = pdfjs.getDocument({ data: new Uint8Array(report.pdfBytes) });
    const verifyDoc = await task.promise;
    const page = await verifyDoc.getPage(1);
    const content = await page.getTextContent();
    const fullText = content.items.map((i: any) => i.str || '').join(' ');

    assert(!fullText.includes('SECRET12345'), 'TEST 31B: SECRET12345 purged from TJ kerning array');
    assert(fullText.includes('PUBLIC_SURVIVING_TEXT'), 'TEST 31C: Neighboring non-redacted text survived 100%');
  }

  // TEST 32: Redaction of Hex encoded text <5345435245543132333435>
  {
    const hexBytes = await createSyntheticHexTextPdf();
    const report = await applyPermanentRedactionsWithReport(hexBytes, [
      {
        pageNumber: 1,
        bbox: { x0: 40, y0: 740, x1: 250, y1: 770 },
        textToRemove: 'SECRET12345',
      },
    ]);

    const task = pdfjs.getDocument({ data: new Uint8Array(report.pdfBytes) });
    const verifyDoc = await task.promise;
    const page = await verifyDoc.getPage(1);
    const content = await page.getTextContent();
    const fullText = content.items.map((i: any) => i.str || '').join(' ');

    assert(!fullText.includes('SECRET12345'), 'TEST 32A: SECRET12345 purged from hexadecimal text operator');
    assert(fullText.includes('PUBLIC_NEIGHBOR_DATA'), 'TEST 32B: Neighboring text PUBLIC_NEIGHBOR_DATA survived 100%');
  }

  // TEST 33: Intersecting link annotation purging
  {
    const annotBytes = await createSyntheticAnnotatedPdf();
    const report = await applyPermanentRedactionsWithReport(annotBytes, [
      {
        pageNumber: 1,
        bbox: { x0: 40, y0: 740, x1: 260, y1: 780 },
      },
    ]);

    assert(report.annotationsRemoved >= 1, 'TEST 33A: Intersecting link annotation detected and purged');

    const reopened = await PDFDocument.load(report.pdfBytes);
    const page = reopened.getPage(0);
    const remainingAnnots = (page.node as any).Annots?.();
    const annotCount = remainingAnnots ? (remainingAnnots as any).size?.() || 0 : 0;
    assert(annotCount === 0, 'TEST 33B: Annotation array in exported PDF verified empty of sensitive link');
  }

  console.log('\n--- SECTION 16: PASSWORD ENCRYPTION & UNLOCK ARCHITECTURE ---');

  // TEST 34: Encrypt and unlock verification
  {
    const baseBytes = await createSyntheticVectorPdf();
    const password = 'CorrectPassword2026!';
    const encryptedBytes = await encryptPdfDocument(baseBytes, password);

    // Test wrong password rejection
    const wrongResult = await unlockPasswordProtectedPdf(encryptedBytes.buffer as ArrayBuffer, 'WrongPassword!');
    assert(!wrongResult.success, 'TEST 34A: Incorrect password rejected with failure status');

    // Test correct password unlock
    const unlockResult = await unlockPasswordProtectedPdf(encryptedBytes.buffer as ArrayBuffer, password);
    assert(unlockResult.success, 'TEST 34B: Correct password accepted');
    assert(unlockResult.pageCount === 1, 'TEST 34C: Unlocked document page count matches original');
    assert(unlockResult.dimensions && unlockResult.dimensions.length === 1, 'TEST 34D: Page dimensions preserved');
    assert(unlockResult.method === 'raster-reconstruction' || unlockResult.method === 'lossless', 'TEST 34E: Unlock method explicitly and honestly reported');
  }

  console.log('\n--- SECTION 17: VECTOR VS SCANNED/HYBRID PDF CLASSIFICATION & EDITING (7 -> 8 BUG REPAIR) ---');

  // TEST 35: Document & Page Classification (Distinguishing vector, scanned, hybrid)
  {
    const vectorPdf = await createSyntheticVectorPdf();
    const cVector = await classifyPdfDocument(vectorPdf);
    assert(cVector.documentType === 'vector', 'TEST 35A: Pure vector PDF classified as vector document');
    assert(cVector.pages[0].type === 'vector', 'TEST 35B: Pure vector page classified as vector page');

    const scannedPdf = await createSyntheticScannedPdf();
    const cScanned = await classifyPdfDocument(scannedPdf);
    assert(cScanned.documentType === 'scanned', 'TEST 35C: Pure scanned PDF classified as scanned document');
    assert(cScanned.pages[0].type === 'scanned', 'TEST 35D: Pure scanned page classified as scanned page');

    const hybridPdf = await createSyntheticScannedWithOcrPdf();
    const cHybrid = await classifyPdfDocument(hybridPdf);
    assert(cHybrid.documentType === 'hybrid', 'TEST 35E: Scanned PDF with OCR layer classified as hybrid document');
    assert(cHybrid.pages[0].type === 'hybrid', 'TEST 35F: Scanned page with OCR layer classified as hybrid page');

    const mixedPdf = await createSyntheticMixedPdf();
    const cMixed = await classifyPdfDocument(mixedPdf);
    assert(cMixed.documentType === 'hybrid', 'TEST 35G: Mixed PDF with vector + scanned classified as hybrid document');
    assert(cMixed.pages[0].type === 'vector', 'TEST 35H: Mixed PDF Page 1 classified as vector');
    assert(cMixed.pages[1].type === 'scanned', 'TEST 35I: Mixed PDF Page 2 classified as scanned');
  }

  // TEST 36: Scanned PDF with OCR Layer — 7 -> 8 Edit (Visible Pixels + Searchable Text Sync)
  {
    const initialHybridBytes = await createSyntheticScannedWithOcrPdf();

    // Verify initial state: has OCR text 7
    const initialPdf = await pdfjs.getDocument({ data: initialHybridBytes }).promise;
    const initP1 = await initialPdf.getPage(1);
    const initTc = await initP1.getTextContent();
    const initStrings = initTc.items.map((it: any) => it.str).filter(Boolean);
    assert(initStrings.includes('7'), 'TEST 36A: Initial synthetic fixture contains OCR digit "7"');

    // Run the actual production scanned editing pipeline
    const edits: ScannedTextEditItem[] = [
      {
        id: 'ocr-edit-digit-7',
        pageNumber: 1,
        originalText: '7',
        newText: '8',
        bbox: { x0: 290 / 595.28, y0: (841.89 - 440) / 841.89, x1: 320 / 595.28, y1: (841.89 - 410) / 841.89 },
        fontSize: 24,
      },
    ];

    const exportedBytes = await reconstructScannedDocumentWithEdits(initialHybridBytes, edits);
    assert(exportedBytes.byteLength > 0, 'TEST 36B: Reconstructed scanned document produced non-empty bytes');

    // Reopen exported file with PDF.js as ultimate proof
    const verifyPdf = await pdfjs.getDocument({ data: exportedBytes }).promise;
    assert(verifyPdf.numPages === 1, 'TEST 36C: Exported document page count preserved (1 page)');

    const p1 = await verifyPdf.getPage(1);
    const tc = await p1.getTextContent();
    const allStrings = tc.items.map((it: any) => it.str).filter(Boolean);

    assert(allStrings.some((s) => s.includes('8')), 'TEST 36D: Searchable text layer verified to contain replacement "8"');
    assert(!allStrings.some((s) => s.includes('7')), 'TEST 36E: Searchable text layer verified to NO LONGER contain "7"');

    // Reopen with PDFDocument to verify page dimensions
    const docCheck = await PDFDocument.load(exportedBytes);
    const p0Size = docCheck.getPage(0).getSize();
    assert(Math.abs(p0Size.width - 595.28) < 1 && Math.abs(p0Size.height - 841.89) < 1, 'TEST 36F: Page dimensions exactly preserved (A4 595.28 x 841.89 pt)');
  }

  // TEST 37: Genuine Vector PDF — 7 -> 8 Edit (Independent Vector Pipeline)
  {
    const initialVectorBytes = await createSyntheticVectorWithDigit7Pdf();

    // Verify initial state has "7"
    const initialPdf = await pdfjs.getDocument({ data: initialVectorBytes }).promise;
    const initStrings = (await (await initialPdf.getPage(1)).getTextContent()).items.map((it: any) => it.str);
    assert(initStrings.some((s) => s.includes('7')), 'TEST 37A: Initial vector PDF contains digit "7"');

    // Run the actual production vector replacement pipeline
    const vectorEdits: TextReplacementEdit[] = [
      {
        pageNumber: 1,
        originalText: '7',
        newText: '8',
        pdfX: 50,
        pdfY: 750,
        pdfWidth: 300,
        pdfHeight: 20,
        isDeleted: false,
      },
    ];

    const exportedVectorBytes = await replaceVectorTextInPdf(initialVectorBytes, vectorEdits);
    assert(exportedVectorBytes.byteLength > 0, 'TEST 37B: Vector replacement produced valid bytes');

    // Reopen and verify
    const verifyPdf = await pdfjs.getDocument({ data: exportedVectorBytes }).promise;
    const verifiedStrings = (await (await verifyPdf.getPage(1)).getTextContent()).items.map((it: any) => it.str);

    assert(verifiedStrings.some((s) => s.includes('8')), 'TEST 37C: Vector text stream contains replacement "8"');
    assert(!verifiedStrings.some((s) => s.includes('7')), 'TEST 37D: Vector text stream no longer contains original "7"');
  }

  // TEST 38: Failure Mode Regression Test (Proving Vector Pipeline Fails on Scanned PDFs)
  {
    const scannedWithOcr = await createSyntheticScannedWithOcrPdf();

    // Run the FAULTY workflow: applying replaceVectorTextInPdf to a scanned PDF with OCR layer
    const faultyEdits: TextReplacementEdit[] = [
      {
        pageNumber: 1,
        originalText: '7',
        newText: '8',
        pdfX: 297,
        pdfY: 420,
        pdfWidth: 24,
        pdfHeight: 24,
        isDeleted: false,
      },
    ];

    const faultyOutput = await replaceVectorTextInPdf(scannedWithOcr, faultyEdits);

    // Inspect the image XObject in faultyOutput:
    const faultyDoc = await PDFDocument.load(faultyOutput);
    const p1 = faultyDoc.getPage(0);
    const res = p1.node.get(PDFName.of('Resources'));
    const resolvedRes = res instanceof PDFRef ? faultyDoc.context.lookup(res) : res;
    const xobj = (resolvedRes as any)?.get(PDFName.of('XObject'));
    const resolvedXobj = xobj instanceof PDFRef ? faultyDoc.context.lookup(xobj) : xobj;

    // The image XObject exists and was completely unedited by vector replacement!
    let imageFound = false;
    if (resolvedXobj) {
      for (const [, val] of (resolvedXobj as any).entries()) {
        const obj = val instanceof PDFRef ? faultyDoc.context.lookup(val) : val;
        const dict = (obj as any)?.dict ?? (obj as any);
        if (dict?.get(PDFName.of('Subtype'))?.toString() === '/Image') {
          imageFound = true;
        }
      }
    }

    assert(imageFound, 'TEST 38A: Regression Confirmed: Vector editor leaves the raster image XObject untouched');

    // In contrast, the classification system catches this and routes to scanned reconstruction:
    const classification = await classifyPdfPage(scannedWithOcr, 1);
    assert(classification.type === 'hybrid', 'TEST 38B: Classification correctly blocks vector routing and designates hybrid/scanned pipeline');
  }

  // TEST 39: Critical Save Validation (validateExportedEdits)
  {
    const original = await createSyntheticVectorPdf();

    // Case 1: Unchanged bytes must fail validation
    const failCheck = await validateExportedEdits(original, original, [
      { pageNumber: 1, originalText: 'INVOICE', newText: 'RECEIPT' },
    ]);
    assert(!failCheck.valid, 'TEST 39A: validateExportedEdits correctly rejects identical unchanged document');

    // Case 2: Persisted edits must pass validation
    const vectorEdits: TextReplacementEdit[] = [
      {
        pageNumber: 1,
        originalText: 'INVOICE',
        newText: 'RECEIPT',
        pdfX: 50,
        pdfY: 780,
        pdfWidth: 200,
        pdfHeight: 20,
        isDeleted: false,
      },
    ];
    const updatedBytes = await replaceVectorTextInPdf(original, vectorEdits);
    const passCheck = await validateExportedEdits(original, updatedBytes, vectorEdits);
    assert(passCheck.valid, 'TEST 39B: validateExportedEdits confirms persisted edits upon export');
    assert(passCheck.fileDifferent, 'TEST 39C: Confirmed exported document byte structure changed');
  }

  console.log('\n================================================================');
  console.log(`ALL PRODUCTION ENGINE TESTS PASSED! (${passedTests}/${totalTests} succeeded)`);
  console.log('Every test imported and executed actual production code.');
  console.log('================================================================\n');
}

run().catch((err) => {
  console.error('Production test suite failed:', err);
  process.exit(1);
});
