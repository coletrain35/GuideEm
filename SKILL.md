---
name: guideem-authoring
description: Write, validate, and render GuideEm documentation guides (Markdown with interactive blocks) from the CLI, the local dev-server API, or the browser. Use when asked to create or edit a GuideEm guide.
---

# Authoring GuideEm guides

A guide is a Markdown file in `./guides/`. `npm run guide` turns it into one self-contained HTML file. Always validate before you hand a guide back.

## Workflow

1. `npm run guide -- blocks` to see every block with its exact syntax.
2. Write `guides/<slug>.md`.
3. `npm run guide -- validate guides/<slug>.md` and fix every warning.
4. `npm run guide -- render guides/<slug>.md dist/<slug>.html`.
5. Open the HTML and look at it. Do not assume it looks right.

Commands: `list [--json]`, `blocks [--json]`, `create --title T [--slug S] [--from file]`, `validate <file>`, `render <file> [out.html] [--rise]`.
If npm swallows a flag on Windows, pass the output path as the second argument or run `npx tsx scripts/guide-cli.ts ...`.

## File format

```markdown
---
title: Deployment Guide
tags: [ops, deploy]
primaryColor: "#4f46e5"
fontFamily: modern          # modern | editorial | technical
codeTheme: dark
hero:
  enabled: true
  style: gradient
  subtitle: One-line promise of what the reader gets.
features:
  stickyHeader: true
  readingProgressBar: true
---
```

Rules that are easy to get wrong:

- **The hero shows the title.** If `hero.enabled` is true, do not also write a `# Heading`. Use `##` for sections so the table of contents works.
- Blocks open with `:::name{attr="value"}` and close with a line containing only `:::`. Blocks can nest. Colons inside code fences are ignored.
- **Section blocks split on `### Heading`, never on `---`.** This applies to `workflow`, `timeline`, `card-grid`, `accordion`, and `tabs`. Each `###` is one step, card, item, or tab. Code fences inside a section are fine.
- Attribute names are exact: `card-grid` uses `cols`, `workflow` uses `accentColor` and `cardBg`.
- `grid` splits columns with a line `---column---`. `code-diff` splits before and after with `===after===`.
- `stat-row` takes `value | label | emoji` lines, or a JSON array of `{ value, prefix?, suffix?, label, icon? }`.
- `code-window` takes the code as its body and `title`, `language`, `theme` as attributes.
- Callouts: use `> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`, `> [!IMPORTANT]`, or `> [!CAUTION]`, or `:::callout{type="info|warning|success|danger"}`. Keep callouts to plain text.
- Diagrams are fenced ` ```mermaid ` blocks.
- Anything without a directive form (`bento-grid`, `sticky-scroll`, `changelog-timeline`) goes in a ` ```guide-block ` fence containing JSON. See the `blocks` output for each shape.

## Designing a good guide

Write it the way a person who cares about the reader would. Pick blocks for what the content *is*, not because they exist.

| Content | Use |
| --- | --- |
| Opening promise | Hero with a one-line subtitle |
| Ordered procedure (3 to 7 steps) | `workflow`, one `###` per step, with the command in the step |
| Several parallel options (OS, language, command) | `tabs` |
| A handful of named things with a sentence each | `card-grid` (`cols` 2 to 4) |
| Q&A, edge cases, troubleshooting | `accordion` |
| A real file or terminal session | `code-window` |
| Before and after | `code-diff` |
| Process or architecture | `mermaid` |
| One warning the reader must not miss | `callout` or alert |
| Reference data (options, fields) | A Markdown table |
| Release history | `changelog-timeline` |

Structure:

- Lead with a 1–2 paragraph prose introduction explaining what the tool/topic is and how it works before jumping into blocks.
- Most pages need only: cover hero, one `workflow` or `timeline`, one `code-window` or `tabs` block, scannable `###` reference subsections with Markdown tables, `:::section-divider{style="gradient"}:::` between major `##` sections, and an `accordion` at the bottom for troubleshooting/FAQ.
- **Never hide primary reference material (CLI commands, API endpoints, flags) inside `tabs` or `accordion`.** Reference sections must be visible on the page (`###` headings + code blocks + Markdown tables) so readers can scan and `Ctrl+F`. Reserve `tabs` for mutually exclusive environment variants (e.g., Local Dev vs. GitHub Actions CI, macOS vs. Windows).
- **Never repeat the same items in two consecutive blocks** (e.g., do not summarize 4 commands in a `card-grid` and then list the same 4 commands again below it).
- Style `workflow` blocks intentionally: pass `accentColor="indigo" cardBg="frost"` (or `mint`/`light-gray`) and give each `### Step {icon="..."}` a distinct icon (`edit`, `code`, `download`, `zap`, `check-circle`, `rocket`, `settings`).
- Use at most one or two callouts per page, with a bold lead-in (`> [!NOTE]\n> **Headline:** Explanation...`). Inline `<code>` inside callouts is supported.
- Do not add marketing filler to technical docs: no `stat-row` or `counter` of invented numbers, no testimonials, no announcement pills unless building a landing/portfolio page.

## Other interfaces

**Dev server** (`npm run dev`, port 3000): `GET /api/agent/schema`, `GET|POST /api/agent/docs`, `GET|DELETE /api/agent/docs/:slug`. The editor loads `./guides/` automatically; `?doc=<title-or-id>` opens one.

**Browser** (`window.guideEm`): `getBlocksCatalog()`, `listDocs()`, `getDoc(id?)`, `openDoc(id)`, `createDoc(markdownOrSpec, { syncToDisk })`, `updateDoc(id, updates)`, `deleteDoc(id)`, `insertBlock(blockIdOrSpecOrMarkdown)`, `setTheme(updates)`, `exportHTML(id?)`, `exportMarkdown(id?)`, `syncFromDisk()`.

**JSON guides** (`*.guide.json`): `{ "title", "tags", "theme", "blocks": [ { "type": "...", ... } ] }`, using the `jsonExample` shapes from `npm run guide -- blocks --json`.
