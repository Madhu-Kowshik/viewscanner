import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Upload, FilePlus2, ScanText, PenTool, Minimize2, Printer, ShieldCheck, LayoutGrid } from 'lucide-react';
import { usePdf } from '../context/PdfContext';
import { formatBytes } from '../lib/utils';

const tasks = [
  { name: 'Merge PDFs', detail: 'Bring separate files together.', path: '/merge', icon: FilePlus2 },
  { name: 'Organize pages', detail: 'Put every page in its place.', path: '/organize', icon: LayoutGrid },
  { name: 'Scan & recognize', detail: 'Turn paper into usable text.', path: '/ocr', icon: ScanText },
  { name: 'Sign a document', detail: 'Add your visual signature.', path: '/sign', icon: PenTool },
  { name: 'Compress a PDF', detail: 'Make a smaller copy to share.', path: '/compress', icon: Minimize2 },
  { name: 'Prepare for print', detail: 'Booklets, handouts, and margins.', path: '/utilities', icon: Printer },
];
export const LandingPage: React.FC = () => {
  const { currentFile, pages, loadSampleDoc } = usePdf();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const trySample = async () => { setLoading(true); try { await loadSampleDoc(); navigate('/organize'); } finally { setLoading(false); } };
  return <main className="surface-enter">
    <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-20">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-brand-600 dark:text-brand-400"><span className="h-2 w-2 rounded-full bg-brand-600"/>Your everyday document desk</p>
        <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-[1.06] tracking-[-.045em] text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">Less paperwork.<br/><span className="text-brand-600 dark:text-brand-400">More done.</span></h1>
        <p className="mt-7 max-w-lg text-lg leading-8 text-slate-600 dark:text-slate-400">From a rough scan to a ready-to-share PDF. Edit, organize, sign, and finish your documents in one private workspace.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link to="/organize" className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"><Upload className="h-4 w-4"/>Open a document</Link><button disabled={loading} onClick={trySample} className="min-h-12 rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-900">{loading ? 'Preparing sample…' : 'Try a sample'}</button></div>
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-500"><ShieldCheck className="h-4 w-4"/>No account. No document uploads.</p>
      </div>
      <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">The document desk</span><span className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Browser-local</span></div>
        <div className="p-6 sm:p-8">
          <div className="mb-7 flex items-center gap-3"><div className="rounded-lg bg-brand-50 p-3 text-brand-600 dark:bg-brand-950"><FileText className="h-6 w-6"/></div><div className="min-w-0"><p className="truncate font-semibold">{currentFile ? currentFile.name : 'Your next document'}</p><p className="mt-1 text-xs text-slate-500">{currentFile ? `${pages.length} pages · ${formatBytes(currentFile.size)}` : 'A clear path from open to finished'}</p></div></div>
          <ol className="space-y-0">{[['01', 'Bring it in', 'Open a PDF, import photos, or scan a page.'], ['02', 'Make it yours', 'Arrange, annotate, sign, or extract text.'], ['03', 'Send it on', 'Export a fresh copy, ready to print or share.']].map(([n, title, detail]) => <li key={n} className="flex gap-4 border-t border-slate-100 py-5 dark:border-slate-800"><span className="pt-1 font-mono text-xs text-slate-400">{n}</span><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{detail}</p></div></li>)}</ol>
          <Link to={currentFile ? '/organize' : '/tools'} className="mt-3 flex items-center justify-between rounded-lg bg-slate-900 p-4 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">{currentFile ? 'Continue your document' : 'Find the right tool'}<ArrowRight className="h-4 w-4"/></Link>
        </div>
      </div>
    </section>
    <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40"><div className="mx-auto max-w-7xl px-5 py-12 sm:px-8"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500">Start with a task</p><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">What needs doing?</h2></div><Link to="/tools" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">Explore all tools<ArrowRight className="h-4 w-4"/></Link></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3">{tasks.map(({ name, detail, path, icon: Icon }) => <Link key={path} to={path} className="group flex items-center gap-4 border-t border-slate-200 py-6 pr-4 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"><Icon className="h-6 w-6 shrink-0 text-brand-600 dark:text-brand-400"/><div className="flex-1"><h3 className="font-semibold">{name}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p></div><ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1"/></Link>)}</div></div></section>
    <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-5 py-10 text-sm text-slate-500 sm:px-8"><p><strong className="text-slate-900 dark:text-white">OmniPDF</strong> · A workspace for your paperwork.</p><p>Files are processed on your device. OCR may download language models.</p></footer>
  </main>;
};
