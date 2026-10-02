import React, { useState, useEffect, useRef } from 'react';
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
  MousePointerClick,
  Sparkles,
  Check,
  X,
  Sliders,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';
import { FileDropzone } from '../common/FileDropzone';
import { AnnotationItem, AnnotationType } from '../../types/pdf';
import {
  extractPageTextItems,
  replaceVectorTextInPdf,
  reconstructScannedDocumentWithEdits,
  ScannedTextEditItem,
  validateExportedEdits,
  PdfTextItemInfo,
  TextReplacementEdit,
} from '../../lib/pdf/pdf-engine';

export const PdfEditor: React.FC = () => {
  const { currentFile, pages, applyAnnotations, updateActiveDocument, getPageClassification } = usePdf();
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);

  // Mode: 'annotate' vs 'edit-existing'
  const [editorMode, setEditorMode] = useState<'annotate' | 'edit-existing'>('edit-existing');

  // Annotation Mode State
  const [activeTool, setActiveTool] = useState<AnnotationType>('text');
  const [color, setColor] = useState('#2563eb');
  const [fontSize, setFontSize] = useState(14);
  const [textInput, setTextInput] = useState('Sample Text');
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Edit Existing Vector Text Mode State
  const [extractedTextItems, setExtractedTextItems] = useState<PdfTextItemInfo[]>([]);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [selectedTextItem, setSelectedTextItem] = useState<PdfTextItemInfo | null>(null);
  const [replacementText, setReplacementText] = useState('');
  const [replacementFontSize, setReplacementFontSize] = useState(14);
  const [replacementColor, setReplacementColor] = useState('#000000');
  const [replacementFontFamily, setReplacementFontFamily] = useState<'sans' | 'serif' | 'mono' | 'bold'>('sans');
  const [vectorEdits, setVectorEdits] = useState<TextReplacementEdit[]>([]);
  const [isSavingVector, setIsSavingVector] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load extracted vector text items whenever the page index or document changes in edit-existing mode
  useEffect(() => {
    if (!currentFile || editorMode !== 'edit-existing') return;

    let isMounted = true;
    setIsLoadingText(true);
    setSelectedTextItem(null);

    extractPageTextItems(currentFile.data, selectedPageIndex + 1)
      .then((items) => {
        if (isMounted) {
          setExtractedTextItems(items);
          setIsLoadingText(false);
        }
      })
      .catch((err) => {
        console.warn('Could not extract vector text from page:', err);
        if (isMounted) {
          setExtractedTextItems([]);
          setIsLoadingText(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentFile, selectedPageIndex, editorMode]);

  if (!currentFile || pages.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            PDF Editor & Annotator
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Edit existing text objects, add text overlays, highlight, draw, whiteout, and redact.
          </p>
        </div>
        <FileDropzone title="Drop your PDF here to edit" />
      </div>
    );
  }

  const currentPage = pages[selectedPageIndex];
  const pageAnnotations = annotations.filter((a) => a.pageNumber === selectedPageIndex + 1);
  const pageVectorEdits = vectorEdits.filter((e) => e.pageNumber === selectedPageIndex + 1);

  // Handlers for Add Annotation Mode
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editorMode !== 'annotate' || !containerRef.current) return;
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
    if (editorMode !== 'annotate' || !isDrawing || !startPoint || !containerRef.current) {
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

  const handleSaveAnnotations = async () => {
    if (annotations.length === 0) return;
    await applyAnnotations(annotations);
  };

  // Handlers for Edit Existing Vector Text Mode
  const handleSelectTextItem = (item: PdfTextItemInfo) => {
    setSelectedTextItem(item);
    // If already edited, use current edit, else original text
    const existingEdit = vectorEdits.find(
      (e) => e.pageNumber === selectedPageIndex + 1 && e.pdfX === item.pdfX && e.pdfY === item.pdfY
    );
    setReplacementText(existingEdit ? existingEdit.newText : item.text);
    setReplacementFontSize(existingEdit?.fontSize || item.fontSize || 14);
    setReplacementColor(existingEdit?.color || '#000000');
    setReplacementFontFamily((existingEdit?.fontFamily as any) || 'sans');
  };

  const handleApplyTextEdit = () => {
    if (!selectedTextItem) return;

    const newEdit: TextReplacementEdit = {
      pageNumber: selectedPageIndex + 1,
      originalText: selectedTextItem.text,
      pdfX: selectedTextItem.pdfX,
      pdfY: selectedTextItem.pdfY,
      pdfWidth: selectedTextItem.pdfWidth,
      pdfHeight: selectedTextItem.pdfHeight,
      newText: replacementText,
      fontSize: replacementFontSize,
      color: replacementColor,
      fontFamily: replacementFontFamily,
      isDeleted: false,
    };

    setVectorEdits((prev) => [
      ...prev.filter(
        (e) =>
          !(
            e.pageNumber === selectedPageIndex + 1 &&
            e.pdfX === selectedTextItem.pdfX &&
            e.pdfY === selectedTextItem.pdfY
          )
      ),
      newEdit,
    ]);

    setSelectedTextItem(null);
  };

  const handleDeleteVectorText = () => {
    if (!selectedTextItem) return;

    const deleteEdit: TextReplacementEdit = {
      pageNumber: selectedPageIndex + 1,
      originalText: selectedTextItem.text,
      pdfX: selectedTextItem.pdfX,
      pdfY: selectedTextItem.pdfY,
      pdfWidth: selectedTextItem.pdfWidth,
      pdfHeight: selectedTextItem.pdfHeight,
      newText: '',
      isDeleted: true,
    };

    setVectorEdits((prev) => [
      ...prev.filter(
        (e) =>
          !(
            e.pageNumber === selectedPageIndex + 1 &&
            e.pdfX === selectedTextItem.pdfX &&
            e.pdfY === selectedTextItem.pdfY
          )
      ),
      deleteEdit,
    ]);

    setSelectedTextItem(null);
  };

  const handleSaveVectorEdits = async () => {
    if (vectorEdits.length === 0 || !currentFile) return;
    try {
      setIsSavingVector(true);
      setSaveError(null);

      let updatedBytes: Uint8Array<any> = new Uint8Array(currentFile.data);
      const vectorPageEdits: TextReplacementEdit[] = [];
      const scannedPageEdits: ScannedTextEditItem[] = [];

      for (const edit of vectorEdits) {
        const cls = getPageClassification(edit.pageNumber - 1);
        if (cls?.type === 'scanned' || cls?.type === 'hybrid') {
          scannedPageEdits.push({
            id: `edit_${edit.pageNumber}_${Math.round(edit.pdfX)}_${Math.round(edit.pdfY)}`,
            pageNumber: edit.pageNumber,
            originalText: edit.originalText || '',
            newText: edit.newText,
            pdfX: edit.pdfX,
            pdfY: edit.pdfY,
            pdfWidth: edit.pdfWidth,
            pdfHeight: edit.pdfHeight,
            color: edit.color,
            fontSize: edit.fontSize,
            fontFamily: edit.fontFamily as any,
            isDeleted: edit.isDeleted,
          });
        } else {
          vectorPageEdits.push(edit);
        }
      }

      if (scannedPageEdits.length > 0) {
        updatedBytes = await reconstructScannedDocumentWithEdits(updatedBytes, scannedPageEdits);
      }
      if (vectorPageEdits.length > 0) {
        updatedBytes = await replaceVectorTextInPdf(updatedBytes, vectorPageEdits);
      }

      // Critical Save Validation (Phase 7)
      const valResult = await validateExportedEdits(currentFile.data, updatedBytes, vectorEdits);
      if (!valResult.valid) {
        throw new Error(valResult.error || 'Failed to verify changes in exported document');
      }

      await updateActiveDocument(updatedBytes, 'Edit PDF Text');
      setVectorEdits([]);
      setSelectedTextItem(null);
    } catch (err: any) {
      console.error('Failed saving text edits:', err);
      setSaveError(err.message || 'Error persisting edits to PDF document');
    } finally {
      setIsSavingVector(false);
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            PDF Editor
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Document: <strong className="text-slate-800 dark:text-slate-200">{currentFile.name}</strong>
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl">
          <button
            onClick={() => setEditorMode('edit-existing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              editorMode === 'edit-existing'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Edit Existing Text</span>
          </button>
          <button
            onClick={() => setEditorMode('annotate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              editorMode === 'annotate'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
            <span>Add Annotations & Shapes</span>
          </button>
        </div>
      </div>

      {/* Page Classification & Integrity Banner */}
      {(() => {
        const cls = getPageClassification(selectedPageIndex);
        if (cls?.type === 'hybrid') {
          return (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>Scanned document with OCR text layer detected</strong> — edits on this page will reconstruct the visible raster image pixels and keep the OCR text layer synchronized.
              </span>
            </div>
          );
        }
        if (cls?.type === 'scanned') {
          return (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-800 dark:text-blue-300">
              <FileText className="w-4 h-4 shrink-0 text-blue-600" />
              <span>
                <strong>Scanned document detected</strong> — edits will reconstruct the visible page with tone-matched background patches.
              </span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              <strong>Vector PDF detected</strong> — native text editing enabled.
            </span>
          </div>
        );
      })()}

      {saveError && (
        <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{saveError}</span>
          </div>
          <button onClick={() => setSaveError(null)} className="p-1 hover:bg-rose-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Canvas Editor Area */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          {/* Top Toolbar depending on mode */}
          {editorMode === 'annotate' ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tool customization controls */}
              <div className="flex items-center gap-2">
                {activeTool === 'text' && (
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Text to place..."
                    className="w-32 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                )}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                  title="Pick ink color"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <MousePointerClick className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span className="font-semibold">True PDF Text Editor</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-bold">
                  Vector Native • No Blurriness
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {isLoadingText ? 'Scanning text...' : `${extractedTextItems.length} text elements detected`}
              </span>
            </div>
          )}

          {/* Page Navigation & Zoom Header */}
          <div className="flex items-center justify-between py-2 text-xs font-semibold text-slate-500">
            <span>
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
          <div className="my-2 flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-auto min-h-[460px]">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className={`relative w-[360px] sm:w-[460px] aspect-[1/1.414] bg-white shadow-xl border border-slate-300 dark:border-slate-700 rounded overflow-hidden select-none ${
                editorMode === 'annotate' ? 'cursor-crosshair' : 'cursor-default'
              }`}
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

              {/* Mode A: Rendered Annotations Overlays */}
              {editorMode === 'annotate' &&
                pageAnnotations.map((ann) => (
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

              {/* Mode B: Extracted Native Vector Text Clickable Items */}
              {editorMode === 'edit-existing' &&
                extractedTextItems.map((item) => {
                  const existingEdit = vectorEdits.find(
                    (e) =>
                      e.pageNumber === selectedPageIndex + 1 &&
                      e.pdfX === item.pdfX &&
                      e.pdfY === item.pdfY
                  );
                  const isSelected = selectedTextItem?.id === item.id;
                  const isDeleted = existingEdit?.isDeleted;
                  const isModified = existingEdit && !isDeleted;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectTextItem(item)}
                      title={`Click to edit: "${item.text}"`}
                      className={`absolute cursor-pointer transition-all border ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/25 ring-2 ring-brand-500 z-30'
                          : isModified
                          ? 'border-emerald-500 bg-white ring-1 ring-emerald-400 z-20'
                          : isDeleted
                          ? 'border-rose-400 bg-rose-100/70 opacity-40 line-through z-10'
                          : 'border-transparent hover:border-brand-400 hover:bg-brand-500/15'
                      }`}
                      style={{
                        left: `${item.x * 100}%`,
                        top: `${item.y * 100}%`,
                        width: `${item.width * 100}%`,
                        height: `${item.height * 100}%`,
                      }}
                    >
                      {/* If modified, show the replacement text on top of the original */}
                      {isModified && (
                        <div
                          className="w-full h-full flex items-center bg-white px-0.5 text-slate-900 font-sans truncate shadow-2xs"
                          style={{
                            fontSize: `${Math.max(9, (existingEdit?.fontSize || item.fontSize) * 0.75)}px`,
                            color: existingEdit?.color || '#000000',
                          }}
                        >
                          {existingEdit?.newText}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <p className="text-[11px] text-center text-slate-400">
            {editorMode === 'annotate'
              ? activeTool === 'text'
                ? 'Click anywhere on the document to place text overlay.'
                : 'Click and drag across the page to apply the selected tool.'
              : 'Click any word or sentence on the page to edit, replace, or delete existing text.'}
          </p>
        </div>

        {/* Sidebar: Inspector & Properties Panel */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            {editorMode === 'edit-existing' ? (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Text Element Editor
                  </span>
                  <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-full">
                    {pageVectorEdits.length} Edits Pending
                  </span>
                </div>

                {selectedTextItem ? (
                  <div className="mt-4 space-y-4 animate-in fade-in">
                    <div>
                      <label className="text-[11px] font-medium text-slate-500">
                        Original Text Detected
                      </label>
                      <div className="mt-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs font-mono text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        "{selectedTextItem.text}"
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        Replacement Text
                      </label>
                      <textarea
                        rows={2}
                        value={replacementText}
                        onChange={(e) => setReplacementText(e.target.value)}
                        placeholder="Type new text..."
                        className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          Font Size ({replacementFontSize}pt)
                        </label>
                        <input
                          type="range"
                          min={8}
                          max={36}
                          value={replacementFontSize}
                          onChange={(e) => setReplacementFontSize(Number(e.target.value))}
                          className="w-full mt-1 accent-brand-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          Ink Color
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={replacementColor}
                            onChange={(e) => setReplacementColor(e.target.value)}
                            className="w-7 h-7 rounded border-0 cursor-pointer"
                          />
                          <span className="text-[11px] font-mono text-slate-500 uppercase">
                            {replacementColor}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        Typography Style
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 mt-1">
                        {(['sans', 'serif', 'mono', 'bold'] as const).map((style) => (
                          <button
                            key={style}
                            onClick={() => setReplacementFontFamily(style)}
                            className={`py-1 text-[11px] capitalize rounded-lg border transition-all ${
                              replacementFontFamily === style
                                ? 'bg-brand-600 text-white border-brand-600 font-bold'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleApplyTextEdit}
                        className="flex-1"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Apply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteVectorText}
                        className="text-rose-600 hover:bg-rose-50 border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete Text
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTextItem(null)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-400">
                    <MousePointerClick className="w-8 h-8 mx-auto mb-2 opacity-40 text-brand-600" />
                    <p className="text-xs font-medium">Click on any text on the page</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto">
                      Select any word or line to edit typography, replace text, or delete it cleanly.
                    </p>
                  </div>
                )}

                {/* List of active page edits */}
                {pageVectorEdits.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Page Changes
                    </span>
                    <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto">
                      {pageVectorEdits.map((edit, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs"
                        >
                          <span className="truncate text-slate-700 dark:text-slate-300">
                            {edit.isDeleted ? '❌ Deleted text' : `✏️ "${edit.newText}"`}
                          </span>
                          <button
                            onClick={() =>
                              setVectorEdits((prev) =>
                                prev.filter(
                                  (e) =>
                                    !(
                                      e.pageNumber === edit.pageNumber &&
                                      e.pdfX === edit.pdfX &&
                                      e.pdfY === edit.pdfY
                                    )
                                )
                              )
                            }
                            className="text-slate-400 hover:text-rose-500 ml-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Overlay Annotations ({pageAnnotations.length})
                  </span>
                </div>

                <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto">
                  {pageAnnotations.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-8 text-center">
                      No annotations on this page yet. Use the tools above to add overlays.
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
            )}
          </div>

          {/* Action Save Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            {editorMode === 'edit-existing' ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveVectorEdits}
                disabled={vectorEdits.length === 0 || isSavingVector}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSavingVector ? 'Writing Vector PDF...' : `Save & Update Document (${vectorEdits.length})`}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveAnnotations}
                disabled={annotations.length === 0}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Burn Overlays to PDF
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
