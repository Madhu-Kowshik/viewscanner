import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Sun,
  Moon,
  Upload,
  Menu,
  X,
  Sparkles,
  LayoutGrid,
  Clock,
  Settings as SettingsIcon,
  ShieldCheck,
  Undo2,
  Redo2,
  Search,
  Download,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';
import { CommandPalette } from '../common/CommandPalette';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { PwaInstallPrompt } from '../common/PwaInstallPrompt';

export const Navbar: React.FC = () => {
  const { actualTheme, setTheme } = useTheme();
  const { currentFile, loadSampleDoc, canUndo, canRedo, undo, redo } = usePdf();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const { isInstallable, isInstalled, isIOS, install } = usePwaInstall();
  const navigate = useNavigate();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };

  const navLinks = [
    { label: 'Workspace', path: '/organize', icon: FileText },
    { label: 'All Tools', path: '/tools', icon: LayoutGrid },
    { label: 'Recent', path: '/recent', icon: Clock },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition-transform group-hover:scale-105 dark:bg-brand-500">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                Omni<span className="text-brand-600 dark:text-brand-400">PDF</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wider">
                BROWSER WORKSPACE
              </span>
            </div>
          </Link>

          {/* Omnibar / Command Search Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs w-48 lg:w-64"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="flex-1 text-left truncate">Search tools...</span>
            <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">
              ⌘K
            </kbd>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-brand-600 bg-brand-50/70 dark:text-brand-400 dark:bg-brand-950/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Actions & Undo/Redo */}
          <div className="flex items-center gap-2">
            {/* Undo / Redo controls if active file */}
            {currentFile && (
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  title="Undo last change"
                  className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  title="Redo change"
                  className="p-1.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* PWA Install Button */}
            {!isInstalled && (
              <button
                onClick={() => {
                  if (isInstallable) {
                    install();
                  } else {
                    setInstallModalOpen(true);
                  }
                }}
                title={isInstallable ? 'Install OmniPDF App' : 'Install OmniPDF (Offline ready)'}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 dark:text-brand-300 dark:bg-brand-950/70 dark:hover:bg-brand-900/60 transition-colors border border-brand-200/80 dark:border-brand-800/80 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Install App</span>
              </button>
            )}

            {/* Quick theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              {actualTheme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Mobile/Tablet search trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              aria-label="Search tools"
              className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Primary Action Button */}
            {currentFile ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/organize')}
                className="hidden sm:inline-flex"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Workspace ({currentFile.pageCount}p)
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={loadSampleDoc}
                className="hidden sm:inline-flex"
                title="Load instant multi-page sample document"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
                Sample PDF
              </Button>
            )}

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-950/60'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              );
            })}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              {!isInstalled && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (isInstallable) {
                      install();
                    } else {
                      setInstallModalOpen(true);
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 dark:text-brand-300 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 border border-brand-200/80 dark:border-brand-800/80 w-full transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Install OmniPDF App
                </button>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/organize');
                }}
                className="w-full justify-center"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Open PDF Document
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setMobileMenuOpen(false);
                  loadSampleDoc();
                  navigate('/organize');
                }}
                className="w-full justify-center"
              >
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
                Load Sample PDF
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* PWA Install Prompt Modal */}
      <PwaInstallPrompt
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={install}
      />
    </>
  );
};
