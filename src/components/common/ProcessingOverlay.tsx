import React from 'react';
import { Loader2 } from 'lucide-react';
import { usePdf } from '../../context/PdfContext';

export const ProcessingOverlay: React.FC = () => {
  const { processing } = usePdf();

  if (processing.status !== 'reading' && processing.status !== 'processing') {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-[2px] transition-all"
    >
      <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-2xl border border-slate-150 dark:bg-slate-900 dark:border-slate-800 max-w-sm w-full mx-4 text-center">
        <div className="relative mb-4 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center dark:bg-brand-950/60">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600 dark:text-brand-400" />
          </div>
        </div>

        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
          {processing.status === 'reading' ? 'Reading PDF' : 'Processing Document'}
        </h4>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {processing.message || 'Please wait a moment...'}
        </p>

        {typeof processing.progress === 'number' && (
          <div className="mt-4 w-full">
            <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
              <span>Progress</span>
              <span>{processing.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-brand-600 dark:bg-brand-500 transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(0, processing.progress))}%` }}
              />
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          🔒 Processed locally in your browser
        </p>
      </div>
    </div>
  );
};
