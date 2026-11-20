import { marked } from 'marked';
import { sanitizeHtml, escapeHtml } from './sanitize';
import { blockSpecToHtml, type AgentBlockSpec, type AgentGuideSpec } from './agentSchema';
import type { ThemeConfig } from './storage';

// Configure marked for clean output
marked.setOptions({
  gfm: true,
  breaks: false,
});

export interface ParsedGuideMarkdown {
  title?: string;
  tags?: string[];
  theme?: Partial<ThemeConfig>;
  html: string;
}

/**
 * Parses key="value" or key=value pairs from a directive attribute block `{...}`
 */
function parseDirectiveAttrs(attrStr: string | undefined): Record<string, any> {
  const attrs: Record<string, any> = {};
  if (!attrStr) return attrs;
  const trimmed = attrStr.trim();
  if (!trimmed) return attrs;

  // Allow JSON object directly inside { ... }
  if (trimmed.startsWith('"') || trimmed.includes('":')) {
    try {
      return JSON.parse(`{${trimmed}}`);
    } catch {
      // Fall through to key=value regex parser
    }
  }

  const regex = /([a-zA-Z0-9_-]+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|'([^']*)'|([^\s}]+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(trimmed)) !== null) {
    const key = match[1];
    const rawVal = match[2] !== undefined
      ? match[2].replace(/\\(["\\])/g, '$1')
      : (match[3] ?? match[4] ?? '');
    if (rawVal === 'true') attrs[key] = true;
    else if (rawVal === 'false') attrs[key] = false;
    else if (/^-?\d+(\.\d+)?$/.test(rawVal) && !key.toLowerCase().includes('version')) {
      attrs[key] = Number(rawVal);
    } else if ((rawVal.startsWith('[') && rawVal.endsWith(']')) || (rawVal.startsWith('{') && rawVal.endsWith('}'))) {
      try { attrs[key] = JSON.parse(rawVal); } catch { attrs[key] = rawVal; }
    } else {
      attrs[key] = rawVal;
    }
  }
  return attrs;
}

/**
 * Splits a container directive body by `### Heading {optional="attrs"}` sections.
 */
function splitHeadingSections(body: string): Array<{ heading: string; attrs: Record<string, any>; content: string }> {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const sections: Array<{ heading: string; attrs: Record<string, any>; contentLines: string[] }> = [];
  let current: { heading: string; attrs: Record<string, any>; contentLines: string[] } | null = null;

  let fence: string | null = null;
  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fenceMatch[1][0] === fence) fence = null;
    }
    // Horizontal-rule separators between sections are allowed and ignored
    if (!fence && !fenceMatch && /^-{3,}\s*$/.test(line)) continue;
    const hMatch = fence || fenceMatch ? null : line.match(/^#{2,4}\s+(.+?)(?:\s+\{([^}]*)\})?\s*$/);
    if (hMatch) {
      if (current) sections.push(current);
      current = {
        heading: hMatch[1].trim(),
        attrs: parseDirectiveAttrs(hMatch[2]),
        contentLines: [],
      };
    } else {
      if (!current) {
        if (!line.trim()) continue;
        current = { heading: 'Section 1', attrs: {}, contentLines: [line] };
      } else {
        current.contentLines.push(line);
      }
    }
  }
  if (current) sections.push(current);

  return sections.map(s => ({
    heading: s.heading,
    attrs: s.attrs,
    content: s.contentLines.join('\n').trim(),
  }));
}

/**
 * Extracts leading emoji from a heading like "🚀 Fast Performance"
 */
function splitLeadingEmoji(title: string, fallback = '🚀'): { emoji: string; title: string } {
  const trimmed = title.trim();
  const match = trimmed.match(/^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s+(.*)$/u);
  if (match) {
    return { emoji: match[1], title: match[2].trim() };
  }
  return { emoji: fallback, title: trimmed };
}

/**
 * Simple YAML-subset / JSON frontmatter parser for `---\n...\n---`
 */
function extractFrontmatter(markdown: string): {
  body: string;
  title?: string;
  tags?: string[];
  theme?: Partial<ThemeConfig>;
} {
  const normalized = markdown.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { body: markdown };
  }
  const closeRegex = /\n---[ \t]*(?:\n|$)/g;
  closeRegex.lastIndex = 3;
  const closeMatch = closeRegex.exec(normalized);
  if (!closeMatch) {
    return { body: markdown };
  }
  const endIdx = closeMatch.index;

  const rawFrontmatter = normalized.slice(4, endIdx).trim();
  const body = normalized.slice(endIdx + closeMatch[0].length);

  // If frontmatter is JSON
  if (rawFrontmatter.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawFrontmatter);
      return {
        body,
        title: parsed.title,
        tags: Array.isArray(parsed.tags) ? parsed.tags : undefined,
        theme: parsed.theme,
      };
    } catch {
      // Fall through
    }
  }

  let title: string | undefined;
  let tags: string[] | undefined;
  const theme: Partial<ThemeConfig> = {};
  let currentSection: 'root' | 'theme' | 'hero' | 'features' | 'footer' = 'root';

  const stripYamlComment = (s: string): string => {
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle) inDouble = !inDouble;
      else if (ch === '#' && !inSingle && !inDouble && (i === 0 || /\s/.test(s[i - 1]))) {
        return s.slice(0, i);
      }
    }
    return s;
  };

  for (const rawLine of rawFrontmatter.split('\n')) {
    const line = stripYamlComment(rawLine);
    if (!line.trim()) continue;
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const kv = line.trim().match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    const rawVal = kv[2].trim();

    if (indent === 0) {
      if (key === 'theme' && !rawVal) { currentSection = 'theme'; continue; }
      if (key === 'hero' && !rawVal) { currentSection = 'hero'; continue; }
      if (key === 'features' && !rawVal) { currentSection = 'features'; continue; }
      if (key === 'footer' && !rawVal) { currentSection = 'footer'; continue; }
      currentSection = 'root';
    } else if (indent <= 2 && currentSection !== 'root') {
      if (key === 'hero' && !rawVal) { currentSection = 'hero'; continue; }
      if (key === 'features' && !rawVal) { currentSection = 'features'; continue; }
      if (key === 'footer' && !rawVal) { currentSection = 'footer'; continue; }
    }

    const unquoted = rawVal.replace(/^["']|["']$/g, '');
    const parseValue = (v: string): any => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      if (v.startsWith('{') || v.startsWith('[')) {
        try { return JSON.parse(v); } catch { /* ignore */ }
      }
      return unquoted;
    };
    const val = parseValue(rawVal);

    if (currentSection === 'root') {
      if (key === 'title') title = String(unquoted);
      else if (key === 'tags') {
        if (Array.isArray(val)) tags = val.map(String);
        else tags = unquoted.replace(/^\[|\]$/g, '').split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      } else if (key === 'primaryColor') theme.primaryColor = String(unquoted);
      else if (key === 'fontFamily') theme.fontFamily = unquoted as any;
      else if (key === 'codeTheme') theme.codeTheme = unquoted as any;
      else if (key === 'theme' && typeof val === 'object') Object.assign(theme, val);
    } else if (currentSection === 'theme') {
      if (key === 'primaryColor') theme.primaryColor = String(unquoted);
      else if (key === 'fontFamily') theme.fontFamily = unquoted as any;
      else if (key === 'codeTheme') theme.codeTheme = unquoted as any;
      else if (key === 'hero' && typeof val === 'object') theme.hero = { ...(theme.hero as any), ...val };
      else if (key === 'features' && typeof val === 'object') theme.features = { ...(theme.features as any), ...val };
      else if (key === 'footer' && typeof val === 'object') theme.footer = { ...(theme.footer as any), ...val };
    } else if (currentSection === 'hero') {
      theme.hero = { ...(theme.hero as any), [key]: val };
    } else if (currentSection === 'features') {
      theme.features = { ...(theme.features as any), [key]: val };
    } else if (currentSection === 'footer') {
      theme.footer = { ...(theme.footer as any), [key]: val };
    }
  }

  return {
    body,
    title,
    tags,
    theme: Object.keys(theme).length > 0 ? theme : undefined,
  };
}

function renderBasicMarkdown(md: string): string {
  return marked(md) as string;
}

/**
 * Converts a `:::blockType{attrs}\nbody\n:::` directive into HTML.
 */
function renderDirectiveBlock(type: string, attrStr: string | undefined, body: string): string {
  const attrs = parseDirectiveAttrs(attrStr);
  const normalized = type.replace(/[A-Z]/g, m => '-' + m.toLowerCase()).toLowerCase();

  // If the body itself is a JSON object, merge it into the spec
  const trimmedBody = body.trim();
  if (trimmedBody.startsWith('{') && trimmedBody.endsWith('}')) {
    try {
      const parsedJson = JSON.parse(trimmedBody);
      return blockSpecToHtml({ type: normalized, attrs, ...parsedJson }, renderBasicMarkdown);
    } catch {
      // Not valid JSON; proceed with markdown/section parsing
    }
  }

  switch (normalized) {
    case 'workflow': {
      const inferWorkflowIcon = (title: string, idx: number): string => {
        const lower = title.toLowerCase();
        if (/\b(create|new|scaffold|init|write|edit|author|draft)\b/.test(lower)) return 'edit';
        if (/\b(install|download|fetch|clone|pull|import)\b/.test(lower)) return 'download';
        if (/\b(config|configure|setup|settings|theme|style|option)\b/.test(lower)) return 'settings';
        if (/\b(code|build|compile|script|json|markdown)\b/.test(lower)) return 'code';
        if (/\b(run|start|render|export|execute|launch|preview)\b/.test(lower)) return 'zap';
        if (/\b(check|verify|validate|test|lint|audit)\b/.test(lower)) return 'check-circle';
        if (/\b(deploy|ship|publish|share|send|release)\b/.test(lower)) return 'rocket';
        if (/\b(search|find|inspect|list|browse)\b/.test(lower)) return 'search';
        const fallbackIcons = ['flag', 'edit', 'zap', 'check-circle', 'rocket'];
        return fallbackIcons[idx % fallbackIcons.length];
      };
      const sections = splitHeadingSections(body);
      const steps = sections.map((s, idx) => {
        const cleanTitle = s.heading.replace(/^\d+\.\s*/, '') || `Step ${idx + 1}`;
        return {
          title: cleanTitle,
          icon: s.attrs.icon || inferWorkflowIcon(cleanTitle, idx),
          image: s.attrs.image,
          cardBgOverride: s.attrs.cardBgOverride || s.attrs.cardBg,
          content: s.content,
        };
      });
      return blockSpecToHtml({ type: 'workflow', attrs, steps }, renderBasicMarkdown);
    }

    case 'timeline': {
      const sections = splitHeadingSections(body);
      const steps = sections.map((s, idx) => ({
        title: s.heading || `Step ${idx + 1}`,
        date: s.attrs.date || '',
        content: s.content,
      }));
      return blockSpecToHtml({ type: 'timeline', attrs, steps }, renderBasicMarkdown);
    }

    case 'card-grid':
    case 'cards': {
      const sections = splitHeadingSections(body);
      const cards = sections.map((s) => {
        const { emoji, title } = splitLeadingEmoji(s.heading, s.attrs.emoji || '🚀');
        return {
          emoji: s.attrs.emoji || emoji,
          title,
          content: s.content,
        };
      });
      return blockSpecToHtml({ type: 'card-grid', attrs, cards }, renderBasicMarkdown);
    }

    case 'accordion': {
      const sections = splitHeadingSections(body);
      const items = sections.map((s) => ({
        title: s.heading,
        content: s.content,
      }));
      return blockSpecToHtml({ type: 'accordion', attrs, items }, renderBasicMarkdown);
    }

    case 'tabs':
    case 'tab-group': {
      const sections = splitHeadingSections(body);
      const items = sections.map((s) => ({
        label: s.heading.replace(/^Tab:\s*/i, ''),
        content: s.content,
      }));
      return blockSpecToHtml({ type: 'tabs', attrs, items }, renderBasicMarkdown);
    }

    case 'grid': {
      const columns = body
        .split(/\n(?:---column---|:::column)\n/i)
        .map(c => c.trim());
      return blockSpecToHtml({ type: 'grid', attrs, columns }, renderBasicMarkdown);
    }

    case 'stat-row':
    case 'stats': {
      if (Array.isArray(attrs.stats)) {
        return blockSpecToHtml({ type: 'stat-row', attrs }, renderBasicMarkdown);
      }
      if (trimmedBody.startsWith('[') && trimmedBody.endsWith(']')) {
        try {
          const arr = JSON.parse(trimmedBody);
          if (Array.isArray(arr)) {
            const stats = arr.map((s: any) => {
              const rawVal = String(s.value ?? '0');
              const m = rawVal.match(/^([^0-9.-]*)(-?\d+(?:\.\d+)?)(.*)$/);
              return {
                prefix: s.prefix ?? (m ? m[1].trim() : ''),
                value: m ? m[2] : rawVal,
                suffix: s.suffix ?? (m ? m[3].trim() : ''),
                label: s.label || '',
                icon: s.icon || '',
              };
            });
            return blockSpecToHtml({ type: 'stat-row', attrs, stats }, renderBasicMarkdown);
          }
        } catch {
          // fall through to line-based parsing
        }
      }
      const stats = body
        .split('\n')
        .map(l => l.trim().replace(/^[-*]\s*/, ''))
        .filter(Boolean)
        .map(line => {
          const parts = line.split('|').map(p => p.trim());
          const rawVal = parts[0] || '0';
          const label = parts[1] || '';
          const icon = parts[2] || '';
          const m = rawVal.match(/^([^0-9.-]*)(-?\d+(?:\.\d+)?)(.*)$/);
          if (m) {
            return { prefix: m[1].trim(), value: m[2], suffix: m[3].trim(), label, icon };
          }
          return { prefix: '', value: rawVal, suffix: '', label, icon };
        });
      return blockSpecToHtml({ type: 'stat-row', attrs, stats }, renderBasicMarkdown);
    }

    case 'code-diff': {
      const parts = body.split(/\n===(?:after|diff)===\n/i);
      const codeBefore = attrs.codeBefore ?? (parts[0] ? parts[0].trim() : '');
      const codeAfter = attrs.codeAfter ?? (parts[1] ? parts[1].trim() : '');
      return blockSpecToHtml({
        type: 'code-diff',
        attrs: { ...attrs, codeBefore, codeAfter },
      }, renderBasicMarkdown);
    }

    case 'feature-spotlight': {
      const lines = body.split('\n');
      const descLines: string[] = [];
      const bullets: string[] = Array.isArray(attrs.bullets) ? [...attrs.bullets] : [];
      for (const line of lines) {
        const bMatch = line.match(/^\s*[-*]\s+(.+)$/);
        if (bMatch) bullets.push(bMatch[1].trim());
        else if (line.trim()) descLines.push(line.trim());
      }
      return blockSpecToHtml({
        type: 'feature-spotlight',
        attrs: {
          ...attrs,
          description: attrs.description || descLines.join(' '),
          bullets,
        },
      }, renderBasicMarkdown);
    }

    default:
      return blockSpecToHtml({
        type: normalized,
        attrs,
        content: body.trim(),
      }, renderBasicMarkdown);
  }
}

/**
 * Parses GuideEm-Flavored Markdown into sanitized HTML + extracted frontmatter metadata.
 */
export function parseGuideMarkdown(markdown: string): ParsedGuideMarkdown {
  const { body, title: fmTitle, tags, theme } = extractFrontmatter(markdown);

  const placeholders: string[] = [];
  const stashHtml = (html: string): string => {
    const idx = placeholders.length;
    placeholders.push(html);
    return `\n\n<div data-guide-placeholder="${idx}"></div>\n\n`;
  };

  let processed = body.replace(/\r\n/g, '\n');

  // Fallback title detection from leading # Heading and deduplication against cover title
  let detectedTitle = fmTitle;
  const leadingH1Match = processed.match(/^\s*#\s+([^\n]+)\n*/);
  if (leadingH1Match) {
    const h1Text = leadingH1Match[1].trim();
    if (!detectedTitle) {
      detectedTitle = h1Text;
      processed = processed.slice(leadingH1Match[0].length);
    } else if (detectedTitle.trim().toLowerCase() === h1Text.toLowerCase()) {
      processed = processed.slice(leadingH1Match[0].length);
    }
  }

  // 0. Protect non-special fenced code blocks (and 4+ backtick/tilde wrapper fences)
  // so mermaid, guide-block, directive, and callout transforms skip literal code examples.
  const codeFences: string[] = [];
  const restoreCodeFences = (text: string): string =>
    text.replace(/@@GUIDE_CODE_FENCE_(\d+)@@/g, (_m, idxStr) => codeFences[Number(idxStr)] ?? '');

  {
    const fenceLines = processed.split('\n');
    const out: string[] = [];
    for (let i = 0; i < fenceLines.length; i++) {
      const openMatch = fenceLines[i].match(/^(\s*)(`{3,}|~{3,})(.*)$/);
      if (!openMatch) {
        out.push(fenceLines[i]);
        continue;
      }
      const fence = openMatch[2];
      const fenceChar = fence[0];
      const info = openMatch[3].trim();
      const isSpecialThreeTick =
        fence.length === 3 &&
        fenceChar === '`' &&
        /^(?:mermaid(?:\s|$|\{)|(?:guide-block|guideem)(?:\s|$))/i.test(info);

      const closeRe = new RegExp(`^\\s*${fenceChar}{${fence.length},}\\s*$`);
      const blockLines: string[] = [fenceLines[i]];
      let closed = false;
      let j = i + 1;
      for (; j < fenceLines.length; j++) {
        blockLines.push(fenceLines[j]);
        if (closeRe.test(fenceLines[j])) {
          closed = true;
          break;
        }
      }

      if (!closed) {
        out.push(fenceLines[i]);
        continue;
      }

      if (isSpecialThreeTick) {
        out.push(...blockLines);
      } else {
        const idx = codeFences.length;
        codeFences.push(blockLines.join('\n'));
        out.push(`@@GUIDE_CODE_FENCE_${idx}@@`);
      }
      i = j;
    }
    processed = out.join('\n');
  }

  // 1. Transform ```mermaid fenced blocks into Mermaid custom blocks
  processed = processed.replace(
    /^```mermaid(?:\s+\{([^}]*)\})?\s*\n([\s\S]*?)^```\s*$/gm,
    (_m, attrStr, code) => {
      const attrs = parseDirectiveAttrs(attrStr);
      return stashHtml(
        blockSpecToHtml({
          type: 'mermaid',
          definition: code.trim(),
          theme: attrs.theme || 'default',
        })
      );
    }
  );

  // 2. Transform ```guide-block or ```guideem JSON blocks into custom blocks
  processed = processed.replace(
    /^```(?:guide-block|guideem)\s*\n([\s\S]*?)^```\s*$/gm,
    (_m, jsonText) => {
      try {
        const parsed = JSON.parse(jsonText.trim());
        if (Array.isArray(parsed)) {
          return stashHtml(parsed.map(b => blockSpecToHtml(b, renderBasicMarkdown)).join('\n'));
        }
        return stashHtml(blockSpecToHtml(parsed, renderBasicMarkdown));
      } catch (e) {
        return stashHtml(
          `<div data-type="danger" class="callout callout-danger">Invalid guide-block JSON: ${escapeHtml(
            e instanceof Error ? e.message : String(e)
          )}</div>`
        );
      }
    }
  );

  // 3. Transform :::block-type{attrs} ... ::: directive blocks
  // Fence-aware scan so ``` code blocks (inside or outside a directive) never
  // open or close a directive.
  {
    const out: string[] = [];
    const srcLines = processed.split('\n');
    let fence: string | null = null;
    for (let i = 0; i < srcLines.length; i++) {
      const line = srcLines[i];
      const fm = line.match(/^\s*(`{3,}|~{3,})/);
      if (fm) {
        if (!fence) fence = fm[1];
        else if (fm[1][0] === fence[0] && fm[1].length >= fence.length) fence = null;
        out.push(line);
        continue;
      }
      const open = !fence && line.match(/^:::([a-zA-Z0-9_-]+)(?:\{([^}]*)\})?\s*$/);
      if (!open) {
        out.push(line);
        continue;
      }
      // Collect body until a bare ::: outside any fence
      const body: string[] = [];
      let innerFence: string | null = null;
      let j = i + 1;
      let closed = false;
      let depth = 0;
      for (; j < srcLines.length; j++) {
        const l = srcLines[j];
        const f2 = l.match(/^\s*(`{3,}|~{3,})/);
        if (f2) {
          if (!innerFence) innerFence = f2[1];
          else if (f2[1][0] === innerFence[0] && f2[1].length >= innerFence.length) innerFence = null;
        } else if (!innerFence) {
          if (/^:::\s*$/.test(l)) {
            if (depth === 0) {
              closed = true;
              break;
            }
            depth--;
          } else if (/^:::[a-zA-Z0-9_-]+(?:\{[^}]*\})?\s*$/.test(l)) {
            depth++;
          }
        }
        body.push(l);
      }
      if (!closed) {
        out.push(line);
        continue;
      }
      out.push(stashHtml(renderDirectiveBlock(open[1], open[2], restoreCodeFences(body.join('\n')))));
      i = j;
    }
    processed = out.join('\n');
  }

  // Also support single-line self-closing directives: :::block-type{attrs}:::
  processed = processed.replace(
    /^:::([a-zA-Z0-9_-]+)(?:\{([^}]*)\})?:::\s*$/gm,
    (_m, blockType, attrStr) => {
      return stashHtml(renderDirectiveBlock(blockType, attrStr, ''));
    }
  );

  // 4. Transform GitHub-style alerts (> [!NOTE], > [!WARNING], > [!TIP], > [!IMPORTANT], > [!CAUTION])
  // and exported callouts (> **[INFO]**, > **[WARNING]**, etc.)
  processed = processed.replace(
    /(?:^>\s*(?:\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]|\*\*\[(INFO|WARNING|SUCCESS|DANGER)\]\*\*)\s*\n)((?:^>.*(?:\n|$))+)/gim,
    (_m, ghKind, expKind, quoteLines) => {
      const rawKind = (ghKind || expKind || 'info').toUpperCase();
      const kindMap: Record<string, string> = {
        NOTE: 'info',
        INFO: 'info',
        TIP: 'success',
        SUCCESS: 'success',
        IMPORTANT: 'info',
        WARNING: 'warning',
        CAUTION: 'danger',
        DANGER: 'danger',
      };
      const kind = kindMap[rawKind] || 'info';
      const innerMd = quoteLines
        .split('\n')
        .map((l: string) => l.replace(/^>\s?/, ''))
        .join('\n')
        .trim();
      return stashHtml(
        blockSpecToHtml({ type: 'callout', attrs: { type: kind }, content: innerMd }, renderBasicMarkdown)
      );
    }
  );

  // 5. Restore protected fenced code blocks and render standard Markdown via marked
  processed = restoreCodeFences(processed);
  let rawHtml = marked(processed) as string;

  // 6. Restore stashed custom block HTML
  rawHtml = rawHtml.replace(
    /<div data-guide-placeholder="(\d+)"><\/div>/g,
    (_m, idxStr) => placeholders[Number(idxStr)] || ''
  );

  // Fallback title detection from first # Heading if not in frontmatter or leading line
  if (!detectedTitle) {
    const h1Match = body.match(/^#\s+(.+)$/m);
    if (h1Match) {
      detectedTitle = h1Match[1].trim();
    }
  }

  return {
    title: detectedTitle,
    tags,
    theme,
    html: sanitizeHtml(rawHtml),
  };
}

export function markdownToHtml(markdown: string): string {
  return parseGuideMarkdown(markdown).html;
}

/**
 * Universal parser for agent-supplied guide inputs (Markdown string, JSON string, or AgentGuideSpec object).
 */
export function parseGuideInput(input: string | AgentGuideSpec): {
  id?: string;
  title: string;
  tags?: string[];
  theme?: Partial<ThemeConfig>;
  content: any;
  htmlContent: string;
} {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsedObj = JSON.parse(trimmed) as AgentGuideSpec;
        return parseGuideInput(parsedObj);
      } catch {
        // Fall back to Markdown
      }
    }
    const parsedMd = parseGuideMarkdown(input);
    return {
      title: parsedMd.title || 'Untitled Guide',
      tags: parsedMd.tags,
      theme: parsedMd.theme,
      content: parsedMd.html,
      htmlContent: parsedMd.html,
    };
  }

  // Object input (AgentGuideSpec or exported Document JSON)
  let htmlContent = input.htmlContent || '';
  let content = input.content;
  let extractedTheme = input.theme;
  let extractedTags = input.tags;
  let extractedTitle = input.title;

  if (input.markdown) {
    const parsedMd = parseGuideMarkdown(input.markdown);
    htmlContent = parsedMd.html;
    if (!content) content = htmlContent;
    if (!extractedTitle && parsedMd.title) extractedTitle = parsedMd.title;
    if (!extractedTags && parsedMd.tags) extractedTags = parsedMd.tags;
    if (parsedMd.theme) extractedTheme = { ...parsedMd.theme, ...extractedTheme };
  } else if (Array.isArray(input.blocks)) {
    htmlContent = sanitizeHtml(
      input.blocks.map(b => blockSpecToHtml(b, renderBasicMarkdown)).join('\n')
    );
    if (!content) content = htmlContent;
  } else if (typeof input.content === 'string' && !htmlContent) {
    htmlContent = sanitizeHtml(input.content);
  }

  return {
    id: input.id,
    title: extractedTitle || 'Untitled Guide',
    tags: extractedTags,
    theme: extractedTheme,
    content: content ?? (htmlContent || { type: 'doc', content: [{ type: 'paragraph' }] }),
    htmlContent,
  };
}
