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
  Save,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { Button } from '../ui/Button';
import { PDFDocument } from 'pdf-lib';
import { updatePdfMetadata } from '../../lib/pdf/pdf-engine';

export const ProtectWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { currentFile, loadFile, cleanMetadata, updateActiveDocument, processing } = usePdf();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [creator, setCreator] = useState('');
  const [producer, setProducer] = useState('');
  const [creationDate, setCreationDate] = useState('');
  const [modificationDate, setModificationDate] = useState('');

  const [activeTab, setActiveTab] = useState<'metadata' | 'encryption' | 'redaction'>('metadata');

  useEffect(() => {
    if (!currentFile) return;

    const readMeta = async () => {
      try {
        const doc = await PDFDocument.load(currentFile.data, { ignoreEncryption: true });
        setTitle(doc.getTitle() || '');
        setAuthor(doc.getAuthor() || '');
        setSubject(doc.getSubject() || '');
        setKeywords(doc.getKeywords() || '');
        setCreator(doc.getCreator() || '');
        setProducer(doc.getProducer() || '');
        setCreationDate(doc.getCreationDate() ? doc.getCreationDate()!.toLocaleString() : '');
        setModificationDate(doc.getModificationDate() ? doc.getModificationDate()!.toLocaleString() : '');
      } catch (e) {
        console.error('Failed reading metadata', e);
      }
    };

    readMeta();
  }, [currentFile]);

  const handleSaveMetadata = async () => {
    if (!currentFile) return;

    try {
      const updatedPdf = await updatePdfMetadata(currentFile.data, {
        title,
        author,
        subject,
        keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
        creator,
        producer,
      });

      await updateActiveDocument(updatedPdf, 'Update Document Metadata');
    } catch (err) {
      console.error('Failed saving metadata:', err);
    }
  };

  const handleScrubMetadata = async () => {
    if (!currentFile) return;
    await cleanMetadata();
    setTitle('');
    setAuthor('');
    setSubject('');
    setKeywords('');
    setCreator('');
    setProducer('OmniPDF Sanitizer');
  };

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Document Security & Metadata
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Edit or scrub metadata, author identities, tracking identifiers, and prepare sensitive files for safe distribution.
          </p>
        </div>

        <div className="w-full">
          <FileDropzone />
        </div>
      </div>
    );
  }

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
              Privacy, Metadata & Security
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active file: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentFile.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleScrubMetadata}
            disabled={processing.status === 'processing'}
            className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Scrub All Metadata
          </Button>

          <Button
            onClick={handleSaveMetadata}
            disabled={processing.status === 'processing'}
            className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Metadata Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-xl">
        <button
          onClick={() => setActiveTab('metadata')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'metadata'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Edit & View Metadata
        </button>

        <button
          onClick={() => setActiveTab('redaction')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'redaction'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <EyeOff className="w-4 h-4" />
          Permanent Redaction
        </button>

        <button
          onClick={() => setActiveTab('encryption')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'encryption'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Password & Permissions
        </button>
      </div>

      {/* Tab 1: Edit & View Metadata */}
      {activeTab === 'metadata' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Document Metadata Fields
              </h3>
              <p className="text-xs text-slate-500">
                Edit document title, author credentials, subject, or keywords.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Financial Statement 2026"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Author / Creator Name
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Corporate Audit"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Keywords (Comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="audit, finance, report"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                PDF Producer Tool
              </label>
              <input
                type="text"
                value={producer}
                onChange={(e) => setProducer(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Creation Software / Application
              </label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          {(creationDate || modificationDate) && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex flex-wrap gap-4 font-mono">
              {creationDate && <span>Created: {creationDate}</span>}
              {modificationDate && <span>Modified: {modificationDate}</span>}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Permanent Redaction */}
      {activeTab === 'redaction' && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-base">Permanent Pixel Redaction Studio</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Never use black marker pens or surface highlighter overlays to hide SSNs, financial records, or names. OmniPDF's Redaction engine permanently burns blackouts into document pixels and removes underlying vector text so data cannot be recovered by text copying or OCR inspection.
          </p>

          <div className="pt-2">
            <Button
              onClick={() => navigate('/editor')}
              className="bg-rose-600 hover:bg-rose-500 text-white gap-2 text-xs font-semibold"
            >
              Open Redaction Studio in Editor
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Tab 3: Password & Permissions */}
      {activeTab === 'encryption' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <KeyRound className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Password Protection & Permissions
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <p>
              OmniPDF supports loading encrypted and password-protected PDF files directly in your browser.
            </p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-semibold text-slate-900 dark:text-white block">
                Standard Security Principles:
              </span>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Legitimate Password Removal:</strong> When you provide the valid document password, OmniPDF decrypts the internal stream and lets you export a clean, unencrypted PDF.
                </li>
                <li>
                  <strong>Permissions:</strong> Standard encryption allows setting owner passwords for printing and text copying restrictions.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
