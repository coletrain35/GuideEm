import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from './components/Editor';
import { ThemeDrawer } from './components/ThemeDrawer';
import { Sidebar } from './components/Sidebar';
import { ExportModal } from './components/ExportModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { TemplatePickerModal } from './components/TemplatePickerModal';
import { loadDocuments, saveDocument, deleteDocument, Document, ThemeConfig } from './utils/storage';
import { generateHTML } from './utils/exporter';
import type { ExportOptions } from './utils/exporter';
import { tiptapJsonToMarkdown } from './utils/markdownExporter';
import { exportToPDF } from './utils/pdfExporter';
import { LandingPage } from './components/LandingPage';
import { markdownToHtml } from './utils/markdownImporter';
import { importGuideHTML } from './utils/htmlImporter';
import type { TemplateDefinition } from './data/templates';
import { FileDown, FileText, Loader2, Keyboard, HelpCircle, X, CheckCircle, AlertTriangle, Info, Menu, Plus, Upload, Palette, ArrowLeft, Eye, Maximize2, Minimize2, LayoutGrid, ChevronDown } from 'lucide-react';
import { BlockPalette } from './components/BlockPalette';
import { ToastProvider, useToast } from './components/Toast';

export const DEFAULT_THEME: ThemeConfig = {
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

export function cloneTheme(theme: ThemeConfig = DEFAULT_THEME): ThemeConfig {
  return {
    ...theme,
    features: { ...(theme.features || DEFAULT_THEME.features) },
    hero: { ...(theme.hero || DEFAULT_THEME.hero) },
    footer: {
      ...(theme.footer || DEFAULT_THEME.footer),
      links: theme.footer?.links ? theme.footer.links.map(l => ({ ...l })) : [...DEFAULT_THEME.footer.links],
    },
  };
}

function parseHexColor(inputColor?: string) {
  let hex = (inputColor || DEFAULT_THEME.primaryColor).replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    hex = '2563eb';
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const toLinear = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return { hex, r, g, b, luminance };
}

function MainApp() {
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string | null>(() => {
    return localStorage.getItem('guideem_last_doc_id') || null;
  });
  const [currentView, setCurrentView] = useState<'landing' | 'editor'>(() => {
    const saved = localStorage.getItem('guideem_view');
    return saved === 'editor' ? 'editor' : 'landing';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isThemeDrawerOpen, setIsThemeDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showBlockPalette, setShowBlockPalette] = useState(true);
  const [isRiseMode, setIsRiseMode] = useState(false);
  const [editorInstance, setEditorInstance] = useState<import('@tiptap/core').Editor | null>(null);
  const markdownImportRef = useRef<HTMLInputElement>(null);
  const htmlImportRef = useRef<HTMLInputElement>(null);
  const [showImportMenu, setShowImportMenu] = useState(false);
  
  const documentsRef = useRef<Document[]>([]);
  useEffect(() => { documentsRef.current = documents; }, [documents]);

  const hasPendingSaveRef = useRef(false);
  const lastFailedSaveRef = useRef<Document | null>(null);

  // Multi-document pending save map to avoid clobbering saves on document switch
  const pendingSavesMapRef = useRef<Map<string, Document>>(new Map());
  const deletedDocIdsRef = useRef<Set<string>>(new Set());
  const saveDebounceTimerRef = useRef<number | null>(null);
  const SAVE_DEBOUNCE_MS = 500;

  // Persist current view & doc ID
  useEffect(() => {
    localStorage.setItem('guideem_view', currentView);
  }, [currentView]);

  useEffect(() => {
    if (currentDocId) {
      localStorage.setItem('guideem_last_doc_id', currentDocId);
    }
  }, [currentDocId]);

  const flushPendingSaves = useCallback(async () => {
    if (saveDebounceTimerRef.current) {
      window.clearTimeout(saveDebounceTimerRef.current);
      saveDebounceTimerRef.current = null;
    }

    const entries = Array.from(pendingSavesMapRef.current.entries());
    if (entries.length === 0) {
      hasPendingSaveRef.current = false;
      return;
    }

    pendingSavesMapRef.current.clear();

    for (const [docId, doc] of entries) {
      if (deletedDocIdsRef.current.has(docId)) {
        continue; // Do not save deleted docs
      }
      try {
        await saveDocument(doc);
        if (lastFailedSaveRef.current?.id === docId) {
          lastFailedSaveRef.current = null;
        }
      } catch (err) {
        console.error('Save failed for doc:', docId, err);
        lastFailedSaveRef.current = doc;
        setSaveStatus('error');
      }
    }

    if (pendingSavesMapRef.current.size === 0) {
      hasPendingSaveRef.current = false;
      if (!lastFailedSaveRef.current) {
        setSaveStatus('saved');
      }
    }
  }, []);

  const persistDoc = useCallback((doc: Document) => {
    if (deletedDocIdsRef.current.has(doc.id)) return;
    pendingSavesMapRef.current.set(doc.id, doc);
    hasPendingSaveRef.current = true;
    setSaveStatus('saving');

    if (saveDebounceTimerRef.current) {
      window.clearTimeout(saveDebounceTimerRef.current);
    }
    saveDebounceTimerRef.current = window.setTimeout(flushPendingSaves, SAVE_DEBOUNCE_MS);
  }, [flushPendingSaves]);

  const retrySave = useCallback(() => {
    if (lastFailedSaveRef.current) {
      persistDoc(lastFailedSaveRef.current);
      toast.info('Retrying save…');
    }
  }, [persistDoc, toast]);

  const handleEditorPendingChange = useCallback((pending: boolean) => {
    if (pending) {
      hasPendingSaveRef.current = true;
    } else if (!lastFailedSaveRef.current && pendingSavesMapRef.current.size === 0) {
      hasPendingSaveRef.current = false;
    }
  }, []);

  const currentDoc = documents.find(d => d.id === currentDocId);

  // Browser title sync
  useEffect(() => {
    if (currentDoc?.title) {
      document.title = `${currentDoc.title} — GuideEm`;
    } else {
      document.title = 'GuideEm — Local-first Documentation Editor';
    }
  }, [currentDoc?.title]);

  // Safe document selection with immediate flush of prior saves
  const handleSelectDoc = useCallback((id: string) => {
    flushPendingSaves();
    setSaveStatus('saved');
    setCurrentDocId(id);
    if (window.innerWidth < 768) setShowSidebar(false);
  }, [flushPendingSaves]);

  // BeforeUnload guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingSaveRef.current || pendingSavesMapRef.current.size > 0) {
        flushPendingSaves();
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushPendingSaves();
    };
  }, [flushPendingSaves]);

  // Keyboard shortcuts: Ctrl+/ → help, Ctrl+Shift+F → zen, Esc → exit zen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setShowHelp(v => !v);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setIsZenMode(v => !v);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        setShowBlockPalette(v => !v);
      }
      if (e.key === 'Escape') {
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const docs = await loadDocuments();
      setDocuments(docs);
      setCurrentDocId(prev => {
        if (prev && docs.some(d => d.id === prev)) return prev;
        return docs[0]?.id ?? null;
      });
    } catch (err) {
      console.error('Failed to load documents:', err);
      setLoadError(err instanceof Error ? err.message : 'Unknown storage error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const createNewDocument = (template?: TemplateDefinition) => {
    setShowTemplatePicker(false);
    const tpl = template ?? {
      defaultTitle: 'Untitled Guide',
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Start writing here…' }] }] },
    };
    const newDoc: Document = {
      id: crypto.randomUUID(),
      title: tpl.defaultTitle,
      content: tpl.content,
      htmlContent: '',
      lastEdited: Date.now(),
      theme: cloneTheme(DEFAULT_THEME),
    };
    setDocuments(prev => [newDoc, ...prev]);
    setCurrentDocId(newDoc.id);
    setCurrentView('editor');
    saveDocument(newDoc);
    toast.success('New guide created');
  };

  const handleMarkdownImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const html = markdownToHtml(text);
      const title = file.name.replace(/\.md$/i, '').trim() || 'Imported Document';
      const newDoc: Document = {
        id: crypto.randomUUID(),
        title,
        content: html,
        htmlContent: html,
        lastEdited: Date.now(),
        theme: cloneTheme(DEFAULT_THEME),
      };
      setDocuments(prev => [newDoc, ...prev]);
      setCurrentDocId(newDoc.id);
      setCurrentView('editor');
      await saveDocument(newDoc);
      toast.success(`Imported "${title}"`);
    } catch (err) {
      toast.error('Markdown import failed');
    } finally {
      e.target.value = '';
    }
  };

  const handleHtmlImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { title: importedTitle, content, theme: importedTheme } = importGuideHTML(text);
      const docTitle = importedTitle || file.name.replace(/\.html?$/i, '').trim() || 'Imported Guide';
      const newDoc: Document = {
        id: crypto.randomUUID(),
        title: docTitle,
        content,
        htmlContent: content,
        lastEdited: Date.now(),
        theme: { ...cloneTheme(DEFAULT_THEME), ...importedTheme } as ThemeConfig,
      };
      setDocuments(prev => [newDoc, ...prev]);
      setCurrentDocId(newDoc.id);
      setCurrentView('editor');
      await saveDocument(newDoc);
      toast.success(`Imported guide "${docTitle}"`);
    } catch (err) {
      toast.error('HTML import failed');
    } finally {
      e.target.value = '';
    }
  };

  const handleUpdate = useCallback((html: string, json: any, newTitle: string) => {
    if (!currentDocId || deletedDocIdsRef.current.has(currentDocId)) return;

    const existing = documentsRef.current.find(d => d.id === currentDocId);
    if (!existing) return;

    const updatedDoc: Document = {
      ...existing,
      content: json,
      htmlContent: html,
      title: newTitle,
      lastEdited: Date.now(),
    };

    setDocuments(prev => prev.map(d => d.id === currentDocId ? updatedDoc : d));
    persistDoc(updatedDoc);
  }, [currentDocId, persistDoc]);

  const handleThemeChange = useCallback((themeUpdates: Partial<ThemeConfig>) => {
    if (!currentDocId || deletedDocIdsRef.current.has(currentDocId)) return;

    const existing = documentsRef.current.find(d => d.id === currentDocId);
    if (!existing) return;

    const currentTheme = existing.theme ? cloneTheme(existing.theme) : cloneTheme(DEFAULT_THEME);
    const updatedDoc: Document = {
      ...existing,
      theme: {
        ...currentTheme,
        ...themeUpdates,
        features: { ...currentTheme.features, ...(themeUpdates.features || {}) },
        hero: { ...currentTheme.hero, ...(themeUpdates.hero || {}) },
        footer: {
          ...currentTheme.footer,
          ...(themeUpdates.footer || {}),
          links: themeUpdates.footer?.links ?? currentTheme.footer?.links ?? [],
        },
      },
      lastEdited: Date.now(),
    };

    setDocuments(prev => prev.map(d => d.id === currentDocId ? updatedDoc : d));
    persistDoc(updatedDoc);
  }, [currentDocId, persistDoc]);

  const handleOpenPreview = () => {
    if (!currentDoc) return;
    const opts: ExportOptions = isRiseMode ? { mode: 'rise' } : undefined;
    setPreviewHtml(generateHTML(currentDoc.title, currentDoc.htmlContent, currentDoc.theme || DEFAULT_THEME, opts));
    setIsPreviewOpen(true);
  };

  const handleExportDownload = (userFileName: string) => {
    if (!currentDoc) return;
    const opts: ExportOptions = isRiseMode ? { mode: 'rise' } : undefined;
    const finalHtmlString = generateHTML(currentDoc.title, currentDoc.htmlContent, currentDoc.theme || DEFAULT_THEME, opts);
    const blob = new Blob([finalHtmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeFileName = userFileName.replace(/[/\\:*?"<>|]/g, '').trim() || 'Untitled Guide';
    link.download = `${safeFileName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported "${safeFileName}.html"`);
  };

  const handleMarkdownExport = (userFileName: string) => {
    if (!currentDoc) return;
    const markdown = tiptapJsonToMarkdown(currentDoc.content);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeFileName = userFileName.replace(/[/\\:*?"<>|]/g, '').trim() || 'Untitled Guide';
    link.download = `${safeFileName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported "${safeFileName}.md"`);
  };

  const handlePDFExport = async (userFileName: string) => {
    if (!currentDoc) return;
    const safeFileName = userFileName.replace(/[/\\:*?"<>|]/g, '').trim() || 'Untitled Guide';
    try {
      await exportToPDF(
        currentDoc.title,
        currentDoc.htmlContent,
        currentDoc.theme || DEFAULT_THEME,
        safeFileName
      );
      toast.success(`Exported "${safeFileName}.pdf"`);
    } catch {
      toast.error('PDF export failed');
    }
  };

  const handleTagsChange = useCallback((id: string, tags: string[]) => {
    const existing = documentsRef.current.find(d => d.id === id);
    if (!existing) return;
    const updatedDoc = { ...existing, tags, lastEdited: Date.now() };
    setDocuments(prev => prev.map(d => d.id === id ? updatedDoc : d));
    persistDoc(updatedDoc);
  }, [persistDoc]);

  const handleSidebarRename = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const existing = documentsRef.current.find(d => d.id === id);
    if (!existing || existing.title === trimmed) return;
    const updatedDoc = { ...existing, title: trimmed, lastEdited: Date.now() };
    setDocuments(prev => prev.map(d => d.id === id ? updatedDoc : d));
    persistDoc(updatedDoc);
    toast.success(`Renamed to "${trimmed}"`);
  }, [persistDoc, toast]);

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const deletedId = confirmDeleteId;
    const deletedDoc = documentsRef.current.find(d => d.id === deletedId);
    
    // Mark as deleted so unmounting Editor will not resurrect it
    deletedDocIdsRef.current.add(deletedId);
    pendingSavesMapRef.current.delete(deletedId);

    try {
      await deleteDocument(deletedId);
      const docs = await loadDocuments();
      setDocuments(docs);
      if (currentDocId === deletedId) {
        setCurrentDocId(docs.length > 0 ? docs[0].id : null);
      }

      if (deletedDoc) {
        toast.showToast({
          type: 'info',
          message: `Deleted "${deletedDoc.title || 'Untitled Guide'}"`,
          action: {
            label: 'Undo',
            onClick: async () => {
              deletedDocIdsRef.current.delete(deletedId);
              await saveDocument(deletedDoc);
              setDocuments(prev => [deletedDoc, ...prev]);
              setCurrentDocId(deletedDoc.id);
              toast.success(`Restored "${deletedDoc.title || 'Untitled Guide'}"`);
            },
          },
          duration: 6000,
        });
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete document');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = documentsRef.current.find(d => d.id === id);
    if (!existing) return;
    const newDoc: Document = {
      ...existing,
      id: crypto.randomUUID(),
      title: `${existing.title} (copy)`,
      theme: existing.theme ? cloneTheme(existing.theme) : cloneTheme(DEFAULT_THEME),
      tags: existing.tags ? [...existing.tags] : [],
      lastEdited: Date.now(),
    };
    setDocuments(prev => [newDoc, ...prev]);
    setCurrentDocId(newDoc.id);
    await saveDocument(newDoc);
    toast.success(`Duplicated "${existing.title}"`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900">Could not load your documents</h2>
              <p className="mt-1 text-sm text-slate-600">{loadError}</p>
              <button
                onClick={loadWorkspace}
                className="mt-4 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Marketing Landing Page view
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onStartWriting={() => {
            if (documents.length > 0 && currentDocId) {
              setCurrentView('editor');
            } else {
              setShowTemplatePicker(true);
            }
          }}
        />
        {/* The template picker must live outside LandingPage's tree — the
            landing view returns early, so modals rendered only in the editor
            branch below would never mount here. */}
        <TemplatePickerModal
          isOpen={showTemplatePicker}
          onClose={() => setShowTemplatePicker(false)}
          onSelect={createNewDocument}
        />
      </>
    );
  }

  const { hex: brandHex, r: brandR, g: brandG, b: brandB, luminance: brandLuminance } = parseHexColor(currentDoc?.theme?.primaryColor);

  return (
    <div 
      className="min-h-screen bg-slate-50 text-slate-900 font-sans flex h-screen overflow-hidden transition-colors duration-300"
      style={{
        '--brand-primary': `#${brandHex}`,
        '--brand-primary-rgb': `${brandR}, ${brandG}, ${brandB}`,
        '--brand-text-color': brandLuminance > 0.179 ? '#111827' : '#f8fafc',
        fontFamily: currentDoc?.theme?.fontFamily === 'editorial' ? 'Merriweather, serif' :
                    currentDoc?.theme?.fontFamily === 'technical' ? '"Fira Code", monospace' :
                    'Inter, system-ui, sans-serif',
      } as React.CSSProperties}
    >
      {/* Hidden file inputs for import (accessible in all states) */}
      <input
        ref={markdownImportRef}
        type="file"
        accept=".md,text/markdown"
        className="hidden"
        onChange={handleMarkdownImport}
      />
      <input
        ref={htmlImportRef}
        type="file"
        accept=".html,.htm"
        className="hidden"
        onChange={handleHtmlImport}
      />

      {/* Sidebar — hidden in zen mode */}
      {showSidebar && !isZenMode && (
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
              onSelectDoc={handleSelectDoc}
              onCreateDoc={() => setShowTemplatePicker(true)}
              onDeleteDoc={handleDelete}
              onDuplicateDoc={handleDuplicate}
              onTagsChange={handleTagsChange}
              onRenameDoc={handleSidebarRename}
              onClose={() => setShowSidebar(false)}
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* Header — hidden in zen mode */}
        <header className={`bg-white border-b border-slate-100 flex-shrink-0 z-10 transition-all duration-300 ${isZenMode ? 'hidden' : ''}`}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Toggle Sidebar"
                aria-label="Toggle documents sidebar"
                aria-expanded={showSidebar}
              >
                <Menu size={20} aria-hidden />
              </button>
              <div className="w-px h-6 bg-slate-200" />
              <button
                onClick={() => setCurrentView('landing')}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Landing Page</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {currentDoc ? (
                <>
                  {/* Auto-save status chip */}
                  {saveStatus === 'error' ? (
                    <button
                      onClick={retrySave}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                      title="Save failed — click to retry"
                      aria-label="Save failed. Click to retry."
                    >
                      <AlertTriangle size={12} aria-hidden />
                      Save failed — Retry
                    </button>
                  ) : (
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                        saveStatus === 'saving'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {saveStatus === 'saving' ? (
                        <><Loader2 size={12} className="animate-spin" aria-hidden /><span className="hidden sm:inline">Saving…</span></>
                      ) : (
                        <><CheckCircle size={12} aria-hidden /><span className="hidden sm:inline">Saved</span></>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => setShowBlockPalette(v => !v)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${showBlockPalette ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                    title="Toggle Block Palette (Ctrl+Shift+B)"
                    aria-label="Toggle blocks palette"
                    aria-pressed={showBlockPalette}
                  >
                    <LayoutGrid size={18} aria-hidden />
                    <span className="hidden sm:inline">Blocks</span>
                  </button>
                  <button
                    onClick={() => setIsThemeDrawerOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Theme Settings"
                    aria-label="Open theme settings"
                  >
                    <Palette size={18} aria-hidden />
                    <span className="hidden sm:inline">Theme</span>
                  </button>
                  <button
                    onClick={() => setShowHelp(!showHelp)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${showHelp ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
                    title="Toggle Help & Shortcuts (Ctrl+/)"
                    aria-label="Toggle help and shortcuts panel"
                    aria-pressed={showHelp}
                  >
                    <HelpCircle size={18} aria-hidden />
                    <span className="hidden sm:inline">Help</span>
                  </button>
                  <button
                    onClick={handleOpenPreview}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Preview exported document"
                    aria-label="Preview exported document"
                  >
                    <Eye size={18} aria-hidden />
                    <span className="hidden sm:inline">Preview</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowImportMenu(v => !v)}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Import document"
                      aria-label="Import document"
                      aria-haspopup="menu"
                      aria-expanded={showImportMenu}
                    >
                      <Upload size={18} aria-hidden />
                      <span className="hidden sm:inline">Import</span>
                      <ChevronDown size={14} className="hidden sm:inline opacity-70" aria-hidden />
                    </button>
                    {showImportMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowImportMenu(false)} />
                        <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                          <button
                            onClick={() => { setShowImportMenu(false); markdownImportRef.current?.click(); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                          >
                            <FileText size={16} className="text-slate-400" />
                            <div>
                              <div className="font-medium">Markdown</div>
                              <div className="text-xs text-slate-400">.md files</div>
                            </div>
                          </button>
                          <button
                            onClick={() => { setShowImportMenu(false); htmlImportRef.current?.click(); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                          >
                            <FileDown size={16} className="text-slate-400" />
                            <div>
                              <div className="font-medium">HTML Guide</div>
                              <div className="text-xs text-slate-400">.html exported guides</div>
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setIsZenMode(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Focus / Zen Mode (Ctrl+Shift+F)"
                    aria-label="Toggle focus mode"
                    aria-pressed={isZenMode}
                  >
                    <Maximize2 size={18} aria-hidden />
                    <span className="hidden sm:inline">Focus</span>
                  </button>

                  <div className="w-px h-6 bg-slate-200 mx-1" />

                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                    aria-label="Open export dialog"
                  >
                    <FileDown size={18} aria-hidden />
                    <span className="hidden sm:inline">Export</span>
                    <ChevronDown size={14} className="hidden sm:inline opacity-70" aria-hidden />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => markdownImportRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Upload size={16} />
                    <span>Import MD</span>
                  </button>
                  <button
                    onClick={() => setShowTemplatePicker(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                  >
                    <Plus size={18} />
                    <span>New Guide</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex flex-1 overflow-hidden">
        {showBlockPalette && !isZenMode && editorInstance && currentDoc && (
          <>
            <div className="hidden sm:flex flex-shrink-0">
              <BlockPalette variant="inline" editor={editorInstance} onClose={() => setShowBlockPalette(false)} />
            </div>
            <div className="sm:hidden">
              <BlockPalette variant="drawer" editor={editorInstance} onClose={() => setShowBlockPalette(false)} />
            </div>
          </>
        )}
        <main className="flex-1 overflow-y-auto relative flex flex-col md:flex-row gap-6 px-2 py-4 sm:px-4 sm:py-8">
          {currentDoc ? (
            <>
              <div className={`transition-all duration-300 ease-in-out ${showHelp && !isZenMode ? 'md:w-2/3 lg:w-3/4' : 'w-full'}`}>
                <Editor
                  key={currentDoc.id}
                  initialContent={currentDoc.content}
                  initialHtmlContent={currentDoc.htmlContent}
                  initialTitle={currentDoc.title}
                  onUpdate={handleUpdate}
                  theme={currentDoc.theme}
                  onThemeChange={handleThemeChange}
                  zenMode={isZenMode}
                  onEditorReady={setEditorInstance}
                  onPendingChange={handleEditorPendingChange}
                />
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
                      <div className="flex items-center gap-1">
                        <kbd className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono">Ctrl+/</kbd>
                        <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
                          <X size={16} />
                        </button>
                      </div>
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
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full p-6 text-center">
              <FileText size={64} className="mb-4 text-slate-300" />
              <h2 className="text-2xl font-semibold text-slate-700 mb-2">No Document Selected</h2>
              <p className="mb-6 max-w-sm">Create a new guide or import existing Markdown/HTML files to get started.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button 
                  onClick={() => setShowTemplatePicker(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                  <Plus size={20} />
                  <span>Create New Guide</span>
                </button>
                <button
                  onClick={() => markdownImportRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-3 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-xs"
                >
                  <Upload size={18} />
                  <span>Import File</span>
                </button>
              </div>
            </div>
          )}
        </main>
        </div>
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
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-950"
          role="dialog"
          aria-modal="true"
          aria-label="Document preview"
          onKeyDown={(e) => { if (e.key === 'Escape') setIsPreviewOpen(false); }}
        >
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex-shrink-0"
                title="Close preview"
                aria-label="Close preview"
              >
                <X size={18} aria-hidden />
              </button>
              <span className="text-sm font-medium text-slate-300 truncate">{currentDoc?.title || 'Preview'}</span>
            </div>

            <span className="text-xs text-slate-500 font-mono hidden sm:block">
              {currentDoc?.title ? `${currentDoc.title}.html` : 'exported-guide.html'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsPreviewOpen(false); setIsExportModalOpen(true); }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                aria-label="Open export dialog from preview"
              >
                <FileDown size={15} aria-hidden />
                Export
              </button>
            </div>
          </div>

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
          onExportMarkdown={handleMarkdownExport}
          onExportPDF={handlePDFExport}
          theme={currentDoc.theme || DEFAULT_THEME}
          setTheme={handleThemeChange}
          documentTitle={currentDoc.title}
          isRiseMode={isRiseMode}
          onRiseModeChange={setIsRiseMode}
        />
      )}

      {/* Zen Mode Exit Button */}
      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-sm text-white text-sm font-medium rounded-full shadow-lg hover:bg-slate-900 transition-colors"
          title="Exit Focus Mode (Esc)"
        >
          <Minimize2 size={15} />
          Exit Focus
        </button>
      )}

      {/* Template Picker */}
      <TemplatePickerModal
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={createNewDocument}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Delete document?"
        message="This document will be removed. You can immediately undo this action."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
