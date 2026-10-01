# OmniPDF — Browser-based PDF Workspace

OmniPDF is a professional, high-performance, client-side web application for viewing, organizing, editing, converting, merging, splitting, and managing PDF files directly in your web browser.

**100% Private & In-Browser**: Zero files are uploaded to any external server. All PDF parsing, canvas rendering, page manipulation, and file compilation are executed entirely inside your browser's sandboxed memory using client-side JavaScript, WebAssembly, and HTML5 APIs.

---

## 🌟 Key Features

Every feature presented in OmniPDF is fully functional:

- **PDF Viewer (`/viewer`)**:
  - High-fidelity canvas rasterization with high-DPI (Retina) support
  - Interactive zoom controls (50% to 300%), Fit Width, and 100% Fit Page
  - Fullscreen viewing mode
  - In-viewer page orientation rotation
  - Page thumbnail sidebar with instant jump navigation

- **Page Organizer (`/organize`)**:
  - Drag-and-drop page reordering using `@dnd-kit`
  - Accessible mobile ordering controls (Move Left / Move Right buttons)
  - Per-page and batch clockwise rotation (90°, 180°, 270°)
  - Page duplication (clone any page in-place)
  - Page deletion with safety checks (preserves at least one page)
  - Multi-page selection with Shift-click and batch toolbar

- **Merge PDF (`/merge`)**:
  - Combine multiple PDF documents into a single unified file
  - Reorder documents before merging (Up/Down controls)
  - Live page count and file size aggregation
  - Instant client-side compilation and download

- **Split PDF (`/split`)**:
  - **Split by Ranges**: Define custom page ranges (e.g., Pages 1-3, 4-7, 8-10) with custom names
  - **Split Every Page**: Break an entire multi-page document into individual single-page PDFs
  - Bundled as a convenient, ready-to-download `.zip` archive via JSZip or direct `.pdf`

- **Extract Pages (`/extract`)**:
  - Visually click pages to extract or enter custom comma-separated ranges (`1, 3, 5-8`)
  - Generates a new standalone PDF containing only the selected pages

- **Built-in Sample Document Generator**:
  - One-click "Try Sample PDF" feature generates a real, 5-page colored report in memory for immediate testing without needing to find a local PDF file.

- **Theme & Appearance (`/settings`)**:
  - Dark Mode, Light Mode, and System Preference synchronization
  - Refined typography and high-contrast accessibility

- **Privacy & Activity History (`/recent`)**:
  - Ephemeral session activity tracker
  - Documents never persist in unencrypted long-term storage without user intention
  - One-click history clearance

---

## 🛠️ Technology Stack

- **Core Framework**: React 19, TypeScript
- **Bundler & Tooling**: Vite 8, PostCSS, Autoprefixer
- **Styling**: Tailwind CSS v3 with dark mode class strategy
- **PDF Manipulation Engine**: `pdf-lib` (pure client-side page extraction, creation, rotation, and merging)
- **PDF Rendering**: `pdfjs-dist` (canvas-based page rasterization and thumbnail generation)
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Archive Generation**: `jszip`
- **Icons**: `lucide-react`
- **Routing**: `react-router-dom`

---

## 🔒 Privacy Model & Security

1. **Zero Network File Transfer**: When you choose or drag a PDF into OmniPDF, the file is read using the browser `FileReader` / `File.prototype.arrayBuffer()` API. No HTTP `POST` requests or telemetry tracking calls are made.
2. **Memory Sandboxing**: PDF buffers are handled in memory. Created object URLs (`blob:`) are revoked automatically upon task completion to prevent memory leaks.
3. **No External Storage**: Your documents remain on your physical device.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 1. Installation
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Automated Test Suite
To verify the PDF manipulation engine (merging, splitting, rotating, extracting, reordering, deleting, and zip bundling):
```bash
npm test
```

### 4. Production Build
```bash
npm run build
```
This performs TypeScript type verification (`tsc -b`), guarantees the PDF.js web worker is in place, and builds optimized assets into `dist/`.

To preview the production build locally:
```bash
npm run preview
```

---

## 🌐 Deployment

OmniPDF is completely static and ready for modern deployment platforms (Vercel, Netlify, Cloudflare Pages, GitHub Pages):

### Vercel Deployment
The repository includes `vercel.json` with SPA routing rewrites:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Simply connect the repository to Vercel or run:
```bash
npx vercel
```
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
