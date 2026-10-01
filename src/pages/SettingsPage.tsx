import React from 'react';
import {
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', label: 'Light', desc: 'Crisp, clean bright appearance', icon: Sun },
    { id: 'dark', label: 'Dark', desc: 'High-contrast dark mode for low-light environments', icon: Moon },
    { id: 'system', label: 'System', desc: 'Sync automatically with OS preferences', icon: Laptop },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Customize your workspace appearance and view privacy information.
        </p>
      </div>

      {/* APPEARANCE SECTION */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose your preferred theme for the workspace and tools.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((t) => {
            const Icon = t.icon;
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 dark:border-brand-500 ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white dark:bg-brand-500">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  {t.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* PRIVACY ARCHITECTURE SECTION */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Privacy & Architecture
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            How OmniPDF protects your sensitive documents.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                100% In-Browser Client Execution
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                OmniPDF is engineered as a static, client-side web application. All parsing, reordering, rendering, rotation, merging, splitting, and PDF generation occur directly inside your browser’s sandboxed memory using compiled WebAssembly and modern web workers.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Zero server file uploads or background API synchronizations</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Zero third-party analytics trackers, cookies, or telemetry SDKs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All in-memory ObjectURLs are safely revoked upon task completion</span>
            </div>
          </div>
        </div>
      </section>

      {/* APPLICATION INFO */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Application
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Version and software environment.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex items-center justify-between pb-3 text-xs">
            <span className="text-slate-500">Application Name</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">OmniPDF</span>
          </div>
          <div className="flex items-center justify-between py-3 text-xs">
            <span className="text-slate-500">Version</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">1.0.0 (Production)</span>
          </div>
          <div className="flex items-center justify-between py-3 text-xs">
            <span className="text-slate-500">PDF Core Engine</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">pdf-lib + pdfjs-dist (Client-side)</span>
          </div>
          <div className="flex items-center justify-between pt-3 text-xs">
            <span className="text-slate-500">License</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Open & Private Web Tool</span>
          </div>
        </div>
      </section>
    </div>
  );
};
