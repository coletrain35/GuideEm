# Visual Flair Implementation Plan

> 14 new visual features for DocuBlock Author, organized into 4 phases.

---

## Context

DocuBlock Author currently has 10 custom Tiptap extensions, a theme system, and a standalone HTML exporter. This plan adds gradient/animated text, interactive blocks, motion effects, and visual polish to make exported documents more visually striking. Every feature must work in both the editor and the self-contained HTML export.

---

## Architecture Notes

Every feature follows the same integration pattern:

1. **Extension file** in `src/extensions/` — pure TS (Mark/Node) or React NodeView (.tsx)
2. **Registration** in `src/components/Editor.tsx` — import + extensions array
3. **Menu integration** — Marks → BubbleMenu (text selection); Nodes → FloatingMenu (empty line)
4. **Editor CSS** in `src/index.css` under `@layer components`
5. **Export handling** in `src/utils/exporter.ts` — DOM transformation, CSS in style block, JS in inlineJS block

---

## Phase 1: Text Effect Marks ✅ COMPLETE

These are the first custom Marks in the codebase (all current marks come from @tiptap packages).

### F1 — Gradient Text Mark

| | |
|---|---|
| **Complexity** | Medium |
| **Type** | Mark |
| **New file** | `src/extensions/GradientText.ts` |

**Extension:**
- `Mark.create<GradientTextOptions>()`, name: `gradientText`
- Attributes: `colorFrom` (default `#6366f1`), `colorTo` (default `#ec4899`), `direction` (default `to right`)
- `renderHTML` → `<span>` with inline `background: linear-gradient(...); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`
- `parseHTML` → match `span[data-gradient]`
- Commands: `setGradientText(attrs)`, `unsetGradientText()`

**Editor.tsx:**
- Add to BubbleMenu — button that opens a small popover with two color pickers + direction dropdown
- Call `editor.chain().focus().setGradientText({ colorFrom, colorTo, direction }).run()`

**Exporter:** No special handling needed — inline styles on `<span>` are self-contained.

---

### F2 — Animated Text Mark

| | |
|---|---|
| **Complexity** | Medium |
| **Type** | Mark |
| **New file** | `src/extensions/AnimatedText.ts` |

**Extension:**
- `Mark.create<AnimatedTextOptions>()`, name: `animatedText`
- Attributes: `animation` (`typewriter` | `fade-in-word` | `shimmer`, default `shimmer`)
- `renderHTML` → `<span data-animation="..." class="animated-text animated-text-${animation}">`
- Commands: `setAnimatedText(attrs)`, `unsetAnimatedText()`

**Editor.tsx:** BubbleMenu button — cycle or dropdown for animation type.

**index.css:** Simplified editor previews — shimmer gets a subtle background animation, typewriter gets a cursor border, fade-in-word gets an opacity pulse.

**Exporter:**
- CSS: `@keyframes shimmer-text`, `@keyframes fade-in-word` definitions
- JS: IntersectionObserver adds `.animate-active` class on scroll-into-view

---

### F3 — Text Badge/Chip Mark

| | |
|---|---|
| **Complexity** | Simple |
| **Type** | Mark |
| **New file** | `src/extensions/TextBadge.ts` |

**Extension:**
- `Mark.create<TextBadgeOptions>()`, name: `textBadge`
- Attributes: `color` (default `#6366f1`)
- `renderHTML` → `<span class="text-badge" style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 0.75em; font-weight: 600; text-transform: uppercase;">`
- Commands: `setTextBadge(attrs)`, `unsetTextBadge()`

**Editor.tsx:** BubbleMenu button with a small color preset palette (blue, green, amber, red, purple).

**index.css:** `.text-badge` base styles.

**Exporter:** CSS for `.text-badge` + dark mode variants.

### Phase 1 Verification ✅
- Select text → apply each mark via BubbleMenu → verify editor rendering
- Toggle marks on/off → verify clean removal
- Verify marks compose with bold, italic, highlight
- Export → open HTML → gradient displays, animations trigger on scroll, badges render as pills

---

## Phase 2: Block-Level Visual Blocks

These follow the React NodeView pattern (like `Counter.tsx`, `CardGrid.tsx`).

### F4 — Hero Banner Block

| | |
|---|---|
| **Complexity** | Medium |
| **Type** | React Node (atom) |
| **New file** | `src/extensions/HeroBanner.tsx` |

**Extension:**
- Attributes: `backgroundType` (gradient/image), `gradientFrom`, `gradientTo`, `imageBase64`, `overlayOpacity`, `title`, `subtitle`, `ctaText`, `ctaUrl`
- React NodeView: full-width gradient or image background with overlaid text and CTA button
- When selected: edit panel with inputs for all attributes + image upload
- Uses `imageCompressor.ts` for uploaded images

**Editor.tsx:** FloatingMenu button (lucide `PanelTop` icon).

**Exporter:**
- DOM transform: query `div[data-type="hero-banner"]`, rebuild styled structure
- CSS: `.hero-banner` full-width layout, gradient/image background, text overlay positioning

---

### F5 — Stat/Metric Row

| | |
|---|---|
| **Complexity** | Medium |
| **Type** | React Node (parent/child) |
| **New file** | `src/extensions/StatRow.tsx` |

**Extension:**
- Parent `statRow` with `content: 'statItem{1,6}'`
- Child `statItem`: attributes `value`, `prefix`, `suffix`, `label`, `icon` (emoji)
- React NodeView: horizontal flex layout, "Add Stat" button when selected
- Reuses Counter animation pattern for count-up on scroll

**Editor.tsx:** FloatingMenu button (lucide `BarChart3` icon).

**Exporter:**
- DOM transform: flex row with stat items
- CSS: `.stat-row` flex container, `.stat-item` styling
- JS: reuse existing `animateCounter` + IntersectionObserver pattern

---

### F6 — Testimonial/Quote Card

| | |
|---|---|
| **Complexity** | Simple |
| **Type** | React Node (atom) |
| **New file** | `src/extensions/Testimonial.tsx` |

**Extension:**
- Attributes: `quote`, `authorName`, `authorRole`, `avatarUrl`
- React NodeView: card with large quote mark, text, author info with avatar circle
- When selected: edit panel with text inputs

**Editor.tsx:** FloatingMenu button (lucide `MessageSquareQuote` icon).

**Exporter:**
- DOM transform: rebuild into `.testimonial-card` structure
- CSS: quote styling, avatar circle, author info layout, dark mode variants

---

### F7 — Before/After Slider

| | |
|---|---|
| **Complexity** | Complex |
| **Type** | React Node (atom) |
| **New file** | `src/extensions/BeforeAfter.tsx` |

**Extension:**
- Attributes: `beforeImage` (base64), `afterImage` (base64), `sliderPosition` (0-100), `beforeLabel`, `afterLabel`
- React NodeView: both images with a draggable slider in editor; image upload buttons when selected
- Uses `imageCompressor.ts` for uploaded images

**Editor.tsx:** FloatingMenu button (lucide `SplitSquareHorizontal` icon).

**Exporter:**
- DOM transform: stacked images with draggable divider
- CSS: overlay positioning, `clip-path` for before image
- JS (~40 lines): mouse/touch drag handler adjusting `clip-path: inset(0 ${100-pos}% 0 0)` on the top image

---

### F8 — Code Diff Block

| | |
|---|---|
| **Complexity** | Medium |
| **Type** | React Node (atom) |
| **New file** | `src/extensions/CodeDiff.tsx` |

**Extension:**
- Attributes: `codeBefore`, `codeAfter`, `language` (default `javascript`), `mode` (`inline` | `side-by-side`)
- React NodeView: two code textareas when editing; preview shows diff with red/green line coloring
- Simple line-based diff algorithm (LCS) implemented directly — no external library

**Editor.tsx:** FloatingMenu button (lucide `GitCompare` icon).

**Exporter:**
- DOM transform: pre-compute diff HTML at export time
- CSS: `.code-diff`, `.diff-added` (green bg), `.diff-removed` (red bg), `.diff-unchanged`
- No JS needed — diff is pre-computed

### Phase 2 Verification
- Insert each block via FloatingMenu → edit attributes → verify editor rendering
- Export → verify: hero banner renders full-width, stat row counts up on scroll, testimonial displays, before/after slider is draggable, code diff shows colored lines
- Test with dark mode export enabled
- Test image compression for Hero Banner and Before/After

---

## Phase 3: Motion & Animation

### F9 — Scroll Reveal Animations (System-wide)

| | |
|---|---|
| **Complexity** | Medium |
| **Type** | Tiptap Extension (global attribute) |
| **New file** | `src/extensions/ScrollReveal.ts` |

**Extension:**
- `Extension.create()` using `addGlobalAttributes()` to add `scrollReveal` attribute to all block nodes
- Values: `none` | `fade-up` | `slide-left` | `slide-right` | `zoom-in`
- In editor: indicated with a small badge/icon on the block

**Editor.tsx:**
- Register extension
- Add a reveal-type selector in the sticky toolbar (visible when a block is selected)

**Exporter:**
- Enhances existing scroll reveal system (currently only supports a single `fade-up` on all elements)
- CSS: `@keyframes` and `.reveal-*` classes for each animation type
- JS: IntersectionObserver reads `data-reveal` attribute, applies the corresponding animation class

---

### F10 — Animated Gradient Dividers

| | |
|---|---|
| **Complexity** | Simple |
| **Type** | Extend existing |
| **Modified file** | `src/extensions/SectionDivider.tsx` |

**Changes:**
- Extend styles from `['gradient', 'solid', 'wave', 'dots']` to add `'animated-gradient'`, `'pulse'`, `'rainbow'`
- New cases in `DividerPreview`:
  - `animated-gradient`: shifting gradient position animation
  - `pulse`: line that pulses opacity
  - `rainbow`: gradient cycling through rainbow via hue-rotate

**index.css:** `@keyframes gradient-shift`, `@keyframes pulse-line`, `@keyframes rainbow-cycle`

**Exporter:** CSS for each new style with appropriate keyframe animations.

---

### F11 — Confetti/Celebration Block

| | |
|---|---|
| **Complexity** | Medium |
| **Type** | React Node (atom) |
| **New file** | `src/extensions/Confetti.tsx` |

**Extension:**
- Attributes: `message` (default "Congratulations!"), `emoji` (default "🎉"), `colors` (JSON array of hex colors)
- React NodeView: displays message with emoji and static confetti decoration
- When selected: edit inputs for message, emoji, colors

**Editor.tsx:** FloatingMenu button (lucide `PartyPopper` icon).

**Exporter:**
- DOM transform: rebuild into celebration block
- CSS: `.confetti-block` card styling
- JS (~80 lines): DOM-based confetti burst using `requestAnimationFrame`, triggered by IntersectionObserver, fires once per block, cleans up after ~3 seconds

### Phase 3 Verification
- Scroll reveal: export with different animation types per block → verify each triggers on scroll
- Animated dividers: cycle through all 7 styles → verify in editor and export
- Confetti: insert, export, scroll to block → verify burst fires once
- Verify `prefers-reduced-motion` disables all animations

---

## Phase 4: Visual Polish

### F12 — Glassmorphism Callouts

| | |
|---|---|
| **Complexity** | Simple |
| **Type** | Extend existing |
| **Modified file** | `src/extensions/Callout.ts` |

**Changes:**
- Extend type union to include `'glass-info'` | `'glass-warning'` | `'glass-success'`
- Update `parseHTML` to include new types

**Editor.tsx:** Add 3 glass callout buttons to FloatingMenu (or a "Glass" toggle variant).

**index.css:**
- `.callout.callout-glass-info`: `backdrop-filter: blur(12px); background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2);`
- Similar for glass-warning (amber), glass-success (emerald)

**Exporter:** Glassmorphism CSS + dark mode variants.

---

### F13 — Syntax-Highlighted Inline Code

| | |
|---|---|
| **Complexity** | Complex |
| **Type** | Custom Mark (overrides default) |
| **New file** | `src/extensions/InlineCode.ts` |

**Extension:**
- Custom Mark overriding the default `code` mark from StarterKit
- Adds attribute: `language` (string, default empty)
- `renderHTML` → `<code data-language="..." class="inline-code lang-${language}">`

**Editor.tsx:**
- Disable default `code` mark in StarterKit (`code: false`)
- Register custom InlineCode
- BubbleMenu: replace "Code" button with dropdown for language selection (js, py, html, css, bash, none)

**index.css:** Language-specific background tints via `code[data-language="js"]`, `code[data-language="py"]`, etc.

**Exporter:** Language-specific CSS + dark mode variants. Note: this is language-labeling with colored indicators, not full syntax parsing of inline code content.

---

### F14 — Image Effects

| | |
|---|---|
| **Complexity** | Medium |
| **Type** | Extend existing |
| **Modified files** | `src/extensions/AnnotatedImage.ts`, `src/components/AnnotatedImageView.tsx` |

**Changes:**
- Add `effect` attribute: `none` | `tilt-on-hover` | `polaroid` | `film-strip`
- AnnotatedImageView: "Effects" dropdown in edit controls when selected
- Apply preview CSS classes per effect

**index.css:**
- `tilt-on-hover`: subtle perspective transform on hover
- `polaroid`: white border, slight rotation, shadow, caption area
- `film-strip`: dark border with repeating sprocket hole pattern

**Exporter:**
- CSS for each effect
- JS (~20 lines): mousemove handler for tilt-on-hover dynamic tilt based on cursor position

### Phase 4 Verification
- Glass callouts: insert each variant → verify backdrop-blur in editor and export
- Inline code: select text → apply with language → verify colored indicators
- Image effects: insert image → cycle effects → verify each in editor and export
- Test all with dark mode enabled
- Test print stylesheet degrades gracefully

---

## Cross-Cutting Concerns

### Accessibility: `prefers-reduced-motion`
Add to export CSS:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Dark Mode
Every new CSS class in `exporter.ts` needs `@media (prefers-color-scheme: dark)` and `html.dark` rules.

### Print Stylesheet
- Animated dividers → show static version
- Before/after slider → show both images stacked
- Confetti block → show message only
- All animations → disabled via `@media print`

### TypeScript
Each new Mark needs `declare module '@tiptap/core'` for command type augmentation.

### Icons
New lucide-react imports for Editor.tsx: `Sparkles`, `Badge`, `PanelTop`, `BarChart3`, `MessageSquareQuote`, `SplitSquareHorizontal`, `GitCompare`, `PartyPopper`, `Glasses`, `Paintbrush`.

---

## Implementation Order

| # | Feature | New File | Complexity |
|---|---------|----------|------------|
| 1 | ~~F3: Text Badge~~ | ~~`TextBadge.ts`~~ | ~~Simple~~ | ✅ |
| 2 | ~~F1: Gradient Text~~ | ~~`GradientText.ts`~~ | ~~Medium~~ | ✅ |
| 3 | ~~F2: Animated Text~~ | ~~`AnimatedText.ts`~~ | ~~Medium~~ | ✅ |
| 4 | F12: Glass Callouts | — (modify Callout.ts) | Simple |
| 5 | F10: Animated Dividers | — (modify SectionDivider.tsx) | Simple |
| 6 | F6: Testimonial Card | `Testimonial.tsx` | Simple |
| 7 | F4: Hero Banner | `HeroBanner.tsx` | Medium |
| 8 | F5: Stat Row | `StatRow.tsx` | Medium |
| 9 | F14: Image Effects | — (modify AnnotatedImage) | Medium |
| 10 | F8: Code Diff | `CodeDiff.tsx` | Medium |
| 11 | F13: Inline Code | `InlineCode.ts` | Complex |
| 12 | F9: Scroll Reveal | `ScrollReveal.ts` | Medium |
| 13 | F11: Confetti | `Confetti.tsx` | Medium |
| 14 | F7: Before/After | `BeforeAfter.tsx` | Complex |

**Rationale:** Simple features first to establish patterns, existing file modifications before new complex files, JS-heavy interactive features last.

---

## File Summary

**New files (10):**
- `src/extensions/GradientText.ts`
- `src/extensions/AnimatedText.ts`
- `src/extensions/TextBadge.ts`
- `src/extensions/HeroBanner.tsx`
- `src/extensions/StatRow.tsx`
- `src/extensions/Testimonial.tsx`
- `src/extensions/BeforeAfter.tsx`
- `src/extensions/CodeDiff.tsx`
- `src/extensions/ScrollReveal.ts`
- `src/extensions/Confetti.tsx`

**Modified files (6, touched repeatedly):**
- `src/components/Editor.tsx` — every feature: import, register, menu button
- `src/utils/exporter.ts` — every feature: DOM transform, CSS, JS
- `src/index.css` — ~8 features: editor preview styles
- `src/extensions/Callout.ts` — glass variants
- `src/extensions/SectionDivider.tsx` — animated styles
- `src/extensions/AnnotatedImage.ts` + view component — image effects
