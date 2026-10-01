import * as pdfjsLib from 'pdfjs-dist';

// Configure the PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  // Direct worker reference from public folder (supported across all dev and production hosts)
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

export { pdfjsLib };
