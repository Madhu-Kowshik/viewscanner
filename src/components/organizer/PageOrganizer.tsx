import React, { useState } from 'react';
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
    exportOrganizedPdf,
    exportExtractedPages,
  } = usePdf();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
        {/* Selection info & Quick Select All */}
        <div className="flex items-center gap-3">
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
    </div>
  );
};
