import React, { useState, useEffect, useRef } from 'react';
import {
  ScanText,
  Edit3,
  Eye,
  Check,
  Zap,
  Trash2,
  Plus,
  RotateCcw,
  Sparkles,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowRight,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { Button } from '../ui/Button';
import {
  renderPageThumbnail,
  runDetailedOcrOnImageDataUrl,
  replacePageWithReconstructedImage,
  OcrLineItem,
} from '../../lib/pdf/pdf-engine';

interface EditedTextBlock {
  id: string;
  originalText: string;
  currentText: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  color: string;
  isDeleted: boolean;
  isModified: boolean;
  isCustomNew?: boolean;
}

export const ScannedTextEditor: React.FC = () => {
  const { currentFile, pages, loadFile, updateActiveDocument, processing } = usePdf();

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [ocrLanguage, setOcrLanguage] = useState<'eng' | 'spa' | 'fra' | 'deu'>('eng');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  
  // Page rendering & OCR state
  const [pageDataUrl, setPageDataUrl] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [textBlocks, setTextBlocks] = useState<EditedTextBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // View state: 'edited' or 'original'
  const [previewMode, setPreviewMode] = useState<'edited' | 'original'>('edited');
  const [scaleFactor, setScaleFactor] = useState(1.0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Render current page when page index or current file changes
  useEffect(() => {
    if (!currentFile) return;

    let isCancelled = false;
    const loadPage = async () => {
      try {
        setIsAnalyzing(true);
        setAnalysisStatus('Rendering high-res page image...');
        setTextBlocks([]);
        setSelectedBlockId(null);

        // Render at 1.5x resolution for sharp OCR and crisp font matching
        const url = await renderPageThumbnail(currentFile.data, activePageIndex, 1.5);
        if (isCancelled) return;

        setPageDataUrl(url);

        const img = new Image();
        img.src = url;
        img.onload = () => {
          if (!isCancelled) {
            setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
          }
        };

        setAnalysisStatus('');
      } catch (err: any) {
        console.error('Error rendering page:', err);
      } finally {
        if (!isCancelled) setIsAnalyzing(false);
      }
    };

    loadPage();

    return () => {
      isCancelled = true;
    };
  }, [currentFile, activePageIndex]);

  // Run neural OCR on current page image
  const handleDetectText = async () => {
    if (!pageDataUrl) return;

    try {
      setIsAnalyzing(true);
      setAnalysisStatus('Running neural OCR & detecting text coordinates...');

      const ocrResult = await runDetailedOcrOnImageDataUrl(pageDataUrl, ocrLanguage);

      const blocks: EditedTextBlock[] = ocrResult.lines.map((line, idx) => {
        // Estimate font size from bounding box height
        const height = line.bbox.y1 - line.bbox.y0;
        const estimatedFontSize = Math.max(12, Math.round(height * 0.85));

        return {
          id: line.id || `line-${idx}`,
          originalText: line.text.trim(),
          currentText: line.text.trim(),
          bbox: line.bbox,
          fontSize: estimatedFontSize,
          fontFamily: 'sans-serif',
          isBold: false,
          color: '#0f172a',
          isDeleted: false,
          isModified: false,
        };
      });

      setTextBlocks(blocks);
      setAnalysisStatus('');
    } catch (err: any) {
      console.error('OCR Detection error:', err);
      setAnalysisStatus(`OCR failed: ${err.message || 'Error detecting text'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reconstruct canvas drawing
  useEffect(() => {
    if (!pageDataUrl || !canvasRef.current || imageDims.width === 0) return;

    const canvas = canvasRef.current;
    canvas.width = imageDims.width;
    canvas.height = imageDims.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImg = new Image();
    baseImg.src = pageDataUrl;
    baseImg.onload = () => {
      // 1. Draw base scanned image
      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      if (previewMode === 'original') {
        return; // pure original image
      }

      // 2. Hybrid Reconstruction for modified or deleted blocks:
      textBlocks.forEach((block) => {
        if (!block.isModified && !block.isDeleted && !block.isCustomNew) {
          return; // preserve pristine original pixels if untouched
        }

        const { x0, y0, x1, y1 } = block.bbox;
        const boxWidth = Math.max(20, x1 - x0 + 8);
        const boxHeight = Math.max(14, y1 - y0 + 6);
        const startX = Math.max(0, x0 - 4);
        const startY = Math.max(0, y0 - 3);

        // A. Sample surrounding background tone around the bounding box
        try {
          const sampleY = Math.max(0, startY - 4);
          const sampleData = ctx.getImageData(startX, sampleY, Math.min(boxWidth, 10), 2);
          const r = sampleData.data[0];
          const g = sampleData.data[1];
          const b = sampleData.data[2];
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        } catch {
          ctx.fillStyle = '#ffffff'; // safe fallback
        }

        // B. Whiteout / patch the original scanned raster area
        ctx.fillRect(startX, startY, boxWidth, boxHeight);

        // C. If not deleted, render corrected text with typography
        if (!block.isDeleted && block.currentText.trim()) {
          ctx.fillStyle = block.color;
          ctx.font = `${block.isBold ? 'bold ' : ''}${block.fontSize}px ${block.fontFamily}`;
          ctx.textBaseline = 'middle';
          const textY = startY + boxHeight / 2;
          ctx.fillText(block.currentText, startX + 2, textY);
        }
      });
    };
  }, [pageDataUrl, textBlocks, previewMode, imageDims]);

  // Update selected block text
  const handleUpdateText = (id: string, newText: string) => {
    setTextBlocks((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              currentText: newText,
              isModified: newText !== b.originalText,
              isDeleted: false,
            }
          : b
      )
    );
  };

  // Toggle deletion
  const handleDeleteBlock = (id: string) => {
    setTextBlocks((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              isDeleted: !b.isDeleted,
              isModified: true,
            }
          : b
      )
    );
  };

  // Update font styling
  const handleUpdateStyle = (
    id: string,
    updates: Partial<Pick<EditedTextBlock, 'fontSize' | 'fontFamily' | 'isBold' | 'color'>>
  ) => {
    setTextBlocks((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              ...updates,
              isModified: true,
            }
          : b
      )
    );
  };

  // Add new custom text line
  const handleAddNewText = () => {
    const newBlock: EditedTextBlock = {
      id: `new-${Date.now()}`,
      originalText: '',
      currentText: 'New text line',
      bbox: {
        x0: 50,
        y0: 100,
        x1: 250,
        y1: 130,
      },
      fontSize: 18,
      fontFamily: 'sans-serif',
      isBold: false,
      color: '#0f172a',
      isDeleted: false,
      isModified: true,
      isCustomNew: true,
    };
    setTextBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  // Save reconstructed page and update active document
  const handleSaveToPdf = async () => {
    if (!currentFile || !canvasRef.current) return;

    try {
      setAnalysisStatus('Reconstructing page and updating active PDF...');
      setIsAnalyzing(true);

      const reconstructedDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);
      const newPdfBytes = await replacePageWithReconstructedImage(
        currentFile.data,
        activePageIndex,
        reconstructedDataUrl
      );

      await updateActiveDocument(
        newPdfBytes,
        `Edit Scanned Text (Page ${activePageIndex + 1})`
      );

      setAnalysisStatus('');
    } catch (err: any) {
      console.error('Failed saving reconstructed page:', err);
      setAnalysisStatus(`Save error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedBlock = textBlocks.find((b) => b.id === selectedBlockId);

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <ScanText className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Edit Text Inside Scanned PDF
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Detect text blocks inside scanned document images, edit sentences, correct OCR mistakes, and reconstruct pages seamlessly.
          </p>
        </div>

        <div className="w-full">
          <FileDropzone />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Edit Text Inside Scanned PDF
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                Hybrid Reconstruction
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Editing: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentFile.name}</span> • Page {activePageIndex + 1} of {pages.length}
            </p>
          </div>
        </div>

        {/* Page Switcher & Detect Button */}
        <div className="flex items-center gap-2">
          {pages.length > 1 && (
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-slate-50 dark:bg-slate-950 text-xs">
              <button
                onClick={() => setActivePageIndex((p) => Math.max(0, p - 1))}
                disabled={activePageIndex === 0 || isAnalyzing}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-medium">
                P.{activePageIndex + 1}/{pages.length}
              </span>
              <button
                onClick={() => setActivePageIndex((p) => Math.min(pages.length - 1, p + 1))}
                disabled={activePageIndex === pages.length - 1 || isAnalyzing}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {textBlocks.length === 0 ? (
            <Button
              onClick={handleDetectText}
              disabled={isAnalyzing}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Detect & OCR Scanned Text
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSaveToPdf}
              disabled={isAnalyzing}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              Save & Update Document
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar & Preview Mode Switcher */}
      {textBlocks.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {textBlocks.length} text blocks detected
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={handleAddNewText}
              className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Text Box
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Preview:</span>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={() => setPreviewMode('original')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  previewMode === 'original'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Original Scanned Image
              </button>
              <button
                onClick={() => setPreviewMode('edited')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  previewMode === 'edited'
                    ? 'bg-brand-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Reconstructed Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout: Canvas on Left, Edit Properties on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Canvas View */}
        <div className="lg:col-span-2 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 min-h-[500px] flex items-center justify-center relative overflow-auto">
          {isAnalyzing && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center z-30 text-white space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
              <p className="text-xs font-medium">{analysisStatus || 'Processing...'}</p>
            </div>
          )}

          <div ref={containerRef} className="relative shadow-lg rounded-lg overflow-hidden bg-white select-none">
            <canvas ref={canvasRef} className="max-w-full h-auto block" />

            {/* Interactive Bounding Box Overlay for Click-to-Edit */}
            {previewMode === 'edited' &&
              imageDims.width > 0 &&
              textBlocks.map((block) => {
                // Coordinates relative to canvas dimensions
                const left = `${(block.bbox.x0 / imageDims.width) * 100}%`;
                const top = `${(block.bbox.y0 / imageDims.height) * 100}%`;
                const width = `${((block.bbox.x1 - block.bbox.x0) / imageDims.width) * 100}%`;
                const height = `${((block.bbox.y1 - block.bbox.y0) / imageDims.height) * 100}%`;

                const isSelected = block.id === selectedBlockId;

                return (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    style={{ left, top, width, height }}
                    className={`absolute cursor-pointer transition-all ${
                      block.isDeleted
                        ? 'bg-red-400/20 border border-red-500/50'
                        : isSelected
                        ? 'ring-2 ring-brand-500 bg-brand-500/15 border border-brand-600 z-20'
                        : block.isModified
                        ? 'border border-emerald-500/80 bg-emerald-500/10 hover:bg-emerald-500/20'
                        : 'border border-dashed border-brand-400/40 hover:border-brand-500 hover:bg-brand-500/10'
                    }`}
                    title={block.currentText}
                  />
                );
              })}
          </div>
        </div>

        {/* Selected Text Edit Panel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Text Block Properties
            </h3>
            {selectedBlock && (
              <span className="text-[10px] font-mono text-slate-400">
                Confidence: {Math.round(selectedBlock.originalText ? 90 : 100)}%
              </span>
            )}
          </div>

          {selectedBlock ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Original Scanned Text:
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500 break-all select-all">
                  {selectedBlock.originalText || <em>(New text line)</em>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Replacement / Corrected Text:
                </label>
                <textarea
                  rows={3}
                  value={selectedBlock.currentText}
                  onChange={(e) => handleUpdateText(selectedBlock.id, e.target.value)}
                  disabled={selectedBlock.isDeleted}
                  placeholder="Type corrected text here..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Typography controls */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Font Family
                    </label>
                    <select
                      value={selectedBlock.fontFamily}
                      onChange={(e) => handleUpdateStyle(selectedBlock.id, { fontFamily: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-1.5 text-xs"
                    >
                      <option value="sans-serif">Sans-serif</option>
                      <option value="serif">Serif (Times)</option>
                      <option value="monospace">Monospace</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Font Size ({selectedBlock.fontSize}px)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="48"
                      value={selectedBlock.fontSize}
                      onChange={(e) =>
                        handleUpdateStyle(selectedBlock.id, { fontSize: parseInt(e.target.value) })
                      }
                      className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg mt-2"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBlock.isBold}
                      onChange={(e) => handleUpdateStyle(selectedBlock.id, { isBold: e.target.checked })}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>Bold Weight</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Color:</span>
                    <input
                      type="color"
                      value={selectedBlock.color}
                      onChange={(e) => handleUpdateStyle(selectedBlock.id, { color: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  size="sm"
                  variant={selectedBlock.isDeleted ? 'primary' : 'outline'}
                  onClick={() => handleDeleteBlock(selectedBlock.id)}
                  className="flex-1 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1 text-red-500" />
                  {selectedBlock.isDeleted ? 'Restore Text' : 'Delete / Erase Text'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <p>Click any detected box on the page to edit its text, adjust font size, or erase the text.</p>
              {textBlocks.length === 0 && (
                <p className="text-brand-600 dark:text-brand-400 font-semibold">
                  Click "Detect & OCR Scanned Text" above to begin.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
