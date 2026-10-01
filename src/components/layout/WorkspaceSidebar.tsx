import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Eye,
  FilePlus2,
  Split,
  Scissors,
  RotateCw,
  Trash2,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { formatBytes } from '../../lib/utils';

export const WorkspaceSidebar: React.FC = () => {
  const { currentFile, pages } = usePdf();

  const primaryTools = [
    { id: 'organize', label: 'Organize Pages', path: '/organize', icon: LayoutGrid, desc: 'Reorder, rotate & duplicate' },
    { id: 'viewer', label: 'PDF Viewer', path: '/viewer', icon: Eye, desc: 'High-res reader & zoom' },
    { id: 'merge', label: 'Merge PDF', path: '/merge', icon: FilePlus2, desc: 'Combine multiple files' },
    { id: 'split', label: 'Split PDF', path: '/split', icon: Split, desc: 'Divide into parts' },
    { id: 'extract', label: 'Extract Pages', path: '/extract', icon: Scissors, desc: 'Save specific pages' },
  ];

  const quickActions = [
    { id: 'rotate', label: 'Rotate Pages', path: '/organize?action=rotate', icon: RotateCw },
    { id: 'delete', label: 'Delete Pages', path: '/organize?action=delete', icon: Trash2 },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-950 p-4 hidden md:flex flex-col justify-between">
      <div className="space-y-6">
        {/* Document Status Pill if active */}
        {currentFile && (
          <div className="rounded-xl border border-brand-200/60 bg-brand-50/60 p-3 dark:border-brand-900/60 dark:bg-brand-950/40">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-600 p-1.5 text-white dark:bg-brand-500">
                <FileText className="h-4 w-4" />
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={currentFile.name}>
                  {currentFile.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {pages.length} {pages.length === 1 ? 'page' : 'pages'} • {formatBytes(currentFile.size)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Primary Tools List */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
            Core Tools
          </span>
          <nav className="mt-2 space-y-1">
            {primaryTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <NavLink
                  key={tool.id}
                  to={tool.path}
                  className={({ isActive }) =>
                    `flex items-start gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="h-4.5 w-4.5 mt-0.5 shrink-0" />
                  <div className="flex flex-col">
                    <span className="leading-tight">{tool.label}</span>
                    <span className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                      {tool.desc}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Quick Organizers */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
            Quick Actions
          </span>
          <nav className="mt-2 space-y-1">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <NavLink
                  key={action.id}
                  to={action.path}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Local privacy notice at bottom */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>No files leave your computer.</span>
        </div>
      </div>
    </aside>
  );
};
