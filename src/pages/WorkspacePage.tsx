import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WorkspaceSidebar } from '../components/layout/WorkspaceSidebar';
import { MobileTabBar } from '../components/layout/MobileTabBar';
import { PageOrganizer } from '../components/organizer/PageOrganizer';
import { PdfViewer } from '../components/viewer/PdfViewer';
import { MergeWorkspace } from '../components/merge/MergeWorkspace';
import { SplitWorkspace } from '../components/split/SplitWorkspace';
import { ExtractWorkspace } from '../components/extract/ExtractWorkspace';
import { PdfEditor } from '../components/editor/PdfEditor';
import { SignWorkspace } from '../components/sign/SignWorkspace';
import { DocumentScanner } from '../components/scanner/DocumentScanner';
import { CompressWorkspace } from '../components/compress/CompressWorkspace';
import { WatermarkWorkspace } from '../components/watermark/WatermarkWorkspace';
import { OcrWorkspace } from '../components/ocr/OcrWorkspace';
import { ConvertWorkspace } from '../components/convert/ConvertWorkspace';
import { ProtectWorkspace } from '../components/protect/ProtectWorkspace';
import { PdfHealthCheck } from '../components/diagnostics/PdfHealthCheck';
import { PdfCompare } from '../components/compare/PdfCompare';
import { BatchWorkspace } from '../components/batch/BatchWorkspace';
import { ScannedTextEditor } from '../components/scanned-editor/ScannedTextEditor';
import { FormWorkspace } from '../components/forms/FormWorkspace';
import { PdfRepairWorkspace } from '../components/repair/PdfRepairWorkspace';
import { WorkflowsWorkspace } from '../components/workflows/WorkflowsWorkspace';
import { ImageEditorWorkspace } from '../components/image-editor/ImageEditorWorkspace';
import { ResultModal } from '../components/common/ResultModal';
import { ProcessingOverlay } from '../components/common/ProcessingOverlay';
import { Button } from '../components/ui/Button';
import { Sparkles, ScanText, Type, X, FileSearch } from 'lucide-react';
import { formatBytes } from '../lib/utils';
import { usePdf } from '../context/PdfContext';

export interface WorkspacePageProps {
  initialTool?: string;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ initialTool = 'organize' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentFile, healthReport, savedSession, resumeSavedSession, dismissSavedSession } = usePdf();
  const [dismissedTipFileId, setDismissedTipFileId] = useState<string | null>(null);

  // Determine active tool from current path
  const path = location.pathname;
  let activeTool = initialTool;

  if (path.includes('/viewer')) activeTool = 'viewer';
  else if (path.includes('/merge')) activeTool = 'merge';
  else if (path.includes('/split')) activeTool = 'split';
  else if (path.includes('/extract')) activeTool = 'extract';
  else if (path.includes('/editor')) activeTool = 'editor';
  else if (path.includes('/sign')) activeTool = 'sign';
  else if (path.includes('/scanner')) activeTool = 'scanner';
  else if (path.includes('/ocr')) activeTool = 'ocr';
  else if (path.includes('/compress')) activeTool = 'compress';
  else if (path.includes('/watermark')) activeTool = 'watermark';
  else if (path.includes('/convert')) activeTool = 'convert';
  else if (path.includes('/protect')) activeTool = 'protect';
  else if (path.includes('/diagnostics')) activeTool = 'diagnostics';
  else if (path.includes('/compare')) activeTool = 'compare';
  else if (path.includes('/batch')) activeTool = 'batch';
  else if (path.includes('/scanned-editor')) activeTool = 'scanned-editor';
  else if (path.includes('/image-editor')) activeTool = 'image-editor';
  else if (path.includes('/forms')) activeTool = 'forms';
  else if (path.includes('/repair')) activeTool = 'repair';
  else if (path.includes('/workflows')) activeTool = 'workflows';
  else if (path.includes('/organize')) activeTool = 'organize';

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <WorkspaceSidebar />

      {/* Main Content Workspace */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="mx-auto max-w-7xl h-full flex flex-col">
          {/* Subtle Session Recovery Banner if previously saved in IndexedDB */}
          {savedSession && !currentFile && (
            <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50/80 p-4 dark:border-brand-900/60 dark:bg-brand-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-600 text-white dark:bg-brand-500 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Restore previous session:{' '}
                    <span className="text-brand-600 dark:text-brand-400 font-bold">
                      {savedSession.name}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {savedSession.pageCount} {savedSession.pageCount === 1 ? 'page' : 'pages'} •{' '}
                    {formatBytes(savedSession.size)} • Auto-saved from your previous session
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <Button variant="primary" size="sm" onClick={resumeSavedSession}>
                  Resume Work
                </Button>
                <Button variant="ghost" size="sm" onClick={dismissSavedSession}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Smart Document Intelligence Banner */}
          {currentFile && healthReport && dismissedTipFileId !== currentFile.id && (
            <>
              {healthReport.isLikelyScanned && activeTool !== 'scanned-editor' && activeTool !== 'ocr' && (
                <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 dark:border-amber-900/60 dark:bg-amber-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0">
                      <ScanText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>📸 Scanned Document Detected</span>
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        This PDF contains page scans with little native digital text. Use Scanned Text Editor to modify text in-place or Neural OCR to extract searchable text.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Button variant="primary" size="sm" onClick={() => navigate('/scanned-editor')}>
                      Edit Scanned Text
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/ocr')}>
                      Run OCR
                    </Button>
                    <button
                      onClick={() => setDismissedTipFileId(currentFile.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Dismiss suggestion"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {!healthReport.isLikelyScanned && (healthReport.estimatedTextChars ?? 0) > 40 && activeTool === 'viewer' && (
                <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50/90 p-4 dark:border-sky-900/60 dark:bg-sky-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-600 text-white shrink-0">
                      <Type className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        📄 Selectable Vector Text PDF Detected
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        This document contains native vector text. You can edit text directly in-place with zero rasterization blur.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Button variant="primary" size="sm" onClick={() => navigate('/editor')}>
                      Open Vector Text Editor
                    </Button>
                    <button
                      onClick={() => setDismissedTipFileId(currentFile.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Dismiss suggestion"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTool === 'organize' && <PageOrganizer />}
          {activeTool === 'viewer' && (
            <div className="h-full min-h-[600px] flex flex-col">
              {currentFile ? <PdfViewer /> : <PageOrganizer />}
            </div>
          )}
          {activeTool === 'merge' && <MergeWorkspace />}
          {activeTool === 'split' && <SplitWorkspace />}
          {activeTool === 'extract' && <ExtractWorkspace />}
          {activeTool === 'editor' && <PdfEditor />}
          {activeTool === 'sign' && <SignWorkspace />}
          {activeTool === 'scanner' && <DocumentScanner />}
          {activeTool === 'ocr' && <OcrWorkspace />}
          {activeTool === 'compress' && <CompressWorkspace />}
          {activeTool === 'watermark' && <WatermarkWorkspace />}
          {activeTool === 'convert' && <ConvertWorkspace />}
          {activeTool === 'protect' && <ProtectWorkspace />}
          {activeTool === 'diagnostics' && <PdfHealthCheck />}
          {activeTool === 'compare' && <PdfCompare />}
          {activeTool === 'batch' && <BatchWorkspace />}
          {activeTool === 'scanned-editor' && <ScannedTextEditor />}
          {activeTool === 'image-editor' && <ImageEditorWorkspace />}
          {activeTool === 'forms' && <FormWorkspace />}
          {activeTool === 'repair' && <PdfRepairWorkspace />}
          {activeTool === 'workflows' && <WorkflowsWorkspace />}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />

      {/* Global Result Dialog & Processing Overlay */}
      <ResultModal onOpenViewer={() => navigate('/viewer')} />
      <ProcessingOverlay />
    </div>
  );
};
