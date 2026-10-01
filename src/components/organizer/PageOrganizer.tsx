import React, { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  RotateCw,
  Trash2,
  Download,
  Scissors,
  CheckSquare,
  Square,
  Plus,
  FilePlus,
  Eraser,
  Eye,
  RefreshCw,
  FileUp,
  ArrowDownUp,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { PageCard } from './PageCard';
import { Button } from '../ui/Button';
import { FileDropzone } from '../common/FileDropzone';
import { Modal } from '../ui/Modal';

export const PageOrganizer: React.FC = () => {
  const {
    currentFile,
    pages,
    selectedPageIds,
    reorderPages,
    movePage,
    rotatePage,
    rotateSelectedPages,
    rotateAllPages,
    deletePage,
    deleteSelectedPages,
    duplicatePage,
    toggleSelectPage,
    selectAllPages,
    clearPageSelection,
    selectPagesByIds,
    exportOrganizedPdf,
    exportExtractedPages,
    insertBlankPageAt,
    insertFromAnotherPdf,
    replacePageWithPdf,
    reverseAllPages,
    removeDetectedBlankPages,
  } = usePdf();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [rangeInputOpen, setRangeInputOpen] = useState(false);
  const [rangeStr, setRangeStr] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const selectOddPages = () => {
    selectPagesByIds(pages.filter((_, idx) => idx % 2 === 0).map((p) => p.id));
  };

  const selectEvenPages = () => {
    selectPagesByIds(pages.filter((_, idx) => idx % 2 === 1).map((p) => p.id));
  };

  const handleSelectRange = () => {
    if (!rangeStr.trim()) return;
    const parts = rangeStr.split(',').map((s) => s.trim());
    const selectedIndices = new Set<number>();
    parts.forEach((p) => {
      if (p.includes('-')) {
        const [start, end] = p.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= pages.length) selectedIndices.add(i - 1);
          }
        }
      } else {
        const num = Number(p);
        if (!isNaN(num) && num >= 1 && num <= pages.length) {
          selectedIndices.add(num - 1);
        }
      }
    });
    const ids = Array.from(selectedIndices).map((idx) => pages[idx]?.id).filter(Boolean);
    selectPagesByIds(ids);
    setRangeInputOpen(false);
  };

  const selectedPageIndex = pages.findIndex((p) => selectedPageIds.has(p.id));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderPages(active.id.toString(), over.id.toString());
    }
  };

  const handleConfirmDelete = () => {
    deleteSelectedPages();
    setConfirmDeleteOpen(false);
  };

  if (!currentFile || pages.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Organize PDF Pages
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Reorder pages with drag & drop, rotate, duplicate, or remove pages locally.
          </p>
        </div>
        <FileDropzone title="Drop your PDF here to organize" />
      </div>
    );
  }

  const selectedCount = selectedPageIds.size;
  const allSelected = selectedCount === pages.length && pages.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Organizer Header & Control Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-subtle dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        {/* Selection info & Quick Select All, Odd, Even, Range */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={allSelected ? clearPageSelection : selectAllPages}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 p-1 rounded"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            ) : (
              <Square className="h-4 w-4 text-slate-400" />
            )}
            <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <button
            onClick={selectOddPages}
            className="text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            title="Select all odd pages (1, 3, 5...)"
          >
            Odd Pages
          </button>

          <button
            onClick={selectEvenPages}
            className="text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            title="Select all even pages (2, 4, 6...)"
          >
            Even Pages
          </button>

          <button
            onClick={() => setRangeInputOpen(true)}
            className="text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            title="Select custom page range (e.g. 1-4, 7)"
          >
            Range...
          </button>

          <span className="text-slate-300 dark:text-slate-700">|</span>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {selectedCount > 0 ? (
              <strong className="text-brand-600 dark:text-brand-400">
                {selectedCount} of {pages.length} selected
              </strong>
            ) : (
              <span>{pages.length} total pages</span>
            )}
          </span>
        </div>

        {/* Batch actions & Export primary button */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedCount === 1 && (
            <>
              <input
                ref={replaceFileInputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && selectedPageIndex !== -1) {
                    replacePageWithPdf(selectedPageIndex, f);
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => replaceFileInputRef.current?.click()}
                title="Replace this page with a new PDF or image"
              >
                <FileUp className="w-3.5 h-3.5 mr-1" />
                Replace Page {selectedPageIndex + 1}
              </Button>
            </>
          )}

          {selectedCount > 0 ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => rotateSelectedPages(90)}
                title="Rotate selected pages 90°"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1" />
                Rotate Selected
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => exportExtractedPages()}
                title="Extract selected pages into new PDF"
              >
                <Scissors className="w-3.5 h-3.5 mr-1" />
                Extract Selected
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                title="Delete selected pages"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete ({selectedCount})
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => rotateAllPages(90)}
              title="Rotate all pages 90°"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1" />
              Rotate All 90°
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            title="Preview organized document"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Preview
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={exportOrganizedPdf}
            className="shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Save & Export PDF
          </Button>
        </div>
      </div>

      {/* Extended Organizer Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Page Operations:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => insertBlankPageAt(pages.length)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors shadow-2xs"
            title="Insert a blank A4 page at the end of the document"
          >
            <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Insert Blank Page
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer">
            <FilePlus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Insert from Another PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) insertFromAnotherPdf(f, pages.length);
              }}
            />
          </label>

          <button
            onClick={reverseAllPages}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors shadow-2xs"
            title="Reverse sequential order of all pages"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Reverse Page Order
          </button>

          <button
            onClick={removeDetectedBlankPages}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors shadow-2xs"
            title="Detect and remove empty / blank scanned pages"
          >
            <Eraser className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Remove Blank Pages
          </button>
        </div>
      </div>

      {/* Pages Grid with Drag-and-Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={pages.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {pages.map((page, index) => (
              <PageCard
                key={page.id}
                page={page}
                index={index}
                totalCount={pages.length}
                isSelected={selectedPageIds.has(page.id)}
                onToggleSelect={toggleSelectPage}
                onRotate={rotatePage}
                onDelete={deletePage}
                onDuplicate={duplicatePage}
                onMoveLeft={(idx) => movePage(idx, 'left')}
                onMoveRight={(idx) => movePage(idx, 'right')}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Confirmation Dialog for Deleting Pages */}
      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Delete Selected Pages?"
        description={`Are you sure you want to delete ${selectedCount} selected page${
          selectedCount > 1 ? 's' : ''
        }? This will remove them from the generated PDF.`}
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            size="md"
            onClick={() => setConfirmDeleteOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={handleConfirmDelete}
          >
            Delete Pages
          </Button>
        </div>
      </Modal>

      {/* Range Selection Modal */}
      <Modal
        isOpen={rangeInputOpen}
        onClose={() => setRangeInputOpen(false)}
        title="Select Custom Page Range"
        description="Enter comma-separated page numbers or ranges (e.g. 1-3, 5, 8-10)."
      >
        <div className="space-y-4 mt-4">
          <input
            type="text"
            value={rangeStr}
            onChange={(e) => setRangeStr(e.target.value)}
            placeholder="e.g. 1-3, 5"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRangeInputOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSelectRange}>
              Apply Selection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Document Modal */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Preview Reorganized Document Sequence"
        description={`Current document sequence: ${pages.length} pages total.`}
      >
        <div className="max-h-[60vh] overflow-y-auto mt-4 p-2 grid grid-cols-3 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
          {pages.map((p, idx) => (
            <div key={p.id} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
              {p.thumbnailUrl ? (
                <img
                  src={p.thumbnailUrl}
                  alt={`Page ${idx + 1}`}
                  className="w-full h-24 object-contain rounded mb-1"
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-xs font-mono">
                  P.{idx + 1}
                </div>
              )}
              <span className="text-[10px] font-mono text-slate-500">Page {idx + 1}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="primary" size="sm" onClick={() => setPreviewOpen(false)}>
            Close Preview
          </Button>
        </div>
      </Modal>
    </div>
  );
};
