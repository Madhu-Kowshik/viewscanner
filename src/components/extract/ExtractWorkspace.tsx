import React, { useState } from 'react';
import {
  Scissors,
  Check,
  FileText,
  CheckSquare,
  Square,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';
import { FileDropzone } from '../common/FileDropzone';

export const ExtractWorkspace: React.FC = () => {
  const { currentFile, pages, exportExtractedPages } = usePdf();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rangeInput, setRangeInput] = useState<string>('');

  if (!currentFile || pages.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Extract Pages
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pick specific pages to extract into a brand new standalone PDF.
          </p>
        </div>
        <FileDropzone title="Drop your PDF here to extract pages" />
      </div>
    );
  }

  const handleTogglePage = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(pages.map((p) => p.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  // Quick range input parser (e.g. "1, 3, 5-7")
  const applyRangeInput = () => {
    if (!rangeInput.trim()) return;
    const parts = rangeInput.split(',');
    const newSelected = new Set<string>();

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.max(1, Math.min(start, end));
          const max = Math.min(pages.length, Math.max(start, end));
          for (let pNum = min; pNum <= max; pNum++) {
            const page = pages.find((p) => p.displayNumber === pNum);
            if (page) newSelected.add(page.id);
          }
        }
      } else {
        const pNum = parseInt(trimmed, 10);
        if (!isNaN(pNum) && pNum >= 1 && pNum <= pages.length) {
          const page = pages.find((p) => p.displayNumber === pNum);
          if (page) newSelected.add(page.id);
        }
      }
    }

    if (newSelected.size > 0) {
      setSelectedIds(newSelected);
    }
  };

  const handleExtract = async () => {
    if (selectedIds.size === 0) return;
    await exportExtractedPages(Array.from(selectedIds));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Extract Pages
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Select the pages you want to keep. OmniPDF will generate a document with only those pages.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          disabled={selectedIds.size === 0}
          onClick={handleExtract}
        >
          <Scissors className="w-4 h-4 mr-1.5" />
          Extract {selectedIds.size} {selectedIds.size === 1 ? 'Page' : 'Pages'}
        </Button>
      </div>

      {/* Control bar with range input */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-slate-200/80 bg-white shadow-subtle dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <button
            onClick={selectedIds.size === pages.length ? handleClearAll : handleSelectAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400"
          >
            {selectedIds.size === pages.length ? (
              <CheckSquare className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>{selectedIds.size === pages.length ? 'Clear Selection' : 'Select All'}</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <span className="text-xs font-medium text-slate-500">
            <strong className="text-brand-600 dark:text-brand-400">
              {selectedIds.size}
            </strong>{' '}
            of {pages.length} pages selected
          </span>
        </div>

        {/* Quick Range Input (e.g. 1, 3, 5-7) */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g. 1, 3, 5-7"
            value={rangeInput}
            onChange={(e) => setRangeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyRangeInput();
              }
            }}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 w-36"
          />
          <Button variant="outline" size="sm" onClick={applyRangeInput}>
            Apply Range
          </Button>
        </div>
      </div>

      {/* Visual Page Selection Grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {pages.map((page) => {
          const isSelected = selectedIds.has(page.id);
          return (
            <div
              key={page.id}
              onClick={() => handleTogglePage(page.id)}
              className={`group relative flex flex-col rounded-xl border bg-white shadow-subtle p-3 transition-all cursor-pointer select-none dark:bg-slate-900 ${
                isSelected
                  ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-md dark:border-brand-400'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
              }`}
            >
              {/* Checkbox indicator */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Page {page.displayNumber}
                </span>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                    isSelected
                      ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
                      : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Thumbnail */}
              <div className="aspect-[1/1.3] bg-slate-100 dark:bg-slate-950 rounded flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-slate-800">
                {page.thumbnailUrl ? (
                  <img
                    src={page.thumbnailUrl}
                    alt={`Page ${page.displayNumber}`}
                    className="max-h-full max-w-full object-contain pointer-events-none"
                    loading="lazy"
                  />
                ) : (
                  <FileText className="h-8 w-8 text-slate-400 opacity-60" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
