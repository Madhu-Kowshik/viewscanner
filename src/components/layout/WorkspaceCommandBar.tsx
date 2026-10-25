import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, ChevronDown, ChevronRight, Command, FilePlus2, FileText, LayoutGrid, Menu, Minimize2, PanelLeftClose, PanelLeftOpen, PenTool, ScanText, Search, ShieldCheck, Sparkles, WandSparkles, X } from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { formatBytes } from '../../lib/utils';

const tools = [
  { label: 'Organize pages', path: '/organize', icon: LayoutGrid, category: 'Pages' },
  { label: 'View document', path: '/viewer', icon: FileText, category: 'Pages' },
  { label: 'Merge PDFs', path: '/merge', icon: FilePlus2, category: 'Pages' },
  { label: 'PDF editor', path: '/editor', icon: WandSparkles, category: 'Edit' },
  { label: 'Sign document', path: '/sign', icon: PenTool, category: 'Edit' },
  { label: 'Document scanner', path: '/scanner', icon: Camera, category: 'Capture' },
  { label: 'OCR text', path: '/ocr', icon: ScanText, category: 'Capture' },
  { label: 'Compress PDF', path: '/compress', icon: Minimize2, category: 'Optimize' },
  { label: 'Privacy tools', path: '/protect', icon: ShieldCheck, category: 'Secure' },
];

interface Props { collapsed: boolean; onToggle: () => void; }
export const WorkspaceCommandBar: React.FC<Props> = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentFile, pages } = usePdf();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const active = tools.find(t => t.path === location.pathname);
  const matches = tools.filter(t => (t.label + ' ' + t.category).toLowerCase().includes(query.toLowerCase()));
  useEffect(() => { setOpen(false); setQuery(''); }, [location.pathname]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
      if (!typing && event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); setOpen(true); }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const go = (path: string) => { setOpen(false); navigate(path); };
  return <>
    <div className="hybrid-commandbar relative z-20 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 dark:border-violet-400/10 dark:bg-[#0e1122]/95 sm:px-6">
      <button type="button" onClick={onToggle} aria-label={collapsed ? 'Expand tools sidebar' : 'Collapse tools sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="hidden rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-violet-200 dark:hover:bg-violet-500/15 md:inline-flex">{collapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</button>
      <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"><span>OmniPDF Studio</span><ChevronRight size={13}/><span className="text-violet-600 dark:text-violet-300">{active?.category || 'Workspace'}</span></div><h1 className="mt-0.5 truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">{active?.label || 'Document workspace'}{currentFile ? <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">· {currentFile.name}</span> : null}</h1></div>
      {currentFile && <span className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400 lg:inline-flex">{pages.length} pages · {formatBytes(currentFile.size)}</span>}
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="dialog" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-violet-400 dark:border-white/10 dark:bg-white/[.05] dark:text-violet-100 dark:hover:border-violet-400/60"><Search size={16}/><span className="hidden sm:inline">Switch tool</span><kbd className="hidden rounded bg-slate-200 px-1.5 py-0.5 text-[10px] dark:bg-white/10 lg:inline">/</kbd><ChevronDown size={13}/></button>
      <button type="button" onClick={() => navigate('/tools')} className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-800/20 transition hover:brightness-110 sm:inline-flex"><Sparkles size={15}/> All tools</button>
    </div>
    {open && <div className="hybrid-tool-backdrop fixed inset-0 z-50 flex items-start justify-center bg-black/65 px-4 pt-[min(16vh,140px)] backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div role="dialog" aria-modal="true" aria-label="Switch PDF tool" className="w-full max-w-xl overflow-hidden rounded-2xl border border-violet-400/25 bg-[#111427] text-white shadow-[0_35px_100px_rgba(0,0,0,.65)]">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4"><Search className="text-violet-300" size={20}/><input autoFocus aria-label="Find a PDF tool" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tools, actions, workflows…" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"/><button onClick={() => setOpen(false)} aria-label="Close tool switcher" className="rounded-lg p-1 text-slate-400 hover:bg-white/10"><X size={19}/></button></div>
        <div className="max-h-[55vh] overflow-y-auto p-2">{matches.length ? matches.map(({label,path,icon:Icon,category}) => <button key={path} onClick={() => go(path)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-violet-500/15 focus:bg-violet-500/15 focus:outline-none"><span className="rounded-lg bg-violet-500/15 p-2 text-violet-300"><Icon size={18}/></span><span className="flex-1 text-sm font-semibold">{label}</span><span className="text-xs text-slate-500">{category}</span><ChevronRight size={16} className="text-slate-500"/></button>) : <p className="px-4 py-10 text-center text-sm text-slate-400">No tools found. Try another search.</p>}</div>
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-[11px] text-slate-500"><span>Quick navigation · {matches.length} tools</span><span>Esc to close</span></div>
      </div>
    </div>}
  </>;
};
