export interface PdfPageItem {
  id: string; // unique ID for dnd-kit & state tracking
  originalIndex: number; // 0-based index in the source PDF
  displayNumber: number; // current sequential 1-based page number in the organized list
  rotation: number; // 0, 90, 180, 270 (additional rotation degrees)
  originalRotation?: number; // base rotation from source PDF
  aspectRatio: number; // width / height
  thumbnailUrl?: string;
  sourceDocIndex?: number; // For multi-document merge or organization
  sourceDocName?: string;
}

export interface PdfFileInfo {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  data: ArrayBuffer;
  lastModified?: number;
}

export type PdfToolType = 
  | 'viewer'
  | 'organize'
  | 'merge'
  | 'split'
  | 'extract'
  | 'rotate'
  | 'delete'
  | 'duplicate';

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
  type: 'pdf' | 'zip';
  multiFiles?: { name: string; size: number; pageCount: number; data: Uint8Array }[];
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
