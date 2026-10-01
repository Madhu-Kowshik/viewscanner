import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WorkspaceSidebar } from '../components/layout/WorkspaceSidebar';
import { MobileTabBar } from '../components/layout/MobileTabBar';
import { PageOrganizer } from '../components/organizer/PageOrganizer';
import { PdfViewer } from '../components/viewer/PdfViewer';
import { MergeWorkspace } from '../components/merge/MergeWorkspace';
import { SplitWorkspace } from '../components/split/SplitWorkspace';
import { ExtractWorkspace } from '../components/extract/ExtractWorkspace';
import { ResultModal } from '../components/common/ResultModal';
import { ProcessingOverlay } from '../components/common/ProcessingOverlay';
import { usePdf } from '../context/PdfContext';

export interface WorkspacePageProps {
  initialTool?: 'organize' | 'viewer' | 'merge' | 'split' | 'extract';
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ initialTool = 'organize' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentFile } = usePdf();

  // Determine active tool from current path
  const path = location.pathname;
  let activeTool: 'organize' | 'viewer' | 'merge' | 'split' | 'extract' = initialTool;
  if (path.includes('/viewer')) activeTool = 'viewer';
  else if (path.includes('/merge')) activeTool = 'merge';
  else if (path.includes('/split')) activeTool = 'split';
  else if (path.includes('/extract')) activeTool = 'extract';
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
              {currentFile ? (
                <PdfViewer />
              ) : (
                <PageOrganizer />
              )}
            </div>
          )}
          {activeTool === 'merge' && <MergeWorkspace />}
          {activeTool === 'split' && <SplitWorkspace />}
          {activeTool === 'extract' && <ExtractWorkspace />}
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
