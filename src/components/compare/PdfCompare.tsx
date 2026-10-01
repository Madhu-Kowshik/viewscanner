import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Upload,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { Button } from '../ui/Button';
import { formatBytes } from '../../lib/utils';
import { validatePdf, renderPageThumbnail } from '../../lib/pdf/pdf-engine';

export const PdfCompare: React.FC = () => {
  const { currentFile, pages, loadFile } = usePdf();

  const [secondDoc, setSecondDoc] = useState<{
    name: string;
    size: number;
    pageCount: number;
    data: ArrayBuffer;
  } | null>(null);

  const [pageIndexA, setPageIndexA] = useState(0);
  const [pageIndexB, setPageIndexB] = useState(0);
  const [isSynced, setIsSynced] = useState(true);

  const [thumbUrlA, setThumbUrlA] = useState<string | null>(null);
  const [thumbUrlB, setThumbUrlB] = useState<string | null>(null);
  const [loadingThumbs, setLoadingThumbs] = useState(false);

  // Load thumb for Doc A
  useEffect(() => {
    if (!currentFile) return;
    let isCancelled = false;

    renderPageThumbnail(currentFile.data, pageIndexA, 1.2).then((url) => {
      if (!isCancelled) setThumbUrlA(url);
    });

    return () => {
      isCancelled = true;
    };
  }, [currentFile, pageIndexA]);

  // Load thumb for Doc B
  useEffect(() => {
    if (!secondDoc) return;
    let isCancelled = false;

    renderPageThumbnail(secondDoc.data, pageIndexB, 1.2).then((url) => {
      if (!isCancelled) setThumbUrlB(url);
    });

    return () => {
      isCancelled = true;
    };
  }, [secondDoc, pageIndexB]);

  const handleSecondFileSelected = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const meta = await validatePdf(buffer);
      setSecondDoc({
        name: file.name,
        size: file.size,
        pageCount: meta.pageCount || 1,
        data: buffer,
      });
      setPageIndexB(0);
    } catch (e) {
      console.error('Failed to load second PDF', e);
    }
  };

  const handlePrevPage = () => {
    if (pageIndexA > 0) setPageIndexA((p) => p - 1);
    if (isSynced && secondDoc && pageIndexB > 0) {
      setPageIndexB((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (currentFile && pageIndexA < pages.length - 1) setPageIndexA((p) => p + 1);
    if (isSynced && secondDoc && pageIndexB < secondDoc.pageCount - 1) {
      setPageIndexB((p) => p + 1);
    }
  };

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <GitCompare className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Compare Two PDF Documents
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Load the first PDF document to inspect changes, versions, and formatting revisions side-by-side.
          </p>
        </div>

        <div className="w-full">
          <FileDropzone onFileSelected={loadFile} />
        </div>
      </div>
    );
  }

  const pageDiff = secondDoc ? secondDoc.pageCount - pages.length : 0;
  const sizeDiff = secondDoc ? secondDoc.size - currentFile.size : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Side-by-Side Comparison
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect document revisions, additions, and layout variances.
            </p>
          </div>
        </div>

        {/* Sync Toggle & Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSynced(!isSynced)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isSynced
                ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {isSynced ? <Link2 className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
            {isSynced ? 'Synchronized Stepping' : 'Independent Navigation'}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevPage}
              disabled={pageIndexA === 0 && (!secondDoc || pageIndexB === 0)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={pageIndexA >= pages.length - 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Difference Stats Bar */}
      {secondDoc && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Page Count Variance</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {pageDiff === 0 ? 'Identical (0 diff)' : `${pageDiff > 0 ? '+' : ''}${pageDiff} pages`}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Size Variance</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {sizeDiff === 0 ? 'Identical' : `${sizeDiff > 0 ? '+' : '-'}${formatBytes(Math.abs(sizeDiff))}`}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Doc A Active Page</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Page {pageIndexA + 1} of {pages.length}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Doc B Active Page</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Page {pageIndexB + 1} of {secondDoc.pageCount}
            </span>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document A Viewer */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="truncate">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block">
                Document A (Original)
              </span>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={currentFile.name}>
                {currentFile.name}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400 shrink-0">
              P.{pageIndexA + 1} / {pages.length}
            </span>
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl min-h-[460px] flex items-center justify-center border border-slate-200 dark:border-slate-800 overflow-hidden">
            {thumbUrlA ? (
              <img
                src={thumbUrlA}
                alt="Document A Page"
                className="max-h-[440px] max-w-full object-contain rounded shadow"
              />
            ) : (
              <div className="text-xs text-slate-400">Loading page preview...</div>
            )}
          </div>
        </div>

        {/* Document B Viewer */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="truncate">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Document B (Comparison)
              </span>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={secondDoc?.name || 'No document loaded'}>
                {secondDoc ? secondDoc.name : 'Upload PDF B to compare'}
              </h3>
            </div>
            {secondDoc && (
              <span className="text-xs font-mono text-slate-400 shrink-0">
                P.{pageIndexB + 1} / {secondDoc.pageCount}
              </span>
            )}
          </div>

          <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl min-h-[460px] flex items-center justify-center border border-slate-200 dark:border-slate-800 overflow-hidden">
            {secondDoc ? (
              thumbUrlB ? (
                <img
                  src={thumbUrlB}
                  alt="Document B Page"
                  className="max-h-[440px] max-w-full object-contain rounded shadow"
                />
              ) : (
                <div className="text-xs text-slate-400">Loading page preview...</div>
              )
            ) : (
              <div className="w-full">
                <FileDropzone onFileSelected={handleSecondFileSelected} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
