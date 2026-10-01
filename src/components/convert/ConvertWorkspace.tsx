import React, { useState } from 'react';
import {
  ArrowLeftRight,
  FileImage,
  FileText,
  FileCode,
  Download,
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  Zap,
  CheckCircle2,
  FileArchive,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { FileDropzone } from '../common/FileDropzone';
import { Button } from '../ui/Button';
import { formatBytes, downloadBlob } from '../../lib/utils';
import {
  renderPageThumbnail,
  createZipBundle,
  convertImagesToPdf,
  convertTextToPdf,
} from '../../lib/pdf/pdf-engine';

export const ConvertWorkspace: React.FC = () => {
  const {
    currentFile,
    pages,
    loadFile,
    convertPdfToImagesAction,
    convertImagesToPdfAction,
    convertTextToPdfAction,
    processing,
  } = usePdf();

  const [activeTab, setActiveTab] = useState<'pdf-to-img' | 'img-to-pdf' | 'text-to-pdf'>('pdf-to-img');

  // PDF to Image State
  const [imgFormat, setImgFormat] = useState<'image/jpeg' | 'image/png'>('image/png');
  const [imgScale, setImgScale] = useState<number>(1.5);
  const [isExportingImages, setIsExportingImages] = useState(false);

  // Images to PDF State
  const [uploadedImages, setUploadedImages] = useState<{ id: string; name: string; dataUrl: string }[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [pageMargin, setPageMargin] = useState<number>(20);

  // Text to PDF State
  const [docTitle, setDocTitle] = useState('Document Notes');
  const [docBodyText, setDocBodyText] = useState('');

  // Handle PDF to Images
  const handlePdfToImages = async () => {
    if (!currentFile) return;
    setIsExportingImages(true);
    try {
      await convertPdfToImagesAction(imgFormat);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExportingImages(false);
    }
  };

  // Handle Image Upload for Image-to-PDF
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              name: file.name,
              dataUrl: event.target?.result as string,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveUploadedImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleConvertImagesToPdf = async () => {
    if (uploadedImages.length === 0) return;
    await convertImagesToPdfAction(uploadedImages, { pageSize, margin: pageMargin });
  };

  const handleConvertTextToPdf = async () => {
    if (!docBodyText.trim()) return;
    await convertTextToPdfAction(docBodyText, docTitle);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Format Converters
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Convert between PDF, PNG/JPEG images, and formatted text documents.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-xl">
        <button
          onClick={() => setActiveTab('pdf-to-img')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'pdf-to-img'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileImage className="w-4 h-4" />
          PDF to Images (JPG / PNG)
        </button>

        <button
          onClick={() => setActiveTab('img-to-pdf')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'img-to-pdf'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Images to PDF
        </button>

        <button
          onClick={() => setActiveTab('text-to-pdf')}
          className={`flex items-center gap-2 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'text-to-pdf'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Text to PDF
        </button>
      </div>

      {/* Tab 1: PDF to Images */}
      {activeTab === 'pdf-to-img' && (
        <div className="space-y-6">
          {!currentFile ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Load a PDF document to rasterize and export pages as high-resolution images.
              </p>
              <FileDropzone onFileSelected={loadFile} />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Convert Document to Images
                  </h3>
                  <p className="text-xs text-slate-500">
                    Source: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentFile.name}</span> ({pages.length} pages)
                  </p>
                </div>

                <Button
                  onClick={handlePdfToImages}
                  disabled={isExportingImages || processing.status === 'processing'}
                  className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium"
                >
                  <FileArchive className="w-4 h-4" />
                  {isExportingImages ? 'Rendering Images...' : 'Convert & Download ZIP'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Output Image Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setImgFormat('image/png')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        imgFormat === 'image/png'
                          ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-bold ring-2 ring-brand-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-semibold">PNG</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Lossless & sharpest</div>
                    </button>

                    <button
                      onClick={() => setImgFormat('image/jpeg')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        imgFormat === 'image/jpeg'
                          ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-bold ring-2 ring-brand-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-semibold">JPEG</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Compact file size</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Render Resolution
                  </label>
                  <select
                    value={imgScale}
                    onChange={(e) => setImgScale(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={1.0}>1.0x (Standard Web - ~96 DPI)</option>
                    <option value={1.5}>1.5x (Crisp High-DPI - ~144 DPI)</option>
                    <option value={2.0}>2.0x (Ultra Sharp - ~200 DPI)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">Higher scale results in larger image dimensions.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Images to PDF */}
      {activeTab === 'img-to-pdf' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Compile Photos / Images into PDF
              </h3>
              <p className="text-xs text-slate-500">
                {uploadedImages.length} {uploadedImages.length === 1 ? 'image' : 'images'} selected
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  Add More Images
                </span>
              </label>

              <Button
                onClick={handleConvertImagesToPdf}
                disabled={uploadedImages.length === 0 || processing.status === 'processing'}
                className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium"
              >
                <Zap className="w-4 h-4 fill-current" />
                Generate PDF
              </Button>
            </div>
          </div>

          {/* Config options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Target Page Dimension
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium"
              >
                <option value="a4">Standard A4 (210 × 297 mm)</option>
                <option value="letter">US Letter (8.5 × 11 in)</option>
                <option value="fit">Fit Page to Image Resolution</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                Page Margins ({pageMargin}pt)
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={pageMargin}
                onChange={(e) => setPageMargin(parseInt(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg mt-3"
              />
            </div>
          </div>

          {/* Uploaded images gallery */}
          {uploadedImages.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                No images added yet. Click above to select multiple photos or graphics.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {uploadedImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 overflow-hidden shadow-sm"
                >
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="w-full h-28 object-contain rounded-lg bg-white dark:bg-slate-900"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] font-mono font-medium text-slate-500">
                      Page {idx + 1}
                    </span>
                    <button
                      onClick={() => handleRemoveUploadedImage(img.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/60"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Text to PDF */}
      {activeTab === 'text-to-pdf' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Create PDF from Text or Markdown
              </h3>
              <p className="text-xs text-slate-500">
                Pasting raw text automatically formats into clean paginated A4 PDF.
              </p>
            </div>

            <Button
              onClick={handleConvertTextToPdf}
              disabled={!docBodyText.trim() || processing.status === 'processing'}
              className="gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium"
            >
              <Zap className="w-4 h-4 fill-current" />
              Build & Open PDF
            </Button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Document Header Title
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Body Content (Paragraphs wrap cleanly onto pages)
            </label>
            <textarea
              rows={12}
              value={docBodyText}
              onChange={(e) => setDocBodyText(e.target.value)}
              placeholder="Type or paste text content here..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
