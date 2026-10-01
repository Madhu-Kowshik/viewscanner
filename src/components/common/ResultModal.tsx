import React from 'react';
import { CheckCircle2, Download, FileText, ArrowRight, ExternalLink, Archive } from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';
import { formatBytes } from '../../lib/utils';
import { downloadBlob } from '../../lib/pdf/pdf-engine';

export interface ResultModalProps {
  onOpenViewer?: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ onOpenViewer }) => {
  const { result, clearResult } = usePdf();

  if (!result) return null;

  const handleDownload = () => {
    if (result.type === 'zip') {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      downloadBlob(result.data, result.fileName);
    }
  };

  const handleSingleDownload = (data: Uint8Array, fileName: string) => {
    downloadBlob(data, fileName);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              PDF is ready!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your document was processed directly in your browser.
            </p>
          </div>
        </div>

        {/* Result details card */}
        <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 truncate">
              <div className="rounded-lg bg-white p-2.5 shadow-xs border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700">
                {result.type === 'zip' ? (
                  <Archive className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                ) : (
                  <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                )}
              </div>
              <div className="truncate">
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                  {result.fileName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {result.pageCount} {result.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(result.size)}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 shrink-0">
              Ready
            </span>
          </div>

          {/* If multiple split files */}
          {result.multiFiles && result.multiFiles.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Generated Parts ({result.multiFiles.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {result.multiFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/80 p-2 rounded-lg border border-slate-150 dark:border-slate-700"
                  >
                    <span className="truncate max-w-[240px] font-medium text-slate-700 dark:text-slate-300">
                      {file.name}
                    </span>
                    <button
                      onClick={() => handleSingleDownload(file.data, file.name)}
                      className="text-brand-600 hover:text-brand-700 font-semibold ml-2 hover:underline shrink-0"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Button
            variant="primary"
            size="lg"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="w-5 h-5 mr-1" />
            {result.type === 'zip' ? 'Download ZIP Bundle' : 'Download PDF'}
          </Button>

          {result.type === 'pdf' && onOpenViewer && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                clearResult();
                onOpenViewer();
              }}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Preview in Viewer
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>🔒 100% Private local processing</span>
          <button
            onClick={clearResult}
            className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 inline-flex items-center gap-1 hover:underline"
          >
            Start another operation
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
