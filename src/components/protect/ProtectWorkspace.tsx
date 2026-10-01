import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  EyeOff,
  Lock,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Info,
  ExternalLink,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { Button } from '../ui/Button';
import { PDFDocument } from 'pdf-lib';

export const ProtectWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { currentFile, loadFile, cleanMetadata, processing } = usePdf();

  const [metadata, setMetadata] = useState<{
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  }>({});

  useEffect(() => {
    if (!currentFile) return;

    const readMeta = async () => {
      try {
        const doc = await PDFDocument.load(currentFile.data, { ignoreEncryption: true });
        setMetadata({
          title: doc.getTitle() || undefined,
          author: doc.getAuthor() || undefined,
          subject: doc.getSubject() || undefined,
          creator: doc.getCreator() || undefined,
          producer: doc.getProducer() || undefined,
          creationDate: doc.getCreationDate() ? doc.getCreationDate()?.toLocaleString() : undefined,
          modificationDate: doc.getModificationDate() ? doc.getModificationDate()?.toLocaleString() : undefined,
        });
      } catch (e) {
        console.error('Failed reading metadata', e);
      }
    };

    readMeta();
  }, [currentFile]);

  const handleScrubMetadata = async () => {
    if (!currentFile) return;
    await cleanMetadata();
    setMetadata({});
  };

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Document Security & Sanitization
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Scrub hidden metadata, author identities, tracking identifiers, and prepare sensitive files for safe distribution.
          </p>
        </div>

        <div className="w-full">
          <FileDropzone onFileSelected={loadFile} />
        </div>
      </div>
    );
  }

  const hasAnyMetadata = Object.values(metadata).some((v) => !!v);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Privacy & Metadata Sanitizer
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active file: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentFile.name}</span>
            </p>
          </div>
        </div>

        <Button
          onClick={handleScrubMetadata}
          disabled={processing.status === 'processing'}
          className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
          Scrub All Metadata
        </Button>
      </div>

      {/* Metadata Audit Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Embedded Metadata Audit
            </h3>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            hasAnyMetadata
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
          }`}>
            {hasAnyMetadata ? 'Contains Metadata Tags' : 'Clean & Sanitized'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          PDF documents often secretly contain author names, operating system identifiers, software versions, and edit histories that should be removed prior to public distribution or legal filing.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-400 block mb-0.5 font-medium">Document Title:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">
              {metadata.title || <em className="text-slate-400 font-normal">None detected</em>}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-400 block mb-0.5 font-medium">Author / Owner:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">
              {metadata.author || <em className="text-slate-400 font-normal">None detected</em>}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-400 block mb-0.5 font-medium">PDF Producer Engine:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">
              {metadata.producer || <em className="text-slate-400 font-normal">None detected</em>}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-400 block mb-0.5 font-medium">Creation Software:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">
              {metadata.creator || <em className="text-slate-400 font-normal">None detected</em>}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-400 block mb-0.5 font-medium">Created Timestamp:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">
              {metadata.creationDate || <em className="text-slate-400 font-normal">None detected</em>}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-400 block mb-0.5 font-medium">Modified Timestamp:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">
              {metadata.modificationDate || <em className="text-slate-400 font-normal">None detected</em>}
            </span>
          </div>
        </div>
      </div>

      {/* Permanent Redaction Studio Callout */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-base">Permanent Redaction Studio</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Never use black marker pens or surface highlighter overlays to hide SSNs, financial records, or names. OmniPDF's Redaction engine permanently burns blackouts into document pixels so data cannot be recovered by text copying or OCR inspection.
          </p>
        </div>

        <Button
          onClick={() => navigate('/editor')}
          className="bg-rose-600 hover:bg-rose-500 text-white shrink-0 gap-2 text-xs font-semibold px-4 py-2.5"
        >
          Open Redaction Studio
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
