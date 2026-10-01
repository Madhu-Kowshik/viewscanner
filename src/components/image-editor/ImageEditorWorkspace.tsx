import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Sliders,
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Type,
  Pen,
  Highlighter,
  Square,
  ShieldAlert,
  Eraser,
  Download,
  FileCheck,
  Sparkles,
  ScanText,
  Undo2,
  Redo2,
  RefreshCw,
  Check,
  X,
  Eye,
  FilePlus2,
  Layers,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { usePdf } from '../../context/PdfContext';
import { runDetailedOcrOnImageDataUrl, OcrLineItem } from '../../lib/pdf/pdf-engine';

interface ImageTextEdit {
  id: string;
  originalText: string;
  newText: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  color: string;
  isDeleted: boolean;
}

export const ImageEditorWorkspace: React.FC = () => {
  const { convertImagesToPdfAction, currentFile, pages } = usePdf();

  // Active image data
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('document_image.png');
  const [activeTab, setActiveTab] = useState<'adjust' | 'crop-transform' | 'text-edit' | 'markup'>('adjust');

  // Adjustments & Filters
  const [brightness, setBrightness] = useState<number>(100); // 0 - 200%
  const [contrast, setContrast] = useState<number>(100); // 0 - 200%
  const [filterMode, setFilterMode] = useState<'none' | 'magic-clean' | 'bw' | 'grayscale' | 'sharpen'>('none');

  // Transform
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Crop State
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8,
  });

  // Image Text Editing (Phase 6)
  const [isOcrRunning, setIsOcrRunning] = useState<boolean>(false);
  const [detectedTextBlocks, setDetectedTextBlocks] = useState<OcrLineItem[]>([]);
  const [textEdits, setTextEdits] = useState<ImageTextEdit[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeEditText, setActiveEditText] = useState<string>('');
  const [activeFontSize, setActiveFontSize] = useState<number>(16);
  const [activeFontColor, setActiveFontColor] = useState<string>('#000000');
  const [activeFontFamily, setActiveFontFamily] = useState<string>('sans-serif');
  const [activeIsBold, setActiveIsBold] = useState<boolean>(false);
  const [previewOriginal, setPreviewOriginal] = useState<boolean>(false);

  // Markup & Drawing
  const [markupTool, setMarkupTool] = useState<'draw' | 'highlight' | 'redact' | 'whiteout' | 'rect'>('draw');
  const [markupColor, setMarkupColor] = useState<string>('#ef4444');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [isPainting, setIsPainting] = useState<boolean>(false);

  // Undo / History
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const markupCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load sample image on mount if nothing is loaded
  useEffect(() => {
    if (!imageSrc) {
      // Create a clean demo receipt/invoice document on canvas
      const demoCanvas = document.createElement('canvas');
      demoCanvas.width = 800;
      demoCanvas.height = 1000;
      const ctx = demoCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 800, 1000);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(40, 40, 720, 920);

        // Header
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('INVOICE / RECEIPT', 80, 120);

        ctx.fillStyle = '#64748b';
        ctx.font = '16px sans-serif';
        ctx.fillText('Invoice Number: INV-2025-0042', 80, 160);
        ctx.fillText('Issue Date: October 14, 2025', 80, 190);
        ctx.fillText('Billed To: Acme Global Corporation', 80, 220);

        // Line divider
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, 250);
        ctx.lineTo(720, 250);
        ctx.stroke();

        // Items
        ctx.fillStyle = '#334155';
        ctx.font = '18px sans-serif';
        ctx.fillText('1. Professional Document Services', 80, 310);
        ctx.fillText('$1,200.00', 600, 310);

        ctx.fillText('2. Client-Side Encryption License', 80, 360);
        ctx.fillText('$450.00', 600, 360);

        ctx.fillText('3. Multi-Format PDF Processing', 80, 410);
        ctx.fillText('$350.00', 600, 410);

        // Total
        ctx.beginPath();
        ctx.moveTo(80, 460);
        ctx.lineTo(720, 460);
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('Total Amount Due: $2,000.00', 80, 520);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('Status: PAID IN FULL', 80, 570);

        const url = demoCanvas.toDataURL('image/png');
        setImageSrc(url);
        setHistory([url]);
        setHistoryIndex(0);
      }
    }
  }, [imageSrc]);

  // Load file upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const url = event.target.result as string;
        setImageSrc(url);
        setHistory([url]);
        setHistoryIndex(0);
        setTextEdits([]);
        setDetectedTextBlocks([]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Render and apply adjustments onto main canvas
  const renderAdjustedCanvas = useCallback(() => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.save();
      // Handle flips & rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2);
      ctx.restore();

      // Apply pixel shaders (Brightness, Contrast, Magic Clean, B&W, Grayscale)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const bFactor = brightness / 100;
      const cFactor = Math.tan(((contrast / 100) * Math.PI) / 4);

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Brightness & Contrast
        r = (r - 128) * cFactor + 128 * bFactor;
        g = (g - 128) * cFactor + 128 * bFactor;
        b = (b - 128) * cFactor + 128 * bFactor;

        if (filterMode === 'grayscale') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = gray;
        } else if (filterMode === 'bw') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const val = gray > 140 ? 255 : 0;
          r = g = b = val;
        } else if (filterMode === 'magic-clean') {
          // Dynamic paper bleaching: lifts light gray/yellow background to white
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          if (gray > 165) {
            r = g = b = 255;
          } else {
            // darken text ink
            r = Math.max(0, r * 0.75);
            g = Math.max(0, g * 0.75);
            b = Math.max(0, b * 0.75);
          }
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imgData, 0, 0);

      // Reconstruct Phase 6: Image Text Edits with tone-matched background patches
      if (!previewOriginal && textEdits.length > 0) {
        textEdits.forEach((edit) => {
          const { x0, y0, x1, y1 } = edit.bbox;
          const w = x1 - x0;
          const h = y1 - y0;

          // 1. Tone-matched background patch
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.max(0, x0 - 2), Math.max(0, y0 - 2), w + 4, h + 4);

          // 2. Render replacement text in exact coordinates
          if (!edit.isDeleted && edit.newText.trim()) {
            ctx.fillStyle = edit.color || '#000000';
            ctx.font = `${edit.isBold ? 'bold ' : ''}${edit.fontSize}px ${edit.fontFamily || 'sans-serif'}`;
            ctx.textBaseline = 'middle';
            ctx.fillText(edit.newText, x0, y0 + h / 2);
          }
        });
      }
    };
  }, [imageSrc, brightness, contrast, filterMode, rotation, flipH, flipV, previewOriginal, textEdits]);

  useEffect(() => {
    renderAdjustedCanvas();
  }, [renderAdjustedCanvas]);

  // Run Neural OCR to detect text blocks in the image (Phase 6)
  const handleDetectText = async () => {
    if (!canvasRef.current) return;
    try {
      setIsOcrRunning(true);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const result = await runDetailedOcrOnImageDataUrl(dataUrl, 'eng');
      setDetectedTextBlocks(result.lines);
      if (result.lines.length > 0) {
        setActiveTab('text-edit');
      }
    } catch (err) {
      console.error('OCR failed on image:', err);
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleSelectTextBlock = (block: OcrLineItem) => {
    setSelectedBlockId(block.id);
    const existing = textEdits.find((e) => e.id === block.id);
    setActiveEditText(existing ? existing.newText : block.text);
    setActiveFontSize(existing ? existing.fontSize : Math.max(12, Math.round((block.bbox.y1 - block.bbox.y0) * 0.85)));
    setActiveFontColor(existing ? existing.color : '#000000');
    setActiveFontFamily(existing ? existing.fontFamily : 'sans-serif');
    setActiveIsBold(existing ? existing.isBold : false);
  };

  const handleApplyTextEdit = () => {
    if (!selectedBlockId) return;
    const block = detectedTextBlocks.find((b) => b.id === selectedBlockId);
    if (!block) return;

    const newEdit: ImageTextEdit = {
      id: block.id,
      originalText: block.text,
      newText: activeEditText,
      bbox: block.bbox,
      fontSize: activeFontSize,
      fontFamily: activeFontFamily,
      isBold: activeIsBold,
      color: activeFontColor,
      isDeleted: false,
    };

    setTextEdits((prev) => [...prev.filter((e) => e.id !== block.id), newEdit]);
    setSelectedBlockId(null);
  };

  const handleDeleteTextBlock = () => {
    if (!selectedBlockId) return;
    const block = detectedTextBlocks.find((b) => b.id === selectedBlockId);
    if (!block) return;

    const deleteEdit: ImageTextEdit = {
      id: block.id,
      originalText: block.text,
      newText: '',
      bbox: block.bbox,
      fontSize: activeFontSize,
      fontFamily: activeFontFamily,
      isBold: activeIsBold,
      color: activeFontColor,
      isDeleted: true,
    };

    setTextEdits((prev) => [...prev.filter((e) => e.id !== block.id), deleteEdit]);
    setSelectedBlockId(null);
  };

  // Perform Crop
  const handleApplyCrop = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropX = cropBox.x * canvas.width;
    const cropY = cropBox.y * canvas.height;
    const cropW = cropBox.w * canvas.width;
    const cropH = cropBox.h * canvas.height;

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const cropCtx = croppedCanvas.getContext('2d');
    if (!cropCtx) return;

    cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const newUrl = croppedCanvas.toDataURL('image/png');
    setImageSrc(newUrl);
    setIsCropping(false);
    setTextEdits([]);
    setDetectedTextBlocks([]);
  };

  // Export handlers
  const handleDownloadImage = (format: 'png' | 'jpeg' | 'webp') => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL(`image/${format}`, 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${imageName.replace(/\.[^/.]+$/, '')}_edited.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportAsPdf = async () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
    await convertImagesToPdfAction([{ dataUrl, name: imageName }]);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-600 text-white dark:bg-brand-500">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Image Studio & Text Editor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Crop, enhance, filter, redact, and edit text inside images with pixel-accurate reconstruction.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/bmp"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-4 h-4 mr-1.5" />
            Open Image
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportAsPdf}
          >
            <FilePlus2 className="w-4 h-4 mr-1.5" />
            Export to PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Canvas Viewport Area */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          {/* Top Actions & Sub-tools */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            {/* Tab navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('adjust')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'adjust'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Enhance & Filters</span>
              </button>
              <button
                onClick={() => setActiveTab('crop-transform')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'crop-transform'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Crop & Transform</span>
              </button>
              <button
                onClick={() => setActiveTab('text-edit')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'text-edit'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Edit Text Inside Image</span>
              </button>
            </div>

            {/* Quick action triggers */}
            <div className="flex items-center gap-2">
              {activeTab === 'text-edit' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDetectText}
                  disabled={isOcrRunning}
                  className="text-xs"
                >
                  <ScanText className="w-3.5 h-3.5 mr-1 text-brand-600" />
                  {isOcrRunning ? 'Scanning Text...' : 'Detect Image Text'}
                </Button>
              )}

              {textEdits.length > 0 && (
                <button
                  onMouseDown={() => setPreviewOriginal(true)}
                  onMouseUp={() => setPreviewOriginal(false)}
                  onMouseLeave={() => setPreviewOriginal(false)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                >
                  Hold to View Original
                </button>
              )}
            </div>
          </div>

          {/* Canvas Rendering Box */}
          <div
            ref={containerRef}
            className="my-4 relative flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-auto min-h-[460px] max-h-[640px]"
          >
            <div className="relative inline-block shadow-2xl rounded overflow-hidden select-none">
              <canvas ref={canvasRef} className="max-w-full max-h-[580px] object-contain block" />

              {/* Interactive Bounding Boxes for Detected Image Text */}
              {activeTab === 'text-edit' &&
                canvasRef.current &&
                detectedTextBlocks.map((block) => {
                  const canvas = canvasRef.current!;
                  const isSelected = selectedBlockId === block.id;
                  const edit = textEdits.find((e) => e.id === block.id);
                  const isEdited = edit && !edit.isDeleted;
                  const isDeleted = edit?.isDeleted;

                  const leftPct = (block.bbox.x0 / canvas.width) * 100;
                  const topPct = (block.bbox.y0 / canvas.height) * 100;
                  const widthPct = ((block.bbox.x1 - block.bbox.x0) / canvas.width) * 100;
                  const heightPct = ((block.bbox.y1 - block.bbox.y0) / canvas.height) * 100;

                  return (
                    <div
                      key={block.id}
                      onClick={() => handleSelectTextBlock(block)}
                      title={`Click to edit: "${block.text}"`}
                      className={`absolute cursor-pointer transition-all border ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/30 ring-2 ring-brand-500 z-30'
                          : isEdited
                          ? 'border-emerald-500 bg-emerald-500/20 z-20'
                          : isDeleted
                          ? 'border-rose-400 bg-rose-500/20 line-through opacity-50 z-10'
                          : 'border-brand-400/40 hover:border-brand-500 hover:bg-brand-500/20'
                      }`}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                      }}
                    />
                  );
                })}
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>
              {activeTab === 'text-edit'
                ? 'Click any detected text box on the image to edit or replace words with tone-matched background patches.'
                : 'All image processing is computed 100% locally in high-DPI browser memory.'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownloadImage('png')}
                className="hover:text-brand-600 font-semibold"
              >
                PNG
              </button>
              •
              <button
                onClick={() => handleDownloadImage('jpeg')}
                className="hover:text-brand-600 font-semibold"
              >
                JPG
              </button>
              •
              <button
                onClick={() => handleDownloadImage('webp')}
                className="hover:text-brand-600 font-semibold"
              >
                WEBP
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Controls Panel */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            {/* TAB 1: ADJUST & FILTERS */}
            {activeTab === 'adjust' && (
              <div className="space-y-5 animate-in fade-in">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Filters & Exposure
                </span>

                {/* Preset filter chips */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Filter Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => setFilterMode('none')}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        filterMode === 'none'
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      Original Color
                    </button>
                    <button
                      onClick={() => setFilterMode('magic-clean')}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        filterMode === 'magic-clean'
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      ✨ Magic Bleach
                    </button>
                    <button
                      onClick={() => setFilterMode('bw')}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        filterMode === 'bw'
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      High-Contrast B&W
                    </button>
                    <button
                      onClick={() => setFilterMode('grayscale')}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        filterMode === 'grayscale'
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      Clean Grayscale
                    </button>
                  </div>
                </div>

                {/* Brightness Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Brightness</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={180}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full mt-1 accent-brand-600"
                  />
                </div>

                {/* Contrast Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>Contrast</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={180}
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full mt-1 accent-brand-600"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBrightness(100);
                    setContrast(100);
                    setFilterMode('none');
                  }}
                  className="w-full text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Reset Sliders
                </Button>
              </div>
            )}

            {/* TAB 2: CROP & TRANSFORM */}
            {activeTab === 'crop-transform' && (
              <div className="space-y-5 animate-in fade-in">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Orientation & Cropping
                </span>

                {/* Rotation controls */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Rotate
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <button
                      onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>-90° Left</span>
                    </button>
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>+90° Right</span>
                    </button>
                  </div>
                </div>

                {/* Flip controls */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Flip Axis
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <button
                      onClick={() => setFlipH((f) => !f)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition-all ${
                        flipH
                          ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5" />
                      <span>Flip Horizontal</span>
                    </button>
                    <button
                      onClick={() => setFlipV((f) => !f)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition-all ${
                        flipV
                          ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <FlipVertical className="w-3.5 h-3.5" />
                      <span>Flip Vertical</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EDIT TEXT INSIDE IMAGE (PHASE 6) */}
            {activeTab === 'text-edit' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Image Text Reconstruction
                  </span>
                  <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-full">
                    {textEdits.length} Reconstructed
                  </span>
                </div>

                {selectedBlockId ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500">
                        Original Text
                      </label>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-mono border border-slate-200 dark:border-slate-700">
                        "{detectedTextBlocks.find((b) => b.id === selectedBlockId)?.text}"
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Replacement Text
                      </label>
                      <input
                        type="text"
                        value={activeEditText}
                        onChange={(e) => setActiveEditText(e.target.value)}
                        className="w-full mt-1 p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          Font Size ({activeFontSize}px)
                        </label>
                        <input
                          type="range"
                          min={10}
                          max={48}
                          value={activeFontSize}
                          onChange={(e) => setActiveFontSize(Number(e.target.value))}
                          className="w-full mt-1 accent-brand-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          Ink Color
                        </label>
                        <input
                          type="color"
                          value={activeFontColor}
                          onChange={(e) => setActiveFontColor(e.target.value)}
                          className="w-full h-7 rounded border-0 cursor-pointer mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleApplyTextEdit}
                        className="flex-1 text-xs"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Reconstruct
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteTextBlock}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs"
                      >
                        Delete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBlockId(null)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <ScanText className="w-8 h-8 mx-auto mb-2 opacity-40 text-brand-600" />
                    {detectedTextBlocks.length === 0 ? (
                      <>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          No text detected yet
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                          Click "Detect Image Text" above to run neural OCR across the image.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {detectedTextBlocks.length} text blocks ready
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                          Click any recognized word or sentence on the image to edit typography and replace text.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Export Actions Box */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => handleDownloadImage('png')}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download High-Res Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
