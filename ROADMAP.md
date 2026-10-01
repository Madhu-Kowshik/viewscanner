# OmniPDF Product Roadmap

OmniPDF is continuously advancing to push the boundaries of browser-native document processing. Below is the strategic development roadmap.

---

## Phase 1 — Comprehensive PDF Suite (Completed ✅)
- [x] Client-side binary manipulation engine (`pdf-lib`, `pdfjs-dist`).
- [x] Drag-and-drop page organizer with keyboard and mobile controls.
- [x] Full PDF viewer with in-viewer text search, zoom, and thumbnail navigation.
- [x] Merge, Split, Extract, Rotate, Delete, and In-place page replication.
- [x] Extended organizer: Insert Blank Page, Insert from PDF, Replace Page with PDF, Reverse Order, Remove Blank Pages, Odd/Even/Range selection.
- [x] PDF Editor & Canvas Overlay Annotator (Text, Shapes, Freehand draw, Highlighter, Whiteout, Permanent Redactions).
- [x] Interactive Signature Pad (Draw, Type, Upload, Placement).
- [x] Document Scanner with camera support and Magic Clean paper bleaching.
- [x] Neural OCR Engine powered by client-side Tesseract.js.
- [x] Format Converters (PDF to Images, Images to PDF, Text to PDF, Extract ZIP).
- [x] Intelligent Compression with balanced, extreme, and lossless presets.
- [x] Watermarking, Page Numbers, Bates Numbering, Headers and Footers.
- [x] Privacy & Metadata Sanitizer with in-place metadata editor.
- [x] Real-time Document Health & Diagnostic Audit.
- [x] Side-by-Side PDF Compare tool.
- [x] Multi-file batch processor with ZIP archive bundler.
- [x] Global Universal Search / Command Palette (`Ctrl+K`).
- [x] Workspace-wide Undo / Redo history stack.
- [x] **⭐ Scanned PDF Text Editing**: Neural OCR bounding box detection, click-to-edit scanned words, and tone-matched raster background patch reconstruction.
- [x] **⭐ Interactive AcroForms & Form Builder**: Live AcroForm filler, form flattening, and dynamic form field injection.
- [x] **⭐ Fault-Tolerant PDF Repair**: Cross-reference table reconstruction, dangling pointer isolation, and stream recovery.
- [x] **⭐ Multi-Step Guided Workflows**: Chained pipelines for Scan & OCR & Edit, Sign & Secure, and Audit & Archive.
- [x] **⭐ IndexedDB Continuous Autosave**: Automatic background preservation of large binary array buffers without local storage quota limitations, with 1-click restore.

---

## Phase 2 — Second-Generation Document Studio & Vector Editing (Completed ✅)
- [x] **⭐ Unified 3-Pane Document Studio Workspace**:
  - Left thumbnail panel, center high-DPI canvas viewport, right contextual tool inspector, top tool switcher, and bottom status bar.
  - Continuous workflow: Upload once -> View -> Edit Text -> Annotate -> Sign -> Watermark -> Compress -> Export in the same session without re-uploading.
- [x] **⭐ True Vector PDF Text Editing**:
  - In-place text replacement in native PDF vector streams without rasterization blur.
  - Interactive click-to-edit, typography control (Helvetica, Times, Courier, Bold), font size, color, delete, move, and reposition.
- [x] **⭐ First-Class Image Studio & In-Image Text Editing**:
  - Full-featured studio for PNG, JPG, JPEG, WEBP, BMP, and TIFF images.
  - CamScanner paper bleaching, high-contrast B&W, brightness/contrast, rotation, flipping, interactive crop.
  - Neural OCR detects text in images, allowing click-to-edit with tone-matched background patches.
- [x] **⭐ Color-Selective Watermark Removal**:
  - Selective stamp suppression lifting faint color/gray watermarks to clean white while preserving dark text.
- [x] **⭐ Universal File Ingestion**:
  - Drag and drop any PDF, JPG, PNG, WEBP, BMP, or TXT file into any dropzone with automatic conversion into the workspace.
- [x] **⭐ Smart Document Intelligence**:
  - Automatic detection of scanned bitmap documents vs. native vector text documents with contextual tool suggestions.
- [x] **⭐ Pre-Export Inspection Center**:
  - Pre-download modal validating document health, page counts, output format, compression, and size estimates.

---

## Phase 3 — Enterprise Compliance & Native Features (Upcoming 🚀)
- [ ] **Progressive Web App (PWA) Offline Mode**:
  - Service worker caching of application bundle, WebAssembly binaries, and OCR models for 100% offline usage.
- [ ] **File System Access API Integration**:
  - Direct save-to-disk overwriting without triggering browser download bars (Chromium browsers).
- [ ] **WebAssembly OpenCV Document Detection**:
  - Automatic 4-corner document boundary detection and quadrilateral perspective warping for camera photos.
- [ ] **PDF/A Archival Compliance Validator**:
  - Conversion and verification for ISO 19005 archival standards (PDF/A-1b, PDF/A-2b).
