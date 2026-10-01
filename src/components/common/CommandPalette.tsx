import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Zap,
  LayoutGrid,
  Eye,
  FilePlus2,
  Split,
  Scissors,
  Edit3,
  PenTool,
  Camera,
  ScanText,
  ArrowLeftRight,
  Minimize2,
  Stamp,
  ShieldCheck,
  Activity,
  GitCompare,
  Layers,
  X,
  ArrowRight,
  Type,
  FormInput,
  Wrench,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { usePdf } from '../../context/PdfContext';

interface ToolIntent {
  id: string;
  title: string;
  category: string;
  description: string;
  path: string;
  icon: any;
  keywords: string[];
}

export const ALL_TOOLS: ToolIntent[] = [
  {
    id: 'organize',
    title: 'Organize Pages',
    category: 'Organize',
    description: 'Reorder, rotate, duplicate, reverse, or delete pages',
    path: '/organize',
    icon: LayoutGrid,
    keywords: ['reorder', 'rotate', 'duplicate', 'delete', 'reverse', 'sort', 'arrange', 'blank page'],
  },
  {
    id: 'viewer',
    title: 'PDF Viewer',
    category: 'View',
    description: 'High-resolution reader with page navigation and zoom',
    path: '/viewer',
    icon: Eye,
    keywords: ['read', 'view', 'open', 'inspect', 'see', 'preview'],
  },
  {
    id: 'editor',
    title: 'Edit & Annotate PDF',
    category: 'Edit',
    description: 'Add text, draw, highlight, whiteout, and permanent redaction',
    path: '/editor',
    icon: Edit3,
    keywords: ['edit', 'annotate', 'text', 'draw', 'highlight', 'redact', 'blackout', 'whiteout', 'shapes', 'arrow'],
  },
  {
    id: 'sign',
    title: 'Sign Document',
    category: 'Sign',
    description: 'Draw, type, or upload digital signature and stamp anywhere',
    path: '/sign',
    icon: PenTool,
    keywords: ['sign', 'signature', 'initials', 'stamp', 'sign document', 'autograph'],
  },
  {
    id: 'scanner',
    title: 'Document Scanner & Camera',
    category: 'Scan',
    description: 'Capture photos with webcam, magic clean paper bleach, B&W filter',
    path: '/scanner',
    icon: Camera,
    keywords: ['scan', 'camera', 'photo', 'webcam', 'paper', 'receipt', 'bleach', 'cleanup', 'contrast'],
  },
  {
    id: 'ocr',
    title: 'OCR & Text Recognition',
    category: 'OCR',
    description: 'Extract text from scanned documents using neural OCR',
    path: '/ocr',
    icon: ScanText,
    keywords: ['ocr', 'text', 'recognition', 'searchable', 'scanned', 'extract text', 'copy words'],
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    category: 'Compress',
    description: 'Shrink file size up to 85% with balanced or extreme presets',
    path: '/compress',
    icon: Minimize2,
    keywords: ['compress', 'shrink', 'smaller', 'reduce size', 'optimize', 'email limit', 'mb to kb'],
  },
  {
    id: 'watermark',
    title: 'Watermark & Page Numbers',
    category: 'Watermark',
    description: 'Text stamps, logo watermarks, page numbers, and Bates numbering',
    path: '/watermark',
    icon: Stamp,
    keywords: ['watermark', 'stamp', 'bates', 'page number', 'header', 'footer', 'confidential', 'draft'],
  },
  {
    id: 'convert',
    title: 'Format Converters',
    category: 'Convert',
    description: 'Convert PDF to JPG/PNG, Images to PDF, and Text to PDF',
    path: '/convert',
    icon: ArrowLeftRight,
    keywords: ['convert', 'jpg', 'png', 'images to pdf', 'pdf to image', 'text to pdf'],
  },
  {
    id: 'merge',
    title: 'Merge PDF',
    category: 'Organize',
    description: 'Combine multiple PDF documents into a unified file',
    path: '/merge',
    icon: FilePlus2,
    keywords: ['merge', 'combine', 'join', 'stitch', 'unite', 'multiple pdf'],
  },
  {
    id: 'split',
    title: 'Split PDF',
    category: 'Organize',
    description: 'Divide a PDF into individual pages or custom page ranges',
    path: '/split',
    icon: Split,
    keywords: ['split', 'divide', 'break', 'separate', 'ranges'],
  },
  {
    id: 'extract',
    title: 'Extract Pages',
    category: 'Organize',
    description: 'Pick specific pages and save them into a new document',
    path: '/extract',
    icon: Scissors,
    keywords: ['extract', 'select pages', 'pull pages', 'save pages'],
  },
  {
    id: 'protect',
    title: 'Privacy & Metadata Sanitizer',
    category: 'Protect',
    description: 'Scrub author identities, operating system tags, and timestamps',
    path: '/protect',
    icon: ShieldCheck,
    keywords: ['protect', 'privacy', 'sanitize', 'metadata', 'scrub', 'author', 'remove info'],
  },
  {
    id: 'diagnostics',
    title: 'Document Health Audit',
    category: 'Analyze',
    description: 'Analyze PDF structure, blank pages, and optimization metrics',
    path: '/diagnostics',
    icon: Activity,
    keywords: ['health', 'audit', 'check', 'diagnostic', 'analyze', 'inspect', 'quality score'],
  },
  {
    id: 'compare',
    title: 'Side-by-Side Compare',
    category: 'Analyze',
    description: 'Compare two PDFs side by side with synchronized page navigation',
    path: '/compare',
    icon: GitCompare,
    keywords: ['compare', 'diff', 'side by side', 'revisions', 'versions'],
  },
  {
    id: 'batch',
    title: 'Batch Document Processing',
    category: 'Batch',
    description: 'Compress, sanitize, or watermark dozens of files simultaneously',
    path: '/batch',
    icon: Layers,
    keywords: ['batch', 'bulk', 'multi file', 'queue', 'all files', 'simultaneous'],
  },
  {
    id: 'scanned-editor',
    title: 'Edit Text Inside Scanned PDF',
    category: 'Edit',
    description: 'OCR detection, click-to-edit scanned words, and background patch reconstruction',
    path: '/scanned-editor',
    icon: Type,
    keywords: ['scanned', 'edit scanned', 'ocr edit', 'replace text', 'scanned pdf', 'paper edit', 'typo'],
  },
  {
    id: 'image-editor',
    title: 'Image Studio & Text Editor',
    category: 'Studio',
    description: 'CamScanner-grade image filters, crop/rotate, and detect & replace text in images',
    path: '/image-editor',
    icon: Sparkles,
    keywords: ['image', 'photo', 'jpeg', 'jpg', 'png', 'crop', 'filter', 'bleach', 'edit image text', 'replace text in picture'],
  },
  {
    id: 'forms',
    title: 'Fill & Create PDF Forms',
    category: 'Forms',
    description: 'Detect and fill AcroForm fields, add new text fields, checkboxes, and flatten',
    path: '/forms',
    icon: FormInput,
    keywords: ['form', 'fill form', 'acroform', 'checkbox', 'text field', 'form builder', 'flatten form'],
  },
  {
    id: 'repair',
    title: 'Repair Corrupt PDF',
    category: 'Repair',
    description: 'Diagnose and repair broken cross-reference tables and recover readable streams',
    path: '/repair',
    icon: Wrench,
    keywords: ['repair', 'fix', 'corrupt', 'broken', 'damaged', 'cannot open', 'recover'],
  },
  {
    id: 'workflows',
    title: 'Guided Document Workflows',
    category: 'Workflows',
    description: 'Multi-step automation: Scan & OCR & Edit, Sign & Secure, Audit & Archive',
    path: '/workflows',
    icon: Workflow,
    keywords: ['workflow', 'automation', 'pipeline', 'multi step', 'batch wizard', 'routine'],
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const filteredTools = ALL_TOOLS.filter((tool) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const titleMatch = tool.title.toLowerCase().includes(q);
    const descMatch = tool.description.toLowerCase().includes(q);
    const catMatch = tool.category.toLowerCase().includes(q);
    const kwMatch = tool.keywords.some((k) => k.toLowerCase().includes(q));
    return titleMatch || descMatch || catMatch || kwMatch;
  });

  const handleSelectTool = (tool: ToolIntent) => {
    navigate(tool.path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredTools.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % filteredTools.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[selectedIndex]) {
        handleSelectTool(filteredTools[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or what you want to do (e.g. 'make smaller', 'sign', 'ocr', 'redact')..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching tools found for "{query}".
            </div>
          ) : (
            filteredTools.map((tool, idx) => {
              const Icon = tool.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={tool.id}
                  onClick={() => handleSelectTool(tool)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-50 text-brand-900 dark:bg-brand-950/70 dark:text-brand-100'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{tool.title}</span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {tool.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>OmniPDF Smart Omnibar</span>
        </div>
      </div>
    </div>
  );
};
