import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Zap,
  Download,
  ShieldCheck,
  RefreshCw,
  Loader2,
  FileArchive,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { Button } from '../ui/Button';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { repairPdfDocument, RepairReport } from '../../lib/pdf/pdf-engine';

export const PdfRepairWorkspace: React.FC = () => {
  const { currentFile, loadFile, updateActiveDocument, processing } = usePdf();

  const [isRepairing, setIsRepairing] = useState(false);
  const [report, setReport] = useState<RepairReport | null>(null);

  const handleStartRepair = async (dataBuffer?: ArrayBuffer) => {
    const targetBuffer = dataBuffer || (currentFile ? currentFile.data : null);
    if (!targetBuffer) return;

    setIsRepairing(true);
    setReport(null);

    try {
      const rep = await repairPdfDocument(targetBuffer);
      setReport(rep);
    } catch (err: any) {
      console.error(err);
      setReport({
        success: false,
        actionsTaken: [`Failed to repair document: ${err.message}`],
        pageCount: 0,
        originalSize: targetBuffer.byteLength,
        newSize: 0,
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const handleLoadRepaired = async () => {
    if (!report || !report.repairedBytes) return;
    await updateActiveDocument(report.repairedBytes, 'Repair PDF Structure');
  };

  const handleDownloadRepaired = () => {
    if (!report || !report.repairedBytes) return;
    const blob = new Blob([report.repairedBytes as unknown as BlobPart], { type: 'application/pdf' });
    downloadBlob(blob, `${currentFile ? currentFile.name.replace(/\.pdf$/i, '') : 'document'}_repaired.pdf`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              PDF Repair & Reconstruction
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recover damaged, unreadable, or structurally corrupt PDF documents using fault-tolerant stream parsing.
            </p>
          </div>
        </div>

        {currentFile && (
          <Button
            onClick={() => handleStartRepair()}
            disabled={isRepairing}
            className="gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
          >
            {isRepairing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Repairing PDF...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                Run Structural Repair
              </>
            )}
          </Button>
        )}
      </div>

      {!currentFile && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Drop your damaged or broken PDF file here. OmniPDF will attempt to rebuild its cross-reference dictionary and salvage all readable pages.
          </p>
          <FileDropzone
            onFileSelected={async (file) => {
              const buffer = await file.arrayBuffer();
              await loadFile(file);
              handleStartRepair(buffer);
            }}
          />
        </div>
      )}

      {/* Repair Report Results */}
      {report && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              {report.success ? (
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {report.success ? 'PDF Successfully Repaired & Verified' : 'Repair Attempt Unsuccessful'}
                </h3>
                <p className="text-xs text-slate-500">
                  {report.success
                    ? `Reconstructed document contains ${report.pageCount} readable pages.`
                    : 'The binary corruption in this document was irrecoverable.'}
                </p>
              </div>
            </div>

            {report.success && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadRepaired}
                  className="gap-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Repaired
                </Button>
                <Button
                  size="sm"
                  onClick={handleLoadRepaired}
                  className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Load into Workspace
                </Button>
              </div>
            )}
          </div>

          {/* Diagnostic Log */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Diagnostics & Reconstruction Steps:
            </h4>
            <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 font-mono text-xs">
              {report.actionsTaken.map((act, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-brand-500 font-bold shrink-0">[{i + 1}]</span>
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
