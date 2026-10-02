import React, { useState } from 'react';
import {
  PenTool,
  Type,
  Upload,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';
import { SignaturePad } from './SignaturePad';
import { FileDropzone } from '../common/FileDropzone';

export const SignWorkspace: React.FC = () => {
  const { currentFile, pages, applySignature } = usePdf();
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [typedName, setTypedName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);

  // Position on page (normalized 0 - 1)
  const [posX, setPosX] = useState(0.6);
  const [posY, setPosY] = useState(0.8);
  const [sigWidth, setSigWidth] = useState(0.25);
  const [sigHeight, setSigHeight] = useState(0.08);

  if (!currentFile || pages.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Sign PDF Document
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Draw, type, or upload your signature and embed it cleanly onto your document.
          </p>
        </div>
        <FileDropzone title="Drop your PDF here to sign" />
      </div>
    );
  }

  // Generates canvas image for typed signature
  const handleGenerateTypedSignature = (text: string) => {
    setTypedName(text);
    if (!text.trim()) {
      setSignatureDataUrl('');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = 'italic 38px "Brush Script MT", "Caveat", "Segoe Script", cursive';
    ctx.fillStyle = '#1e3a8a';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 20, 60);

    setSignatureDataUrl(canvas.toDataURL('image/png'));
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSignatureDataUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleApply = async () => {
    if (!signatureDataUrl) return;
    await applySignature(selectedPageIndex, signatureDataUrl, posX, posY, sigWidth, sigHeight);
  };

  const currentPage = pages[selectedPageIndex];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Visual Signature Stamp
          </h2>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            Electronic Visual Placement
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Create and position an electronic visual signature stamp on <strong className="text-slate-800 dark:text-slate-200">{currentFile.name}</strong>. (For cryptographic PKI X.509 certificates, use an enterprise digital certificate service).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Signature Creation Panel */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-5">
          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTab('draw')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                tab === 'draw'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>Draw</span>
            </button>
            <button
              onClick={() => setTab('type')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                tab === 'type'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Type className="h-3.5 w-3.5" />
              <span>Type</span>
            </button>
            <button
              onClick={() => setTab('upload')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                tab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload</span>
            </button>
          </div>

          {/* Mode Content */}
          {tab === 'draw' && (
            <SignaturePad onSave={(data) => setSignatureDataUrl(data)} />
          )}

          {tab === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Type your name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={typedName}
                  onChange={(e) => handleGenerateTypedSignature(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {typedName && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center min-h-[90px]">
                  <span className="text-3xl italic font-serif text-blue-900 dark:text-blue-300">
                    {typedName}
                  </span>
                </div>
              )}
            </div>
          )}

          {tab === 'upload' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Upload signature image (PNG / JPG)
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Transparent background PNG works best
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleUploadImage}
                  className="hidden"
                />
              </label>

              {signatureDataUrl && (
                <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-800 flex justify-center">
                  <img src={signatureDataUrl} alt="Signature preview" className="max-h-20 object-contain" />
                </div>
              )}
            </div>
          )}

          {/* Placement sliders */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Position on Page
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500">Horizontal (X): {Math.round(posX * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.02"
                  value={posX}
                  onChange={(e) => setPosX(parseFloat(e.target.value))}
                  className="w-full accent-brand-600 mt-1"
                />
              </div>
              <div>
                <label className="text-slate-500">Vertical (Y): {Math.round(posY * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.02"
                  value={posY}
                  onChange={(e) => setPosY(parseFloat(e.target.value))}
                  className="w-full accent-brand-600 mt-1"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-start gap-2.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>Note</strong>: This embeds a verified visual electronic signature into the document stream. (Not a cryptographic PKI certificate).
            </span>
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={!signatureDataUrl}
            onClick={handleApply}
            className="w-full"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Apply Signature to Page {selectedPageIndex + 1}
          </Button>
        </div>

        {/* RIGHT: Page Placement Preview */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Page {selectedPageIndex + 1} of {pages.length}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={selectedPageIndex === 0}
                onClick={() => setSelectedPageIndex(p => p - 1)}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={selectedPageIndex === pages.length - 1}
                onClick={() => setSelectedPageIndex(p => p + 1)}
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Interactive Page Simulation */}
          <div className="my-4 flex-1 flex items-center justify-center p-3 bg-slate-100 dark:bg-slate-950 rounded-xl">
            <div
              className="relative w-64 aspect-[1/1.414] bg-white shadow-md border border-slate-300 dark:border-slate-700 rounded overflow-hidden cursor-crosshair select-none"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = (e.clientX - rect.left) / rect.width;
                const clickY = (e.clientY - rect.top) / rect.height;
                setPosX(Math.max(0, Math.min(0.75, clickX - sigWidth / 2)));
                setPosY(Math.max(0, Math.min(0.9, clickY - sigHeight / 2)));
              }}
            >
              {currentPage?.thumbnailUrl ? (
                <img
                  src={currentPage.thumbnailUrl}
                  alt="Page"
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <FileText className="h-10 w-10 mb-2 opacity-50" />
                  <span className="text-xs">Page {selectedPageIndex + 1}</span>
                </div>
              )}

              {/* Signature Overlay Indicator */}
              {signatureDataUrl && (
                <div
                  className="absolute border-2 border-brand-500 bg-brand-50/40 rounded flex items-center justify-center p-1 pointer-events-none"
                  style={{
                    left: `${posX * 100}%`,
                    top: `${posY * 100}%`,
                    width: `${sigWidth * 100}%`,
                    height: `${sigHeight * 100}%`,
                  }}
                >
                  <img src={signatureDataUrl} alt="sig" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-center text-slate-400">
            Click anywhere on the preview to position your signature.
          </p>
        </div>
      </div>
    </div>
  );
};
