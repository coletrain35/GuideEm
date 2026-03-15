# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server on port 3000
npm run build     # Production build to /dist
npm run preview   # Preview built app
npm run lint      # TypeScript type check (tsc --noEmit)
npm run clean     # Remove /dist
```

No test framework is configured.

## Architecture

**GuideEm** is a local-first, browser-only documentation editor that exports standalone HTML files. All data persists in IndexedDB (via Localforage) — there is no backend API.

### Core Data Flow

1. `App.tsx` loads documents from IndexedDB on mount
2. User edits in `Editor.tsx` → `onUpdate` callback fires
3. Changes are debounced 1s then saved to IndexedDB via `storage.ts`
4. Export calls `exporter.ts`, which generates a fully self-contained HTML file (all CSS/JS inlined) and triggers a browser download

### Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root: document CRUD, theme management, sidebar, export orchestration |
| `src/components/Editor.tsx` | Tiptap editor with floating/bubble menus |
| `src/utils/storage.ts` | IndexedDB abstraction (`loadDocuments`, `saveDocument`, `deleteDocument`) |
| `src/utils/exporter.ts` | Generates standalone HTML with inlined styles, TOC, lightbox, scroll-spy |
| `src/utils/imageCompressor.ts` | Canvas API → WebP at 70% quality |
| `src/extensions/Callout.ts` | Custom Tiptap node: info/warning/success blocks |
| `src/extensions/AnnotatedImage.ts` | Custom Tiptap node: images with clickable annotation markers |
| `src/extensions/Grid.tsx` | Custom Tiptap node: multi-column layouts (50/50, 40/60, 60/40) |

### Data Models

```typescript
interface Document {
  id: string;
  title: string;
  content: any;        // Tiptap JSON
  htmlContent: string;
  lastEdited: number;
  theme?: ThemeConfig;
}

interface ThemeConfig {
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
  };
  logoBase64?: string;
}
```

### Tiptap Extensions

Custom extensions live in `src/extensions/`. Each extends Tiptap's `Node` class. When adding new block types, follow the pattern in `Callout.ts` (pure TS) or `Grid.tsx` (React node view) depending on whether the block needs interactive React rendering.

### Export System

`exporter.ts` extracts CSS from the live DOM (`document.styleSheets`) to capture dynamically injected Tailwind/Tiptap styles, then inlines everything into a single HTML string. The exported file has no external dependencies — it includes its own syntax highlighting, lightbox, and scroll-spy logic.

### Path Alias

`@/*` maps to the project root (configured in `tsconfig.json` and `vite.config.ts`).
