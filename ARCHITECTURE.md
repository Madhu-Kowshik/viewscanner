# OmniPDF Architecture & Technical Design

OmniPDF is a high-performance, browser-native document workspace built to provide complete document manipulation, viewing, editing, scanning, OCR, repair, form filling, image processing, and conversion capabilities with zero server dependencies.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    User([User in Browser]) --> UI[OmniPDF React 19 UI]
    UI --> Context[PdfContext: Unified Document State & Undo/Redo Stack]
    Context --> Studio[UnifiedDocumentWorkspace: 3-Pane Unified Studio]
    Context --> DB[(IndexedDB Storage: Session Autosave & Recovery)]
    Context --> Engine[pdf-engine.ts: Pure Client-Side Binary Processing]
    Context --> ViewEngine[pdfjs-init.ts: Canvas Rasterizer & High-DPI Renderer]
    Context --> OcrEngine[Tesseract.js: Neural OCR Worker]
    
    Studio --> LeftPanel[Thumbnails Strip: Navigation & Reordering]
    Studio --> CenterCanvas[High-DPI Vector Canvas & Mode Overlays]
    Studio --> RightInspector[Contextual Tool Inspector & Properties]
    Studio --> TopToolbar[Search, Undo/Redo, Zoom, Export Center]
    Studio --> BottomStatus[Document Diagnostics & Privacy Badge]
    
    Engine --> PDFLib[pdf-lib: Binary AST, AcroForms & Stream Manipulation]
    Engine --> VectorTextMod[replaceVectorTextInPdf: Native Vector Text Editor]
    Engine --> CanvasProc[Offscreen Canvas: Bleaching, Contrast & Denoising]
    Engine --> RepairMod[Repair Engine: XRef Rebuilder & Stream Sanitizer]
    Engine --> WatermarkMod[removeWatermarkFromPdf: Ink Suppression & Eraser]
    Engine --> JSZip[JSZip: Multi-file Batch & Archive Bundler]
    
    PDFLib --> Export([Clean PDF Export / In-Place Update])
    OcrEngine --> ScannedEditor([Scanned Text Reconstruction Layer])
    OcrEngine --> ImageStudio([Image Studio: In-Image Text Replacement])
    OcrEngine --> ExportTxt([Extracted Text / Searchable Layer])
```

---

## 2. Core Architectural Principles

### 2.1 The "Continuous In-Place Workspace" Model
Traditional PDF web tools force users into a disconnected, multi-page funnel:
`Upload -> Process -> Force Download -> Re-upload -> Process`.

OmniPDF operates on a **Continuous Document Workspace**:
- Once a file is loaded or captured via the webcam scanner, its binary buffer resides in `PdfContext`.
- Any operation (e.g. rotating pages, editing vector text, burning redactions, adding Bates numbers, filling forms, repairing structures) performs an in-place update via `updateActiveDocument(newBytes, operationName)`.
- The document snapshot is automatically pushed to the **Undo/Redo Stack**, allowing the user to seamlessly undo or redo any operation up to 15 history states.
- Users can switch between Organize, Edit Text, Annotate, Sign, Watermark, Compress, Forms, and Health Audit inside the **Unified 3-Pane Studio** without ever re-uploading the file.

### 2.2 True Vector Text Editing vs. Rasterization Blur
Traditional web PDF editors convert pages to low-resolution JPEG images, draw a white box over text, and re-export as a blurred image-only PDF.
OmniPDF preserves **100% Vector Fidelity**:
- `extractPageTextItems` uses PDF.js to inspect the binary font dictionaries and character matrices, retrieving exact PDF points, normalized coordinates, and font families.
- `replaceVectorTextInPdf` uses `pdf-lib` to render an opaque background patch matching page color directly into the PDF content stream, followed by standard vector typography (Helvetica, Times, Courier, Bold).
- The underlying document remains a native vector PDF with selectable, searchable text and crystal-clear vector rendering.

### 2.3 IndexedDB Autosave & Instant Session Recovery
- Instead of using `localStorage` (which throws `QuotaExceededError` on PDFs larger than ~5MB), OmniPDF uses a dedicated **IndexedDB storage layer** (`src/lib/storage/indexed-db.ts`).
- Large binary `ArrayBuffer` instances are stored directly in an IndexedDB object store with timestamps.
- If a user accidentally refreshes their tab or closes the browser, OmniPDF detects the saved session on startup and presents a non-intrusive 1-click restore banner.

### 2.4 100% Client-Side In-Browser Privacy
- Zero backend API or proxy server is required.
- Files are parsed via standard `ArrayBuffer` and `Uint8Array` primitives.
- All operations execute in memory sandboxes; `URL.createObjectURL` references are systematically revoked after download.

---

## 3. Deep Dive into Specialized Engines

### 3.1 True Vector PDF Text Editor (`UnifiedDocumentWorkspace.tsx` Mode B)
- **Object-Level Selection**: Clicking any text string on the rendered page selects its bounding box.
- **In-Place Modification**: Modifies text content, font family, font size, and color without rasterizing the page.
- **Delete / Erase**: Erases vector text strings cleanly by drawing a vector coverage rectangle into the stream.
- **Repositioning & Move**: Supports updated target coordinates (`newX`, `newY`) in `TextReplacementEdit`.

### 3.2 Scanned PDF Text Editing & Reconstruction (`ScannedTextEditor.tsx`)
Editing text in a scanned PDF cannot be solved with standard PDF string replacement, because scanned PDFs are pure bitmap images. OmniPDF solves this using a **Hybrid Reconstruction Pipeline**:
1. **High-DPI Rasterization**: Renders the scanned page onto an offscreen canvas at high resolution.
2. **Neural Bounding Box Detection**: Runs Tesseract.js OCR with word and line coordinates (`bbox: { x0, y0, x1, y1 }`).
3. **Interactive Visual Overlay**: Renders click-to-edit boundaries over every word or sentence on the page.
4. **Tone-Matched Raster Patch**: When text is edited, an opaque background patch matching the surrounding page tone is drawn over the original bitmap bounding box.
5. **Precision Typography Overlay**: The replacement text is drawn in place matching font family, weight, size, and ink color.
6. **Binary Page Replacement**: The reconstructed canvas is compiled and replaces the target page in the active PDF binary in-place.

### 3.3 First-Class Image Studio & In-Image Text Editing (`ImageEditorWorkspace.tsx`)
- Provides a standalone photo & document image workspace for PNG, JPG, JPEG, WEBP, BMP, and TIFF.
- **CamScanner Bleach Filter**: High-pass convolution that lifts grey backgrounds to pure white paper while preserving dark ink.
- **Transformations**: 90° CW/CCW rotation, horizontal and vertical flipping, and interactive crop box.
- **In-Image Text Replacement**: Tesseract OCR detects text in photos (e.g. "Date: 2025"), allows click-to-edit, reconstructs the region with tone-matched background patches, and exports to PNG/JPG/WEBP or converts to PDF.

### 3.4 Watermark Ink Suppression Engine (`WatermarkWorkspace.tsx`)
- **Add Watermarks**: Embeds diagonal or center text stamps, corporate logo images, legal Bates numbering, and headers/footers.
- **Color-Selective Suppression**: Scans pixel luminance and chroma to isolate faint red, gray, blue, or yellow watermark ink and lifts them to pure white `#ffffff`, leaving black text unharmed.
- **Vector Region Eraser**: Draws target vector coverage patches across specified watermark bands.

### 3.5 Interactive Forms & AcroForms Engine (`FormWorkspace.tsx`)
- Detects existing interactive AcroForm fields (text fields, checkboxes, dropdowns, radio buttons) using `PDFDocument.getForm()`.
- Provides an interactive field filler with instant live document preview.
- **Form Flattening**: Permanently burns form entries into page appearance streams so they can no longer be edited or stripped by downstream readers.
- **Form Builder**: Allows users to dynamically inject new interactive text fields, checkboxes, or dropdown selectors onto any page with custom coordinates.

### 3.6 Fault-Tolerant PDF Repair Engine (`PdfRepairWorkspace.tsx`)
- Handles malformed, damaged, or corrupted PDFs that cause standard viewers to display blank pages or fail to open.
- **Cross-Reference Rebuilding**: Scans for valid object dictionaries and reconstructs missing or damaged `/XRef` tables.
- **Stream Reserialization**: Isolates broken or unreferenced object pointers, removes circular references, and re-encodes clean streams.
- **Diagnostic Audit Log**: Emits step-by-step diagnostic information detailing structural anomalies found and fixed.

### 3.7 Universal Format Ingestion Pipeline
- Drops and uploads of JPG, PNG, WEBP, BMP, and TXT files are automatically ingested and converted into the document workspace via `engineConvertImages` and `engineConvertText`.

---

## 4. State Management (`src/context/PdfContext.tsx`)

| State Property | Description |
| :--- | :--- |
| `currentFile` | Metadata and `ArrayBuffer` of the active working PDF document |
| `pages` | Array of `PdfPageItem` containing IDs, rotation offsets, aspect ratios, and thumbnails |
| `selectedPageIds` | Set of currently selected page IDs for batch operations |
| `savedSession` | Auto-saved session metadata retrieved from IndexedDB |
| `undoStack` / `redoStack` | Complete history snapshots of `PdfFileInfo` and `PdfPageItem[]` |
| `processing` | Status indicators (`idle`, `reading`, `processing`, `success`, `error`) and progress bar % |
| `healthReport` | Result of diagnostic analysis including blank pages and compliance checks |

---

## 5. Verification & Testing Strategy
- Unit & Binary verification via `scripts/test-engine.mjs` (20/20 test assertions):
  - Page deletion, rotation, reordering, duplication
  - Page extraction and multi-file merging
  - Single-page splitting and custom range splitting
  - ZIP archive generation
  - Blank page insertion and order reversal
  - Watermark and Bates stamping
  - Metadata sanitization and Text-to-PDF compilation
  - Native vector text replacement with vector structure preservation
  - Watermark suppression patch verification
- Type integrity verified via `tsc -b` and production bundling verified via `vite build`.
