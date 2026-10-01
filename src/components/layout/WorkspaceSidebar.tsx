import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Eye,
  FilePlus2,
  Split,
  Scissors,
  Edit3,
  PenTool,
  Camera,
  ScanText,
  Minimize2,
  Stamp,
  ArrowLeftRight,
  ShieldCheck,
  Activity,
  GitCompare,
  Layers,
  FileText,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { formatBytes } from '../../lib/utils';

export const WorkspaceSidebar: React.FC = () => {
  const { currentFile, pages } = usePdf();

  const toolSections = [
    {
      title: 'Organize & View',
      tools: [
        { id: 'organize', label: 'Organize Pages', path: '/organize', icon: LayoutGrid },
        { id: 'viewer', label: 'PDF Viewer', path: '/viewer', icon: Eye },
        { id: 'merge', label: 'Merge PDF', path: '/merge', icon: FilePlus2 },
        { id: 'split', label: 'Split PDF', path: '/split', icon: Split },
        { id: 'extract', label: 'Extract Pages', path: '/extract', icon: Scissors },
      ],
    },
    {
      title: 'Edit & Sign',
      tools: [
        { id: 'editor', label: 'Edit & Annotate', path: '/editor', icon: Edit3 },
        { id: 'sign', label: 'Sign Document', path: '/sign', icon: PenTool },
      ],
    },
    {
      title: 'Scan & OCR',
      tools: [
        { id: 'scanner', label: 'Document Scanner', path: '/scanner', icon: Camera },
        { id: 'ocr', label: 'OCR & Extract Text', path: '/ocr', icon: ScanText },
      ],
    },
    {
      title: 'Convert & Optimize',
      tools: [
        { id: 'compress', label: 'Compress PDF', path: '/compress', icon: Minimize2 },
        { id: 'watermark', label: 'Watermark & Numbers', path: '/watermark', icon: Stamp },
        { id: 'convert', label: 'Format Converters', path: '/convert', icon: ArrowLeftRight },
      ],
    },
    {
      title: 'Security & Audit',
      tools: [
        { id: 'protect', label: 'Sanitize & Privacy', path: '/protect', icon: ShieldCheck },
        { id: 'diagnostics', label: 'Document Health', path: '/diagnostics', icon: Activity },
        { id: 'compare', label: 'Compare Documents', path: '/compare', icon: GitCompare },
        { id: 'batch', label: 'Batch Processor', path: '/batch', icon: Layers },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-950 p-3 hidden md:flex flex-col justify-between overflow-y-auto">
      <div className="space-y-4">
        {/* Document Status Pill if active */}
        {currentFile && (
          <div className="rounded-xl border border-brand-200/60 bg-brand-50/60 p-2.5 dark:border-brand-900/60 dark:bg-brand-950/40">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-600 p-1.5 text-white dark:bg-brand-500 shrink-0">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={currentFile.name}>
                  {currentFile.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {pages.length} {pages.length === 1 ? 'page' : 'pages'} • {formatBytes(currentFile.size)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Categorized Tools Navigation */}
        <div className="space-y-4">
          {toolSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2.5">
                {section.title}
              </span>
              <nav className="mt-1 space-y-0.5">
                {section.tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <NavLink
                      key={tool.id}
                      to={tool.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 font-semibold shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{tool.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Local privacy notice at bottom */}
      <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>No files leave your computer.</span>
        </div>
      </div>
    </aside>
  );
};
