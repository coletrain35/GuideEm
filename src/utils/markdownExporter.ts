import type { ThemeConfig } from './storage';

export interface MarkdownExportMetadata {
  title?: string;
  tags?: string[];
  theme?: ThemeConfig;
  includeFrontmatter?: boolean;
}

/**
 * Converts a Tiptap JSON document to GuideEm-Flavored Markdown.
 * Preserves custom blocks via `:::directive` and ` ```guide-block ` syntax
 * so documents can round-trip between Markdown and GuideEm.
 */
export function tiptapJsonToMarkdown(doc: any, meta?: MarkdownExportMetadata): string {
  const parts: string[] = [];

  if (meta?.includeFrontmatter && (meta.title || (meta.tags && meta.tags.length > 0) || meta.theme)) {
    const fmLines: string[] = ['---'];
    if (meta.title) fmLines.push(`title: ${JSON.stringify(meta.title)}`);
    if (meta.tags && meta.tags.length > 0) fmLines.push(`tags: ${JSON.stringify(meta.tags)}`);
    if (meta.theme) {
      fmLines.push('theme:');
      if (meta.theme.primaryColor) fmLines.push(`  primaryColor: ${JSON.stringify(meta.theme.primaryColor)}`);
      if (meta.theme.fontFamily) fmLines.push(`  fontFamily: ${JSON.stringify(meta.theme.fontFamily)}`);
      if (meta.theme.codeTheme) fmLines.push(`  codeTheme: ${JSON.stringify(meta.theme.codeTheme)}`);
      if (meta.theme.hero) fmLines.push(`  hero: ${JSON.stringify(meta.theme.hero)}`);
      if (meta.theme.features) fmLines.push(`  features: ${JSON.stringify(meta.theme.features)}`);
    }
    fmLines.push('---');
    parts.push(fmLines.join('\n'));
  }

  if (doc && doc.type === 'doc') {
    const body = blocksToMarkdown(doc.content || []);
    if (body) parts.push(body);
  }

  return parts.join('\n\n');
}

function blocksToMarkdown(nodes: any[]): string {
  return nodes.map(blockToMarkdown).filter(Boolean).join('\n\n');
}

function safeParseJson(val: any, fallback: any = []): any {
  if (Array.isArray(val) || (val && typeof val === 'object')) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
}

function escapeAttr(val: any): string {
  return String(val ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ');
}

function blockToMarkdown(node: any): string {
  if (!node) return '';

  switch (node.type) {
    case 'paragraph':
      return inlinesToMarkdown(node.content || []);

    case 'heading': {
      const level = node.attrs?.level || 1;
      const text = inlinesToMarkdown(node.content || []);
      return '#'.repeat(level) + ' ' + text;
    }

    case 'blockquote': {
      const inner = blocksToMarkdown(node.content || []);
      return inner.split('\n').map((l: string) => '> ' + l).join('\n');
    }

    case 'bulletList': {
      return (node.content || []).map((item: any) => {
        const content = (item.content || []).map(blockToMarkdown).join('\n');
        return content.split('\n').map((line: string, i: number) =>
          i === 0 ? `- ${line}` : `  ${line}`
        ).join('\n');
      }).join('\n');
    }

    case 'orderedList': {
      return (node.content || []).map((item: any, idx: number) => {
        const content = (item.content || []).map(blockToMarkdown).join('\n');
        return content.split('\n').map((line: string, i: number) =>
          i === 0 ? `${idx + 1}. ${line}` : `   ${line}`
        ).join('\n');
      }).join('\n');
    }

    case 'taskList': {
      return (node.content || []).map((item: any) => {
        const checked = item.attrs?.checked ? '[x]' : '[ ]';
        const content = (item.content || []).map(blockToMarkdown).join(' ');
        return `- ${checked} ${content}`;
      }).join('\n');
    }

    case 'codeBlock': {
      const lang = node.attrs?.language || '';
      const code = (node.content || []).map((n: any) => n.text || '').join('');
      const matches = code.match(/`{3,}/g);
      const maxTicks = matches ? Math.max(...matches.map((m: string) => m.length)) : 2;
      const fence = '`'.repeat(Math.max(3, maxTicks + 1));
      return `${fence}${lang}\n${code}\n${fence}`;
    }

    case 'horizontalRule':
      return '---';

    case 'table': {
      const rows: any[] = node.content || [];
      if (!rows.length) return '';
      const lines: string[] = [];

      rows.forEach((row: any, rowIdx: number) => {
        const cells = (row.content || []).map((cell: any) =>
          blocksToMarkdown(cell.content || []).replace(/\n+/g, ' ').replace(/\|/g, '\\|')
        );
        lines.push('| ' + cells.join(' | ') + ' |');
        if (rowIdx === 0) {
          lines.push('| ' + cells.map(() => '---').join(' | ') + ' |');
        }
      });
      return lines.join('\n');
    }

    case 'callout': {
      const kind = node.attrs?.type || node.attrs?.kind || 'info';
      const titleAttr = node.attrs?.title ? ` title="${escapeAttr(node.attrs.title)}"` : '';
      const inner = node.content?.[0]?.type === 'text'
        ? inlinesToMarkdown(node.content || [])
        : blocksToMarkdown(node.content || []);
      return `:::callout{type="${escapeAttr(kind)}"${titleAttr}}\n${inner}\n:::`;
    }

    case 'mermaid': {
      const def = node.attrs?.definition || '';
      const theme = node.attrs?.theme && node.attrs.theme !== 'default' ? ` {theme="${escapeAttr(node.attrs.theme)}"}` : '';
      return def ? `\`\`\`mermaid${theme}\n${def}\n\`\`\`` : '';
    }

    case 'annotatedImage':
    case 'image': {
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || node.attrs?.caption || 'Image';
      return src ? `![${alt}](${src})` : '';
    }

    case 'videoEmbed': {
      const src = node.attrs?.src || '';
      return src ? `:::video-embed{src="${escapeAttr(src)}"}\n:::` : '';
    }

    case 'codeDiff': {
      const lang = node.attrs?.language || 'javascript';
      const before = node.attrs?.codeBefore || '';
      const after = node.attrs?.codeAfter || '';
      return `:::code-diff{language="${escapeAttr(lang)}"}\n${before}\n===after===\n${after}\n:::`;
    }

    case 'codeWindow': {
      const lang = node.attrs?.language || 'javascript';
      const code = node.attrs?.code || '';
      const title = node.attrs?.title || 'untitled';
      const theme = node.attrs?.theme || 'dark';
      return `:::code-window{title="${escapeAttr(title)}" language="${escapeAttr(lang)}" theme="${escapeAttr(theme)}"}\n${code}\n:::`;
    }

    case 'statRow': {
      const stats = safeParseJson(node.attrs?.stats, []);
      if (Array.isArray(stats) && stats.length) {
        const lines = stats.map((s: any) => `- ${s.prefix || ''}${s.value}${s.suffix || ''} | ${s.label || ''}${s.icon ? ` | ${s.icon}` : ''}`);
        return `:::stat-row\n${lines.join('\n')}\n:::`;
      }
      return '';
    }

    case 'workflow': {
      const accent = node.attrs?.accentColor || 'indigo';
      const cardBg = node.attrs?.cardBg || 'white';
      const steps = (node.content || []).map((step: any) => {
        const title = step.attrs?.title || 'Step';
        const icon = step.attrs?.icon || 'circle-dot';
        const body = blocksToMarkdown(step.content || []);
        return `### ${title} {icon="${escapeAttr(icon)}"}\n${body}`;
      }).join('\n\n');
      return `:::workflow{accentColor="${escapeAttr(accent)}" cardBg="${escapeAttr(cardBg)}"}\n${steps}\n:::`;
    }

    case 'timeline': {
      const accent = node.attrs?.accentColor || 'blue';
      const marker = node.attrs?.markerStyle || 'number';
      const steps = (node.content || []).map((step: any) => {
        const date = step.attrs?.date || '';
        const children = step.content || [];
        const titleNode = children.find((c: any) => c.type === 'timelineStepTitle');
        const bodyNodes = children.filter((c: any) => c.type !== 'timelineStepTitle');
        const title = titleNode ? inlinesToMarkdown(titleNode.content || []) : 'Step';
        const body = blocksToMarkdown(bodyNodes);
        const dateAttr = date ? ` {date="${escapeAttr(date)}"}` : '';
        return `### ${title}${dateAttr}\n${body}`;
      }).join('\n\n');
      return `:::timeline{accentColor="${escapeAttr(accent)}" markerStyle="${escapeAttr(marker)}"}\n${steps}\n:::`;
    }

    case 'cardGrid': {
      const cols = node.attrs?.cols || 3;
      const cards = (node.content || []).map((card: any) => {
        const emoji = card.attrs?.emoji || '🚀';
        const title = card.attrs?.title || 'Card';
        const body = blocksToMarkdown(card.content || []);
        return `### ${emoji} ${title}\n${body}`;
      }).join('\n\n');
      return `:::card-grid{cols="${escapeAttr(cols)}"}\n${cards}\n:::`;
    }

    case 'accordion': {
      const items = (node.content || []).map((item: any) => {
        const title = item.attrs?.title || 'Section';
        const body = blocksToMarkdown(item.content || []);
        return `### ${title}\n${body}`;
      }).join('\n\n');
      return `:::accordion\n${items}\n:::`;
    }

    case 'tabGroup': {
      const panels = (node.content || []).map((panel: any) => {
        const label = panel.attrs?.label || 'Tab';
        const body = blocksToMarkdown(panel.content || []);
        return `### ${label}\n${body}`;
      }).join('\n\n');
      return `:::tabs\n${panels}\n:::`;
    }

    case 'grid': {
      const layout = node.attrs?.layout || '50-50';
      const cols = (node.content || []).map((col: any) => blocksToMarkdown(col.content || []));
      return `:::grid{layout="${escapeAttr(layout)}"}\n${cols.join('\n---column---\n')}\n:::`;
    }

    case 'testimonial': {
      const quote = node.attrs?.quote || '';
      const author = node.attrs?.authorName || '';
      const role = node.attrs?.authorRole || '';
      const color = node.attrs?.avatarColor || '#6366f1';
      return `:::testimonial{authorName="${escapeAttr(author)}" authorRole="${escapeAttr(role)}" avatarColor="${escapeAttr(color)}"}\n${quote}\n:::`;
    }

    case 'heroBanner': {
      const a = node.attrs || {};
      return `:::hero-banner{title="${escapeAttr(a.title || '')}" subtitle="${escapeAttr(a.subtitle || '')}" ctaText="${escapeAttr(a.ctaText || '')}" ctaUrl="${escapeAttr(a.ctaUrl || '')}" gradientFrom="${escapeAttr(a.gradientFrom || '#6366f1')}" gradientTo="${escapeAttr(a.gradientTo || '#ec4899')}"}\n:::`;
    }

    case 'featureSpotlight': {
      const a = node.attrs || {};
      const bullets: string[] = safeParseJson(a.bullets, []);
      const bulletLines = bullets.map(b => `- ${b}`).join('\n');
      return `:::feature-spotlight{title="${escapeAttr(a.title || '')}" icon="${escapeAttr(a.icon || '')}" layout="${escapeAttr(a.layout || 'image-left')}" accentColor="${escapeAttr(a.accentColor || '#6366f1')}"}\n${a.description || ''}${bulletLines ? `\n${bulletLines}` : ''}\n:::`;
    }

    case 'bentoGrid': {
      const cells = safeParseJson(node.attrs?.cells, []);
      return `\`\`\`guide-block\n${JSON.stringify({ type: 'bento-grid', cells }, null, 2)}\n\`\`\``;
    }

    case 'stickyScroll': {
      const a = node.attrs || {};
      const steps = safeParseJson(a.steps, []);
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'sticky-scroll',
        stickyTitle: a.stickyTitle || 'How It Works',
        stickyDescription: a.stickyDescription || '',
        accentColor: a.accentColor || '#6366f1',
        steps,
      }, null, 2)}\n\`\`\``;
    }

    case 'changelogTimeline': {
      const entries = safeParseJson(node.attrs?.entries, []);
      return `\`\`\`guide-block\n${JSON.stringify({ type: 'changelog-timeline', entries }, null, 2)}\n\`\`\``;
    }

    case 'sectionDivider': {
      return `:::section-divider{style="${escapeAttr(node.attrs?.style || 'gradient')}"}\n:::`;
    }

    case 'counter': {
      const a = node.attrs || {};
      return `:::counter{value="${escapeAttr(a.value ?? 100)}" prefix="${escapeAttr(a.prefix || '')}" suffix="${escapeAttr(a.suffix || '')}" label="${escapeAttr(a.label || '')}"}\n:::`;
    }

    case 'backgroundSection': {
      const a = node.attrs || {};
      const body = blocksToMarkdown(node.content || []);
      return `:::background-section{bgPreset="${escapeAttr(a.bgPreset || 'light-gray')}" padding="${escapeAttr(a.padding || 'md')}" borderRadius="${escapeAttr(a.borderRadius || 'md')}"}\n${body}\n:::`;
    }

    case 'announcementPill': {
      const a = node.attrs || {};
      return `:::announcement-pill{label="${escapeAttr(a.label || 'New')}" message="${escapeAttr(a.message || '')}" url="${escapeAttr(a.url || '')}" variant="${escapeAttr(a.variant || 'indigo')}" shimmer="${Boolean(a.shimmer)}" align="${escapeAttr(a.align || 'center')}"}\n:::`;
    }

    case 'projectCard': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'project-card',
        thumbnail: a.thumbnail || '',
        title: a.title || '',
        description: a.description || '',
        tags: safeParseJson(a.tags, []),
        liveUrl: a.liveUrl || '',
        repoUrl: a.repoUrl || '',
        accentColor: a.accentColor || '#6366f1',
      }, null, 2)}\n\`\`\``;
    }

    case 'projectGallery': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'project-gallery',
        cols: a.cols ?? 2,
        cards: safeParseJson(a.cards, []),
      }, null, 2)}\n\`\`\``;
    }

    case 'aboutMe': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'about-me',
        avatar: a.avatar || '',
        name: a.name || '',
        role: a.role || '',
        bio: a.bio || '',
        accentColor: a.accentColor || '#6366f1',
        layout: a.layout || 'left',
      }, null, 2)}\n\`\`\``;
    }

    case 'techStack': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'tech-stack',
        items: safeParseJson(a.items, []),
        cols: a.cols ?? 4,
        accentColor: a.accentColor || '#6366f1',
      }, null, 2)}\n\`\`\``;
    }

    case 'socialLinks': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'social-links',
        links: safeParseJson(a.links, []),
        style: a.style || 'pills',
        alignment: a.alignment || 'center',
      }, null, 2)}\n\`\`\``;
    }

    case 'portfolioHero': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'portfolio-hero',
        name: a.name || '',
        tagline: a.tagline || '',
        badgeText: a.badgeText || '',
        ctaText: a.ctaText || '',
        ctaUrl: a.ctaUrl || '#',
        ctaSecondaryText: a.ctaSecondaryText || '',
        ctaSecondaryUrl: a.ctaSecondaryUrl || '#',
        gradientFrom: a.gradientFrom || '#6366f1',
        gradientTo: a.gradientTo || '#ec4899',
        alignment: a.alignment || 'center',
      }, null, 2)}\n\`\`\``;
    }

    case 'beforeAfter': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'before-after',
        beforeImage: a.beforeImage || '',
        afterImage: a.afterImage || '',
        sliderPosition: a.sliderPosition ?? 50,
        beforeLabel: a.beforeLabel || 'Before',
        afterLabel: a.afterLabel || 'After',
      }, null, 2)}\n\`\`\``;
    }

    case 'interactiveDemo': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'interactive-demo',
        frames: safeParseJson(a.frames, []),
        hotspots: safeParseJson(a.hotspots, []),
        transition: a.transition || 'fade',
        showNav: a.showNav ?? true,
      }, null, 2)}\n\`\`\``;
    }

    case 'confetti': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'confetti',
        message: a.message || '',
        emoji: a.emoji || '🎉',
        colors: safeParseJson(a.colors, []),
      }, null, 2)}\n\`\`\``;
    }

    case 'browserMockup': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'browser-mockup',
        image: a.image || '',
        url: a.url || 'https://example.com',
        variant: a.variant || 'light',
        alt: a.alt || '',
        caption: a.caption || '',
      }, null, 2)}\n\`\`\``;
    }

    case 'phoneMockup': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'phone-mockup',
        image: a.image || '',
        showStatusBar: a.showStatusBar ?? true,
        variant: a.variant || 'dark',
        alt: a.alt || '',
        caption: a.caption || '',
      }, null, 2)}\n\`\`\``;
    }

    case 'marquee': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'marquee',
        items: safeParseJson(a.items, []),
        speed: a.speed || 'medium',
        direction: a.direction || 'left',
        separator: a.separator || 'star',
        accentColor: a.accentColor || '#6366f1',
      }, null, 2)}\n\`\`\``;
    }

    case 'glowCards': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'glow-cards',
        cards: safeParseJson(a.cards, []),
        cols: a.cols ?? 3,
        cardBg: a.cardBg || 'white',
        textColor: a.textColor || 'light',
      }, null, 2)}\n\`\`\``;
    }

    case 'gradientBorder': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'gradient-border',
        title: a.title || '',
        description: a.description || '',
        preset: a.preset ?? 0,
        borderWidth: a.borderWidth ?? 2,
        animSpeed: a.animSpeed || 'medium',
        borderRadius: a.borderRadius || 'md',
      }, null, 2)}\n\`\`\``;
    }

    case 'hoverReveal': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'hover-reveal',
        cards: safeParseJson(a.cards, []),
        cols: a.cols ?? 3,
        revealStyle: a.revealStyle || 'flip',
      }, null, 2)}\n\`\`\``;
    }

    case 'gradientBlobs': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'gradient-blobs',
        preset: a.preset ?? 0,
        title: a.title || '',
        subtitle: a.subtitle || '',
        height: a.height || 'md',
        animate: a.animate ?? true,
      }, null, 2)}\n\`\`\``;
    }

    case 'noiseOverlay': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'noise-overlay',
        bgPreset: a.bgPreset ?? 0,
        noiseOpacity: a.noiseOpacity ?? 0.15,
        noiseDensity: a.noiseDensity ?? 50,
        title: a.title || '',
        subtitle: a.subtitle || '',
        height: a.height || 'md',
      }, null, 2)}\n\`\`\``;
    }

    case 'mathBlock': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'math-block',
        latex: a.latex || 'E = mc^2',
        caption: a.caption || '',
      }, null, 2)}\n\`\`\``;
    }

    case 'apiEndpoint': {
      const a = node.attrs || {};
      return `\`\`\`guide-block\n${JSON.stringify({
        type: 'api-endpoint',
        method: a.method || 'GET',
        path: a.path || '/api/v1/resources',
        summary: a.summary || '',
        responseCode: a.responseCode || '200 OK',
        responseBody: a.responseBody || '',
      }, null, 2)}\n\`\`\``;
    }

    default:
      return extractText(node);
  }
}

function inlinesToMarkdown(nodes: any[]): string {
  return (nodes || []).map(inlineToMarkdown).join('');
}

function inlineToMarkdown(node: any): string {
  if (!node) return '';

  if (node.type === 'text') {
    let text = node.text || '';
    const marks: any[] = node.marks || [];
    for (const mark of marks) {
      switch (mark.type) {
        case 'bold':      text = `**${text}**`; break;
        case 'italic':    text = `_${text}_`; break;
        case 'strike':    text = `~~${text}~~`; break;
        case 'code':      text = `\`${text}\``; break;
        case 'kbd':       text = `<kbd>${text}</kbd>`; break;
        case 'highlight': text = `==${text}==`; break;
        case 'link': {
          const href = mark.attrs?.href || '';
          text = `[${text}](${href})`;
          break;
        }
      }
    }
    return text;
  }

  if (node.type === 'hardBreak') return '  \n';
  return node.text || '';
}

function extractText(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  return (node.content || []).map(extractText).join('');
}
