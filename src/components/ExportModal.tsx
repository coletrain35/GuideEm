import React, { useState, useEffect } from 'react';
import { ThemeConfig } from '../utils/storage';
import {
  FileDown, Loader2, X,
  FileCode2, FileText, FileType2,
  Pin, Moon, Sparkles, BarChart2, ArrowUp, Printer, Share2,
  Info, Layout
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (fileName: string) => void;
  onExportMarkdown?: (fileName: string) => void;
  onExportPDF?: (fileName: string) => Promise<void>;
  theme: ThemeConfig;
  setTheme: (themeUpdates: Partial<ThemeConfig>) => void;
  documentTitle: string;
  isRiseMode: boolean;
  onRiseModeChange: (enabled: boolean) => void;
}

type ExportFormat = 'html' | 'md' | 'pdf';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen, onClose, onExport, onExportMarkdown, onExportPDF, theme, setTheme, documentTitle, isRiseMode, onRiseModeChange
}) => {
  const [fileName, setFileName] = useState(documentTitle || 'Untitled Guide');
  const [isPDFExporting, setIsPDFExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('html');

  useEffect(() => {
    if (isOpen) {
      setFileName(documentTitle || 'Untitled Guide');
      setSelectedFormat('html');
    }
  }, [isOpen, documentTitle]);

  if (!isOpen) return null;

  const toggleFeature = (feature: keyof ThemeConfig['features']) => {
    setTheme({
      features: {
        ...theme.features,
        [feature]: !theme.features[feature]
      }
    });
  };

  const formatCards: { id: ExportFormat; icon: React.ReactNode; ext: string; subtitle: string }[] = [
    { id: 'html', icon: <FileCode2 size={20} />, ext: '.html', subtitle: 'Interactive' },
    { id: 'md',   icon: <FileText size={20} />,  ext: '.md',   subtitle: 'Plain text' },
    { id: 'pdf',  icon: <FileType2 size={20} />, ext: '.pdf',  subtitle: 'Print-ready' },
  ];

  const features: {
    key: keyof ThemeConfig['features'];
    icon: React.ReactNode;
    label: string;
    description: string;
    default: boolean;
  }[] = [
    { key: 'stickyHeader',      icon: <Pin size={14} />,      label: 'Sticky Header',      description: 'Pins the title to the top while scrolling',    default: true  },
    { key: 'darkModeSupport',   icon: <Moon size={14} />,     label: 'Dark Mode',           description: 'Adapts colors to system preferences',           default: false },
    { key: 'scrollReveal',      icon: <Sparkles size={14} />, label: 'Scroll Animations',   description: 'Elements fade in as the user scrolls',          default: false },
    { key: 'readingProgressBar',icon: <BarChart2 size={14} />,label: 'Reading Progress',    description: 'Thin bar showing scroll position',              default: false },
    { key: 'backToTop',         icon: <ArrowUp size={14} />,  label: 'Back to Top',         description: 'Floating button after scrolling 400px',         default: false },
    { key: 'printStylesheet',   icon: <Printer size={14} />,  label: 'Print Stylesheet',    description: 'Clean layout when printing',                    default: true  },
    { key: 'shareButtons',      icon: <Share2 size={14} />,   label: 'Share Buttons',       description: 'Copy Link and Print buttons on export',         default: false },
  ];

  const formatNotes: Record<Exclude<ExportFormat, 'html'>, string> = {
    md:  'Markdown export preserves text structure and basic formatting. Interactive features like scroll animations and dark mode are not included.',
    pdf: 'PDF export renders a print-ready snapshot using your browser\'s print dialog. Interactive features are not included in PDF output.',
  };

  const downloadLabel = isPDFExporting
    ? 'Exporting…'
    : selectedFormat === 'html'
      ? 'Download .html'
      : selectedFormat === 'md'
        ? 'Download .md'
        : 'Download .pdf';

  const handleDownload = async () => {
    const name = fileName.trim() || 'Untitled Guide';
    if (selectedFormat === 'html') {
      onExport(name);
      onClose();
    } else if (selectedFormat === 'md') {
      onExportMarkdown?.(name);
      onClose();
    } else if (selectedFormat === 'pdf') {
      setIsPDFExporting(true);
      try {
        await onExportPDF?.(name);
      } finally {
        setIsPDFExporting(false);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-900">Export Document</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Format Selector */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Format</p>
            <div className="grid grid-cols-3 gap-2">
              {formatCards.map(({ id, icon, ext, subtitle }) => (
                <button
                  key={id}
                  onClick={() => setSelectedFormat(id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 text-center ${
                    selectedFormat === id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {icon}
                  <span className="text-xs font-semibold">{ext}</span>
                  <span className="text-[10px] leading-tight opacity-75">{subtitle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Name Input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block" htmlFor="export-filename">
              File Name
            </label>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
              <input
                id="export-filename"
                type="text"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                className="flex-1 px-3 py-2 text-sm text-slate-900 font-medium outline-none bg-transparent"
                spellCheck={false}
              />
              <span className="pr-3 text-xs text-slate-400 font-mono select-none">
                {selectedFormat === 'html' ? '.html' : selectedFormat === 'md' ? '.md' : '.pdf'}
              </span>
            </div>
          </div>

          {/* Features section — conditional on format */}
          {selectedFormat === 'html' ? (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Interactive Features</p>
              <div className="space-y-0.5">
                {features.map(({ key, icon, label, description, default: def }) => (
                  <label
                    key={key}
                    className={`flex items-center justify-between gap-3 py-2 px-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group ${isRiseMode && ['readingProgressBar','backToTop','shareButtons'].includes(key) ? 'opacity-40 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-slate-400 flex-shrink-0 group-hover:text-slate-600 transition-colors">
                        {icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{label}</p>
                        <p className="text-xs text-slate-400 truncate">{description}</p>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={theme.features[key] ?? def}
                        onChange={() => toggleFeature(key)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-blue-500 transition-colors duration-200" />
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
                    </div>
                  </label>
                ))}
              </div>

              {/* Rise Compatible toggle */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Embed Mode</p>
                <label className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-slate-400 flex-shrink-0 group-hover:text-slate-600 transition-colors">
                      <Layout size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Rise Compatible</p>
                      <p className="text-xs text-slate-400 truncate">Optimize for Articulate Rise embedding</p>
                    </div>
                  </div>
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isRiseMode}
                      onChange={() => onRiseModeChange(!isRiseMode)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-indigo-500 transition-colors duration-200" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-start gap-3">
              <Info size={15} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                {formatNotes[selectedFormat as Exclude<ExportFormat, 'html'>]}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isPDFExporting}
            onClick={handleDownload}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPDFExporting ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
            {downloadLabel}
          </button>
        </div>

      </div>
    </div>
  );
};
