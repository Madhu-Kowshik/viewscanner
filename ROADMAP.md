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

## Phase 2 — Enhanced Desktop & Offline Experience (In Progress 🚀)
- [ ] **Progressive Web App (PWA) Offline Mode**:
  - Service worker caching of application bundle, WebAssembly binaries, and OCR models for 100% offline flight/disconnected usage.
- [ ] **File System Access API Integration**:
  - Direct save-to-disk overwriting without triggering browser download bars (Chromium browsers).
- [ ] **WebAssembly OpenCV Pipeline**:
  - Automatic 4-corner document boundary detection and quadrilateral perspective warping for camera photos.

---

## Phase 3 — Enterprise Compliance & Cryptography (Future 🔮)
- [ ] **PDF/A Archival Compliance Validator**:
  - Conversion and verification for ISO 19005 archival standards (PDF/A-1b, PDF/A-2b).
- [ ] **Client-Side PKI Digital Signatures**:
  - WebCrypto-based X.509 digital certificate signing with visible cryptographic signature badges.
