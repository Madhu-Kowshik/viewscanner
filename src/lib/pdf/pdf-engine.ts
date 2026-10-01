import { PDFDocument, degrees } from 'pdf-lib';
import { pdfjsLib } from './pdfjs-init';
import JSZip from 'jszip';
import { sanitizeFileName, getBaseFileName } from '../utils';

export interface PdfValidationResult {
  valid: boolean;
  error?: string;
  pageCount?: number;
  fileSize?: number;
}

export interface PageMetadata {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  aspectRatio: number;
}

/**
 * Validates whether an ArrayBuffer or File is a valid, readable, unencrypted PDF.
 */
export async function validatePdf(data: ArrayBuffer): Promise<PdfValidationResult> {
  if (!data || data.byteLength === 0) {
    return {
      valid: false,
      error: 'The selected file is empty (0 bytes).',
    };
  }

  // Quick check of PDF magic bytes (%PDF-)
  const headerBytes = new Uint8Array(data.slice(0, 5));
  const headerStr = String.fromCharCode(...headerBytes);
  if (!headerStr.startsWith('%PDF-')) {
    return {
      valid: false,
      error: "This file does not appear to be a valid PDF document. Please select a genuine .pdf file.",
    };
  }

  try {
    const doc = await PDFDocument.load(data, { 
      ignoreEncryption: false,
      updateMetadata: false 
    });
    const pageCount = doc.getPageCount();

    if (pageCount === 0) {
      return {
        valid: false,
        error: 'This PDF document is empty and contains 0 pages.',
      };
    }

    return {
      valid: true,
      pageCount,
      fileSize: data.byteLength,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes('encrypt') || message.toLowerCase().includes('password')) {
      return {
        valid: false,
        error: 'This PDF is password-protected. OmniPDF currently only processes unlocked documents for your security.',
      };
    }
    return {
      valid: false,
      error: "OmniPDF couldn't read this PDF. The file may be damaged or corrupted.",
    };
  }
}

/**
 * Extracts basic metadata and dimensions for all pages.
 */
export async function getDocumentPagesMetadata(data: ArrayBuffer): Promise<PageMetadata[]> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const count = doc.getPageCount();
  const pages: PageMetadata[] = [];

  for (let i = 0; i < count; i++) {
    const page = doc.getPage(i);
    const { width, height } = page.getSize();
    const rot = page.getRotation().angle;
    // Account for 90 or 270 degree rotation in aspect ratio
    const effectiveWidth = (rot === 90 || rot === 270) ? height : width;
    const effectiveHeight = (rot === 90 || rot === 270) ? width : height;
    const aspectRatio = effectiveWidth / effectiveHeight;

    pages.push({
      pageNumber: i + 1,
      width,
      height,
      rotation: rot,
      aspectRatio,
    });
  }

  return pages;
}

/**
 * High-speed, cached thumbnail renderer using pdfjs-dist and HTML Canvas.
 */
export async function renderPageThumbnail(
  data: ArrayBuffer,
  pageNumber: number,
  targetWidth = 240
): Promise<string> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data.slice(0)),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);

  const initialViewport = page.getViewport({ scale: 1.0 });
  const scale = targetWidth / initialViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Canvas context could not be created');
  }

  // White background
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

  // Cleanup
  page.cleanup();
  await pdf.destroy();
  canvas.width = 0;
  canvas.height = 0;

  return dataUrl;
}

/**
 * Render a page directly onto an existing HTML Canvas with given zoom scale and extra rotation.
 */
export async function renderPageToCanvas(
  data: ArrayBuffer,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 1.0,
  extraRotation = 0
): Promise<{ width: number; height: number }> {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data.slice(0)),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber);

  // Apply extra rotation if needed
  const totalRotation = (page.rotate + extraRotation) % 360;
  const viewport = page.getViewport({ scale, rotation: totalRotation });

  // Handle high-DPI screens
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Canvas 2D context unavailable');
  }

  context.save();
  context.scale(dpr, dpr);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, viewport.width, viewport.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  context.restore();

  page.cleanup();
  await pdf.destroy();

  return { width: viewport.width, height: viewport.height };
}

/**
 * Merges multiple PDFs into one unified document.
 */
export async function mergePdfs(
  files: { data: ArrayBuffer | Uint8Array; name?: string }[],
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length);
    const subDoc = await PDFDocument.load(file.data, { ignoreEncryption: true });
    const copiedPages = await mergedDoc.copyPages(subDoc, subDoc.getPageIndices());
    copiedPages.forEach((page) => mergedDoc.addPage(page));
  }

  return await mergedDoc.save();
}

/**
 * Organizes a PDF according to an array of page configurations.
 * Handles custom re-ordering, rotations, and duplicates.
 */
export async function organizePdf(
  srcData: ArrayBuffer | Uint8Array,
  pages: { originalIndex: number; rotation: number }[],
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(srcData, { ignoreEncryption: true });
  const targetDoc = await PDFDocument.create();

  const total = pages.length;
  for (let i = 0; i < total; i++) {
    const item = pages[i];
    onProgress?.(i + 1, total);
    const [copiedPage] = await targetDoc.copyPages(srcDoc, [item.originalIndex]);

    if (item.rotation !== 0) {
      const currentAngle = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentAngle + item.rotation) % 360));
    }

    targetDoc.addPage(copiedPage);
  }

  return await targetDoc.save();
}

/**
 * Extracts specific pages into a new PDF.
 * @param pageIndices 0-based array of indices to extract.
 */
export async function extractPages(
  srcData: ArrayBuffer | Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  if (pageIndices.length === 0) {
    throw new Error('At least one page must be selected for extraction.');
  }

  const srcDoc = await PDFDocument.load(srcData, { ignoreEncryption: true });
  const targetDoc = await PDFDocument.create();

  const copiedPages = await targetDoc.copyPages(srcDoc, pageIndices);
  copiedPages.forEach((page) => targetDoc.addPage(page));

  return await targetDoc.save();
}

/**
 * Splits a PDF by page ranges (e.g., 1-3, 4-7).
 */
export async function splitPdfByRanges(
  srcData: ArrayBuffer | Uint8Array,
  baseFileName: string,
  ranges: { start: number; end: number; name?: string }[]
): Promise<{ name: string; data: Uint8Array; pageCount: number }[]> {
  const srcDoc = await PDFDocument.load(srcData, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const cleanBase = sanitizeFileName(getBaseFileName(baseFileName));
  const results: { name: string; data: Uint8Array; pageCount: number }[] = [];

  for (let i = 0; i < ranges.length; i++) {
    const { start, end, name } = ranges[i];
    // Clamp to valid 1-based bounds
    const validStart = Math.max(1, Math.min(start, totalPages));
    const validEnd = Math.max(validStart, Math.min(end, totalPages));

    const indices: number[] = [];
    for (let p = validStart - 1; p <= validEnd - 1; p++) {
      indices.push(p);
    }

    if (indices.length === 0) continue;

    const partDoc = await PDFDocument.create();
    const copiedPages = await partDoc.copyPages(srcDoc, indices);
    copiedPages.forEach((page) => partDoc.addPage(page));

    const data = await partDoc.save();
    const rangeName = name 
      ? sanitizeFileName(name) 
      : `${cleanBase}_pages_${validStart}-${validEnd}.pdf`;

    results.push({
      name: rangeName.endsWith('.pdf') ? rangeName : `${rangeName}.pdf`,
      data,
      pageCount: indices.length,
    });
  }

  return results;
}

/**
 * Splits a PDF into individual 1-page documents.
 */
export async function splitPdfEveryPage(
  srcData: ArrayBuffer | Uint8Array,
  baseFileName: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ name: string; data: Uint8Array; pageCount: number }[]> {
  const srcDoc = await PDFDocument.load(srcData, { ignoreEncryption: true });
  const total = srcDoc.getPageCount();
  const cleanBase = sanitizeFileName(getBaseFileName(baseFileName));
  const results: { name: string; data: Uint8Array; pageCount: number }[] = [];

  for (let i = 0; i < total; i++) {
    onProgress?.(i + 1, total);
    const singleDoc = await PDFDocument.create();
    const [page] = await singleDoc.copyPages(srcDoc, [i]);
    singleDoc.addPage(page);

    const data = await singleDoc.save();
    const paddedIndex = String(i + 1).padStart(String(total).length > 2 ? 3 : 2, '0');
    results.push({
      name: `${cleanBase}_page_${paddedIndex}.pdf`,
      data,
      pageCount: 1,
    });
  }

  return results;
}

/**
 * Rotates all or specified pages by additionalDegrees (90, 180, 270).
 */
export async function rotatePages(
  srcData: ArrayBuffer | Uint8Array,
  rotations: Record<number, number> // pageIndex (0-based) -> additional degrees
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(srcData, { ignoreEncryption: true });
  const total = srcDoc.getPageCount();

  for (let i = 0; i < total; i++) {
    const rot = rotations[i];
    if (rot) {
      const page = srcDoc.getPage(i);
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + rot) % 360));
    }
  }

  return await srcDoc.save();
}

/**
 * Deletes specified pages from the PDF document.
 */
export async function deletePages(
  srcData: ArrayBuffer | Uint8Array,
  indicesToDelete: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(srcData, { ignoreEncryption: true });
  const total = srcDoc.getPageCount();
  const deleteSet = new Set(indicesToDelete);

  const remainingIndices: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!deleteSet.has(i)) {
      remainingIndices.push(i);
    }
  }

  if (remainingIndices.length === 0) {
    throw new Error('Cannot delete all pages. The resulting PDF must contain at least one page.');
  }

  const targetDoc = await PDFDocument.create();
  const copiedPages = await targetDoc.copyPages(srcDoc, remainingIndices);
  copiedPages.forEach((page) => targetDoc.addPage(page));

  return await targetDoc.save();
}

/**
 * Bundles multiple files into a single downloadable .zip file.
 */
export async function createZipBundle(
  files: { name: string; data: Uint8Array }[]
): Promise<Blob> {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.name, file.data);
  });

  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/**
 * Triggers a native browser file download for a Blob or Uint8Array.
 */
export function downloadBlob(
  data: Uint8Array | Blob,
  filename: string,
  mimeType = 'application/pdf'
): void {
  const blob = data instanceof Blob ? data : new Blob([data as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = sanitizeFileName(filename);

  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}
