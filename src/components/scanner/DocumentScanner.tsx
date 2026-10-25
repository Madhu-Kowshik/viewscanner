import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Sliders,
  RotateCw,
  RotateCcw,
  Trash2,
  Download,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  ScanLine,
  ShieldCheck,
  ImagePlus,
  Crop,
  Grid,
  Maximize2,
  ArrowRight,
  SplitSquareVertical,
  Sun,
  Contrast,
  Compass,
  Check,
  X,
  Plus,
  Eye,
  SwitchCamera,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { usePdf } from '../../context/PdfContext';
import { useNavigate } from 'react-router-dom';

export interface CornerPoint {
  x: number; // 0 to 1 normalized
  y: number; // 0 to 1 normalized
}

export interface ScannedPage {
  id: string;
  originalDataUrl: string;
  enhancedDataUrl: string;
  rotation: number; // 0, 90, 180, 270
  straightenAngle: number; // -45 to +45 deg
  filter: 'none' | 'bw' | 'grayscale' | 'magic-clean' | 'color-boost';
  brightness: number;
  contrast: number;
  corners: [CornerPoint, CornerPoint, CornerPoint, CornerPoint]; // TL, TR, BR, BL
  isCropped: boolean;
}

export const DocumentScanner: React.FC = () => {
  const { convertImagesToPdfAction, updateActiveDocument } = usePdf();
  const navigate = useNavigate();

  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');

  // Camera settings
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [viewfinderGuide, setViewfinderGuide] = useState<'document' | 'idcard' | 'receipt' | 'book'>('document');
  const [isBurstShooting, setIsBurstShooting] = useState<boolean>(false);
  const [burstCount, setBurstCount] = useState<number>(0);

  // Editor modes
  const [editorMode, setEditorMode] = useState<'adjust' | 'crop' | 'straighten'>('adjust');
  const [showBeforeAfter, setShowBeforeAfter] = useState<boolean>(false);
  const [splitRatio, setSplitRatio] = useState<number>(0.5); // 0 to 1
  const [showStraightenGrid, setShowStraightenGrid] = useState<boolean>(false);

  // Corner Pin Dragging
  const [activeCornerIdx, setActiveCornerIdx] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLDivElement>(null);

  // Enumerate video devices on mount
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }).catch(() => {});
    }
  }, [selectedDeviceId]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async (overrideDeviceId?: string, overrideFacing?: 'environment' | 'user') => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      setCameraActive(true);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraActive(false);
        nativeCameraInputRef.current?.click();
        return;
      }

      const facing = overrideFacing || cameraFacing;
      const deviceId = overrideDeviceId || selectedDeviceId;

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch {
          // ignore play promise resolution
        }
      }
    } catch {
      setCameraActive(false);
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

  const switchCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(undefined, nextFacing);
  };

  const capturePhoto = (keepCameraOpen = false) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    addPage(dataUrl);
    setBurstCount((c) => c + 1);

    if (!keepCameraOpen) {
      stopCamera();
    }
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
    const defaultCorners: [CornerPoint, CornerPoint, CornerPoint, CornerPoint] = [
      { x: 0.05, y: 0.05 }, // Top-Left
      { x: 0.95, y: 0.05 }, // Top-Right
      { x: 0.95, y: 0.95 }, // Bottom-Right
      { x: 0.05, y: 0.95 }, // Bottom-Left
    ];

    const newPage: ScannedPage = {
      id: Math.random().toString(36).substring(2, 9),
      originalDataUrl: dataUrl,
      enhancedDataUrl: dataUrl,
      rotation: 0,
      straightenAngle: 0,
      filter: 'magic-clean',
      brightness: 10,
      contrast: 20,
      corners: defaultCorners,
      isCropped: false,
    };

    setPages((prev) => {
      const updated = [...prev, newPage];
      setActivePageIndex(updated.length - 1);
      return updated;
    });

    // Auto-apply initial enhancement to the newly captured page
    setTimeout(() => {
      processPagePipeline(newPage, (enhancedUrl) => {
        setPages((prev) =>
          prev.map((p) => (p.id === newPage.id ? { ...p, enhancedDataUrl: enhancedUrl } : p))
        );
      });
    }, 50);
  };

  // --- High-Fidelity Image Processing Pipeline ---
  const processPagePipeline = (
    page: ScannedPage,
    callback: (resultUrl: string) => void
  ) => {
    const img = new Image();
    img.src = page.originalDataUrl;
    img.onload = () => {
      // 1. Initial crop calculation
      let srcX = 0;
      let srcY = 0;
      let srcW = img.width;
      let srcH = img.height;

      if (page.isCropped) {
        const minX = Math.min(...page.corners.map((c) => c.x)) * img.width;
        const maxX = Math.max(...page.corners.map((c) => c.x)) * img.width;
        const minY = Math.min(...page.corners.map((c) => c.y)) * img.height;
        const maxY = Math.max(...page.corners.map((c) => c.y)) * img.height;

        srcX = Math.max(0, Math.floor(minX));
        srcY = Math.max(0, Math.floor(minY));
        srcW = Math.min(img.width - srcX, Math.ceil(maxX - minX));
        srcH = Math.min(img.height - srcY, Math.ceil(maxY - minY));
      }

      const canvas = document.createElement('canvas');
      const totalRotation = (page.rotation + page.straightenAngle) * (Math.PI / 180);

      // Handle canvas bounds after rotation
      if (Math.abs(page.rotation % 180) === 90) {
        canvas.width = srcH;
        canvas.height = srcW;
      } else {
        canvas.width = srcW;
        canvas.height = srcH;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(totalRotation);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, -srcW / 2, -srcH / 2, srcW, srcH);
      ctx.restore();

      // 2. Pixel Enhancement & Filter Processing
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const brightness = page.brightness;
      const contrast = page.contrast;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Brightness
        r = Math.min(255, Math.max(0, r + brightness));
        g = Math.min(255, Math.max(0, g + brightness));
        b = Math.min(255, Math.max(0, b + brightness));

        // Contrast
        r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, factor * (g - 128) + 128));

        // Filters
        if (page.filter === 'grayscale') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = gray;
        } else if (page.filter === 'bw') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          const val = gray > 132 ? 255 : 0;
          r = g = b = val;
        } else if (page.filter === 'magic-clean') {
          // CamScanner paper bleach background algorithm
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          if (gray > 168) {
            // Bleach paper to clean document white
            r = 255;
            g = 255;
            b = 255;
          } else {
            // Darken ink text for high contrast readability
            r = Math.max(0, r * 0.78);
            g = Math.max(0, g * 0.78);
            b = Math.max(0, b * 0.78);
          }
        } else if (page.filter === 'color-boost') {
          // Vibrancy for stamps and colored logos
          r = Math.min(255, r * 1.15);
          g = Math.min(255, g * 1.15);
          b = Math.min(255, b * 1.15);
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      ctx.putImageData(imgData, 0, 0);
      const enhancedUrl = canvas.toDataURL('image/jpeg', 0.93);
      callback(enhancedUrl);
    };
  };

  const updateActivePage = (updater: (p: ScannedPage) => ScannedPage) => {
    if (pages.length === 0) return;
    const current = pages[activePageIndex];
    const updated = updater(current);

    processPagePipeline(updated, (enhancedUrl) => {
      setPages((prev) =>
        prev.map((p, idx) => (idx === activePageIndex ? { ...updated, enhancedDataUrl: enhancedUrl } : p))
      );
    });
  };

  const handleRotate = (deg: number) => {
    updateActivePage((p) => ({
      ...p,
      rotation: ((p.rotation + deg) % 360 + 360) % 360,
    }));
  };

  const handleSetFilter = (filter: ScannedPage['filter']) => {
    updateActivePage((p) => ({
      ...p,
      filter,
      brightness: filter === 'magic-clean' ? 10 : filter === 'bw' ? 0 : p.brightness,
      contrast: filter === 'magic-clean' ? 20 : filter === 'bw' ? 30 : p.contrast,
    }));
  };

  const handleApplyCrop = () => {
    updateActivePage((p) => ({
      ...p,
      isCropped: true,
    }));
    setEditorMode('adjust');
  };

  const handleResetCrop = () => {
    updateActivePage((p) => ({
      ...p,
      isCropped: false,
      corners: [
        { x: 0.05, y: 0.05 },
        { x: 0.95, y: 0.05 },
        { x: 0.95, y: 0.95 },
        { x: 0.05, y: 0.95 },
      ],
    }));
    setEditorMode('adjust');
  };

  const handleCornerDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeCornerIdx === null || pages.length === 0 || !cropCanvasRef.current) return;
    const rect = cropCanvasRef.current.getBoundingClientRect();
    const x = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));

    setPages((prev) =>
      prev.map((p, idx) => {
        if (idx !== activePageIndex) return p;
        const newCorners = [...p.corners] as [CornerPoint, CornerPoint, CornerPoint, CornerPoint];
        newCorners[activeCornerIdx] = { x, y };
        return { ...p, corners: newCorners };
      })
    );
  };

  const handleDeleteCurrent = () => {
    if (pages.length === 0) return;
    setPages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== activePageIndex);
      setActivePageIndex(Math.max(0, activePageIndex - 1));
      return filtered;
    });
  };

  const handleMovePage = (dir: -1 | 1) => {
    const targetIdx = activePageIndex + dir;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    const newPages = [...pages];
    const temp = newPages[activePageIndex];
    newPages[activePageIndex] = newPages[targetIdx];
    newPages[targetIdx] = temp;
    setPages(newPages);
    setActivePageIndex(targetIdx);
  };

  const handleCompileToPdf = async () => {
    if (pages.length === 0) return;
    const imgPayload = pages.map((p, i) => ({
      dataUrl: p.enhancedDataUrl,
      name: `scan_page_${i + 1}.jpg`,
    }));
    await convertImagesToPdfAction(imgPayload, { pageSize });
  };

  const handleOpenInStudioWorkspace = async () => {
    if (pages.length === 0) return;
    const imgPayload = pages.map((p, i) => ({
      dataUrl: p.enhancedDataUrl,
      name: `scanned_studio_${i + 1}.jpg`,
    }));
    await convertImagesToPdfAction(imgPayload, { pageSize });
    navigate('/organize');
  };

  const activePage = pages[activePageIndex];

  return (
    <div className="cm-scanner-studio w-full max-w-7xl mx-auto flex flex-col gap-5">
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

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 dark:border-violet-400/10 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span className="cm-scanner-icon">
              <Camera className="h-6 w-6" />
            </span>
            CM <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Scanner Studio</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Professional document scanning studio with multi-page capture, perspective crop, and Magic Clean paper whitening.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!cameraActive ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => startCamera()}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-md shadow-emerald-950/20"
            >
              <Camera className="w-4 h-4 mr-1.5" />
              Live Scanner
            </Button>
          ) : (
            <Button variant="destructive" size="sm" onClick={stopCamera}>
              <X className="w-4 h-4 mr-1.5" />
              Close Camera
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1.5" />
            Upload Images
          </Button>

          {pages.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInStudioWorkspace}
                className="border-violet-500/40 text-violet-300 hover:bg-violet-950/40"
              >
                <Layers className="w-4 h-4 mr-1.5 text-violet-400" />
                Open in Studio
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCompileToPdf}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export PDF ({pages.length}p)
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Studio meta badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-400/15 bg-violet-500/[.04] px-4 py-2.5 text-xs text-slate-500 dark:text-slate-300">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> 100% Client-Side Processing • No photos uploaded to any server
        </span>
        <span className="inline-flex items-center gap-2 font-medium">
          <ImagePlus className="h-4 w-4 text-cyan-400" /> {pages.length} {pages.length === 1 ? 'scanned document page' : 'scanned document pages'}
        </span>
      </div>

      {/* Live Camera Viewfinder Studio */}
      {cameraActive && (
        <div className="rounded-2xl border border-teal-500/30 bg-[#070b16] p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          {/* Viewfinder Controls Top Bar */}
          <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-white/10 z-20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white/90">Alignment Guide:</span>
              {(['document', 'idcard', 'receipt', 'book'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setViewfinderGuide(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                    viewfinderGuide === g
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {videoDevices.length > 1 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    startCamera(e.target.value);
                  }}
                  className="bg-slate-900 border border-white/20 text-white text-xs rounded-lg px-2 py-1"
                >
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={switchCameraFacing}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs inline-flex items-center gap-1"
                title="Switch front/rear camera"
              >
                <SwitchCamera className="w-4 h-4" />
                <span className="hidden sm:inline">Flip</span>
              </button>
            </div>
          </div>

          <div className="relative w-full max-h-[520px] flex items-center justify-center overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-h-[500px] w-full object-contain"
            />

            {/* Viewfinder Guide Overlay Brackets */}
            <div
              className={`absolute border-2 pointer-events-none transition-all duration-200 ${
                viewfinderGuide === 'document'
                  ? 'inset-8 sm:inset-12 border-cyan-400/80 rounded-xl'
                  : viewfinderGuide === 'idcard'
                  ? 'w-[340px] h-[215px] border-emerald-400/90 rounded-2xl'
                  : viewfinderGuide === 'receipt'
                  ? 'w-[260px] h-[460px] border-amber-400/80 rounded-lg'
                  : 'inset-4 border-violet-400/80 rounded-xl'
              }`}
            >
              {/* Corner reticle accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-300" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-300" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-300" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-300" />

              <span className="absolute top-2 left-2 text-[10px] uppercase font-bold tracking-wider text-white/90 bg-black/60 px-2 py-0.5 rounded">
                Align {viewfinderGuide} edges
              </span>
            </div>
          </div>

          {/* Shutter Bar */}
          <div className="mt-4 flex items-center gap-4 z-20">
            <Button
              variant="primary"
              size="lg"
              onClick={() => capturePhoto(true)}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold rounded-full shadow-lg shadow-cyan-500/30 text-base"
            >
              <Camera className="w-5 h-5 mr-2" />
              Snap Page ({burstCount})
            </Button>

            {burstCount > 0 && (
              <Button
                variant="outline"
                size="md"
                onClick={stopCamera}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full"
              >
                <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                Done ({burstCount} pages)
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Scanner Workspace Stage */}
      {pages.length === 0 && !cameraActive ? (
        <div className="cm-empty-stage rounded-3xl border-2 border-dashed border-slate-200 dark:border-violet-400/25 bg-white dark:bg-[#0c0e1e] p-12 text-center flex flex-col items-center justify-center shadow-lg">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-500/10 text-cyan-400 mb-4 border border-cyan-500/20">
            <ScanLine className="h-10 w-10 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Ready to Scan Documents
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Scan physical documents with your webcam or phone camera, apply CamScanner Magic Clean paper bleaching, crop perspective, and export to PDF.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => startCamera()}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold px-6 shadow-lg shadow-teal-900/20"
            >
              <Camera className="w-5 h-5 mr-2" />
              Launch Live Camera
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              className="px-6"
            >
              <Upload className="w-5 h-5 mr-2 text-violet-400" />
              Upload Image Files
            </Button>
          </div>
        </div>
      ) : (
        pages.length > 0 && (
          <div className="cm-scanner-layout grid grid-cols-1 lg:grid-cols-[minmax(0,1.9fr)_minmax(330px,1fr)] gap-6">
            {/* Center Canvas / Document Preview Stage */}
            <div className="cm-preview-panel rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl dark:border-violet-400/15 dark:bg-[#0f1224] flex flex-col justify-between">
              {/* Preview Header / Top Tool Strip */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Page {activePageIndex + 1} of {pages.length}
                  </span>
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
                    {activePage?.filter.toUpperCase()}
                  </span>
                  {activePage?.isCropped && (
                    <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold text-violet-400 border border-violet-500/20">
                      CROPPED
                    </span>
                  )}
                </div>

                {/* Mode Switcher Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl">
                  <button
                    onClick={() => setEditorMode('adjust')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      editorMode === 'adjust'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Adjust
                  </button>
                  <button
                    onClick={() => setEditorMode('crop')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      editorMode === 'crop'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Crop & Quad
                  </button>
                  <button
                    onClick={() => setEditorMode('straighten')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      editorMode === 'straighten'
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    Straighten
                  </button>
                </div>

                {/* Rotate & Delete Quick Controls */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRotate(-90)}
                    title="Rotate -90°"
                    className="h-8 w-8 text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRotate(90)}
                    title="Rotate +90°"
                    className="h-8 w-8 text-slate-400 hover:text-white"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteCurrent}
                    title="Delete Page"
                    className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Main Document Display Canvas Area */}
              <div
                ref={cropCanvasRef}
                onMouseMove={editorMode === 'crop' ? handleCornerDrag : undefined}
                onMouseUp={() => setActiveCornerIdx(null)}
                className="cm-preview-stage my-4 flex-1 flex items-center justify-center bg-slate-100 dark:bg-[#070914] rounded-xl p-4 min-h-[440px] relative overflow-hidden select-none"
              >
                {activePage && (
                  <>
                    {/* Normal / Enhanced Preview with Before/After Split Mode */}
                    {showBeforeAfter ? (
                      <div className="relative max-h-[500px] max-w-full overflow-hidden rounded shadow-2xl border border-slate-200 dark:border-slate-800">
                        {/* Enhanced (Right) */}
                        <img
                          src={activePage.enhancedDataUrl}
                          alt="Enhanced"
                          className="max-h-[500px] max-w-full object-contain pointer-events-none"
                        />
                        {/* Original (Left clipped) */}
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: `${splitRatio * 100}%` }}
                        >
                          <img
                            src={activePage.originalDataUrl}
                            alt="Original"
                            className="max-h-[500px] max-w-none object-contain pointer-events-none"
                            style={{
                              width: cropCanvasRef.current?.querySelector('img')?.clientWidth,
                              height: cropCanvasRef.current?.querySelector('img')?.clientHeight,
                            }}
                          />
                        </div>
                        {/* Split Divider bar */}
                        <div
                          className="cm-split-slider"
                          style={{ left: `${splitRatio * 100}%` }}
                          onMouseDown={(e) => {
                            const onMove = (ev: MouseEvent) => {
                              const rect = cropCanvasRef.current?.getBoundingClientRect();
                              if (rect) {
                                const r = Math.max(0.05, Math.min(0.95, (ev.clientX - rect.left) / rect.width));
                                setSplitRatio(r);
                              }
                            };
                            const onUp = () => {
                              window.removeEventListener('mousemove', onMove);
                              window.removeEventListener('mouseup', onUp);
                            };
                            window.addEventListener('mousemove', onMove);
                            window.addEventListener('mouseup', onUp);
                          }}
                        >
                          <div className="cm-split-handle">
                            <SplitSquareVertical className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative max-h-[500px] max-w-full flex items-center justify-center">
                        <img
                          src={activePage.enhancedDataUrl}
                          alt="Scanned page"
                          className="max-h-[500px] max-w-full object-contain rounded shadow-2xl border border-slate-200 dark:border-slate-800/80"
                        />

                        {/* Straighten Angle Grid Overlay */}
                        {editorMode === 'straighten' && (
                          <div className="absolute inset-0 pointer-events-none grid grid-cols-6 grid-rows-6 border border-cyan-400/40 rounded">
                            {Array.from({ length: 36 }).map((_, i) => (
                              <div key={i} className="border-r border-b border-cyan-400/20" />
                            ))}
                          </div>
                        )}

                        {/* Interactive Corner Pin Handles for Quadrilateral Crop */}
                        {editorMode === 'crop' && (
                          <>
                            {activePage.corners.map((corner, idx) => (
                              <div
                                key={idx}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setActiveCornerIdx(idx);
                                }}
                                className="cm-corner-handle"
                                style={{
                                  left: `${corner.x * 100}%`,
                                  top: `${corner.y * 100}%`,
                                }}
                                title={`Corner ${idx + 1}: Drag to document corner`}
                              />
                            ))}

                            {/* Crop Polygon outline */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                              <polygon
                                points={activePage.corners.map((c) => `${c.x * 100}%,${c.y * 100}%`).join(' ')}
                                fill="rgba(6, 182, 212, 0.12)"
                                stroke="#06b6d4"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                              />
                            </svg>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Crop Mode Bottom Confirm Strip */}
              {editorMode === 'crop' && (
                <div className="flex items-center justify-between p-2.5 mb-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs">
                  <span className="text-cyan-300 font-medium">
                    Drag the 4 corner handles to align with the document edges.
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleResetCrop}>
                      Reset
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApplyCrop}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Apply Crop
                    </Button>
                  </div>
                </div>
              )}

              {/* Page Filmstrip Thumbnail Navigator */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {pages.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`relative h-16 w-12 rounded-lg border overflow-hidden shrink-0 transition-all ${
                        idx === activePageIndex
                          ? 'border-cyan-400 ring-2 ring-cyan-500/40 scale-105'
                          : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={p.enhancedDataUrl} alt={`p${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] font-bold text-white text-center py-0.5">
                        {idx + 1}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={() => startCamera()}
                    className="h-16 w-12 rounded-lg border border-dashed border-slate-300 dark:border-violet-400/30 hover:border-cyan-400 flex flex-col items-center justify-center text-slate-400 hover:text-cyan-300 shrink-0 text-xs gap-1 transition-colors"
                    title="Add another scanned page"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[9px]">Add</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMovePage(-1)}
                    disabled={activePageIndex === 0}
                    title="Move Page Left"
                    className="h-8 px-2 text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMovePage(1)}
                    disabled={activePageIndex === pages.length - 1}
                    title="Move Page Right"
                    className="h-8 px-2 text-xs"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Controls Panel: Presets, Sliders, Straighten, Page Settings */}
            <div className="cm-controls-panel rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl dark:border-violet-400/15 dark:bg-[#0f1224] space-y-5">
              {/* Scan Filter Presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Document Filters
                  </span>
                  <button
                    onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                    className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-colors ${
                      showBeforeAfter
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                        : 'border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <SplitSquareVertical className="w-3 h-3" />
                    Compare
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'magic-clean', label: '✨ Magic Clean', desc: 'CamScanner bleach' },
                    { id: 'bw', label: 'B&W Contrast', desc: 'Clean sharp text' },
                    { id: 'grayscale', label: 'Grayscale', desc: 'Smooth gray' },
                    { id: 'color-boost', label: 'Color Boost', desc: 'Vibrant stamps' },
                    { id: 'none', label: 'Original', desc: 'No filter' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSetFilter(f.id as any)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        activePage?.filter === f.id
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="text-xs font-bold">{f.label}</div>
                      <div className="text-[10px] text-slate-400">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Straighten Angle Slider */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-violet-400" /> Straighten Angle
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {activePage?.straightenAngle || 0}°
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="0.5"
                  value={activePage?.straightenAngle || 0}
                  onChange={(e) => {
                    const angle = parseFloat(e.target.value);
                    updateActivePage((p) => ({ ...p, straightenAngle: angle }));
                  }}
                  className="w-full accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>-30° (Left)</span>
                  <button
                    onClick={() => updateActivePage((p) => ({ ...p, straightenAngle: 0 }))}
                    className="hover:text-cyan-400 underline"
                  >
                    Reset (0°)
                  </button>
                  <span>+30° (Right)</span>
                </div>
              </div>

              {/* Sliders: Brightness & Contrast */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Precision Adjustments
                </span>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Sun className="w-3 h-3" /> Brightness
                    </span>
                    <span className="font-mono text-slate-300">{activePage?.brightness || 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    value={activePage?.brightness || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      updateActivePage((p) => ({ ...p, brightness: val }));
                    }}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Contrast className="w-3 h-3" /> Contrast
                    </span>
                    <span className="font-mono text-slate-300">{activePage?.contrast || 0}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="80"
                    value={activePage?.contrast || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      updateActivePage((p) => ({ ...p, contrast: val }));
                    }}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>

              {/* Output Paper Format */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Target Page Size
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['a4', 'letter', 'fit'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setPageSize(size)}
                      className={`py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        pageSize === size
                          ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCompileToPdf}
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold shadow-md shadow-emerald-950/20"
                >
                  <FileCheck className="w-4 h-4 mr-2" />
                  Compile Scanned PDF ({pages.length}p)
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleOpenInStudioWorkspace}
                  className="w-full border-violet-500/30 text-violet-300 hover:bg-violet-950/30"
                >
                  <Layers className="w-4 h-4 mr-2 text-violet-400" />
                  Edit in Studio Workspace
                </Button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
