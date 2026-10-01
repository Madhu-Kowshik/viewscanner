import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Layers,
  FileDigit,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';
import { FileDropzone } from '../common/FileDropzone';
import { generateId } from '../../lib/utils';
import { SplitRange } from '../../types/pdf';

export const SplitWorkspace: React.FC = () => {
  const { currentFile, exportSplitEveryPage, exportSplitRanges } = usePdf();

  const [mode, setMode] = useState<'every-page' | 'ranges'>('ranges');
  const [ranges, setRanges] = useState<SplitRange[]>([
    { id: generateId(), start: 1, end: Math.min(2, currentFile?.pageCount || 2), name: 'Part 1' },
    { id: generateId(), start: Math.min(3, currentFile?.pageCount || 3), end: currentFile?.pageCount || 5, name: 'Part 2' },
  ]);

  if (!currentFile) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Split PDF
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Separate pages into individual documents or split by custom page ranges.
          </p>
        </div>
        <FileDropzone title="Drop your PDF here to split" />
      </div>
    );
  }

  const totalPages = currentFile.pageCount;

  const handleAddRange = () => {
    const lastRange = ranges[ranges.length - 1];
    const nextStart = lastRange ? Math.min(totalPages, lastRange.end + 1) : 1;
    const nextEnd = Math.min(totalPages, nextStart + 1);

    setRanges((prev) => [
      ...prev,
      {
        id: generateId(),
        start: nextStart,
        end: nextEnd,
        name: `Part ${prev.length + 1}`,
      },
    ]);
  };

  const handleRemoveRange = (id: string) => {
    if (ranges.length <= 1) return;
    setRanges((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRange = (id: string, field: 'start' | 'end' | 'name', value: any) => {
    setRanges((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (field === 'start' || field === 'end') {
          const num = parseInt(value, 10);
          return { ...r, [field]: isNaN(num) ? 1 : Math.max(1, Math.min(totalPages, num)) };
        }
        return { ...r, [field]: value };
      })
    );
  };

  const handleExecuteSplit = async () => {
    if (mode === 'every-page') {
      await exportSplitEveryPage();
    } else {
      await exportSplitRanges(
        ranges.map((r) => ({
          start: Math.min(r.start, r.end),
          end: Math.max(r.start, r.end),
          name: r.name,
        }))
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Split PDF Document
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Source document: <strong className="text-slate-800 dark:text-slate-200">{currentFile.name}</strong> ({totalPages} pages)
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode('ranges')}
          className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
            mode === 'ranges'
              ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 dark:border-brand-500 ring-2 ring-brand-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="rounded-lg bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Split by Page Ranges
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify page blocks (e.g. pages 1-3, 4-7, 8-10) to create customized PDF files.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode('every-page')}
          className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
            mode === 'every-page'
              ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 dark:border-brand-500 ring-2 ring-brand-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="rounded-lg bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/60 dark:text-brand-300 shrink-0">
            <FileDigit className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Extract Every Page
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Break this entire document into {totalPages} individual single-page PDF files bundled in a ZIP.
            </p>
          </div>
        </button>
      </div>

      {/* Mode-specific configuration */}
      {mode === 'ranges' ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Define Ranges ({ranges.length})
              </h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Choose start and end page for each generated PDF.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddRange}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Range
            </Button>
          </div>

          <div className="space-y-3">
            {ranges.map((range, idx) => (
              <div
                key={range.id}
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
              >
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-14">
                  Part {idx + 1}
                </span>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">From page:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={range.start}
                    onChange={(e) => handleUpdateRange(range.id, 'start', e.target.value)}
                    className="w-16 px-2 py-1 text-center font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">To page:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={range.end}
                    onChange={(e) => handleUpdateRange(range.id, 'end', e.target.value)}
                    className="w-16 px-2 py-1 text-center font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex-1 min-w-[140px]">
                  <input
                    type="text"
                    placeholder="Custom file name (optional)"
                    value={range.name || ''}
                    onChange={(e) => handleUpdateRange(range.id, 'name', e.target.value)}
                    className="w-full text-xs px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  disabled={ranges.length <= 1}
                  onClick={() => handleRemoveRange(range.id)}
                  title="Remove range"
                  className="p-1.5 rounded text-slate-400 hover:text-rose-600 disabled:opacity-20 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-subtle dark:border-slate-800 dark:bg-slate-900 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 mb-3">
            <FileDigit className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">
            Split into {totalPages} individual documents
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Each page from 1 to {totalPages} will be saved as its own separate PDF file. The resulting collection will be packaged into a convenient ZIP archive.
          </p>
        </div>
      )}

      {/* Split action trigger button */}
      <div className="flex justify-end">
        <Button variant="primary" size="lg" onClick={handleExecuteSplit}>
          <Download className="w-4 h-4 mr-2" />
          {mode === 'every-page' ? `Split All ${totalPages} Pages` : 'Split & Download'}
        </Button>
      </div>
    </div>
  );
};
