import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Workflow,
  Sparkles,
  ArrowRight,
  Camera,
  ScanText,
  Edit3,
  Minimize2,
  PenTool,
  ShieldCheck,
  Stamp,
  Activity,
  CheckCircle2,
  Play,
  Zap,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { Button } from '../ui/Button';

interface WorkflowTemplate {
  id: string;
  title: string;
  badge: string;
  description: string;
  steps: { name: string; path: string; icon: any; desc: string }[];
}

export const WorkflowsWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { currentFile } = usePdf();

  const workflowTemplates: WorkflowTemplate[] = [
    {
      id: 'scan-ocr-edit',
      title: 'Scan, Clean, OCR & Edit Paperwork',
      badge: 'Popular',
      description: 'Digitize physical paperwork, bleach paper backgrounds, recognize text, and edit sentences directly inside the scanned image.',
      steps: [
        { name: '1. Camera / Photo Scan', path: '/scanner', icon: Camera, desc: 'Capture paperwork with webcam or photo upload' },
        { name: '2. Magic Clean & Contrast', path: '/scanner', icon: Sparkles, desc: 'Bleach background tints and binarize B&W' },
        { name: '3. Edit Scanned Text', path: '/scanned-editor', icon: Edit3, desc: 'OCR coordinates and edit text in-place' },
        { name: '4. Compress & Export', path: '/compress', icon: Minimize2, desc: 'Optimize raster size for sharing' },
      ],
    },
    {
      id: 'contract-sign-secure',
      title: 'Sign, Redact & Secure Contract',
      badge: 'Legal & Business',
      description: 'Review agreement, fill interactive form fields, sign with handwritten signature, burn redactions, and apply confidential stamp.',
      steps: [
        { name: '1. Fill Form Fields', path: '/forms', icon: CheckCircle2, desc: 'Enter dates, names, and checkboxes' },
        { name: '2. Sign Document', path: '/sign', icon: PenTool, desc: 'Draw, type, or stamp signature' },
        { name: '3. Redact Sensitive Details', path: '/editor', icon: ShieldCheck, desc: 'Permanently blackout private data' },
        { name: '4. Add Watermark / Bates', path: '/watermark', icon: Stamp, desc: 'Stamp CONFIDENTIAL or Bates number' },
      ],
    },
    {
      id: 'audit-optimize-archive',
      title: 'Audit, Clean & Archive Preparation',
      badge: 'Optimization',
      description: 'Run deep diagnostic audit on document structure, purge blank pages, scrub tracking metadata, and recompress content streams.',
      steps: [
        { name: '1. Health Diagnostic', path: '/diagnostics', icon: Activity, desc: 'Analyze compliance and page weights' },
        { name: '2. Remove Blank Pages', path: '/organize', icon: Zap, desc: 'Purge accidental blank sheets' },
        { name: '3. Scrub Metadata', path: '/protect', icon: ShieldCheck, desc: 'Erase author names and computer IDs' },
        { name: '4. Compress Streams', path: '/compress', icon: Minimize2, desc: 'Shrink file size for archival storage' },
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Multi-Operation Workflows
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                Continuous Pipeline
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chained multi-step workflows executed in continuous memory without repetitive re-uploads.
            </p>
          </div>
        </div>

        {currentFile && (
          <span className="text-xs text-slate-500 dark:text-slate-400 self-start sm:self-auto font-mono">
            Active: {currentFile.name}
          </span>
        )}
      </div>

      {/* Workflow Cards */}
      <div className="space-y-6">
        {workflowTemplates.map((wf) => (
          <div
            key={wf.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {wf.title}
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {wf.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {wf.description}
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => navigate(wf.steps[0].path)}
                className="gap-1.5 self-start sm:self-auto text-xs bg-brand-600 hover:bg-brand-700 text-white shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Launch Workflow
              </Button>
            </div>

            {/* Stepper Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {wf.steps.map((st, sIdx) => {
                const Icon = st.icon;
                return (
                  <div
                    key={sIdx}
                    onClick={() => navigate(st.path)}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-brand-500/50 hover:bg-brand-50/20 dark:hover:bg-brand-950/20 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {st.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {st.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
