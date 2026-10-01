import React, { useState } from 'react';
import {
  Stamp,
  Hash,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  Type,
  Layout,
  Layers,
  Sparkles,
  Zap,
  Eraser,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { Button } from '../ui/Button';
import { WatermarkConfig, PageNumberConfig } from '../../types/pdf';
import { removeWatermarkFromPdf } from '../../lib/pdf/pdf-engine';

export const WatermarkWorkspace: React.FC = () => {
  const {
    currentFile,
    pages,
    loadFile,
    applyWatermark,
    applyPageNumbers,
    applyHeaderFooter,
    updateActiveDocument,
    processing,
  } = usePdf();

  const [activeTab, setActiveTab] = useState<'text-watermark' | 'image-watermark' | 'page-numbers' | 'header-footer' | 'remove-watermark'>('text-watermark');

  // Remove Watermark State
  const [removeMode, setRemoveMode] = useState<'color-threshold' | 'region'>('color-threshold');
  const [removeColor, setRemoveColor] = useState('#ef4444');
  const [colorTolerance, setColorTolerance] = useState(35);
  const [removeRegion, setRemoveRegion] = useState<'center' | 'diagonal' | 'top' | 'bottom'>('diagonal');
  const [isRemoving, setIsRemoving] = useState(false);

  // Text Watermark State
  const [wmText, setWmText] = useState('CONFIDENTIAL');
  const [wmFontSize, setWmFontSize] = useState(48);
  const [wmColor, setWmColor] = useState('#ef4444');
  const [wmOpacity, setWmOpacity] = useState(0.35);
  const [wmRotation, setWmRotation] = useState(45);
  const [wmPosition, setWmPosition] = useState<'center' | 'top' | 'bottom' | 'diagonal'>('diagonal');

  // Image Watermark State
  const [wmImageDataUrl, setWmImageDataUrl] = useState<string | null>(null);
  const [imgOpacity, setImgOpacity] = useState(0.4);

  // Page Number State
  const [pnPosition, setPnPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center' | 'top-left'>('bottom-center');
  const [pnFormat, setPnFormat] = useState<'number-only' | 'page-x-of-y' | 'bates'>('page-x-of-y');
  const [pnStartNumber, setPnStartNumber] = useState(1);
  const [pnBatesPrefix, setPnBatesPrefix] = useState('DOC-');
  const [pnBatesDigits, setPnBatesDigits] = useState(6);
  const [pnFontSize, setPnFontSize] = useState(10);
  const [pnColor, setPnColor] = useState('#64748b');

  // Header & Footer State
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');

  const quickPresets = ['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'INTERNAL ONLY', 'APPROVED', 'FINAL'];

  const handleApplyTextWatermark = async () => {
    if (!currentFile || !wmText.trim()) return;
    const config: WatermarkConfig = {
      type: 'text',
      text: wmText.trim(),
      fontSize: wmFontSize,
      color: wmColor,
      opacity: wmOpacity,
      rotation: wmRotation,
      position: wmPosition,
      pageRange: 'all',
    };
    await applyWatermark(config);
  };

  const handleApplyImageWatermark = async () => {
    if (!currentFile || !wmImageDataUrl) return;
    const config: WatermarkConfig = {
      type: 'image',
      imageDataUrl: wmImageDataUrl,
      opacity: imgOpacity,
      rotation: 0,
      position: 'center',
      pageRange: 'all',
    };
    await applyWatermark(config);
  };

  const handleApplyPageNumbers = async () => {
    if (!currentFile) return;
    const config: PageNumberConfig = {
      position: pnPosition,
      format: pnFormat,
      startNumber: pnStartNumber,
      batesPrefix: pnBatesPrefix,
      batesDigits: pnBatesDigits,
      fontSize: pnFontSize,
      color: pnColor,
      margin: 24,
      pageRange: 'all',
    };
    await applyPageNumbers(config);
  };

  const handleApplyHeaderFooter = async () => {
    if (!currentFile) return;
    await applyHeaderFooter(headerText, footerText);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setWmImageDataUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveWatermark = async () => {
    if (!currentFile) return;
    try {
      setIsRemoving(true);
      let regions = undefined;
      if (removeMode === 'region') {
        const regMap = {
          center: { x: 0.15, y: 0.35, width: 0.7, height: 0.3 },
          diagonal: { x: 0.1, y: 0.2, width: 0.8, height: 0.6 },
          top: { x: 0.1, y: 0.05, width: 0.8, height: 0.2 },
          bottom: { x: 0.1, y: 0.75, width: 0.8, height: 0.2 },
        };
        const box = regMap[removeRegion];
        regions = pages.map((_, idx) => ({ pageNumber: idx + 1, ...box }));
      }

      const cleanedBytes = await removeWatermarkFromPdf(currentFile.data, {
        mode: removeMode,
        colorHex: removeColor,
        colorTolerance,
        regions,
      });

      await updateActiveDocument(cleanedBytes, 'Remove Watermark');
    } catch (err) {
      console.error('Failed to remove watermark:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <Stamp className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Watermark & Page Numbering
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Apply custom text stamps, corporate logos, page numbers, and legal Bates numbering to your document with pinpoint accuracy.
          </p>
        </div>

        <div className="w-full">
          <FileDropzone onFileSelected={loadFile} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Workspace Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Stamp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Watermarks, Bates & Numbers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Target: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentFile.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'text-watermark' && (
            <Button
              onClick={handleApplyTextWatermark}
              disabled={processing.status === 'processing'}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium"
            >
              <Zap className="w-4 h-4 fill-current" />
              Apply Text Watermark
            </Button>
          )}

          {activeTab === 'image-watermark' && (
            <Button
              onClick={handleApplyImageWatermark}
              disabled={processing.status === 'processing' || !wmImageDataUrl}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium"
            >
              <Zap className="w-4 h-4 fill-current" />
              Apply Image Stamp
            </Button>
          )}

          {activeTab === 'page-numbers' && (
            <Button
              onClick={handleApplyPageNumbers}
              disabled={processing.status === 'processing'}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium"
            >
              <Zap className="w-4 h-4 fill-current" />
              Apply Page Numbers
            </Button>
          )}

          {activeTab === 'header-footer' && (
            <Button
              onClick={handleApplyHeaderFooter}
              disabled={processing.status === 'processing' || (!headerText && !footerText)}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium"
            >
              <Zap className="w-4 h-4 fill-current" />
              Apply Headers & Footers
            </Button>
          )}

          {activeTab === 'remove-watermark' && (
            <Button
              onClick={handleRemoveWatermark}
              disabled={isRemoving || processing.status === 'processing'}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              <Eraser className="w-4 h-4" />
              {isRemoving ? 'Processing...' : 'Remove Watermark'}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-xl">
        <button
          onClick={() => setActiveTab('text-watermark')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'text-watermark'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Type className="w-4 h-4" />
          Text Watermark
        </button>

        <button
          onClick={() => setActiveTab('image-watermark')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'image-watermark'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Image / Logo Stamp
        </button>

        <button
          onClick={() => setActiveTab('page-numbers')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'page-numbers'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Hash className="w-4 h-4" />
          Page Numbers & Bates
        </button>

        <button
          onClick={() => setActiveTab('header-footer')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'header-footer'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Headers & Footers
        </button>

        <button
          onClick={() => setActiveTab('remove-watermark')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'remove-watermark'
              ? 'border-rose-600 text-rose-600 dark:text-rose-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Eraser className="w-4 h-4" />
          Remove Watermark
        </button>
      </div>

      {/* Tab 1: Text Watermark */}
      {activeTab === 'text-watermark' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Watermark Text
              </label>
              <input
                type="text"
                value={wmText}
                onChange={(e) => setWmText(e.target.value)}
                placeholder="e.g. CONFIDENTIAL"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-2">Quick Presets:</span>
              <div className="flex flex-wrap gap-2">
                {quickPresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setWmText(preset)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={wmColor}
                    onChange={(e) => setWmColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                  />
                  <span className="font-mono text-xs uppercase text-slate-500">{wmColor}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Placement
                </label>
                <select
                  value={wmPosition}
                  onChange={(e) => setWmPosition(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="diagonal">Diagonal Across Page</option>
                  <option value="center">Center</option>
                  <option value="top">Top Header</option>
                  <option value="bottom">Bottom Footer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Font Size ({wmFontSize}pt)</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="100"
                  value={wmFontSize}
                  onChange={(e) => setWmFontSize(parseInt(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Opacity ({Math.round(wmOpacity * 100)}%)</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.9"
                  step="0.05"
                  value={wmOpacity}
                  onChange={(e) => setWmOpacity(parseFloat(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Visual Preview Card */}
          <div className="bg-slate-100 dark:bg-slate-950/70 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
            <span className="absolute top-3 left-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Visual Preview
            </span>
            <div className="w-48 h-64 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-md rounded-lg flex items-center justify-center relative overflow-hidden p-3 select-none">
              {/* Dummy page content lines */}
              <div className="w-full space-y-2 opacity-25 pointer-events-none">
                <div className="h-2 bg-slate-400 rounded w-3/4"></div>
                <div className="h-1.5 bg-slate-400 rounded w-full"></div>
                <div className="h-1.5 bg-slate-400 rounded w-5/6"></div>
                <div className="h-1.5 bg-slate-400 rounded w-4/5"></div>
                <div className="h-1.5 bg-slate-400 rounded w-full"></div>
                <div className="h-1.5 bg-slate-400 rounded w-2/3"></div>
              </div>

              {/* Watermark Overlay in preview */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: wmPosition === 'diagonal' ? `rotate(-${wmRotation}deg)` : 'none',
                }}
              >
                <span
                  style={{
                    color: wmColor,
                    opacity: wmOpacity,
                    fontSize: `${Math.max(14, wmFontSize * 0.35)}px`,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    lineHeight: 1.1,
                  }}
                >
                  {wmText || 'PREVIEW'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Image Watermark */}
      {activeTab === 'image-watermark' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Upload Stamp Image / Company Logo (PNG with transparent background recommended)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageUpload}
              className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 dark:file:bg-brand-950 dark:file:text-brand-300 hover:file:bg-brand-100 cursor-pointer"
            />
          </div>

          {wmImageDataUrl && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">Stamp Opacity ({Math.round(imgOpacity * 100)}%)</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={imgOpacity}
                    onChange={(e) => setImgOpacity(parseFloat(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <img
                  src={wmImageDataUrl}
                  alt="Stamp preview"
                  className="max-h-32 object-contain"
                  style={{ opacity: imgOpacity }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Page Numbers & Bates */}
      {activeTab === 'page-numbers' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Numbering Style
              </label>
              <select
                value={pnFormat}
                onChange={(e) => setPnFormat(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="page-x-of-y">"Page 1 of 10" (Standard)</option>
                <option value="number-only">"1" (Number only)</option>
                <option value="bates">Legal Bates Stamp (e.g. DOC-000001)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Location on Page
              </label>
              <select
                value={pnPosition}
                onChange={(e) => setPnPosition(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="bottom-center">Bottom Center (Standard)</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right (Header)</option>
                <option value="top-center">Top Center (Header)</option>
              </select>
            </div>
          </div>

          {pnFormat === 'bates' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Bates Prefix
                </label>
                <input
                  type="text"
                  value={pnBatesPrefix}
                  onChange={(e) => setPnBatesPrefix(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  placeholder="e.g. DOC-"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                  Zero-Padding Digits
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={pnBatesDigits}
                  onChange={(e) => setPnBatesDigits(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Start Numbering From
              </label>
              <input
                type="number"
                min="1"
                value={pnStartNumber}
                onChange={(e) => setPnStartNumber(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Font Size ({pnFontSize}pt)
              </label>
              <input
                type="range"
                min="8"
                max="18"
                value={pnFontSize}
                onChange={(e) => setPnFontSize(parseInt(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg mt-3"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Header & Footer */}
      {activeTab === 'header-footer' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Top Header Text (Centered at top of every page)
            </label>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="e.g. Acme Corporation — Annual Audit 2026"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Bottom Footer Text (Centered at bottom of every page)
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="e.g. Confidential and Proprietary — All Rights Reserved"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      )}

      {/* Tab 5: Remove Watermark */}
      {activeTab === 'remove-watermark' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60">
            <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0">
              <Eraser className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Intelligent Watermark Suppression & Removal
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Choose between pixel-selective color suppression (which lifts faint color/gray stamps while preserving black document text) or vector region wiping.
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              Removal Strategy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setRemoveMode('color-threshold')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  removeMode === 'color-threshold'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Color-Selective Stamp Suppression
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Targets faint red, gray, blue, or yellow watermark stamps and lifts them to white without affecting dark text.
                </p>
              </div>

              <div
                onClick={() => setRemoveMode('region')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  removeMode === 'region'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Target Region Eraser
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Applies a clean vector patch across the target watermark region (center, diagonal, header, or footer).
                </p>
              </div>
            </div>
          </div>

          {removeMode === 'color-threshold' ? (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Select Watermark Ink Color Tone
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: 'Faint Red / Pink', hex: '#ef4444' },
                    { label: 'Light Blue', hex: '#3b82f6' },
                    { label: 'Light Gray', hex: '#94a3b8' },
                    { label: 'Faint Amber', hex: '#f59e0b' },
                  ].map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setRemoveColor(preset.hex)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                        removeColor === preset.hex
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.hex }} />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-2">
                    <input
                      type="color"
                      value={removeColor}
                      onChange={(e) => setRemoveColor(e.target.value)}
                      className="w-7 h-7 rounded border-0 cursor-pointer"
                      title="Custom color picker"
                    />
                    <span className="text-xs font-mono text-slate-500 uppercase">{removeColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Color Detection Sensitivity</span>
                  <span>{colorTolerance}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={colorTolerance}
                  onChange={(e) => setColorTolerance(Number(e.target.value))}
                  className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg mt-2"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Tight (selective)</span>
                  <span>Balanced</span>
                  <span>Broad (aggressive)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  Select Watermark Location
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'diagonal', label: 'Diagonal Band' },
                    { id: 'center', label: 'Center Stamp' },
                    { id: 'top', label: 'Top Header' },
                    { id: 'bottom', label: 'Bottom Footer' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setRemoveRegion(pos.id as any)}
                      className={`p-2.5 rounded-xl text-xs font-medium border transition-all ${
                        removeRegion === pos.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              onClick={handleRemoveWatermark}
              disabled={isRemoving || processing.status === 'processing'}
              className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              <Eraser className="w-4 h-4" />
              {isRemoving ? 'Processing Removal...' : 'Apply Watermark Removal'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
