import React, { useState, useRef } from 'react';
import {
  Type,
  Pen,
  Highlighter,
  Square,
  Eraser,
  ShieldAlert,
  Image as ImageIcon,
  Save,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';
import { FileDropzone } from '../common/FileDropzone';
import { AnnotationItem, AnnotationType } from '../../types/pdf';

export const PdfEditor: React.FC = () => {
  const { currentFile, pages, applyAnnotations } = usePdf();
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<AnnotationType>('text');

  // Annotation customization
  const [color, setColor] = useState('#2563eb');
  const [fontSize, setFontSize] = useState(14);
  const [textInput, setTextInput] = useState('Sample Text');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);

  // Dragging creation state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  if (!currentFile || pages.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            PDF Editor & Annotator
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add text overlays, highlight, draw, whiteout, and redact document pages.
          </p>
        </div>
        <FileDropzone title="Drop your PDF here to edit" />
      </div>
    );
  }

  const currentPage = pages[selectedPageIndex];
  const pageAnnotations = annotations.filter((a) => a.pageNumber === selectedPageIndex + 1);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setStartPoint({ x, y });
    setIsDrawing(true);

    if (activeTool === 'text') {
      const newAnn: AnnotationItem = {
        id: Math.random().toString(36).substring(2, 9),
        pageNumber: selectedPageIndex + 1,
        type: 'text',
        x,
        y,
        width: 0.25,
        height: 0.05,
        text: textInput || 'Text',
        fontSize,
        color,
        opacity: 1.0,
      };
      setAnnotations((prev) => [...prev, newAnn]);
      setIsDrawing(false);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !containerRef.current) {
      setIsDrawing(false);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const endX = (e.clientX - rect.left) / rect.width;
    const endY = (e.clientY - rect.top) / rect.height;

    const x = Math.min(startPoint.x, endX);
    const y = Math.min(startPoint.y, endY);
    const width = Math.max(0.04, Math.abs(endX - startPoint.x));
    const height = Math.max(0.02, Math.abs(endY - startPoint.y));

    const newAnn: AnnotationItem = {
      id: Math.random().toString(36).substring(2, 9),
      pageNumber: selectedPageIndex + 1,
      type: activeTool,
      x,
      y,
      width,
      height,
      color,
      opacity: activeTool === 'highlight' ? 0.35 : 1.0,
    };

    setAnnotations((prev) => [...prev, newAnn]);
    setIsDrawing(false);
    setStartPoint(null);
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveToPdf = async () => {
    if (annotations.length === 0) return;
    await applyAnnotations(annotations);
  };

  const tools = [
    { id: 'text', label: 'Add Text', icon: Type },
    { id: 'highlight', label: 'Highlight', icon: Highlighter },
    { id: 'whiteout', label: 'Whiteout', icon: Eraser },
    { id: 'redaction', label: 'Redact', icon: ShieldAlert },
    { id: 'shape-rect', label: 'Rectangle', icon: Square },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            PDF Editor
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Document: <strong className="text-slate-800 dark:text-slate-200">{currentFile.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {annotations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnnotations([])}
              className="text-slate-500 hover:text-rose-600"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Clear Edits
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveToPdf}
            disabled={annotations.length === 0}
          >
            <Save className="w-4 h-4 mr-1.5" />
            Apply {annotations.length} Edits to PDF
          </Button>
        </div>
      </div>

      {/* Toolbar strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200/80 bg-white shadow-subtle dark:border-slate-800 dark:bg-slate-900">
        {/* Tool selector */}
        <div className="flex items-center gap-1">
          {tools.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTool(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white dark:bg-brand-500 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tool options */}
        <div className="flex items-center gap-3">
          {activeTool === 'text' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Text to place"
                className="text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg w-32 dark:border-slate-700"
              />
              <select
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800 border rounded-lg dark:border-slate-700"
              >
                <option value={10}>10pt</option>
                <option value={12}>12pt</option>
                <option value={14}>14pt</option>
                <option value={18}>18pt</option>
                <option value={24}>24pt</option>
              </select>
            </div>
          )}

          {activeTool !== 'whiteout' && activeTool !== 'redaction' && (
            <div className="flex items-center gap-1.5">
              {['#2563eb', '#dc2626', '#16a34a', '#eab308', '#000000'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-110 border-brand-500 ring-2 ring-brand-500/30' : 'border-white'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Canvas Area */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Page {selectedPageIndex + 1} of {pages.length}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={selectedPageIndex === 0}
                onClick={() => setSelectedPageIndex((p) => p - 1)}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={selectedPageIndex === pages.length - 1}
                onClick={() => setSelectedPageIndex((p) => p + 1)}
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Interactive Document Page Container */}
          <div className="my-4 flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-auto min-h-[460px]">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className="relative w-[360px] sm:w-[420px] aspect-[1/1.414] bg-white shadow-xl border border-slate-300 dark:border-slate-700 rounded overflow-hidden select-none cursor-crosshair"
            >
              {currentPage?.thumbnailUrl ? (
                <img
                  src={currentPage.thumbnailUrl}
                  alt="Page"
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <FileText className="h-12 w-12 mb-2 opacity-50" />
                  <span className="text-xs">Page {selectedPageIndex + 1}</span>
                </div>
              )}

              {/* Rendered Annotations Overlays */}
              {pageAnnotations.map((ann) => (
                <div
                  key={ann.id}
                  className={`absolute rounded-xs pointer-events-none transition-all ${
                    ann.type === 'whiteout'
                      ? 'bg-white border border-slate-200'
                      : ann.type === 'redaction'
                      ? 'bg-black'
                      : ann.type === 'highlight'
                      ? 'bg-yellow-300/40'
                      : ann.type === 'shape-rect'
                      ? 'border-2 border-brand-500'
                      : 'text-slate-900 font-sans'
                  }`}
                  style={{
                    left: `${ann.x * 100}%`,
                    top: `${ann.y * 100}%`,
                    width: ann.type === 'text' ? 'auto' : `${ann.width * 100}%`,
                    height: ann.type === 'text' ? 'auto' : `${ann.height * 100}%`,
                    color: ann.color,
                    fontSize: ann.fontSize ? `${ann.fontSize}px` : undefined,
                  }}
                >
                  {ann.type === 'text' && (
                    <span className="font-semibold bg-white/80 dark:bg-black/80 px-1 rounded shadow-xs">
                      {ann.text}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-center text-slate-400">
            {activeTool === 'text'
              ? 'Click anywhere on the document to place text.'
              : 'Click and drag across the page to apply the selected tool.'}
          </p>
        </div>

        {/* Sidebar: Layer / Annotation Inspector */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Page Edits ({pageAnnotations.length})
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto">
              {pageAnnotations.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No annotations on this page yet. Use the tools above to add edits.
                </p>
              ) : (
                pageAnnotations.map((ann, idx) => (
                  <div
                    key={ann.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-150 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">
                        {idx + 1}. {ann.type}
                      </span>
                      {ann.text && (
                        <span className="text-slate-400 truncate max-w-[100px]">
                          "{ann.text}"
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnotation(ann.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveToPdf}
              disabled={annotations.length === 0}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Save to PDF Document
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
