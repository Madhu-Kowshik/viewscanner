import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, Check, FileText, Printer, ShieldCheck } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { ProcessingOverlay } from '../common/ProcessingOverlay';
import { organizePdf, extractAllTextFromPdf } from '../../lib/pdf/pdf-engine';
import { downloadBlob } from '../../lib/utils';
import { runPrintTool, type PrintMode } from '../../lib/pdf/print-tools';

export const UTILITY_TOOLS = [
  { id: 'resize', name: 'Resize pages', desc: 'Fit mixed pages onto A4, A3, or Letter without stretching.' },
  { id: 'nup', name: 'Multiple pages per sheet', desc: 'Create 2-up or 4-up handouts for economical printing.' },
  { id: 'booklet', name: 'Booklet maker', desc: 'Arrange pages for a folded, left-bound booklet. Blank padding is automatic.' },
  { id: 'margins', name: 'Add writing margins', desc: 'Add space around each page for notes and binding.' },
  { id: 'parity', name: 'Odd / even pages', desc: 'Extract alternating pages into a separate PDF.' },
  { id: 'flatten', name: 'Flatten form fields', desc: 'Turn filled interactive fields into fixed page content.' },
  { id: 'metadata', name: 'Edit document metadata', desc: 'Set the title, author, subject, and search keywords.' },
  { id: 'text', name: 'Export text & JSON', desc: 'Export the existing text layer, with page numbers in JSON.' },
] as const;
type Mode = typeof UTILITY_TOOLS[number]['id'];
const fieldClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950';

export function UtilitiesWorkspace() {
  const [params, setParams] = useSearchParams();
  const mode = (UTILITY_TOOLS.some(t => t.id === params.get('mode')) ? params.get('mode') : 'resize') as Mode;
  const { currentFile, pages } = usePdf();
  const [paper, setPaper] = useState<'a4' | 'letter' | 'a3'>('a4');
  const [landscape, setLandscape] = useState(false);
  const [perSheet, setPerSheet] = useState<2 | 4>(2);
  const [margin, setMargin] = useState(18);
  const [parity, setParity] = useState<'odd' | 'even'>('odd');
  const [metadata, setMetadata] = useState({ title: '', author: '', subject: '', keywords: '' });
  const [format, setFormat] = useState<'txt' | 'json'>('txt');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setMessage(''); setError('');
    if (currentFile) PDFDocument.load(currentFile.data).then(doc => {
      if (active) setMetadata({ title: doc.getTitle() ?? '', author: doc.getAuthor() ?? '', subject: doc.getSubject() ?? '', keywords: doc.getKeywords() ?? '' });
    }).catch(() => { if (active) setError('Could not read document metadata. Try reopening the PDF.'); });
    return () => { active = false; };
  }, [currentFile]);
  const tool = UTILITY_TOOLS.find(t => t.id === mode)!;
  const run = async () => {
    if (!currentFile || busy) return;
    setBusy(true); setMessage(''); setError('');
    try {
      // Apply pending organizer order and rotations to the exported copy.
      // Keep the original for metadata/form operations, which need document-level fields.
      let source: ArrayBuffer | Uint8Array = currentFile.data;
      if (['resize', 'nup', 'booklet', 'margins'].includes(mode)) {
        const printSource = await PDFDocument.load(source);
        printSource.getForm().flatten();
        source = await printSource.save();
      }
      const data = mode === 'metadata' || mode === 'flatten' ? source : await organizePdf(source, pages);
      let blob: Blob;
      let extension = 'pdf';
      if (mode === 'text') {
        const text = await extractAllTextFromPdf(data);
        if (!text.pageTexts.some(p => p.text.trim())) throw new Error('No text layer found. Run OCR on this scanned document first.');
        extension = format;
        blob = new Blob([format === 'json' ? JSON.stringify(text.pageTexts, null, 2) : text.fullText], { type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8' });
      } else {
        const result = await runPrintTool(data, { mode: mode as PrintMode, paper, landscape, perSheet, margin, parity, ...metadata });
        blob = new Blob([new Uint8Array(result)], { type: 'application/pdf' });
      }
      await downloadBlob(blob, `${currentFile.name.replace(/\.pdf$/i, '')}-${mode}.${extension}`);
      setMessage('Export prepared. Your original document is unchanged.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Export failed. Please try another PDF.'); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
    <Link to="/tools" className="text-sm text-brand-600 dark:text-brand-400">← All tools</Link>
    <div className="mt-6 mb-8 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-brand-600 dark:text-brand-400">Document finishing</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Ready for the next step.</h1><p className="mt-3 text-slate-500">Print, prepare, and export a separate copy of your document.</p></div><Printer className="hidden h-10 w-10 text-slate-400 sm:block" /></div>
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <nav aria-label="Document finishing tools" className="grid grid-cols-2 gap-2 lg:flex lg:flex-col">{UTILITY_TOOLS.map(t => <button key={t.id} disabled={busy} aria-pressed={mode === t.id} onClick={() => { setParams({ mode: t.id }); setMessage(''); setError(''); }} className={`rounded-lg border p-3 text-left text-sm transition-colors ${mode === t.id ? 'border-brand-600 bg-brand-50 font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-900'}`}>{t.name}</button>)}</nav>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900" aria-busy={busy}>
        <h2 className="text-2xl font-semibold">{tool.name}</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{tool.desc}</p>
        {!currentFile ? <div className="mt-6"><FileDropzone /></div> : <>
          <div className="my-6 flex items-center gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-950"><FileText className="h-5 w-5 shrink-0 text-brand-600"/><div className="min-w-0"><p className="truncate text-sm font-semibold">{currentFile.name}</p><p className="text-xs text-slate-500">{pages.length} pages • export a new copy</p></div></div>
          <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2">
            {['resize', 'nup', 'booklet'].includes(mode) && <label className="text-sm font-medium">Paper size<select className={fieldClass} value={paper} onChange={e => setPaper(e.target.value as typeof paper)}><option value="a4">A4</option><option value="letter">US Letter</option><option value="a3">A3</option></select></label>}
            {['resize', 'nup'].includes(mode) && <label className="text-sm font-medium">Orientation<select className={fieldClass} value={String(landscape)} onChange={e => setLandscape(e.target.value === 'true')}><option value="false">Portrait</option><option value="true">Landscape</option></select></label>}
            {mode === 'nup' && <label className="text-sm font-medium">Pages per sheet<select className={fieldClass} value={perSheet} onChange={e => setPerSheet(Number(e.target.value) as 2 | 4)}><option value={2}>2 pages</option><option value={4}>4 pages</option></select></label>}
            {['resize', 'nup', 'booklet', 'margins'].includes(mode) && <label className="text-sm font-medium">Margin in points (72 pt = 1 inch)<input type="number" min="0" max="144" className={fieldClass} value={Number.isNaN(margin) ? '' : margin} onChange={e => setMargin(e.target.value === '' ? NaN : Number(e.target.value))}/></label>}
            {mode === 'parity' && <label className="text-sm font-medium">Keep pages<select className={fieldClass} value={parity} onChange={e => setParity(e.target.value as typeof parity)}><option value="odd">Odd: 1, 3, 5…</option><option value="even">Even: 2, 4, 6…</option></select></label>}
            {mode === 'metadata' && (Object.keys(metadata) as (keyof typeof metadata)[]).map(key => <label key={key} className="text-sm font-medium capitalize">{key}<input className={fieldClass} value={metadata[key]} maxLength={2000} onChange={e => setMetadata({ ...metadata, [key]: e.target.value })}/></label>)}
            {mode === 'text' && <label className="text-sm font-medium">Export format<select className={fieldClass} value={format} onChange={e => setFormat(e.target.value as typeof format)}><option value="txt">Plain text (.txt)</option><option value="json">Text by page (.json)</option></select></label>}
          </fieldset>
          <div className="mt-6 space-y-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {mode === 'booklet' && <p>Print the exported PDF double-sided at actual size, flip on the short edge, then fold. Use a test sheet first; printer settings vary.</p>}
            {['resize', 'nup', 'booklet', 'margins'].includes(mode) && <p>Creates print artwork and flattens supported form fields. Links, bookmarks, and interactive annotations are not retained in the print copy.</p>}
            {['metadata', 'flatten'].includes(mode) && <p>Uses the saved document. Export and reopen organizer changes first if you have pending page reordering or rotations.</p>}
            {mode === 'flatten' && <p>Flattens supported AcroForm fields, not arbitrary annotations or XFA forms.</p>}
            {mode === 'text' && <p>Text order follows the PDF text layer. Scanned pages need <Link to="/ocr" className="underline text-brand-600">OCR</Link> first.</p>}
          </div>
          <button disabled={busy} onClick={run} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"><ArrowDownToLine className="h-4 w-4"/>{busy ? 'Preparing export…' : 'Export copy'}</button>
          {error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
          {message && <p role="status" className="mt-4 flex gap-2 text-sm text-emerald-700 dark:text-emerald-400"><Check className="h-4 w-4"/>{message}</p>}
        </>}
        <p className="mt-8 flex items-center gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 dark:border-slate-800"><ShieldCheck className="h-4 w-4"/>Document processing stays in your browser.</p>
      </section>
    </div><ProcessingOverlay />
  </main>;
}
