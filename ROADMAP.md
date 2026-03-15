# Modern Website Features Roadmap

## Context
DocuBlock Author exports standalone HTML files that already include TOC with scroll-spy, dark mode, lightbox, code copy buttons, scroll-reveal animations, hero sections, and responsive layout. This roadmap adds features to push exports from "documentation pages" to "modern website pages."

---

## Phase 1: Export-Only Polish (Small, no new extensions)

### 1. Reading Progress Bar
- Thin bar at page top showing scroll %, colored with `--brand-primary`
- **Files:** `storage.ts` (add `readingProgressBar` toggle), `ThemeDrawer.tsx`, `ExportModal.tsx`, `exporter.ts`
- **Complexity:** Small

### 2. Back-to-Top Button
- Circular floating button (bottom-right), appears after 400px scroll, smooth-scrolls to top
- **Files:** Same pattern as above — `storage.ts`, `ThemeDrawer.tsx`, `ExportModal.tsx`, `exporter.ts`
- **Complexity:** Small

### 3. Print Stylesheet
- `@media print` rules: hide nav/TOC/buttons, expand accordions/tabs, force white bg, avoid page breaks in blocks
- **Files:** `storage.ts` (toggle, default ON), `ExportModal.tsx`, `exporter.ts`
- **Complexity:** Small

### 4. Custom CSS Injection
- Textarea in ThemeDrawer for user CSS, appended as final `<style>` block in export
- **Files:** `storage.ts` (add `customCSS: string`), `ThemeDrawer.tsx`, `exporter.ts`
- **Complexity:** Small

---

## Phase 2: Interactive Content Blocks (New Tiptap extensions)

### 5. Accordion/Collapsible Sections
- Parent `accordion` + child `accordionItem` nodes (React NodeView, pattern from `Grid.tsx`)
- Each item: editable title header + collapsible rich content area
- Export JS: click toggles `max-height` with chevron rotation animation
- **Files:** Create `src/extensions/Accordion.tsx`; modify `Editor.tsx`, `exporter.ts`, `index.css`
- **Complexity:** Medium

### 6. Tabs/Tabbed Content
- Parent `tabGroup` + child `tabPanel` nodes (React NodeView)
- Tab buttons across top, clicking switches visible panel; `tabPanel` has `label` attribute
- Export JS: tab switching logic, active state with `--brand-primary`
- **Files:** Create `src/extensions/Tabs.tsx`; modify `Editor.tsx`, `exporter.ts`, `index.css`
- **Complexity:** Large

### 7. Section Dividers
- Atom node with `style` attribute: gradient / solid / wave / dots
- Full-viewport-width decorative breaks between content sections
- **Files:** Create `src/extensions/SectionDivider.ts`; modify `Editor.tsx`, `exporter.ts`
- **Complexity:** Small

---

## Phase 3: Theme & Config Enhancements

### 8. Footer Section
- Configurable footer: text, link list, optional branding
- Add `footer` object to `ThemeConfig`: `{ enabled, text, links[], showBranding }`
- Rendered full-width after main layout in export
- **Files:** `storage.ts`, `App.tsx` (defaults), `ThemeDrawer.tsx` (config UI), `exporter.ts`
- **Complexity:** Medium

### 9. Code Block Themes
- Choose between dark (current) / light / solarized syntax highlighting in exports
- Add `codeTheme` to `ThemeConfig`, selector in `ThemeDrawer.tsx`
- Three sets of `.hljs-*` CSS rules swapped in `exporter.ts`
- **Files:** `storage.ts`, `ThemeDrawer.tsx`, `exporter.ts`
- **Complexity:** Medium

---

## Phase 4: Rich Content Blocks

### 10. Video Embed
- Atom node supporting YouTube, Vimeo, and HTML5 video URLs
- URL parsing extracts embed URLs; responsive 16:9 iframe container
- React NodeView: URL input → iframe preview
- **Files:** Create `src/extensions/VideoEmbed.tsx`; modify `Editor.tsx`, `exporter.ts`
- **Complexity:** Medium

### 11. Timeline/Steps
- Parent `timeline` + child `timelineStep` nodes (React NodeView)
- Vertical line with numbered circles, editable step titles + rich content
- Export CSS: `::before` pseudo-elements for line and numbered circles using CSS counters
- **Files:** Create `src/extensions/Timeline.tsx`; modify `Editor.tsx`, `exporter.ts`, `index.css`
- **Complexity:** Large

### 12. Card Grid
- Parent `cardGrid` + child `card` nodes (2-6 cards)
- Each card: emoji/icon, title, rich content; CSS Grid layout with hover lift effect
- **Files:** Create `src/extensions/CardGrid.tsx`; modify `Editor.tsx`, `exporter.ts`, `index.css`
- **Complexity:** Large

---

## Phase 5: Final Polish

### 13. Animated Counters
- Atom node with `value`, `prefix`, `suffix`, `label` attributes
- Export JS: IntersectionObserver triggers count-up animation (0 → target over ~2s)
- Best used inside Grid blocks for side-by-side layout
- **Files:** Create `src/extensions/Counter.ts`; modify `Editor.tsx`, `exporter.ts`
- **Complexity:** Medium

### 14. Social/Share Buttons
- "Copy Link" + "Print" buttons in exported page header area
- Export JS: clipboard API + `window.print()`
- **Files:** `storage.ts` (toggle), `ExportModal.tsx`, `exporter.ts`
- **Complexity:** Small

---

## Shared Patterns

**New theme toggle:** `storage.ts` (ThemeConfig) → `App.tsx` (DEFAULT_THEME) → `ThemeDrawer.tsx` / `ExportModal.tsx` (UI) → `exporter.ts` (conditional render)

**New block extension:** `src/extensions/NewBlock.tsx` → `Editor.tsx` (register + floating menu) → `exporter.ts` (CSS + JS) → `index.css` (editor styles)

**Parent/child extensions** (Tabs, Accordion, Timeline, CardGrid): Follow `Grid.tsx` — parent with `ReactNodeViewRenderer`, children with `isolating: true` and `content: 'block+'`

**No migration needed:** New `ThemeConfig` fields are backward-compatible via `??` defaults.

---

## Key Files
| File | Role |
|------|------|
| `src/utils/exporter.ts` | Every feature renders here (CSS/HTML/JS) |
| `src/components/Editor.tsx` | Register extensions + floating menu buttons |
| `src/utils/storage.ts` | `ThemeConfig` interface |
| `src/extensions/Grid.tsx` | Reference pattern for React NodeView blocks |
| `src/components/ThemeDrawer.tsx` | Theme toggle UI |
| `src/App.tsx` | `DEFAULT_THEME` defaults |

## Verification
- Each feature: create a test document using the new block/toggle, export HTML, open in browser, verify interactivity
- Dark mode: toggle system preference, verify all new elements adapt
- Print: Ctrl+P on exported page, verify clean output
- Mobile: resize browser to <768px, verify responsive behavior
- Existing features: re-export old documents, confirm no regressions
