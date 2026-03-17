import { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from './components/Editor';
import { ThemeDrawer } from './components/ThemeDrawer';
import { Sidebar } from './components/Sidebar';
import { ExportModal } from './components/ExportModal';
import { loadDocuments, saveDocument, deleteDocument, Document, ThemeConfig } from './utils/storage';
import { generateHTML } from './utils/exporter';
import { LandingPage } from './components/LandingPage';
import { FileDown, FileText, Trash2, Loader2, Keyboard, HelpCircle, X, CheckCircle, AlertTriangle, Info, Menu, Plus, Settings, Upload, Palette, ArrowLeft, Eye } from 'lucide-react';

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#2563eb', // Tailwind blue-600
  fontFamily: 'modern',
  hero: {
    style: 'none',
    enabled: false,
    coverImageBase64: null,
    subtitle: '',
    layout: 'full',
  },
  features: {
    stickyHeader: true,
    scrollReveal: false,
    darkModeSupport: false,
    readingProgressBar: false,
    backToTop: false,
    printStylesheet: true,
    shareButtons: false,
  },
  footer: {
    enabled: false,
    text: '',
    links: [],
    showBranding: true,
  },
  codeTheme: 'dark',
};

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'editor'>('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  
  // Always-current mirror of documents state for use in callbacks.
  // Callbacks captured by useCallback only see the snapshot of state at the
  // time they were created; the ref lets them read the latest value without
  // being re-created on every render.
  const documentsRef = useRef<Document[]>([]);
  useEffect(() => { documentsRef.current = documents; }, [documents]);

  // Tracks whether there is a save that has been queued but not yet persisted
  // to IndexedDB.  Used by the beforeunload guard.
  const hasPendingSaveRef = useRef(false);

  const currentDoc = documents.find(d => d.id === currentDocId);

  // Warn the user before closing/refreshing if there is a pending write.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingSaveRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const init = async () => {
      const docs = await loadDocuments();
      if (docs.length > 0) {
        setDocuments(docs);
        setCurrentDocId(docs[0].id);
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const createNewDocument = async () => {
    const newDoc: Document = {
      id: crypto.randomUUID(),
      title: 'Untitled Guide',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Start writing here...' }],
          }
        ],
      },
      htmlContent: '<p>Start writing here...</p>',
      lastEdited: Date.now(),
      theme: { ...DEFAULT_THEME }
    };

    setDocuments(prev => [newDoc, ...prev]);
    setCurrentDocId(newDoc.id);
    await saveDocument(newDoc);
  };

  const handleUpdate = useCallback((html: string, json: any, newTitle: string) => {
    if (!currentDocId) return;

    // Build the updated document from the ref so we always have the latest
    // field values (e.g. theme) without needing `documents` in the dep array.
    const existing = documentsRef.current.find(d => d.id === currentDocId);
    if (!existing) return;

    const updatedDoc: Document = {
      ...existing,
      content: json,
      htmlContent: html,
      title: newTitle,
      lastEdited: Date.now(),
    };

    // Update React state synchronously (pure — no side effects inside updater).
    setDocuments(prev => prev.map(d => d.id === currentDocId ? updatedDoc : d));

    // Persist asynchronously outside the state updater.
    hasPendingSaveRef.current = true;
    saveDocument(updatedDoc).then(() => {
      hasPendingSaveRef.current = false;
    });
  }, [currentDocId]);

  const handleThemeChange = useCallback((themeUpdates: Partial<ThemeConfig>) => {
    if (!currentDocId) return;

    const existing = documentsRef.current.find(d => d.id === currentDocId);
    if (!existing) return;

    const updatedDoc: Document = {
      ...existing,
      theme: { ...(existing.theme || DEFAULT_THEME), ...themeUpdates },
      lastEdited: Date.now(),
    };

    setDocuments(prev => prev.map(d => d.id === currentDocId ? updatedDoc : d));

    hasPendingSaveRef.current = true;
    saveDocument(updatedDoc).then(() => {
      hasPendingSaveRef.current = false;
    });
  }, [currentDocId]);

  const handleOpenPreview = () => {
    if (!currentDoc) return;
    setPreviewHtml(generateHTML(currentDoc.title, currentDoc.htmlContent, currentDoc.theme || DEFAULT_THEME));
    setIsPreviewOpen(true);
  };

  const handleExportDownload = (userFileName: string) => {
    if (!currentDoc) return;

    // 1. Compile the final HTML string using your engine
    const finalHtmlString = generateHTML(currentDoc.title, currentDoc.htmlContent, currentDoc.theme || DEFAULT_THEME);

    // 2. Create a "Blob" (Binary Large Object) of text/html
    const blob = new Blob([finalHtmlString], { type: 'text/html;charset=utf-8' });

    // 3. Create a temporary invisible hyperlink
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // 4. Set the downloaded file name, stripping characters invalid in filenames
    const safeFileName = userFileName.replace(/[/\\:*?"<>|]/g, '').trim() || 'Untitled Guide';
    link.download = `${safeFileName}.html`;

    // 5. Fake a click to trigger the browser download, then clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document? This cannot be undone.')) {
      await deleteDocument(id);
      
      const docs = await loadDocuments();
      setDocuments(docs);
      if (currentDocId === id) {
        setCurrentDocId(docs.length > 0 ? docs[0].id : null);
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleThemeChange({ logoBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleThemeChange({ hero: { ...currentDoc.theme?.hero, coverImageBase64: reader.result as string } as any });
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (currentView === 'landing') {
    return <LandingPage onStartWriting={() => setCurrentView('editor')} />;
  }

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-900 font-sans flex h-screen overflow-hidden transition-colors duration-300"
      style={(() => {
        const hex = (currentDoc?.theme?.primaryColor || DEFAULT_THEME.primaryColor).replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const toLinear = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
        const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
        return {
          '--brand-primary': `#${hex}`,
          '--brand-primary-rgb': `${r}, ${g}, ${b}`,
          '--brand-text-color': luminance > 0.179 ? '#111827' : '#f8fafc',
          fontFamily: currentDoc?.theme?.fontFamily === 'editorial' ? 'Merriweather, serif' :
                      currentDoc?.theme?.fontFamily === 'technical' ? '"Fira Code", monospace' :
                      'Inter, system-ui, sans-serif',
        } as React.CSSProperties;
      })()}
    >
      
      {/* Sidebar */}
      {showSidebar && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:relative md:z-auto">
            <Sidebar
              documents={documents}
              currentDocId={currentDocId}
              onSelectDoc={(id) => {
                setCurrentDocId(id);
                // Auto-close sidebar on mobile
                if (window.innerWidth < 768) setShowSidebar(false);
              }}
              onCreateDoc={createNewDocument}
              onDeleteDoc={handleDelete}
              onClose={() => setShowSidebar(false)}
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 flex-shrink-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Toggle Sidebar"
              >
                <Menu size={20} />
              </button>
              <div className="w-px h-6 bg-slate-200" />
              <button
                onClick={() => setCurrentView('landing')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Site</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {currentDoc && (
                <>
                  <button
                    onClick={() => setIsThemeDrawerOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Theme Settings"
                  >
                    <Palette size={18} />
                    <span className="hidden sm:inline">Theme</span>
                  </button>
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${showHelp ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                    title="Toggle Help & Shortcuts"
                  >
                    <HelpCircle size={18} />
                    <span className="hidden sm:inline">Help</span>
                  </button>
                  <button
                    onClick={handleOpenPreview}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Preview exported document"
                  >
                    <Eye size={18} />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1" />
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                  >
                    <FileDown size={18} />
                    <span className="hidden sm:inline">Export HTML</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto relative flex flex-col md:flex-row gap-6 px-2 py-4 sm:px-4 sm:py-8">
          {currentDoc ? (
            <>
              <div className={`transition-all duration-300 ease-in-out ${showHelp ? 'md:w-2/3 lg:w-3/4' : 'w-full'}`}>
                <Editor key={currentDoc.id} initialContent={currentDoc.content} initialHtmlContent={currentDoc.htmlContent} initialTitle={currentDoc.title} onUpdate={handleUpdate} theme={currentDoc.theme} onThemeChange={handleThemeChange} />
              </div>

              {/* Help Sidebar */}
              {showHelp && (
                <aside className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                  <div className="sticky top-4 bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Keyboard size={18} className="text-blue-600" />
                        Editor Guide
                      </h3>
                      <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inserting Blocks</h4>
                        <ul className="space-y-3 text-sm text-slate-600">
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5 p-1 bg-slate-100 rounded text-slate-500 flex-shrink-0"><Info size={14} /></div>
                            <span><strong>Plus Button:</strong> Click the <strong>+</strong> on any empty line to browse all available blocks by category.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5 p-1 bg-slate-100 rounded text-slate-500 flex-shrink-0"><Info size={14} /></div>
                            <span><strong>Slash Command:</strong> Type <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500">/</kbd> on any line to search and insert blocks by name.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5 p-1 bg-slate-100 rounded text-slate-500 flex-shrink-0"><Info size={14} /></div>
                            <span><strong>Bubble Menu:</strong> Select text to access inline formatting — bold, italic, links, gradient text, badges, and animations.</span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Markdown Shortcuts</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                          <li className="flex items-center justify-between">
                            <span>Heading 1</span>
                            <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500"># Space</kbd>
                          </li>
                          <li className="flex items-center justify-between">
                            <span>Heading 2</span>
                            <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500">## Space</kbd>
                          </li>
                          <li className="flex items-center justify-between">
                            <span>Bullet List</span>
                            <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500">* Space</kbd>
                          </li>
                          <li className="flex items-center justify-between">
                            <span>Task List</span>
                            <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500">[] Space</kbd>
                          </li>
                          <li className="flex items-center justify-between">
                            <span>Blockquote</span>
                            <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500">&gt; Space</kbd>
                          </li>
                          <li className="flex items-center justify-between">
                            <span>Code Block</span>
                            <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-500">``` Space</kbd>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tips</h4>
                        <ul className="space-y-3 text-sm text-slate-600">
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5 text-blue-500 flex-shrink-0"><Info size={14} /></div>
                            <span><strong>Images:</strong> Drag and drop to embed. Click an image to add annotation hotspots.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5 text-blue-500 flex-shrink-0"><Info size={14} /></div>
                            <span><strong>Tables:</strong> Insert via the top toolbar. Drag column borders to resize.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5 text-blue-500 flex-shrink-0"><Info size={14} /></div>
                            <span><strong>Block Settings:</strong> Click any block to reveal its layout and editing controls.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5 text-blue-500 flex-shrink-0"><Info size={14} /></div>
                            <span><strong>Theme:</strong> Use the Theme button in the header to customize colors, fonts, hero section, footer, and export features.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </aside>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full">
              <FileText size={64} className="mb-4 text-slate-300" />
              <h2 className="text-2xl font-semibold text-slate-700 mb-2">No Document Selected</h2>
              <p className="mb-6">Create a new guide to get started.</p>
              <button 
                onClick={createNewDocument} 
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
              >
                <Plus size={20} />
                <span>Create New Guide</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Theme Drawer */}
      {currentDoc && (
        <ThemeDrawer
          isOpen={isThemeDrawerOpen}
          onClose={() => setIsThemeDrawerOpen(false)}
          theme={currentDoc.theme || DEFAULT_THEME}
          setTheme={handleThemeChange}
        />
      )}

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
          {/* Toolbar */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
            {/* Left: close + title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex-shrink-0"
                title="Close preview"
              >
                <X size={18} />
              </button>
              <span className="text-sm font-medium text-slate-300 truncate">{currentDoc?.title || 'Preview'}</span>
            </div>

            {/* Center: title */}
            <span className="text-xs text-slate-500 font-mono hidden sm:block">
              {currentDoc?.title ? `${currentDoc.title}.html` : 'exported-guide.html'}
            </span>

            {/* Right: export shortcut */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsPreviewOpen(false); setIsExportModalOpen(true); }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <FileDown size={15} />
                Export
              </button>
            </div>
          </div>

          {/* iframe */}
          <div className="flex-1 overflow-hidden bg-white">
            <iframe
              srcDoc={previewHtml}
              title="Document Preview"
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          </div>
        </div>
      )}

      {/* Export Modal */}
      {currentDoc && (
        <ExportModal 
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExportDownload}
          theme={currentDoc.theme || DEFAULT_THEME}
          setTheme={handleThemeChange}
          documentTitle={currentDoc.title}
        />
      )}
    </div>
  );
}
