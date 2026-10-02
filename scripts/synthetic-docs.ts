import { PDFDocument, rgb, StandardFonts, degrees, PDFName, PDFRef, PDFDict, PDFArray } from 'pdf-lib';
import zlib from 'zlib';

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

// 11. Rotated PDF (Pages with 90° and 180° orientation)
export async function createSyntheticRotatedPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const page1 = doc.addPage([595.28, 841.89]);
  page1.setRotation(degrees(90));
  page1.drawText('Rotated 90 Degrees Page', { x: 100, y: 500, size: 16, font });

  const page2 = doc.addPage([595.28, 841.89]);
  page2.setRotation(degrees(180));
  page2.drawText('Rotated 180 Degrees Page', { x: 100, y: 500, size: 16, font });

  return await doc.save();
}

// 12. PDF with Annotations (Links and Highlights)
export async function createSyntheticAnnotatedPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);

  page.drawText('Document with Interactive Link Annotation', { x: 50, y: 780, size: 14, font });

  // Add URI link annotation
  const linkAnnot = doc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [50, 750, 250, 775],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: 'https://example.com/test-redact-target',
    },
  });
  const linkAnnotRef = doc.context.register(linkAnnot);
  (page.node as any).set(PDFName.of('Annots'), doc.context.obj([linkAnnotRef]));

  return await doc.save();
}

// 13. Compressed Streams PDF (Flate object streams enabled)
export async function createSyntheticCompressedStreamsPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const page = doc.addPage([595.28, 841.89]);
  page.drawText('Compressed Object Stream Test Fixture', { x: 50, y: 780, size: 14, font });
  page.drawText('This file uses PDF 1.5 object streams.', { x: 50, y: 750, size: 12, font });

  return await doc.save({ useObjectStreams: true });
}

// 14. Multiple Content Streams PDF (Page with array of /Contents)
export async function createSyntheticMultiStreamPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);

  // Initial draw
  page.drawText('Primary Stream Content: Header', { x: 50, y: 780, size: 14, font });

  // Inject secondary content stream
  const secondStreamBytes = new TextEncoder().encode(
    'BT /F1 12 Tf 50 720 Td (Secondary Stream Content: Item Alpha) Tj ET\n'
  );
  const secondStreamRef = doc.context.register(doc.context.stream(secondStreamBytes));

  const existingContents = (page.node as any).Contents();
  const contentsArray = doc.context.obj([existingContents, secondStreamRef]);
  (page.node as any).set(PDFName.of('Contents'), contentsArray);

  return await doc.save();
}

// 15. Hexadecimal Encoded Text PDF (<48656c6c6f> Tj)
export async function createSyntheticHexTextPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);

  // Write raw stream containing hex strings
  const streamContent =
    'BT /Helvetica 14 Tf 50 750 Td <5345435245543132333435> Tj ET\n' +
    'BT /Helvetica 12 Tf 50 720 Td (PUBLIC_NEIGHBOR_DATA) Tj ET\n';
  const streamRef = doc.context.register(doc.context.stream(new TextEncoder().encode(streamContent)));
  (page.node as any).set(PDFName.of('Contents'), streamRef);

  return await doc.save();
}

// 16. TJ Kerning Array PDF ([ (SEC) -10 (RET) 20 (12345) ] TJ)
export async function createSyntheticTjArrayPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);

  const streamContent =
    'BT /Helvetica 14 Tf 50 750 Td [ (SEC) -10 (RET) 20 (12345) ] TJ ET\n' +
    'BT /Helvetica 12 Tf 50 710 Td (PUBLIC_SURVIVING_TEXT) Tj ET\n';
  const streamRef = doc.context.register(doc.context.stream(new TextEncoder().encode(streamContent)));
  (page.node as any).set(PDFName.of('Contents'), streamRef);

  return await doc.save();
}

// 17. Legitimate DRAFT and COPY in body text (MUST survive watermark cleaning!)
export async function createSyntheticLegitimateDraftCopyPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595.28, 841.89]);
  page.drawText('HISTORICAL MANUSCRIPT ARCHIVE', { x: 50, y: 780, size: 16, font: boldFont });
  page.drawText(
    'The author submitted the first DRAFT of the novel in early 1998.',
    { x: 50, y: 740, size: 12, font }
  );
  page.drawText(
    'Please retain a verified physical COPY of this receipt for tax reporting.',
    { x: 50, y: 710, size: 12, font }
  );

  return await doc.save();
}

// 18. Real Corrupted PDF: Damaged XRef and StartXRef Pointer
export async function createSyntheticCorruptedXrefPdf(): Promise<Uint8Array> {
  const validBytes = await createSyntheticVectorPdf();
  // Cut off 50 bytes (destroys %%EOF, startxref, and partial trailing object, causing standard parser to fail)
  return validBytes.slice(0, validBytes.length - 50);
}

// 19. Real Corrupted PDF: Truncated File (missing %%EOF and trailer)
export async function createSyntheticTruncatedPdf(): Promise<Uint8Array> {
  const validBytes = await createSyntheticVectorPdf();
  // Cut off the last 250 bytes
  return validBytes.slice(0, validBytes.length - 250);
}

// 20. Real Corrupted PDF: Fatal Unrecoverable Noise (Zero PDF markers)
export function createSyntheticFatalCorruptPdf(): Uint8Array {
  return new TextEncoder().encode('GARBAGE_DATA_CORRUPTED_NOT_A_VALID_PDF_STRUCTURE_ABC123');
}

/**
 * Generates an 8-bit grayscale PNG bitmap with a visible dark digit '7' on white background.
 * Perfectly calibrated with the OCR text layer coordinates.
 */
export function createPngWithDigit7(width = 595, height = 842): Uint8Array {
  const rowBytes = 1 + width;
  const buffer = Buffer.alloc(rowBytes * height, 255); // all white background

  // Draw crisp digit '7' at x: 285 to 315, y: 400 to 440
  // Top horizontal bar: y 400 to 406, x 288 to 312
  for (let y = 400; y <= 406; y++) {
    for (let x = 288; x <= 312; x++) {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        buffer[y * rowBytes + 1 + x] = 15; // dark ink
      }
    }
  }

  // Diagonal stem: from (310, 406) down to (290, 440)
  const steps = 34;
  for (let i = 0; i <= steps; i++) {
    const y = 406 + i;
    const cx = Math.round(310 - i * (20 / steps));
    for (let dx = -2; dx <= 2; dx++) {
      const x = cx + dx;
      if (y >= 0 && y < height && x >= 0 && x < width) {
        buffer[y * rowBytes + 1 + x] = 15; // dark ink
      }
    }
  }

  // Prepend 0 filter byte for each scanline
  for (let y = 0; y < height; y++) buffer[y * rowBytes] = 0;
  const compressed = zlib.deflateSync(buffer);

  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type: string, data: Buffer): Buffer {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const full = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(full), 0);
    return Buffer.concat([lenBuf, full, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 0; // Grayscale
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return new Uint8Array(
    Buffer.concat([
      sig,
      makeChunk('IHDR', ihdr),
      makeChunk('IDAT', compressed),
      makeChunk('IEND', Buffer.alloc(0)),
    ])
  );
}

// 21. Scanned PDF with embedded raster image containing visible digit '7' + OCR text layer '7'
export async function createSyntheticScannedWithOcrPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]); // A4

  // Embed raster image with visible digit 7
  const pngBytes = createPngWithDigit7(595, 842);
  const embeddedPng = await doc.embedPng(pngBytes);

  page.drawImage(embeddedPng, {
    x: 0,
    y: 0,
    width: 595.28,
    height: 841.89,
  });

  // OCR/Searchable text layer positioned directly over the visible digit 7
  // Bounding box matches visible glyph at x: 285 to 315, y: 400 to 440 (PDF y: 401.89 to 441.89)
  page.drawText('7', {
    x: 285,
    y: 405,
    size: 36,
    font,
    color: rgb(0, 0, 0),
    opacity: 0, // invisible OCR text layer
  });

  return await doc.save();
}

// 21B. Scanned PDF where raster image is encapsulated inside a nested Form XObject
export async function createSyntheticNestedFormScannedWithOcrPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]); // A4

  const pngBytes = createPngWithDigit7(595, 842);
  const embeddedPng = await doc.embedPng(pngBytes);

  // Create Form XObject stream that wraps the image
  const formDict = doc.context.obj({
    Type: 'XObject',
    Subtype: 'Form',
    BBox: [0, 0, 595.28, 841.89],
    Resources: {
      XObject: {
        Im0: embeddedPng.ref,
      },
    },
  });
  const formStream = doc.context.stream('q 595.28 0 0 841.89 0 0 cm /Im0 Do Q', formDict);
  const formRef = doc.context.register(formStream);

  // Register Form XObject on the page resources
  let pageRes = page.node.get(PDFName.of('Resources'));
  if (!pageRes) {
    pageRes = doc.context.obj({ XObject: {} });
    page.node.set(PDFName.of('Resources'), pageRes);
  }
  let pageXObj = (pageRes as any).get(PDFName.of('XObject'));
  if (!pageXObj) {
    pageXObj = doc.context.obj({});
    (pageRes as any).set(PDFName.of('XObject'), pageXObj);
  }
  pageXObj.set(PDFName.of('Fm0'), formRef);

  // Invoke Form XObject in page content stream
  page.drawText('7', {
    x: 285,
    y: 405,
    size: 36,
    font,
    opacity: 0,
  });

  const contents = page.node.get(PDFName.of('Contents'));
  const drawFormStream = doc.context.flateStream('q /Fm0 Do Q\n');
  const drawFormRef = doc.context.register(drawFormStream);
  if (contents instanceof PDFRef) {
    page.node.set(PDFName.of('Contents'), doc.context.obj([drawFormRef, contents]));
  }

  return await doc.save();
}

// 22. Pure Vector PDF with digit '7'
export async function createSyntheticVectorWithDigit7Pdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);
  page.drawText('Sample Vector Invoice Digit: 7', {
    x: 50,
    y: 750,
    size: 20,
    font,
    color: rgb(0, 0, 0),
  });
  return await doc.save();
}

