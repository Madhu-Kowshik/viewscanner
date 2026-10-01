import React, { useState } from 'react';
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
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const { actualTheme, setTheme } = useTheme();
  const { currentFile, loadSampleDoc } = usePdf();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

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

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Privacy badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/70 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Local Processing</span>
          </div>

          {/* Quick theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            {actualTheme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
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
              Active File ({currentFile.pageCount}p)
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

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/organize')}
            className="hidden sm:inline-flex"
          >
            <Upload className="w-3.5 h-3.5 mr-1" />
            Open PDF
          </Button>

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
  );
};
