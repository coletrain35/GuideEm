import localforage from 'localforage';

export interface FooterLink {
  label: string;
  url: string;
}

export interface ThemeConfig {
  primaryColor: string;
  fontFamily: 'modern' | 'editorial' | 'technical';
  hero: {
    enabled: boolean;
    coverImageBase64: string | null;
    subtitle: string;
    layout: 'full' | 'compact';
  };
  features: {
    stickyHeader: boolean;
    scrollReveal: boolean;
    darkModeSupport: boolean;
    readingProgressBar: boolean;
    backToTop: boolean;
    printStylesheet: boolean;
    shareButtons: boolean;
  };
  footer?: {
    enabled: boolean;
    text: string;
    links: FooterLink[];
    showBranding: boolean;
  };
  codeTheme?: 'dark' | 'light' | 'solarized';
  logoBase64?: string; // Keeping logoBase64 for backward compatibility and existing functionality
  customCSS?: string;
}

export interface Document {
  id: string;
  title: string;
  content: any; // JSON content
  htmlContent: string;
  lastEdited: number;
  theme?: ThemeConfig;
}

// Initialize localforage instance
const store = localforage.createInstance({
  name: 'GuideEm',
  storeName: 'workspace_drafts',
});

const DOCUMENTS_KEY = 'documents';

/**
 * Serialized write queue.
 *
 * All mutations (save, delete) are chained onto this promise so that
 * concurrent callers can never interleave a read-modify-write cycle.
 * The chain always resolves (never rejects) so errors in one operation
 * cannot block future operations.
 */
let _writeChain: Promise<void> = Promise.resolve();

const queueWrite = (fn: () => Promise<void>): Promise<void> => {
  // Append to the chain; ignore failures from previous operations so the
  // chain never stalls.
  const next = _writeChain.catch(() => {}).then(fn);
  // Keep _writeChain pointing at the latest settled promise so new
  // operations wait for the full backlog, not just the current tail.
  _writeChain = next.catch(() => {});
  return next; // Caller can await this to know when *their* op completed.
};

/**
 * Retrieves all saved documents.
 */
export const loadDocuments = async (): Promise<Document[]> => {
  try {
    const docs = await store.getItem<Document[]>(DOCUMENTS_KEY);
    return docs || [];
  } catch (error) {
    console.error('Failed to load documents locally:', error);
    return [];
  }
};

/**
 * Saves the list of documents locally.
 * Prefer saveDocument / deleteDocument for single-document mutations.
 */
export const saveDocuments = async (documents: Document[]): Promise<void> => {
  try {
    await store.setItem(DOCUMENTS_KEY, documents);
  } catch (error) {
    console.error('Failed to save documents locally:', error);
  }
};

/**
 * Saves a single document.
 *
 * All calls are serialized through a write queue to prevent concurrent
 * read-modify-write races that would silently overwrite or discard data.
 */
export const saveDocument = (document: Document): Promise<void> => {
  return queueWrite(async () => {
    const docs = (await store.getItem<Document[]>(DOCUMENTS_KEY)) ?? [];
    const idx = docs.findIndex(d => d.id === document.id);
    if (idx >= 0) {
      docs[idx] = document;
    } else {
      docs.push(document);
    }
    await store.setItem(DOCUMENTS_KEY, docs);
  });
};

/**
 * Deletes a single document.
 *
 * Serialized through the same write queue as saveDocument.
 */
export const deleteDocument = (id: string): Promise<void> => {
  return queueWrite(async () => {
    const docs = (await store.getItem<Document[]>(DOCUMENTS_KEY)) ?? [];
    await store.setItem(DOCUMENTS_KEY, docs.filter(d => d.id !== id));
  });
};
