import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Upload, FilePlus2, ScanText, PenTool, Minimize2, Printer, ShieldCheck, LayoutGrid, Sparkles, LockKeyhole, Zap, Layers3, MousePointer2, Check, WandSparkles, ScanLine } from 'lucide-react';
import { usePdf } from '../context/PdfContext';
import { formatBytes } from '../lib/utils';

const tasks = [
  { name: 'Merge PDFs', detail: 'Combine documents in seconds', path: '/merge', icon: FilePlus2, tone: 'violet' },
  { name: 'Organize pages', detail: 'Rearrange with precision', path: '/organize', icon: LayoutGrid, tone: 'blue' },
  { name: 'Scan & OCR', detail: 'Make every page searchable', path: '/ocr', icon: ScanText, tone: 'cyan' },
  { name: 'Sign documents', detail: 'Finish with confidence', path: '/sign', icon: PenTool, tone: 'pink' },
  { name: 'Compress PDF', detail: 'Smaller files, same workflow', path: '/compress', icon: Minimize2, tone: 'amber' },
  { name: 'Print utilities', detail: 'Perfect output every time', path: '/utilities', icon: Printer, tone: 'emerald' },
];
export const LandingPage: React.FC = () => {
  const { currentFile, pages, loadSampleDoc } = usePdf();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const trySample = async () => { setLoading(true); try { await loadSampleDoc(); navigate('/organize'); } finally { setLoading(false); } };
  return <main className="premium-landing relative isolate overflow-hidden bg-[#070813] text-slate-100">
    <div className="pointer-events-none absolute inset-0 premium-grid opacity-60" aria-hidden="true" />
    <div className="pointer-events-none absolute -top-56 left-1/2 h-[620px] w-[780px] -translate-x-1/2 rounded-full bg-violet-700/20 blur-[130px]" aria-hidden="true" />
    <section className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-20 sm:px-8 sm:pt-28 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:gap-14 lg:pb-28">
      <div className="premium-rise">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-xs font-semibold tracking-wide text-violet-200"><Sparkles size={14}/> THE NEXT-GEN PDF WORKSPACE <span className="ml-1 h-1.5 w-1.5 rounded-full bg-violet-400" /></div>
        <h1 className="mt-8 max-w-3xl text-[clamp(3.5rem,7vw,6.5rem)] font-bold leading-[.99] tracking-[-.075em] text-white">Every PDF.<br/><span className="premium-gradient-text">One brilliant</span><br/>workspace.</h1>
        <p className="mt-8 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">Edit, organize, scan, sign and transform documents in a beautiful, powerful workspace. Your files stay on your device.</p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link to="/organize" className="premium-primary inline-flex min-h-13 items-center gap-2 rounded-xl px-7 py-4 text-sm font-bold text-white"><Upload size={18}/> Open your PDF <ArrowRight size={17}/></Link>
          <button disabled={loading} onClick={trySample} className="inline-flex min-h-13 items-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-6 py-4 text-sm font-semibold text-white transition hover:border-violet-400/50 hover:bg-white/10 disabled:opacity-50"><MousePointer2 size={17}/>{loading ? 'Preparing sample…' : 'Explore a demo'}</button>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-400"><span className="inline-flex items-center gap-2"><LockKeyhole size={15} className="text-violet-300"/> Browser-local processing</span><span className="inline-flex items-center gap-2"><Zap size={15} className="text-violet-300"/> No account needed</span><span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-violet-300"/> Privacy first</span></div>
      </div>
      <div className="premium-rise relative lg:pl-4" style={{animationDelay:'100ms'}}>
        <div className="pointer-events-none absolute -inset-5 rounded-[2.5rem] bg-violet-600/20 blur-3xl" aria-hidden="true"/>
        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#111426] shadow-[0_35px_100px_rgba(0,0,0,.6)]">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/[.035] px-5 py-4"><span className="h-2.5 w-2.5 rounded-full bg-rose-400/80"/><span className="h-2.5 w-2.5 rounded-full bg-amber-400/80"/><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80"/><span className="ml-4 text-xs font-semibold tracking-wide text-slate-400">OMNIPDF / WORKSPACE</span><span className="ml-auto rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">LOCAL & PRIVATE</span></div>
          <div className="grid min-h-[380px] grid-cols-[72px_1fr] sm:grid-cols-[100px_1fr]">
            <div className="space-y-4 border-r border-white/10 bg-[#0c0e1b] p-3 sm:p-4"><div className="flex h-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300"><Layers3 size={19}/></div>{[1,2,3,4].map(i=><div key={i} className="mx-auto flex h-[64px] w-[45px] flex-col gap-2 rounded-md border border-white/10 bg-[#1b1e31] p-2 shadow-md"><div className="h-1 w-3/4 rounded-full bg-violet-400/50"/><div className="h-1 w-full rounded-full bg-white/20"/><div className="h-1 w-4/5 rounded-full bg-white/15"/><div className="h-1 w-2/3 rounded-full bg-white/15"/></div>)}</div>
            <div className="relative flex flex-col bg-[radial-gradient(circle_at_50%_40%,#22203f,#121423_70%)] p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between"><span className="text-xs font-medium text-slate-300">{currentFile ? currentFile.name : 'Your document.pdf'}</span><span className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-slate-400">{currentFile ? pages.length : 4} pages</span></div>
              <div className="mx-auto w-full max-w-[265px] flex-1 rotate-[-2deg] rounded-sm bg-[#f7f7fc] p-6 text-slate-900 shadow-[0_25px_50px_rgba(0,0,0,.4)] transition-transform duration-500 hover:rotate-0">
                <div className="mb-5 flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600 text-white"><FileText size={15}/></div><span className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-500">Document preview</span></div>
                <div className="h-3 w-4/5 rounded-sm bg-slate-800"/><div className="mt-2 h-2 w-3/5 rounded-sm bg-violet-500/70"/><div className="mt-7 space-y-2">{[90,100,80,94,65].map((w,i)=><div key={i} className="h-1.5 rounded-full bg-slate-200" style={{width:w+'%'}}/>)}</div>
                <div className="mt-7 grid grid-cols-3 gap-2">{[1,2,3].map(i=><div key={i} className="h-12 rounded bg-violet-100"/>)}</div>
                <div className="mt-6 space-y-2">{[95,83,100].map((w,i)=><div key={i} className="h-1.5 rounded-full bg-slate-200" style={{width:w+'%'}}/>)}</div>
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2">{[{icon:ScanLine,label:'Scan'},{icon:PenTool,label:'Sign'},{icon:WandSparkles,label:'Enhance'}].map(({icon:Icon,label})=><span key={label} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[.07] px-3 py-2 text-[11px] font-medium text-slate-200"><Icon size={13} className="text-violet-300"/>{label}</span>)}</div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-xl border border-white/15 bg-[#1c1d32] px-4 py-3 text-xs font-semibold text-slate-200 shadow-xl sm:flex"><Check size={15} className="text-emerald-400"/> Everything in one place</div>
      </div>
    </section>
    <section className="relative border-t border-white/10 bg-[#0b0d1a]/90"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.24em] text-violet-300">YOUR TOOLKIT, REIMAGINED</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">Powerful tools.<br/><span className="text-slate-400">Effortless workflow.</span></h2></div><Link to="/tools" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-white">Explore all tools <ArrowRight size={17}/></Link></div>
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tasks.map(({name,detail,path,icon:Icon,tone})=><Link key={path} to={path} className="premium-tool-card group rounded-2xl border border-white/10 bg-white/[.035] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/[.07]"><div className={'premium-tool-icon premium-tone-'+tone+' flex h-12 w-12 items-center justify-center rounded-xl'}><Icon size={23}/></div><div className="mt-7 flex items-center justify-between gap-3"><h3 className="text-lg font-bold text-white">{name}</h3><ArrowRight size={18} className="text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-violet-300"/></div><p className="mt-2 text-sm text-slate-400">{detail}</p></Link>)}</div>
    <div className="mt-14 flex flex-col items-start justify-between gap-5 rounded-2xl border border-violet-400/20 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/5 p-7 sm:flex-row sm:items-center"><div><p className="text-xl font-bold text-white">Your documents deserve better.</p><p className="mt-2 text-sm text-slate-400">Open a file or continue your current session — no sign-up required.</p></div><Link to="/organize" className="premium-primary inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white">{currentFile ? 'Continue editing' : 'Get started'} <ArrowRight size={16}/></Link></div></div></section>
    <footer className="relative flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-8 text-xs text-slate-500 sm:px-8"><span><strong className="text-white">OmniPDF</strong> · A smarter home for your documents.</span><span>Local processing · OCR may download language models · {currentFile ? formatBytes(currentFile.size)+' open' : 'No account required'}</span></footer>
  </main>;
};
