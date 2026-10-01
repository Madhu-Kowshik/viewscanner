import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  PdfFileInfo,
  PdfPageItem,
  ProcessingState,
  ProcessedResult,
  WatermarkConfig,
  PageNumberConfig,
  CompressConfig,
  AnnotationItem,
  PdfHealthReport,
} from '../types/pdf';
import {
  validatePdf,
  getDocumentPagesMetadata,
  renderPageThumbnail,
  organizePdf,
  mergePdfs,
  splitPdfEveryPage,
  splitPdfByRanges,
  createZipBundle,
  insertBlankPage as engineInsertBlank,
  insertPagesFromOtherPdf as engineInsertOther,
  replacePageInPdf as engineReplacePage,
  reversePageOrder as engineReverseOrder,
  detectBlankPages as engineDetectBlank,
  deletePages as engineDeletePages,
  addWatermarkToPdf as engineAddWatermark,
  addPageNumbersToPdf as engineAddPageNumbers,
  addHeaderFooterToPdf as engineAddHeaderFooter,
  compressPdfDocument as engineCompress,
  cleanPdfMetadata as engineCleanMetadata,
  applyAnnotationsToPdf as engineApplyAnnotations,
  embedSignatureOnPdf as engineEmbedSignature,
  convertImagesToPdf as engineConvertImages,
  convertPdfToImages as engineConvertPdfToImages,
  convertTextToPdf as engineConvertText,
  extractAllTextFromPdf as engineExtractText,
  analyzePdfHealth as engineAnalyzeHealth,
  unlockPasswordProtectedPdf,
  extractPageTextItems,
} from '../lib/pdf/pdf-engine';
import { createSamplePdf } from '../lib/pdf/sample-pdf';
import { addRecentFile } from '../lib/recent-files';
import { generateId, getBaseFileName, sanitizeFileName } from '../lib/utils';
import {
  saveSessionDocument,
  getSavedSessionDocument,
  clearSavedSessionDocument,
} from '../lib/storage/indexed-db';
import { PasswordModal } from '../components/modals/PasswordModal';

interface DocumentSnapshot {
  file: PdfFileInfo;
  pages: PdfPageItem[];
}

interface PdfContextType {
  currentFile: PdfFileInfo | null;
  pages: PdfPageItem[];
  selectedPageIds: Set<string>;
  mergeFiles: PdfFileInfo[];
  processing: ProcessingState;
  result: ProcessedResult | null;
  healthReport: PdfHealthReport | null;

  // Document Detection & Security
  documentType: 'editable' | 'scanned' | 'encrypted' | null;
  passwordModalOpen: boolean;
  pendingEncryptedFileName: string | null;
  passwordError: string | null;
  submitPdfPassword: (password: string) => Promise<boolean>;
  closePasswordModal: () => void;

  // Autosave / Session Recovery
  savedSession: { name: string; size: number; pageCount: number; timestamp: number } | null;
  resumeSavedSession: () => Promise<void>;
  dismissSavedSession: () => void;

  // Undo / Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // File loading
  loadFile: (file: File | { data: ArrayBuffer; name: string }) => Promise<boolean>;
  loadSampleDoc: () => Promise<void>;
  clearCurrentFile: () => void;
  updateActiveDocument: (newData: Uint8Array | ArrayBuffer, operationName: string) => Promise<void>;

  // Organizer Page manipulations
  reorderPages: (activeId: string, overId: string) => void;
  movePage: (index: number, direction: 'left' | 'right') => void;
  rotatePage: (id: string, degrees?: number) => void;
  rotateSelectedPages: (degrees?: number) => void;
  rotateAllPages: (degrees?: number) => void;
  deletePage: (id: string) => void;
  deleteSelectedPages: () => void;
  duplicatePage: (id: string) => void;
  toggleSelectPage: (id: string, event?: React.MouseEvent) => void;
  selectAllPages: () => void;
  clearPageSelection: () => void;
  selectPagesByIds: (ids: string[]) => void;

  // Extended Organizer Tools
  insertBlankPageAt: (atIndex: number) => Promise<void>;
  insertFromAnotherPdf: (otherFile: File, atIndex: number) => Promise<void>;
  replacePageWithPdf: (pageIndex: number, otherFile: File) => Promise<void>;
  reverseAllPages: () => Promise<void>;
  removeDetectedBlankPages: () => Promise<void>;

  // Extended Workspaces
  applyWatermark: (config: WatermarkConfig) => Promise<void>;
  applyPageNumbers: (config: PageNumberConfig) => Promise<void>;
  applyHeaderFooter: (header: string, footer: string) => Promise<void>;
  compressDocument: (config: CompressConfig) => Promise<void>;
  cleanMetadata: () => Promise<void>;
  applyAnnotations: (annotations: AnnotationItem[]) => Promise<void>;
  applySignature: (pageIndex: number, signatureDataUrl: string, x: number, y: number, w: number, h: number) => Promise<void>;
  convertImagesToPdfAction: (images: { dataUrl: string; name: string }[], options?: any) => Promise<void>;
  convertPdfToImagesAction: (format?: 'image/jpeg' | 'image/png') => Promise<void>;
  convertTextToPdfAction: (text: string, title?: string) => Promise<void>;
  extractAllTextAction: () => Promise<string>;
  runHealthCheck: () => Promise<PdfHealthReport | null>;

  // Merge manipulations
  addMergeFiles: (newFiles: File[]) => Promise<void>;
  removeMergeFile: (id: string) => void;
  reorderMergeFiles: (activeId: string, overId: string) => void;
  moveMergeFile: (index: number, direction: 'up' | 'down') => void;
  clearMergeFiles: () => void;

  // Export executors
  exportOrganizedPdf: () => Promise<void>;
  exportMergedPdf: () => Promise<void>;
  exportSplitEveryPage: () => Promise<void>;
  exportSplitRanges: (ranges: { start: number; end: number; name?: string }[]) => Promise<void>;
  exportExtractedPages: (pageItemIds?: string[]) => Promise<void>;

  // Result management
  clearResult: () => void;
  setProcessingError: (msg: string) => void;
}

const PdfContext = createContext<PdfContextType | undefined>(undefined);

export const PdfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentFile, setCurrentFile] = useState<PdfFileInfo | null>(null);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [mergeFiles, setMergeFiles] = useState<PdfFileInfo[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({ status: 'idle', message: '' });
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [healthReport, setHealthReport] = useState<PdfHealthReport | null>(null);

  const [undoStack, setUndoStack] = useState<DocumentSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<DocumentSnapshot[]>([]);

  // Document Detection & Security
  const [documentType, setDocumentType] = useState<'editable' | 'scanned' | 'encrypted' | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingEncryptedFile, setPendingEncryptedFile] = useState<{
    file: File | { data: ArrayBuffer; name: string };
    buffer: ArrayBuffer;
  } | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const closePasswordModal = useCallback(() => {
    setPasswordModalOpen(false);
    setPendingEncryptedFile(null);
    setPasswordError(null);
  }, []);

  // Autosaved session recovery state
  const [savedSession, setSavedSession] = useState<{
    name: string;
    size: number;
    pageCount: number;
    timestamp: number;
  } | null>(null);
  const savedSessionDataRef = useRef<ArrayBuffer | null>(null);

  // Check IndexedDB for previous autosaved session
  useEffect(() => {
    let active = true;
    getSavedSessionDocument().then((session) => {
      if (active && session && session.data && !currentFile) {
        savedSessionDataRef.current = session.data;
        setSavedSession({
          name: session.name,
          size: session.size,
          pageCount: session.pageCount,
          timestamp: session.timestamp,
        });
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const currentResultUrlRef = useRef<string | null>(null);

  const cleanupResultUrl = useCallback(() => {
    if (currentResultUrlRef.current) {
      URL.revokeObjectURL(currentResultUrlRef.current);
      currentResultUrlRef.current = null;
    }
  }, []);

  const clearResult = useCallback(() => {
    cleanupResultUrl();
    setResult(null);
  }, [cleanupResultUrl]);

  const setProcessingError = useCallback((message: string) => {
    setProcessing({ status: 'error', message });
  }, []);

  // Record current state before a mutation
  const recordSnapshot = useCallback(() => {
    if (currentFile) {
      setUndoStack((prev) => [
        ...prev.slice(-15), // keep last 15 actions
        { file: { ...currentFile }, pages: [...pages] },
      ]);
      setRedoStack([]); // reset redo on new user action
    }
  }, [currentFile, pages]);

  const undo = useCallback(() => {
    if (undoStack.length === 0 || !currentFile) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, { file: { ...currentFile }, pages: [...pages] }]);

    setCurrentFile(previous.file);
    setPages(previous.pages);
  }, [undoStack, currentFile, pages]);

  const redo = useCallback(() => {
    if (redoStack.length === 0 || !currentFile) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, { file: { ...currentFile }, pages: [...pages] }]);

    setCurrentFile(next.file);
    setPages(next.pages);
  }, [redoStack, currentFile, pages]);

  const loadFile = useCallback(
    async (fileInput: File | { data: ArrayBuffer; name: string }): Promise<boolean> => {
      clearResult();
      setProcessing({ status: 'reading', message: 'Reading and validating PDF...' });

      try {
        let buffer: ArrayBuffer;
        let fileName: string;
        let fileSize: number;

        if (fileInput instanceof File) {
          fileName = sanitizeFileName(fileInput.name);
          fileSize = fileInput.size;
          if (fileInput.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(fileInput.name)) {
            setProcessing({ status: 'reading', message: 'Ingesting image into PDF workspace...' });
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(fileInput);
            });
            const pdfBytes = await engineConvertImages([{ dataUrl, name: fileInput.name }]);
            buffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
            fileName = `${fileName.replace(/\.[^.]+$/, '')}.pdf`;
            fileSize = buffer.byteLength;
          } else if (fileInput.type === 'text/plain' || /\.txt$/i.test(fileInput.name)) {
            setProcessing({ status: 'reading', message: 'Converting text document to PDF...' });
            const text = await fileInput.text();
            const pdfBytes = await engineConvertText(text, fileName);
            buffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
            fileName = `${fileName.replace(/\.[^.]+$/, '')}.pdf`;
            fileSize = buffer.byteLength;
          } else {
            buffer = await fileInput.arrayBuffer();
          }
        } else {
          fileName = sanitizeFileName(fileInput.name);
          buffer = fileInput.data;
          fileSize = buffer.byteLength;
        }

        const validation = await validatePdf(buffer);
        if (!validation.valid) {
          if (validation.isEncrypted) {
            setPendingEncryptedFile({ file: fileInput, buffer });
            setPasswordError(null);
            setPasswordModalOpen(true);
            setProcessing({
              status: 'idle',
              message: 'Password-protected PDF — enter password to continue',
            });
            return false;
          }
          setProcessing({
            status: 'error',
            message: validation.error || "OmniPDF couldn't read this PDF file.",
          });
          return false;
        }

        const pageCount = validation.pageCount || 1;
        const fileInfo: PdfFileInfo = {
          id: generateId(),
          name: fileName,
          size: fileSize,
          pageCount,
          data: buffer,
          lastModified: Date.now(),
        };

        setCurrentFile(fileInfo);
        setUndoStack([]);
        setRedoStack([]);

        setProcessing({
          status: 'processing',
          message: 'Extracting page structure...',
          progress: 30,
        });

        const metaPages = await getDocumentPagesMetadata(buffer);
        const newPageItems: PdfPageItem[] = metaPages.map((meta, idx) => ({
          id: generateId(),
          originalIndex: idx,
          displayNumber: idx + 1,
          rotation: 0,
          originalRotation: meta.rotation,
          aspectRatio: meta.aspectRatio,
        }));

        setPages(newPageItems);
        setSelectedPageIds(new Set());

        addRecentFile({
          name: fileName,
          size: fileSize,
          pageCount,
          operation: 'Open PDF',
        });

        // Autosave active document session to IndexedDB
        setSavedSession(null);
        saveSessionDocument(fileName, fileSize, pageCount, buffer, 'Open PDF');

        setProcessing({ status: 'idle', message: '' });

        // Document Type Detection: Inspect vector text layer
        try {
          const sampleItems = await extractPageTextItems(buffer, 1);
          const hasText = sampleItems && sampleItems.length > 0;
          const detected: 'editable' | 'scanned' = hasText ? 'editable' : 'scanned';
          setDocumentType(detected);
          setProcessing({
            status: 'idle',
            message:
              detected === 'editable'
                ? 'Editable PDF detected'
                : 'Scanned PDF detected — OCR editing available',
          });
        } catch {
          setDocumentType('editable');
        }

        // Run health check in background
        setTimeout(async () => {
          try {
            const report = await engineAnalyzeHealth(buffer);
            setHealthReport(report);
          } catch {
            // ignore
          }
        }, 300);

        // Asynchronously render thumbnails
        setTimeout(async () => {
          for (let i = 0; i < newPageItems.length; i++) {
            try {
              const item = newPageItems[i];
              const thumbUrl = await renderPageThumbnail(buffer, item.originalIndex + 1, 240);
              setPages((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, thumbnailUrl: thumbUrl } : p))
              );
            } catch {
              // ignore
            }
          }
        }, 50);

        return true;
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to read PDF.',
        });
        return false;
      }
    },
    [clearResult]
  );

  const resumeSavedSession = useCallback(async () => {
    if (savedSession && savedSessionDataRef.current) {
      const data = savedSessionDataRef.current;
      const name = savedSession.name;
      setSavedSession(null);
      await loadFile({ data, name });
    }
  }, [savedSession, loadFile]);

  const dismissSavedSession = useCallback(() => {
    setSavedSession(null);
    savedSessionDataRef.current = null;
    clearSavedSessionDocument();
  }, []);

  const submitPdfPassword = useCallback(
    async (password: string): Promise<boolean> => {
      if (!pendingEncryptedFile) return false;
      try {
        const res = await unlockPasswordProtectedPdf(pendingEncryptedFile.buffer, password);
        if (res.success && res.unlockedData) {
          const unlockedBuf = res.unlockedData;
          const originalName =
            pendingEncryptedFile.file instanceof File
              ? pendingEncryptedFile.file.name
              : pendingEncryptedFile.file.name;
          setPasswordModalOpen(false);
          setPasswordError(null);
          setPendingEncryptedFile(null);
          await loadFile({ data: unlockedBuf, name: originalName });
          return true;
        } else {
          setPasswordError(res.error || 'Incorrect password.');
          return false;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Decryption failed';
        setPasswordError(msg);
        return false;
      }
    },
    [pendingEncryptedFile, loadFile]
  );

  const loadSampleDoc = useCallback(async () => {
    try {
      setProcessing({ status: 'reading', message: 'Generating sample PDF document...' });
      const sample = await createSamplePdf();
      await loadFile(sample);
    } catch (err: unknown) {
      setProcessing({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to generate sample PDF.',
      });
    }
  }, [loadFile]);

  const clearCurrentFile = useCallback(() => {
    setCurrentFile(null);
    setPages([]);
    setSelectedPageIds(new Set());
    setUndoStack([]);
    setRedoStack([]);
    setHealthReport(null);
    setDocumentType(null);
    clearResult();
    setProcessing({ status: 'idle', message: '' });
    clearSavedSessionDocument();
    setSavedSession(null);
    savedSessionDataRef.current = null;
  }, [clearResult]);

  // In-place document updater for continuous workspace workflow
  const updateActiveDocument = useCallback(
    async (newData: Uint8Array | ArrayBuffer, operationName: string) => {
      if (!currentFile) return;
      recordSnapshot();

      const rawBuffer = newData instanceof Uint8Array ? (newData.buffer as ArrayBuffer) : newData;
      const metaPages = await getDocumentPagesMetadata(rawBuffer);

      const updatedFile: PdfFileInfo = {
        ...currentFile,
        data: rawBuffer,
        size: rawBuffer.byteLength,
        pageCount: metaPages.length,
        lastModified: Date.now(),
      };

      const newPageItems: PdfPageItem[] = metaPages.map((meta, idx) => ({
        id: generateId(),
        originalIndex: idx,
        displayNumber: idx + 1,
        rotation: 0,
        originalRotation: meta.rotation,
        aspectRatio: meta.aspectRatio,
      }));

      setCurrentFile(updatedFile);
      setPages(newPageItems);
      setSelectedPageIds(new Set());

      addRecentFile({
        name: updatedFile.name,
        size: updatedFile.size,
        pageCount: updatedFile.pageCount,
        operation: operationName,
      });

      // Autosave in-place update into IndexedDB
      saveSessionDocument(
        updatedFile.name,
        updatedFile.size,
        updatedFile.pageCount,
        rawBuffer,
        operationName
      );

      // Rerender thumbnails in background
      setTimeout(async () => {
        for (let i = 0; i < newPageItems.length; i++) {
          try {
            const item = newPageItems[i];
            const thumbUrl = await renderPageThumbnail(rawBuffer, item.originalIndex + 1, 240);
            setPages((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, thumbnailUrl: thumbUrl } : p))
            );
          } catch {
            // ignore
          }
        }
      }, 50);
    },
    [currentFile, recordSnapshot]
  );

  // Organizer reordering
  const reorderPages = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;
    recordSnapshot();

    setPages((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === activeId);
      const newIndex = prev.findIndex((p) => p.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);

      return updated.map((p, idx) => ({ ...p, displayNumber: idx + 1 }));
    });
  }, [recordSnapshot]);

  const movePage = useCallback((index: number, direction: 'left' | 'right') => {
    recordSnapshot();
    setPages((prev) => {
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);

      return updated.map((p, idx) => ({ ...p, displayNumber: idx + 1 }));
    });
  }, [recordSnapshot]);

  const rotatePage = useCallback((id: string, deg = 90) => {
    recordSnapshot();
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + deg) % 360 } : p))
    );
  }, [recordSnapshot]);

  const rotateSelectedPages = useCallback(
    (deg = 90) => {
      if (selectedPageIds.size === 0) return;
      recordSnapshot();
      setPages((prev) =>
        prev.map((p) =>
          selectedPageIds.has(p.id) ? { ...p, rotation: (p.rotation + deg) % 360 } : p
        )
      );
    },
    [selectedPageIds, recordSnapshot]
  );

  const rotateAllPages = useCallback((deg = 90) => {
    recordSnapshot();
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + deg) % 360 })));
  }, [recordSnapshot]);

  const deletePage = useCallback((id: string) => {
    recordSnapshot();
    setPages((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, idx) => ({ ...p, displayNumber: idx + 1 }));
    });
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [recordSnapshot]);

  const deleteSelectedPages = useCallback(() => {
    if (selectedPageIds.size === 0) return;
    recordSnapshot();

    setPages((prev) => {
      const remaining = prev.filter((p) => !selectedPageIds.has(p.id));
      if (remaining.length === 0) return prev;
      return remaining.map((p, idx) => ({ ...p, displayNumber: idx + 1 }));
    });

    setSelectedPageIds(new Set());
  }, [selectedPageIds, recordSnapshot]);

  const duplicatePage = useCallback((id: string) => {
    recordSnapshot();
    setPages((prev) => {
      const index = prev.findIndex((p) => p.id === id);
      if (index === -1) return prev;

      const target = prev[index];
      const duplicate: PdfPageItem = {
        ...target,
        id: generateId(),
      };

      const updated = [...prev];
      updated.splice(index + 1, 0, duplicate);
      return updated.map((p, idx) => ({ ...p, displayNumber: idx + 1 }));
    });
  }, [recordSnapshot]);

  const toggleSelectPage = useCallback(
    (id: string, event?: React.MouseEvent) => {
      setSelectedPageIds((prev) => {
        const next = new Set(prev);
        if (event?.shiftKey && prev.size > 0) {
          const lastSelectedId = Array.from(prev)[prev.size - 1];
          const lastIdx = pages.findIndex((p) => p.id === lastSelectedId);
          const currentIdx = pages.findIndex((p) => p.id === id);
          if (lastIdx !== -1 && currentIdx !== -1) {
            const start = Math.min(lastIdx, currentIdx);
            const end = Math.max(lastIdx, currentIdx);
            for (let i = start; i <= end; i++) {
              next.add(pages[i].id);
            }
            return next;
          }
        }

        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [pages]
  );

  const selectAllPages = useCallback(() => {
    setSelectedPageIds(new Set(pages.map((p) => p.id)));
  }, [pages]);

  const clearPageSelection = useCallback(() => {
    setSelectedPageIds(new Set());
  }, []);

  const selectPagesByIds = useCallback((ids: string[]) => {
    setSelectedPageIds(new Set(ids));
  }, []);

  // NEW EXTENDED ORGANIZER ACTIONS
  const insertBlankPageAt = useCallback(
    async (atIndex: number) => {
      if (!currentFile) return;
      setProcessing({ status: 'processing', message: 'Inserting blank page...' });
      try {
        const updated = await engineInsertBlank(currentFile.data, atIndex);
        await updateActiveDocument(updated, 'Insert Blank Page');
        setProcessing({ status: 'success', message: 'Blank page inserted.' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to insert blank page.',
        });
      }
    },
    [currentFile, updateActiveDocument]
  );

  const insertFromAnotherPdf = useCallback(
    async (otherFile: File, atIndex: number) => {
      if (!currentFile) return;
      setProcessing({ status: 'processing', message: 'Inserting pages from document...' });
      try {
        const otherBytes = await otherFile.arrayBuffer();
        const updated = await engineInsertOther(currentFile.data, otherBytes, atIndex);
        await updateActiveDocument(updated, 'Insert Pages');
        setProcessing({ status: 'success', message: 'Pages inserted successfully.' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to insert pages.',
        });
      }
    },
    [currentFile, updateActiveDocument]
  );

  const replacePageWithPdf = useCallback(
    async (pageIndex: number, otherFile: File) => {
      if (!currentFile) return;
      setProcessing({ status: 'processing', message: 'Replacing page...' });
      try {
        const otherBytes = await otherFile.arrayBuffer();
        const updated = await engineReplacePage(currentFile.data, pageIndex, otherBytes, 0);
        await updateActiveDocument(updated, 'Replace Page');
        setProcessing({ status: 'success', message: 'Page replaced successfully.' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to replace page.',
        });
      }
    },
    [currentFile, updateActiveDocument]
  );

  const reverseAllPages = useCallback(async () => {
    if (!currentFile) return;
    setProcessing({ status: 'processing', message: 'Reversing page order...' });
    try {
      const updated = await engineReverseOrder(currentFile.data);
      await updateActiveDocument(updated, 'Reverse Page Order');
      setProcessing({ status: 'success', message: 'Page order reversed.' });
    } catch (err: unknown) {
      setProcessing({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to reverse page order.',
      });
    }
  }, [currentFile, updateActiveDocument]);

  const removeDetectedBlankPages = useCallback(async () => {
    if (!currentFile) return;
    setProcessing({ status: 'processing', message: 'Scanning for blank pages...' });
    try {
      const blankIndices = await engineDetectBlank(currentFile.data);
      if (blankIndices.length === 0) {
        setProcessing({ status: 'idle', message: 'No blank pages detected.' });
        return;
      }
      const updated = await engineDeletePages(currentFile.data, blankIndices);
      await updateActiveDocument(updated, 'Remove Blank Pages');
      setProcessing({ status: 'success', message: `Removed ${blankIndices.length} blank page(s).` });
    } catch (err: unknown) {
      setProcessing({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to remove blank pages.',
      });
    }
  }, [currentFile, updateActiveDocument]);

  // WATERMARK
  const applyWatermark = useCallback(
    async (config: WatermarkConfig) => {
      if (!currentFile) return;
      setProcessing({ status: 'processing', message: 'Applying watermark...' });
      try {
        const updated = await engineAddWatermark(currentFile.data, config);
        await updateActiveDocument(updated, 'Add Watermark');

        cleanupResultUrl();
        const blob = new Blob([updated as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        currentResultUrlRef.current = url;

        setResult({
          fileName: `${getBaseFileName(currentFile.name)}_watermarked.pdf`,
          data: updated,
          pageCount: pages.length,
          size: updated.byteLength,
          url,
          type: 'pdf',
        });
        setProcessing({ status: 'success', message: 'Watermark applied successfully!' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to apply watermark.',
        });
      }
    },
    [currentFile, pages.length, updateActiveDocument, cleanupResultUrl]
  );

  // PAGE NUMBERING
  const applyPageNumbers = useCallback(
    async (config: PageNumberConfig) => {
      if (!currentFile) return;
      setProcessing({ status: 'processing', message: 'Adding page numbers...' });
      try {
        const updated = await engineAddPageNumbers(currentFile.data, config);
        await updateActiveDocument(updated, 'Page Numbers');

        cleanupResultUrl();
        const blob = new Blob([updated as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        currentResultUrlRef.current = url;

        setResult({
          fileName: `${getBaseFileName(currentFile.name)}_numbered.pdf`,
          data: updated,
          pageCount: pages.length,
          size: updated.byteLength,
          url,
          type: 'pdf',
        });
        setProcessing({ status: 'success', message: 'Page numbers added!' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to add page numbers.',
        });
      }
    },
    [currentFile, pages.length, updateActiveDocument, cleanupResultUrl]
  );

  // HEADER & FOOTER
  const applyHeaderFooter = useCallback(
    async (header: string, footer: string) => {
      if (!currentFile) return;
      setProcessing({ status: 'processing', message: 'Applying header and footer...' });
      try {
        const updated = await engineAddHeaderFooter(currentFile.data, header, footer);
        await updateActiveDocument(updated, 'Header and Footer');

        cleanupResultUrl();
        const blob = new Blob([updated as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        currentResultUrlRef.current = url;

        setResult({
          fileName: `${getBaseFileName(currentFile.name)}_header_footer.pdf`,
          data: updated,
          pageCount: pages.length,
          size: updated.byteLength,
          url,
          type: 'pdf',
        });
        setProcessing({ status: 'success', message: 'Header and footer applied!' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to apply headers/footers.',
        });
      }
    },
    [currentFile, pages.length, updateActiveDocument, cleanupResultUrl]
  );

  // COMPRESS DOCUMENT
  const compressDocument = useCallback(
    async (config: CompressConfig) => {
      if (!currentFile) return;
      setProcessing({ status: 'processing', message: 'Compressing PDF document...', progress: 10 });
      try {
        const comp = await engineCompress(currentFile.data, config, (curr, tot) => {
          setProcessing({
            status: 'processing',
            message: `Optimizing page ${curr} of ${tot}...`,
            progress: Math.round((curr / tot) * 90),
          });
        });

        await updateActiveDocument(comp.data, 'Compress PDF');

        cleanupResultUrl();
        const blob = new Blob([comp.data as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        currentResultUrlRef.current = url;

        setResult({
          fileName: `${getBaseFileName(currentFile.name)}_compressed.pdf`,
          data: comp.data,
          pageCount: pages.length,
          size: comp.newSize,
          url,
          type: 'pdf',
        });
        setProcessing({
          status: 'success',
          message: `Compressed by ${comp.ratio}% (${(comp.originalSize / 1024).toFixed(0)} KB → ${(comp.newSize / 1024).toFixed(0)} KB)`,
        });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to compress document.',
        });
      }
    },
    [currentFile, pages.length, updateActiveDocument, cleanupResultUrl]
  );

  // CLEAN METADATA
  const cleanMetadata = useCallback(async () => {
    if (!currentFile) return;
    setProcessing({ status: 'processing', message: 'Stripping document metadata...' });
    try {
      const updated = await engineCleanMetadata(currentFile.data);
      await updateActiveDocument(updated, 'Clean Metadata');
      setProcessing({ status: 'success', message: 'All identifying metadata stripped.' });
    } catch (err: unknown) {
      setProcessing({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to clean metadata.',
      });
    }
  }, [currentFile, updateActiveDocument]);

  // ANNOTATIONS / EDITOR
  const applyAnnotations = useCallback(
    async (annotations: AnnotationItem[]) => {
      if (!currentFile || annotations.length === 0) return;
      setProcessing({ status: 'processing', message: 'Burning annotations into PDF...' });
      try {
        const updated = await engineApplyAnnotations(currentFile.data, annotations);
        await updateActiveDocument(updated, 'Edit Annotations');

        cleanupResultUrl();
        const blob = new Blob([updated as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        currentResultUrlRef.current = url;

        setResult({
          fileName: `${getBaseFileName(currentFile.name)}_edited.pdf`,
          data: updated,
          pageCount: pages.length,
          size: updated.byteLength,
          url,
          type: 'pdf',
        });
        setProcessing({ status: 'success', message: 'Annotations applied to PDF!' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to apply annotations.',
        });
      }
    },
    [currentFile, pages.length, updateActiveDocument, cleanupResultUrl]
  );

  // SIGNATURE
  const applySignature = useCallback(
    async (pageIndex: number, signatureDataUrl: string, x: number, y: number, w: number, h: number) => {
      if (!currentFile) return;
      setProcessing({ status: 'processing', message: 'Embedding signature...' });
      try {
        const updated = await engineEmbedSignature(currentFile.data, pageIndex, signatureDataUrl, x, y, w, h);
        await updateActiveDocument(updated, 'Add Signature');

        cleanupResultUrl();
        const blob = new Blob([updated as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        currentResultUrlRef.current = url;

        setResult({
          fileName: `${getBaseFileName(currentFile.name)}_signed.pdf`,
          data: updated,
          pageCount: pages.length,
          size: updated.byteLength,
          url,
          type: 'pdf',
        });
        setProcessing({ status: 'success', message: 'Signature embedded successfully!' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to embed signature.',
        });
      }
    },
    [currentFile, pages.length, updateActiveDocument, cleanupResultUrl]
  );

  // CONVERT IMAGES TO PDF
  const convertImagesToPdfAction = useCallback(
    async (images: { dataUrl: string; name: string }[], options?: any) => {
      if (images.length === 0) return;
      setProcessing({ status: 'processing', message: 'Compiling images into PDF...' });
      try {
        const pdfData = await engineConvertImages(images, options);
        cleanupResultUrl();
        const blob = new Blob([pdfData as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        currentResultUrlRef.current = url;

        setResult({
          fileName: 'images_document.pdf',
          data: pdfData,
          pageCount: images.length,
          size: pdfData.byteLength,
          url,
          type: 'pdf',
        });

        addRecentFile({
          name: 'images_document.pdf',
          size: pdfData.byteLength,
          pageCount: images.length,
          operation: 'Images to PDF',
        });

        setProcessing({ status: 'success', message: 'PDF created from images!' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to convert images to PDF.',
        });
      }
    },
    [cleanupResultUrl]
  );

  // CONVERT PDF TO IMAGES
  const convertPdfToImagesAction = useCallback(
    async (format: 'image/jpeg' | 'image/png' = 'image/jpeg') => {
      if (!currentFile) return;
      setProcessing({ status: 'processing', message: 'Rasterizing PDF pages to images...', progress: 10 });
      try {
        const imgResults = await engineConvertPdfToImages(currentFile.data, format, 0.9, (c, t) => {
          setProcessing({
            status: 'processing',
            message: `Rendering image ${c} of ${t}...`,
            progress: Math.round((c / t) * 85),
          });
        });

        const zipBlob = await createZipBundle(imgResults.map((r) => ({ name: r.name, data: r.blob })));
        cleanupResultUrl();
        const url = URL.createObjectURL(zipBlob);
        currentResultUrlRef.current = url;

        setResult({
          fileName: `${getBaseFileName(currentFile.name)}_images.zip`,
          data: new Uint8Array(),
          pageCount: imgResults.length,
          size: zipBlob.size,
          url,
          type: 'zip',
          multiFiles: imgResults.map((r) => ({
            name: r.name,
            size: r.blob.size,
            pageCount: 1,
            data: new Uint8Array(),
          })),
        });

        setProcessing({ status: 'success', message: 'Images generated and packaged into ZIP!' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to export images.',
        });
      }
    },
    [currentFile, cleanupResultUrl]
  );

  // CONVERT TEXT TO PDF
  const convertTextToPdfAction = useCallback(
    async (text: string, title?: string) => {
      setProcessing({ status: 'processing', message: 'Generating PDF from text...' });
      try {
        const pdfData = await engineConvertText(text, title);
        cleanupResultUrl();
        const blob = new Blob([pdfData as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        currentResultUrlRef.current = url;

        setResult({
          fileName: `${sanitizeFileName(title || 'text_document')}.pdf`,
          data: pdfData,
          pageCount: 1,
          size: pdfData.byteLength,
          url,
          type: 'pdf',
        });

        setProcessing({ status: 'success', message: 'PDF created from text!' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to generate PDF from text.',
        });
      }
    },
    [cleanupResultUrl]
  );

  // EXTRACT ALL TEXT
  const extractAllTextAction = useCallback(async (): Promise<string> => {
    if (!currentFile) return '';
    setProcessing({ status: 'processing', message: 'Extracting text content...' });
    try {
      const extracted = await engineExtractText(currentFile.data);
      const blob = new Blob([extracted.fullText], { type: 'text/plain' });
      cleanupResultUrl();
      const url = URL.createObjectURL(blob);
      currentResultUrlRef.current = url;

      setResult({
        fileName: `${getBaseFileName(currentFile.name)}_extracted_text.txt`,
        data: new Uint8Array(),
        pageCount: pages.length,
        size: blob.size,
        url,
        type: 'text',
        textPayload: extracted.fullText,
      });

      setProcessing({ status: 'success', message: 'Text extracted successfully!' });
      return extracted.fullText;
    } catch (err: unknown) {
      setProcessing({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to extract text.',
      });
      return '';
    }
  }, [currentFile, pages.length, cleanupResultUrl]);

  // HEALTH CHECK
  const runHealthCheck = useCallback(async (): Promise<PdfHealthReport | null> => {
    if (!currentFile) return null;
    try {
      const report = await engineAnalyzeHealth(currentFile.data);
      setHealthReport(report);
      return report;
    } catch {
      return null;
    }
  }, [currentFile]);

  // MERGE ACTIONS
  const addMergeFiles = useCallback(async (newFiles: File[]) => {
    setProcessing({ status: 'reading', message: 'Validating documents for merge...' });
    const validatedFiles: PdfFileInfo[] = [];

    for (const f of newFiles) {
      try {
        const buffer = await f.arrayBuffer();
        const check = await validatePdf(buffer);
        if (check.valid) {
          validatedFiles.push({
            id: generateId(),
            name: sanitizeFileName(f.name),
            size: f.size,
            pageCount: check.pageCount || 1,
            data: buffer,
            lastModified: f.lastModified,
          });
        }
      } catch {
        // Skip damaged files
      }
    }

    if (validatedFiles.length > 0) {
      setMergeFiles((prev) => [...prev, ...validatedFiles]);
    }

    setProcessing({ status: 'idle', message: '' });
  }, []);

  const removeMergeFile = useCallback((id: string) => {
    setMergeFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const reorderMergeFiles = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;
    setMergeFiles((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === activeId);
      const newIndex = prev.findIndex((f) => f.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);
      return updated;
    });
  }, []);

  const moveMergeFile = useCallback((index: number, direction: 'up' | 'down') => {
    setMergeFiles((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  }, []);

  const clearMergeFiles = useCallback(() => {
    setMergeFiles([]);
  }, []);

  // EXPORT ACTIONS
  const exportOrganizedPdf = useCallback(async () => {
    if (!currentFile || pages.length === 0) return;

    setProcessing({
      status: 'processing',
      message: 'Generating organized PDF...',
      progress: 30,
    });

    try {
      const pageConfigs = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
      }));

      const outputData = await organizePdf(currentFile.data, pageConfigs, (curr, tot) => {
        setProcessing({
          status: 'processing',
          message: `Processing page ${curr} of ${tot}...`,
          progress: Math.round((curr / tot) * 90),
        });
      });

      cleanupResultUrl();
      const blob = new Blob([outputData as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      currentResultUrlRef.current = url;

      const outputName = `${getBaseFileName(currentFile.name)}_organized.pdf`;

      setResult({
        fileName: outputName,
        data: outputData,
        pageCount: pages.length,
        size: outputData.byteLength,
        url,
        type: 'pdf',
      });

      addRecentFile({
        name: outputName,
        size: outputData.byteLength,
        pageCount: pages.length,
        operation: 'Organize PDF',
      });

      setProcessing({ status: 'success', message: 'PDF organized successfully!' });
    } catch (err: unknown) {
      setProcessing({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to generate organized PDF.',
      });
    }
  }, [currentFile, pages, cleanupResultUrl]);

  const exportMergedPdf = useCallback(async () => {
    if (mergeFiles.length < 2) {
      setProcessing({
        status: 'error',
        message: 'Please add at least 2 PDF documents to merge.',
      });
      return;
    }

    setProcessing({ status: 'processing', message: 'Merging documents...', progress: 20 });

    try {
      const outputData = await mergePdfs(mergeFiles, (curr, tot) => {
        setProcessing({
          status: 'processing',
          message: `Merging document ${curr} of ${tot}...`,
          progress: Math.round((curr / tot) * 90),
        });
      });

      cleanupResultUrl();
      const blob = new Blob([outputData as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      currentResultUrlRef.current = url;

      const totalPages = mergeFiles.reduce((acc, f) => acc + f.pageCount, 0);
      const outputName = 'merged_document.pdf';

      setResult({
        fileName: outputName,
        data: outputData,
        pageCount: totalPages,
        size: outputData.byteLength,
        url,
        type: 'pdf',
      });

      addRecentFile({
        name: outputName,
        size: outputData.byteLength,
        pageCount: totalPages,
        operation: 'Merge PDF',
      });

      setProcessing({ status: 'success', message: 'Documents merged successfully!' });
    } catch (err: unknown) {
      setProcessing({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to merge documents.',
      });
    }
  }, [mergeFiles, cleanupResultUrl]);

  const exportSplitEveryPage = useCallback(async () => {
    if (!currentFile) return;

    setProcessing({
      status: 'processing',
      message: 'Splitting document into individual pages...',
      progress: 20,
    });

    try {
      const splitResults = await splitPdfEveryPage(currentFile.data, currentFile.name, (curr, tot) => {
        setProcessing({
          status: 'processing',
          message: `Extracting page ${curr} of ${tot}...`,
          progress: Math.round((curr / tot) * 80),
        });
      });

      const zipBlob = await createZipBundle(splitResults);
      cleanupResultUrl();
      const url = URL.createObjectURL(zipBlob);
      currentResultUrlRef.current = url;

      const zipName = `${getBaseFileName(currentFile.name)}_split_pages.zip`;

      setResult({
        fileName: zipName,
        data: new Uint8Array(),
        pageCount: splitResults.length,
        size: zipBlob.size,
        url,
        type: 'zip',
        multiFiles: splitResults.map((r) => ({
          name: r.name,
          size: r.data.byteLength,
          pageCount: 1,
          data: r.data,
        })),
      });

      addRecentFile({
        name: zipName,
        size: zipBlob.size,
        pageCount: splitResults.length,
        operation: 'Split PDF (Every Page)',
      });

      setProcessing({ status: 'success', message: 'All pages split successfully!' });
    } catch (err: unknown) {
      setProcessing({
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to split document.',
      });
    }
  }, [currentFile, cleanupResultUrl]);

  const exportSplitRanges = useCallback(
    async (ranges: { start: number; end: number; name?: string }[]) => {
      if (!currentFile || ranges.length === 0) return;

      setProcessing({ status: 'processing', message: 'Splitting document by ranges...', progress: 30 });

      try {
        const splitResults = await splitPdfByRanges(currentFile.data, currentFile.name, ranges);

        if (splitResults.length === 1) {
          const single = splitResults[0];
          cleanupResultUrl();
          const blob = new Blob([single.data as unknown as BlobPart], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          currentResultUrlRef.current = url;

          setResult({
            fileName: single.name,
            data: single.data,
            pageCount: single.pageCount,
            size: single.data.byteLength,
            url,
            type: 'pdf',
          });
        } else {
          const zipBlob = await createZipBundle(splitResults);
          cleanupResultUrl();
          const url = URL.createObjectURL(zipBlob);
          currentResultUrlRef.current = url;

          const zipName = `${getBaseFileName(currentFile.name)}_ranges.zip`;

          setResult({
            fileName: zipName,
            data: new Uint8Array(),
            pageCount: splitResults.reduce((acc, r) => acc + r.pageCount, 0),
            size: zipBlob.size,
            url,
            type: 'zip',
            multiFiles: splitResults.map((r) => ({
              name: r.name,
              size: r.data.byteLength,
              pageCount: r.pageCount,
              data: r.data,
            })),
          });
        }

        addRecentFile({
          name: `${getBaseFileName(currentFile.name)}_split`,
          size: currentFile.size,
          pageCount: ranges.length,
          operation: 'Split PDF (Ranges)',
        });

        setProcessing({ status: 'success', message: 'Ranges split successfully!' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to split ranges.',
        });
      }
    },
    [currentFile, cleanupResultUrl]
  );

  const exportExtractedPages = useCallback(
    async (pageItemIds?: string[]) => {
      if (!currentFile) return;

      const targetIds = pageItemIds || Array.from(selectedPageIds);
      if (targetIds.length === 0) {
        setProcessing({
          status: 'error',
          message: 'Please select at least one page to extract.',
        });
        return;
      }

      setProcessing({ status: 'processing', message: 'Extracting selected pages...', progress: 40 });

      try {
        const idSet = new Set(targetIds);
        const selectedItems = pages.filter((p) => idSet.has(p.id));

        const pageConfigs = selectedItems.map((p) => ({
          originalIndex: p.originalIndex,
          rotation: p.rotation,
        }));

        const outputData = await organizePdf(currentFile.data, pageConfigs);

        cleanupResultUrl();
        const blob = new Blob([outputData as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        currentResultUrlRef.current = url;

        const outputName = `${getBaseFileName(currentFile.name)}_extracted.pdf`;

        setResult({
          fileName: outputName,
          data: outputData,
          pageCount: selectedItems.length,
          size: outputData.byteLength,
          url,
          type: 'pdf',
        });

        addRecentFile({
          name: outputName,
          size: outputData.byteLength,
          pageCount: selectedItems.length,
          operation: 'Extract Pages',
        });

        setProcessing({ status: 'success', message: 'Pages extracted successfully!' });
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to extract pages.',
        });
      }
    },
    [currentFile, pages, selectedPageIds, cleanupResultUrl]
  );

  return (
    <PdfContext.Provider
      value={{
        currentFile,
        pages,
        selectedPageIds,
        mergeFiles,
        processing,
        result,
        healthReport,
        savedSession,
        resumeSavedSession,
        dismissSavedSession,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        undo,
        redo,
        loadFile,
        loadSampleDoc,
        clearCurrentFile,
        updateActiveDocument,
        reorderPages,
        movePage,
        rotatePage,
        rotateSelectedPages,
        rotateAllPages,
        deletePage,
        deleteSelectedPages,
        duplicatePage,
        toggleSelectPage,
        selectAllPages,
        clearPageSelection,
        selectPagesByIds,
        insertBlankPageAt,
        insertFromAnotherPdf,
        replacePageWithPdf,
        reverseAllPages,
        removeDetectedBlankPages,
        applyWatermark,
        applyPageNumbers,
        applyHeaderFooter,
        compressDocument,
        cleanMetadata,
        applyAnnotations,
        applySignature,
        convertImagesToPdfAction,
        convertPdfToImagesAction,
        convertTextToPdfAction,
        extractAllTextAction,
        runHealthCheck,
        addMergeFiles,
        removeMergeFile,
        reorderMergeFiles,
        moveMergeFile,
        clearMergeFiles,
        exportOrganizedPdf,
        exportMergedPdf,
        exportSplitEveryPage,
        exportSplitRanges,
        exportExtractedPages,
        clearResult,
        setProcessingError,
        documentType,
        passwordModalOpen,
        pendingEncryptedFileName: pendingEncryptedFile
          ? pendingEncryptedFile.file instanceof File
            ? pendingEncryptedFile.file.name
            : pendingEncryptedFile.file.name
          : null,
        passwordError,
        submitPdfPassword,
        closePasswordModal,
      }}
    >
      {children}
      <PasswordModal
        isOpen={passwordModalOpen}
        onClose={closePasswordModal}
        fileName={
          pendingEncryptedFile
            ? pendingEncryptedFile.file instanceof File
              ? pendingEncryptedFile.file.name
              : pendingEncryptedFile.file.name
            : undefined
        }
        onSubmit={submitPdfPassword}
        error={passwordError}
      />
    </PdfContext.Provider>
  );
};

export const usePdf = () => {
  const context = useContext(PdfContext);
  if (!context) {
    throw new Error('usePdf must be used within a PdfProvider');
  }
  return context;
};
