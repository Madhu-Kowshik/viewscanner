import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Minimize2,
  ScanText,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { formatBytes } from '../../lib/utils';
import { PdfHealthReport } from '../../types/pdf';

export const PdfHealthCheck: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentFile,
    loadFile,
    healthReport,
    runHealthCheck,
    removeDetectedBlankPages,
    cleanMetadata,
    processing,
  } = usePdf();

  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (currentFile && !healthReport) {
      handleAnalyze();
    }
  }, [currentFile]);

  const handleAnalyze = async () => {
    setIsRunning(true);
    try {
      await runHealthCheck();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Document Health & Diagnostic Audit
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Audit your PDF for structure, blank pages, metadata risks, bloated raster objects, and searchability issues.
          </p>
        </div>

        <div className="w-full">
          <FileDropzone onFileSelected={loadFile} />
        </div>
      </div>
    );
  }

  // Calculate a 0-100 score
  let score = 100;
  if (healthReport) {
    healthReport.checks.forEach((c) => {
      if (c.status === 'problem') score -= 20;
      if (c.status === 'warning') score -= 10;
    });
  }
  score = Math.max(25, score);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Document Health Audit
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Diagnostic report for <span className="font-semibold text-slate-700 dark:text-slate-300">{currentFile.name}</span> ({formatBytes(currentFile.size)})
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleAnalyze}
          disabled={isRunning || processing.status === 'processing'}
          className="gap-2 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          Re-Analyze Document
        </Button>
      </div>

      {/* Score Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-brand-500/30 bg-slate-950">
            <span className="font-mono text-2xl font-bold tracking-tight text-brand-300">{score}</span>
            <span className="absolute bottom-1 text-[9px] text-slate-400 uppercase font-semibold">/100</span>
          </div>

          <div>
            <h2 className="text-base font-bold">
              {score >= 85 ? 'Healthy & Well Structured' : score >= 60 ? 'Optimization Recommended' : 'Action Recommended'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
              OmniPDF's deep inspection evaluated embedded text streams, metadata leaks, page dimension consistency, and compression ratios.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs shrink-0 w-full sm:w-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block">PDF Specs</span>
            <span className="font-semibold text-slate-100 font-mono">
              v{healthReport?.pdfVersion || '1.7'}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 block">Searchable</span>
            <span className="font-semibold text-slate-100">
              {healthReport?.isLikelyScanned ? 'Scanned Photo' : 'Digital Text'}
            </span>
          </div>
        </div>
      </div>

      {/* Audit Checklist */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Diagnostic Checks & Quick Fixes
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {healthReport?.checks.map((check) => (
            <div key={check.id} className="p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {check.status === 'good' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  {check.status === 'warning' && (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                  {check.status === 'problem' && (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {check.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {check.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons for fixing issues directly */}
              <div className="sm:shrink-0 flex items-center gap-2">
                {check.id === 'blank-pages' && check.status !== 'good' && (
                  <Button
                    size="sm"
                    onClick={removeDetectedBlankPages}
                    className="text-xs bg-brand-600 hover:bg-brand-700 text-white gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Blank Pages
                  </Button>
                )}

                {check.id === 'metadata' && check.status !== 'good' && (
                  <Button
                    size="sm"
                    onClick={cleanMetadata}
                    className="text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Scrub Metadata
                  </Button>
                )}

                {check.id === 'file-size' && check.status !== 'good' && (
                  <Button
                    size="sm"
                    onClick={() => navigate('/compress')}
                    className="text-xs bg-brand-600 hover:bg-brand-700 text-white gap-1.5"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    Compress Now
                  </Button>
                )}

                {check.id === 'text-searchable' && check.status !== 'good' && (
                  <Button
                    size="sm"
                    onClick={() => navigate('/ocr')}
                    className="text-xs bg-brand-600 hover:bg-brand-700 text-white gap-1.5"
                  >
                    <ScanText className="w-3.5 h-3.5" />
                    Run OCR
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
