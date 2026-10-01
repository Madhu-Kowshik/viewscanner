# OmniPDF — All-in-One Browser-Native PDF Workspace

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-18%2F18%20passing-brightgreen.svg)]()
[![Privacy](https://img.shields.io/badge/privacy-100%25%20client--side-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

**OmniPDF** is a production-quality, browser-based PDF workspace for viewing, organizing, editing, signing, scanning, recognizing (OCR), compressing, converting, and securing PDF files.

**100% In-Browser & Completely Private**: Zero files are sent to any remote server or cloud service. All PDF parsing, canvas rendering, pixel shaders, neural OCR recognition, and binary compilation are performed locally inside your browser memory using WebAssembly, modern HTML5 APIs, and pure JavaScript.

---

## 🚀 Live Application
- **Deployed Production URL**: [https://antigravity-mocha-kappa.vercel.app](https://antigravity-mocha-kappa.vercel.app)
- **GitHub Repository**: [https://github.com/Madhu-Kowshik/viewscanner](https://github.com/Madhu-Kowshik/viewscanner)

---

## 🌟 Comprehensive Feature Suite (50+ Real Working Tools)

### 1. Organize & Structure
- **Merge PDF**: Combine multiple PDFs in any custom order.
- **Split PDF**: Divide by custom ranges or split every page into individual files.
- **Extract Pages**: Select individual pages or input comma-separated ranges.
- **Drag-and-Drop Reordering**: Visual page reordering with `@dnd-kit` and accessible keyboard/mobile controls.
- **Rotate Pages**: 90°, 180°, and 270° clockwise and counter-clockwise rotation.
- **Duplicate Pages**: In-place cloning of forms, certificates, or pages.
- **Insert Blank Page**: Add blank A4 pages anywhere in the document.
- **Insert from Another PDF**: Append pages from a secondary PDF into the active document.
- **Reverse Page Order**: Flip document page sequence backwards in one click.
- **Remove Blank Pages**: Automatic canvas-based pixel analysis to detect and purge empty scanned pages.

### 2. Edit, Annotate & Redact
- **Canvas Overlay Editor**: Draw freehand with adjustable stroke widths and colors.
- **Text Boxes**: Add custom text overlays with font size, bold styling, and color pickers.
- **Text Highlighter**: Semi-transparent yellow/green/cyan highlights.
- **Whiteout**: Conceal content under opaque white overlays.
- **Permanent Redaction**: Burn blackouts directly into document pixels so text cannot be copied or inspected.
- **Shapes & Arrows**: Rectangles, circles, and directional review arrows.
- **Burn to PDF**: Merges all overlay modifications into a genuine, clean PDF binary.

### 3. Sign Documents
- **Interactive Signature Pad**: Draw smooth signatures using quadratic bezier curves.
- **Type Signature**: Beautiful calligraphic script styles.
- **Upload Signature**: Upload transparent PNG signatures or company seals.
- **Visual Stamping**: Drag, position, and stamp signatures with live previews.

### 4. Scan & Document Cleanup
- **Webcam / Device Camera Capture**: Snap pages directly using `navigator.mediaDevices.getUserMedia`.
- **Magic Clean Paper Bleach**: Dynamic thresholding removes paper yellowing and gray tints.
- **High-Contrast B&W**: Binarizes scanned documents for compact file sizes and sharp text.
- **Brightness & Contrast Sliders**: Fine-tune exposure and shadow gradients.
- **A4 / US Letter Standardization**: Normalizes multi-image scans to standard page dimensions.

### 5. Neural OCR & Text Recognition
- **Client-Side Tesseract OCR**: Recognize text from scanned documents and photos in the browser.
- **Multi-Language Support**: English, Spanish, French, German, Italian, and Chinese Simplified.
- **Instant Embedded Extractor**: Extracts vector font glyphs from digital PDFs in under 100ms.
- **In-Text Search & Copy**: Filter recognized text, copy to clipboard, or save as a `.txt` file.

### 6. Format Converters
- **PDF to JPG / PNG**: High-resolution canvas rasterization with DPI scaling (1x, 1.5x, 2x).
- **Images to PDF**: Compile multiple photos into a clean PDF with margins.
- **Text to PDF**: Generate paginated A4 PDFs from plain text or Markdown.
- **ZIP Bundler**: Download all converted images or split documents in a single compressed archive.

### 7. Intelligent PDF Compression
- **Presets**: Balanced (144 DPI, 72% quality), Smallest Size (96 DPI, 50% quality), and Lossless stream recompression.
- **Custom Sliders**: Fine-tune raster scale and JPEG compression levels.
- **Savings Calculator**: Shows live estimates and exact byte reduction percentages.

### 8. Watermark, Bates & Document Security
- **Text Watermarks**: Diagonal or centered stamps ("CONFIDENTIAL", "DRAFT") with opacity controls.
- **Image Stamps**: Add company logos or official seals.
- **Page Numbers**: "Page X of Y" formatting with customizable positions and margins.
- **Legal Bates Numbering**: Zero-padded identifier numbering (`DOC-000001`).
- **Privacy & Metadata Sanitizer**: Scrub author names, operating system identifiers, and timestamps.
- **Document Health Audit**: Diagnostic report evaluating compliance, blank pages, and searchability.
- **Side-by-Side Compare**: Visual diff of two PDF files with synchronized page navigation.
- **Multi-File Batch Processor**: Queue and process dozens of files simultaneously.
- **Universal Search / Omnibar (`Ctrl+K`)**: Natural language intent search ("make smaller", "sign", "ocr").
- **Workspace Undo / Redo**: Continuous document state tracking with full undo/redo stack.

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
- **Icons**: `lucide-react`
- **Routing**: `react-router-dom` (HashRouter for static host compatibility)

---

## 🔒 Privacy Model & Security

1. **Zero Server Uploads**: When you open or drag a PDF into OmniPDF, the file is read using the browser `FileReader` API. No network packets containing your document data are transmitted.
2. **Memory Sandboxing**: Document buffers are held in memory. Temporary `blob:` URLs are revoked immediately upon task completion to prevent memory leaks.
3. **No Account Required**: Immediate access with zero authentication walls, subscriptions, or file size limits.

---

## 💻 Local Development

### Prerequisites
- Node.js 18+ (tested on Node v20 & v24)
- npm 9+

### 1. Installation
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Test Suite
```bash
npm test
```
Verifies all 18 binary PDF manipulation engines (merging, splitting, rotating, extracting, reordering, deleting, blank page insertion, order reversal, watermarking, Bates stamping, metadata sanitization, and text generation).

### 4. Build for Production
```bash
npm run build
```
Creates an optimized production bundle in `dist/`.
