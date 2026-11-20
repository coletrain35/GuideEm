import fs from 'fs';
import path from 'path';
import { installMiniDomPolyfill } from '../src/utils/miniDom';
import { parseGuideInput } from '../src/utils/markdownImporter';
import { AGENT_BLOCK_CATALOG } from '../src/utils/agentSchema';
import { generateHTML, generateCollectionHTML } from '../src/utils/exporter';
import { loadGuidesFromDir } from '../src/server/agentBridgePlugin';
import type { ThemeConfig } from '../src/utils/storage';

installMiniDomPolyfill();

function loadCompiledCss(): string {
  try {
    const assetsDir = path.resolve(process.cwd(), 'dist', 'assets');
    if (!fs.existsSync(assetsDir)) {
      console.warn('Warning: No compiled CSS found in dist/assets/. Run "npm run build" first for full Tailwind styling.');
      return '';
    }
    const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
    if (cssFiles.length === 0) {
      console.warn('Warning: No compiled CSS found in dist/assets/. Run "npm run build" first for full Tailwind styling.');
      return '';
    }
    return cssFiles.map(f => fs.readFileSync(path.join(assetsDir, f), 'utf8')).join('\n');
  } catch {
    return '';
  }
}

const DEFAULT_CLI_THEME: ThemeConfig = {
  primaryColor: '#2563eb',
  fontFamily: 'modern',
  hero: {
    style: 'none',
    enabled: false,
    coverImageBase64: null,
    subtitle: '',
    layout: 'full',
  },
  features: {
    stickyHeader: true,
    scrollReveal: false,
    darkModeSupport: false,
    readingProgressBar: false,
    backToTop: false,
    printStylesheet: true,
    shareButtons: false,
    searchBar: true,
  },
  footer: {
    enabled: false,
    text: '',
    links: [],
    showBranding: true,
  },
  codeTheme: 'dark',
};

function mergeTheme(partial?: Partial<ThemeConfig>): ThemeConfig {
  return {
    ...DEFAULT_CLI_THEME,
    ...(partial || {}),
    hero: { ...DEFAULT_CLI_THEME.hero, ...(partial?.hero || {}) },
    features: { ...DEFAULT_CLI_THEME.features, ...(partial?.features || {}) },
    footer: {
      ...DEFAULT_CLI_THEME.footer!,
      ...(partial?.footer || {}),
      links: partial?.footer?.links ?? DEFAULT_CLI_THEME.footer!.links,
    },
  };
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'untitled-guide'
  );
}

function getArg(args: string[], flag: string, shortFlag?: string): string | undefined {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag || (shortFlag && args[i] === shortFlag)) {
      return args[i + 1];
    }
    if (args[i].startsWith(`${flag}=`)) {
      return args[i].slice(flag.length + 1);
    }
  }
  // npm may consume unknown flags and expose them as npm_config_<name> env vars.
  for (const f of [flag, shortFlag]) {
    if (!f) continue;
    const v = process.env[`npm_config_${f.replace(/^-+/, '').replace(/-/g, '_')}`];
    if (v && v !== 'true') return v;
  }
  return undefined;
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag) || process.env[`npm_config_${flag.replace(/^-+/, '')}`] === 'true';
}

const SECTION_BLOCKS = new Set(['workflow', 'timeline', 'card-grid', 'cards', 'accordion', 'tabs', 'tab-group']);
const HEAVY_WIDGET_BLOCKS = new Set(['card-grid', 'cards', 'bento-grid', 'tabs', 'tab-group', 'stat-row', 'stats', 'workflow', 'timeline', 'accordion']);

/**
 * Static checks for syntax mistakes and design anti-patterns (like "widget soup").
 * Returns human-readable warnings; never throws.
 */
export function lintGuide(raw: string): string[] {
  const warnings: string[] = [];
  const known = new Set<string>([
    ...AGENT_BLOCK_CATALOG.map(b => b.type),
    'cards', 'stats', 'tab-group', 'divider', 'counter', 'background-section',
  ]);
  const lines = raw.replace(/\r\n/g, '\n').split('\n');

  const fmEnd = lines[0]?.trim() === '---' ? lines.indexOf('---', 1) : -1;
  const frontmatter = fmEnd > 0 ? lines.slice(1, fmEnd).join('\n') : '';
  if (fmEnd < 0) warnings.push('No frontmatter: add a title (and optionally tags/theme) between --- lines at the top.');
  else if (!/^title:/m.test(frontmatter)) warnings.push('Frontmatter has no `title:`.');

  let fence: string | null = null;
  const stack: Array<{ name: string; line: number; hasHeading: boolean }> = [];
  let h1Count = 0;
  let h2Count = 0;
  let widgetBlockCount = 0;
  let lastClosedWidget: { name: string; line: number } | null = null;
  let proseLinesSinceLastWidget = 0;

  lines.forEach((line, idx) => {
    const n = idx + 1;
    if (idx <= fmEnd) return;
    const fm = line.match(/^\s*(`{3,}|~{3,})/);
    if (fm) {
      if (!fence) fence = fm[1];
      else if (fm[1][0] === fence[0] && fm[1].length >= fence.length) fence = null;
      return;
    }
    if (fence) return;

    if (/^# /.test(line)) h1Count++;
    if (/^## /.test(line)) h2Count++;

    const open = line.match(/^:::([a-zA-Z0-9_-]+)(?:\{([^}]*)\})?\s*$/);
    if (open) {
      const name = open[1].toLowerCase();
      if (HEAVY_WIDGET_BLOCKS.has(name)) {
        widgetBlockCount++;
        if (lastClosedWidget && proseLinesSinceLastWidget === 0) {
          warnings.push(
            `Line ${n}: ":::${name}" immediately follows ":::${lastClosedWidget.name}" (line ${lastClosedWidget.line}) with no explanatory prose or heading in between. Avoid stacking back-to-back widgets.`
          );
        }
      }
      if (!known.has(name)) warnings.push(`Line ${n}: unknown block ":::${open[1]}". Run \`npm run guide -- blocks\` for valid names.`);
      if (name === 'accordion' && /title=/.test(open[2] || '')) {
        warnings.push(`Line ${n}: accordion takes one "### Question" heading per item, not a title attribute.`);
      }
      if (/\bcolumns=/.test(open[2] || '') && name === 'card-grid') {
        warnings.push(`Line ${n}: use cols="2|3|4" on card-grid (columns is accepted but cols is canonical).`);
      }
      stack.push({ name, line: n, hasHeading: false });
      return;
    }
    if (/^:::\s*$/.test(line)) {
      const top = stack.pop();
      if (!top) warnings.push(`Line ${n}: closing ::: with no open block.`);
      else {
        if (SECTION_BLOCKS.has(top.name) && !top.hasHeading) {
          warnings.push(`Line ${top.line}: ":::${top.name}" has no "### Heading" sections, so it will render as one empty step.`);
        }
        if (HEAVY_WIDGET_BLOCKS.has(top.name)) {
          lastClosedWidget = { name: top.name, line: top.line };
          proseLinesSinceLastWidget = 0;
        }
      }
      return;
    }
    const top = stack[stack.length - 1];
    if (top) {
      if (/^#{2,4}\s/.test(line)) top.hasHeading = true;
      if (SECTION_BLOCKS.has(top.name) && /^-{3,}\s*$/.test(line)) {
        warnings.push(`Line ${n}: "---" does not separate sections inside ":::${top.name}". Start each section with "### Heading".`);
      }
      if (top.name === 'stat-row' && /^\s*\{/.test(line) && !/^\s*[\[{]/.test(lines[idx - 1] || '[')) {
        warnings.push(`Line ${n}: stat-row expects "value | label" lines or a JSON array.`);
      }
    } else if (line.trim() && !line.trim().startsWith(':::')) {
      proseLinesSinceLastWidget++;
    }
  });

  for (const open of stack) warnings.push(`Line ${open.line}: ":::${open.name}" is never closed (needs a line containing only :::).`);
  if (fence) warnings.push('A code fence is never closed; everything after it will render as code.');
  if (h1Count > 0) {
    warnings.push('GuideEm already renders the document `title` in the cover header. Avoid `# Heading` in the body; use `## Section` for top-level sections.');
  }
  if (h2Count === 0 && widgetBlockCount === 0) warnings.push('No "## " sections: the page will have no table of contents.');
  if (h2Count > 0 && widgetBlockCount > h2Count + 2) {
    warnings.push(
      `Design warning: ${widgetBlockCount} heavy widget blocks across ${h2Count} section(s). Human-authored guides rely primarily on clear prose, headings, code blocks, and tables, using 2–4 custom blocks where they genuinely clarify structure.`
    );
  }
  return warnings;
}

function reportLint(raw: string) {
  const warnings = lintGuide(raw);
  if (warnings.length === 0) return;
  console.warn(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  - ${w}`);
  console.warn('');
}

function printHelp() {
  console.log(`
GuideEm Agent CLI — Create, sync, and export rich documentation guides

Usage:
  npm run guide -- list
      List all guides in the ./guides workspace directory.

  npm run guide -- blocks [--json]
      Print all available custom GuideEm blocks, attributes, and examples.

  npm run guide -- validate <input.md>
      Check a guide for common mistakes (unclosed blocks, wrong separators,
      unknown block names, duplicate titles, widget overuse). Also runs on render.

  npm run guide -- render <input.md | input.guide.json> [-o output.html] [--rise]
      Compile a GuideEm Markdown (.md) or JSON (.guide.json) file directly
      into a standalone interactive HTML file.

  npm run guide -- create --title "Guide Title" [--from <file.md|file.json>] [--slug <slug>] [-o <output.html>]
      Save a guide into ./guides/ (auto-synced into the live GuideEm browser editor)
      and optionally export standalone HTML.
`);
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const guidesDir = path.resolve(process.cwd(), 'guides');

  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    printHelp();
    return;
  }

  if (cmd === 'list') {
    const docs = loadGuidesFromDir(guidesDir);
    if (args.includes('--json')) {
      console.log(JSON.stringify(docs, null, 2));
      return;
    }
    if (docs.length === 0) {
      console.log('No guides found in ./guides/');
      return;
    }
    console.log(`Found ${docs.length} guide(s) in ./guides/:\n`);
    for (const d of docs) {
      console.log(`- [${d.slug}] "${d.title}" (${d.fileName})`);
    }
    return;
  }

  if (cmd === 'blocks' || cmd === 'schema') {
    if (args.includes('--json')) {
      console.log(JSON.stringify(AGENT_BLOCK_CATALOG, null, 2));
      return;
    }
    console.log(`GuideEm Custom Block Catalog (${AGENT_BLOCK_CATALOG.length} blocks):\n`);
    for (const b of AGENT_BLOCK_CATALOG) {
      console.log(`### ${b.type} (${b.category}) — ${b.description}`);
      console.log(`Attributes: ${JSON.stringify(b.attrs)}`);
      console.log(`Markdown:\n${b.markdownExample}\n`);
    }
    return;
  }

  if (cmd === 'validate' || cmd === 'lint') {
    const inputPath = args[1];
    if (!inputPath) {
      console.error('Usage: npm run guide -- validate <input.md>');
      process.exit(1);
    }
    const resolvedIn = path.resolve(process.cwd(), inputPath);
    if (!fs.existsSync(resolvedIn)) {
      console.error(`Error: Input file not found: ${resolvedIn}`);
      process.exit(1);
    }
    const warnings = lintGuide(fs.readFileSync(resolvedIn, 'utf8'));
    if (warnings.length === 0) {
      console.log('OK: no problems found.');
      return;
    }
    for (const w of warnings) console.log(`- ${w}`);
    process.exit(1);
  }

  if (cmd === 'render') {
    const inputPath = args[1] && !args[1].startsWith('-') ? args[1] : getArg(args, '--from', '-i');
    if (!inputPath) {
      console.error('Error: Missing input file path. Usage: npm run guide -- render <input.md|input.json> [-o output.html]');
      process.exit(1);
    }
    const resolvedIn = path.resolve(process.cwd(), inputPath);
    if (!fs.existsSync(resolvedIn)) {
      console.error(`Error: Input file not found: ${resolvedIn}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(resolvedIn, 'utf8');
    reportLint(raw);
    const parsed = parseGuideInput(raw);
    const titleOverride = getArg(args, '--title', '-t');
    const finalTitle = titleOverride || parsed.title || path.basename(resolvedIn, path.extname(resolvedIn));
    const isRise = hasFlag(args, '--rise') || getArg(args, '--mode') === 'rise';
    const theme = mergeTheme(parsed.theme);
    const extraCss = loadCompiledCss();

    const html = generateHTML(finalTitle, parsed.htmlContent, theme, {
      ...(isRise ? { mode: 'rise' } : {}),
      ...(extraCss ? { extraCss } : {}),
    });
    const outArg = getArg(args, '--out', '-o') || (args[2] && !args[2].startsWith('-') ? args[2] : undefined);
    const outPath = outArg
      ? path.resolve(process.cwd(), outArg)
      : path.resolve(path.dirname(resolvedIn), `${slugify(finalTitle)}.html`);

    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`Rendered standalone HTML guide: ${outPath} (${(Buffer.byteLength(html, 'utf8') / 1024).toFixed(1)} KB)`);
    return;
  }

  if (cmd === 'create') {
    const fromPath = getArg(args, '--from', '-i');
    const titleArg = getArg(args, '--title', '-t');
    const slugArg = getArg(args, '--slug');
    const outArg = getArg(args, '--out', '-o');
    const isRise = hasFlag(args, '--rise');

    let rawInput = '';
    if (fromPath) {
      const resolvedIn = path.resolve(process.cwd(), fromPath);
      if (!fs.existsSync(resolvedIn)) {
        console.error(`Error: File not found: ${resolvedIn}`);
        process.exit(1);
      }
      rawInput = fs.readFileSync(resolvedIn, 'utf8');
    } else {
      const title = titleArg || 'Untitled Guide';
      rawInput = `---\ntitle: ${JSON.stringify(title)}\nprimaryColor: "#4f46e5"\nfontFamily: modern\nhero:\n  enabled: true\n  style: gradient\n  subtitle: "A short summary of what this guide covers and who it is for."\n---\n\nWrite a short introductory paragraph explaining the goal of this guide before diving into the steps.\n\n## 1. Prerequisites\n\n- Node.js 18 or later\n- Project dependencies installed (\`npm install\`)\n\n## 2. Quick Start\n\n\`\`\`bash\nnpm run dev\n\`\`\`\n`;
    }

    const parsed = parseGuideInput(rawInput);
    const finalTitle = titleArg || parsed.title || 'Untitled Guide';
    const slug = slugify(slugArg || finalTitle);

    fs.mkdirSync(guidesDir, { recursive: true });

    const isJsonInput = rawInput.trim().startsWith('{');
    const targetFile = path.join(guidesDir, isJsonInput ? `${slug}.guide.json` : `${slug}.md`);

    if (isJsonInput) {
      const obj = JSON.parse(rawInput);
      obj.id = obj.id || `file:${slug}`;
      obj.title = finalTitle;
      obj.lastEdited = Date.now();
      fs.writeFileSync(targetFile, JSON.stringify(obj, null, 2), 'utf8');
    } else {
      fs.writeFileSync(targetFile, rawInput, 'utf8');
    }

    console.log(`Saved guide to workspace: ${targetFile}`);

    if (outArg) {
      const outPath = path.resolve(process.cwd(), outArg);
      const theme = mergeTheme(parsed.theme);
      const extraCss = loadCompiledCss();
      const html = generateHTML(finalTitle, parsed.htmlContent, theme, {
        ...(isRise ? { mode: 'rise' } : {}),
        ...(extraCss ? { extraCss } : {}),
      });
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html, 'utf8');
      console.log(`Exported standalone HTML: ${outPath}`);
    }
    return;
  }

  if (cmd === 'bundle') {
    const docs = loadGuidesFromDir(guidesDir);
    if (docs.length === 0) {
      console.error('No guides found in ./guides/ to bundle.');
      process.exit(1);
    }
    const portalTitle = getArg(args, '--title', '-t') || 'Documentation Portal';
    const outArg = getArg(args, '--out', '-o') || path.join(guidesDir, 'portal.html');
    const outPath = path.resolve(process.cwd(), outArg);
    const extraCss = loadCompiledCss();
    const html = generateCollectionHTML(
      docs.map(d => ({
        id: d.id,
        slug: d.slug,
        title: d.title,
        htmlContent: d.htmlContent,
        theme: mergeTheme(d.theme),
        tags: d.tags,
      })),
      portalTitle,
      DEFAULT_CLI_THEME,
      extraCss ? { extraCss } : undefined
    );
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`Bundled ${docs.length} guide(s) into portal: ${outPath} (${(Buffer.byteLength(html, 'utf8') / 1024).toFixed(1)} KB)`);
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  printHelp();
  process.exit(1);
}

main();
