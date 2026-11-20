---
title: Writing Guides with an AI Agent
tags: [agents, guides]
primaryColor: "#4f46e5"
fontFamily: modern
hero:
  enabled: true
  style: gradient
  subtitle: Everything an agent needs to write, check, and publish a GuideEm guide.
features:
  stickyHeader: true
  readingProgressBar: true
---

## The workflow

:::workflow
### Look up the blocks
Print every block with its exact syntax.

```bash
npm run guide -- blocks
```

### Write the guide
Create `guides/<slug>.md` in Markdown. Use blocks where they help the reader.

### Validate
Catch unclosed blocks, wrong separators, and unknown block names before they reach the page.

```bash
npm run guide -- validate guides/<slug>.md
```

### Render and look
Build the HTML, then open it and check it.

```bash
npm run guide -- render guides/<slug>.md dist/<slug>.html
```
:::

## Three ways in

:::card-grid{cols="3"}
### 📁 Files
Write Markdown into `guides/` and use the CLI. Best for agents with file access.

### 🌐 Dev server
Read and write guides over `/api/agent/docs` while `npm run dev` is running.

### 🖥️ Browser
Call `window.guideEm` from a browser-automation agent to edit the live editor.
:::

## Choosing the right block

| You have | Use |
| --- | --- |
| An ordered procedure | `workflow` |
| Parallel options such as OS or language | `tabs` |
| A few named things with one sentence each | `card-grid` |
| Questions and edge cases | `accordion` |
| A terminal session or file | `code-window` |
| A process or architecture | `mermaid` |

The full rules and design guidance are in `SKILL.md`.
