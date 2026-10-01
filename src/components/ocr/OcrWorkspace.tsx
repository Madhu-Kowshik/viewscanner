import React, { useState } from 'react';
import {
  ScanText,
  FileText,
  Copy,
  Download,
  Search,
  Check,
  Zap,
  Globe,
  Loader2,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { Button } from '../ui/Button';
import { renderPageThumbnail, runOcrOnImageDataUrl } from '../../lib/pdf/pdf-engine';
import { downloadBlob } from '../../lib/utils';

export const OcrWorkspace: React.FC = () => {
  const { currentFile, pages, loadFile, extractAllTextAction, processing } = usePdf();

  const [ocrLanguage, setOcrLanguage] = useState<'eng' | 'spa' | 'fra' | 'deu' | 'ita' | 'chi_sim'>('eng');
  const [targetScope, setTargetScope] = useState<'all' | 'first'>('all');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const languages = [
    { code: 'eng', name: 'English' },
    { code: 'spa', name: 'Spanish (Español)' },
    { code: 'fra', name: 'French (Français)' },
    { code: 'deu', name: 'German (Deutsch)' },
    { code: 'ita', name: 'Italian (Italiano)' },
    { code: 'chi_sim', name: 'Chinese (Simplified)' },
  ];

  // Quick instant extract of embedded text
  const handleExtractEmbedded = async () => {
    try {
      setStatusMessage('Extracting embedded text streams...');
      const text = await extractAllTextAction();
      setExtractedText(text);
      setStatusMessage('');
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Failed to extract embedded text');
    }
  };

  // Optical Character Recognition (OCR) on rendered pages
  const handleRunOcr = async () => {
    if (!currentFile) return;

    setIsRecognizing(true);
    setOcrProgress(5);
    setStatusMessage('Initializing neural OCR engine...');

    try {
      const pageIndices = targetScope === 'first' ? [0] : pages.map((_, i) => i);
      let combinedOcrText = '';

      for (let i = 0; i < pageIndices.length; i++) {
        const pageIdx = pageIndices[i];
        const pageNum = pageIdx + 1;
        setStatusMessage(`Rendering high-res page ${pageNum} of ${pageIndices.length}...`);
        setOcrProgress(Math.round(((i + 0.2) / pageIndices.length) * 100));

        // Render page at 2.0x scale (144-150 DPI) for optimal OCR accuracy
        const thumbUrl = await renderPageThumbnail(currentFile.data, pageIdx, 2.0);

        setStatusMessage(`Recognizing optical text on page ${pageNum}...`);
        const pageText = await runOcrOnImageDataUrl(thumbUrl, ocrLanguage);

        combinedOcrText += `\n--- PAGE ${pageNum} ---\n\n${pageText}\n`;
        setOcrProgress(Math.round(((i + 1) / pageIndices.length) * 100));
      }

      setExtractedText(combinedOcrText.trim());
      setStatusMessage('');
    } catch (err: any) {
      console.error('OCR failed', err);
      setStatusMessage(`OCR Error: ${err.message || 'Recognition failed'}`);
    } finally {
      setIsRecognizing(false);
      setOcrProgress(0);
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
    const baseName = currentFile ? currentFile.name.replace(/\.pdf$/i, '') : 'document';
    downloadBlob(blob, `${baseName}-ocr-text.txt`);
  };

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <ScanText className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            OCR & Text Extraction
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Extract text from scanned PDFs, photos, and standard documents using browser-based neural optical character recognition.
          </p>
        </div>

        <div className="w-full">
          <FileDropzone onFileSelected={loadFile} />
        </div>
      </div>
    );
  }

  const filteredText = searchTerm
    ? extractedText
        .split('\n')
        .filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase()))
        .join('\n')
    : extractedText;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <ScanText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Optical Character Recognition (OCR)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentFile.name}</span> ({pages.length} pages)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExtractEmbedded}
            disabled={isRecognizing || processing.status === 'processing'}
            className="text-xs"
          >
            Extract Embedded Text
          </Button>

          <Button
            onClick={handleRunOcr}
            disabled={isRecognizing || processing.status === 'processing'}
            className="gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium"
          >
            {isRecognizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Recognizing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                Run OCR Recognition
              </>
            )}
          </Button>
        </div>
      </div>

      {/* OCR Settings Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Document Language
          </label>
          <select
            value={ocrLanguage}
            onChange={(e) => setOcrLanguage(e.target.value as any)}
            disabled={isRecognizing}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">Select the primary language printed on the scanned page.</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
            Scan Scope
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTargetScope('all')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                targetScope === 'all'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
              }`}
            >
              All {pages.length} Pages
            </button>
            <button
              onClick={() => setTargetScope('first')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                targetScope === 'first'
                  ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
              }`}
            >
              First Page Only
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Process entire document or test OCR on page 1 first.</p>
        </div>
      </div>

      {/* Progress Notification */}
      {isRecognizing && (
        <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800/80 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-brand-800 dark:text-brand-200 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {statusMessage || 'Processing...'}
            </span>
            <span className="font-mono font-bold text-brand-700 dark:text-brand-300">{ocrProgress}%</span>
          </div>
          <div className="w-full bg-brand-200 dark:bg-brand-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-brand-600 dark:bg-brand-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${ocrProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Extracted Text Result Viewer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Extracted Text Payload
            </h3>
            {extractedText && (
              <span className="text-[11px] font-mono text-slate-400">
                ({extractedText.length.toLocaleString()} characters)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {extractedText && (
              <>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search in text..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-brand-500 w-36 sm:w-48"
                  />
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyText}
                  className="gap-1.5 text-xs h-7"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadTxt}
                  className="gap-1.5 text-xs h-7"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save .TXT
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="p-4">
          {extractedText ? (
            <textarea
              readOnly
              value={filteredText}
              rows={16}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-y"
            />
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Click <span className="font-semibold text-slate-600 dark:text-slate-300">Run OCR Recognition</span> to scan text from images, or <span className="font-semibold text-slate-600 dark:text-slate-300">Extract Embedded Text</span> to read digital documents.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
