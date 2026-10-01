import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { PdfProvider } from './context/PdfContext';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './pages/LandingPage';
import { ToolsPage } from './pages/ToolsPage';
import { RecentFilesPage } from './pages/RecentFilesPage';
import { SettingsPage } from './pages/SettingsPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <PdfProvider>
        <HashRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans selection:bg-brand-500/20 selection:text-brand-600 dark:selection:text-brand-300">
            <Navbar />
            <div className="flex-1 flex flex-col">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/recent" element={<RecentFilesPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Workspace Routes */}
                <Route path="/workspace" element={<Navigate to="/organize" replace />} />
                <Route path="/organize" element={<WorkspacePage initialTool="organize" />} />
                <Route path="/viewer" element={<WorkspacePage initialTool="viewer" />} />
                <Route path="/merge" element={<WorkspacePage initialTool="merge" />} />
                <Route path="/split" element={<WorkspacePage initialTool="split" />} />
                <Route path="/extract" element={<WorkspacePage initialTool="extract" />} />
                <Route path="/editor" element={<WorkspacePage initialTool="editor" />} />
                <Route path="/sign" element={<WorkspacePage initialTool="sign" />} />
                <Route path="/scanner" element={<WorkspacePage initialTool="scanner" />} />
                <Route path="/ocr" element={<WorkspacePage initialTool="ocr" />} />
                <Route path="/compress" element={<WorkspacePage initialTool="compress" />} />
                <Route path="/watermark" element={<WorkspacePage initialTool="watermark" />} />
                <Route path="/convert" element={<WorkspacePage initialTool="convert" />} />
                <Route path="/protect" element={<WorkspacePage initialTool="protect" />} />
                <Route path="/diagnostics" element={<WorkspacePage initialTool="diagnostics" />} />
                <Route path="/compare" element={<WorkspacePage initialTool="compare" />} />
                <Route path="/batch" element={<WorkspacePage initialTool="batch" />} />
                <Route path="/scanned-editor" element={<WorkspacePage initialTool="scanned-editor" />} />
                <Route path="/image-editor" element={<WorkspacePage initialTool="image-editor" />} />
                <Route path="/forms" element={<WorkspacePage initialTool="forms" />} />
                <Route path="/repair" element={<WorkspacePage initialTool="repair" />} />
                <Route path="/workflows" element={<WorkspacePage initialTool="workflows" />} />

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </div>
        </HashRouter>
      </PdfProvider>
    </ThemeProvider>
  );
};

export default App;
