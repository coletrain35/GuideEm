# GuideEm'

A local-first, block-based documentation editor that exports fully standalone HTML guides — no backend, no accounts, everything runs in your browser.

## What Is It

GuideEm' is a rich documentation editor built for creating polished, self-contained HTML guides. Write with a block-based editor powered by Tiptap, customize the look with themes and branding, then export a single HTML file that works anywhere — no hosting, no dependencies, no internet required. All your data stays in your browser via IndexedDB.

## Features

### Rich Text Editing

- Headings (H1–H6), paragraphs, horizontal rules
- Ordered and unordered lists, task lists
- Blockquotes
- Code blocks with syntax highlighting
- Tables
- Text alignment (left, center, right, justify)
- Inline formatting: bold, italic, strikethrough, highlight, inline code, links

### Custom Blocks

- **Callout panels** — info, warning, and success variants for drawing attention to important content
- **Two-column grids** — three layout ratios (50/50, 40/60, 60/40) for side-by-side content
- **Annotated images** — numbered hotspot markers with hover tooltips for labeling parts of an image

### Image Handling

- Drag-and-drop or paste images directly into the editor
- Automatic WebP compression (70% quality) to keep file sizes small
- Images are base64-embedded so exported files are fully self-contained

### Markdown Shortcuts

Type familiar Markdown syntax and it converts automatically: `#` for headings, `*` or `-` for lists, `[]` for task lists, `>` for blockquotes, backticks for code.

### Theme Customization

- Brand color picker
- Three font families: Modern, Editorial, Technical
- Logo upload (embedded in export)
- Hero section with cover image, subtitle, and full or compact layout
- Optional sticky header, dark mode support, and scroll-reveal animations

### Single-File HTML Export

Every export produces one self-contained HTML file with:

- All CSS, JavaScript, and images inlined — zero external dependencies
- Auto-generated table of contents with scroll spy
- Copy-to-clipboard buttons on code blocks
- Image lightbox for full-size viewing
- Interactive checklists
- Responsive layout that works on any screen size

### Document Management

- Create and manage multiple documents
- Auto-save with 1-second debounce to IndexedDB
- Sidebar navigation for switching between documents

## Getting Started

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.

### Other Commands

```bash
npm run build     # Production build to /dist
npm run preview   # Preview the production build
npm run lint      # TypeScript type check
npm run clean     # Remove /dist
```

## Tech Stack

- **React 19** — UI framework
- **Tiptap 3** — Block-based editor core
- **Tailwind CSS 4** — Styling
- **Vite 6** — Build tool and dev server
- **Localforage** — IndexedDB storage abstraction
- **Highlight.js** — Syntax highlighting in code blocks
