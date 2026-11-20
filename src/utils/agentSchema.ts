import { escapeHtml } from './sanitize';
import type { ThemeConfig } from './storage';

export interface AgentBlockSpec {
  type: string;
  attrs?: Record<string, any>;
  content?: string | AgentBlockSpec[];
  items?: any[];
  steps?: any[];
  cards?: any[];
  cells?: any[];
  entries?: any[];
  stats?: any[];
  links?: any[];
  columns?: (string | AgentBlockSpec[])[];
  [key: string]: any;
}

export interface AgentGuideSpec {
  id?: string;
  title: string;
  tags?: string[];
  theme?: Partial<ThemeConfig>;
  markdown?: string;
  blocks?: AgentBlockSpec[];
  content?: any;
  htmlContent?: string;
}

export interface BlockCatalogEntry {
  type: string;
  category: 'Text' | 'Callouts' | 'Media' | 'Layout' | 'Data' | 'Showcase';
  description: string;
  attrs: Record<string, string>;
  markdownExample: string;
  jsonExample: AgentBlockSpec;
}

function toAttrVal(val: any): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'string') return escapeHtml(val);
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return escapeHtml(JSON.stringify(val));
}

function makeDiv(dataType: string, attrs: Record<string, any> = {}, innerHtml = '', extraClass = ''): string {
  const attrParts: string[] = [`data-type="${escapeHtml(dataType)}"`];
  if (extraClass) {
    attrParts.push(`class="${escapeHtml(extraClass)}"`);
  }
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === '') continue;
    const attrName = k.startsWith('data-') ? k : `data-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}`;
    attrParts.push(`${attrName}="${toAttrVal(v)}"`);
  }
  return `<div ${attrParts.join(' ')}>${innerHtml}</div>`;
}

function ensureBlockHtml(
  input: string | AgentBlockSpec[] | undefined,
  renderMarkdown: (md: string) => string
): string {
  if (!input) return '<p></p>';
  if (Array.isArray(input)) {
    const rendered = input.map(b => blockSpecToHtml(b, renderMarkdown)).join('\n');
    return rendered || '<p></p>';
  }
  const trimmed = input.trim();
  if (!trimmed) return '<p></p>';
  const html = renderMarkdown(trimmed).trim();
  if (!html) return '<p></p>';
  if (!/^<(p|h[1-6]|ul|ol|pre|blockquote|div|table)\b/i.test(html)) {
    return `<p>${html}</p>`;
  }
  return html;
}

/**
 * Converts a structured AgentBlockSpec into the exact HTML representation
 * expected by both Tiptap's parseHTML() and exporter.ts's generateHTML().
 */
export function blockSpecToHtml(
  spec: AgentBlockSpec,
  renderMarkdown: (md: string) => string = (s) => `<p>${escapeHtml(s)}</p>`
): string {
  const a = { ...spec, ...(spec.attrs || {}) };
  const rawType = (spec.type || '').trim();
  const normalized = rawType.replace(/[A-Z]/g, m => '-' + m.toLowerCase()).toLowerCase();

  switch (normalized) {
    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(a.level) || 2));
      const text = typeof a.text === 'string' ? escapeHtml(a.text) : (typeof spec.content === 'string' ? escapeHtml(spec.content) : '');
      return `<h${level}>${text}</h${level}>`;
    }

    case 'paragraph': {
      const text = typeof a.text === 'string' ? a.text : (typeof spec.content === 'string' ? spec.content : '');
      return ensureBlockHtml(text, renderMarkdown);
    }

    case 'code':
    case 'code-block': {
      const lang = a.language || a.lang || '';
      const code = a.code || (typeof spec.content === 'string' ? spec.content : '');
      const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : '';
      return `<pre><code${langClass}>${escapeHtml(code)}</code></pre>`;
    }

    case 'callout':
    case 'info':
    case 'warning':
    case 'success':
    case 'danger': {
      const kind = ['info', 'warning', 'success', 'danger'].includes(normalized)
        ? normalized
        : (a.kind || a.variant || (['info', 'warning', 'success', 'danger'].includes(a.type) ? a.type : 'info'));
      const rawText = typeof spec.content === 'string' ? spec.content : (a.text || a.message || '');
      // Callout has `content: 'inline*'` in Tiptap, so strip outer <p> tags
      const inlineHtml = renderMarkdown(rawText)
        .trim()
        .replace(/^<p>([\s\S]*?)<\/p>$/i, '$1')
        .replace(/<\/p>\s*<p>/gi, '<br>');
      const titleAttr = a.title ? ` data-title="${escapeHtml(String(a.title))}"` : '';
      return `<div data-type="${escapeHtml(kind)}"${titleAttr} class="callout callout-${escapeHtml(kind)}">${inlineHtml}</div>`;
    }

    case 'mermaid':
    case 'diagram': {
      const definition = a.definition || a.code || (typeof spec.content === 'string' ? spec.content : 'flowchart TD\n  A[Start] --> B[End]');
      return makeDiv('mermaid', {
        definition: definition.trim(),
        theme: a.theme || 'default',
      });
    }

    case 'accordion': {
      const items: any[] = Array.isArray(a.items) ? a.items : [];
      const itemsHtml = items.map((item: any) => {
        const title = item.title || item.label || 'Section';
        const body = ensureBlockHtml(item.content || item.body || item.description || '', renderMarkdown);
        return makeDiv('accordion-item', { title }, body);
      }).join('');
      return makeDiv('accordion', {}, itemsHtml || makeDiv('accordion-item', { title: 'Section 1' }, '<p></p>'));
    }

    case 'tabs':
    case 'tab-group': {
      const items: any[] = Array.isArray(a.tabs || a.items || a.panels) ? (a.tabs || a.items || a.panels) : [];
      const panelsHtml = items.map((panel: any, idx: number) => {
        const label = panel.label || panel.title || `Tab ${idx + 1}`;
        const body = ensureBlockHtml(panel.content || panel.body || panel.description || '', renderMarkdown);
        return makeDiv('tab-panel', { label, active: idx === 0 ? 'true' : 'false' }, body);
      }).join('');
      return makeDiv('tab-group', {}, panelsHtml || makeDiv('tab-panel', { label: 'Tab 1', active: 'true' }, '<p></p>'));
    }

    case 'grid': {
      const layout = a.layout || '50-50';
      const cols: any[] = Array.isArray(a.columns) ? a.columns.slice(0, 2) : [];
      while (cols.length < 2) cols.push('');
      const colsHtml = cols.map((col: any) => {
        const body = ensureBlockHtml(typeof col === 'object' && !Array.isArray(col) ? (col.content || col.body || '') : col, renderMarkdown);
        return makeDiv('grid-column', {}, body);
      }).join('');
      return makeDiv('grid', { layout }, colsHtml);
    }

    case 'workflow': {
      const inferIcon = (t: string, idx: number): string => {
        const lower = t.toLowerCase();
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
      const steps: any[] = Array.isArray(a.steps || a.items) ? (a.steps || a.items) : [];
      const stepsHtml = steps.map((step: any, i: number) => {
        const title = step.title || `Step ${i + 1}`;
        const icon = step.icon || inferIcon(title, i);
        const body = ensureBlockHtml(step.content || step.body || step.description || '', renderMarkdown);
        return makeDiv('workflow-step', {
          title,
          icon,
          image: step.image,
          cardBgOverride: step.cardBgOverride,
        }, body);
      }).join('');
      return makeDiv('workflow', {
        accentColor: a.accentColor || 'indigo',
        cardBg: a.cardBg || 'white',
      }, stepsHtml || makeDiv('workflow-step', { title: 'Step 1', icon: 'edit' }, '<p></p>'));
    }

    case 'timeline': {
      const steps: any[] = Array.isArray(a.steps || a.items) ? (a.steps || a.items) : [];
      const stepsHtml = steps.map((step: any, i: number) => {
        const title = step.title || `Step ${i + 1}`;
        const date = step.date || '';
        const body = ensureBlockHtml(step.content || step.body || step.description || '', renderMarkdown);
        const titleDiv = makeDiv('timeline-step-title', {}, escapeHtml(title));
        return makeDiv('timeline-step', { date }, `${titleDiv}${body}`);
      }).join('');
      return makeDiv('timeline', {
        accentColor: a.accentColor || 'blue',
        markerStyle: a.markerStyle || 'number',
      }, stepsHtml || makeDiv('timeline-step', { date: '' }, `${makeDiv('timeline-step-title', {}, 'Step 1')}<p></p>`));
    }

    case 'card-grid':
    case 'cards': {
      const cols = Number(a.cols || a.columns) || 3;
      const cards: any[] = Array.isArray(a.cards || a.items) ? (a.cards || a.items) : [];
      const cardsHtml = cards.map((card: any, i: number) => {
        const emoji = card.emoji || card.icon || '🚀';
        const title = card.title || `Card ${i + 1}`;
        const body = ensureBlockHtml(card.content || card.body || card.description || '', renderMarkdown);
        return makeDiv('card', { emoji, title }, body);
      }).join('');
      return makeDiv('card-grid', { cols }, cardsHtml || makeDiv('card', { emoji: '🚀', title: 'Card 1' }, '<p></p>'));
    }

    case 'background-section': {
      const body = ensureBlockHtml(spec.content || a.body || '', renderMarkdown);
      return makeDiv('background-section', {
        bgPreset: a.bgPreset || a.preset || 'dots',
        padding: a.padding || 'md',
        borderRadius: a.borderRadius || 'md',
      }, body);
    }

    case 'section-divider':
    case 'divider': {
      return makeDiv('section-divider', {
        style: a.style || 'gradient',
      });
    }

    case 'counter': {
      return makeDiv('counter', {
        value: a.value ?? 100,
        prefix: a.prefix ?? '',
        suffix: a.suffix ?? '+',
        label: a.label ?? 'Metric',
      });
    }

    case 'stat-row':
    case 'stats': {
      const stats = Array.isArray(a.stats || a.items) ? (a.stats || a.items) : [
        { value: '100', prefix: '', suffix: '+', label: 'Metric', icon: '⚡' },
      ];
      return makeDiv('stat-row', { stats });
    }

    case 'testimonial': {
      return makeDiv('testimonial', {
        quote: a.quote || (typeof spec.content === 'string' ? spec.content : ''),
        authorName: a.authorName || a.author || 'Author',
        authorRole: a.authorRole || a.role || '',
        avatarColor: a.avatarColor || '#6366f1',
      });
    }

    case 'hero-banner': {
      return makeDiv('hero-banner', {
        gradientFrom: a.gradientFrom || '#6366f1',
        gradientTo: a.gradientTo || '#ec4899',
        title: a.title || 'Welcome',
        subtitle: a.subtitle || '',
        ctaText: a.ctaText || '',
        ctaUrl: a.ctaUrl || '',
      });
    }

    case 'portfolio-hero': {
      return makeDiv('portfolio-hero', {
        name: a.name || a.title || 'Your Name',
        tagline: a.tagline || a.subtitle || '',
        badgeText: a.badgeText || a.badge || '',
        ctaText: a.ctaText || '',
        ctaUrl: a.ctaUrl || '#',
        ctaSecondaryText: a.ctaSecondaryText || '',
        ctaSecondaryUrl: a.ctaSecondaryUrl || '#',
        gradientFrom: a.gradientFrom || '#6366f1',
        gradientTo: a.gradientTo || '#ec4899',
        alignment: a.alignment || 'center',
      });
    }

    case 'code-window': {
      return makeDiv('code-window', {
        code: a.code || (typeof spec.content === 'string' ? spec.content : ''),
        language: a.language || a.lang || 'typescript',
        title: a.title || 'example.ts',
        theme: a.theme || 'dark',
      });
    }

    case 'code-diff': {
      return makeDiv('code-diff', {
        codeBefore: a.codeBefore || a.before || '',
        codeAfter: a.codeAfter || a.after || '',
        language: a.language || a.lang || 'typescript',
      });
    }

    case 'bento-grid': {
      const cells = Array.isArray(a.cells || a.items) ? (a.cells || a.items) : [];
      return makeDiv('bento-grid', { cells });
    }

    case 'feature-spotlight': {
      const bullets = Array.isArray(a.bullets || a.items) ? (a.bullets || a.items) : [];
      return makeDiv('feature-spotlight', {
        image: a.image || '',
        icon: a.icon || '✨',
        title: a.title || 'Feature Spotlight',
        description: a.description || (typeof spec.content === 'string' ? spec.content : ''),
        gradient: a.gradient || 'linear-gradient(135deg, #6366f1, #a855f7)',
        layout: a.layout || 'image-left',
        bullets,
        accentColor: a.accentColor || '#6366f1',
      });
    }

    case 'sticky-scroll': {
      const steps = Array.isArray(a.steps || a.items) ? (a.steps || a.items) : [];
      return makeDiv('sticky-scroll', {
        stickyTitle: a.stickyTitle || a.title || 'How It Works',
        stickyDescription: a.stickyDescription || a.description || '',
        accentColor: a.accentColor || '#6366f1',
        steps,
      });
    }

    case 'changelog-timeline':
    case 'changelog': {
      const entries = Array.isArray(a.entries || a.items) ? (a.entries || a.items) : [];
      return makeDiv('changelog-timeline', { entries });
    }

    case 'project-card': {
      const tags = Array.isArray(a.tags) ? a.tags : [];
      return makeDiv('project-card', {
        thumbnail: a.thumbnail || a.image || '',
        title: a.title || 'Project Title',
        description: a.description || (typeof spec.content === 'string' ? spec.content : ''),
        tags,
        liveUrl: a.liveUrl || '',
        repoUrl: a.repoUrl || '',
        accentColor: a.accentColor || '#6366f1',
      });
    }

    case 'project-gallery': {
      const cards = Array.isArray(a.cards || a.items) ? (a.cards || a.items) : [];
      return makeDiv('project-gallery', {
        cols: a.cols || 2,
        cards,
      });
    }

    case 'about-me': {
      return makeDiv('about-me', {
        avatar: a.avatar || a.image || '',
        name: a.name || 'Your Name',
        role: a.role || '',
        bio: a.bio || a.description || (typeof spec.content === 'string' ? spec.content : ''),
        accentColor: a.accentColor || '#6366f1',
        layout: a.layout || 'left',
      });
    }

    case 'tech-stack': {
      const items = Array.isArray(a.items) ? a.items : [];
      return makeDiv('tech-stack', {
        cols: a.cols || 4,
        accentColor: a.accentColor || '#6366f1',
        items,
      });
    }

    case 'social-links': {
      const links = Array.isArray(a.links || a.items) ? (a.links || a.items) : [];
      return makeDiv('social-links', {
        style: a.style || 'pills',
        alignment: a.alignment || 'center',
        links,
      });
    }

    case 'browser-mockup': {
      return makeDiv('browser-mockup', {
        image: a.image || a.src || '',
        url: a.url || 'https://example.com',
        variant: a.variant || 'light',
      });
    }

    case 'phone-mockup': {
      return makeDiv('phone-mockup', {
        image: a.image || a.src || '',
        variant: a.variant || 'dark',
        showStatusBar: a.showStatusBar ?? true,
      });
    }

    case 'before-after': {
      return makeDiv('before-after', {
        beforeImage: a.beforeImage || '',
        afterImage: a.afterImage || '',
        sliderPosition: a.sliderPosition ?? 50,
        beforeLabel: a.beforeLabel || 'Before',
        afterLabel: a.afterLabel || 'After',
      });
    }

    case 'interactive-demo': {
      return makeDiv('interactive-demo', {
        frames: Array.isArray(a.frames) ? a.frames : [],
        hotspots: Array.isArray(a.hotspots) ? a.hotspots : [],
        transition: a.transition || 'fade',
        showNav: a.showNav ?? true,
      });
    }

    case 'video-embed':
    case 'video': {
      return makeDiv('video-embed', {
        src: a.src || a.url || '',
      });
    }

    case 'annotated-image':
    case 'image': {
      const src = a.src || a.url || '';
      const alt = a.alt || a.caption || '';
      const annotations = Array.isArray(a.annotations) ? a.annotations : [];
      const annAttr = annotations.length > 0 ? ` data-annotations="${toAttrVal(annotations)}"` : '';
      return `<div data-type="annotated-image" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${annAttr}><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" /></div>`;
    }

    case 'marquee': {
      const items = Array.isArray(a.items) ? a.items : [];
      return makeDiv('marquee', {
        items,
        speed: a.speed || 'medium',
        direction: a.direction || 'left',
        separator: a.separator || 'star',
        accentColor: a.accentColor || '#6366f1',
      });
    }

    case 'glow-cards': {
      const cards = Array.isArray(a.cards || a.items) ? (a.cards || a.items) : [];
      return makeDiv('glow-cards', {
        cards,
        cols: a.cols || 3,
        cardBg: a.cardBg || 'white',
        textColor: a.textColor || 'light',
      });
    }

    case 'gradient-border': {
      return makeDiv('gradient-border', {
        title: a.title || '',
        description: a.description || (typeof spec.content === 'string' ? spec.content : ''),
        preset: a.preset ?? 0,
        borderWidth: a.borderWidth ?? 2,
        animSpeed: a.animSpeed || 'medium',
        borderRadius: a.borderRadius || 'md',
      });
    }

    case 'hover-reveal': {
      const cards = Array.isArray(a.cards || a.items) ? (a.cards || a.items) : [];
      return makeDiv('hover-reveal', {
        cards,
        cols: a.cols || 3,
        revealStyle: a.revealStyle || 'flip',
      });
    }

    case 'announcement-pill': {
      return makeDiv('announcement-pill', {
        label: a.label || 'New',
        message: a.message || a.title || (typeof spec.content === 'string' ? spec.content : ''),
        url: a.url || '',
        variant: a.variant || 'indigo',
        shimmer: a.shimmer ?? true,
        align: a.align || 'center',
      });
    }

    case 'gradient-blobs': {
      return makeDiv('gradient-blobs', {
        preset: a.preset ?? 0,
        title: a.title || '',
        subtitle: a.subtitle || (typeof spec.content === 'string' ? spec.content : ''),
        height: a.height || 'md',
        animate: a.animate ?? true,
      });
    }

    case 'noise-overlay': {
      return makeDiv('noise-overlay', {
        bgPreset: a.bgPreset ?? 0,
        noiseOpacity: a.noiseOpacity ?? 0.15,
        noiseDensity: a.noiseDensity ?? 50,
        title: a.title || '',
        subtitle: a.subtitle || (typeof spec.content === 'string' ? spec.content : ''),
        height: a.height || 'md',
      });
    }

    case 'confetti': {
      const colors = Array.isArray(a.colors)
        ? a.colors
        : ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
      return makeDiv('confetti', {
        message: a.message || (typeof spec.content === 'string' ? spec.content : 'Congratulations!'),
        emoji: a.emoji || '🎉',
        colors,
      });
    }

    case 'math-block':
    case 'math': {
      return makeDiv('math-block', {
        latex: a.latex || a.formula || (typeof spec.content === 'string' ? spec.content : 'E = mc^2'),
        caption: a.caption || '',
      });
    }

    case 'api-endpoint': {
      return makeDiv('api-endpoint', {
        method: (a.method || 'GET').toUpperCase(),
        path: a.path || '/api/v1/resources',
        summary: a.summary || '',
        responseCode: a.responseCode || '200 OK',
        responseBody: typeof a.responseBody === 'string' ? a.responseBody : JSON.stringify(a.responseBody || {}, null, 2),
      });
    }

    default: {
      const inner = typeof spec.content === 'string' ? ensureBlockHtml(spec.content, renderMarkdown) : '';
      return makeDiv(normalized || 'paragraph', spec.attrs || {}, inner);
    }
  }
}

export const AGENT_BLOCK_CATALOG: BlockCatalogEntry[] = [
  {
    type: 'callout',
    category: 'Callouts',
    description: 'Styled alert box (info, warning, success, danger)',
    attrs: { type: 'info | warning | success | danger' },
    markdownExample: ':::callout{type="warning"}\nAlways back up your data before migrating.\n:::',
    jsonExample: { type: 'callout', attrs: { type: 'warning' }, content: 'Always back up your data before migrating.' },
  },
  {
    type: 'mermaid',
    category: 'Media',
    description: 'Mermaid diagram (flowchart, sequenceDiagram, gantt, pie, erDiagram, stateDiagram-v2)',
    attrs: { definition: 'string', theme: 'default | dark | forest | neutral' },
    markdownExample: '```mermaid\nflowchart LR\n  A[Source] --> B[Build] --> C[Deploy]\n```',
    jsonExample: { type: 'mermaid', definition: 'flowchart LR\n  A[Source] --> B[Build] --> C[Deploy]', theme: 'default' },
  },
  {
    type: 'workflow',
    category: 'Data',
    description: 'Connected step-by-step process cards with icons and rich body content',
    attrs: {
      accentColor: 'indigo | emerald | amber | rose | sky | violet | slate',
      cardBg: 'white | light-gray | warm-cream | dark-slate | frost | dusk | mint | charcoal | shimmer | pulse-glow',
      steps: 'Array<{ title: string, icon?: string, content: string }>',
    },
    markdownExample: ':::workflow{accentColor="indigo" cardBg="frost"}\n### 1. Install Dependencies {icon="download"}\nRun `npm install` in the root folder.\n\n### 2. Start Dev Server {icon="play"}\nRun `npm run dev` to launch on port 3000.\n:::',
    jsonExample: {
      type: 'workflow',
      accentColor: 'indigo',
      cardBg: 'frost',
      steps: [
        { title: 'Install Dependencies', icon: 'download', content: 'Run `npm install` in the root folder.' },
        { title: 'Start Dev Server', icon: 'play', content: 'Run `npm run dev` to launch on port 3000.' },
      ],
    },
  },
  {
    type: 'timeline',
    category: 'Data',
    description: 'Vertical milestone/step timeline with dates, titles, and body paragraphs',
    attrs: {
      accentColor: 'blue | indigo | emerald | amber | rose | violet | slate',
      markerStyle: 'number | dot | check',
      steps: 'Array<{ title: string, date?: string, content: string }>',
    },
    markdownExample: ':::timeline{accentColor="emerald" markerStyle="check"}\n### Phase 1: Architecture {date="Week 1"}\nDefine core data models and storage interfaces.\n\n### Phase 2: Implementation {date="Week 2"}\nBuild custom Tiptap blocks and HTML exporter.\n:::',
    jsonExample: {
      type: 'timeline',
      accentColor: 'emerald',
      markerStyle: 'check',
      steps: [
        { title: 'Phase 1: Architecture', date: 'Week 1', content: 'Define core data models and storage interfaces.' },
        { title: 'Phase 2: Implementation', date: 'Week 2', content: 'Build custom Tiptap blocks and HTML exporter.' },
      ],
    },
  },
  {
    type: 'card-grid',
    category: 'Data',
    description: '2, 3, or 4 column feature card grid with emoji, title, and rich body',
    attrs: {
      cols: '2 | 3 | 4',
      cards: 'Array<{ emoji: string, title: string, content: string }>',
    },
    markdownExample: ':::card-grid{cols="3"}\n### 🚀 Zero Config\nWorks out of the box with local IndexedDB storage.\n\n### 🎨 Custom Themes\nChoose fonts, colors, heroes, and dark mode.\n\n### 📦 Single-File Export\nExports 100% self-contained HTML.\n:::',
    jsonExample: {
      type: 'card-grid',
      cols: 3,
      cards: [
        { emoji: '🚀', title: 'Zero Config', content: 'Works out of the box with local IndexedDB storage.' },
        { emoji: '🎨', title: 'Custom Themes', content: 'Choose fonts, colors, heroes, and dark mode.' },
        { emoji: '📦', title: 'Single-File Export', content: 'Exports 100% self-contained HTML.' },
      ],
    },
  },
  {
    type: 'accordion',
    category: 'Layout',
    description: 'Collapsible FAQ / detail sections',
    attrs: { items: 'Array<{ title: string, content: string }>' },
    markdownExample: ':::accordion\n### How is data stored?\nAll documents are stored locally in IndexedDB.\n\n### Can I export offline HTML?\nYes, exported HTML files inline all CSS, JS, and images.\n:::',
    jsonExample: {
      type: 'accordion',
      items: [
        { title: 'How is data stored?', content: 'All documents are stored locally in IndexedDB.' },
        { title: 'Can I export offline HTML?', content: 'Yes, exported HTML files inline all CSS, JS, and images.' },
      ],
    },
  },
  {
    type: 'tabs',
    category: 'Layout',
    description: 'Tabbed content panels',
    attrs: { items: 'Array<{ label: string, content: string }>' },
    markdownExample: ':::tabs\n### npm\n```bash\nnpm install guide-em\n```\n\n### pnpm\n```bash\npnpm add guide-em\n```\n:::',
    jsonExample: {
      type: 'tabs',
      items: [
        { label: 'npm', content: '```bash\nnpm install guide-em\n```' },
        { label: 'pnpm', content: '```bash\npnpm add guide-em\n```' },
      ],
    },
  },
  {
    type: 'grid',
    category: 'Layout',
    description: '2-column side-by-side layout',
    attrs: { layout: '50-50 | 40-60 | 60-40', columns: '[string, string]' },
    markdownExample: ':::grid{layout="50-50"}\n### Left Column\nKey concepts and architecture notes.\n---column---\n### Right Column\nCode examples and implementation details.\n:::',
    jsonExample: {
      type: 'grid',
      layout: '50-50',
      columns: ['### Left Column\nKey concepts.', '### Right Column\nCode examples.'],
    },
  },
  {
    type: 'stat-row',
    category: 'Data',
    description: 'Animated KPI / statistics row',
    attrs: { stats: 'Array<{ value: string, prefix?: string, suffix?: string, label: string, icon?: string }>' },
    markdownExample: ':::stat-row\n- 99.9% | Uptime SLA | ⚡\n- <50ms | P95 Latency | 🚀\n- 35+ | Custom Blocks | 🧩\n:::',
    jsonExample: {
      type: 'stat-row',
      stats: [
        { value: '99.9', suffix: '%', label: 'Uptime SLA', icon: '⚡' },
        { value: '50', prefix: '<', suffix: 'ms', label: 'P95 Latency', icon: '🚀' },
        { value: '35', suffix: '+', label: 'Custom Blocks', icon: '🧩' },
      ],
    },
  },
  {
    type: 'code-window',
    category: 'Media',
    description: 'macOS-style code window with traffic-light dots and title bar',
    attrs: { title: 'string', language: 'string', theme: 'dark | light | nord | dracula', code: 'string' },
    markdownExample: ':::code-window{title="server.ts" language="typescript" theme="dracula"}\nimport express from "express";\nconst app = express();\napp.listen(3000);\n:::',
    jsonExample: {
      type: 'code-window',
      title: 'server.ts',
      language: 'typescript',
      theme: 'dracula',
      code: 'import express from "express";\nconst app = express();\napp.listen(3000);',
    },
  },
  {
    type: 'code-diff',
    category: 'Media',
    description: 'Side-by-side Before / After code comparison',
    attrs: { language: 'string', codeBefore: 'string', codeAfter: 'string' },
    markdownExample: ':::code-diff{language="typescript"}\nconst port = 8080;\n===after===\nconst port = Number(process.env.PORT ?? 3000);\n:::',
    jsonExample: {
      type: 'code-diff',
      language: 'typescript',
      codeBefore: 'const port = 8080;',
      codeAfter: 'const port = Number(process.env.PORT ?? 3000);',
    },
  },
  {
    type: 'bento-grid',
    category: 'Layout',
    description: 'Asymmetric Apple/Linear-style Bento grid',
    attrs: { cells: 'Array<{ icon?: string, title: string, description: string, colSpan?: 1|2|3, rowSpan?: 1|2, variant?: "default"|"dark"|"accent"|"glass" }>' },
    markdownExample: '```guide-block\n{\n  "type": "bento-grid",\n  "cells": [\n    { "icon": "⚡", "title": "Instant Export", "description": "Zero external dependencies.", "colSpan": 2, "variant": "dark" },\n    { "icon": "🎨", "title": "Themeable", "description": "Full brand customization.", "colSpan": 1, "variant": "accent" }\n  ]\n}\n```',
    jsonExample: {
      type: 'bento-grid',
      cells: [
        { icon: '⚡', title: 'Instant Export', description: 'Zero external dependencies.', colSpan: 2, variant: 'dark' },
        { icon: '🎨', title: 'Themeable', description: 'Full brand customization.', colSpan: 1, variant: 'accent' },
      ],
    },
  },
  {
    type: 'feature-spotlight',
    category: 'Showcase',
    description: 'Split visual + feature description with bullet checklist',
    attrs: { title: 'string', description: 'string', icon: 'string', image: 'string', layout: 'image-left | image-right', bullets: 'string[]', accentColor: 'string' },
    markdownExample: ':::feature-spotlight{title="Built for Agents" icon="🤖" layout="image-left" accentColor="#6366f1"}\nAuthor rich documentation from Markdown, JSON, or the browser API.\n- Full custom block support\n- Automatic IndexedDB & file sync\n- Self-contained HTML export\n:::',
    jsonExample: {
      type: 'feature-spotlight',
      title: 'Built for Agents',
      icon: '🤖',
      layout: 'image-left',
      description: 'Author rich documentation from Markdown, JSON, or the browser API.',
      bullets: ['Full custom block support', 'Automatic IndexedDB & file sync', 'Self-contained HTML export'],
    },
  },
  {
    type: 'sticky-scroll',
    category: 'Layout',
    description: 'Stripe-style pinned left title with interactive step panels and code snippets',
    attrs: { stickyTitle: 'string', stickyDescription: 'string', accentColor: 'string', steps: 'Array<{ title: string, description: string, code?: string }>' },
    markdownExample: '```guide-block\n{\n  "type": "sticky-scroll",\n  "stickyTitle": "Deployment Pipeline",\n  "stickyDescription": "Three automated stages from commit to production.",\n  "steps": [\n    { "title": "1. Lint & Typecheck", "description": "Verify TypeScript types.", "code": "npm run lint" },\n    { "title": "2. Build Bundle", "description": "Compile production assets.", "code": "npm run build" }\n  ]\n}\n```',
    jsonExample: {
      type: 'sticky-scroll',
      stickyTitle: 'Deployment Pipeline',
      stickyDescription: 'Three automated stages from commit to production.',
      steps: [
        { title: '1. Lint & Typecheck', description: 'Verify TypeScript types.', code: 'npm run lint' },
        { title: '2. Build Bundle', description: 'Compile production assets.', code: 'npm run build' },
      ],
    },
  },
  {
    type: 'changelog-timeline',
    category: 'Data',
    description: 'Release changelog with version badges and categorized items (added, fixed, changed, removed)',
    attrs: { entries: 'Array<{ version: string, date?: string, items: Array<{ type: "added"|"fixed"|"changed"|"removed", text: string }> }>' },
    markdownExample: '```guide-block\n{\n  "type": "changelog-timeline",\n  "entries": [\n    {\n      "version": "v2.0.0",\n      "date": "2026-11-09",\n      "items": [\n        { "type": "added", "text": "Agent Markdown & JSON block authoring" },\n        { "type": "added", "text": "window.guideEm programmatic API" }\n      ]\n    }\n  ]\n}\n```',
    jsonExample: {
      type: 'changelog-timeline',
      entries: [
        {
          version: 'v2.0.0',
          date: '2026-11-09',
          items: [
            { type: 'added', text: 'Agent Markdown & JSON block authoring' },
            { type: 'added', text: 'window.guideEm programmatic API' },
          ],
        },
      ],
    },
  },
  {
    type: 'hero-banner',
    category: 'Showcase',
    description: 'Gradient call-to-action banner with title, subtitle, and button',
    attrs: { title: 'string', subtitle: 'string', ctaText: 'string', ctaUrl: 'string', gradientFrom: 'string', gradientTo: 'string' },
    markdownExample: ':::hero-banner{title="Ready to Ship?" subtitle="Export your guide as a single HTML file." ctaText="Get Started" ctaUrl="#quick-start" gradientFrom="#4f46e5" gradientTo="#ec4899"}\n:::',
    jsonExample: {
      type: 'hero-banner',
      title: 'Ready to Ship?',
      subtitle: 'Export your guide as a single HTML file.',
      ctaText: 'Get Started',
      ctaUrl: '#quick-start',
    },
  },
  {
    type: 'testimonial',
    category: 'Showcase',
    description: 'Customer / user quote block with author name and role',
    attrs: { quote: 'string', authorName: 'string', authorRole: 'string', avatarColor: 'string' },
    markdownExample: ':::testimonial{authorName="Alex Rivera" authorRole="Staff Engineer" avatarColor="#6366f1"}\nGuideEm cut our documentation publishing time from hours to seconds.\n:::',
    jsonExample: {
      type: 'testimonial',
      quote: 'GuideEm cut our documentation publishing time from hours to seconds.',
      authorName: 'Alex Rivera',
      authorRole: 'Staff Engineer',
    },
  },
  {
    type: 'announcement-pill',
    category: 'Showcase',
    description: 'Shimmering announcement pill badge',
    attrs: { label: 'string', message: 'string', url: 'string', variant: 'indigo | rose | emerald | amber | slate | dark' },
    markdownExample: ':::announcement-pill{label="NEW" message="Agent authoring & CLI export is live" variant="indigo"}\n:::',
    jsonExample: {
      type: 'announcement-pill',
      label: 'NEW',
      message: 'Agent authoring & CLI export is live',
      variant: 'indigo',
    },
  },
];
