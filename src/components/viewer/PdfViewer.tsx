import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  FileText,
  PanelLeftClose,
  PanelLeft,
  MoveVertical,
  Search,
  X,
  Loader2,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';
import { renderPageToCanvas } from '../../lib/pdf/pdf-engine';
import { pdfjsLib } from '../../lib/pdf/pdfjs-init';
import { Button } from '../ui/Button';

export const PdfViewer: React.FC = () => {
  const { currentFile, pages } = usePdf();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.25);
  const [viewRotation, setViewRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedPages, setMatchedPages] = useState<number[]>([]);
  const [matchIdx, setMatchIdx] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalPages = currentFile?.pageCount || pages.length || 1;

  // Render active page onto canvas whenever currentPage, scale, viewRotation, retryCount or currentFile changes
  useEffect(() => {
    let active = true;
    const runRender = async () => {
      if (!currentFile || !canvasRef.current) return;
      setRendering(true);
      setPageError(null);

      try {
        await renderPageToCanvas(
          currentFile.data,
          currentPage,
          canvasRef.current,
          scale,
          viewRotation
        );
      } catch (err: unknown) {
        if (active) {
          setPageError(
            err instanceof Error ? err.message : 'Failed to render page.'
          );
        }
      } finally {
        if (active) {
          setRendering(false);
        }
      }
    };

    runRender();

    return () => {
      active = false;
    };
  }, [currentFile, currentPage, scale, viewRotation, retryCount]);

  // Handle Fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not supported or allowed
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleFitWidth = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - (showThumbnails ? 260 : 40);
    // Standard PDF page width around 595 points
    const calculatedScale = Math.max(0.6, (containerWidth - 60) / 600);
    setScale(parseFloat(calculatedScale.toFixed(2)));
  };

  const handleFitPage = () => {
    setScale(1.0);
  };

  const handleRotateView = () => {
    setViewRotation((prev) => (prev + 90) % 360);
  };

  const handleRunSearch = async () => {
    if (!currentFile || !searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const pdfDoc = await pdfjsLib.getDocument({ data: currentFile.data }).promise;
      const foundPages: number[] = [];
      const q = searchQuery.toLowerCase();

      for (let pNum = 1; pNum <= pdfDoc.numPages; pNum++) {
        const page = await pdfDoc.getPage(pNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .toLowerCase();
        if (pageText.includes(q)) {
          foundPages.push(pNum);
        }
      }

      setMatchedPages(foundPages);
      if (foundPages.length > 0) {
        setMatchIdx(0);
        setCurrentPage(foundPages[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNextMatch = () => {
    if (matchedPages.length === 0) return;
    const next = (matchIdx + 1) % matchedPages.length;
    setMatchIdx(next);
    setCurrentPage(matchedPages[next]);
  };

  const handlePrevMatch = () => {
    if (matchedPages.length === 0) return;
    const prev = (matchIdx - 1 + matchedPages.length) % matchedPages.length;
    setMatchIdx(prev);
    setCurrentPage(matchedPages[prev]);
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full w-full bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs sm:text-sm select-none">
        {/* Left: Thumbnail toggle & Page Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowThumbnails(!showThumbnails)}
            title={showThumbnails ? 'Hide thumbnails' : 'Show thumbnails'}
            className="h-8 w-8 text-slate-600 dark:text-slate-300"
          >
            {showThumbnails ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-medium">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }}
              className="w-11 text-center font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-0.5 px-1 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
            <span className="text-slate-400 dark:text-slate-500">/</span>
            <span>{totalPages}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Center / Right: Zoom & Layout Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            title="Zoom out"
            className="h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="w-12 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
            {Math.round(scale * 100)}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            title="Zoom in"
            className="h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleFitWidth}
            title="Fit Width"
            className="h-8 text-xs hidden sm:inline-flex"
          >
            <MoveVertical className="h-3.5 w-3.5 mr-1 rotate-90" />
            Fit Width
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleFitPage}
            title="Fit Page (100%)"
            className="h-8 text-xs hidden sm:inline-flex"
          >
            100%
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRotateView}
            title="Rotate View 90°"
            className="h-8 w-8"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <Button
            variant={searchOpen ? 'primary' : 'ghost'}
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
            title="Search in PDF"
            className="h-8 w-8"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="h-8 w-8"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* In-Document Search Bar */}
      {searchOpen && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Find in document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunSearch()}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunSearch}
              disabled={isSearching}
              className="h-7 text-xs px-2.5 shrink-0"
            >
              {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Find'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {matchedPages.length > 0 ? (
              <span className="text-[11px] font-mono text-brand-600 dark:text-brand-400 font-medium">
                Page {matchedPages[matchIdx]} ({matchIdx + 1} of {matchedPages.length} matches)
              </span>
            ) : (
              searchQuery && !isSearching && (
                <span className="text-[11px] text-slate-400">No matches</span>
              )
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMatch}
                disabled={matchedPages.length === 0}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextMatch}
                disabled={matchedPages.length === 0}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
                setMatchedPages([]);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Viewer Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Thumbnails strip */}
        {showThumbnails && (
          <div className="w-48 sm:w-56 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 overflow-y-auto p-3 flex flex-col gap-3 shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Pages ({totalPages})
            </span>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
              const matchingPage = pages.find((p) => p.displayNumber === pNum);
              const thumbUrl = matchingPage?.thumbnailUrl;

              return (
                <button
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                    currentPage === pNum
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/60 ring-2 ring-brand-500/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="w-full aspect-[1/1.3] bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center overflow-hidden mb-1.5 shadow-xs border border-slate-200/60 dark:border-slate-700/60">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={`Page ${pNum}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <FileText className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      currentPage === pNum
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Page {pNum}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Canvas Render Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8 bg-slate-200/70 dark:bg-slate-950/80">
          <div className="relative shadow-2xl rounded-sm transition-all duration-150">
            {rendering && (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 text-white text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                  Rendering page {currentPage}...
                </div>
              </div>
            )}

            {pageError ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/50">
                <p className="text-sm text-rose-600 font-semibold mb-2">
                  Rendering error
                </p>
                <p className="text-xs text-slate-500 mb-4">{pageError}</p>
                <Button size="sm" variant="outline" onClick={() => setRetryCount((c) => c + 1)}>
                  Retry Page
                </Button>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="max-w-none block bg-white shadow-xl rounded-sm"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
