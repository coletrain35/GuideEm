import localforage from 'localforage';

export interface FooterLink {
  label: string;
  url: string;
}

export interface ThemeConfig {
  primaryColor: string;
  fontFamily: 'modern' | 'editorial' | 'technical';
  hero: {
    style?: 'none' | 'gradient' | 'dark' | 'mesh' | 'editorial';
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
    searchBar?: boolean;
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
  pageBackground?: { preset: string | null };
}

export interface Document {
  id: string;
  title: string;
  content: any; // JSON content
  htmlContent: string;
  lastEdited: number;
  theme?: ThemeConfig;
  tags?: string[];
}

export interface DocumentSnapshot {
  id: string;
  docId: string;
  title: string;
  content: any;
  htmlContent: string;
  timestamp: number;
  label?: string;
}

export interface WorkspaceBackupBundle {
  version: 1;
  exportedAt: number;
  documents: Document[];
}

// Initialize localforage instance
const store = localforage.createInstance({
  name: 'GuideEm',
  storeName: 'workspace_drafts',
});

const DOCUMENTS_KEY = 'documents';
const SNAPSHOT_LIMIT = 20;

/**
 * Serialized write queue.
 *
 * All mutations (save, delete) are chained onto this promise so that
 * concurrent callers can never interleave a read-modify-write cycle.
 * The chain always resolves (never rejects) so errors in one operation
 * cannot block future operations.
 */
let _writeChain: Promise<unknown> = Promise.resolve();

const queueWrite = <T>(fn: () => Promise<T>): Promise<T> => {
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
 *
 * Throws on storage failure instead of returning an empty array.  Returning
 * `[]` on error used to make the app show a "no documents" empty state even
 * when the user's data was still in IndexedDB (e.g. a transient schema
 * migration or a locked store), giving them no way back to their work.
 * Callers must catch and surface a recovery UI.
 */
export const loadDocuments = async (): Promise<Document[]> => {
  const docs = await store.getItem<Document[]>(DOCUMENTS_KEY);
  return docs || [];
};

/**
 * Saves the list of documents locally.
 * Prefer saveDocument / deleteDocument for single-document mutations.
 */
export const saveDocuments = async (documents: Document[]): Promise<void> => {
  await store.setItem(DOCUMENTS_KEY, documents);
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
    await store.removeItem(`snapshots_${id}`);
  });
};

export const loadSnapshots = async (docId: string): Promise<DocumentSnapshot[]> => {
  const snaps = await store.getItem<DocumentSnapshot[]>(`snapshots_${docId}`);
  return snaps || [];
};

export const createSnapshot = (
  doc: Document,
  label?: string,
  minIntervalMs = 0
): Promise<DocumentSnapshot | null> => {
  return queueWrite(async () => {
    const key = `snapshots_${doc.id}`;
    const existing = (await store.getItem<DocumentSnapshot[]>(key)) ?? [];
    if (!label && existing.length > 0) {
      if (existing[0].htmlContent === doc.htmlContent && existing[0].title === doc.title) {
        return null;
      }
      if (minIntervalMs > 0 && Date.now() - existing[0].timestamp < minIntervalMs) {
        return null;
      }
    }
    const snap: DocumentSnapshot = {
      id: crypto.randomUUID(),
      docId: doc.id,
      title: doc.title,
      content: doc.content,
      htmlContent: doc.htmlContent,
      timestamp: Date.now(),
      label,
    };
    await store.setItem(key, [snap, ...existing].slice(0, SNAPSHOT_LIMIT));
    return snap;
  });
};

export const deleteSnapshot = (docId: string, snapshotId: string): Promise<void> => {
  return queueWrite(async () => {
    const key = `snapshots_${docId}`;
    const existing = (await store.getItem<DocumentSnapshot[]>(key)) ?? [];
    await store.setItem(key, existing.filter(s => s.id !== snapshotId));
  });
};

export const exportWorkspaceBundle = async (): Promise<WorkspaceBackupBundle> => {
  const documents = await loadDocuments();
  return {
    version: 1,
    exportedAt: Date.now(),
    documents,
  };
};

export const importWorkspaceBundle = (raw: any): Promise<Document[]> => {
  if (!Array.isArray(raw?.documents)) {
    return Promise.reject(new Error('Invalid backup bundle: missing documents array'));
  }
  return queueWrite(async () => {
    const existing = (await store.getItem<Document[]>(DOCUMENTS_KEY)) ?? [];
    const byId = new Map<string, Document>(existing.map(d => [d.id, d]));
    for (const item of raw.documents) {
      if (!item || typeof item.id !== 'string' || typeof item.title !== 'string') continue;
      byId.set(item.id, {
        ...item,
        lastEdited: typeof item.lastEdited === 'number' ? item.lastEdited : Date.now(),
      });
    }
    const merged = Array.from(byId.values()).sort((a, b) => b.lastEdited - a.lastEdited);
    await store.setItem(DOCUMENTS_KEY, merged);
    return merged;
  });
};
