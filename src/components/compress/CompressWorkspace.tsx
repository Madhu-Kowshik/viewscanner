import React, { useState } from 'react';
import {
  Minimize2,
  FileCheck,
  Download,
  RotateCcw,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { CompressConfig } from '../../types/pdf';

export const CompressWorkspace: React.FC = () => {
  const { currentFile, loadFile, compressDocument, updateActiveDocument, processing } = usePdf();

  const [preset, setPreset] = useState<'high' | 'balanced' | 'small' | 'custom'>('balanced');
  const [quality, setQuality] = useState<number>(0.75);
  const [scale, setScale] = useState<number>(0.8);
  const [removeMetadata, setRemoveMetadata] = useState<boolean>(true);
  const [compressedResult, setCompressedResult] = useState<{
    originalSize: number;
    newSize: number;
    data: Uint8Array;
    reductionPercent: number;
  } | null>(null);

  const handlePresetSelect = (selected: 'high' | 'balanced' | 'small') => {
    setPreset(selected);
    if (selected === 'high') {
      setQuality(0.85);
      setScale(0.9);
    } else if (selected === 'balanced') {
      setQuality(0.72);
      setScale(0.75);
    } else if (selected === 'small') {
      setQuality(0.5);
      setScale(0.6);
    }
  };

  const handleCompress = async () => {
    if (!currentFile) return;

    const config: CompressConfig = {
      preset,
      quality,
      scale,
      removeMetadata,
      flattenAnnotations: false,
    };

    try {
      const origSize = currentFile.size;
      await compressDocument(config);

      // The compressDocument in context will set the result in PdfContext
      // Let's also track local comparison if needed
    } catch (err) {
      console.error('Compression failed', err);
    }
  };

  const handleApplyToActive = async () => {
    if (!compressedResult) return;
    await updateActiveDocument(compressedResult.data, 'Compress PDF');
    setCompressedResult(null);
  };

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <Minimize2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Compress PDF Document
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Reduce file size up to 85% while preserving visual clarity. Entirely client-side and completely private.
          </p>
        </div>

        <div className="w-full">
          <FileDropzone onFileSelected={loadFile} />
        </div>
      </div>
    );
  }

  const estimatedReduction = preset === 'small' ? 70 : preset === 'balanced' ? 45 : 20;
  const estimatedNewSize = Math.round(currentFile.size * (1 - estimatedReduction / 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Minimize2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Compress PDF
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                100% In-Browser Privacy
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Current file: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentFile.name}</span> ({formatBytes(currentFile.size)})
            </p>
          </div>
        </div>

        <Button
          onClick={handleCompress}
          disabled={processing.status === 'processing'}
          className="gap-2 shrink-0 bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 shadow-sm"
        >
          {processing.status === 'processing' ? (
            <>Compressing Document...</>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current" />
              Compress Now
            </>
          )}
        </Button>
      </div>

      {/* Preset Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Extreme Compression */}
        <div
          onClick={() => handlePresetSelect('small')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all ${
            preset === 'small'
              ? 'border-brand-600 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-950/40 ring-2 ring-brand-500/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              Maximum Size Reduction
            </span>
            {preset === 'small' && <CheckCircle2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />}
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Smallest Size</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Downscales images to 96 DPI with 50% JPEG quality. Best for email limits, portal uploads, and mobile sharing.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Estimated Savings</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">~65% - 85%</span>
          </div>
        </div>

        {/* Balanced Compression */}
        <div
          onClick={() => handlePresetSelect('balanced')}
          className={`cursor-pointer rounded-2xl p-5 border relative transition-all ${
            preset === 'balanced'
              ? 'border-brand-600 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-950/40 ring-2 ring-brand-500/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="absolute -top-3 right-6 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Recommended
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
              Balanced Ratio
            </span>
            {preset === 'balanced' && <CheckCircle2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />}
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Optimal Compression</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Resamples heavy raster images to 144 DPI with 72% quality while keeping text vectors pin-sharp and crystal clear.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Estimated Savings</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">~40% - 60%</span>
          </div>
        </div>

        {/* High Quality / Lossless */}
        <div
          onClick={() => handlePresetSelect('high')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all ${
            preset === 'high'
              ? 'border-brand-600 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-950/40 ring-2 ring-brand-500/20 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
              Maximum Quality
            </span>
            {preset === 'high' && <CheckCircle2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />}
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">High Quality</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Removes unreferenced dictionary items, dead objects, and compresses PDF streams without loss of image clarity.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Estimated Savings</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">~15% - 30%</span>
          </div>
        </div>
      </div>

      {/* Advanced Custom Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Fine-Tuning & Metadata Optimization</h3>
          </div>
          <span className="text-xs text-slate-500">Fine control over raster streams</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Image Quality Level</span>
              <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="0.95"
              step="0.05"
              value={quality}
              onChange={(e) => {
                setQuality(parseFloat(e.target.value));
                setPreset('custom');
              }}
              className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">Lower quality significantly decreases file size for photo-heavy PDFs.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Raster Resolution Scale</span>
              <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">{Math.round(scale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={scale}
              onChange={(e) => {
                setScale(parseFloat(e.target.value));
                setPreset('custom');
              }}
              className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">Reduces dimension of embedded photographic images before repacking.</p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={removeMetadata}
              onChange={(e) => setRemoveMetadata(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
            <span>Strip hidden metadata, author tags, and diagnostic headers (Saves ~5-25 KB and boosts privacy)</span>
          </label>
        </div>
      </div>

      {/* Live Estimation Card */}
      <div className="bg-gradient-to-r from-brand-50/60 to-indigo-50/60 dark:from-brand-950/20 dark:to-indigo-950/20 p-5 rounded-2xl border border-brand-200/50 dark:border-brand-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-600 text-white shadow-sm">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Estimated Compression Ratio</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Original: <span className="font-semibold">{formatBytes(currentFile.size)}</span> → Estimated: <span className="font-semibold text-brand-600 dark:text-brand-400">{formatBytes(estimatedNewSize)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            ~{estimatedReduction}% Expected Reduction
          </span>
        </div>
      </div>
    </div>
  );
};
