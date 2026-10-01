import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';
import { cn, formatBytes } from '../../lib/utils';

export interface FileDropzoneProps {
  multiple?: boolean;
  onFilesSelected?: (files: File[]) => void;
  accept?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  multiple = false,
  onFilesSelected,
  title = 'Drop your PDF here',
  subtitle = 'or choose a file from your device',
  className,
}) => {
  const { currentFile, processing, loadFile, loadSampleDoc, clearCurrentFile } = usePdf();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );

      if (files.length === 0) {
        return;
      }

      if (multiple && onFilesSelected) {
        onFilesSelected(files);
      } else {
        await loadFile(files[0]);
      }
    }
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      if (multiple && onFilesSelected) {
        onFilesSelected(files);
      } else {
        await loadFile(files[0]);
      }
      // Reset input value so re-uploading the same file triggers change
      e.target.value = '';
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        id="pdf-file-upload-input"
        aria-label="Upload PDF file"
      />

      {/* Error state alert if present */}
      {processing.status === 'error' && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold">Unable to open document</h4>
            <p className="mt-0.5 text-xs text-rose-800 dark:text-rose-300">
              {processing.message ||
                "OmniPDF couldn't read this PDF. The file may be corrupted or password protected."}
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openFilePicker}
                className="bg-white dark:bg-slate-900 text-rose-800 border-rose-300"
              >
                Choose another file
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/50',
          isDragOver
            ? 'border-brand-500 bg-brand-50/50 scale-[1.008] shadow-lg dark:bg-brand-950/30'
            : 'border-slate-200 bg-white hover:border-brand-400 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/50 dark:hover:bg-slate-800/40'
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-xs dark:bg-brand-950/70 dark:text-brand-400 mb-4 transition-transform group-hover:scale-110">
          <UploadCloud className="h-8 w-8" />
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {subtitle}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
          >
            {multiple ? 'Choose PDF Files' : 'Choose PDF'}
          </Button>

          {!multiple && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={(e) => {
                e.stopPropagation();
                loadSampleDoc();
              }}
              className="group"
            >
              <Sparkles className="w-4 h-4 mr-1 text-amber-500 group-hover:rotate-12 transition-transform" />
              Try Sample PDF
            </Button>
          )}
        </div>

        <div className="mt-6 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          <span>Standard & Multi-page PDF</span>
          <span>•</span>
          <span>🔒 100% Client-Side Privacy</span>
        </div>
      </div>

      {/* If a file is already loaded and we want to show its quick card */}
      {currentFile && !multiple && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-subtle dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 truncate">
            <div className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
              <FileText className="h-5 w-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {currentFile.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentFile.pageCount} {currentFile.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(currentFile.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openFilePicker}
              title="Replace PDF"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Change
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCurrentFile}
              className="text-slate-500 hover:text-rose-600"
            >
              Remove
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
