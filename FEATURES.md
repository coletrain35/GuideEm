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

## Tier 4 — Premium Layout Blocks (Premium Website Feel)

Blocks that make exported docs feel like Stripe, Linear, and Vercel-quality marketing pages.

- [x] **17. Bento Grid**
  - Asymmetric multi-span card grid layout (Apple/Linear style)
  - Cards span different rows/columns for dynamic, non-uniform layouts
  - Configurable grid: 2x2, 3x3, or custom span per cell
  - React node view with drag-to-resize spans; renders as CSS Grid in export
  - **Files:** New `src/extensions/BentoGrid.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [x] **18. Feature Spotlight**
  - Large icon/image on one side, title + description + bullet points on the other
  - Subtle gradient backdrop behind the visual
  - Reversible layout (image left or right), multiple gradient presets
  - **Files:** New `src/extensions/FeatureSpotlight.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [x] **19. Sticky Scroll Sections**
  - Content pinned on one side while the other side scrolls through items (Stripe-style)
  - Left panel stays fixed, right panel has multiple content steps that scroll into view
  - Each step can contain rich text, images, or code
  - **Files:** New `src/extensions/StickyScroll.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [x] **20. Code Window**
  - macOS-style code blocks with traffic light dots, title bar, and copy button
  - Language label in title bar, syntax highlighting preserved
  - Multiple themes: dark (default), light, Nord, Dracula
  - **Files:** New `src/extensions/CodeWindow.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [x] **21. Changelog Timeline**
  - Polished vertical timeline with version badges, dates, and categorized entries
  - Entry types: Added (green), Fixed (blue), Changed (amber), Removed (red)
  - Collapsible per-version sections, badge styling for version numbers
  - **Files:** New `src/extensions/ChangelogTimeline.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [x] **22. Browser Mockup**
  - Screenshot or content displayed inside a realistic browser chrome frame
  - Address bar with customizable URL, traffic light dots, tab styling
  - Light and dark chrome variants
  - **Files:** New `src/extensions/BrowserMockup.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [x] **23. Phone Mockup**
  - Content displayed inside a realistic phone device frame
  - iPhone-style notch/dynamic island frame, rounded corners
  - Optional status bar with time/battery icons
  - **Files:** New `src/extensions/PhoneMockup.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

---

## Tier 5 — Premium Visual Effects & Blocks (Polish & Delight)

Visual effects and interactive blocks that add the finishing touches of a premium website.

- [ ] **24. Marquee / Infinite Scroll**
  - Auto-scrolling horizontal ticker for logos, testimonials, or text
  - Configurable speed, direction (left/right), pause-on-hover
  - Seamless loop with duplicated content for smooth infinite scroll
  - **Files:** New `src/extensions/Marquee.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [ ] **25. Glow Cards**
  - Cards with hover glow effect and spotlight that follows the cursor
  - Subtle radial gradient glow in the card's accent color on hover
  - Works with any card content (text, images, icons)
  - **Files:** New `src/extensions/GlowCard.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [ ] **26. Animated Gradient Borders**
  - Blocks wrapped in slowly animating gradient borders
  - Configurable gradient colors and animation speed
  - Can be applied as a wrapper around any content block
  - **Files:** New `src/extensions/GradientBorder.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [ ] **27. Hover Reveal Cards**
  - Cards that reveal additional content, images, or descriptions on hover
  - Smooth slide-up or fade-in reveal animation
  - Front face (title + icon) → hover reveals full description
  - **Files:** New `src/extensions/HoverReveal.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [ ] **28. Badge/Pill Announcements**
  - Animated announcement pill banner — "New", "v2.0 just shipped", "Coming soon"
  - Shimmer animation, configurable text and link
  - Typically placed at the top of a page or section
  - **Files:** New `src/extensions/AnnouncementPill.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [ ] **29. Gradient Blur Blobs**
  - Ambient blurred gradient orbs floating in the background of a section
  - Configurable blob colors, sizes, and positions
  - Subtle animation (slow drift or pulse)
  - **Files:** New `src/extensions/GradientBlobs.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [ ] **30. Noise/Grain Texture Overlay**
  - Subtle film grain or noise texture applied to section backgrounds
  - Configurable opacity and grain density
  - Adds tactile depth that separates premium from generic
  - **Files:** New `src/extensions/NoiseOverlay.tsx` or extend `BackgroundSection.tsx`, `src/utils/exporter.ts`

- [ ] **31. Parallax Sections**
  - Background layers that move at different scroll speeds
  - Configurable parallax intensity (subtle to dramatic)
  - Supports background images or gradient layers
  - **Files:** New `src/extensions/ParallaxSection.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

---

## Tier 6 — Portfolio Site Mode (High Differentiating Value)

Portfolio-focused features for users building personal sites, project showcases, and case study pages.

### Portfolio Blocks

- [x] **32. Project Card Block**
  - Thumbnail, title, description, tech stack tags, live URL + repo URL links
  - React node view with editable fields; renders as a polished card in export
  - **Files:** New `src/extensions/ProjectCard.tsx`, `src/utils/blockItems.ts`, `src/utils/exporter.ts`

- [x] **33. Project Gallery Block**
  - Grid of Project Cards — 2 or 3 columns, responsive
  - Wraps multiple ProjectCard nodes in a container node
  - **Files:** New `src/extensions/ProjectGallery.tsx`

- [x] **34. About Me / Bio Block**
  - Avatar image + name + role + bio paragraph in a clean split layout
  - Supports circular avatar crop; editable inline
  - **Files:** New `src/extensions/AboutMe.tsx`

- [x] **35. Tech Stack / Tools Grid**
  - Icon + label tiles for languages, frameworks, and tools
  - Editable list of entries; renders as a compact icon grid in export
  - **Files:** New `src/extensions/TechStack.tsx`

- [x] **36. Social Links Bar**
  - Row of icon links — GitHub, LinkedIn, Dribbble, Twitter/X, email
  - Configurable set of links via node attributes
  - **Files:** New `src/extensions/SocialLinks.tsx`

- [x] **37. Portfolio Hero Block**
  - Full-width hero: name, tagline, "View Work" + "Contact" CTA buttons
  - Extends/replaces the existing HeroBanner for personal branding use case
  - **Files:** New `src/extensions/PortfolioHero.tsx` or extend `src/extensions/HeroBanner.tsx`

### Export & Publishing

- [ ] **38. Open Graph Meta Tags**
  - Title, description, and preview image injected into exported HTML `<head>`
  - Configurable via ThemeDrawer or a new "Publish Settings" panel
  - **Files:** `src/utils/exporter.ts`, `src/components/ThemeDrawer.tsx`

- [ ] **39. PDF Export**
  - Export via `html2pdf.js` or controlled `window.print()` with a print stylesheet
  - Essential for portfolios shared as attachments
  - **Files:** `src/utils/exporter.ts`, `src/components/ExportModal.tsx`

- [ ] **40. Netlify Drop / Deploy Button**
  - One-click upload of the exported HTML to Netlify Drop API, returns a live URL
  - Falls back to download if API unavailable
  - **Files:** `src/components/ExportModal.tsx`, new `src/utils/deployer.ts`

### Templates

- [ ] **41. Portfolio Templates**
  - "Developer Portfolio", "Designer Showcase", "Case Study" presets in the template picker
  - Pre-filled with Portfolio blocks and matching ThemeConfig
  - **Files:** `src/data/templates.ts`, `src/components/TemplatePickerModal.tsx`

---

## Tier 7 — Future Vision (Ambitious, Differentiating)

- [ ] **42. Version History with Snapshots**
  - Periodic auto-snapshots + restore UI
  - Separates a toy from a professional tool

- [ ] **43. Multi-Document Export**
  - Select multiple docs → combined HTML with unified TOC and chapter navigation

- [ ] **44. Mermaid Diagram Support**
  - New block type for flowcharts, sequence diagrams, ERDs
  - Render to inline SVG on export

---

## Implementation Order

**Phase 1:** Items 1-5 ✅ Complete
**Phase 2:** Items 10, 7, 6, 11, 9, 8 ✅ Complete
**Phase 3:** Tier 3 items ✅ Complete
**Phase 4:** Tier 4 premium layout blocks ✅ Complete
**Phase 5:** Tier 5 premium visual effects
**Phase 6:** Tier 6 portfolio features (blocks ✅, export & templates remaining)
**Phase 7:** Pick Tier 7 items based on strategic direction
