import React, { useRef } from 'react';
import {
  FilePlus2,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileText,
  Download,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';
import { formatBytes } from '../../lib/utils';

export const MergeWorkspace: React.FC = () => {
  const {
    mergeFiles,
    addMergeFiles,
    removeMergeFile,
    moveMergeFile,
    clearMergeFiles,
    exportMergedPdf,
  } = usePdf();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await addMergeFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const pdfFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (pdfFiles.length > 0) {
        await addMergeFiles(pdfFiles);
      }
    }
  };

  const totalPages = mergeFiles.reduce((sum, f) => sum + f.pageCount, 0);
  const totalBytes = mergeFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Merge PDF Files
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Combine multiple PDF documents into a single document in any order.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {mergeFiles.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearMergeFiles}
              className="text-slate-600 hover:text-rose-600"
            >
              Clear All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add More PDFs
          </Button>
        </div>
      </div>

      {/* Drop area / File List */}
      {mergeFiles.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center transition-all hover:border-brand-400 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400 mb-4">
            <FilePlus2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Select 2 or more PDFs to combine
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Drag and drop multiple files here, or click to choose from your device.
          </p>
          <div className="mt-5">
            <Button variant="primary" size="md">
              Choose PDF Files
            </Button>
          </div>
          <span className="mt-6 text-xs text-slate-400 dark:text-slate-500">
            🔒 100% Client-Side. Files never leave your browser.
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File order cards */}
          <div className="space-y-2.5">
            {mergeFiles.map((file, idx) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 transition-all"
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
                    {idx + 1}
                  </span>
                  <div className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-950 dark:text-brand-400 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveMergeFile(idx, 'up')}
                    aria-label={`Move ${file.name} up`}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === mergeFiles.length - 1}
                    onClick={() => moveMergeFile(idx, 'down')}
                    aria-label={`Move ${file.name} down`}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMergeFile(file.id)}
                    aria-label={`Remove ${file.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors ml-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Merge summary banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50/70 p-4 dark:border-brand-900/60 dark:bg-brand-950/40">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-800 dark:text-brand-300">
                Combined Document
              </p>
              <p className="text-sm font-medium text-brand-950 dark:text-brand-100 mt-0.5">
                {mergeFiles.length} files • {totalPages} total pages • approx. {formatBytes(totalBytes)}
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={exportMergedPdf}
              disabled={mergeFiles.length < 2}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Merge & Download PDF
            </Button>
          </div>

          {mergeFiles.length < 2 && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 px-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Please add at least 2 files to merge into a single PDF.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
