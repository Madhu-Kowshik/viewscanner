import React, { useState } from 'react';
import {
  Layers,
  Upload,
  Minimize2,
  Stamp,
  ShieldCheck,
  FileArchive,
  CheckCircle2,
  Loader2,
  Trash2,
  Zap,
  Download,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { formatBytes, downloadBlob } from '../../lib/utils';
import {
  compressPdfDocument,
  cleanPdfMetadata,
  addWatermarkToPdf,
  createZipBundle,
} from '../../lib/pdf/pdf-engine';

interface BatchQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  resultData?: Uint8Array;
  resultSize?: number;
  errorMessage?: string;
}

export const BatchWorkspace: React.FC = () => {
  const [queue, setQueue] = useState<BatchQueueItem[]>([]);
  const [batchAction, setBatchAction] = useState<'compress' | 'sanitize' | 'watermark'>('compress');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);

  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: BatchQueueItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      name: f.name,
      size: f.size,
      status: 'queued',
      progress: 0,
    }));

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleRemoveItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setQueue([]);
  };

  const handleRunBatch = async () => {
    if (queue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setGlobalProgress(0);

    const updatedQueue = [...queue];

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i];
      item.status = 'processing';
      item.progress = 20;
      setQueue([...updatedQueue]);

      try {
        const buffer = await item.file.arrayBuffer();

        let processedData: Uint8Array;

        if (batchAction === 'compress') {
          const comp = await compressPdfDocument(buffer, {
            preset: 'balanced',
            quality: 0.72,
            scale: 0.75,
            removeMetadata: true,
            flattenAnnotations: false,
          });
          processedData = comp.data;
        } else if (batchAction === 'sanitize') {
          processedData = await cleanPdfMetadata(buffer);
        } else {
          // Watermark
          processedData = await addWatermarkToPdf(buffer, {
            type: 'text',
            text: watermarkText,
            fontSize: 48,
            color: '#ef4444',
            opacity: 0.35,
            rotation: 45,
            position: 'diagonal',
            pageRange: 'all',
          });
        }

        item.status = 'completed';
        item.progress = 100;
        item.resultData = processedData;
        item.resultSize = processedData.byteLength;
      } catch (err: any) {
        console.error(`Error processing ${item.name}`, err);
        item.status = 'error';
        item.errorMessage = err.message || 'Processing failed';
      }

      setGlobalProgress(Math.round(((i + 1) / updatedQueue.length) * 100));
      setQueue([...updatedQueue]);
    }

    setIsProcessing(false);
  };

  const handleDownloadAllZip = async () => {
    const completedItems = queue.filter((item) => item.status === 'completed' && item.resultData);
    if (completedItems.length === 0) return;

    const filesToZip = completedItems.map((item) => ({
      name: item.name.replace(/\.pdf$/i, '') + `-${batchAction}.pdf`,
      data: item.resultData!,
    }));

    const zipBlob = await createZipBundle(filesToZip);
    downloadBlob(zipBlob, `omnipdf-batch-${batchAction}.zip`);
  };

  const completedCount = queue.filter((i) => i.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Batch Document Processor
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Apply compression, sanitization, or stamps simultaneously across multiple PDF files.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <Button
              onClick={handleDownloadAllZip}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <FileArchive className="w-3.5 h-3.5" />
              Download All as ZIP ({completedCount})
            </Button>
          )}

          <Button
            onClick={handleRunBatch}
            disabled={queue.length === 0 || isProcessing}
            className="gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing Batch...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                Start Batch Run
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Action Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setBatchAction('compress')}
          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
            batchAction === 'compress'
              ? 'border-brand-600 bg-brand-50/60 text-brand-900 dark:bg-brand-950/60 dark:text-brand-200'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Minimize2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Batch Compress</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Shrink size of all files</div>
          </div>
        </button>

        <button
          onClick={() => setBatchAction('sanitize')}
          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
            batchAction === 'sanitize'
              ? 'border-brand-600 bg-brand-50/60 text-brand-900 dark:bg-brand-950/60 dark:text-brand-200'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Batch Sanitize</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Scrub all metadata tags</div>
          </div>
        </button>

        <button
          onClick={() => setBatchAction('watermark')}
          className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
            batchAction === 'watermark'
              ? 'border-brand-600 bg-brand-50/60 text-brand-900 dark:bg-brand-950/60 dark:text-brand-200'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Stamp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">Batch Watermark</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Stamp across all files</div>
          </div>
        </button>
      </div>

      {batchAction === 'watermark' && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Watermark Text Stamp:
          </label>
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-semibold"
          />
        </div>
      )}

      {/* Queue File Upload & Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Queue ({queue.length} files)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="application/pdf"
                onChange={handleFilesAdded}
                className="hidden"
              />
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Add PDF Files
              </span>
            </label>

            {queue.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-slate-400 hover:text-red-500 px-2 py-1"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500">
              No files in the batch queue. Add multiple PDFs to process them simultaneously.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {queue.map((item, idx) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                <div className="truncate flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({formatBytes(item.size)})
                    </span>
                  </div>

                  {item.status === 'completed' && item.resultSize && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Success: {formatBytes(item.resultSize)} ({Math.round((1 - item.resultSize / item.size) * 100)}% reduction)
                    </div>
                  )}

                  {item.status === 'processing' && (
                    <div className="text-[11px] text-brand-600 dark:text-brand-400 flex items-center gap-1 mt-0.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Processing in browser...
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    item.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : item.status === 'processing'
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                      : item.status === 'error'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {item.status}
                  </span>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
