import { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from './components/Editor';
import { ThemeDrawer } from './components/ThemeDrawer';
import { Sidebar } from './components/Sidebar';
import { ExportModal } from './components/ExportModal';
import { loadDocuments, saveDocument, deleteDocument, Document, ThemeConfig } from './utils/storage';
import { generateHTML } from './utils/exporter';
import { LandingPage } from './components/LandingPage';
import { FileDown, FileText, Trash2, Loader2, Keyboard, HelpCircle, X, CheckCircle, AlertTriangle, Info, Menu, Plus, Settings, Upload, Palette, ArrowLeft } from 'lucide-react';

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#2563eb', // Tailwind blue-600
  fontFamily: 'modern',
  hero: {
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
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentDoc = documents.find(d => d.id === currentDocId);

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

    setDocuments(prev => prev.map(doc => {
      if (doc.id === currentDocId) {
        const updatedDoc = {
          ...doc,
          content: json,
          htmlContent: html,
          title: newTitle,
          lastEdited: Date.now()
        };
        
        saveDocument(updatedDoc);

        return updatedDoc;
      }
      return doc;
    }));
  }, [currentDocId]);

  const handleThemeChange = (themeUpdates: Partial<ThemeConfig>) => {
    if (!currentDocId) return;

    setDocuments(prev => prev.map(doc => {
      if (doc.id === currentDocId) {
        const updatedDoc = { 
          ...doc, 
          theme: { ...(doc.theme || DEFAULT_THEME), ...themeUpdates },
          lastEdited: Date.now() 
        };
        saveDocument(updatedDoc);
        return updatedDoc;
      }
      return doc;
    }));
  };

  const handleExportDownload = () => {
    if (!currentDoc) return;

    // 1. Compile the final HTML string using your engine
    const finalHtmlString = generateHTML(currentDoc.title, currentDoc.htmlContent, currentDoc.theme || DEFAULT_THEME);

    // 2. Create a "Blob" (Binary Large Object) of text/html
    const blob = new Blob([finalHtmlString], { type: 'text/html;charset=utf-8' });

    // 3. Create a temporary invisible hyperlink
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // 4. Set the downloaded file name securely
    const safeFileName = (currentDoc.title || 'Untitled_Guide').replace(/[^a-z0-9]/gi, '_').toLowerCase();
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
      style={{
        '--brand-primary': currentDoc?.theme?.primaryColor || DEFAULT_THEME.primaryColor,
        fontFamily: currentDoc?.theme?.fontFamily === 'editorial' ? 'Merriweather, serif' : 
                    currentDoc?.theme?.fontFamily === 'technical' ? '"Fira Code", monospace' : 
                    'Inter, system-ui, sans-serif'
      } as React.CSSProperties}
    >
      
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar 
          documents={documents}
          currentDocId={currentDocId}
          onSelectDoc={setCurrentDocId}
          onCreateDoc={createNewDocument}
          onDeleteDoc={handleDelete}
        />
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
        <main className="flex-1 overflow-y-auto relative flex flex-col md:flex-row gap-6 px-4 py-8">
          {currentDoc ? (
            <>
              <div className={`transition-all duration-300 ease-in-out ${showHelp ? 'md:w-2/3 lg:w-3/4' : 'w-full'}`}>
                <Editor key={currentDoc.id} initialContent={currentDoc.content} initialHtmlContent={currentDoc.htmlContent} initialTitle={currentDoc.title} onUpdate={handleUpdate} />
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

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menus</h4>
                        <ul className="space-y-3 text-sm text-slate-600">
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5 p-1 bg-slate-100 rounded text-slate-500"><Info size={14} /></div>
                            <span><strong>Floating Menu:</strong> Click on any empty line to reveal options for inserting blocks, lists, and callouts.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5 p-1 bg-slate-100 rounded text-slate-500"><Info size={14} /></div>
                            <span><strong>Bubble Menu:</strong> Highlight any text to reveal inline formatting options (bold, links, highlights).</span>
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
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pro Tips</h4>
                        <ul className="space-y-3 text-sm text-slate-600">
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5 text-blue-500"><Info size={14} /></div>
                            <span><strong>Images:</strong> Drag and drop images directly into the editor to embed them instantly.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="mt-0.5 text-blue-500"><Info size={14} /></div>
                            <span><strong>Tables:</strong> Use the top toolbar to insert a table. Drag column borders to resize them.</span>
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
