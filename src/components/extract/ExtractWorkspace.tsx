import React, { useState } from 'react';
import {
  Scissors,
  Check,
  FileText,
  CheckSquare,
  Square,
  FileImage,
  Download,
  Copy,
  Search,
  FileArchive,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';
import { FileDropzone } from '../common/FileDropzone';
import { renderPageThumbnail, createZipBundle } from '../../lib/pdf/pdf-engine';
import { downloadBlob } from '../../lib/utils';

export const ExtractWorkspace: React.FC = () => {
  const { currentFile, pages, exportExtractedPages, extractAllTextAction } = usePdf();
  const [activeTab, setActiveTab] = useState<'pages' | 'images' | 'text'>('pages');

  // Extract Pages state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rangeInput, setRangeInput] = useState<string>('');

  // Extract Text state
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);

  // Extract Images state
  const [isExtractingImages, setIsExtractingImages] = useState(false);

  if (!currentFile || pages.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Extract from PDF
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Extract specific pages, embedded image assets, or clean raw text.
          </p>
        </div>
        <FileDropzone title="Drop your PDF here to extract content" />
      </div>
    );
  }

  const handleTogglePage = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(pages.map((p) => p.id)));
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

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

  const handleExtractPages = async () => {
    if (selectedIds.size === 0) return;
    await exportExtractedPages(Array.from(selectedIds));
  };

  const handleExtractText = async () => {
    setIsExtractingText(true);
    try {
      const text = await extractAllTextAction();
      setExtractedText(text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleCopyText = async () => {
    if (!extractedText) return;
    await navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${currentFile.name.replace(/\.pdf$/i, '')}_extracted_text.txt`);
  };

  const handleExtractImagesZip = async () => {
    setIsExtractingImages(true);
    try {
      const imgFiles: { name: string; data: Uint8Array | Blob }[] = [];
      for (let i = 0; i < pages.length; i++) {
        const url = await renderPageThumbnail(currentFile.data, i, 2.0);
        const res = await fetch(url);
        const blob = await res.blob();
        imgFiles.push({
          name: `page-${i + 1}.png`,
          data: blob,
        });
      }
      const zipBlob = await createZipBundle(imgFiles);
      downloadBlob(zipBlob, `${currentFile.name.replace(/\.pdf$/i, '')}_images.zip`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtractingImages(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Extraction Hub
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Source: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentFile.name}</span> ({pages.length} pages)
            </p>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-950 text-xs">
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'pages'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Extract Pages
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'images'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Extract Images
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Extract Text
          </button>
        </div>
      </div>

      {/* Tab 1: Extract Pages */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={selectedIds.size === pages.length ? handleClearAll : handleSelectAll}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 p-1"
              >
                {selectedIds.size === pages.length ? (
                  <CheckSquare className="h-4 w-4 text-brand-600" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400" />
                )}
                <span>{selectedIds.size === pages.length ? 'Deselect All' : 'Select All'}</span>
              </button>

              <span className="text-slate-300 dark:text-slate-700">|</span>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Range: 1, 3, 5-8"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyRangeInput()}
                  className="h-8 w-32 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 text-xs font-mono"
                />
                <Button variant="outline" size="sm" onClick={applyRangeInput} className="h-8 text-xs">
                  Apply
                </Button>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleExtractPages}
              disabled={selectedIds.size === 0}
              className="gap-1.5"
            >
              <Scissors className="w-3.5 h-3.5" />
              Extract {selectedIds.size} Pages to New PDF
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {pages.map((page) => {
              const isSelected = selectedIds.has(page.id);
              return (
                <div
                  key={page.id}
                  onClick={() => handleTogglePage(page.id)}
                  className={`group relative flex flex-col items-center rounded-xl border p-2.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/50 dark:border-brand-500 dark:bg-brand-950/40 ring-2 ring-brand-500/20 shadow-sm'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="absolute top-3 right-3 z-10">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border text-white transition-colors ${
                        isSelected
                          ? 'border-brand-600 bg-brand-600 dark:border-brand-500 dark:bg-brand-500'
                          : 'border-slate-300 bg-white/80 dark:border-slate-600 dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    {page.thumbnailUrl ? (
                      <img
                        src={page.thumbnailUrl}
                        alt={`Page ${page.displayNumber}`}
                        className="max-h-full max-w-full object-contain pointer-events-none"
                      />
                    ) : (
                      <span className="text-xs font-mono text-slate-400">P.{page.displayNumber}</span>
                    )}
                  </div>

                  <span className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Page {page.displayNumber}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Extract Images */}
      {activeTab === 'images' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Extract All Document Pages as Images
              </h3>
              <p className="text-xs text-slate-500">
                Render every page of your PDF into high-resolution PNG image files bundled into a ZIP archive.
              </p>
            </div>

            <Button
              onClick={handleExtractImagesZip}
              disabled={isExtractingImages}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
            >
              <FileArchive className="w-4 h-4" />
              {isExtractingImages ? 'Rendering Images...' : 'Download All as ZIP'}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {pages.map((p, idx) => (
              <div key={p.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center space-y-2">
                <img src={p.thumbnailUrl} alt={`Page ${idx + 1}`} className="w-full h-32 object-contain rounded bg-white dark:bg-slate-900 shadow-2xs" />
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">Page {idx + 1}</span>
                  <a
                    href={p.thumbnailUrl}
                    download={`page-${idx + 1}.png`}
                    className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                  >
                    Download PNG
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Extract Text */}
      {activeTab === 'text' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Extract Raw Vector Text
              </h3>
              <p className="text-xs text-slate-500">
                Extract digital text streams from all pages in under 100ms.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!extractedText ? (
                <Button
                  onClick={handleExtractText}
                  disabled={isExtractingText}
                  className="gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {isExtractingText ? 'Extracting...' : 'Extract All Text'}
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={handleCopyText} className="gap-1.5 text-xs">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownloadTxt} className="gap-1.5 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    Save .TXT
                  </Button>
                </>
              )}
            </div>
          </div>

          {extractedText ? (
            <textarea
              readOnly
              value={extractedText}
              rows={14}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-mono text-xs leading-relaxed focus:outline-none"
            />
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Click <span className="font-semibold text-slate-700 dark:text-slate-300">"Extract All Text"</span> to read all embedded text from this document.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
