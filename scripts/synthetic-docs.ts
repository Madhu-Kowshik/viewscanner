import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

/**
 * OmniPDF Synthetic Test Document Generator
 * Generates 10 specialized synthetic PDF test fixtures with ZERO sensitive personal data.
 * All names, account numbers, and identifiers are completely fictional.
 */

// 1. Pure Vector PDF with selectable text & standard layout
export async function createSyntheticVectorPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]); // A4
  page.drawText('ACME CORPORATION — INVOICE #INV-2026-9901', {
    x: 50,
    y: 780,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  page.drawText('Customer: Jane Doe (Fictional Entity)', { x: 50, y: 740, size: 12, font });
  page.drawText('Account Number: ACCT-9988-1122-3344', { x: 50, y: 720, size: 12, font });
  page.drawText('Product Description: Cloud Compute Tier 1', { x: 50, y: 700, size: 12, font });
  page.drawText('Total Amount Due: $1,250.00 USD', { x: 50, y: 680, size: 12, font: boldFont, color: rgb(0.1, 0.5, 0.2) });

  return await doc.save();
}

// 2. Scanned-style PDF with embedded raster page image
export async function createSyntheticScannedPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);

  // Create simple 1x1 or 4x4 pixel PNG data to represent raster background
  // 1x1 white pixel PNG base64
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
  const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0));
  const embeddedPng = await doc.embedPng(pngBytes);

  page.drawImage(embeddedPng, {
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
  });

  return await doc.save();
}

// 3. Mixed PDF (Vector text on page 1, raster image on page 2)
export async function createSyntheticMixedPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // Page 1: Vector text
  const page1 = doc.addPage([595.28, 841.89]);
  page1.drawText('Page 1: Digital Vector Layer Document', { x: 50, y: 780, size: 14, font });

  // Page 2: Raster scan simulation
  const page2 = doc.addPage([595.28, 841.89]);
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
  const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0));
  const embeddedPng = await doc.embedPng(pngBytes);
  page2.drawImage(embeddedPng, { x: 0, y: 0, width: 595.28, height: 841.89 });

  return await doc.save();
}

// 4. Watermarked PDF (Contains both vector artifact watermark and visual diagonal text)
export async function createSyntheticWatermarkedPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.addPage([595.28, 841.89]);
  page.drawText('CONFIDENTIAL FINANCIAL STATEMENT', { x: 50, y: 780, size: 16, font });
  page.drawText('Fictional Audit Report 2026', { x: 50, y: 750, size: 12, font: regularFont });

  // Watermark text in light gray diagonal
  page.drawText('CONFIDENTIAL', {
    x: 100,
    y: 400,
    size: 60,
    font,
    color: rgb(0.8, 0.8, 0.8),
    rotate: degrees(45),
  });

  return await doc.save();
}

// 5. Redaction Test PDF containing sensitive token "SECRET12345"
export async function createSyntheticRedactionPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.addPage([595.28, 841.89]);
  page.drawText('Public Heading: Case Overview', { x: 50, y: 780, size: 14, font });
  page.drawText('Sensitive Identifier: SECRET12345', { x: 50, y: 740, size: 12, font });
  page.drawText('Public Conclusion: Investigation Pending', { x: 50, y: 700, size: 12, font });

  return await doc.save();
}

// 6. Interactive AcroForm PDF with Text Field, Checkbox, and Dropdown
export async function createSyntheticFormPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText('APPLICATION FORM', { x: 50, y: 780, size: 16, font });

  const form = doc.getForm();
  const nameField = form.createTextField('applicant_name');
  nameField.setText('Alex Smith');
  nameField.addToPage(page, { x: 50, y: 720, width: 200, height: 25 });

  const agreeCheck = form.createCheckBox('agree_terms');
  agreeCheck.check();
  agreeCheck.addToPage(page, { x: 50, y: 670, width: 20, height: 20 });

  return await doc.save();
}

// 7. Multi-Page Document (5 Pages)
export async function createSyntheticMultiPagePdf(count = 5): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= count; i++) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawText(`Document Page ${i} of ${count}`, { x: 50, y: 780, size: 16, font });
    page.drawText(`Synthetic Content for Section ${i}.0`, { x: 50, y: 740, size: 12, font });
  }

  return await doc.save();
}

// 8. Colored Background PDF (Light Blue background #add8e6)
export async function createSyntheticColoredBgPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.addPage([595.28, 841.89]);
  // Light blue rectangle over entire page
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
    color: rgb(173 / 255, 216 / 255, 230 / 255),
  });

  page.drawText('Document on Light Blue Background', {
    x: 50,
    y: 780,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  });

  return await doc.save();
}

// 9. Table PDF with horizontal and vertical rules
export async function createSyntheticTablePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]);
  page.drawText('MONTHLY EXPENSE SUMMARY TABLE', { x: 50, y: 780, size: 14, font: boldFont });

  // Draw header row
  page.drawRectangle({ x: 50, y: 730, width: 450, height: 25, color: rgb(0.9, 0.9, 0.9) });
  page.drawText('Category', { x: 60, y: 737, size: 10, font: boldFont });
  page.drawText('Q1 Allocation', { x: 200, y: 737, size: 10, font: boldFont });
  page.drawText('Q2 Allocation', { x: 350, y: 737, size: 10, font: boldFont });

  // Draw row 1
  page.drawText('Infrastructure', { x: 60, y: 705, size: 10, font });
  page.drawText('$12,500.00', { x: 200, y: 705, size: 10, font });
  page.drawText('$14,200.00', { x: 350, y: 705, size: 10, font });

  return await doc.save();
}

// 10. Image-heavy PDF
export async function createSyntheticImageHeavyPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);

  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
  const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0));
  const embeddedPng = await doc.embedPng(pngBytes);

  // Draw 4 images on page
  page.drawImage(embeddedPng, { x: 50, y: 500, width: 200, height: 200 });
  page.drawImage(embeddedPng, { x: 300, y: 500, width: 200, height: 200 });
  page.drawImage(embeddedPng, { x: 50, y: 250, width: 200, height: 200 });
  page.drawImage(embeddedPng, { x: 300, y: 250, width: 200, height: 200 });

  return await doc.save();
}
