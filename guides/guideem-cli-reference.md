---
title: "GuideEm CLI Reference"
tags: [cli, reference, automation]
primaryColor: "#4f46e5"
fontFamily: modern
codeTheme: dark
hero:
  enabled: true
  style: mesh
  subtitle: "Create, validate, and compile self-contained HTML documentation from your terminal or CI pipeline."
features:
  stickyHeader: true
  scrollReveal: false
  darkModeSupport: false
  readingProgressBar: true
  backToTop: true
  printStylesheet: true
footer:
  enabled: true
  text: "GuideEm Documentation Engine"
  showBranding: true
---

The **GuideEm CLI** (`npm run guide`) lets you author guides as plain `.md` or `.guide.json` files in your repository and compile them into single-file, zero-dependency `.html` documents without opening a browser.

Every file saved in the `./guides/` directory is also watched by the development server (`npm run dev`), so you can draft a guide from the command line, preview or refine it visually in the block editor, and export the final HTML from either place.

## 1. Quick Start

Go from an empty folder to a standalone HTML guide in three steps:

:::workflow{accentColor="indigo" cardBg="frost"}
### Scaffold a new guide {icon="edit"}
Create a starter Markdown file in `./guides/` with preconfigured frontmatter and section headings:

```bash
npm run guide -- create --title "Production Deployment Runbook" --slug deployment-runbook
```

### Author in Markdown and blocks {icon="code"}
Open `guides/deployment-runbook.md` in your editor. Write standard Markdown for prose, tables, and code snippets, and drop in `:::block` directives for workflows, timelines, tabs, or accordions.

```bash
npm run guide -- validate guides/deployment-runbook.md
```

### Compile to standalone HTML {icon="download"}
Render the file into a self-contained HTML bundle with inlined styles, syntax highlighting, and interactive Table of Contents:

```bash
npm run guide -- render guides/deployment-runbook.md -o dist/deployment-runbook.html
```
:::

> [!NOTE]
> **Remember the `--` separator:** When invoking the CLI through `npm run guide -- ...`, the extra `--` tells npm to forward flags like `--title`, `--slug`, and `-o` to GuideEm instead of interpreting them as npm flags.

:::section-divider{style="gradient"}:::

## 2. Command Reference

All CLI commands run through `npm run guide -- <command>` (or directly via `npx tsx scripts/guide-cli.ts <command>`).

### `create` — Scaffold or import a guide

Writes a `.md` or `.guide.json` file into `./guides/` so it appears in the workspace and can optionally be compiled to HTML in a single step.

```bash
# Scaffold a new Markdown guide in ./guides/release-checklist.md
npm run guide -- create --title "Release Checklist" --slug release-checklist

# Import an existing Markdown file into ./guides/ and compile to HTML immediately
npm run guide -- create --from ./drafts/onboarding.md --slug onboarding -o ./dist/onboarding.html
```

| Flag | Short | Description |
| :--- | :--- | :--- |
| `--title <text>` | `-t` | Document title written to frontmatter and the cover header. |
| `--from <path>` | `-i` | Copy content from an existing `.md` or `.guide.json` file instead of using the starter template. |
| `--slug <slug>` | — | Filename slug inside `./guides/` (defaults to a slugified version of the title). |
| `--out <path>` | `-o` | Immediately compile and write standalone HTML to `<path>` after saving the guide. |
| `--rise` | — | Export using compact Rise/iframe layout (no sidebar Table of Contents, full-width container). |

### `render` — Compile a guide to standalone HTML

Compiles any `.md` or `.guide.json` file into a single `.html` file. Automatically runs `validate` first and prints warnings if any block syntax issues are detected.

```bash
# Render to a specific output path
npm run guide -- render guides/deployment-runbook.md -o dist/deployment-runbook.html

# Positional output path (convenient if your shell or npm version strips -o)
npm run guide -- render guides/deployment-runbook.md dist/deployment-runbook.html

# Render compact layout for embedding inside an LMS or iframe
npm run guide -- render guides/deployment-runbook.md -o dist/deployment-rise.html --rise
```

| Argument / Flag | Description |
| :--- | :--- |
| `<input>` | Path to the source `.md` or `.guide.json` file. |
| `-o, --out <path>` | Destination `.html` path (can also be passed as the second positional argument). Defaults to `<slug>.html` next to the input file. |
| `-t, --title <text>` | Override the document title from frontmatter for this render. |
| `--rise` | Strip outer chrome and sidebar Table of Contents for iframe / Articulate Rise embedding. |

### `validate` — Lint syntax and document structure

Checks a Markdown guide for unclosed `:::` directives, unknown block names, missing `###` section headings inside multi-step blocks, and layout anti-patterns. Exits with code `0` when clean or `1` when warnings are found.

```bash
npm run guide -- validate guides/deployment-runbook.md
```

### `list` & `blocks` — Inspect workspace guides and block schemas

Use `list` to see what guides exist in `./guides/`, and `blocks` to inspect the supported custom block types and their attributes.

```bash
# List all guides in ./guides/ (add --json for machine-readable output)
npm run guide -- list

# Print every custom block type, its attributes, and a copy-paste Markdown example
npm run guide -- blocks
```

:::section-divider{style="gradient"}:::

## 3. Anatomy of a Guide File

A GuideEm Markdown file combines optional YAML frontmatter (for theme and cover settings), standard GitHub-Flavored Markdown (for prose, code snippets, and tables), and `:::block` directives for interactive components.

:::code-window{title="guides/deployment-runbook.md" language="markdown" theme="dark"}
---
title: "Production Deployment Runbook"
tags: [ops, kubernetes, release]
primaryColor: "#4f46e5"
fontFamily: modern
hero:
  enabled: true
  style: gradient
  subtitle: "Standard operating procedure for zero-downtime production rollouts."
---

Before starting a rollout, confirm that staging smoke tests are green and no incident freeze is active in `#ops-releases`.

## 1. Pre-Flight Checks

> [!WARNING]
> **Database migrations:** Always run backward-compatible schema migrations *before* deploying application containers.

```bash
kubectl config use-context prod-us-east
npm run db:migrate:status
```

## 2. Rollout Sequence

:::timeline{accentColor="indigo" markerStyle="number"}
### Tag the release {date="T-10 min"}
Create a signed Git tag and push it to trigger the container build.

### Apply the deployment manifest {date="T-0 min"}
Roll out the new image digest and watch pod readiness probes.

### Verify golden metrics {date="T+5 min"}
Check error rates and p95 latency in Grafana before closing the release ticket.
:::
:::

### Directive Block Quick Reference

Use custom blocks selectively—typically 2 to 4 per guide—to break up long sequences of text or highlight multi-step flows:

| Syntax | Best used for | How inner items are separated |
| :--- | :--- | :--- |
| `> [!NOTE]` / `> [!WARNING]` / `> [!TIP]` | Important callouts, prerequisites, and gotchas | Standard Markdown blockquote lines (`> ...`) |
| `:::workflow{accentColor="indigo" cardBg="frost"}` | Step-by-step procedures with icons and commands | Start each step with `### Step Title {icon="edit"}` |
| `:::timeline{accentColor="blue" markerStyle="number"}` | Chronological sequences, phases, or release stages | Start each milestone with `### Title {date="Phase 1"}` |
| `:::tabs` | Environment-specific instructions (e.g., macOS vs. Linux, npm vs. Docker) | Start each tab with `### Tab Label` |
| `:::accordion` | Optional deep-dives, troubleshooting, and FAQs | Start each collapsible row with `### Question` |
| `:::card-grid{cols="3"}` | Short feature overviews or architectural pillars | Start each card with `### 🚀 Card Title` |
| ```` ```mermaid ```` | Flowcharts, sequence diagrams, and architecture graphs | Standard Mermaid diagram syntax inside the code fence |

:::section-divider{style="gradient"}:::

## 4. Workflows & CI Integration

Select your environment below for copy-paste setup instructions:

:::tabs
### Local Dev Server + Editor
Run the Vite development server when you want to preview your CLI-authored guides in the browser or fine-tune them visually:

```bash
npm run dev
```

1. Any `.md` or `.guide.json` file in `./guides/` is automatically imported into the browser app at `http://localhost:3000`.
2. Open a specific guide directly by passing `?doc=<Title or Slug>` in the URL (for example, `http://localhost:3000/?doc=GuideEm%20CLI%20Reference`).
3. In the browser console, `await window.guideEm.syncFromDisk()` pulls the latest edits from `./guides/` without reloading the page.

### GitHub Actions / CI
Compile every Markdown guide in `./guides/` into standalone HTML artifacts automatically on push:

```yaml
name: Build Guides
on: [push]

jobs:
  render-guides:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Compile all Markdown guides
        run: |
          for file in guides/*.md; do
            name=$(basename "$file" .md)
            npx tsx scripts/guide-cli.ts render "$file" -o "dist/guides/$name.html"
          done
      - uses: actions/upload-artifact@v4
        with:
          name: html-guides
          path: dist/guides/*.html
```

### Direct `npx tsx` (No `npm run`)
If you are calling the CLI from a script or Windows PowerShell where npm's `--` flag forwarding is inconvenient, invoke `scripts/guide-cli.ts` directly with `npx tsx`:

```bash
npx tsx scripts/guide-cli.ts validate guides/guideem-cli-reference.md
npx tsx scripts/guide-cli.ts render guides/guideem-cli-reference.md -o dist/guideem-cli-reference.html
```
:::

:::section-divider{style="gradient"}:::

## 5. Troubleshooting

:::accordion
### Why was my `-o` or `--title` flag ignored when running `npm run guide`?
If you omit the `--` separator after `npm run guide` (for example, `npm run guide render file.md -o out.html`), npm intercepts `-o` and `--title` before starting the script. Either include the `--` (`npm run guide -- render file.md -o out.html`), pass the output path as the second positional argument (`npm run guide -- render file.md out.html`), or run `npx tsx scripts/guide-cli.ts` directly.

### Why did my workflow, timeline, or accordion render as a single block?
Multi-item directives (`:::workflow`, `:::timeline`, `:::accordion`, `:::tabs`, and `:::card-grid`) split their items on `### Heading` lines—not horizontal rules (`---`). Start every step, tab, card, or FAQ question with `### Your Heading`, and run `npm run guide -- validate <file.md>` to catch formatting issues before rendering.

### Why did my document title appear twice at the top of the page?
GuideEm always renders the document's `title` inside the cover header at the top of the page. You do not need to repeat `# Document Title` as an H1 on the first line of your Markdown body—start your body with an introductory paragraph and use `##` (`<h2>`) for top-level sections.
:::
