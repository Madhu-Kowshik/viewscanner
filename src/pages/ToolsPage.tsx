import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  FilePlus2,
  Split,
  Scissors,
  RotateCw,
  Trash2,
  Copy,
  Eye,
  ArrowRight,
  ShieldCheck,
  Edit3,
  PenTool,
  Camera,
  ScanText,
  Minimize2,
  Stamp,
  ArrowLeftRight,
  Activity,
  GitCompare,
  Layers,
  Sparkles,
  Plus,
  ArrowDownUp,
  Eraser,
  FileImage,
  Lock,
  Search,
  Type,
  FormInput,
  Wrench,
  Workflow,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ToolsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toolCategories = [
    {
      id: 'organize',
      title: 'Organize & Structure',
      description: 'Arrange, combine, split, and manipulate PDF pages',
      tools: [
        {
          id: 'organize-tool',
          name: 'Organize Pages',
          desc: 'Drag & drop reordering, rotate, duplicate, and delete pages visually.',
          icon: LayoutGrid,
          path: '/organize',
          badge: 'Popular',
        },
        {
          id: 'merge-tool',
          name: 'Merge PDF',
          desc: 'Combine multiple PDF files into one clean document in exact sequence.',
          icon: FilePlus2,
          path: '/merge',
          badge: 'Essential',
        },
        {
          id: 'split-tool',
          name: 'Split PDF',
          desc: 'Split a PDF into single individual pages or custom defined page ranges.',
          icon: Split,
          path: '/split',
        },
        {
          id: 'extract-tool',
          name: 'Extract Pages',
          desc: 'Select specific pages to extract and download as a new standalone PDF.',
          icon: Scissors,
          path: '/extract',
        },
        {
          id: 'insert-blank',
          name: 'Insert Blank Page',
          desc: 'Insert crisp blank A4 pages anywhere inside an existing PDF document.',
          icon: Plus,
          path: '/organize',
        },
        {
          id: 'reverse-order',
          name: 'Reverse Page Order',
          desc: 'Instantly flip the order of all pages in your document backwards.',
          icon: ArrowDownUp,
          path: '/organize',
        },
        {
          id: 'remove-blank',
          name: 'Remove Blank Pages',
          desc: 'Automatically detect and delete empty or accidental blank pages.',
          icon: Eraser,
          path: '/organize',
        },
        {
          id: 'viewer-tool',
          name: 'PDF Viewer',
          desc: 'High-fidelity canvas reader with zoom controls and page thumbnails.',
          icon: Eye,
          path: '/viewer',
        },
      ],
    },
    {
      id: 'edit-sign',
      title: 'Edit, Annotate & Sign',
      description: 'Annotate, blackout sensitive details, and sign contracts',
      tools: [
        {
          id: 'editor-tool',
          name: 'PDF Editor & Annotator',
          desc: 'Add text boxes, highlight text, draw freehand, and overlay shapes.',
          icon: Edit3,
          path: '/editor',
          badge: 'New',
        },
        {
          id: 'scanned-editor-tool',
          name: 'Edit Text Inside Scanned PDF',
          desc: 'Neural OCR word detection, click-to-edit scanned documents, and hybrid background tone reconstruction.',
          icon: Type,
          path: '/scanned-editor',
          badge: 'Breakthrough',
        },
        {
          id: 'image-editor-tool',
          name: 'Image Studio & Text Replacement',
          desc: 'CamScanner bleach, B&W filters, crop/rotate, and neural OCR text replacement inside images.',
          icon: Sparkles,
          path: '/image-editor',
          badge: 'Studio',
        },
        {
          id: 'forms-tool',
          name: 'Fill & Build AcroForms',
          desc: 'Detect and fill interactive form fields, add fillable text inputs/checkboxes, and flatten.',
          icon: FormInput,
          path: '/forms',
          badge: 'Interactive',
        },
        {
          id: 'redact-tool',
          name: 'Permanent Redaction',
          desc: 'Burn permanent blackouts into document pixels so text cannot be copied.',
          icon: Lock,
          path: '/editor',
          badge: 'Security',
        },
        {
          id: 'sign-tool',
          name: 'Sign PDF Document',
          desc: 'Draw, type, or upload your signature and stamp it anywhere on the page.',
          icon: PenTool,
          path: '/sign',
          badge: 'Essential',
        },
        {
          id: 'watermark-tool',
          name: 'Watermarks & Stamp Removal',
          desc: 'Add custom stamps, Bates numbers, or remove watermarks with color-selective suppression.',
          icon: Stamp,
          path: '/watermark',
          badge: 'Add & Erase',
        },
      ],
    },
    {
      id: 'scan-ocr',
      title: 'Scan, Cleanup & OCR',
      description: 'Digitize physical paperwork and recognize optical text',
      tools: [
        {
          id: 'scanner-tool',
          name: 'Document Scanner & Camera',
          desc: 'Capture pages with webcam, bleach paper background, and apply high-contrast B&W.',
          icon: Camera,
          path: '/scanner',
          badge: 'Smart Clean',
        },
        {
          id: 'ocr-tool',
          name: 'Neural OCR Text Recognition',
          desc: 'Extract editable text from scanned PDFs and photos in 6+ languages.',
          icon: ScanText,
          path: '/ocr',
          badge: 'Tesseract',
        },
      ],
    },
    {
      id: 'convert-compress',
      title: 'Convert & Compress',
      description: 'Format transformation and intelligent size reduction',
      tools: [
        {
          id: 'compress-tool',
          name: 'Compress PDF',
          desc: 'Reduce file size up to 85% with balanced, extreme, and custom quality controls.',
          icon: Minimize2,
          path: '/compress',
          badge: 'Popular',
        },
        {
          id: 'pdf-to-img',
          name: 'PDF to JPG / PNG',
          desc: 'Render high-resolution PNG or JPEG images from every page of your PDF.',
          icon: FileImage,
          path: '/convert',
        },
        {
          id: 'img-to-pdf',
          name: 'Images to PDF',
          desc: 'Compile multiple photos or graphics into a unified A4 or Letter PDF.',
          icon: ArrowLeftRight,
          path: '/convert',
        },
      ],
    },
    {
      id: 'security-audit',
      title: 'Security, Audit & Batch',
      description: 'Privacy sanitization, health audit, and multi-file processing',
      tools: [
        {
          id: 'protect-tool',
          name: 'Metadata Sanitizer & Privacy',
          desc: 'Scrub author identities, operating system tags, and timestamps for safe distribution.',
          icon: ShieldCheck,
          path: '/protect',
          badge: 'Privacy',
        },
        {
          id: 'health-tool',
          name: 'Document Health Audit',
          desc: 'Deep audit for structure compliance, bloated objects, blank pages, and searchability.',
          icon: Activity,
          path: '/diagnostics',
          badge: 'Inspector',
        },
        {
          id: 'compare-tool',
          name: 'Side-by-Side Compare',
          desc: 'Compare two PDF revisions side-by-side with synchronized page stepping.',
          icon: GitCompare,
          path: '/compare',
        },
        {
          id: 'batch-tool',
          name: 'Multi-File Batch Processor',
          desc: 'Compress, sanitize, or watermark dozens of PDF documents simultaneously.',
          icon: Layers,
          path: '/batch',
          badge: 'Power Tool',
        },
        {
          id: 'repair-tool',
          name: 'Repair Corrupt PDF',
          desc: 'Rebuild broken cross-reference tables, fix dangling pointer dictionaries, and restore unreadable streams.',
          icon: Wrench,
          path: '/repair',
          badge: 'Recovery',
        },
      ],
    },
    {
      id: 'workflows',
      title: 'Automated Document Workflows',
      description: 'Multi-step guided pipelines that automate end-to-end document routines',
      tools: [
        {
          id: 'workflows-tool',
          name: 'Guided Document Workflows',
          desc: 'Chain complex tasks: Scan & OCR & Edit, Sign & Secure Contract, or Audit & Optimize & Archive.',
          icon: Workflow,
          path: '/workflows',
          badge: 'Automation',
        },
      ],
    },
  ];

  const filteredCategories = toolCategories.map((cat) => {
    let tools = cat.tools;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tools = tools.filter(
        (t) => t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)
      );
    }
    return { ...cat, tools };
  }).filter((cat) => {
    if (selectedCategory !== 'all' && cat.id !== selectedCategory) return false;
    return cat.tools.length > 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Comprehensive PDF Tool Suite
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Professional browser-based workspace for viewing, editing, scanning, converting, and securing documents.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold self-start sm:self-auto">
          <ShieldCheck className="h-4 w-4" />
          <span>100% Client-Side Privacy</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {toolCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === c.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all 50+ tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Categorized Tool Cards Grid */}
      <div className="mt-8 space-y-12">
        {filteredCategories.map((category) => (
          <section key={category.id}>
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {category.title}
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {category.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.id}
                    onClick={() => navigate(tool.path)}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-brand-500/50 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900 cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-brand-500">
                          <Icon className="h-5 w-5" />
                        </div>
                        {tool.badge && (
                          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                            {tool.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {tool.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400">
                      <span>Launch Tool</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
