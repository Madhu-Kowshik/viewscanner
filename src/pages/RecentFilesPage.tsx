import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Trash2,
  FileText,
  Upload,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { getRecentFiles, removeRecentFile, clearRecentFiles } from '../lib/recent-files';
import { RecentFileMeta } from '../types/pdf';
import { Button } from '../components/ui/Button';
import { formatBytes } from '../lib/utils';
import { usePdf } from '../context/PdfContext';

export const RecentFilesPage: React.FC = () => {
  const [recents, setRecents] = useState<RecentFileMeta[]>(() => getRecentFiles());
  const { loadSampleDoc } = usePdf();
  const navigate = useNavigate();

  const handleRemove = (id: string) => {
    removeRecentFile(id);
    setRecents(getRecentFiles());
  };

  const handleClearAll = () => {
    clearRecentFiles();
    setRecents([]);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Recent Activity
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A private log of recent PDF sessions on this device.
          </p>
        </div>

        {recents.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-slate-600 hover:text-rose-600 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear Activity
          </Button>
        )}
      </div>

      {recents.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-subtle">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-4">
            <Clock className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            No recent files yet
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            Documents you edit, organize, or merge will appear here for your convenience during your browser session.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button variant="primary" size="md" onClick={() => navigate('/organize')}>
              <Upload className="w-4 h-4 mr-1.5" />
              Open a PDF
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={async () => {
                await loadSampleDoc();
                navigate('/organize');
              }}
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
              Load Sample PDF
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {recents.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-white shadow-subtle dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center gap-3.5 truncate">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(item.size)} •{' '}
                    <span className="text-brand-600 dark:text-brand-400 font-medium">
                      {item.operation}
                    </span>{' '}
                    • {formatDate(item.timestamp)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  aria-label="Remove entry"
                  title="Remove from history"
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-500">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <span>
              For your privacy, recent history only records metadata (names and page counts). Document contents are never stored permanently without your explicit action.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
