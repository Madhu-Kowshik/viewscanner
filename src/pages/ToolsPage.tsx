import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  FilePlus2,
  Split,
  Scissors,
  RotateCw,
  Trash2,
  Copy,
  Eye,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ToolsPage: React.FC = () => {
  const navigate = useNavigate();

  const organizeTools = [
    {
      id: 'organize',
      name: 'Organize Pages',
      desc: 'Rearrange pages with drag & drop, rotate, and duplicate pages visually.',
      icon: LayoutGrid,
      path: '/organize',
      btnText: 'Organize Pages',
      badge: 'Popular',
    },
    {
      id: 'merge',
      name: 'Merge PDF',
      desc: 'Combine multiple PDF files into one clean document in the exact order you want.',
      icon: FilePlus2,
      path: '/merge',
      btnText: 'Merge PDFs',
      badge: 'Essential',
    },
    {
      id: 'split',
      name: 'Split PDF',
      desc: 'Split a PDF into single individual pages or custom defined page ranges.',
      icon: Split,
      path: '/split',
      btnText: 'Split PDF',
    },
    {
      id: 'extract',
      name: 'Extract Pages',
      desc: 'Select specific pages to extract and download as a new standalone PDF.',
      icon: Scissors,
      path: '/extract',
      btnText: 'Extract Pages',
    },
    {
      id: 'rotate',
      name: 'Rotate Pages',
      desc: 'Rotate document pages clockwise or counter-clockwise by 90°, 180°, or 270°.',
      icon: RotateCw,
      path: '/organize?action=rotate',
      btnText: 'Rotate Pages',
    },
    {
      id: 'delete',
      name: 'Delete Pages',
      desc: 'Select and permanently remove unnecessary or blank pages from your PDF file.',
      icon: Trash2,
      path: '/organize?action=delete',
      btnText: 'Delete Pages',
    },
    {
      id: 'duplicate',
      name: 'Duplicate Pages',
      desc: 'Clone pages in place to create multiple copies of specific sheets.',
      icon: Copy,
      path: '/organize',
      btnText: 'Duplicate Pages',
    },
  ];

  const viewTools = [
    {
      id: 'viewer',
      name: 'PDF Viewer',
      desc: 'Fast, high-fidelity canvas reader with zoom controls, page thumbnails, and fullscreen.',
      icon: Eye,
      path: '/viewer',
      btnText: 'Open Viewer',
      badge: 'Interactive',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            All PDF Tools
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Professional browser-based tools for every PDF requirement. 100% private.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="h-4 w-4" />
          <span>Local Client-Side Processing</span>
        </div>
      </div>

      {/* ORGANIZE CATEGORY */}
      <section className="mt-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Organize & Edit
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {organizeTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    {tool.badge && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {tool.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(tool.path)}
                    className="w-full justify-center"
                  >
                    <span>{tool.btnText}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* VIEW CATEGORY */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            View & Read
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {viewTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    {tool.badge && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {tool.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(tool.path)}
                    className="w-full justify-center"
                  >
                    <span>{tool.btnText}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
