import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Eye,
  Type,
  ScanText,
  PenTool,
  LayoutGrid,
  FileSignature,
  FormInput,
  Stamp,
  Minimize2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize,
  Download,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Copy,
  Trash2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Save,
  Check,
  Sliders,
  HelpCircle,
  FileText,
  Square,
  Highlighter,
  ShieldAlert,
  ArrowUpRight,
  Eraser,
  RefreshCw,
  Layers,
  ChevronDown,
  RotateCcw,
  Info,
  Bookmark,
  Compass,
  Maximize,
  Grid,
  SlidersHorizontal,
  Lock,
  FileUp,
  FileCheck,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';
import { cn, formatBytes, downloadBlob } from '../../lib/utils';
import {
  renderPageToCanvas,
  extractPageTextItems,
  replaceVectorTextInPdf,
  PdfTextItemInfo,
  TextReplacementEdit,
  removeWatermarkFromPdf,
  addWatermarkToPdf,
  compressPdfDocument,
  applyAnnotationsToPdf,
  embedSignatureOnPdf,
  convertPdfToImages,
  extractAllTextFromPdf,
  reconstructScannedPageWithEdits,
  reconstructScannedDocumentWithEdits,
  ScannedTextEditItem,
  validateExportedEdits,
} from '../../lib/pdf/pdf-engine';
import { runDetailedOcrOnImageDataUrl, OcrLineItem, OcrWordItem } from '../../lib/pdf/pdf-engine';
import { AnnotationItem, AnnotationType } from '../../types/pdf';

export type WorkspaceStudioMode =
  | 'view'
  | 'edit-text'
  | 'scanned-ocr'
  | 'annotate'
  | 'organize'
  | 'sign'
  | 'forms'
  | 'watermark'
  | 'compress';

interface UnifiedDocumentWorkspaceProps {
  initialMode?: WorkspaceStudioMode;
  onNavigateHome?: () => void;
}

export const UnifiedDocumentWorkspace: React.FC<UnifiedDocumentWorkspaceProps> = ({
  initialMode = 'view',
  onNavigateHome,
}) => {
  const {
    currentFile,
    pages,
    healthReport,
    documentType,
    updateActiveDocument,
    rotatePage,
    deletePage,
    duplicatePage,
    insertBlankPageAt,
    reverseAllPages,
    removeDetectedBlankPages,
    reorderPages,
    applySignature,
    compressDocument,
    canUndo,
    canRedo,
    undo,
    redo,
    processing,
    getPageClassification,
    loadFile,
  } = usePdf();

  // Mode and Navigation State
  const [mode, setMode] = useState<WorkspaceStudioMode>(initialMode);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.25);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');

  // Studio Panels & Tabs State
  const [rightPanelTab, setRightPanelTab] = useState<'tools' | 'properties'>('tools');
  const [leftPanelTab, setLeftPanelTab] = useState<'thumbnails' | 'search' | 'info'>('thumbnails');
  const [metaTitle, setMetaTitle] = useState(healthReport?.metadata?.title || '');
  const [metaAuthor, setMetaAuthor] = useState(healthReport?.metadata?.author || '');
  const [metaSubject, setMetaSubject] = useState('');
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [thumbnailSize, setThumbnailSize] = useState<'compact' | 'normal' | 'large'>('normal');
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState(false);
  const studioFileInputRef = useRef<HTMLInputElement>(null);

  // Search State (Ctrl + F)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ pageIndex: number; text: string }[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // Export Center Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'images-zip' | 'text'>('pdf');
  const [exportName, setExportName] = useState(currentFile?.name || 'document.pdf');
  const [isExporting, setIsExporting] = useState(false);

  // Shortcuts Help Modal State
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportWrapperRef = useRef<HTMLDivElement>(null);

  // --- TRUE VECTOR TEXT EDIT STATE ---
  const [vectorItems, setVectorItems] = useState<PdfTextItemInfo[]>([]);
  const [isLoadingVectorText, setIsLoadingVectorText] = useState(false);
  const [selectedVectorItem, setSelectedVectorItem] = useState<PdfTextItemInfo | null>(null);
  const [vectorNewText, setVectorNewText] = useState('');
  const [vectorFontSize, setVectorFontSize] = useState(14);
  const [vectorFontColor, setVectorFontColor] = useState('#000000');
  const [vectorFontFamily, setVectorFontFamily] = useState<'sans' | 'serif' | 'mono' | 'bold'>('sans');
  const [vectorEdits, setVectorEdits] = useState<TextReplacementEdit[]>([]);
  const [isSavingVector, setIsSavingVector] = useState(false);
  const [inlineEditingVectorId, setInlineEditingVectorId] = useState<string | null>(null);
  const [inlineVectorValue, setInlineVectorValue] = useState<string>('');

  // --- SCANNED OCR EDIT STATE ---
  const [ocrLang, setOcrLang] = useState('eng');
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrWords, setOcrWords] = useState<OcrWordItem[]>([]);
  const [selectedOcrWord, setSelectedOcrWord] = useState<OcrWordItem | null>(null);
  const [ocrReplacementText, setOcrReplacementText] = useState('');
  const [inlineEditingOcrId, setInlineEditingOcrId] = useState<string | null>(null);
  const [inlineOcrValue, setInlineOcrValue] = useState<string>('');
  const [scannedEdits, setScannedEdits] = useState<ScannedTextEditItem[]>([]);
  const [isSavingScanned, setIsSavingScanned] = useState<boolean>(false);

  // --- ANNOTATIONS & REDACTION STATE ---
  const [annTool, setAnnTool] = useState<AnnotationType>('text');
  const [annColor, setAnnColor] = useState('#2563eb');
  const [annStrokeWidth, setAnnStrokeWidth] = useState(2);
  const [annText, setAnnText] = useState('Confidential');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [isDrawingAnn, setIsDrawingAnn] = useState(false);
  const [annStartPos, setAnnStartPos] = useState<{ x: number; y: number } | null>(null);

  // --- SIGNATURE STATE ---
  const [sigType, setSigType] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedSigName, setTypedSigName] = useState('');
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSig, setIsDrawingSig] = useState(false);

  // --- WATERMARK STATE ---
  const [wmTab, setWmTab] = useState<'add' | 'remove'>('add');
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmOpacity, setWmOpacity] = useState(0.35);
  const [wmRotation, setWmRotation] = useState(45);
  const [wmColor, setWmColor] = useState('#ef4444');
  const [wmRemoveColor, setWmRemoveColor] = useState('#ef4444');
  const [wmTolerance, setWmTolerance] = useState(35);

  // --- COMPRESS STATE ---
  const [compPreset, setCompPreset] = useState<'balanced' | 'extreme' | 'custom'>('balanced');
  const [compCustomDpi, setCompCustomDpi] = useState(150);
  const [compCustomQuality, setCompCustomQuality] = useState(75);

  const totalPages = pages.length || currentFile?.pageCount || 1;
  const currentPageItem = pages[currentPageIndex] || null;

  // Sync mode from props if changed externally
  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  // High-DPI Canvas Rendering
  const renderActivePage = useCallback(async () => {
    if (!currentFile || !canvasRef.current) return;
    try {
      setStatusMessage(`Rendering Page ${currentPageIndex + 1} at ${Math.round(scale * 100)}% zoom...`);
      await renderPageToCanvas(
        currentFile.data,
        currentPageIndex + 1,
        canvasRef.current,
        scale,
        0
      );
      setStatusMessage('Ready');
    } catch (err) {
      console.error('Canvas render error:', err);
      setStatusMessage('Rendering failed. Please zoom out or reload.');
    }
  }, [currentFile, currentPageIndex, scale]);

  useEffect(() => {
    renderActivePage();
  }, [renderActivePage]);

  // Sync Document Metadata
  useEffect(() => {
    if (healthReport?.metadata) {
      setMetaTitle(healthReport.metadata.title || '');
      setMetaAuthor(healthReport.metadata.author || '');
    }
  }, [healthReport]);

  const handleSaveMetadata = async () => {
    if (!currentFile) return;
    try {
      setIsSavingMeta(true);
      setStatusMessage('Writing updated document properties into PDF stream...');
      const pdfDoc = await PDFDocument.load(currentFile.data);
      if (metaTitle.trim()) pdfDoc.setTitle(metaTitle.trim());
      if (metaAuthor.trim()) pdfDoc.setAuthor(metaAuthor.trim());
      if (metaSubject.trim()) pdfDoc.setSubject(metaSubject.trim());
      const updated = await pdfDoc.save();
      await updateActiveDocument(updated, 'Update Document Properties');
      setStatusMessage('Document properties successfully saved.');
    } catch (err: any) {
      console.error('Metadata save error:', err);
      setStatusMessage(err?.message || 'Failed to save metadata');
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleFitToWidth = () => {
    if (!viewportWrapperRef.current) return;
    const availableWidth = viewportWrapperRef.current.clientWidth - 80;
    const computedScale = Math.max(0.4, Math.min(2.5, availableWidth / 595.28));
    setScale(parseFloat(computedScale.toFixed(2)));
    setStatusMessage(`Zoom: Fit Width (${Math.round(computedScale * 100)}%)`);
  };

  const handleFitToPage = () => {
    if (!viewportWrapperRef.current) return;
    const availableHeight = viewportWrapperRef.current.clientHeight - 130;
    const computedScale = Math.max(0.4, Math.min(2.0, availableHeight / 841.89));
    setScale(parseFloat(computedScale.toFixed(2)));
    setStatusMessage(`Zoom: Fit Page (${Math.round(computedScale * 100)}%)`);
  };

  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverCanvas(false);
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFile) {
      setStatusMessage(`Loading ${pdfFile.name}...`);
      await loadFile(pdfFile);
    }
  };

  // Extract vector text on page when entering 'edit-text' mode
  useEffect(() => {
    if (!currentFile || mode !== 'edit-text') return;
    let isMounted = true;
    setIsLoadingVectorText(true);
    setSelectedVectorItem(null);

    extractPageTextItems(currentFile.data, currentPageIndex + 1)
      .then((items) => {
        if (isMounted) {
          setVectorItems(items);
          setIsLoadingVectorText(false);
        }
      })
      .catch((err) => {
        console.warn('Vector text extraction warning:', err);
        if (isMounted) {
          setVectorItems([]);
          setIsLoadingVectorText(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentFile, currentPageIndex, mode]);

  // Phase 3: Auto-route to scanned reconstruction if current page is scanned or hybrid
  useEffect(() => {
    if (mode === 'edit-text') {
      const cls = getPageClassification(currentPageIndex);
      if (cls?.type === 'scanned' || cls?.type === 'hybrid') {
        setMode('scanned-ocr');
      }
    }
  }, [currentPageIndex, mode, getPageClassification]);

  // Phase 5: For hybrid pages in 'scanned-ocr' mode, immediately load text layer items as OCR words
  useEffect(() => {
    if (!currentFile || mode !== 'scanned-ocr') return;
    const cls = getPageClassification(currentPageIndex);
    if ((cls?.type === 'hybrid' || cls?.type === 'scanned') && ocrWords.length === 0) {
      extractPageTextItems(currentFile.data, currentPageIndex + 1)
        .then((items) => {
          if (items.length > 0) {
            const words: OcrWordItem[] = items.map((it, idx) => ({
              id: `hybrid_word_${currentPageIndex + 1}_${idx}`,
              text: it.text,
              bbox: {
                x0: it.x,
                y0: it.y,
                x1: it.x + it.width,
                y1: it.y + it.height,
              },
              confidence: 95,
            }));
            setOcrWords(words);
          }
        })
        .catch((err) => {
          console.warn('Hybrid OCR text extraction warning:', err);
        });
    }
  }, [currentFile, currentPageIndex, mode, getPageClassification, ocrWords.length]);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S, Ctrl+F, Escape, Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (canRedo) {
            e.preventDefault();
            redo();
          }
        } else {
          if (canUndo) {
            e.preventDefault();
            undo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y')) {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setIsExportOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsExportOpen(false);
        setIsShortcutsOpen(false);
        setInlineEditingVectorId(null);
        setInlineEditingOcrId(null);
        setSelectedVectorItem(null);
        setSelectedOcrWord(null);
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        if (mode === 'edit-text' && selectedVectorItem) {
          e.preventDefault();
          handleDeleteVectorItem();
        } else if (mode === 'scanned-ocr' && selectedOcrWord) {
          e.preventDefault();
          handleDeleteOcrWord();
        }
      } else if (
        e.key === 'Enter' &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        if (mode === 'edit-text' && selectedVectorItem) {
          e.preventDefault();
          setInlineEditingVectorId(selectedVectorItem.id);
          const existing = vectorEdits.find(
            (ed) =>
              ed.pageNumber === currentPageIndex + 1 &&
              ed.pdfX === selectedVectorItem.pdfX &&
              ed.pdfY === selectedVectorItem.pdfY
          );
          setInlineVectorValue(existing ? existing.newText : selectedVectorItem.text);
        } else if (mode === 'scanned-ocr' && selectedOcrWord) {
          e.preventDefault();
          setInlineEditingOcrId(selectedOcrWord.id);
          const existing = scannedEdits.find((ed) => ed.id === selectedOcrWord.id);
          setInlineOcrValue(existing ? existing.newText : selectedOcrWord.text);
        }
      } else if (e.key === '?' && !e.ctrlKey && !e.metaKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        setIsShortcutsOpen((prev) => !prev);
      } else if ((e.key === 'w' || e.key === 'W') && !e.ctrlKey && !e.metaKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        e.preventDefault();
        handleFitToWidth();
      } else if (e.key === '0' && !e.ctrlKey && !e.metaKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        e.preventDefault();
        handleFitToPage();
      } else if (e.key === '1' && !e.ctrlKey && !e.metaKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        e.preventDefault();
        setScale(1.0);
      } else if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canUndo,
    canRedo,
    undo,
    redo,
    mode,
    selectedVectorItem,
    selectedOcrWord,
    vectorEdits,
    scannedEdits,
    currentPageIndex,
  ]);

  // Execute in-document text search
  const handlePerformSearch = async () => {
    if (!currentFile || !searchQuery.trim()) return;
    setStatusMessage(`Searching for "${searchQuery}" across ${totalPages} pages...`);
    try {
      const fullText = await extractAllTextFromPdf(currentFile.data);
      const matches: { pageIndex: number; text: string }[] = [];
      const lowerQ = searchQuery.toLowerCase();
      
      // Page by page scan
      for (let p = 0; p < totalPages; p++) {
        const pageItems = await extractPageTextItems(currentFile.data, p + 1);
        const match = pageItems.find((item) => item.text.toLowerCase().includes(lowerQ));
        if (match) {
          matches.push({ pageIndex: p, text: match.text });
        }
      }

      setSearchResults(matches);
      setCurrentMatchIdx(0);
      if (matches.length > 0) {
        setCurrentPageIndex(matches[0].pageIndex);
        setStatusMessage(`Found ${matches.length} matches`);
      } else {
        setStatusMessage('No matches found in document');
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleNextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % searchResults.length;
    setCurrentMatchIdx(nextIdx);
    setCurrentPageIndex(searchResults[nextIdx].pageIndex);
  };

  const handlePrevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentMatchIdx - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIdx(prevIdx);
    setCurrentPageIndex(searchResults[prevIdx].pageIndex);
  };

  // --- VECTOR TEXT HANDLERS ---
  const handleSelectVectorText = (item: PdfTextItemInfo) => {
    setSelectedVectorItem(item);
    const existing = vectorEdits.find(
      (e) => e.pageNumber === currentPageIndex + 1 && e.pdfX === item.pdfX && e.pdfY === item.pdfY
    );
    setVectorNewText(existing ? existing.newText : item.text);
    setVectorFontSize(existing?.fontSize || item.fontSize || 14);
    setVectorFontColor(existing?.color || '#000000');
    setVectorFontFamily((existing?.fontFamily as any) || 'sans');
  };

  const handleApplyVectorEdit = () => {
    if (!selectedVectorItem) return;
    const edit: TextReplacementEdit = {
      pageNumber: currentPageIndex + 1,
      originalText: selectedVectorItem.text,
      pdfX: selectedVectorItem.pdfX,
      pdfY: selectedVectorItem.pdfY,
      pdfWidth: selectedVectorItem.pdfWidth,
      pdfHeight: selectedVectorItem.pdfHeight,
      newText: vectorNewText,
      fontSize: vectorFontSize,
      color: vectorFontColor,
      fontFamily: vectorFontFamily,
      isDeleted: false,
    };

    setVectorEdits((prev) => [
      ...prev.filter(
        (e) =>
          !(
            e.pageNumber === currentPageIndex + 1 &&
            e.pdfX === selectedVectorItem.pdfX &&
            e.pdfY === selectedVectorItem.pdfY
          )
      ),
      edit,
    ]);
    setSelectedVectorItem(null);
  };

  const handleDeleteVectorItem = () => {
    if (!selectedVectorItem) return;
    const delEdit: TextReplacementEdit = {
      pageNumber: currentPageIndex + 1,
      originalText: selectedVectorItem.text,
      pdfX: selectedVectorItem.pdfX,
      pdfY: selectedVectorItem.pdfY,
      pdfWidth: selectedVectorItem.pdfWidth,
      pdfHeight: selectedVectorItem.pdfHeight,
      newText: '',
      isDeleted: true,
    };
    setVectorEdits((prev) => [
      ...prev.filter(
        (e) =>
          !(
            e.pageNumber === currentPageIndex + 1 &&
            e.pdfX === selectedVectorItem.pdfX &&
            e.pdfY === selectedVectorItem.pdfY
          )
      ),
      delEdit,
    ]);
    setSelectedVectorItem(null);
  };

  const commitInlineVector = (item: PdfTextItemInfo, newText: string) => {
    setInlineEditingVectorId(null);
    const isDeleted = !newText.trim();
    const edit: TextReplacementEdit = {
      pageNumber: currentPageIndex + 1,
      originalText: item.text,
      pdfX: item.pdfX,
      pdfY: item.pdfY,
      pdfWidth: item.pdfWidth,
      pdfHeight: item.pdfHeight,
      newText: newText,
      fontSize: item.fontSize,
      fontFamily: 'sans',
      isDeleted,
    };
    setVectorEdits((prev) => [
      ...prev.filter(
        (e) =>
          !(
            e.pageNumber === currentPageIndex + 1 &&
            e.pdfX === item.pdfX &&
            e.pdfY === item.pdfY
          )
      ),
      edit,
    ]);
  };

  const handleSaveAllVectorEdits = async () => {
    if (!currentFile || vectorEdits.length === 0) return;
    try {
      setIsSavingVector(true);
      setStatusMessage('Saving document text edits...');

      let updatedBytes: Uint8Array = new Uint8Array(currentFile.data);
      const pureVectorEdits: TextReplacementEdit[] = [];
      const scannedEditsToReconstruct: ScannedTextEditItem[] = [];

      for (const edit of vectorEdits) {
        const cls = getPageClassification(edit.pageNumber - 1);
        if (cls?.type === 'scanned' || cls?.type === 'hybrid') {
          scannedEditsToReconstruct.push({
            id: `v2s_${edit.pageNumber}_${Math.round(edit.pdfX)}_${Math.round(edit.pdfY)}`,
            pageNumber: edit.pageNumber,
            originalText: edit.originalText || '',
            newText: edit.newText,
            pdfX: edit.pdfX,
            pdfY: edit.pdfY,
            pdfWidth: edit.pdfWidth,
            pdfHeight: edit.pdfHeight,
            color: edit.color,
            fontSize: edit.fontSize,
            fontFamily: edit.fontFamily as any,
            isDeleted: edit.isDeleted,
          });
        } else {
          pureVectorEdits.push(edit);
        }
      }

      if (scannedEditsToReconstruct.length > 0) {
        setStatusMessage('Reconstructing scanned pages with local background preservation...');
        updatedBytes = await reconstructScannedDocumentWithEdits(updatedBytes, scannedEditsToReconstruct);
      }
      if (pureVectorEdits.length > 0) {
        setStatusMessage('Embedding vector text changes into document stream...');
        updatedBytes = await replaceVectorTextInPdf(updatedBytes, pureVectorEdits);
      }

      // Critical Two-Layer Save Validation
      const valResult = await validateExportedEdits(currentFile.data, updatedBytes, vectorEdits);
      if (!valResult.valid) {
        throw new Error(valResult.error || 'Text edit validation failed');
      }

      await updateActiveDocument(updatedBytes, 'Edit PDF Text');
      setVectorEdits([]);
      setSelectedVectorItem(null);
      setStatusMessage('Text successfully saved and verified.');
    } catch (err: any) {
      console.error('Vector save error:', err);
      setStatusMessage(err?.message || 'Error saving text');
    } finally {
      setIsSavingVector(false);
    }
  };

  // --- SCANNED OCR HANDLERS ---
  const handleRunOcrOnCurrentPage = async () => {
    if (!canvasRef.current) return;
    try {
      setIsOcrRunning(true);
      setStatusMessage(`Running Tesseract Neural OCR (${ocrLang}) on page ${currentPageIndex + 1}...`);
      const cvsW = canvasRef.current.width || 1;
      const cvsH = canvasRef.current.height || 1;
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const result = await runDetailedOcrOnImageDataUrl(dataUrl, ocrLang);
      const allWords: OcrWordItem[] = [];
      result.lines.forEach((l) => {
        l.words.forEach((w) => {
          allWords.push({
            id: w.id,
            text: w.text,
            confidence: w.confidence,
            bbox: {
              x0: w.bbox.x0 / cvsW,
              y0: w.bbox.y0 / cvsH,
              x1: w.bbox.x1 / cvsW,
              y1: w.bbox.y1 / cvsH,
            },
          });
        });
      });
      setOcrWords(allWords);
      setStatusMessage(`OCR detected ${allWords.length} words with ${Math.round(result.confidence)}% confidence.`);
    } catch (err) {
      console.error('OCR failed:', err);
      setStatusMessage('OCR scan encountered an issue.');
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleSelectOcrWord = (word: OcrWordItem) => {
    setSelectedOcrWord(word);
    const existing = scannedEdits.find((e) => e.pageNumber === currentPageIndex + 1 && e.id === word.id);
    setOcrReplacementText(existing ? existing.newText : word.text);
  };

  const commitInlineOcr = (w: OcrWordItem, newText: string) => {
    setInlineEditingOcrId(null);
    setScannedEdits((prev) => [
      ...prev.filter((e) => !(e.pageNumber === currentPageIndex + 1 && e.id === w.id)),
      {
        id: w.id,
        pageNumber: currentPageIndex + 1,
        originalText: w.text,
        newText: newText,
        bbox: w.bbox,
      },
    ]);
  };

  const handleDeleteOcrWord = () => {
    if (!selectedOcrWord) return;
    setScannedEdits((prev) => [
      ...prev.filter((e) => !(e.pageNumber === currentPageIndex + 1 && e.id === selectedOcrWord.id)),
      {
        id: selectedOcrWord.id,
        pageNumber: currentPageIndex + 1,
        originalText: selectedOcrWord.text,
        newText: '',
        bbox: selectedOcrWord.bbox,
        isDeleted: true,
      },
    ]);
    setSelectedOcrWord(null);
  };

  const handleApplyScannedWordEdit = () => {
    if (!selectedOcrWord) return;
    const isDeleted = !ocrReplacementText.trim();
    setScannedEdits((prev) => [
      ...prev.filter((e) => !(e.pageNumber === currentPageIndex + 1 && e.id === selectedOcrWord.id)),
      {
        id: selectedOcrWord.id,
        pageNumber: currentPageIndex + 1,
        originalText: selectedOcrWord.text,
        newText: ocrReplacementText,
        bbox: selectedOcrWord.bbox,
        isDeleted,
      },
    ]);
    setSelectedOcrWord(null);
  };

  const handleSaveAllScannedEdits = async () => {
    if (!currentFile || scannedEdits.length === 0) return;
    try {
      setIsSavingScanned(true);
      setStatusMessage('Reconstructing scanned document across all edited pages...');
      const updated = await reconstructScannedDocumentWithEdits(
        currentFile.data,
        scannedEdits
      );

      // Phase 7: Critical Save Validation
      const valResult = await validateExportedEdits(currentFile.data, updated, scannedEdits);
      if (!valResult.valid) {
        throw new Error(valResult.error || 'Failed to verify changes in reconstructed document');
      }

      await updateActiveDocument(updated, 'Edit Scanned Text');
      setScannedEdits([]);
      setSelectedOcrWord(null);
      setStatusMessage('Scanned pages reconstructed and verified successfully with local background preservation.');
    } catch (err: any) {
      console.error('Scanned edit save error:', err);
      setStatusMessage(err?.message || 'Error reconstructing scanned text.');
    } finally {
      setIsSavingScanned(false);
    }
  };

  // --- ANNOTATION MOUSE HANDLERS ---
  const handleAnnotationMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'annotate' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setAnnStartPos({ x, y });
    setIsDrawingAnn(true);

    if (annTool === 'text') {
      const item: AnnotationItem = {
        id: Math.random().toString(36).substring(2, 8),
        pageNumber: currentPageIndex + 1,
        type: 'text',
        x,
        y,
        width: 0.2,
        height: 0.05,
        text: annText || 'Text',
        fontSize: 14,
        color: annColor,
        opacity: 1.0,
      };
      setAnnotations((prev) => [...prev, item]);
      setIsDrawingAnn(false);
    }
  };

  const handleAnnotationMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'annotate' || !isDrawingAnn || !annStartPos || !containerRef.current) {
      setIsDrawingAnn(false);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const endX = (e.clientX - rect.left) / rect.width;
    const endY = (e.clientY - rect.top) / rect.height;

    const x = Math.min(annStartPos.x, endX);
    const y = Math.min(annStartPos.y, endY);
    const width = Math.max(0.04, Math.abs(endX - annStartPos.x));
    const height = Math.max(0.02, Math.abs(endY - annStartPos.y));

    const item: AnnotationItem = {
      id: Math.random().toString(36).substring(2, 8),
      pageNumber: currentPageIndex + 1,
      type: annTool,
      x,
      y,
      width,
      height,
      color: annColor,
      strokeWidth: annStrokeWidth,
      opacity: annTool === 'highlight' ? 0.35 : 1.0,
    };

    setAnnotations((prev) => [...prev, item]);
    setIsDrawingAnn(false);
    setAnnStartPos(null);
  };

  const handleBurnAnnotations = async () => {
    if (!currentFile || annotations.length === 0) return;
    try {
      setStatusMessage('Permanently embedding annotations & redactions into document...');
      const updated = await applyAnnotationsToPdf(currentFile.data, annotations);
      await updateActiveDocument(updated, 'Apply Annotations');
      setAnnotations([]);
      setStatusMessage('Annotations applied successfully');
    } catch (err) {
      console.error('Annotation burn error:', err);
    }
  };

  // --- SIGNATURE HANDLERS ---
  const handleSignaturePlacement = async () => {
    if (!currentFile || !sigDataUrl) return;
    try {
      setStatusMessage('Embedding signature stamp on page...');
      await applySignature(
        currentPageIndex,
        sigDataUrl,
        0.35,
        0.75,
        0.3,
        0.12
      );
      setStatusMessage('Signature stamped successfully');
    } catch (err) {
      console.error('Signature error:', err);
    }
  };

  // --- WATERMARK & COMPRESS HANDLERS ---
  const handleApplyWatermarkAction = async () => {
    if (!currentFile) return;
    try {
      if (wmTab === 'add') {
        setStatusMessage('Embedding watermark stamps...');
        const updated = await addWatermarkToPdf(currentFile.data, {
          type: 'text',
          text: wmText,
          fontSize: 48,
          color: wmColor,
          opacity: wmOpacity,
          rotation: wmRotation,
          position: 'diagonal',
          pageRange: 'all',
        });
        await updateActiveDocument(updated, 'Add Watermark');
      } else {
        setStatusMessage('Applying color-selective watermark suppression...');
        const updated = await removeWatermarkFromPdf(currentFile.data, {
          mode: 'color-threshold',
          colorHex: wmRemoveColor,
          colorTolerance: wmTolerance,
        });
        await updateActiveDocument(updated, 'Remove Watermark');
      }
      setStatusMessage('Watermark updated successfully');
    } catch (err) {
      console.error('Watermark error:', err);
    }
  };

  const handleApplyCompressionAction = async () => {
    if (!currentFile) return;
    try {
      setStatusMessage('Compressing document images and streams...');
      await compressDocument({
        preset: compPreset === 'custom' ? 'custom' : compPreset === 'extreme' ? 'small' : 'balanced',
        scale: compPreset === 'extreme' ? 0.7 : 0.9,
        quality: compPreset === 'custom' ? compCustomQuality / 100 : compPreset === 'extreme' ? 0.5 : 0.75,
        removeMetadata: true,
        flattenAnnotations: true,
      });
      setStatusMessage('Document compression completed');
    } catch (err) {
      console.error('Compression error:', err);
    }
  };

  // --- EXPORT CENTER EXECUTION ---
  const handleExecuteExport = async () => {
    if (!currentFile) return;
    try {
      setIsExporting(true);
      setStatusMessage('Preparing high-quality export bundle...');

      let activePdfData: ArrayBuffer | Uint8Array = currentFile.data;

      // Automatically burn any pending scanned text edits first
      if (scannedEdits.length > 0) {
        setStatusMessage('Reconstructing scanned pages with local background preservation...');
        activePdfData = await reconstructScannedDocumentWithEdits(
          activePdfData,
          scannedEdits
        );
        await updateActiveDocument(activePdfData, 'Burn Scanned Edits for Export');
        setScannedEdits([]);
      }

      // Automatically burn any pending text edits
      if (vectorEdits.length > 0) {
        const pureVectorEdits: TextReplacementEdit[] = [];
        const pendingScanned: ScannedTextEditItem[] = [];

        for (const edit of vectorEdits) {
          const cls = getPageClassification(edit.pageNumber - 1);
          if (cls?.type === 'scanned' || cls?.type === 'hybrid') {
            pendingScanned.push({
              id: `exp_v2s_${edit.pageNumber}_${Math.round(edit.pdfX)}`,
              pageNumber: edit.pageNumber,
              originalText: edit.originalText || '',
              newText: edit.newText,
              pdfX: edit.pdfX,
              pdfY: edit.pdfY,
              pdfWidth: edit.pdfWidth,
              pdfHeight: edit.pdfHeight,
              color: edit.color,
              fontSize: edit.fontSize,
              fontFamily: edit.fontFamily as any,
              isDeleted: edit.isDeleted,
            });
          } else {
            pureVectorEdits.push(edit);
          }
        }

        if (pendingScanned.length > 0) {
          setStatusMessage('Reconstructing scanned pages with local background preservation...');
          activePdfData = await reconstructScannedDocumentWithEdits(activePdfData, pendingScanned);
        }
        if (pureVectorEdits.length > 0) {
          setStatusMessage('Embedding vector text changes into document stream...');
          activePdfData = await replaceVectorTextInPdf(activePdfData, pureVectorEdits);
        }
        await updateActiveDocument(activePdfData, 'Burn Text Edits for Export');
        setVectorEdits([]);
      }

      if (exportFormat === 'pdf') {
        const blob = new Blob([activePdfData as any], { type: 'application/pdf' });
        const fileName = exportName.endsWith('.pdf') ? exportName : `${exportName}.pdf`;
        await downloadBlob(blob, fileName);
      } else if (exportFormat === 'text') {
        const textObj = await extractAllTextFromPdf(activePdfData);
        const blob = new Blob([textObj.fullText], { type: 'text/plain;charset=utf-8' });
        const fileName = `${exportName.replace(/\.[^.]+$/, '')}.txt`;
        await downloadBlob(blob, fileName);
      } else if (exportFormat === 'images-zip') {
        const images = await convertPdfToImages(activePdfData, 'image/jpeg');
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        images.forEach((img, idx) => {
          const base64 = img.dataUrl.split(',')[1];
          zip.file(`page-${idx + 1}.jpg`, base64, { base64: true });
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const fileName = `${exportName.replace(/\.[^.]+$/, '')}-images.zip`;
        await downloadBlob(zipBlob, fileName);
      }

      setIsExportOpen(false);
      setStatusMessage('Export completed successfully');
    } catch (err) {
      console.error('Export error:', err);
      setStatusMessage('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  if (!currentFile) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-4.25rem)] bg-slate-100 dark:bg-[#070915] select-none overflow-hidden">
      {/* 0. DOCUMENT TABS STRIP */}
      <div className="h-9 bg-[#0b0e20] border-b border-violet-500/15 px-3 flex items-center justify-between gap-2 shrink-0 z-30">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <div className="flex items-center gap-2 px-3 py-1 rounded-t-lg bg-[#141834] border-t border-l border-r border-violet-400/25 text-white text-xs font-semibold shadow-xs">
            <FileText className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-[220px]" title={currentFile.name}>{currentFile.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-violet-500/25 text-violet-300 font-mono">
              {totalPages}p
            </span>
          </div>

          <button
            onClick={() => studioFileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors"
            title="Open another PDF document into studio"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open PDF</span>
          </button>
          <input
            ref={studioFileInputRef}
            type="file"
            accept="application/pdf"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) {
                setStatusMessage(`Loading ${f.name}...`);
                await loadFile(f);
              }
            }}
            className="hidden"
          />
        </div>

        {/* Right side tab helpers */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setRightPanelTab(rightPanelTab === 'properties' ? 'tools' : 'properties')}
            className={cn(
              'px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
              rightPanelTab === 'properties'
                ? 'bg-violet-600 text-white shadow-xs font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            )}
            title="Inspect & Edit Document Metadata (Title, Author, Specs)"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Document Properties</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-2 py-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 flex items-center gap-1.5 text-xs font-medium transition-colors"
            title="Toggle Distraction-Free Presentation Mode (F)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Presentation'}</span>
          </button>
        </div>
      </div>

      {/* 1. TOP HEADER TOOLBAR */}
      <header className="h-13 bg-white dark:bg-[#0e1124] border-b border-slate-200 dark:border-violet-400/10 px-4 flex items-center justify-between gap-2 shrink-0 z-30 shadow-2xs">
        {/* Left: Document Info & Home Navigation */}
        <div className="flex items-center gap-3 min-w-0">
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1 shrink-0"
              title="Return to Home"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
          )}

          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[200px]" title={currentFile.name}>
              {currentFile.name}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              {formatBytes(currentFile.size)}
            </span>
            {documentType === 'scanned' || healthReport?.isLikelyScanned ? (
              <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                <ScanText className="w-3 h-3 text-amber-500" /> Scanned PDF • OCR Available
              </span>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <Type className="w-3 h-3 text-emerald-500" /> Vector Text PDF
              </span>
            )}
          </div>
        </div>

        {/* Center: Mode Switcher Pills */}
        <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          {[
            { id: 'view', label: 'View', icon: Eye },
            { id: 'edit-text', label: 'Edit Text', icon: Type },
            { id: 'scanned-ocr', label: 'OCR Scanned', icon: ScanText },
            { id: 'annotate', label: 'Markup & Draw', icon: PenTool },
            { id: 'organize', label: 'Organize', icon: LayoutGrid },
            { id: 'sign', label: 'Sign', icon: FileSignature },
            { id: 'forms', label: 'Forms', icon: FormInput },
            { id: 'watermark', label: 'Watermark', icon: Stamp },
            { id: 'compress', label: 'Compress', icon: Minimize2 },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = mode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setMode(item.id as WorkspaceStudioMode)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
                title={
                  item.id === 'edit-text'
                    ? 'Edit existing vector text in PDF stream'
                    : item.id === 'scanned-ocr'
                    ? 'Click and edit words directly on scanned pages'
                    : item.id === 'annotate'
                    ? 'Add new text boxes, shapes, and annotations'
                    : item.label
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Actions, Zoom, Shortcuts, Export */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Rotate Current Page Quick Buttons */}
          <div className="hidden xl:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => rotatePage(currentPageItem?.id || '', -90)}
              className="p-1.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Rotate Page -90°"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => rotatePage(currentPageItem?.id || '', 90)}
              className="p-1.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Rotate Page +90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Undo / Redo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={cn(
              'p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
              isSearchOpen && 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400'
            )}
            title="Search Text in PDF (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Stepped Zoom & Fit Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg p-0.5">
            <button
              onClick={() => handleFitToWidth()}
              className="px-2 py-1 rounded text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Fit to Width (W)"
            >
              Fit W
            </button>
            <button
              onClick={() => handleFitToPage()}
              className="px-2 py-1 rounded text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Fit to Page (0)"
            >
              Fit Page
            </button>
            <div className="h-3 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />
            <button
              onClick={() => setScale((s) => Math.max(0.25, parseFloat((s - 0.15).toFixed(2))))}
              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <select
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="text-[11px] font-mono bg-transparent text-slate-700 dark:text-slate-300 px-1 py-0.5 rounded cursor-pointer outline-none"
            >
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2">200%</option>
              <option value="3">300%</option>
            </select>
            <button
              onClick={() => setScale((s) => Math.min(4.0, parseFloat((s + 0.15).toFixed(2))))}
              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Shortcuts Help */}
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Export Center Trigger */}
          <Button
            size="sm"
            onClick={() => setIsExportOpen(true)}
            className="gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium ml-1 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </header>

      {/* In-Document Search Toolbar if toggled */}
      {isSearchOpen && (
        <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between gap-3 animate-in slide-in-from-top-1 z-20">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePerformSearch()}
              placeholder="Search phrase in document..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handlePerformSearch} className="text-xs h-7 px-2">
              Find
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            {searchResults.length > 0 && (
              <span>
                Match {currentMatchIdx + 1} of {searchResults.length}
              </span>
            )}
            <button
              onClick={handlePrevMatch}
              disabled={searchResults.length === 0}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMatch}
              disabled={searchResults.length === 0}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. THREE-PANE MAIN WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: THUMBNAILS, SEARCH MATCHES & DOCUMENT OUTLINE */}
        <aside
          className={cn(
            'border-r border-slate-200 dark:border-violet-400/10 bg-white dark:bg-[#0a0d1e] transition-all duration-200 flex flex-col shrink-0 z-10 shadow-xs',
            showThumbnails ? 'w-60' : 'w-10'
          )}
        >
          {/* Left Panel Top Header & Tab Switcher */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            {showThumbnails ? (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg w-full mr-2">
                <button
                  onClick={() => setLeftPanelTab('thumbnails')}
                  className={cn(
                    'flex-1 py-1 text-[11px] font-semibold rounded-md transition-all text-center',
                    leftPanelTab === 'thumbnails'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-violet-300 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  )}
                >
                  Pages ({totalPages})
                </button>
                <button
                  onClick={() => setLeftPanelTab('search')}
                  className={cn(
                    'flex-1 py-1 text-[11px] font-semibold rounded-md transition-all text-center',
                    leftPanelTab === 'search'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-violet-300 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  )}
                >
                  Matches {searchResults.length > 0 && `(${searchResults.length})`}
                </button>
                <button
                  onClick={() => setLeftPanelTab('info')}
                  className={cn(
                    'px-2 py-1 text-[11px] font-semibold rounded-md transition-all text-center',
                    leftPanelTab === 'info'
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-violet-300 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  )}
                  title="Page Dimensions & Classification"
                >
                  Info
                </button>
              </div>
            ) : null}

            <button
              onClick={() => setShowThumbnails((prev) => !prev)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 mx-auto shrink-0"
              title={showThumbnails ? 'Collapse Left Sidebar' : 'Expand Left Sidebar'}
            >
              {showThumbnails ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {showThumbnails && (
            <div className="flex-1 overflow-y-auto p-2">
              {/* TAB 1: THUMBNAILS FILMSTRIP */}
              {leftPanelTab === 'thumbnails' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
                    <span>Page Order</span>
                    <button
                      onClick={reverseAllPages}
                      className="hover:text-violet-400 flex items-center gap-1 text-[10px]"
                      title="Flip sequence of pages"
                    >
                      <RefreshCw className="w-3 h-3" /> Flip All
                    </button>
                  </div>

                  <div className={cn(
                    'grid gap-2.5',
                    thumbnailSize === 'compact' ? 'grid-cols-2' : 'grid-cols-1'
                  )}>
                    {pages.map((p, idx) => {
                      const isSelected = idx === currentPageIndex;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setCurrentPageIndex(idx)}
                          className={cn(
                            'group relative rounded-xl border p-1.5 cursor-pointer transition-all bg-slate-50 dark:bg-[#101328]',
                            isSelected
                              ? 'border-violet-500 ring-2 ring-violet-500/30 shadow-md scale-[1.01]'
                              : 'border-slate-200 dark:border-violet-500/10 hover:border-violet-400/30'
                          )}
                        >
                          <div className="aspect-[1/1.414] bg-white rounded-lg overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-inner">
                            {p.thumbnailUrl ? (
                              <img src={p.thumbnailUrl} alt={`Page ${idx + 1}`} className="w-full h-full object-contain pointer-events-none" />
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">P.{idx + 1}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1 px-1">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                              Page {idx + 1}
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rotatePage(p.id, 90);
                                }}
                                className="p-0.5 rounded text-slate-400 hover:text-white"
                                title="Rotate 90°"
                              >
                                <RotateCw className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicatePage(p.id);
                                }}
                                className="p-0.5 rounded text-slate-400 hover:text-white"
                                title="Duplicate Page"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              {pages.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deletePage(p.id);
                                  }}
                                  className="p-0.5 rounded text-rose-400 hover:text-rose-300"
                                  title="Delete Page"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: IN-DOCUMENT SEARCH RESULTS */}
              {leftPanelTab === 'search' && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-1">
                    Occurrences for "{searchQuery || '...'}"
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
                      Press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[10px]">Ctrl+F</kbd> to search text inside document.
                    </div>
                  ) : (
                    searchResults.map((m, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentPageIndex(m.pageIndex);
                          setCurrentMatchIdx(idx);
                        }}
                        className={cn(
                          'w-full text-left p-2.5 rounded-xl border text-xs transition-all',
                          currentMatchIdx === idx
                            ? 'border-violet-500 bg-violet-500/10 text-white font-semibold'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-400'
                        )}
                      >
                        <div className="flex justify-between text-[10px] text-violet-400 font-bold mb-1">
                          <span>Page {m.pageIndex + 1}</span>
                          <span>Match #{idx + 1}</span>
                        </div>
                        <p className="truncate text-[11px] font-sans">
                          "{m.text}"
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: CURRENT PAGE INFO */}
              {leftPanelTab === 'info' && (
                <div className="space-y-3 p-1 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#101328] border border-slate-200 dark:border-violet-500/15 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Active Page {currentPageIndex + 1}
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dimensions:</span>
                      <span className="font-mono text-slate-300">595.3 × 841.9 pt</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sheet Size:</span>
                      <span className="font-semibold text-slate-300">A4 Standard</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Millimeters:</span>
                      <span className="font-mono text-slate-300">210 × 297 mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Classification:</span>
                      <span className="font-bold text-emerald-400">
                        {getPageClassification(currentPageIndex)?.type.toUpperCase() || 'VECTOR'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* CENTER VIEWPORT: HIGH-DPI CANVAS & INTERACTIVE OVERLAY */}
        <main
          ref={viewportWrapperRef}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOverCanvas(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDraggingOverCanvas(false);
            }
          }}
          onDrop={handleCanvasDrop}
          className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center justify-start bg-slate-200/60 dark:bg-slate-950 relative gap-3"
        >
          {/* Dropzone Overlay */}
          {isDraggingOverCanvas && (
            <div className="absolute inset-0 bg-violet-950/85 backdrop-blur-md z-50 flex flex-col items-center justify-center border-4 border-dashed border-violet-400 p-8 rounded-2xl animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-violet-600/30 border border-violet-400/40 text-violet-200 mb-4 animate-bounce">
                <FileUp className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Drop PDF to Open in Studio</h3>
              <p className="text-sm text-violet-200">Replaces current document with high-fidelity client-side processing</p>
            </div>
          )}

          {/* Floating Annotation Toolbar (When in annotate mode) */}
          {mode === 'annotate' && (
            <div className="sticky top-0 z-40 flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0c1024]/90 backdrop-blur-md border border-violet-500/25 shadow-2xl text-xs text-white animate-in slide-in-from-top-2">
              {[
                { id: 'text', label: 'Text Box', icon: Type },
                { id: 'highlight', label: 'Highlight', icon: Highlighter },
                { id: 'shape-rect', label: 'Rectangle', icon: Square },
                { id: 'whiteout', label: 'Whiteout', icon: Eraser },
                { id: 'redaction', label: 'Permanent Blackout', icon: ShieldAlert },
              ].map((tool) => {
                const Icon = tool.icon;
                const isActive = annTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setAnnTool(tool.id as any)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all',
                      isActive
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
              <div className="h-4 w-px bg-violet-500/20 mx-1" />
              <div className="flex items-center gap-1.5 px-1">
                <input
                  type="color"
                  value={annColor}
                  onChange={(e) => setAnnColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  title="Annotation Color"
                />
              </div>
              {annotations.length > 0 && (
                <>
                  <div className="h-4 w-px bg-violet-500/20 mx-1" />
                  <Button
                    size="sm"
                    onClick={handleBurnAnnotations}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-2.5 font-bold shadow-xs"
                  >
                    <Check className="w-3 h-3" />
                    <span>Save Markup ({annotations.length})</span>
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Floating Fullscreen Navigation Dock */}
          {isFullscreen && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0c1024]/90 backdrop-blur-md border border-violet-500/30 shadow-2xl text-white animate-in slide-in-from-bottom-3">
              <button
                onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
                disabled={currentPageIndex === 0}
                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold">
                {currentPageIndex + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPageIndex >= totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-violet-500/20" />
              <button
                onClick={() => setScale((s) => Math.max(0.25, parseFloat((s - 0.15).toFixed(2))))}
                className="p-1.5 rounded-lg hover:bg-white/10"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => setScale((s) => Math.min(4.0, parseFloat((s + 0.15).toFixed(2))))}
                className="p-1.5 rounded-lg hover:bg-white/10"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-violet-500/20" />
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                title="Exit Fullscreen (Escape)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* Classification & Engine Mode Indicator (Phase 11) */}
          {(() => {
            const cls = getPageClassification(currentPageIndex);
            if (cls?.type === 'hybrid') {
              return (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 backdrop-blur-xs shadow-2xs z-20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Scanned document with OCR layer detected — edits will reconstruct the visible page.
                  </span>
                </div>
              );
            }
            if (cls?.type === 'scanned') {
              return (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20 backdrop-blur-xs shadow-2xs z-20">
                  <ScanText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    Scanned document detected — edits will reconstruct the visible page.
                  </span>
                </div>
              );
            }
            return (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 backdrop-blur-xs shadow-2xs z-20">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Vector PDF detected — native text editing enabled.</span>
              </div>
            );
          })()}
          <div
            ref={containerRef}
            onMouseDown={handleAnnotationMouseDown}
            onMouseUp={handleAnnotationMouseUp}
            className={cn(
              'relative bg-white shadow-2xl rounded border border-slate-300 dark:border-slate-700 transition-all select-none',
              mode === 'annotate' ? 'cursor-crosshair' : 'cursor-default'
            )}
          >
            {/* The High-DPI Vector Canvas */}
            <canvas ref={canvasRef} className="block pointer-events-none rounded" />

            {/* OVERLAY: TRUE VECTOR TEXT CLICK-TO-EDIT (MODE: edit-text) */}
            {mode === 'edit-text' &&
              vectorItems.map((item) => {
                const isSelected = selectedVectorItem?.id === item.id;
                const hasPendingEdit = vectorEdits.find(
                  (e) => e.pageNumber === currentPageIndex + 1 && e.pdfX === item.pdfX && e.pdfY === item.pdfY
                );

                if (inlineEditingVectorId === item.id) {
                  return (
                    <input
                      key={`input_${item.id}`}
                      type="text"
                      value={inlineVectorValue}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setInlineVectorValue(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitInlineVector(item, inlineVectorValue);
                        } else if (e.key === 'Escape') {
                          setInlineEditingVectorId(null);
                        }
                      }}
                      onBlur={() => commitInlineVector(item, inlineVectorValue)}
                      className="absolute z-30 bg-white dark:bg-slate-900 border-2 border-brand-500 rounded px-1 text-slate-900 dark:text-white shadow-xl outline-none font-sans"
                      style={{
                        left: `${item.x * 100}%`,
                        top: `${item.y * 100}%`,
                        minWidth: `${Math.max(item.width * 100, 15)}%`,
                        height: `${Math.max(item.height * 100, 3.5)}%`,
                        fontSize: `${Math.max(item.fontSize || 13, 13)}px`,
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectVectorText(item);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleSelectVectorText(item);
                      setInlineEditingVectorId(item.id);
                      const existing = vectorEdits.find(
                        (ed) => ed.pageNumber === currentPageIndex + 1 && ed.pdfX === item.pdfX && ed.pdfY === item.pdfY
                      );
                      setInlineVectorValue(existing ? existing.newText : item.text);
                    }}
                    className={cn(
                      'absolute cursor-pointer transition-all border rounded-xs px-0.5',
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500 ring-2 ring-brand-500/40 z-20'
                        : hasPendingEdit
                        ? 'bg-emerald-500/20 border-emerald-500 z-10'
                        : 'border-transparent hover:border-brand-400/60 hover:bg-brand-50/30'
                    )}
                    style={{
                      left: `${item.x * 100}%`,
                      top: `${item.y * 100}%`,
                      width: `${item.width * 100}%`,
                      height: `${item.height * 100}%`,
                    }}
                    title={`Click to select, double-click or Enter to edit: "${hasPendingEdit ? hasPendingEdit.newText : item.text}"`}
                  >
                    {hasPendingEdit && (
                      <span className="absolute -top-3 -right-2 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                    )}
                  </div>
                );
              })}

            {/* OVERLAY: SCANNED NEURAL OCR WORD BOXES (MODE: scanned-ocr) */}
            {mode === 'scanned-ocr' &&
              ocrWords.map((w) => {
                const isSelected = selectedOcrWord?.id === w.id;
                const hasEdit = scannedEdits.find((e) => e.id === w.id);

                if (inlineEditingOcrId === w.id) {
                  return (
                    <input
                      key={`input_${w.id}`}
                      type="text"
                      value={inlineOcrValue}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setInlineOcrValue(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitInlineOcr(w, inlineOcrValue);
                        } else if (e.key === 'Escape') {
                          setInlineEditingOcrId(null);
                        }
                      }}
                      onBlur={() => commitInlineOcr(w, inlineOcrValue)}
                      className="absolute z-30 bg-white dark:bg-slate-900 border-2 border-amber-500 rounded px-1 text-slate-900 dark:text-white shadow-xl outline-none font-sans"
                      style={{
                        left: `${w.bbox.x1 <= 1.05 ? w.bbox.x0 * 100 : (w.bbox.x0 / (canvasRef.current?.width || 1)) * 100}%`,
                        top: `${w.bbox.y1 <= 1.05 ? w.bbox.y0 * 100 : (w.bbox.y0 / (canvasRef.current?.height || 1)) * 100}%`,
                        minWidth: `${Math.max(w.bbox.x1 <= 1.05 ? (w.bbox.x1 - w.bbox.x0) * 100 : ((w.bbox.x1 - w.bbox.x0) / (canvasRef.current?.width || 1)) * 100, 10)}%`,
                        height: `${Math.max(w.bbox.y1 <= 1.05 ? (w.bbox.y1 - w.bbox.y0) * 100 : ((w.bbox.y1 - w.bbox.y0) / (canvasRef.current?.height || 1)) * 100, 3.5)}%`,
                        fontSize: `${Math.max(12, Math.round(w.bbox.y1 <= 1.05 ? (w.bbox.y1 - w.bbox.y0) * (canvasRef.current?.height || 800) : (w.bbox.y1 - w.bbox.y0)))}px`,
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={w.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectOcrWord(w);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleSelectOcrWord(w);
                      setInlineEditingOcrId(w.id);
                      const existing = scannedEdits.find((ed) => ed.id === w.id);
                      setInlineOcrValue(existing ? existing.newText : w.text);
                    }}
                    className={cn(
                      'absolute cursor-pointer border rounded-2xs transition-all',
                      isSelected
                        ? 'bg-amber-500/30 border-amber-500 ring-2 ring-amber-500/40 z-20'
                        : hasEdit
                        ? 'bg-purple-500/30 border-purple-500 z-10'
                        : w.confidence >= 85
                        ? 'border-transparent hover:border-emerald-400/80 hover:bg-emerald-50/20'
                        : w.confidence >= 60
                        ? 'border-transparent hover:border-amber-400/80 hover:bg-amber-50/20'
                        : 'border-transparent hover:border-rose-400/80 hover:bg-rose-50/20'
                    )}
                    style={{
                      left: `${w.bbox.x1 <= 1.05 ? w.bbox.x0 * 100 : (w.bbox.x0 / (canvasRef.current?.width || 1)) * 100}%`,
                      top: `${w.bbox.y1 <= 1.05 ? w.bbox.y0 * 100 : (w.bbox.y0 / (canvasRef.current?.height || 1)) * 100}%`,
                      width: `${w.bbox.x1 <= 1.05 ? Math.max((w.bbox.x1 - w.bbox.x0) * 100, 1.5) : Math.max(((w.bbox.x1 - w.bbox.x0) / (canvasRef.current?.width || 1)) * 100, 1.5)}%`,
                      height: `${w.bbox.y1 <= 1.05 ? Math.max((w.bbox.y1 - w.bbox.y0) * 100, 2) : Math.max(((w.bbox.y1 - w.bbox.y0) / (canvasRef.current?.height || 1)) * 100, 2)}%`,
                    }}
                    title={`Recognized word: "${hasEdit ? hasEdit.newText : w.text}" (${Math.round(w.confidence)}% confidence) - Double-click to edit directly`}
                  />
                );
              })}

            {/* OVERLAY: ANNOTATIONS & REDACTIONS (MODE: annotate) */}
            {mode === 'annotate' &&
              annotations
                .filter((a) => a.pageNumber === currentPageIndex + 1)
                .map((ann) => (
                  <div
                    key={ann.id}
                    className={cn(
                      'absolute pointer-events-none rounded-xs',
                      ann.type === 'whiteout' && 'bg-white border border-slate-200',
                      ann.type === 'redaction' && 'bg-black shadow-xs',
                      ann.type === 'highlight' && 'bg-yellow-300/40',
                      ann.type === 'shape-rect' && 'border-2 border-brand-500'
                    )}
                    style={{
                      left: `${ann.x * 100}%`,
                      top: `${ann.y * 100}%`,
                      width: ann.type === 'text' ? 'auto' : `${ann.width * 100}%`,
                      height: ann.type === 'text' ? 'auto' : `${ann.height * 100}%`,
                      color: ann.color,
                      fontSize: ann.fontSize ? `${ann.fontSize}px` : undefined,
                    }}
                  >
                    {ann.type === 'text' && (
                      <span className="font-semibold bg-white/90 dark:bg-black/90 px-1 rounded shadow-xs">
                        {ann.text}
                      </span>
                    )}
                  </div>
                ))}
          </div>
        </main>

        {/* RIGHT PANEL: CONTEXTUAL TOOL PROPERTIES */}
        <aside className="w-80 bg-white dark:bg-[#0a0d1e] border-l border-slate-200 dark:border-violet-500/15 p-4 overflow-y-auto flex flex-col justify-between shrink-0 z-10 shadow-subtle">
          <div className="space-y-4">
            {/* Top Tab switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#070915] p-1 rounded-xl mb-1 border border-slate-200 dark:border-violet-500/15">
              <button
                onClick={() => setRightPanelTab('tools')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5',
                  rightPanelTab === 'tools'
                    ? 'bg-white dark:bg-[#161a38] text-brand-600 dark:text-violet-300 shadow-2xs font-bold border border-violet-500/20'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Tool Settings</span>
              </button>
              <button
                onClick={() => setRightPanelTab('properties')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5',
                  rightPanelTab === 'properties'
                    ? 'bg-white dark:bg-[#161a38] text-brand-600 dark:text-violet-300 shadow-2xs font-bold border border-violet-500/20'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                )}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Properties</span>
              </button>
            </div>

            {rightPanelTab === 'properties' ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 dark:border-violet-500/15 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-violet-400" />
                    <span>Document Properties & Metadata</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Acrobat-grade specification inspector and client-side metadata editor.
                  </p>
                </div>

                {/* Metadata Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Untitled Document"
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-violet-500/20 bg-white dark:bg-[#070915] p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Author / Creator
                    </label>
                    <input
                      type="text"
                      value={metaAuthor}
                      onChange={(e) => setMetaAuthor(e.target.value)}
                      placeholder="Author name or organization"
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-violet-500/20 bg-white dark:bg-[#070915] p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Subject / Description
                    </label>
                    <textarea
                      rows={2}
                      value={metaSubject}
                      onChange={(e) => setMetaSubject(e.target.value)}
                      placeholder="Brief summary or classification"
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-violet-500/20 bg-white dark:bg-[#070915] p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={handleSaveMetadata}
                    disabled={isSavingMeta}
                    className="w-full text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingMeta ? 'Saving Metadata...' : 'Save Properties into PDF'}</span>
                  </Button>
                </div>

                {/* Technical Specifications Table */}
                <div className="pt-3 border-t border-slate-100 dark:border-violet-500/15 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Technical Specifications
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070915] border border-slate-200 dark:border-violet-500/15 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">File Name:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[140px]" title={currentFile.name}>
                        {currentFile.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">File Size:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{formatBytes(currentFile.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Page Count:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">{totalPages} pages</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PDF Standard:</span>
                      <span className="font-mono font-semibold text-violet-400">PDF 1.7 (ISO 32000)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fast Web View:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Client-Side Ready (Fast Byte Range)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Security:</span>
                      <span className="font-medium text-emerald-400">
                        {healthReport?.isEncrypted ? 'Password Protected' : 'No Restrictions'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Producer:</span>
                      <span className="font-mono text-[10px] text-slate-400">OmniPDF Engine</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* CONTEXT 1: VECTOR TEXT EDIT */}
                {mode === 'edit-text' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-brand-600" />
                    <span>True Vector Text Editor</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {isLoadingVectorText ? 'Loading...' : `${vectorItems.length} text items`}
                  </span>
                </div>

                {selectedVectorItem ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Edit Text Content
                      </label>
                      <textarea
                        rows={2}
                        value={vectorNewText}
                        onChange={(e) => setVectorNewText(e.target.value)}
                        className="w-full text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-medium text-slate-500 mb-1 block">Font Family</label>
                        <select
                          value={vectorFontFamily}
                          onChange={(e) => setVectorFontFamily(e.target.value as any)}
                          className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                        >
                          <option value="sans">Helvetica (Sans)</option>
                          <option value="serif">Times (Serif)</option>
                          <option value="mono">Courier (Mono)</option>
                          <option value="bold">Helvetica Bold</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-medium text-slate-500 mb-1 block">Font Size</label>
                        <input
                          type="number"
                          value={vectorFontSize}
                          onChange={(e) => setVectorFontSize(parseInt(e.target.value) || 12)}
                          className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-medium text-slate-500 mb-1 block">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={vectorFontColor}
                          onChange={(e) => setVectorFontColor(e.target.value)}
                          className="w-7 h-7 rounded border-0 cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-500 uppercase">{vectorFontColor}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                      <Button size="sm" variant="destructive" onClick={handleDeleteVectorItem} className="text-xs gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </Button>
                      <Button size="sm" variant="primary" onClick={handleApplyVectorEdit} className="text-xs gap-1">
                        <Check className="w-3.5 h-3.5" /> Apply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 px-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Click any line or word directly on the document canvas to modify or erase it.
                    </p>
                  </div>
                )}

                {vectorEdits.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Pending Vector Edits</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px]">
                        {vectorEdits.length}
                      </span>
                    </div>
                    <Button
                      onClick={handleSaveAllVectorEdits}
                      disabled={isSavingVector}
                      className="w-full text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSavingVector ? 'Saving Vector Text...' : 'Save Vector Changes'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* CONTEXT 2: SCANNED OCR EDIT */}
            {mode === 'scanned-ocr' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ScanText className="w-4 h-4 text-amber-600" />
                    <span>Neural OCR Scanned Editor</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Extract text from scanned pages and replace typos with tone-matched background patches.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block">
                    OCR Language
                  </label>
                  <select
                    value={ocrLang}
                    onChange={(e) => setOcrLang(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                  >
                    <option value="eng">English (eng)</option>
                    <option value="spa">Spanish (spa)</option>
                    <option value="fra">French (fra)</option>
                    <option value="deu">German (deu)</option>
                    <option value="ita">Italian (ita)</option>
                  </select>

                  <Button
                    onClick={handleRunOcrOnCurrentPage}
                    disabled={isOcrRunning}
                    className="w-full text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium mt-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isOcrRunning ? 'Running Tesseract OCR...' : 'Analyze Page with OCR'}
                  </Button>
                </div>

                {selectedOcrWord && (
                  <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Original: <span className="font-mono text-amber-600 font-bold">"{selectedOcrWord.text}"</span>
                    </div>
                    <input
                      type="text"
                      value={ocrReplacementText}
                      onChange={(e) => setOcrReplacementText(e.target.value)}
                      placeholder="Type replacement word..."
                      className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
                    />
                    <div className="flex justify-end pt-1">
                      <Button size="sm" onClick={handleApplyScannedWordEdit} className="text-xs gap-1 bg-amber-600 hover:bg-amber-700 text-white">
                        <Check className="w-3.5 h-3.5" /> Replace Word
                      </Button>
                    </div>
                  </div>
                )}

                {/* Pending Scanned Edits & Burn Button */}
                {scannedEdits.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>Pending Scanned Edits</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                        {scannedEdits.length}
                      </span>
                    </div>
                    <Button
                      onClick={handleSaveAllScannedEdits}
                      disabled={isSavingScanned}
                      className="w-full text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSavingScanned ? 'Reconstructing Page...' : 'Save & Reconstruct Page'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* CONTEXT 3: ANNOTATE & REDACTION */}
            {mode === 'annotate' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-brand-600" />
                    <span>Markup, Redact & Draw</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'text', label: 'Text Box', icon: Type },
                    { id: 'highlight', label: 'Highlighter', icon: Highlighter },
                    { id: 'shape-rect', label: 'Rectangle', icon: Square },
                    { id: 'whiteout', label: 'Whiteout', icon: Eraser },
                    { id: 'redaction', label: 'Permanent Blackout', icon: ShieldAlert },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = annTool === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setAnnTool(t.id as any)}
                        className={cn(
                          'p-2 rounded-lg text-xs font-medium flex items-center gap-2 border transition-all text-left',
                          isActive
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {annTool === 'text' && (
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Stamp Text</label>
                    <input
                      type="text"
                      value={annText}
                      onChange={(e) => setAnnText(e.target.value)}
                      className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Ink Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={annColor}
                      onChange={(e) => setAnnColor(e.target.value)}
                      className="w-7 h-7 rounded border-0 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-500 uppercase">{annColor}</span>
                  </div>
                </div>

                {annotations.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      onClick={handleBurnAnnotations}
                      className="w-full text-xs gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium"
                    >
                      <Save className="w-3.5 h-3.5" /> Burn Annotations ({annotations.length})
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* CONTEXT 4: ORGANIZE PAGES */}
            {mode === 'organize' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <LayoutGrid className="w-4 h-4 text-brand-600" />
                    <span>Page Organization</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rotatePage(currentPageItem?.id || '', 90)}
                    className="w-full text-xs gap-2 justify-start"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Rotate Current Page 90°
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicatePage(currentPageItem?.id || '')}
                    className="w-full text-xs gap-2 justify-start"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicate Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => insertBlankPageAt(currentPageIndex + 1)}
                    className="w-full text-xs gap-2 justify-start"
                  >
                    <Plus className="w-3.5 h-3.5" /> Insert Blank Page After
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={reverseAllPages}
                    className="w-full text-xs gap-2 justify-start"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reverse All Page Order
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeDetectedBlankPages}
                    className="w-full text-xs gap-2 justify-start"
                  >
                    <Eraser className="w-3.5 h-3.5" /> Auto-Remove Blank Pages
                  </Button>
                </div>
              </div>
            )}

            {/* CONTEXT 5: SIGN */}
            {mode === 'sign' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4 text-brand-600" />
                    <span>Visual Signature Stamp</span>
                  </h3>
                </div>

                <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs">
                  {(['draw', 'type', 'upload'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSigType(t)}
                      className={cn(
                        'flex-1 py-1.5 font-medium border-b-2 capitalize text-center',
                        sigType === t
                          ? 'border-brand-600 text-brand-600 font-bold'
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {sigType === 'type' && (
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Full Name</label>
                    <input
                      type="text"
                      value={typedSigName}
                      onChange={(e) => setTypedSigName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 font-serif text-lg italic text-brand-700"
                    />
                  </div>
                )}

                {sigType === 'upload' && (
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Signature Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setSigDataUrl(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-slate-500"
                    />
                  </div>
                )}

                <Button
                  onClick={handleSignaturePlacement}
                  className="w-full text-xs gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium"
                >
                  <Stamp className="w-3.5 h-3.5" /> Place Signature on Document
                </Button>
              </div>
            )}

            {/* CONTEXT 6: WATERMARK & NUMBERS */}
            {mode === 'watermark' && (
              <div className="space-y-4">
                <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => setWmTab('add')}
                    className={cn(
                      'flex-1 py-1.5 font-medium border-b-2 text-center',
                      wmTab === 'add'
                        ? 'border-brand-600 text-brand-600 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    )}
                  >
                    Add Stamp
                  </button>
                  <button
                    onClick={() => setWmTab('remove')}
                    className={cn(
                      'flex-1 py-1.5 font-medium border-b-2 text-center',
                      wmTab === 'remove'
                        ? 'border-rose-600 text-rose-600 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    )}
                  >
                    Remove Stamp
                  </button>
                </div>

                {wmTab === 'add' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Stamp Text</label>
                      <input
                        type="text"
                        value={wmText}
                        onChange={(e) => setWmText(e.target.value)}
                        className="w-full text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 font-bold uppercase"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Opacity</span>
                        <span>{Math.round(wmOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={wmOpacity}
                        onChange={(e) => setWmOpacity(parseFloat(e.target.value))}
                        className="w-full accent-brand-600 h-1.5 bg-slate-200 rounded mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500">
                      Select watermark ink color to suppress and lift from document text.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={wmRemoveColor}
                        onChange={(e) => setWmRemoveColor(e.target.value)}
                        className="w-7 h-7 rounded border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono uppercase text-slate-500">{wmRemoveColor}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleApplyWatermarkAction}
                  className={cn(
                    'w-full text-xs gap-1.5 font-medium',
                    wmTab === 'add' ? 'bg-brand-600 hover:bg-brand-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
                  )}
                >
                  <Check className="w-3.5 h-3.5" />
                  {wmTab === 'add' ? 'Apply Watermark' : 'Erase Watermark Stamp'}
                </Button>
              </div>
            )}

            {/* CONTEXT 7: COMPRESS */}
            {mode === 'compress' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Minimize2 className="w-4 h-4 text-brand-600" />
                    <span>Document Compression</span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {[
                    { id: 'balanced', label: 'Balanced (150 DPI)', desc: 'Best for web and email sharing' },
                    { id: 'extreme', label: 'Extreme (72 DPI)', desc: 'Maximum byte reduction' },
                    { id: 'custom', label: 'Custom Quality', desc: 'Manual DPI & compression control' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setCompPreset(p.id as any)}
                      className={cn(
                        'w-full p-2.5 rounded-xl border text-left text-xs transition-all',
                        compPreset === p.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      )}
                    >
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{p.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{p.desc}</div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleApplyCompressionAction}
                  className="w-full text-xs gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium"
                >
                  <Minimize2 className="w-3.5 h-3.5" /> Compress Document Now
                </Button>
              </div>
            )}
              </>
            )}
          </div>

          {/* Quick Document Stats Footer in Right Sidebar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Pages:</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">{totalPages}</span>
            </div>
            <div className="flex justify-between">
              <span>File Size:</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">{formatBytes(currentFile.size)}</span>
            </div>
            <div className="flex justify-between">
              <span>Encrypted:</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">{healthReport?.isEncrypted ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM STATUS BAR */}
      <footer className="h-9 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-500 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{statusMessage}</span>
          </span>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
            disabled={currentPageIndex === 0}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Page {currentPageIndex + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPageIndex === totalPages - 1}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-slate-400">
          <span>{Math.round(scale * 100)}%</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Client-Side Privacy
          </span>
        </div>
      </footer>

      {/* EXPORT CENTER MODAL */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Export Center</h3>
                  <p className="text-xs text-slate-500">Inspect and download your validated document</p>
                </div>
              </div>
              <button
                onClick={() => setIsExportOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Export File Name
                </label>
                <input
                  type="text"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Output Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pdf', label: 'PDF Document', ext: '.pdf' },
                    { id: 'images-zip', label: 'Image Bundle', ext: '.zip' },
                    { id: 'text', label: 'Plain Text', ext: '.txt' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setExportFormat(fmt.id as any)}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-medium text-center transition-all',
                        exportFormat === fmt.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      )}
                    >
                      <div>{fmt.label}</div>
                      <div className="text-[10px] text-slate-400">{fmt.ext}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Pages:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{totalPages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Size:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatBytes(currentFile.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fidelity:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Vector Preserved</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setIsExportOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExecuteExport}
                disabled={isExporting}
                className="gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-medium"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Generating Bundle...' : 'Download Document'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS MODAL */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-600" /> Keyboard Shortcuts
              </h3>
              <button onClick={() => setIsShortcutsOpen(false)} className="p-1 rounded text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { key: 'Ctrl + Z', desc: 'Undo edit operation' },
                { key: 'Ctrl + Y', desc: 'Redo edit operation' },
                { key: 'Ctrl + S', desc: 'Open Export Center' },
                { key: 'Ctrl + F', desc: 'Find text in document' },
                { key: 'Esc', desc: 'Close dialogs & deselect' },
                { key: '?', desc: 'Show this shortcuts help' },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold">
                    {s.key}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
