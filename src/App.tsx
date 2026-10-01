import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
        <BrowserRouter>
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

                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </PdfProvider>
    </ThemeProvider>
  );
};

export default App;
