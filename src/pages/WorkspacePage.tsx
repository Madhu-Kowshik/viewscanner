import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WorkspaceSidebar } from '../components/layout/WorkspaceSidebar';
import { WorkspaceCommandBar } from '../components/layout/WorkspaceCommandBar';
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
import { UnifiedDocumentWorkspace, WorkspaceStudioMode } from '../components/studio/UnifiedDocumentWorkspace';
import { ResultModal } from '../components/common/ResultModal';
import { ProcessingOverlay } from '../components/common/ProcessingOverlay';
import { FileDropzone } from '../components/common/FileDropzone';
import { Button } from '../components/ui/Button';
import {
  Sparkles,
  ScanText,
  Type,
  X,
  FileSearch,
  Camera,
  Layers,
  FilePlus2,
  ArrowRight,
  Edit3,
  PenTool,
  FormInput,
  ShieldCheck,
  Minimize2,
} from 'lucide-react';
import { formatBytes } from '../lib/utils';
import { usePdf } from '../context/PdfContext';

export interface WorkspacePageProps {
  initialTool?: string;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ initialTool = 'organize' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentFile, healthReport, savedSession, resumeSavedSession, dismissSavedSession, documentType, loadSampleDoc } = usePdf();
  const [dismissedTipFileId, setDismissedTipFileId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const isStudioTool = [
    'organize',
    'viewer',
    'editor',
    'scanned-editor',
    'forms',
    'sign',
    'watermark',
    'compress',
  ].includes(activeTool);

  const modeMap: Record<string, WorkspaceStudioMode> = {
    organize: 'organize',
    viewer: 'view',
    editor: 'edit-text',
    'scanned-editor': 'scanned-ocr',
    forms: 'forms',
    sign: 'sign',
    watermark: 'watermark',
    compress: 'compress',
  };

  // If a document is loaded and the user is accessing any document manipulation tool,
  // render the enterprise 3-pane Unified Studio Workspace!
  if (currentFile && isStudioTool) {
    return (
      <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        <UnifiedDocumentWorkspace
          initialMode={
            activeTool === 'editor' && (documentType === 'scanned' || documentType === 'hybrid')
              ? 'scanned-ocr'
              : modeMap[activeTool] || 'view'
          }
          onNavigateHome={() => navigate('/')}
        />
        <ResultModal onOpenViewer={() => navigate('/viewer')} />
        <ProcessingOverlay />
      </div>
    );
  }

  return (
    <div className="premium-inner premium-workspace hybrid-studio-shell flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-slate-50 dark:bg-[#080a17]">
      <WorkspaceCommandBar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
      {/* Desktop Sidebar */}
      {!sidebarCollapsed && <WorkspaceSidebar />}

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

          {activeTool === 'organize' && (
            !currentFile ? (
              <div className="max-w-5xl mx-auto py-2 space-y-8 animate-in fade-in duration-200">
                {/* Studio Hero Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-violet-500/15">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                        Desktop Document Studio
                      </span>
                      <span className="text-xs text-slate-400">• WebAssembly Acceleration</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      OmniPDF Ultimate Studio
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                      Professional Adobe Acrobat-grade document processing engineered directly in your browser. Complete vector text editing, neural OCR, camera scanning, and cryptographic sanitization — 100% private and client-side.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadSampleDoc}
                      className="gap-1.5 text-xs border-violet-500/30 text-violet-600 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Try Sample PDF</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/scanner')}
                      className="gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Launch Scanner</span>
                    </Button>
                  </div>
                </div>

                {/* Primary Dropzone */}
                <div className="studio-glass p-2 rounded-3xl border border-violet-500/20 shadow-xl bg-white/50 dark:bg-[#0c0f22]/70 backdrop-blur-xl">
                  <FileDropzone
                    title="Drop your PDF or document here to open Studio"
                    subtitle="Instant local processing • Supports PDF, Images, Text documents"
                  />
                </div>

                {/* Quick Workflow Stations (3 Primary Pillars) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/scanner')}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-violet-500/15 bg-white dark:bg-[#0b0e20] hover:border-violet-400 dark:hover:border-violet-400/50 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-between">
                      <span>CamScanner Studio</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Capture document pages via camera with corner-pin perspective cropping and bleach paper filters.
                    </p>
                  </button>

                  <button
                    onClick={() => navigate('/batch')}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-violet-500/15 bg-white dark:bg-[#0b0e20] hover:border-violet-400 dark:hover:border-violet-400/50 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-between">
                      <span>Multi-File Batch Queue</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Bulk compress, watermark, sanitize, or convert dozens of documents simultaneously.
                    </p>
                  </button>

                  <button
                    onClick={() => navigate('/merge')}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-violet-500/15 bg-white dark:bg-[#0b0e20] hover:border-violet-400 dark:hover:border-violet-400/50 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FilePlus2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center justify-between">
                      <span>Merge & Assemble</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Combine PDF files, scans, and attachments into a single structured master document.
                    </p>
                  </button>
                </div>

                {/* Studio Capabilities Matrix */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#0b0e20] border border-slate-200 dark:border-violet-500/15">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                    Comprehensive Document Toolkit
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { label: 'Vector Editor', desc: 'In-stream text editing', icon: Edit3, path: '/editor' },
                      { label: 'Neural OCR', desc: 'Scanned text recognition', icon: ScanText, path: '/ocr' },
                      { label: 'Sign Document', desc: 'Digital signatures', icon: PenTool, path: '/sign' },
                      { label: 'Form Studio', desc: 'Interactive AcroForms', icon: FormInput, path: '/forms' },
                      { label: 'Sanitize PDF', desc: 'Redaction & link purge', icon: ShieldCheck, path: '/protect' },
                      { label: 'Compression', desc: 'Smart byte reduction', icon: Minimize2, path: '/compress' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          onClick={() => navigate(item.path)}
                          className="p-3 rounded-xl border border-slate-100 dark:border-violet-500/10 hover:border-violet-500/30 dark:hover:bg-white/[0.04] transition-all text-left flex flex-col justify-between"
                        >
                          <Icon className="w-4 h-4 text-violet-400 mb-2" />
                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.label}</div>
                            <div className="text-[10px] text-slate-400">{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Security & Privacy Guarantee Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-300 gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="font-semibold">Privacy First Guarantee:</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      All document processing, OCR, encryption, and rendering happens 100% locally on your device.
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                    Zero Cloud Uploads
                  </span>
                </div>
              </div>
            ) : (
              <PageOrganizer />
            )
          )}
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

      </div>
      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />

      {/* Global Result Dialog & Processing Overlay */}
      <ResultModal onOpenViewer={() => navigate('/viewer')} />
      <ProcessingOverlay />
    </div>
  );
};
