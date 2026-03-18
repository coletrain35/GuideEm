# GuideEm: Feature Roadmap & Tracker

## Landing Page Demo Instructions

When completing a feature, evaluate whether it should be showcased on the landing page (`src/components/LandingPage.tsx`). If the feature is user-facing and visually demonstrable, update the landing page to highlight it. Examples:

- **Document templates** → Add a "Start from a template" section or mention in the hero
- **Theme presets** → Show preset thumbnails in the live preview controls
- **Focus/Zen mode** → Mention in the feature list
- **Drag-and-drop** → Add to the feature highlights
- **Word count** → Visible in the live preview
- **Markdown import** → Add as a feature bullet or CTA

Features that are purely internal (auto-save indicator, styled modals) don't need landing page updates but should still be reflected in any feature lists if applicable.

---

## Tier 1 — Quick Wins (High Impact, Low Effort)

- [x] **1. Auto-Save Indicator**
  - Status chip in the header — "Saved" / "Saving..." / "Unsaved changes"
  - `hasPendingSaveRef` already tracks this in `App.tsx`
  - **Files:** `src/App.tsx`

- [x] **2. Styled Delete Confirmation Modal**
  - Replace `window.confirm()` with a styled modal matching the app's design
  - Follow `ExportModal` pattern
  - **Files:** New `src/components/ConfirmDialog.tsx`, `src/App.tsx`

- [x] **3. Document Duplication**
  - "Duplicate" button on sidebar documents — clones content, theme, title + " (copy)"
  - Deep-clone doc with new ID, call `saveDocument`
  - **Files:** `src/App.tsx`, `src/components/Sidebar.tsx`

- [x] **4. Word Count & Reading Time**
  - Unobtrusive indicator showing word count + estimated reading time (words/200 wpm)
  - Use `editor.state.doc.textContent` for full text
  - **Files:** `src/components/Editor.tsx`

- [x] **5. Keyboard Shortcut Overlay (Ctrl+/)**
  - Quick-reference overlay triggered by keyboard shortcut
  - Help content already exists, just needs a keyboard trigger
  - **Files:** `src/App.tsx`

---

## Tier 2 — High Value (High Impact, Medium Effort)

- [x] **6. Document Templates**
  - Template picker when creating a new doc — "Blank", "Product Docs", "API Reference", "Tutorial", "Changelog", "Onboarding Guide"
  - Template JSON definitions + picker modal
  - **Files:** New `src/data/templates.ts`, new `src/components/TemplatePickerModal.tsx`, `src/App.tsx`

- [x] **7. Sidebar Search & Filter**
  - Search input at top of sidebar filtering documents by title in real-time
  - Filter `sortedDocs` by query match
  - **Files:** `src/components/Sidebar.tsx`

- [x] **8. Drag-and-Drop Block Reordering**
  - Visible drag handle (grip icon) on hover for every block, enabling drag to reorder
  - Community packages exist (`tiptap-extension-global-drag-handle`)
  - **Files:** `src/components/Editor.tsx` (GlobalDragHandle extension + CSS in `src/index.css`)

- [x] **9. Markdown Import**
  - "Import" button that accepts `.md` files, converts to Tiptap content
  - Use `marked`/`markdown-it` to HTML, then Tiptap's `setContent`
  - **Files:** New `src/utils/markdownImporter.ts`, `src/App.tsx`

- [x] **10. Theme Presets**
  - 5-8 curated one-click presets in ThemeDrawer — "Midnight", "Forest", "Coral", "Monochrome", etc.
  - Preset objects as `Partial<ThemeConfig>[]`
  - **Files:** New `src/data/themePresets.ts`, `src/components/ThemeDrawer.tsx`

- [x] **11. Focus/Zen Mode**
  - Toggle (Ctrl+Shift+F) hiding sidebar, header, toolbar — distraction-free writing
  - Conditional visibility on existing UI elements
  - **Files:** `src/App.tsx`, `src/components/Editor.tsx`

---

## Tier 3 — Nice to Have (Medium Impact)

- [x] **12. Find & Replace**
  - Ctrl+F opens search bar within editor with highlight + replace
  - **Files:** New `src/extensions/SearchReplace.ts`, `src/components/Editor.tsx`

- [x] **13. Document Folders/Tags**
  - Tag-based organization with sidebar filtering
  - **Files:** `src/utils/storage.ts`, `src/components/Sidebar.tsx`

- [x] **14. Markdown Export**
  - Export to `.md` alongside HTML
  - **Files:** New `src/utils/markdownExporter.ts`, `src/components/ExportModal.tsx`

- [x] **15. Block Copy/Duplicate Button**
  - Duplicate icon on block hover — copies complex blocks in one click
  - **Files:** `src/components/BlockDeleteButton.tsx`, React node views

- [x] **16. Improved Document Outline**
  - Floating toggle panel (accessible on all screen sizes), H3 support, active heading indicator
  - **Files:** `src/components/Editor.tsx`

---

## Tier 4 — Portfolio Site Mode (High Differentiating Value)

Portfolio-focused features for users building personal sites, project showcases, and case study pages.

### Portfolio Blocks

- [ ] **17. Project Card Block**
  - Thumbnail, title, description, tech stack tags, live URL + repo URL links
  - React node view with editable fields; renders as a polished card in export
  - **Files:** New `src/extensions/ProjectCard.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [ ] **18. Project Gallery Block**
  - Grid of Project Cards — 2 or 3 columns, responsive
  - Wraps multiple ProjectCard nodes in a container node
  - **Files:** New `src/extensions/ProjectGallery.tsx`

- [ ] **19. About Me / Bio Block**
  - Avatar image + name + role + bio paragraph in a clean split layout
  - Supports circular avatar crop; editable inline
  - **Files:** New `src/extensions/AboutMe.tsx`

- [ ] **20. Tech Stack / Tools Grid**
  - Icon + label tiles for languages, frameworks, and tools
  - Editable list of entries; renders as a compact icon grid in export
  - **Files:** New `src/extensions/TechStack.tsx`

- [ ] **21. Social Links Bar**
  - Row of icon links — GitHub, LinkedIn, Dribbble, Twitter/X, email
  - Configurable set of links via node attributes
  - **Files:** New `src/extensions/SocialLinks.tsx`

- [ ] **22. Portfolio Hero Block**
  - Full-width hero: name, tagline, "View Work" + "Contact" CTA buttons
  - Extends/replaces the existing HeroBanner for personal branding use case
  - **Files:** New `src/extensions/PortfolioHero.tsx` or extend `src/extensions/HeroBanner.tsx`

### Export & Publishing

- [ ] **23. Open Graph Meta Tags**
  - Title, description, and preview image injected into exported HTML `<head>`
  - Configurable via ThemeDrawer or a new "Publish Settings" panel
  - **Files:** `src/utils/exporter.ts`, `src/components/ThemeDrawer.tsx`

- [ ] **24. PDF Export**
  - Export via `html2pdf.js` or controlled `window.print()` with a print stylesheet
  - Essential for portfolios shared as attachments
  - **Files:** `src/utils/exporter.ts`, `src/components/ExportModal.tsx`

- [ ] **25. Netlify Drop / Deploy Button**
  - One-click upload of the exported HTML to Netlify Drop API, returns a live URL
  - Falls back to download if API unavailable
  - **Files:** `src/components/ExportModal.tsx`, new `src/utils/deployer.ts`

### Templates

- [ ] **26. Portfolio Templates**
  - "Developer Portfolio", "Designer Showcase", "Case Study" presets in the template picker
  - Pre-filled with Portfolio blocks and matching ThemeConfig
  - **Files:** `src/data/templates.ts`, `src/components/TemplatePickerModal.tsx`

---

## Tier 5 — Future Vision (Ambitious, Differentiating)

- [ ] **27. Version History with Snapshots**
  - Periodic auto-snapshots + restore UI
  - Separates a toy from a professional tool

- [ ] **28. Multi-Document Export**
  - Select multiple docs → combined HTML with unified TOC and chapter navigation

- [ ] **29. Mermaid Diagram Support**
  - New block type for flowcharts, sequence diagrams, ERDs
  - Render to inline SVG on export

---

## Implementation Order

**Phase 1:** Items 1-5 ✅ Complete
**Phase 2:** Items 10, 7, 6, 11, 9, 8 ✅ Complete
**Phase 3:** Tier 3 items ✅ Complete
**Phase 4:** Tier 4 portfolio features
**Phase 5:** Pick one Tier 5 item based on strategic direction
