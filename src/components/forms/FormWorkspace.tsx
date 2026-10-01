import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  CheckCircle2,
  Layers,
  Sparkles,
  Zap,
  Download,
  SquareCheck,
  Type,
  ChevronDown,
  Trash2,
  FileText,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { Button } from '../ui/Button';
import {
  getFormFieldsFromPdf,
  fillFormFieldsInPdf,
  addFormFieldToPdf,
  FormFieldInfo,
} from '../../lib/pdf/pdf-engine';

export const FormWorkspace: React.FC = () => {
  const { currentFile, pages, loadFile, updateActiveDocument, processing } = usePdf();

  const [activeTab, setActiveTab] = useState<'fill' | 'create'>('fill');
  const [fields, setFields] = useState<FormFieldInfo[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [flattenOnSave, setFlattenOnSave] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // New field creator state
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'checkbox' | 'dropdown'>('text');
  const [newFieldTargetPage, setNewFieldTargetPage] = useState(0);
  const [dropdownOptionsStr, setDropdownOptionsStr] = useState('Option 1, Option 2, Option 3');

  // Detect form fields on file load
  useEffect(() => {
    if (!currentFile) return;

    const detect = async () => {
      setIsScanning(true);
      try {
        const detected = await getFormFieldsFromPdf(currentFile.data);
        setFields(detected);

        const initialValues: Record<string, string | boolean> = {};
        detected.forEach((f) => {
          initialValues[f.name] = f.value;
        });
        setFieldValues(initialValues);
      } catch (err) {
        console.warn(err);
      } finally {
        setIsScanning(false);
      }
    };

    detect();
  }, [currentFile]);

  const handleFieldValueChange = (name: string, value: string | boolean) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveFilledPdf = async () => {
    if (!currentFile) return;

    try {
      const updatedPdfBytes = await fillFormFieldsInPdf(
        currentFile.data,
        fieldValues,
        flattenOnSave
      );

      await updateActiveDocument(
        updatedPdfBytes,
        flattenOnSave ? 'Fill & Flatten PDF Form' : 'Fill Interactive PDF Form'
      );
    } catch (err) {
      console.error('Failed saving form:', err);
    }
  };

  const handleCreateFormField = async () => {
    if (!currentFile || !newFieldName.trim()) return;

    try {
      const options =
        newFieldType === 'dropdown'
          ? dropdownOptionsStr.split(',').map((o) => o.trim()).filter(Boolean)
          : undefined;

      const updatedPdfBytes = await addFormFieldToPdf(
        currentFile.data,
        newFieldTargetPage,
        newFieldType,
        newFieldName.trim(),
        100,
        500,
        newFieldType === 'checkbox' ? 20 : 180,
        newFieldType === 'checkbox' ? 20 : 25,
        options
      );

      await updateActiveDocument(updatedPdfBytes, `Add Form Field (${newFieldName.trim()})`);
      setNewFieldName('');

      // Refresh fields
      const refreshed = await getFormFieldsFromPdf(updatedPdfBytes);
      setFields(refreshed);
    } catch (err) {
      console.error('Failed adding form field:', err);
    }
  };

  if (!currentFile) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Fill & Build Interactive PDF Forms
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Fill interactive form fields, checkboxes, and dropdowns, add new fields to any document, and flatten filled forms for signing.
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
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              PDF Forms & AcroForms
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentFile.name}</span> • {fields.length} detected form fields
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveFilledPdf}
            disabled={fields.length === 0 || processing.status === 'processing'}
            className="gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold"
          >
            <Zap className="w-4 h-4 fill-current" />
            Save Filled PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-xl">
        <button
          onClick={() => setActiveTab('fill')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'fill'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Fill Form Fields ({fields.length})
        </button>

        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'create'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Form Fields to Document
        </button>
      </div>

      {/* Tab 1: Fill Existing Fields */}
      {activeTab === 'fill' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Detected Interactive Fields
              </h3>
              <p className="text-xs text-slate-500">
                Values you enter here are encoded directly into the document’s official PDF form dictionary.
              </p>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={flattenOnSave}
                onChange={(e) => setFlattenOnSave(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>Flatten form fields upon saving</span>
            </label>
          </div>

          {fields.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-3">
              <p>No interactive AcroForm fields were detected in this document.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('create')}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Form Fields Now
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="sm:w-1/3">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate" title={field.name}>
                      {field.name}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      Type: {field.type}
                    </span>
                  </div>

                  <div className="flex-1">
                    {field.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(fieldValues[field.name])}
                          onChange={(e) => handleFieldValueChange(field.name, e.target.checked)}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                        />
                        <span>Checked</span>
                      </label>
                    ) : field.type === 'dropdown' ? (
                      <select
                        value={String(fieldValues[field.name] || '')}
                        onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs"
                      >
                        <option value="">-- Select option --</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={String(fieldValues[field.name] || '')}
                        onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.name}...`}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Create Form Fields */}
      {activeTab === 'create' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Add New Interactive Form Field
            </h3>
            <p className="text-xs text-slate-500">
              Create official fillable text inputs, checkboxes, and select menus that any standard PDF reader can fill out.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Field Identifier Name
              </label>
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="e.g. Applicant_Signature"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Field Type
              </label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium"
              >
                <option value="text">Text Input Field</option>
                <option value="checkbox">Checkbox Field</option>
                <option value="dropdown">Dropdown Select Menu</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Target Page
              </label>
              <select
                value={newFieldTargetPage}
                onChange={(e) => setNewFieldTargetPage(parseInt(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium"
              >
                {pages.map((_, idx) => (
                  <option key={idx} value={idx}>
                    Page {idx + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {newFieldType === 'dropdown' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Dropdown Options (Comma-separated)
              </label>
              <input
                type="text"
                value={dropdownOptionsStr}
                onChange={(e) => setDropdownOptionsStr(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
              />
            </div>
          )}

          <div className="pt-2">
            <Button
              onClick={handleCreateFormField}
              disabled={!newFieldName.trim() || processing.status === 'processing'}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Embed Field on Page {newFieldTargetPage + 1}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
