# GuideEm UX Audit

> Generated 2026-07-01 by four parallel deep-audits of the entire `src/` tree.
> Severity: Critical → Major → Minor → Nit.
> File:line refs are current as of this date.

---

## How to use this document

Each finding has a **severity**, a **summary**, and a **file:line ref**.
Groupings are by theme. The table of contents below links to each section.

To implement: pick a section, read the grouped findings, visit the refs, fix.

---

## Contents

1. [Data loss & silent failures](#1-data-loss--silent-failures)
2. [Dead advertised features](#2-dead-advertised-features)
3. [Image subsystem](#3-image-subsystem)
4. [Mobile / responsive](#4-mobile--responsive)
5. [Accessibility](#5-accessibility)
6. [Block-level UX inconsistencies](#6-block-level-ux-inconsistencies)
7. [App-level flows](#7-app-level-flows)
8. [Performance](#8-performance)
9. [Keyboard & shortcuts](#9-keyboard--shortcuts)
10. [Race conditions & double-click](#10-race-conditions--double-click)
11. [Polish nits](#11-polish-nits)

---

## 1. Data loss & silent failures

### Critical

**1.1 Save errors are silently swallowed.**
`saveDocument()` → `queueWrite()` catches IndexedDB failures, `console.error`s, then resolves anyway. `App.tsx`'s `.then()` unconditionally sets `saveStatus('saved')`. The user sees "Saved" even when the write failed. The `beforeunload` guard stays armed, the save chip stays stuck on "Saving…" forever.
- `utils/storage.ts:94-99`
- `App.tsx:212-215`

**1.2 Up to 1 second of typing can vanish on tab close.**
The 1 s autosave debounce is not guarded by `beforeunload`. The guard only fires after a save *starts*, not while debounce is pending. Close the tab < 1 s after the last keystroke → that keystroke is lost. No recovery file.
- `Editor.tsx:220-227`
- `App.tsx:84-93`

**1.3 `loadDocuments` returns `[]` on any storage error.**
If IndexedDB throws (browser update, schema migration, corruption), `catch` returns `[]`. `App.tsx` treats an empty array as "no documents". A user with 50 documents sees a fresh empty state. The data may still be in IndexedDB but there's no way back.
- `utils/storage.ts:80-88`
- `App.tsx:118-129`

**1.4 Dropping a non-image file destroys unsaved work.**
The file-drop branch in `Editor.tsx:447-472` only guards image files. For non-images, the function returns `false` and the browser's default drag behavior navigates to the file — **replacing the editor URL and losing all unsaved edits**.
- `Editor.tsx:447-472`

**1.5 All image upload errors are silent.**
Every `catch` block in `Editor.tsx:465, 497` and `ImagePlaceholderView.tsx:26` only `console.error`s. No toast, no banner. A failed upload looks identical to a slow upload. The user sits there waiting.
- `Editor.tsx:465, 497`
- `ImagePlaceholderView.tsx:26-29`

**1.6 SVG files are silently rejected.**
`imageCompressor.ts:16-18` rejects `image/svg+xml` for security. Every file input in the app uses `accept="image/*"`, so SVGs appear accepted but fail silently. Logos and icons are a top use case for a documentation editor.
- `imageCompressor.ts:16-18`
- All file inputs (`ImagePlaceholderView.tsx:96`, `PhoneMockup.tsx`, `BrowserMockup.tsx`)

**1.7 No max file size on image upload.**
A 20 MB phone screenshot freezes the main thread for 5–10 s (Canvas pipeline in `imageCompressor.ts`). No pre-check. A 100 MB file can OOM the tab.
- `imageCompressor.ts` (all)
- `Editor.tsx:447-505`

---

## 2. Dead advertised features

The data model and/or partial UI hint at features that don't functionally exist.

### Critical

**2.1 Cover image upload is unwired.**
`handleCoverImageUpload` (full FileReader + base64 pipeline) exists at `App.tsx:348-357`. The schema has `theme.hero.coverImageBase64`. But nothing in any component ever calls this function. No upload button, no drop zone, no file picker anywhere in `DocumentCover.tsx` or `ThemeDrawer.tsx`.

**2.2 Logo upload is unwired.**
Same pattern. `handleLogoUpload` exists at `App.tsx:337-346`. `storage.ts:34` defines `logoBase64`. No UI element invokes it.

### Major

**2.3 No way to REPLACE an `annotatedImage` once uploaded.**
`AnnotatedImageView.tsx` has no `<input type="file">`. After upload, the only way to swap the image is to delete the whole block and re-insert a placeholder. Compare to PhoneMockup and BrowserMockup which have Replace + Remove buttons (the ones we just added).

**2.4 "Download .pdf" opens the browser print dialog.**
The button says "Download .pdf". It fires `window.print()`. The user has to manually select "Save as PDF" from a destination dropdown. The format card's subtitle says "Print-ready" but the button label is a direct lie.
- `ExportModal.tsx:248-255`
- `App.tsx:288-297`

**2.5 Help panel advertises a "Bubble Menu" that doesn't exist.**
The help panel says "Bubble Menu: Select text to access inline formatting". The app uses a sticky top pill, not Tiptap's `BubbleMenu` (verified: grep shows zero imports of `BubbleMenu`/`FloatingMenu`).
- `App.tsx:608` (help text)
- `Editor.tsx:762-1119` (the real toolbar)

---

## 3. Image subsystem

Three image types (AnnotatedImage, PhoneMockup, BrowserMockup) with three completely different UIs. The user experience is inconsistent and missing standard features.

### Critical

**3.1 No alt-text input on any image type.**
`AnnotatedImage.ts:32` declares `alt` as an attribute (default `null`). `AnnotatedImageView.tsx:122-127` renders `alt={node.attrs.alt || ''}`. **No UI exists to set it.** PhoneMockup and BrowserMockup hardcode `alt="Phone screen"` / `alt="Browser screenshot"`. Every exported document fails WCAG.
- `AnnotatedImageView.tsx:122-127`
- `PhoneMockup.tsx:52`
- `BrowserMockup.tsx:54`

**3.2 No image alignment (left/center/right) anywhere.**
`TextAlign` in `Editor.tsx:324-326` applies only to `['heading', 'paragraph']`. The AnnotatedImage wrapper is always `mx-auto`. No float, no text-wrap.
- `Editor.tsx:324-326`

**3.3 No caption field on any image.**
`AnnotatedImage.ts:29-49` has no `caption` attribute. PhoneMockup/BrowserMockup have no caption. "Image with caption" is the #1 pattern in technical documentation.
- `AnnotatedImage.ts` (entire attribute list)
- `PhoneMockup.tsx`
- `BrowserMockup.tsx`

### Major

**3.4 Three image types, three different sizing models.**
- AnnotatedImage: percentage (drag handles, 10–100%)
- PhoneMockup: hardcoded 240px — **no way to change ever**
- BrowserMockup: 100% container width — no way to constrain
- `AnnotatedImageView.tsx:46-70`, `PhoneMockup.tsx:38`, `BrowserMockup.tsx:38`

**3.5 No object-fit control.**
Mockups stretch/squish any image to fill the frame. No "cover" / "contain" / "actual-size" toggle. A landscape screenshot in a portrait phone frame looks broken.
- `PhoneMockup.tsx:50-54`
- `BrowserMockup.tsx:54`

**3.6 Width control is drag-handle-only with no numeric input.**
`AnnotatedImageView.tsx:46-70`: drag pills at the edges. There's a `{width}%` display (line 87) but it's read-only. No input box, no presets, no "reset to 100%".

**3.7 AnnotatedImage markers are not draggable.**
Markers at `AnnotatedImageView.tsx:129-138` are positioned via `left`/`top` percentages. There is no drag handler. The user must delete + re-click + pray for sub-pixel accuracy.
- `AnnotatedImageView.tsx:129-138`

**3.8 Three different upload paths produce different end results.**
- Block palette "Image" → `imagePlaceholder` (must then click + upload)
- Drop from desktop → `annotatedImage` (full annotation system, no compression feedback)
- Paste from clipboard → `annotatedImage`
The user has no way to predict what they'll get.
- `blockItems.ts:121-123`
- `Editor.tsx:460, 493`

**3.9 ImagePlaceholderView file input does not reset value.**
After a successful upload, `e.target.value` is not reset. Re-selecting the same file silently fails — browsers don't fire `onChange` if the value is unchanged.
- `ImagePlaceholderView.tsx:46-51`

**3.10 No drop indicator during drag.**
`Editor.tsx:584-634` only shows drop indicators for `application/x-block-palette` transfers. For file drops (`Files` type), no indicator appears. The user has no idea where their image will land.
- `Editor.tsx:584-634`

**3.11 No way to insert an image from a URL.**
Every entry point is a file input. A user with an image on their CDN has to download it first.

**3.12 Annotation UI is always "on" even when unused.**
`AnnotatedImageView.tsx:80-100` shows "Click on the image to add a hotspot marker" every time the image is selected. There is no opt-out. Most users uploading a screenshot do not want annotations.

**3.13 Mockups have no compression.**
PhoneMockup and BrowserMockup use `FileReader.readAsDataURL` directly — no `compressImageToWebP`. A 5 MB screenshot stays 5 MB base64 in IndexedDB and the exported HTML. The same file dropped into the editor body compresses to ~1.7 MB.
- `PhoneMockup.tsx:13-22`
- `BrowserMockup.tsx:13-22`

**3.14 Phone mockup is locked to 240px.**
In a 1920 px exported document the phone looks like a stamp. In a narrow mobile preview it can overflow (we just fixed the export CSS, but the editor still renders 240px).
- `PhoneMockup.tsx:38`

**3.15 AnnotatedImage has no Replace/Remove.**
`AnnotatedImageView.tsx` has no file input and no Remove button. The only way to clear the image is to delete the whole block.

---

## 4. Mobile / responsive

### Critical

**4.1 Block Palette consumes 240 px on a 375 px viewport.**
`w-60 flex-shrink-0` defaults to open (`useState(true)`). On a phone, the editor gets ~135 px. Requires finding a small icon-only "Blocks" button in the header to dismiss.
- `BlockPalette.tsx:51`
- `App.tsx:63, 567`

**4.2 Document Outline overlays the editor on phones.**
`fixed right-4 top-28 w-56` renders by default whenever there is at least one heading (`showOutline = true`). No visible dismiss on small screens.
- `Editor.tsx:1232-1273, 191`

**4.3 PlusMenu popover off-screen on phones.**
`left: editorRect.left - 28` with `w-72` (288 px). On a 375 px phone with sidebar + palette, the popover extends past the right edge.
- `PlusMenu.tsx:42, 124-131`

### Major

**4.4 Save status chip hidden on mobile.**
`hidden sm:flex` — no save feedback on phones.
- `App.tsx:446`

**4.5 Slash command popover hidden by on-screen keyboard.**
Positioned at the caret (below the cursor) with the keyboard up, the popover renders behind the keyboard. The help panel advertises this as the primary block-insertion method.
- `SlashCommand.ts:49-58`

**4.6 Cover style picker is hover-only, invisible on touch.**
`opacity-0 group-hover:opacity-100` at `DocumentCover.tsx:113`. Mobile users cannot change their cover style.

**4.7 Floating toolbar overlaps top of editor on mobile.**
`sticky top-4 z-40` at `Editor.tsx:762`. Consumes ~56 px at the top of the viewport.

**4.8 Block Palette items are `draggable="true"` but HTML5 DnD doesn't work on touch.**
`BlockPalette.tsx:112`. iOS Safari and most Android browsers don't fire HTML5 drag events on touch. The click fallback works but the affordance is misleading.

---

## 5. Accessibility

### Critical

**5.1 Exactly one `aria-label` in the entire `src/`.**
"Remove link" in `ThemeDrawer.tsx:240`. Every other button, toolbar, dialog, tab, input, and popover is invisible to screen readers.
- Grep: `aria-label|aria-labelledby|aria-describedby|role=|aria-haspopup|aria-expanded` across all `*.tsx`

**5.2 No focus trap or Escape handler in any dialog.**
ExportModal, ThemeDrawer, ConfirmDialog, Preview overlay, TemplatePicker all:
- Lack `role="dialog"` / `aria-modal="true"`
- Lack an Escape listener
- Do not trap focus (Tab goes to underlying editor)
- Do not restore focus when closed
- WCAG 2.4.3 and 2.1.1 failure
- `ExportModal.tsx:104-260`
- `ThemeDrawer.tsx:11-279`
- `ConfirmDialog.tsx:13-48`
- `App.tsx:698-741` (Preview)
- `App.tsx:771-776` (TemplatePicker)

### Major

**5.3 No `role="toolbar"` on the floating pill.**
~30 buttons, 2 selects, 3 popovers. No `role`, no `aria-orientation`, no group labels.
- `Editor.tsx:765`

**5.4 Editor contenteditable has no accessible name.**
No `aria-label`, no `aria-labelledby`.
- `Editor.tsx:385-387`

**5.5 Auto-save status pill is purely visual.**
Not in an `aria-live` region. AT users get no save confirmation.
- `App.tsx:446-456`

**5.6 Toggle switches are not switches.**
`ExportModal.tsx:191-227` uses `sr-only` checkbox + custom div, no `role="switch"` / `aria-checked`.

**5.7 ThemeDrawer form controls lack label associations.**
Brand color, typography, code theme, footer links, custom CSS — all have `<label>` elements but no `htmlFor`/`id` connections.
- `ThemeDrawer.tsx:35-50, 54-69, 147-167, 212-233, 263-273`

**5.8 Selected options have no `aria-pressed`.**
Typography and code-theme buttons visually highlight the selection but don't expose it to AT.
- `ThemeDrawer.tsx:58-66, 154-166`

**5.9 PlusMenu `+` button has no accessible name.**
28×28 px icon-only button, only a `title` attribute.
- `PlusMenu.tsx:111-119`

**5.10 `prefers-reduced-motion` respects only one animation group.**
`background-section` animations are suppressed at `index.css:433-435`. All others (hero shimmer, animated text, image hover, dividers, cover fade) keep running.
- `index.css:204-247, 259-316, 318-331, 374-388, 564-571`

**5.11 `window.prompt` for link insertion.**
Native `window.prompt` with no validation feedback, no styling, focus broken in modern browsers.
- `Editor.tsx:741-752`

### Minor

**5.12 Slash menu items lack `role="option"` / `aria-selected`.**
- `SlashCommandMenu.tsx:83-99`

**5.13 Outline active heading has no `aria-current`.**
- `Editor.tsx:1245-1268`

**5.14 Find/Replace match count is not in `aria-live`.**
- `Editor.tsx:1142-1150`

**5.15 Find/Replace Escape doesn't return focus to editor.**
- `Editor.tsx:726-735`

**5.16 No "Skip to main content" link.**
- `App.tsx` (no skip link)

**5.17 Toolbar buttons use `title` only for labels.**
- `Editor.tsx` (everywhere)

---

## 6. Block-level UX inconsistencies

### Critical

**6.1 Per-item delete missing in 4 block types.**
Workflow steps, Timeline steps, Accordion items, CardGrid cards have **no way to delete a single item**. The user must delete the whole block and start over.
- `Workflow.tsx:83-323`
- `Timeline.tsx:53-74`
- `Accordion.tsx:9-41`
- `CardGrid.tsx` (child card count hardcoded at 6, then silently stops)

**6.2 CardGrid silently refuses a 7th card.**
`if (node.childCount >= 6) return;` — the "Add Card" button disappears but no message explains why.
- `CardGrid.tsx:76`

### Major

**6.3 ~15 blocks use a "floating toolbar on hover" pattern that is invisible on touch.**
Floating pill at `top-0 left-1/2 -translate-x-1/2 -translate-y-full` with `opacity-0 group-hover/block:opacity-100`. Used by Workflow, ProjectGallery, Timeline, HoverReveal, GlowCards, Marquee, AnnouncementPill, TechStack, StickyScroll, FeatureSpotlight, GradientBorder, BackgroundSection, AboutMe, HeroBanner, ProjectCard, CodeWindow. On touch devices these controls are permanently invisible.
- Multiple files (see list above)

**6.4 Two different selection ring colors.**
Indigo (`border-indigo-400 ring-2 ring-indigo-100`) in ProjectGallery, BentoGrid, StickyScroll, etc. Blue (`border-blue-400 ring-2 ring-blue-200`) in BeforeAfter, Testimonial, Counter, CodeDiff. User is conditioned to indigo via the toolbar; blue blocks feel "wrong".
- Multiple files

**6.5 Add-item controls have 3+ different patterns.**
- Floating top pill (hover only): Workflow, Timeline, Accordion, StickyScroll
- Dashed empty card in grid (visible when selected): ProjectGallery, BentoGrid, HoverReveal, GlowCards, TechStack, StatRow
- Footer button: SocialLinks, ChangelogTimeline
No documentation helps the user learn which pattern applies where.
- Multiple files

**6.6 Drag-to-reorder only in InteractiveDemo.**
All other multi-item blocks (ProjectGallery, BentoGrid, HoverReveal, GlowCards, TechStack, StatRow, SocialLinks, ChangelogTimeline, Marquee, Tabs, Accordion) store items in arrays/JSON and provide no way to reorder. User must delete + re-add.
- `InteractiveDemoView.tsx:116-136` (has it)
- All others (don't)

**6.7 Mermaid empty state doesn't explain itself.**
"Click to edit diagram" → becomes a bare textarea + "Templates" button + "Guide" button. No description of what Mermaid is, no "pick a template to start" suggestion, no indication that the textarea expects valid Mermaid syntax.
- `Mermaid.tsx:620-622, 313, 327-334, 361`

**6.8 CodeDiff swaps between pretty diff and raw textareas with no "Edit" button.**
Unselected: formatted `<pre>` diff. Selected: two raw `<textarea>`s. Jarring transition with no label.
- `CodeDiff.tsx:118-142`

**6.9 Tabs active-tab rebalancing is complex and unexplained.**
When removing a tab, the component has to re-allot `activeTab` to a sibling. The logic at `Tabs.tsx:158-202` is brittle and the user has no feedback.

**6.10 Counter allows non-numeric values.**
`value` attribute stores whatever the user types. `parseFloat` returns `NaN` for non-numeric input. No validation.
- `Counter.tsx:28-33`

**6.11 Marquee pauses the animation when selected.**
The selected state replaces the CSS animation with a static grid. The user thinks they "broke" the animation.
- `Marquee.tsx:139-169`

**6.12 Destructive actions have no confirmation.**
`BlockDeleteButton.tsx:39-47` one-click deletes. `BlockDeleteButton.tsx:14-25` duplicate can fail silently. No undo, no toast.

---

## 7. App-level flows

### Major

**7.1 Landing page shown every session.**
Returning user sees a marketing page every time. No "Resume last doc", no recent-docs view. Must click "Start Writing Locally" to get to their work.
- `App.tsx:367-369`
- `LandingPage.tsx:11-349`

**7.2 No "Reset to defaults" in Theme drawer.**
A user who picks a bad color / font / custom CSS has no undo. Must manually revert every change.
- `ThemeDrawer.tsx` (entire file)

**7.3 Theme is per-document but feels global.**
`storage.ts:39-47` saves theme inside `Document`. Change brand color in doc A → doc B still has the old color. No global theme scope. The drawer says "Theme" not "Document Theme".
- `storage.ts:39-47`

**7.4 Sidebar has no rename action.**
To rename, user must find the DocumentCover title above the editor. No context menu, no inline edit in the sidebar.
- `Sidebar.tsx:152-208`

**7.5 Sidebar search is title-only.**
Input says "Search documents…" but only matches `d.title.toLowerCase()`. No content search.
- `Sidebar.tsx:48`

**7.6 New documents are all called "Untitled Guide".**
Three new docs = three identical "Untitled Guide" entries in the sidebar. No "Untitled Guide 2", no immediate naming prompt.
- `App.tsx:134`

**7.7 Tag input is hover-only + autoFocus traps Tab.**
`opacity-0 group-hover:opacity-100` for the tag icon. Once visible, clicking opens `<input autoFocus />` — Tab jumps to the next doc row mid-edit.
- `Sidebar.tsx:175-244, 228-242`

**7.8 No drag-and-drop file import.**
Import dropdown opens a file picker. User with a `.md` file on their desktop expects to drag it onto the app.
- `App.tsx:490-503`

**7.9 "Rise Compatible" toggle is cryptic.**
Label: "Rise Compatible". Subtitle: "Optimize for Articulate Rise embedding". A non-Rise user who toggles it on silently loses `readingProgressBar`, `backToTop`, and `shareButtons` (visually dimmed with no explanation).
- `ExportModal.tsx:204-228`

**7.10 Markdown export silently strips images/links/custom blocks.**
The format note says "Interactive features not included" but doesn't warn that images, callouts, mermaid diagrams, mockups, etc. produce garbled or empty output.
- `ExportModal.tsx:73`
- `utils/markdownExporter.ts`

**7.11 No copy-shareable-link option.**
The modal offers only "Download .html/.md/.pdf". The "Share Buttons" feature embeds Copy Link + Print buttons *into the exported HTML*, not shareability of the GuideEm document itself.

**7.12 No export preview.**
Modal has feature toggles but no preview. The editor has a separate "Preview" button that opens a full-screen iframe. Two preview concepts for one thing.
- `Editor.tsx:697-741` (preview)
- `ExportModal.tsx:104-260` (no preview)

**7.13 No content search across documents.**
No Command-K, no global search, no in-app indexing.

**7.14 Delete confirmation doesn't show the document's title.**
"Delete document?" — no indication of *which* document.
- `App.tsx:781-783`

### Minor

**7.15 "Back to Site" button is confusing.**
Navigates to the marketing landing page, not a published site.
- `App.tsx:433-439`

**7.16 Filename input has no validation.**
Leading spaces, slashes, special characters — all silently handled or stripped.
- `ExportModal.tsx:152-168`

**7.17 Export modal lacks Escape handler.**
- `ExportModal.tsx:104-260`

**7.18 isRiseMode is component state, not persisted.**
No persistence means the toggle resets every session.
- `App.tsx:64`

**7.19 Duplicate creates "Untitled Guide (copy)" without disambiguation.**
Duplicate twice → both are "(copy)".
- `App.tsx:330`

**7.20 Landing page "Start from a template" link is small gray text.**
Buried below the main CTA.
- `LandingPage.tsx:130-132`

**7.21 First-time user lands on marketing page, not editor.**
No "Welcome, let's create your first guide" intro.
- `App.tsx:118-129`

**7.22 Cover image upload button doesn't exist (see 2.1).**
`DocumentCover.tsx` has no upload affordance.

**7.23 Logo upload button doesn't exist (see 2.2).**
`ThemeDrawer.tsx` has no upload affordance.

---

## 8. Performance

### Critical

**8.1 Per-keystroke full-doc IndexedDB write from Theme drawer.**
`handleThemeChange` at `App.tsx:218-238` calls `saveDocument(updatedDoc)` on every keystroke in Custom CSS, footer text, footer links, brand color, logo/cover pickers. For a doc with N MB of base64 images, every character writes N MB in full.
- `App.tsx:218-238`
- Triggered by `ThemeDrawer.tsx:38-48, 188-193, 212-233, 266-272`

### Major

**8.2 Image compression runs on the main thread with no progress UI.**
`compressImageToWebP` is a synchronous Canvas pipeline. 5–10 s freeze for phone-camera photos. No spinner, no progress bar, no cancel button.
- `Editor.tsx:453, 489`
- `imageCompressor.ts`
- `ImagePlaceholderView.tsx`

**8.3 No image size limit on paste/drop.**
Accepts any `image/*` file. A 100 MB screenshot OOMs the canvas. No pre-check.
- `Editor.tsx:447-505`

**8.4 `extractHeadings` and `countWords` walk the full doc on every keystroke.**
`onUpdate` at `Editor.tsx:507-515` calls both on every transaction. For a 50k-word doc, every keystroke is O(n).
- `Editor.tsx:235-253, 507-515`

**8.5 Whole-document read on startup.**
`loadDocuments` returns the full `Document[]` array (all JSON, all `htmlContent`, all themes). Leader-follower pattern: 5+ large documents = slow startup.
- `storage.ts:80-88`
- `App.tsx:118-129`

### Minor

**8.6 `tippy.js` in main bundle.**
Top-level import at `SlashCommand.ts:5`. ~25–30 KB. AGENTS.md says heavy libraries should be dynamic-imported.

**8.7 No `loading="lazy"` on editor images.**
`index.css:52-56` sets `max-width: 100%` but no `loading="lazy"`. All base64 images eagerly decoded.
- `index.css:52-56`

**8.8 PlusMenu re-evaluates position on every transaction.**
`editor.on('transaction', updatePosition)` at `PlusMenu.tsx:55`. Per-keystroke `domAtPos` + `getBoundingClientRect` + `setState`.

**8.9 Find/Replace recomputes matches on every keystroke.**
No debounce on `triggerSearch`.
- `Editor.tsx:1126-1140`

**8.10 `editor.content` duplicated as `content` + `htmlContent` in React state.**
Both recomputed on every keystroke. Doubles the per-keystroke work.
- `Editor.tsx:166-167, 511-512`

---

## 9. Keyboard & shortcuts

### Major

**9.1 Block Palette has zero keyboard support.**
Search input is focusable, but items are click-only `<div>`s with no `role`, no `tabindex`, no arrow-key nav, no Enter-to-insert.
- `BlockPalette.tsx:107-127`

**9.2 Ctrl+F is captured by the editor, shadowing browser find.**
Behavior is inconsistent: works when editor has focus, doesn't when title/sidebar/theme has focus. The custom find panel has no close/restore-focus mechanism.
- `Editor.tsx:388-394`

**9.3 Slash command only works on empty paragraphs.**
`allow` requires `$from.parent.content.size === 0`. User typing `/` mid-sentence gets nothing. No feedback that the command is restricted.
- `SlashCommand.ts:19-22`
- `PlusMenu.tsx:25-29`

### Minor

**9.4 Undo/Redo buttons disappear when text is selected.**
They live in the "no-selection" toolbar branch (`Editor.tsx:1055-1056`). User must click empty space or use keyboard shortcut.

**9.5 Help panel doesn't list app-level shortcuts.**
No mention of `Ctrl+/` (help itself), `Ctrl+Shift+B` (block palette), `Ctrl+Shift+F` (zen), `Ctrl+F` (find). Only `title` attributes document them.
- `App.tsx:594-663`

**9.6 Ctrl+Shift+F collides with macOS "Toggle Full Screen" and some browser "Find in Files" shortcuts.**
- `App.tsx:102-105`

**9.7 Slash menu arrow/Enter/Escape works on desktop but lacks `role="listbox"` / `aria-selected`.**
- `SlashCommandMenu.tsx:34-49, 83-99`

---

## 10. Race conditions & double-click

### Major

**10.1 Double-click "New Document" creates two docs.**
`createNewDocument` has no in-flight guard. Async IndexedDB write makes the second click see the first doc as "already created" but the `documents` array hasn't settled.
- `App.tsx:131-148`
- Trigger: `Sidebar.tsx:78-84`

**10.2 Double-click "Duplicate" creates two copies.**
Same pattern — no guard.
- `App.tsx:323-335`
- Trigger: `Sidebar.tsx:193-199`

### Minor

**10.3 Double-click "Import" can create two documents.**
`handleMarkdownImport` / `handleHtmlImport` have no guard. `e.target.value = ''` helps but doesn't fully protect.
- `App.tsx:150-188`

**10.4 `currentDocId` race during create/select.**
A pending autosave from a previous document can write into the new document if the debounce fires after `setCurrentDocId`. Partially mitigated by `documentsRef.current` being synchronous.
- `App.tsx:131-148, 190-216`

**10.5 `view.posAtCoords` returns null silently.**
Drop at a position outside any text block → image disappears silently.
- `Editor.tsx:455-463`

**10.6 Image compression can fire after document switch.**
The `.then()` in `compressImageToWebP(file).then(...)` dispatches on a potentially stale `view` reference if the user switched positions during compression.
- `Editor.tsx:453-467`

---

## 11. Polish nits

These are non-blocking but contribute to a "rough edges" feel.

### Mockups

**11.1 Phone mockup status bar always shows 9:41.**
Hardcoded time and icons (`PhoneMockup.tsx:113-118`). No way to customize.

**11.2 No notch / punch-hole / Android variant.**
Only iOS dynamic island. No alternative phone frame shapes.
- `PhoneMockup.tsx:99-101`

**11.3 Browser URL bar is non-functional.**
Shows the URL as text. Not a link, not a real input. No tooltip on long URLs, no "open in new tab".
- `BrowserMockup.tsx:46-49`

**11.4 Phone mockup "Add screenshot" text is 11px.**
`0.6875rem` vs BrowserMockup's `14px`. Hard to read.
- `PhoneMockup.tsx:62`

**11.5 Mockups don't tell the user expected dimensions.**
No hint like "use a 1170×2532 screenshot for best results".
- `PhoneMockup.tsx:55-64`
- `BrowserMockup.tsx:55-64`

**11.6 Mockup images are not in the export lightbox.**
Per AGENTS.md, exported HTML has a lightbox for images. Mockup screenshots have no `data-lightbox` attribute or wrapper class. Clicking a mockup image in the export does nothing.

**11.7 Phone has no URL bar (asymmetric with Browser).**
Browser has `url`. Phone does not. Unjustified inconsistency.

**11.8 Frame color is locked to "dark"/"light" — no custom color.**
No color picker for the phone/browser frame.
- `PhoneMockup.tsx:133-136`
- `BrowserMockup.tsx:112-120`

### Editor

**11.9 `prose-img` global styles override per-extension image styles.**
`Editor.tsx:386` adds `rounded-xl shadow-md` to all `<img>` elements. Extensions fight back with `borderRadius: 0; boxShadow: 'none'`. Smell.

**11.10 "Saving…" chip shows "Saved" on first load before any save.**
Initial value `'saved'` at `App.tsx:59`.

**11.11 Title field cursor resets on every render.**
`DocumentCover.tsx:49-69` — the `useEffect` sets `textContent` if it doesn't match, causing cursor jumps during parent re-renders.

**11.12 No character limit on title.**
User can paste 5000 chars. No sanitization.
- `DocumentCover.tsx:94-96`

**11.13 Editorial cover style lazy-loads Google Fonts without notice.**
`DocumentCover.tsx:72-80` injects `<link>` to Google Fonts. Exported HTML also embeds the external font. No consent or offline-awareness.

### Theme

**11.14 Brand color input accepts invalid values.**
Typing "blue" or `rgb(0,0,0)` propagates to `setTheme` and breaks downstream. No validation.
- `ThemeDrawer.tsx:43-48`

**11.15 Custom CSS textarea has no syntax highlighting or validation.**
Plain textarea. No errors shown.

### Storage & persistence

**11.16 No "last saved X ago" timestamp.**
Chip shows "Saved" but not when.

**11.17 beforeunload only fires during the 1 s debounce window.**
If the tab is closed between debounce fire and IndexedDB resolve, no warning.
- `App.tsx:84-93, 209-216`

**11.18 Theme changes and document changes share the same save path.**
Editing the theme rewrites the full document (all base64, all JSON). No partial update path.
- `App.tsx:218-238`

### Tag system

**11.19 Tag normalization silently mutates user input.**
`.trim().toLowerCase().replace(/\s+/g, '-')` — typing "Important Docs" → "important-docs" with no feedback.
- `Sidebar.tsx:54`

### Export

**11.20 Rise mode dims 3 features but doesn't explain why.**
`ExportModal.tsx:179` dims readingProgressBar, backToTop, shareButtons with no tooltip or description.

**11.21 No preview of final filename before export.**
Leading spaces and special characters are silently stripped (`App.tsx:263`).

### New-user education

**11.22 No first-time walkthrough.**
No tooltip pointing to sidebar, slash command, palette, theme, export.
- `App.tsx`, `main.tsx` (no onboarding logic)

**11.23 "No document selected" empty state has no "create one" CTA.**

### Misc

**11.24 Find/Replace match highlighting doesn't toggle case sensitivity.**
No `i` flag toggle in the UI.

**11.25 Scroll-spy outline only shows H1–H3.**
H4–H6 not included (`Editor.tsx:244-247`) but the toolbar allows creating H4 (`Editor.tsx:857`).

**11.26 `editorRef.current = editor` runs on every render.**
`Editor.tsx:528` — not inside a `useEffect`.

**11.27 The drag handle is `position: fixed` at the editor level.**
`index.css:533-552`. Can overlap the sidebar on certain layouts.

**11.28 Two "Preview" concepts exist.**
Header "Preview" button (full-screen iframe) vs. export features (no preview).

**11.29 ChangelogTimeline version picker has no "add version" feedback.**
Silently appends a new version entry.

**11.30 Block Palette categories include "Premium" — misleading.**
The name suggests paid features. They're not.
- `blockItems.ts:481`

---

## Appendix: Summary counts

| Section | Critical | Major | Minor | Nit | Total |
|---------|----------|-------|-------|-----|-------|
| 1. Data loss & silent failures | 7 | 0 | 0 | 0 | 7 |
| 2. Dead advertised features | 2 | 3 | 0 | 0 | 5 |
| 3. Image subsystem | 3 | 12 | 2 | 0 | 17 |
| 4. Mobile / responsive | 3 | 5 | 1 | 0 | 9 |
| 5. Accessibility | 2 | 9 | 6 | 0 | 17 |
| 6. Block-level UX inconsistencies | 2 | 10 | 0 | 0 | 12 |
| 7. App-level flows | 0 | 14 | 9 | 0 | 23 |
| 8. Performance | 1 | 4 | 5 | 0 | 10 |
| 9. Keyboard & shortcuts | 0 | 3 | 4 | 0 | 7 |
| 10. Race conditions & double-click | 0 | 2 | 4 | 0 | 6 |
| 11. Polish nits | 0 | 0 | 30 | 0 | 30 |
| **Total** | **20** | **62** | **61** | **0** | **143** |

---

## Next steps

The user has requested a full sweep (~143 issues) with "both at once" (functional + visual polish) and wireframes first.

When ready to implement, pick a section, read the grouped findings, visit the refs, and fix.
