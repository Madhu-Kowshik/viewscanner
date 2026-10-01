import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  RotateCw,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Check,
  FileText,
} from 'lucide-react';
import { PdfPageItem } from '../../types/pdf';
import { cn } from '../../lib/utils';

export interface PageCardProps {
  page: PdfPageItem;
  isSelected: boolean;
  onToggleSelect: (id: string, e: React.MouseEvent) => void;
  onRotate: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
  index: number;
  totalCount: number;
}

export const PageCard: React.FC<PageCardProps> = ({
  page,
  isSelected,
  onToggleSelect,
  onRotate,
  onDelete,
  onDuplicate,
  onMoveLeft,
  onMoveRight,
  index,
  totalCount,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-white shadow-subtle transition-all duration-150 select-none dark:bg-slate-900',
        isSelected
          ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-md dark:border-brand-400'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 hover:shadow-card'
      )}
    >
      {/* Top Header: Drag Handle, Page Badge, Selection Checkbox */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 rounded-t-xl">
        <div className="flex items-center gap-1.5">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            type="button"
            aria-label="Drag page to reorder"
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Page {page.displayNumber}
          </span>
          {page.rotation !== 0 && (
            <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-1.5 py-0.5 rounded">
              +{page.rotation}°
            </span>
          )}
        </div>

        {/* Selection Checkbox */}
        <button
          type="button"
          onClick={(e) => onToggleSelect(page.id, e)}
          aria-label={`Select page ${page.displayNumber}`}
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded border transition-colors',
            isSelected
              ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
              : 'border-slate-300 bg-white hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800'
          )}
        >
          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
        </button>
      </div>

      {/* Thumbnail Area with Click-to-Select */}
      <div
        onClick={(e) => onToggleSelect(page.id, e)}
        className="relative flex-1 p-3 flex items-center justify-center cursor-pointer min-h-[190px] overflow-hidden bg-slate-100/40 dark:bg-slate-950/40"
      >
        <div
          className="relative max-w-full max-h-[170px] shadow-sm rounded border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800 transition-transform duration-200 overflow-hidden flex items-center justify-center"
          style={{
            transform: `rotate(${page.rotation}deg)`,
          }}
        >
          {page.thumbnailUrl ? (
            <img
              src={page.thumbnailUrl}
              alt={`Page ${page.displayNumber}`}
              className="max-h-[160px] max-w-full object-contain pointer-events-none"
              loading="lazy"
            />
          ) : (
            <div className="w-28 h-36 flex flex-col items-center justify-center text-slate-400 p-2">
              <FileText className="h-8 w-8 mb-1 opacity-50" />
              <span className="text-[10px] text-center">Loading preview...</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer: Rotate, Duplicate, Delete, Mobile Move Controls */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-2 py-1.5 bg-slate-50/50 dark:bg-slate-800/20 rounded-b-xl">
        {/* Mobile accessible Left/Right order buttons */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveLeft(index)}
            aria-label={`Move page ${page.displayNumber} left`}
            title="Move left"
            className="p-1 rounded text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={index === totalCount - 1}
            onClick={() => onMoveRight(index)}
            aria-label={`Move page ${page.displayNumber} right`}
            title="Move right"
            className="p-1 rounded text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quick action buttons: Rotate, Duplicate, Delete */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onRotate(page.id)}
            title="Rotate 90° clockwise"
            aria-label={`Rotate page ${page.displayNumber}`}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(page.id)}
            title="Duplicate page"
            aria-label={`Duplicate page ${page.displayNumber}`}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            disabled={totalCount <= 1}
            onClick={() => onDelete(page.id)}
            title={totalCount <= 1 ? "Cannot delete the only page" : "Delete page"}
            aria-label={`Delete page ${page.displayNumber}`}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none dark:text-slate-400 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
