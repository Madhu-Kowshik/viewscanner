# OmniPDF — All-in-One Browser-Native PDF Workspace

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-18%2F18%20passing-brightgreen.svg)]()
[![Privacy](https://img.shields.io/badge/privacy-100%25%20client--side-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

**OmniPDF** is a production-quality, browser-based PDF workspace for viewing, organizing, editing, signing, scanning, recognizing (OCR), compressing, converting, repairing, and securing PDF files.

**100% In-Browser & Completely Private**: Zero files are sent to any remote server or cloud service. All PDF parsing, canvas rendering, pixel shaders, neural OCR recognition, and binary compilation are performed locally inside your browser memory using WebAssembly, modern HTML5 APIs, and pure JavaScript.

---

## 🚀 Live Application
- **Deployed Production URL**: [https://antigravity-mocha-kappa.vercel.app](https://antigravity-mocha-kappa.vercel.app)
- **GitHub Repository**: [https://github.com/Madhu-Kowshik/viewscanner](https://github.com/Madhu-Kowshik/viewscanner)

---

## 🌟 Comprehensive Feature Suite (12 Categories, 90+ Capabilities)

### 1. Organize & Structure
- **Merge PDF**: Combine multiple PDFs in any custom sequence.
- **Split PDF**: Divide by custom ranges or split every page into individual files.
- **Extract Pages**: Select individual pages or input comma-separated ranges.
- **Drag-and-Drop Reordering**: Visual page reordering with `@dnd-kit` and accessible keyboard/mobile controls.
- **Rotate Pages**: 90°, 180°, and 270° clockwise and counter-clockwise rotation.
- **Duplicate Pages**: In-place cloning of forms, certificates, or pages.
- **Insert Blank Page**: Add blank A4 pages anywhere in the document.
- **Insert from Another PDF**: Append pages from a secondary PDF into the active document.
- **Replace Page with PDF**: Replace individual pages with another PDF document.
- **Reverse Page Order**: Flip document page sequence backwards in one click.
- **Remove Blank Pages**: Automatic canvas-based pixel analysis to detect and purge empty scanned pages.
- **Odd / Even / Range Page Selection**: Instantly select odd pages, even pages, or custom ranges (e.g. `1-3, 5`).

### 2. Edit, Annotate & Scanned Document Reconstruction
- **⭐ Edit Text Inside Scanned PDFs**: Deep neural OCR word & line detection with click-to-edit. Employs hybrid raster tone-matching whiteout patches over original pixels and re-renders replacement typography with matching coordinates.
- **Original vs Edited Preview Slider**: Instant comparison between raw scanned image and reconstructed edits.
- **Canvas Overlay Editor**: Draw freehand with adjustable stroke widths and colors.
- **Text Boxes**: Add custom text overlays with font size, bold styling, and color pickers.
- **Text Highlighter**: Semi-transparent yellow/green/cyan highlights.
- **Whiteout**: Conceal content under opaque white overlays.
- **Permanent Redaction**: Burn blackouts directly into document pixels so text cannot be copied or inspected.
- **Shapes & Arrows**: Rectangles, circles, and directional review arrows.
- **Burn to PDF**: Merges all overlay modifications into a genuine, clean PDF binary.

### 3. Interactive Forms & AcroForms Builder
- **AcroForm Detection**: Automatically detects interactive form fields (text inputs, checkboxes, dropdowns).
- **Fill Form Fields**: Interactive live form filler directly in browser.
- **Form Flattening**: Flatten fillable forms into permanent printable documents.
- **Form Builder**: Add new text fields, interactive checkboxes, and dropdowns to any existing PDF page.

### 4. Sign Documents
- **Interactive Signature Pad**: Draw smooth signatures using quadratic bezier curves.
- **Type Signature**: Beautiful calligraphic script styles.
- **Upload Signature**: Upload transparent PNG signatures or company seals.
- **Visual Stamping**: Drag, position, and stamp signatures with live previews.

### 5. Scan & Document Cleanup
- **Webcam / Device Camera Capture**: Snap pages directly using `navigator.mediaDevices.getUserMedia`.
- **Magic Clean Paper Bleach**: Dynamic thresholding removes paper yellowing and gray tints.
- **High-Contrast B&W**: Binarizes scanned documents for compact file sizes and sharp text.
- **Brightness & Contrast Sliders**: Fine-tune exposure and shadow gradients.
- **A4 / US Letter Standardization**: Normalizes multi-image scans to standard page dimensions.

### 6. Neural OCR & Text Recognition
- **Client-Side Tesseract OCR**: Recognize text from scanned documents and photos in the browser.
- **Multi-Language Support**: English, Spanish, French, German, Italian, and Chinese Simplified.
- **Instant Embedded Extractor**: Extracts vector font glyphs from digital PDFs in under 100ms.
- **In-Text Search & Copy**: Filter recognized text, copy to clipboard, or save as a `.txt` file.

### 7. Format Converters
- **PDF to JPG / PNG**: High-resolution canvas rasterization with DPI scaling (1x, 1.5x, 2x).
- **Images to PDF**: Compile multiple photos into a clean PDF with margins.
- **Text to PDF**: Generate paginated A4 PDFs from plain text or Markdown.
- **ZIP Bundler**: Download all converted images or split documents in a single compressed archive.

### 8. Intelligent PDF Compression
- **Presets**: Balanced (144 DPI, 72% quality), Smallest Size (96 DPI, 50% quality), and Lossless stream recompression.
- **Custom Sliders**: Fine-tune raster scale and JPEG compression levels.
- **Savings Calculator**: Shows live estimates and exact byte reduction percentages.

### 9. Security, Sanitization & PDF Repair
- **Metadata Sanitizer**: Scrub author names, operating system identifiers, and timestamps.
- **In-Place Metadata Editor**: View and modify Title, Author, Subject, Keywords, and Creator.
- **⭐ Fault-Tolerant PDF Repair**: Diagnostic repair engine that rebuilds broken cross-reference tables, repairs unreferenced object pointers, and re-serializes unreadable PDF streams.
- **Password Security Guide**: Client-side AES-256 security insights and protection overview.

### 10. Watermark & Bates Numbering
- **Text Watermarks**: Diagonal or centered stamps ("CONFIDENTIAL", "DRAFT") with opacity controls.
- **Image Stamps**: Add company logos or official seals.
- **Page Numbers**: "Page X of Y" formatting with customizable positions and margins.
- **Legal Bates Numbering**: Zero-padded identifier numbering (`DOC-000001`).

### 11. Diagnostics, Compare & Viewer
- **High-Fidelity PDF Viewer**: Native canvas rendering with zoom, navigation, and jump-to-page.
- **In-Viewer Text Search**: Find Next/Previous, match counter (`X of Y matches`), and automatic scrolling.
- **Document Health Audit**: Diagnostic report evaluating compliance, blank pages, and searchability.
- **Side-by-Side Compare**: Visual diff of two PDF files with synchronized page navigation.
- **Multi-File Batch Processor**: Queue and process dozens of files simultaneously.

### 12. Guided Workflows & Continuous Session
- **⭐ Multi-Step Guided Workflows**: Chain operations together:
  - *Scan & Clean & OCR & Edit*
  - *Sign & Secure Contract*
  - *Audit & Optimize & Archive*
- **⭐ IndexedDB Continuous Autosave**: Automatic background preservation of large binary array buffers without local storage quota limitations.
- **Accidental Refresh Recovery**: 1-click restore banner to resume previous work seamlessly.
- **Universal Omnibar (`Ctrl+K`)**: Fast intent-based command palette for all tools.
- **Workspace Undo / Redo**: Continuous document state tracking with full 15-step undo/redo stack.

---

## 🛠️ Technology Stack

- **Framework**: React 19, TypeScript
- **Tooling**: Vite 8, PostCSS, Autoprefixer
- **Styling**: Tailwind CSS v3 with Dark / Light mode support
- **PDF Manipulation Engine**: `pdf-lib` (pure client-side binary manipulation)
- **PDF Rendering & Rasterization**: `pdfjs-dist` (canvas-based page rendering)
- **Neural OCR**: `tesseract.js` (WebAssembly & Web Worker neural engine)
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Archive Generation**: `jszip`
- **Session Persistence**: IndexedDB client storage
- **Icons**: `lucide-react`
- **Routing**: `react-router-dom` (HashRouter for static host compatibility)

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/Madhu-Kowshik/viewscanner.git
cd viewscanner

# Install dependencies
npm install

# Start local development server
npm run dev

# Run automated PDF engine test suite
npm test

# Build for production
npm run build
```

---

## 📄 License

MIT © OmniPDF Team. Built for fast, private, client-side document productivity.
