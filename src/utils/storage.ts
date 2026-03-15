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
 */
export const saveDocument = async (document: Document): Promise<void> => {
  const docs = await loadDocuments();
  const existingIndex = docs.findIndex(d => d.id === document.id);
  
  if (existingIndex >= 0) {
    docs[existingIndex] = document;
  } else {
    docs.push(document);
  }
  
  await saveDocuments(docs);
};

/**
 * Deletes a single document.
 */
export const deleteDocument = async (id: string): Promise<void> => {
  const docs = await loadDocuments();
  const newDocs = docs.filter(d => d.id !== id);
  await saveDocuments(newDocs);
};

