import React from 'react';
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
import { ResultModal } from '../components/common/ResultModal';
import { ProcessingOverlay } from '../components/common/ProcessingOverlay';
import { usePdf } from '../context/PdfContext';

export interface WorkspacePageProps {
  initialTool?: string;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ initialTool = 'organize' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentFile } = usePdf();

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
  else if (path.includes('/organize')) activeTool = 'organize';

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <WorkspaceSidebar />

      {/* Main Content Workspace */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="mx-auto max-w-7xl h-full flex flex-col">
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
