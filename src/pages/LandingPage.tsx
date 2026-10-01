import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  LayoutGrid,
  FilePlus2,
  Split,
  Scissors,
  RotateCw,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';
import { usePdf } from '../context/PdfContext';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const { loadSampleDoc } = usePdf();
  const navigate = useNavigate();

  const handleOpenPdf = () => {
    navigate('/organize');
  };

  const handleTrySample = async () => {
    await loadSampleDoc();
    navigate('/organize');
  };

  const tools = [
    {
      id: 'organize',
      name: 'Organize Pages',
      desc: 'Rearrange pages with visual drag & drop, rotate, and duplicate effortlessly.',
      icon: LayoutGrid,
      path: '/organize',
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
    },
    {
      id: 'viewer',
      name: 'PDF Viewer',
      desc: 'High-resolution rendering with zoom, fit width, page thumbnails, and fullscreen.',
      icon: Eye,
      path: '/viewer',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
    },
    {
      id: 'merge',
      name: 'Merge PDF',
      desc: 'Combine multiple PDF files into a single unified document in any custom order.',
      icon: FilePlus2,
      path: '/merge',
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      id: 'split',
      name: 'Split PDF',
      desc: 'Split documents into individual pages or create tailored parts by page ranges.',
      icon: Split,
      path: '/split',
      color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
    },
    {
      id: 'extract',
      name: 'Extract Pages',
      desc: 'Select specific pages to extract into a fresh, standalone PDF document.',
      icon: Scissors,
      path: '/extract',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
    },
    {
      id: 'rotate',
      name: 'Rotate Pages',
      desc: 'Fix document orientations by rotating individual or all pages (90°, 180°, 270°).',
      icon: RotateCw,
      path: '/organize?action=rotate',
      color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400',
    },
    {
      id: 'delete',
      name: 'Delete Pages',
      desc: 'Remove unwanted, duplicate, or blank pages from your final document.',
      icon: Trash2,
      path: '/organize?action=delete',
      color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
    },
    {
      id: 'duplicate',
      name: 'Duplicate Pages',
      desc: 'Clone pages in-place to replicate forms, certificates, or template pages.',
      icon: Copy,
      path: '/organize',
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Subtle backdrop glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none dark:bg-brand-600/15" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Privacy Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 dark:bg-brand-950/60 dark:border-brand-900/60 dark:text-brand-300 text-xs font-semibold mb-6">
            <Lock className="w-3.5 h-3.5" />
            <span>100% Client-Side • Your files stay on your device</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Your PDFs.{' '}
            <span className="text-brand-600 dark:text-brand-400">One workspace.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Edit, organize, merge, split, rotate, and manage PDF documents directly in your browser. Fast, free, and completely private.
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Button variant="primary" size="lg" onClick={handleOpenPdf} className="shadow-lg shadow-brand-500/25">
              <Upload className="w-4 h-4 mr-2" />
              Open PDF
            </Button>

            <Button variant="outline" size="lg" onClick={handleTrySample} className="group">
              <Sparkles className="w-4 h-4 mr-2 text-amber-500 group-hover:rotate-12 transition-transform" />
              Try with Sample PDF
            </Button>

            <Button variant="secondary" size="lg" onClick={() => navigate('/tools')}>
              Explore Tools
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Security & Specs Sub-bar */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Zero server uploads</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Instant client processing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              <span>No signup or limits</span>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK TOOLS GRID */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Full Utility Suite
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                Everything you need to manage PDFs
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 sm:mt-0">
              Select any tool below to launch the workspace
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => navigate(tool.path)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle hover:shadow-card hover:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/50 cursor-pointer transition-all duration-150"
                >
                  <div>
                    <div className={`inline-flex p-3 rounded-xl ${tool.color} mb-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
                    <span>Launch Tool</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Simple Workflow
          </span>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
            How OmniPDF Works
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
            A frictionless three-step process built directly into your browser.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-subtle">
              <span className="text-4xl font-black text-brand-600/30 dark:text-brand-400/30 mb-2">
                01
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Choose your PDF
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Drag and drop your file or choose one from your device. Your file is read locally via modern HTML5 APIs.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-subtle">
              <span className="text-4xl font-black text-brand-600/30 dark:text-brand-400/30 mb-2">
                02
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Make your changes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Reorder, rotate, split, merge, or delete pages with instant visual feedback and thumbnail previews.
              </p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-subtle">
              <span className="text-4xl font-black text-brand-600/30 dark:text-brand-400/30 mb-2">
                03
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Download the result
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Download the verified new PDF or ZIP archive immediately. Zero waiting for remote servers to render.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY PROMISE */}
      <section className="py-16 bg-brand-900 text-white relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 text-center relative z-10">
          <div className="inline-flex p-3 rounded-2xl bg-brand-800/80 mb-4 text-brand-200">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Your files stay strictly on your device.
          </h2>
          <p className="mt-4 text-brand-100 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Unlike traditional PDF tools that upload your sensitive contracts, financial records, and medical files to remote cloud servers, OmniPDF executes 100% inside your browser’s sandboxed memory using WebAssembly and client-side JavaScript.
          </p>
          <div className="mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={handleOpenPdf}
              className="bg-white text-brand-900 hover:bg-brand-50 border-transparent font-semibold"
            >
              Start Using OmniPDF Now
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              OmniPDF
            </span>
            <span className="text-xs text-slate-400">
              — Browser-based PDF Workspace
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            🔒 100% Client-Side • No server storage • Private & Secure
          </p>
        </div>
      </footer>
    </div>
  );
};
