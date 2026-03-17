import React, { useState, useEffect } from 'react';
import { ThemeConfig } from '../utils/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (fileName: string) => void;
  theme: ThemeConfig;
  setTheme: (themeUpdates: Partial<ThemeConfig>) => void;
  documentTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen, onClose, onExport, theme, setTheme, documentTitle
}) => {
  const [fileName, setFileName] = useState(documentTitle || 'Untitled Guide');

  useEffect(() => {
    if (isOpen) setFileName(documentTitle || 'Untitled Guide');
  }, [isOpen, documentTitle]);

  if (!isOpen) return null;

  // Helper to toggle specific features
  const toggleFeature = (feature: keyof ThemeConfig['features']) => {
    setTheme({
      features: {
        ...theme.features,
        [feature]: !theme.features[feature]
      }
    });
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
          <h2 className="text-lg font-semibold text-slate-900">Publish to HTML</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* Body / Configuration */}
        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-500 mb-1 block" htmlFor="export-filename">File Name</label>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <input
                id="export-filename"
                type="text"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                className="flex-1 px-3 py-2 text-sm text-slate-900 font-medium outline-none bg-white"
                spellCheck={false}
              />
              <span className="px-3 py-2 text-sm text-slate-400 bg-slate-50 border-l border-slate-300 select-none">.html</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">Interactive Features</h3>
            
            {/* Toggle 1: Sticky Header */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Sticky App Header</p>
                <p className="text-xs text-slate-500">Pins the document title to the top while scrolling.</p>
              </div>
              <input 
                type="checkbox" 
                checked={theme.features.stickyHeader}
                onChange={() => toggleFeature('stickyHeader')}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            {/* Toggle 2: Dark Mode Support */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Dark Mode Support</p>
                <p className="text-xs text-slate-500">Adapts your CSS colors dynamically to system preferences.</p>
              </div>
              <input 
                type="checkbox" 
                checked={theme.features.darkModeSupport}
                onChange={() => toggleFeature('darkModeSupport')}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            {/* Toggle 3: Scroll Reveal */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Scroll Animations</p>
                <p className="text-xs text-slate-500">Elements gently fade in as the user scrolls down.</p>
              </div>
              <input
                type="checkbox"
                checked={theme.features.scrollReveal}
                onChange={() => toggleFeature('scrollReveal')}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            {/* Toggle 4: Reading Progress Bar */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Reading Progress Bar</p>
                <p className="text-xs text-slate-500">Thin bar at the top showing scroll progress.</p>
              </div>
              <input
                type="checkbox"
                checked={theme.features.readingProgressBar ?? false}
                onChange={() => toggleFeature('readingProgressBar')}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            {/* Toggle 5: Back-to-Top Button */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Back-to-Top Button</p>
                <p className="text-xs text-slate-500">Floating button that appears after scrolling 400px.</p>
              </div>
              <input
                type="checkbox"
                checked={theme.features.backToTop ?? false}
                onChange={() => toggleFeature('backToTop')}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            {/* Toggle 6: Print Stylesheet */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Print Stylesheet</p>
                <p className="text-xs text-slate-500">Clean print layout hiding nav and UI elements.</p>
              </div>
              <input
                type="checkbox"
                checked={theme.features.printStylesheet ?? true}
                onChange={() => toggleFeature('printStylesheet')}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>

            {/* Toggle 7: Share Buttons */}
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Share Buttons</p>
                <p className="text-xs text-slate-500">Floating "Copy Link" and "Print" buttons on the exported page.</p>
              </div>
              <input
                type="checkbox"
                checked={theme.features.shareButtons ?? false}
                onChange={() => toggleFeature('shareButtons')}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </label>
          </div>
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
            onClick={() => {
              onExport(fileName.trim() || 'Untitled Guide');
              onClose();
            }}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            Download .html
          </button>
        </div>

      </div>
    </div>
  );
};
