import * as pdfjsLib from 'pdfjs-dist';

// Configure the PDF.js worker with resilient base-aware URL and CDN fallback
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    } else {
      // For GitHub Pages or custom subpath hosting, use CDN worker matching exact version
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  }
}

export { pdfjsLib };
