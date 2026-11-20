import type { Editor } from '@tiptap/core';
import type { Document, ThemeConfig } from './storage';
import type { ExportOptions } from './exporter';
import { generateHTML, generateCollectionHTML } from './exporter';
import { tiptapJsonToMarkdown } from './markdownExporter';
import { parseGuideInput, markdownToHtml } from './markdownImporter';
import {
  AGENT_BLOCK_CATALOG,
  blockSpecToHtml,
  type AgentBlockSpec,
  type AgentGuideSpec,
  type BlockCatalogEntry,
} from './agentSchema';
import { BLOCK_ITEMS, insertBlock as insertBlockItem } from './blockItems';

export interface GuideEmWindowAPI {
  /** List all documents in the workspace */
  listDocs: () => Array<Pick<Document, 'id' | 'title' | 'tags' | 'lastEdited' | 'theme'>>;
  /** Get full document by ID (defaults to active document) */
  getDoc: (id?: string) => Document | null;
  /** Switch editor to a document by ID */
  openDoc: (id: string) => boolean;
  /** Create a new guide from Markdown string, JSON string, or AgentGuideSpec object */
  createDoc: (input: string | AgentGuideSpec, options?: { syncToDisk?: boolean }) => Promise<Document>;
  /** Update an existing guide by ID */
  updateDoc: (id: string, updates: Partial<AgentGuideSpec>) => Promise<Document | null>;
  /** Delete a guide by ID */
  deleteDoc: (id: string) => Promise<boolean>;
  /** Insert a block into the active editor (by BLOCK_ITEMS id, AgentBlockSpec, or Markdown/directive string) */
  insertBlock: (block: string | AgentBlockSpec) => boolean;
  /** Update the active document's theme */
  setTheme: (updates: Partial<ThemeConfig>) => void;
  /** Generate standalone HTML string for a document (defaults to active doc) without triggering browser download */
  exportHTML: (id?: string, options?: ExportOptions) => string;
  /** Bundle multiple documents into a single multi-guide HTML portal */
  exportCollectionHTML: (docIds?: string[], title?: string) => string;
  /** Generate GuideEm-Flavored Markdown for a document (defaults to active doc) */
  exportMarkdown: (id?: string, includeFrontmatter?: boolean) => string;
  /** Sync guides from `./guides/` directory via the Vite dev server bridge */
  syncFromDisk: () => Promise<Document[]>;
  /** Push a document (or promote a browser draft) to `./guides/` on disk */
  saveDocToDisk: (id?: string) => Promise<Document | null>;
  /** Return the full catalog of custom GuideEm blocks and their schemas */
  getBlocksCatalog: () => BlockCatalogEntry[];
}

declare global {
  interface Window {
    guideEm?: GuideEmWindowAPI;
  }
}

export function mergeThemeConfig(base: ThemeConfig, updates?: Partial<ThemeConfig>): ThemeConfig {
  if (!updates) return base;
  return {
    ...base,
    ...updates,
    features: { ...base.features, ...(updates.features || {}) },
    hero: { ...base.hero, ...(updates.hero || {}) },
    footer: {
      ...(base.footer || { enabled: false, text: '', links: [], showBranding: true }),
      ...(updates.footer || {}),
      links: updates.footer?.links ?? base.footer?.links ?? [],
    },
  };
}

export async function fetchDiskGuides(defaultTheme: ThemeConfig): Promise<Document[]> {
  try {
    const res = await fetch('/api/agent/docs', { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.docs)) return [];
    return data.docs.map((d: any) => ({
      id: d.id || `file:${d.slug}`,
      title: d.title || 'Untitled Guide',
      content: d.content ?? d.htmlContent ?? '',
      htmlContent: d.htmlContent || '',
      lastEdited: d.lastEdited || Date.now(),
      tags: Array.isArray(d.tags) ? d.tags : [],
      theme: mergeThemeConfig(defaultTheme, d.theme),
    }));
  } catch {
    return [];
  }
}

export async function pushGuideToDisk(payload: AgentGuideSpec & { slug?: string }): Promise<any | null> {
  try {
    const res = await fetch('/api/agent/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.doc || null;
  } catch {
    // Ignore when running in static build without dev server
    return null;
  }
}

export function executeEditorBlockInsert(
  editor: Editor | null,
  block: string | AgentBlockSpec
): boolean {
  if (!editor) return false;

  if (typeof block === 'string') {
    const trimmed = block.trim();
    // Check if it matches a built-in block item ID (e.g. 'workflow', 'bentoGrid', 'calloutInfo')
    const matchedItem = BLOCK_ITEMS.find(
      item => item.id.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchedItem) {
      insertBlockItem(editor, matchedItem);
      return true;
    }
    // Otherwise treat as Markdown / directive / HTML snippet
    const html = markdownToHtml(trimmed);
    editor.chain().focus().insertContent(html).run();
    return true;
  }

  const html = blockSpecToHtml(block, markdownToHtml);
  editor.chain().focus().insertContent(html).run();
  return true;
}

export {
  AGENT_BLOCK_CATALOG,
  parseGuideInput,
  generateHTML,
  generateCollectionHTML,
  tiptapJsonToMarkdown,
};
