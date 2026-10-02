import React from 'react';
import {
  Download,
  Share,
  PlusSquare,
  ShieldCheck,
  Zap,
  HardDrive,
  X,
  Smartphone,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface PwaInstallPromptProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => Promise<'accepted' | 'dismissed' | null>;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  isIOS,
  onInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              Install OmniPDF
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Desktop & Mobile Universal Document Workspace
            </p>
          </div>
        </div>

        {/* Status / Instruction Content */}
        {isInstalled ? (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 text-center space-y-2">
            <div className="inline-flex p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
              <Check className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              OmniPDF is already installed!
            </p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
              You are running the standalone application with complete offline capability.
            </p>
          </div>
        ) : isIOS ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              To install OmniPDF on your iPhone or iPad home screen:
            </p>
            <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="h-7 w-7 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <span>1. Tap the <strong>Share</strong> button in Safari's bottom bar</span>
              </li>
              <li className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="h-7 w-7 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <span>2. Scroll down and tap <strong>"Add to Home Screen"</strong></span>
              </li>
              <li className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="h-7 w-7 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <span>3. Tap <strong>"Add"</strong> in the top-right corner to finish</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Install OmniPDF as an app on your computer or phone for faster loading, native window controls, and full offline document editing.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Instant loading with zero server latency</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <HardDrive className="w-4 h-4 text-brand-500 shrink-0" />
                <span>Works 100% offline without internet connection</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% private: your PDFs never leave your device</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {isInstalled ? 'Done' : 'Cancel'}
          </Button>

          {!isInstalled && isInstallable && (
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                await onInstall();
                onClose();
              }}
            >
              <Download className="w-4 h-4 mr-1.5" />
              Install Now
            </Button>
          )}

          {!isInstalled && !isInstallable && !isIOS && (
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Got it
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
