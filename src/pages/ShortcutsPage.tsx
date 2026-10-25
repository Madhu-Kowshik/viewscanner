import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Keyboard, Search, ArrowLeft } from 'lucide-react';

const shortcuts = [
  { category: 'Navigation', name: 'Search tools and commands', keys: 'Ctrl / ⌘ + K', detail: 'Open the OmniPDF command palette from anywhere.' },
  { category: 'Navigation', name: 'Open keyboard shortcut guide', keys: '?', detail: 'Available when you are not typing in an input.' },
  { category: 'Navigation', name: 'Close a dialog or command palette', keys: 'Esc', detail: 'Works where the active dialog supports Escape.' },
  { category: 'Editing', name: 'Undo last document change', keys: 'Toolbar', detail: 'Use the Undo button when a document is open.' },
  { category: 'Editing', name: 'Redo document change', keys: 'Toolbar', detail: 'Use the Redo button when a document is open.' },
];

export const ShortcutsPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => shortcuts.filter(item =>
    [item.name, item.category, item.keys, item.detail].some(text =>
      text.toLowerCase().includes(query.toLowerCase())
    )
  ), [query]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Link to="/tools" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline dark:text-brand-400">
        <ArrowLeft size={16} /> Back to tools
      </Link>
      <div className="mt-8 flex items-center gap-3">
        <div className="rounded-2xl bg-brand-100 p-3 text-brand-700 dark:bg-brand-950 dark:text-brand-300"><Keyboard size={28} /></div>
        <div><h1 className="text-3xl font-bold">Keyboard shortcuts</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quickly find supported shortcuts and document controls.</p></div>
      </div>
      <label className="mt-8 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <Search size={19} className="text-slate-400" />
        <span className="sr-only">Filter keyboard shortcuts</span>
        <input className="w-full bg-transparent outline-none" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search shortcuts…" />
      </label>
      <div className="mt-6 space-y-3">
        {filtered.map(item => (
          <article key={item.name} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">{item.category}</p><h2 className="mt-1 font-semibold">{item.name}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.detail}</p></div>
            <kbd className="self-start whitespace-nowrap rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium dark:border-slate-700 dark:bg-slate-800">{item.keys}</kbd>
          </article>
        ))}
        {filtered.length === 0 && <p className="py-10 text-center text-slate-500">No matching shortcuts found.</p>}
      </div>
      <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">Shortcuts may differ between browsers and operating systems. Only documented app controls are listed.</p>
    </main>
  );
};
