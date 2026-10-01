export interface PdfPageItem {
  id: string; // unique ID for dnd-kit & state tracking
  originalIndex: number; // 0-based index in the source PDF
  displayNumber: number; // current sequential 1-based page number in the organized list
  rotation: number; // 0, 90, 180, 270 (additional rotation degrees)
  originalRotation?: number; // base rotation from source PDF
  aspectRatio: number; // width / height
  thumbnailUrl?: string;
  sourceDocIndex?: number;
  sourceDocName?: string;
  isBlank?: boolean;
}

export interface PdfFileInfo {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  data: ArrayBuffer;
  lastModified?: number;
}

export type ToolCategory =
  | 'organize'
  | 'edit'
  | 'scan'
  | 'ocr'
  | 'convert'
  | 'compress'
  | 'protect'
  | 'sign'
  | 'analyze';

export type PdfToolType = 
  | 'viewer'
  | 'organize'
  | 'editor'
  | 'merge'
  | 'split'
  | 'extract'
  | 'rotate'
  | 'delete'
  | 'duplicate'
  | 'insert-blank'
  | 'scanner'
  | 'ocr'
  | 'convert'
  | 'compress'
  | 'watermark'
  | 'page-numbers'
  | 'protect'
  | 'sign'
  | 'diagnostics'
  | 'compare'
  | 'batch';

export interface ProcessingState {
  status: 'idle' | 'reading' | 'processing' | 'success' | 'error';
  message: string;
  progress?: number; // 0 - 100
}

export interface ProcessedResult {
  fileName: string;
  data: Uint8Array;
  pageCount: number;
  size: number;
  url: string;
  type: 'pdf' | 'zip' | 'text' | 'image';
  multiFiles?: { name: string; size: number; pageCount: number; data: Uint8Array }[];
  textPayload?: string;
}

export interface SplitRange {
  id: string;
  start: number; // 1-indexed
  end: number;   // 1-indexed
  name?: string;
}

export interface RecentFileMeta {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  timestamp: number;
  operation: string;
}

// Annotation / Edit Overlay Items
export type AnnotationType = 
  | 'text'
  | 'draw'
  | 'highlight'
  | 'whiteout'
  | 'redaction'
  | 'shape-rect'
  | 'shape-circle'
  | 'shape-arrow'
  | 'image'
  | 'sticky-note';

export interface AnnotationItem {
  id: string;
  pageNumber: number; // 1-based
  type: AnnotationType;
  x: number; // normalized (0 - 1) or point coordinates
  y: number;
  width: number;
  height: number;
  color?: string;
  opacity?: number;
  text?: string;
  fontSize?: number;
  strokeWidth?: number;
  imageDataUrl?: string;
  points?: { x: number; y: number }[]; // for freehand draw
}

// Watermark Options
export interface WatermarkConfig {
  type: 'text' | 'image';
  text?: string;
  imageDataUrl?: string;
  fontSize?: number;
  color?: string;
  opacity: number; // 0.1 - 1.0
  rotation: number; // -90 to 90 degrees
  position: 'center' | 'top' | 'bottom' | 'diagonal';
  pageRange: 'all' | 'custom';
  customPages?: number[];
}

// Page Numbering Config
export interface PageNumberConfig {
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center' | 'top-left';
  format: 'number-only' | 'page-x-of-y' | 'bates';
  startNumber: number;
  batesPrefix?: string;
  batesDigits?: number;
  fontSize: number;
  color: string;
  margin: number;
  pageRange: 'all' | 'custom';
  customPages?: number[];
}

// Compression Config
export interface CompressConfig {
  preset: 'high' | 'balanced' | 'small' | 'custom';
  quality: number; // 0.3 - 0.95
  scale: number; // 0.5 - 1.0
  removeMetadata: boolean;
  flattenAnnotations: boolean;
}

// PDF Health / Quality Check
export interface HealthStatusItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'good' | 'warning' | 'problem';
  recommendedTool?: PdfToolType;
  recommendedLabel?: string;
}

export interface PdfHealthReport {
  fileSize: number;
  pageCount: number;
  pdfVersion: string;
  isEncrypted: boolean;
  hasMetadata: boolean;
  metadata: {
    title?: string;
    author?: string;
    producer?: string;
    creationDate?: string;
  };
  dimensions: { width: number; height: number; isStandardA4: boolean };
  blankPageIndices: number[];
  estimatedTextChars: number;
  isLikelyScanned: boolean;
  overallHealth: 'good' | 'warning' | 'problem';
  checks: HealthStatusItem[];
}

// Batch Queue Item
export interface BatchItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  resultData?: Uint8Array;
  resultName?: string;
}
