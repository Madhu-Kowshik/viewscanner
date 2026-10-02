import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Sliders,
  RotateCw,
  Trash2,
  Download,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { usePdf } from '../../context/PdfContext';

interface ScannedPage {
  id: string;
  originalDataUrl: string;
  enhancedDataUrl: string;
  rotation: number;
  filter: 'none' | 'bw' | 'grayscale' | 'magic-clean';
  brightness: number;
  contrast: number;
}

export const DocumentScanner: React.FC = () => {
  const { convertImagesToPdfAction } = usePdf();
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraActive(true);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraActive(false);
        nativeCameraInputRef.current?.click();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch {
          // ignore play error
        }
      }
    } catch {
      setCameraActive(false);
      // Fallback directly to native device camera capture
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      } else {
        alert('Unable to access device camera. Please check camera permissions or upload an image file.');
      }
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    addPage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            addPage(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const addPage = (dataUrl: string) => {
    const newPage: ScannedPage = {
      id: Math.random().toString(36).substring(2, 9),
      originalDataUrl: dataUrl,
      enhancedDataUrl: dataUrl,
      rotation: 0,
      filter: 'none',
      brightness: 0,
      contrast: 0,
    };
    setPages((prev) => {
      const updated = [...prev, newPage];
      setActivePageIndex(updated.length - 1);
      return updated;
    });
  };

  // Image enhancement filters applied via HTML5 Canvas
  const applyFilterToPage = (filter: 'none' | 'bw' | 'grayscale' | 'magic-clean', brightness = 0, contrast = 0) => {
    if (pages.length === 0) return;
    const currentPage = pages[activePageIndex];

    const img = new Image();
    img.src = currentPage.originalDataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle rotation
      if (currentPage.rotation !== 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((currentPage.rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0);
      }

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply brightness
        r = Math.min(255, Math.max(0, r + brightness));
        g = Math.min(255, Math.max(0, g + brightness));
        b = Math.min(255, Math.max(0, b + brightness));

        // Apply contrast
        r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, factor * (b - 128) + 128));

        // Filter types
        if (filter === 'grayscale') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = gray;
        } else if (filter === 'bw') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          // High-contrast scan binarization threshold
          const threshold = 135;
          const val = gray > threshold ? 255 : 0;
          r = g = b = val;
        } else if (filter === 'magic-clean') {
          // Document background whitening filter
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          if (gray > 180) {
            r = g = b = 255; // bleach paper background
          } else {
            // darken text
            r = Math.max(0, r - 30);
            g = Math.max(0, g - 30);
            b = Math.max(0, b - 30);
          }
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      ctx.putImageData(imgData, 0, 0);
      const enhancedUrl = canvas.toDataURL('image/jpeg', 0.92);

      setPages((prev) =>
        prev.map((p, idx) =>
          idx === activePageIndex
            ? { ...p, filter, brightness, contrast, enhancedDataUrl: enhancedUrl }
            : p
        )
      );
    };
  };

  const handleRotateCurrent = () => {
    if (pages.length === 0) return;
    const current = pages[activePageIndex];
    const newRot = (current.rotation + 90) % 360;
    setPages((prev) =>
      prev.map((p, idx) => (idx === activePageIndex ? { ...p, rotation: newRot } : p))
    );
    setTimeout(() => applyFilterToPage(current.filter, current.brightness, current.contrast), 50);
  };

  const handleDeleteCurrent = () => {
    if (pages.length === 0) return;
    setPages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== activePageIndex);
      setActivePageIndex(Math.max(0, activePageIndex - 1));
      return filtered;
    });
  };

  const handleCompileToPdf = async () => {
    if (pages.length === 0) return;
    const imgPayload = pages.map((p, i) => ({
      dataUrl: p.enhancedDataUrl,
      name: `scan_page_${i + 1}.jpg`,
    }));
    await convertImagesToPdfAction(imgPayload, { pageSize });
  };

  const activePage = pages[activePageIndex];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Document Scanner & Enhancer
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Capture photos with your camera or upload scans, enhance text, remove shadows, and convert to clean PDF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!cameraActive ? (
            <Button variant="outline" size="sm" onClick={startCamera}>
              <Camera className="w-4 h-4 mr-1.5 text-brand-600" />
              Camera Scan
            </Button>
          ) : (
            <Button variant="destructive" size="sm" onClick={stopCamera}>
              Cancel Camera
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1.5" />
            Upload Photos
          </Button>

          {pages.length > 0 && (
            <Button variant="primary" size="sm" onClick={handleCompileToPdf}>
              <Download className="w-4 h-4 mr-1.5" />
              Export PDF ({pages.length}p)
            </Button>
          )}
        </div>
      </div>

      {/* Live Camera Viewfinder Modal/Section */}
      {cameraActive && (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-900 p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="rounded-xl max-h-[460px] w-full object-contain"
          />

          {/* Scanner Overlay Guide */}
          <div className="absolute inset-8 border-2 border-brand-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-4">
            <span className="text-[11px] font-semibold text-white/80 bg-black/50 px-2 py-0.5 rounded self-start">
              Align document inside border
            </span>
          </div>

          <div className="mt-4 flex gap-3 z-10">
            <Button variant="primary" size="lg" onClick={capturePhoto} className="px-8 shadow-xl">
              <Camera className="w-5 h-5 mr-2" />
              Snap Photo
            </Button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      {pages.length === 0 && !cameraActive ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400 mb-4">
            <Camera className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            No scanned documents yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Use your phone or webcam to scan physical documents, or upload photos of invoices, receipts, and forms.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button variant="primary" size="md" onClick={startCamera}>
              <Camera className="w-4 h-4 mr-1.5" />
              Start Camera
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => nativeCameraInputRef.current?.click()}
              className="sm:hidden"
            >
              <Camera className="w-4 h-4 mr-1.5" />
              Phone Camera
            </Button>
            <Button variant="outline" size="md" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1.5" />
              Upload Image Files
            </Button>
          </div>
        </div>
      ) : (
        pages.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Center / Left: Active Page Preview */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Page {activePageIndex + 1} of {pages.length}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="icon" onClick={handleRotateCurrent} title="Rotate 90°" className="h-7 w-7">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleDeleteCurrent} title="Delete Page" className="h-7 w-7 text-rose-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Preview canvas container */}
              <div className="my-4 flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-950 rounded-xl p-4 min-h-[380px]">
                {activePage && (
                  <img
                    src={activePage.enhancedDataUrl}
                    alt="Scanned page"
                    className="max-h-[460px] max-w-full object-contain rounded shadow-md border border-slate-200 dark:border-slate-800"
                  />
                )}
              </div>

              {/* Thumbnail Strip */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                {pages.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePageIndex(idx)}
                    className={`h-16 w-12 rounded border overflow-hidden shrink-0 transition-all ${
                      idx === activePageIndex
                        ? 'border-brand-500 ring-2 ring-brand-500/30'
                        : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p.enhancedDataUrl} alt={`p${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Enhancement Filters & Controls */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Scan Presets
                </span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => applyFilterToPage('none', 0, 0)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      activePage?.filter === 'none'
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Original Photo
                  </button>

                  <button
                    type="button"
                    onClick={() => applyFilterToPage('magic-clean', 10, 20)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      activePage?.filter === 'magic-clean'
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    ✨ Magic Clean
                  </button>

                  <button
                    type="button"
                    onClick={() => applyFilterToPage('bw', 0, 30)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      activePage?.filter === 'bw'
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    B&W Scan
                  </button>

                  <button
                    type="button"
                    onClick={() => applyFilterToPage('grayscale', 0, 10)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      activePage?.filter === 'grayscale'
                        ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40 text-brand-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Grayscale
                  </button>
                </div>
              </div>

              {/* Sliders: Brightness & Contrast */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Manual Adjustments
                </span>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Brightness</span>
                    <span>{activePage?.brightness || 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    value={activePage?.brightness || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      applyFilterToPage(activePage?.filter || 'none', val, activePage?.contrast || 0);
                    }}
                    className="w-full accent-brand-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Contrast</span>
                    <span>{activePage?.contrast || 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="80"
                    value={activePage?.contrast || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      applyFilterToPage(activePage?.filter || 'none', activePage?.brightness || 0, val);
                    }}
                    className="w-full accent-brand-600"
                  />
                </div>
              </div>

              {/* Output Paper Format */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target Page Size
                </span>
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  {(['a4', 'letter', 'fit'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setPageSize(size)}
                      className={`py-2 rounded-lg text-xs font-semibold uppercase ${
                        pageSize === size
                          ? 'bg-brand-600 text-white dark:bg-brand-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="primary" size="lg" onClick={handleCompileToPdf} className="w-full">
                <FileCheck className="w-4 h-4 mr-2" />
                Compile to PDF
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
};
