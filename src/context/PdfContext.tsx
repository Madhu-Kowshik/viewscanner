import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  PdfFileInfo,
  PdfPageItem,
  ProcessingState,
  ProcessedResult,
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
} from '../lib/pdf/pdf-engine';
import { createSamplePdf } from '../lib/pdf/sample-pdf';
import { addRecentFile } from '../lib/recent-files';
import { generateId, getBaseFileName, sanitizeFileName } from '../lib/utils';

interface PdfContextType {
  currentFile: PdfFileInfo | null;
  pages: PdfPageItem[];
  selectedPageIds: Set<string>;
  mergeFiles: PdfFileInfo[];
  processing: ProcessingState;
  result: ProcessedResult | null;

  // File loading
  loadFile: (file: File | { data: ArrayBuffer; name: string }) => Promise<boolean>;
  loadSampleDoc: () => Promise<void>;
  clearCurrentFile: () => void;

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

  // Merge manipulations
  addMergeFiles: (newFiles: File[]) => Promise<void>;
  removeMergeFile: (id: string) => void;
  reorderMergeFiles: (activeId: string, overId: string) => void;
  moveMergeFile: (index: number, direction: 'up' | 'down') => void;
  clearMergeFiles: () => void;

  // Operation executors
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
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    message: '',
  });
  const [result, setResult] = useState<ProcessedResult | null>(null);

  // Keep a reference to the active result URL for cleanup
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
    setProcessing({
      status: 'error',
      message,
    });
  }, []);

  const loadFile = useCallback(
    async (fileInput: File | { data: ArrayBuffer; name: string }): Promise<boolean> => {
      clearResult();
      setProcessing({
        status: 'reading',
        message: 'Reading and validating PDF...',
      });

      try {
        let buffer: ArrayBuffer;
        let fileName: string;
        let fileSize: number;

        if (fileInput instanceof File) {
          fileName = sanitizeFileName(fileInput.name);
          fileSize = fileInput.size;
          buffer = await fileInput.arrayBuffer();
        } else {
          fileName = sanitizeFileName(fileInput.name);
          buffer = fileInput.data;
          fileSize = buffer.byteLength;
        }

        const validation = await validatePdf(buffer);
        if (!validation.valid) {
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

        // Extract metadata for pages
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

        setProcessing({ status: 'idle', message: '' });

        // Asynchronously render thumbnails in background without blocking UI
        setTimeout(async () => {
          for (let i = 0; i < newPageItems.length; i++) {
            try {
              const item = newPageItems[i];
              const thumbUrl = await renderPageThumbnail(buffer, item.originalIndex + 1, 240);
              setPages((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, thumbnailUrl: thumbUrl } : p))
              );
            } catch {
              // thumbnail rendering fallback handles broken page previews
            }
          }
        }, 50);

        return true;
      } catch (err: unknown) {
        setProcessing({
          status: 'error',
          message:
            err instanceof Error
              ? err.message
              : "An unexpected error occurred while reading the PDF.",
        });
        return false;
      }
    },
    [clearResult]
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
    clearResult();
    setProcessing({ status: 'idle', message: '' });
  }, [clearResult]);

  // Page reordering (DndKit)
  const reorderPages = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;

    setPages((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === activeId);
      const newIndex = prev.findIndex((p) => p.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, moved);

      return updated.map((p, idx) => ({ ...p, displayNumber: idx + 1 }));
    });
  }, []);

  const movePage = useCallback((index: number, direction: 'left' | 'right') => {
    setPages((prev) => {
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(index, 1);
      updated.splice(targetIndex, 0, moved);

      return updated.map((p, idx) => ({ ...p, displayNumber: idx + 1 }));
    });
  }, []);

  const rotatePage = useCallback((id: string, deg = 90) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + deg) % 360 } : p))
    );
  }, []);

  const rotateSelectedPages = useCallback(
    (deg = 90) => {
      if (selectedPageIds.size === 0) return;
      setPages((prev) =>
        prev.map((p) =>
          selectedPageIds.has(p.id) ? { ...p, rotation: (p.rotation + deg) % 360 } : p
        )
      );
    },
    [selectedPageIds]
  );

  const rotateAllPages = useCallback((deg = 90) => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + deg) % 360 })));
  }, []);

  const deletePage = useCallback((id: string) => {
    setPages((prev) => {
      if (prev.length <= 1) return prev; // Keep at least 1 page
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, idx) => ({ ...p, displayNumber: idx + 1 }));
    });
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const deleteSelectedPages = useCallback(() => {
    if (selectedPageIds.size === 0) return;

    setPages((prev) => {
      const remaining = prev.filter((p) => !selectedPageIds.has(p.id));
      if (remaining.length === 0) {
        // Can't delete all
        return prev;
      }
      return remaining.map((p, idx) => ({ ...p, displayNumber: idx + 1 }));
    });

    setSelectedPageIds(new Set());
  }, [selectedPageIds]);

  const duplicatePage = useCallback((id: string) => {
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
  }, []);

  const toggleSelectPage = useCallback(
    (id: string, event?: React.MouseEvent) => {
      setSelectedPageIds((prev) => {
        const next = new Set(prev);
        if (event?.shiftKey && prev.size > 0) {
          // Range selection
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

        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
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

  // Merge documents management
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

  // EXPORT / EXECUTION ACTIONS

  // 1. Export Organized PDF
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

  // 2. Export Merged PDF
  const exportMergedPdf = useCallback(async () => {
    if (mergeFiles.length < 2) {
      setProcessing({
        status: 'error',
        message: 'Please add at least 2 PDF documents to merge.',
      });
      return;
    }

    setProcessing({
      status: 'processing',
      message: 'Merging documents...',
      progress: 20,
    });

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

  // 3. Export Split Every Page
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

      setProcessing({
        status: 'processing',
        message: 'Creating zip archive...',
        progress: 85,
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

  // 4. Export Split Ranges
  const exportSplitRanges = useCallback(
    async (ranges: { start: number; end: number; name?: string }[]) => {
      if (!currentFile || ranges.length === 0) return;

      setProcessing({
        status: 'processing',
        message: 'Splitting document by ranges...',
        progress: 30,
      });

      try {
        const splitResults = await splitPdfByRanges(currentFile.data, currentFile.name, ranges);

        if (splitResults.length === 1) {
          // Single split output: provide directly as PDF
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
          // Multiple split outputs: zip bundle
          setProcessing({
            status: 'processing',
            message: 'Bundling parts into ZIP...',
            progress: 80,
          });

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

  // 5. Export Extracted Pages
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

      setProcessing({
        status: 'processing',
        message: 'Extracting selected pages...',
        progress: 40,
      });

      try {
        const idSet = new Set(targetIds);
        const selectedItems = pages.filter((p) => idSet.has(p.id));

        // Use organizePdf so any rotation applied in the organizer is preserved in the extraction!
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
        loadFile,
        loadSampleDoc,
        clearCurrentFile,
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
      }}
    >
      {children}
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
