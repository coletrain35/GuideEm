import { ThemeConfig } from './storage';
import { sanitizeHtml } from './sanitize';

/**
 * Result of importing an exported HTML guide.
 */
export interface ImportResult {
  title: string;
  content: string; // Cleaned HTML ready for Tiptap setContent()
  theme: Partial<ThemeConfig>;
}

// ── Color reverse-maps ─────────────────────────────────────────────

const TIMELINE_COLOR_MAP: Record<string, string> = {
  '#3b82f6': 'blue',
  '#6366f1': 'indigo',
  '#10b981': 'emerald',
  '#f59e0b': 'amber',
  '#f43f5e': 'rose',
  '#8b5cf6': 'violet',
  '#64748b': 'slate',
};

const WORKFLOW_COLOR_MAP: Record<string, string> = {
  '#6366f1': 'indigo',
  '#10b981': 'emerald',
  '#f59e0b': 'amber',
  '#f43f5e': 'rose',
  '#0ea5e9': 'sky',
  '#8b5cf6': 'violet',
  '#64748b': 'slate',
};

// Reverse-map icon SVGs to names by detecting a unique path segment
const WORKFLOW_ICON_SIGNATURES: [string, string][] = [
  ['circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"', 'circle-dot'],
  ['M4.5 16.5c-1.5 1.26', 'rocket'],
  ['M12.22 2h-.44', 'settings'],
  ['M16 21v-2a4 4 0 0 0-4-4H6', 'users'],
  ['polyline points="16 18 22 12 16 6"', 'code'],
  ['M4 14a1 1 0 0 1-.78-1.63', 'zap'],
  ['M22 11.08V12a10 10 0 1 1', 'check-circle'],
  ['circle cx="11" cy="11" r="8"', 'search'],
  ['m22 2-7 20-4-9-9-4', 'send'],
  ['M20 13c0 5-3.5 7.5', 'shield'],
  ['ellipse cx="12" cy="5" rx="9" ry="3"', 'database'],
  ['circle cx="12" cy="12" r="10"/><path d="M12 2a14.5', 'globe'],
  ['rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7', 'mail'],
  ['M15 2H6a2 2 0 0 0-2 2v16', 'file-text'],
  ['line x1="12" x2="12" y1="20" y2="10"', 'bar-chart'],
  ['rect width="18" height="11" x="3" y="11"', 'lock'],
  ['M7 11V7a5 5 0 0 1 9.9-1', 'unlock'],
  ['M21.174 6.812', 'edit'],
  ['M2.062 12.348', 'eye'],
  ['M21 15v4a2 2 0 0 1-2 2H5', 'download'],
  ['polyline points="17 8 12 3 7 8"', 'upload'],
  ['polygon points="6 3 20 12 6 21', 'play'],
  ['M4 15s1-1 4-1', 'flag'],
  ['circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"', 'target'],
  ['M15 14c.2-1 .7-1.7', 'lightbulb'],
];

// Reverse-map workflow card BG presets by their inline style fingerprints
const WORKFLOW_CARD_BG_SIGNATURES: [string, string][] = [
  ['#ffffff', 'white'],
  ['#f8fafc', 'light-gray'],
  ['#fefce8', 'warm-cream'],
  ['#1e293b', 'dark-slate'],
  ['#f0f9ff', 'frost'],
  ['#faf5ff', 'dusk'],
  ['#ecfdf5', 'mint'],
  ['linear-gradient(135deg, #1e293b', 'charcoal'],
  ['rgba(99,102,241,0.05)', 'shimmer'],
];

// Social platform reverse-map from SVG path snippet
const PLATFORM_SIGNATURES: [string, string][] = [
  ['M12 0C5.37', 'GitHub'],
  ['M20.447 20.452h-3.554', 'LinkedIn'],
  ['M18.244 2.25h3.308', 'Twitter/X'],
  ['M12 24C5.385', 'Dribbble'],
  ['rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7', 'Email'],
  ['circle cx="12" cy="12" r="10"/><path d="M12 2a14.5', 'Website'],
  ['M23.498 6.186', 'YouTube'],
  ['M12 2.163c3.204', 'Instagram'],
  ['M6.938 4.503', 'Behance'],
];

// ── Helpers ─────────────────────────────────────────────────────────

function txt(el: Element | null): string {
  return el?.textContent?.trim() ?? '';
}

function attr(el: Element | null, name: string): string {
  return el?.getAttribute(name) ?? '';
}

/** Extract first hex color from an inline style property value. */
function extractHex(style: string): string {
  const m = style.match(/#[0-9a-fA-F]{6}/);
  return m ? m[0] : '';
}

/** Extract all hex colors from a string. */
function extractAllHex(s: string): string[] {
  return [...s.matchAll(/#[0-9a-fA-F]{6}/g)].map(m => m[0]);
}

/** Try to extract a gradient's first color from style="...linear-gradient(135deg, #aaa, #bbb)..." */
function extractGradientColors(style: string): { from: string; to: string } {
  const m = style.match(/linear-gradient\([^,]+,\s*(#[0-9a-fA-F]{6})[^,]*,\s*(#[0-9a-fA-F]{6})/);
  return m ? { from: m[1], to: m[2] } : { from: '', to: '' };
}

/** Replace an element in-place with a new element preserving position in parent. */
function replaceElement(oldEl: Element, newEl: Element) {
  oldEl.parentNode?.replaceChild(newEl, oldEl);
}

/** Create a div with data-type and optional data-* attrs. */
function makeBlock(doc: Document, type: string, attrs: Record<string, string> = {}): HTMLDivElement {
  const div = doc.createElement('div');
  div.setAttribute('data-type', type);
  for (const [k, v] of Object.entries(attrs)) {
    if (v) div.setAttribute(k, v);
  }
  return div;
}

/** Detect icon name from an SVG string. */
function detectWorkflowIcon(svgHtml: string): string {
  for (const [sig, name] of WORKFLOW_ICON_SIGNATURES) {
    if (svgHtml.includes(sig)) return name;
  }
  return 'circle-dot';
}

/** Detect platform from link SVG content. */
function detectPlatform(svgHtml: string): string {
  for (const [sig, name] of PLATFORM_SIGNATURES) {
    if (svgHtml.includes(sig)) return name;
  }
  return 'Website';
}

/** Reverse-map a hex color to the closest timeline color name. */
function reverseTimelineColor(hex: string): string {
  return TIMELINE_COLOR_MAP[hex.toLowerCase()] || 'blue';
}

/** Reverse-map a hex color to the closest workflow color name. */
function reverseWorkflowColor(hex: string): string {
  return WORKFLOW_COLOR_MAP[hex.toLowerCase()] || 'indigo';
}

/** Detect workflow card bg preset from inline style. */
function detectCardBgPreset(style: string): string {
  for (const [sig, name] of WORKFLOW_CARD_BG_SIGNATURES) {
    if (style.includes(sig)) return name;
  }
  return 'white';
}

// ── Theme Extraction ────────────────────────────────────────────────

function extractTheme(doc: Document): Partial<ThemeConfig> {
  const theme: Partial<ThemeConfig> = {};

  // Extract primary color from CSS variable in <style> blocks
  const styles = doc.querySelectorAll('style');
  let allCSS = '';
  styles.forEach(s => { allCSS += s.textContent ?? ''; });

  const brandMatch = allCSS.match(/--brand-primary:\s*(#[0-9a-fA-F]{6})/);
  if (brandMatch) theme.primaryColor = brandMatch[1];

  // Font family from body
  const bodyStyle = doc.body.getAttribute('style') || '';
  const fontMatch = bodyStyle.match(/font-family:\s*([^;]+)/);
  if (fontMatch) {
    const ff = fontMatch[1].toLowerCase();
    if (ff.includes('georgia') || ff.includes('serif') || ff.includes('merriweather')) {
      theme.fontFamily = 'editorial';
    } else if (ff.includes('monospace') || ff.includes('fira') || ff.includes('consolas')) {
      theme.fontFamily = 'technical';
    } else {
      theme.fontFamily = 'modern';
    }
  }

  // Hero detection
  const guideContainer = doc.querySelector('.guide-container');
  const heroSection = doc.querySelector('.hero-section');
  const heroPlain = guideContainer?.querySelector(':scope > div[style*="border-left"]');
  const gradientHero = guideContainer?.querySelector(':scope > div[style*="linear-gradient(135deg"]');
  const darkHero = guideContainer?.querySelector(':scope > div[style*="background: #0c0c11"]');
  const meshHero = guideContainer?.querySelector(':scope > div[style*="background: #0f0c1a"]');
  const editorialHero = guideContainer?.querySelector(':scope > div[style*="background: #fffbf7"]');

  // Legacy full-bleed hero (outside guide-container)
  if (heroSection) {
    const bgMatch = attr(heroSection, 'style').match(/background-color:\s*(#[0-9a-fA-F]{6})/);
    if (bgMatch && !theme.primaryColor) theme.primaryColor = bgMatch[1];
    const subtitle = heroSection.querySelector('p');
    const layout = attr(heroSection, 'style').includes('6rem') ? 'full' : 'compact';
    const coverImg = heroSection.querySelector('img');
    theme.hero = {
      style: 'none',
      enabled: true,
      coverImageBase64: coverImg ? attr(coverImg, 'src') : null,
      subtitle: txt(subtitle),
      layout: layout as 'full' | 'compact',
    };
  } else if (gradientHero) {
    const colors = extractGradientColors(attr(gradientHero, 'style'));
    if (colors.from && !theme.primaryColor) theme.primaryColor = colors.from;
    const subtitle = gradientHero.querySelector('p');
    const coverImg = gradientHero.querySelector('img');
    theme.hero = {
      style: 'gradient',
      enabled: true,
      coverImageBase64: coverImg ? attr(coverImg, 'src') : null,
      subtitle: txt(subtitle),
      layout: 'full',
    };
  } else if (darkHero) {
    const subtitle = darkHero.querySelector('div[style*="z-index: 1"] > p') || darkHero.querySelector('p');
    theme.hero = {
      style: 'dark',
      enabled: true,
      coverImageBase64: null,
      subtitle: txt(subtitle),
      layout: 'full',
    };
  } else if (meshHero) {
    const subtitle = meshHero.querySelector('div[style*="z-index: 1"] > p') || meshHero.querySelector('p');
    theme.hero = {
      style: 'mesh',
      enabled: true,
      coverImageBase64: null,
      subtitle: txt(subtitle),
      layout: 'full',
    };
  } else if (editorialHero) {
    const subtitle = editorialHero.querySelector('p[style*="text-transform"]') || editorialHero.querySelector('p');
    theme.hero = {
      style: 'editorial',
      enabled: true,
      coverImageBase64: null,
      subtitle: txt(subtitle),
      layout: 'full',
    };
  }

  // Logo
  const logoImg = doc.querySelector('.brand-header img, .sticky-header img');
  if (logoImg) theme.logoBase64 = attr(logoImg, 'src');

  // Features detection
  const features: ThemeConfig['features'] = {
    stickyHeader: !!doc.querySelector('.sticky-header'),
    scrollReveal: allCSS.includes('reveal-fade-up'),
    darkModeSupport: allCSS.includes('prefers-color-scheme: dark') || allCSS.includes('html.dark'),
    readingProgressBar: !!doc.getElementById('reading-progress'),
    backToTop: !!doc.getElementById('back-to-top'),
    printStylesheet: allCSS.includes('@media print'),
    shareButtons: !!doc.getElementById('share-bar'),
  };
  theme.features = features;

  // Footer
  const footer = doc.querySelector('.site-footer');
  if (footer) {
    const links: { label: string; url: string }[] = [];
    footer.querySelectorAll('.site-footer-links a').forEach(a => {
      links.push({ label: txt(a), url: attr(a, 'href') });
    });
    theme.footer = {
      enabled: true,
      text: txt(footer.querySelector('.site-footer-text')),
      links,
      showBranding: !!footer.querySelector('.site-footer-branding'),
    };
  }

  // Code theme detection
  const preRule = allCSS.match(/pre\s*\{[^}]*background-color:\s*(#[0-9a-fA-F]{6})/);
  if (preRule) {
    const bg = preRule[1].toLowerCase();
    if (bg === '#f8fafc') theme.codeTheme = 'light';
    else if (bg === '#002b36') theme.codeTheme = 'solarized';
    else theme.codeTheme = 'dark';
  }

  return theme;
}

// ── Block Reversal Functions ────────────────────────────────────────

function reverseAccordions(doc: Document) {
  doc.querySelectorAll('.accordion-wrapper').forEach(wrapper => {
    const accordion = makeBlock(doc, 'accordion');
    wrapper.querySelectorAll(':scope > .accordion-item').forEach(item => {
      const titleSpan = item.querySelector('.accordion-header span');
      const bodyInner = item.querySelector('.accordion-body-inner');
      const accordionItem = makeBlock(doc, 'accordion-item', {
        'data-title': txt(titleSpan),
      });
      if (bodyInner) accordionItem.innerHTML = bodyInner.innerHTML;
      accordion.appendChild(accordionItem);
    });
    replaceElement(wrapper, accordion);
  });
}

function reverseTabs(doc: Document) {
  doc.querySelectorAll('.tab-group').forEach(group => {
    // Skip if already has data-type (wasn't transformed)
    if (group.getAttribute('data-type')) return;
    const tabGroup = makeBlock(doc, 'tab-group');
    const buttons = group.querySelectorAll('.tab-btn');
    const panels = group.querySelectorAll('.tab-panel');
    buttons.forEach((btn, i) => {
      const panel = panels[i];
      const tabPanel = makeBlock(doc, 'tab-panel', {
        'data-label': txt(btn),
      });
      if (panel) tabPanel.innerHTML = panel.innerHTML;
      tabGroup.appendChild(tabPanel);
    });
    replaceElement(group, tabGroup);
  });
}

function reverseCardGrids(doc: Document) {
  doc.querySelectorAll('.card-grid').forEach(grid => {
    if (grid.getAttribute('data-type')) return;
    const cols = attr(grid, 'data-cols') || '3';
    const cardGrid = makeBlock(doc, 'card-grid', { 'data-cols': cols });
    grid.querySelectorAll(':scope > .card').forEach(card => {
      const emoji = txt(card.querySelector('.card-emoji'));
      const title = txt(card.querySelector('.card-title'));
      const body = card.querySelector('.card-body');
      const cardNode = makeBlock(doc, 'card', {
        'data-emoji': emoji,
        'data-title': title,
      });
      if (body) cardNode.innerHTML = body.innerHTML;
      cardGrid.appendChild(cardNode);
    });
    replaceElement(grid, cardGrid);
  });
}

function reverseTimelines(doc: Document) {
  doc.querySelectorAll('.timeline').forEach(timeline => {
    if (timeline.getAttribute('data-type')) return;
    const style = attr(timeline as HTMLElement, 'style');
    const accentHex = style.match(/--tl-accent:\s*(#[0-9a-fA-F]{6})/)?.[1] || '#3b82f6';
    const accentName = reverseTimelineColor(accentHex);

    // Detect marker style from first step
    const firstMarker = timeline.querySelector('.timeline-step-marker');
    let markerStyle = 'number';
    if (firstMarker) {
      if (firstMarker.querySelector('svg')) markerStyle = 'check';
      else if (txt(firstMarker) === '') markerStyle = 'dot';
    }

    const timelineNode = makeBlock(doc, 'timeline', {
      'data-accent-color': accentName,
      'data-marker-style': markerStyle,
    });

    timeline.querySelectorAll('.timeline-step').forEach(step => {
      const date = txt(step.querySelector('.timeline-step-date'));
      const titleEl = step.querySelector('.timeline-step-title');
      const bodyEl = step.querySelector('.timeline-step-body');

      const stepNode = makeBlock(doc, 'timeline-step', {
        'data-date': date,
      });

      if (titleEl) {
        const titleNode = makeBlock(doc, 'timeline-step-title');
        titleNode.innerHTML = titleEl.innerHTML;
        stepNode.appendChild(titleNode);
      }

      if (bodyEl) {
        // Append body content directly (paragraphs, etc.)
        const temp = doc.createElement('div');
        temp.innerHTML = bodyEl.innerHTML;
        while (temp.firstChild) {
          stepNode.appendChild(temp.firstChild);
        }
      }

      timelineNode.appendChild(stepNode);
    });

    replaceElement(timeline, timelineNode);
  });
}

function reverseWorkflows(doc: Document) {
  doc.querySelectorAll('.workflow').forEach(workflow => {
    if (workflow.getAttribute('data-type')) return;

    // Detect accent color from first step icon gradient
    const firstIcon = workflow.querySelector('.workflow-step-icon');
    const iconStyle = firstIcon ? attr(firstIcon, 'style') : '';
    const accentHexes = extractAllHex(iconStyle);
    // The 600 shade is in the color property
    let accentName = 'indigo';
    const colorMatch = iconStyle.match(/color:\s*(#[0-9a-fA-F]{6})/);
    if (colorMatch) accentName = reverseWorkflowColor(colorMatch[1]);

    // Detect default card bg from first card
    const firstCard = workflow.querySelector('.workflow-card');
    const firstCardStyle = firstCard ? attr(firstCard, 'style') : '';
    const defaultBg = firstCard ? (attr(firstCard, 'data-bg-preset') || detectCardBgPreset(firstCardStyle)) : 'white';

    const workflowNode = makeBlock(doc, 'workflow', {
      'data-accent-color': accentName,
      'data-card-bg': defaultBg,
    });

    workflow.querySelectorAll('.workflow-step').forEach(step => {
      const card = step.querySelector('.workflow-card');
      const titleEl = step.querySelector('.workflow-step-title');
      const bodyEl = step.querySelector('.workflow-step-body');
      const iconEl = step.querySelector('.workflow-step-icon');
      const imageEl = step.querySelector('.workflow-step-image img');

      const iconName = iconEl ? detectWorkflowIcon(iconEl.innerHTML) : 'circle-dot';
      const cardBgPreset = card ? (attr(card, 'data-bg-preset') || detectCardBgPreset(attr(card, 'style'))) : '';
      const bgOverride = cardBgPreset !== defaultBg ? cardBgPreset : '';

      const stepNode = makeBlock(doc, 'workflow-step', {
        'data-title': txt(titleEl),
        'data-icon': iconName,
        ...(imageEl ? { 'data-image': attr(imageEl, 'src') } : {}),
        ...(bgOverride ? { 'data-card-bg-override': bgOverride } : {}),
      });

      if (bodyEl) {
        // Strip dark-mode inline color overrides that were added by the exporter
        const temp = doc.createElement('div');
        temp.innerHTML = bodyEl.innerHTML;
        temp.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, strong, blockquote, a, code').forEach(el => {
          (el as HTMLElement).style.removeProperty('color');
          (el as HTMLElement).style.removeProperty('background-color');
          if (!(el as HTMLElement).getAttribute('style')?.trim()) {
            el.removeAttribute('style');
          }
        });
        stepNode.innerHTML = temp.innerHTML;
      }

      workflowNode.appendChild(stepNode);
    });

    replaceElement(workflow, workflowNode);
  });
}

function reverseBackgroundSections(doc: Document) {
  doc.querySelectorAll('.background-section').forEach(section => {
    if (section.getAttribute('data-type')) return;
    const bgEl = section.querySelector('.background-section-bg');
    const contentEl = section.querySelector('.background-section-content');

    // Try to reverse-map bg preset from background-color
    const bgStyle = bgEl ? attr(bgEl, 'style') : '';
    const bgColor = bgStyle.match(/background-color:\s*([^;]+)/)?.[1]?.trim() || '';
    const contentStyle = contentEl ? attr(contentEl, 'style') : '';
    const padding = contentStyle.match(/padding:\s*([^;]+)/)?.[1]?.trim() || '2rem';

    // Reverse padding map
    let paddingKey = 'md';
    if (padding === '1rem') paddingKey = 'sm';
    else if (padding === '3rem') paddingKey = 'lg';

    // Reverse border radius from parent
    const parentStyle = attr(section, 'style');
    const radiusMatch = parentStyle.match(/border-radius:\s*([^;]+)/);
    let radiusKey = 'md';
    if (radiusMatch) {
      const r = radiusMatch[1].trim();
      if (r === '0') radiusKey = 'none';
      else if (r === '1.5rem') radiusKey = 'lg';
    }

    // Best-effort preset detection - just store what we can
    const sectionNode = makeBlock(doc, 'background-section', {
      'data-bg-preset': 'light-gray', // fallback
      'data-padding': paddingKey,
      'data-border-radius': radiusKey,
    });

    if (contentEl) sectionNode.innerHTML = contentEl.innerHTML;
    replaceElement(section, sectionNode);
  });
}

function reverseSectionDividers(doc: Document) {
  doc.querySelectorAll('.section-divider').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const style = attr(el, 'data-style') || 'gradient';
    const node = makeBlock(doc, 'section-divider', { 'data-style': style });
    replaceElement(el, node);
  });
}

function reverseVideoEmbeds(doc: Document) {
  doc.querySelectorAll('.video-embed').forEach(el => {
    if (el.getAttribute('data-type')) return;
    let src = '';
    const iframe = el.querySelector('iframe');
    const video = el.querySelector('video');
    if (iframe) {
      const iframeSrc = attr(iframe, 'src');
      // Reverse embed URLs back to watch URLs
      const ytMatch = iframeSrc.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
      const vimeoMatch = iframeSrc.match(/player\.vimeo\.com\/video\/(\d+)/);
      if (ytMatch) src = `https://www.youtube.com/watch?v=${ytMatch[1]}`;
      else if (vimeoMatch) src = `https://vimeo.com/${vimeoMatch[1]}`;
      else src = iframeSrc;
    } else if (video) {
      src = attr(video, 'src');
    }
    const node = makeBlock(doc, 'video-embed', { 'data-src': src });
    replaceElement(el, node);
  });
}

function reverseCounters(doc: Document) {
  doc.querySelectorAll('.counter-block').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const target = attr(el, 'data-target') || '0';
    const prefix = txt(el.querySelector('.counter-prefix'));
    const suffix = txt(el.querySelector('.counter-suffix'));
    const label = txt(el.querySelector('.counter-label'));
    const node = makeBlock(doc, 'counter', {
      'data-value': target,
      'data-prefix': prefix,
      'data-suffix': suffix,
      'data-label': label,
    });
    replaceElement(el, node);
  });
}

function reverseTestimonials(doc: Document) {
  doc.querySelectorAll('.testimonial-card').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const quote = txt(el.querySelector('.testimonial-quote'));
    const authorName = txt(el.querySelector('.testimonial-author-name'));
    const authorRole = txt(el.querySelector('.testimonial-author-role'));
    const avatarEl = el.querySelector('.testimonial-avatar');
    const avatarColor = avatarEl ? extractHex(attr(avatarEl, 'style')) : '#6366f1';
    const node = makeBlock(doc, 'testimonial', {
      'data-quote': quote,
      'data-author-name': authorName,
      'data-author-role': authorRole,
      'data-avatar-color': avatarColor,
    });
    replaceElement(el, node);
  });
}

function reverseHeroBanners(doc: Document) {
  doc.querySelectorAll('.hero-banner').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const inner = el.querySelector('.hero-banner-inner');
    const gradientStyle = inner ? attr(inner, 'style') : '';
    const colors = extractGradientColors(gradientStyle);
    const title = txt(el.querySelector('.hero-banner-title'));
    const subtitle = txt(el.querySelector('.hero-banner-subtitle'));
    const ctaEl = el.querySelector('.hero-banner-cta');
    const node = makeBlock(doc, 'hero-banner', {
      'data-gradient-from': colors.from || '#6366f1',
      'data-gradient-to': colors.to || '#ec4899',
      'data-title': title,
      'data-subtitle': subtitle,
      'data-cta-text': ctaEl ? txt(ctaEl) : '',
      'data-cta-url': ctaEl ? attr(ctaEl, 'href') : '',
    });
    replaceElement(el, node);
  });
}

function reverseProjectCards(doc: Document) {
  // Only standalone project-cards (not inside a gallery)
  doc.querySelectorAll('.project-card').forEach(el => {
    if (el.getAttribute('data-type')) return;
    if (el.closest('.project-gallery')) return;
    const thumbnail = el.querySelector('.project-card-thumbnail img');
    const title = txt(el.querySelector('.project-card-title'));
    const description = txt(el.querySelector('.project-card-description'));
    const tags: string[] = [];
    el.querySelectorAll('.project-card-tag').forEach(tag => tags.push(txt(tag)));
    const liveLink = el.querySelector('.project-card-link-live');
    const repoLink = el.querySelector('.project-card-link-repo');
    const accentColor = liveLink ? extractHex(attr(liveLink, 'style')) : '#6366f1';

    const node = makeBlock(doc, 'project-card', {
      'data-thumbnail': thumbnail ? attr(thumbnail, 'src') : '',
      'data-title': title,
      'data-description': description,
      'data-tags': JSON.stringify(tags),
      'data-live-url': liveLink ? attr(liveLink, 'href') : '',
      'data-repo-url': repoLink ? attr(repoLink, 'href') : '',
      'data-accent-color': accentColor,
    });
    replaceElement(el, node);
  });
}

function reverseProjectGalleries(doc: Document) {
  doc.querySelectorAll('.project-gallery').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const cols = attr(el, 'data-cols') || '2';
    const cards: any[] = [];
    el.querySelectorAll('.project-card').forEach(card => {
      const thumbnail = card.querySelector('.project-card-thumbnail img');
      const title = txt(card.querySelector('.project-card-title'));
      const description = txt(card.querySelector('.project-card-description'));
      const tags: string[] = [];
      card.querySelectorAll('.project-card-tag').forEach(tag => tags.push(txt(tag)));
      const liveLink = card.querySelector('.project-card-link-live');
      const repoLink = card.querySelector('.project-card-link-repo');
      const accentColor = liveLink ? extractHex(attr(liveLink, 'style')) : '#6366f1';
      cards.push({
        thumbnail: thumbnail ? attr(thumbnail, 'src') : '',
        title,
        description,
        tags,
        liveUrl: liveLink ? attr(liveLink, 'href') : '',
        repoUrl: repoLink ? attr(repoLink, 'href') : '',
        accentColor,
      });
    });
    const node = makeBlock(doc, 'project-gallery', {
      'data-cols': cols,
      'data-cards': JSON.stringify(cards),
    });
    replaceElement(el, node);
  });
}

function reverseAboutMe(doc: Document) {
  doc.querySelectorAll('.about-me').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const avatarImg = el.querySelector('.about-me-avatar-img');
    const avatarPlaceholder = el.querySelector('.about-me-avatar-placeholder');
    const name = txt(el.querySelector('.about-me-name'));
    const role = txt(el.querySelector('.about-me-role'));
    const bio = txt(el.querySelector('.about-me-bio'));
    const nameEl = el.querySelector('.about-me-name');
    const accentColor = nameEl ? extractHex(attr(nameEl, 'style')) : '#6366f1';

    // Detect layout from DOM order
    const avatarCol = el.querySelector('.about-me-avatar-col');
    const textCol = el.querySelector('.about-me-text-col');
    let layout = 'left';
    if (avatarCol && textCol && avatarCol.compareDocumentPosition(textCol) & Node.DOCUMENT_POSITION_PRECEDING) {
      layout = 'right';
    }

    const node = makeBlock(doc, 'about-me', {
      'data-avatar': avatarImg ? attr(avatarImg, 'src') : '',
      'data-name': name,
      'data-role': role,
      'data-bio': bio,
      'data-accent-color': accentColor,
      'data-layout': layout,
    });
    replaceElement(el, node);
  });
}

function reverseTechStack(doc: Document) {
  // Tech stack items are in a grid div with .tech-item children but no class on the parent
  // The exporter removes data-type and sets inline grid style
  doc.querySelectorAll('div').forEach(el => {
    if (el.getAttribute('data-type')) return;
    // Detect tech stack by presence of .tech-item children and grid style
    const items = el.querySelectorAll(':scope > .tech-item');
    if (items.length === 0) return;
    const style = attr(el, 'style');
    if (!style.includes('grid-template-columns')) return;

    const colsMatch = style.match(/repeat\((\d+)/);
    const cols = colsMatch ? colsMatch[1] : '4';
    const firstItem = items[0];
    const accentColor = firstItem ? extractHex(attr(firstItem, 'style')) : '#6366f1';

    const itemData: { icon: string; label: string }[] = [];
    items.forEach(item => {
      itemData.push({
        icon: txt(item.querySelector('.tech-item-icon')),
        label: txt(item.querySelector('.tech-item-label')),
      });
    });

    const node = makeBlock(doc, 'tech-stack', {
      'data-items': JSON.stringify(itemData),
      'data-cols': cols,
      'data-accent-color': accentColor,
    });
    replaceElement(el, node);
  });
}

function reverseSocialLinks(doc: Document) {
  doc.querySelectorAll('.social-links').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const alignment = attr(el, 'data-alignment') || 'center';
    const styleAttr = attr(el, 'data-style') || 'pills';

    const links: { platform: string; url: string; label: string }[] = [];
    el.querySelectorAll('a.social-link').forEach(a => {
      const svgContent = a.querySelector('svg')?.outerHTML || '';
      const platform = detectPlatform(svgContent);
      const spanText = a.querySelector('span');
      const label = spanText ? txt(spanText) : platform;
      links.push({
        platform,
        url: attr(a, 'href'),
        label,
      });
    });

    const node = makeBlock(doc, 'social-links', {
      'data-links': JSON.stringify(links),
      'data-style': styleAttr,
      'data-alignment': alignment,
    });
    replaceElement(el, node);
  });
}

function reversePortfolioHero(doc: Document) {
  doc.querySelectorAll('.portfolio-hero').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const inner = el.querySelector('.portfolio-hero-inner');
    const colors = inner ? extractGradientColors(attr(inner, 'style')) : { from: '#6366f1', to: '#ec4899' };
    const name = txt(el.querySelector('.portfolio-hero-name'));
    const tagline = txt(el.querySelector('.portfolio-hero-tagline'));
    const badge = txt(el.querySelector('.portfolio-hero-badge'));
    const ctaPrimary = el.querySelector('.portfolio-hero-cta-primary');
    const ctaSecondary = el.querySelector('.portfolio-hero-cta-secondary');
    const alignment = attr(el, 'data-alignment') || 'center';

    // Clean badge text (remove dot character)
    const cleanBadge = badge.replace(/^[●•]\s*/, '');

    const node = makeBlock(doc, 'portfolio-hero', {
      'data-name': name,
      'data-tagline': tagline,
      'data-badge-text': cleanBadge,
      'data-cta-text': ctaPrimary ? txt(ctaPrimary) : '',
      'data-cta-url': ctaPrimary ? attr(ctaPrimary, 'href') : '',
      'data-cta-secondary-text': ctaSecondary ? txt(ctaSecondary) : '',
      'data-cta-secondary-url': ctaSecondary ? attr(ctaSecondary, 'href') : '',
      'data-gradient-from': colors.from || '#6366f1',
      'data-gradient-to': colors.to || '#ec4899',
      'data-alignment': alignment,
    });
    replaceElement(el, node);
  });
}

function reverseStatRows(doc: Document) {
  doc.querySelectorAll('.stat-row').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const stats: any[] = [];
    el.querySelectorAll('.stat-item').forEach(item => {
      const target = attr(item, 'data-target') || '0';
      const icon = txt(item.querySelector('.stat-icon'));
      const prefix = txt(item.querySelector('.stat-prefix'));
      const suffix = txt(item.querySelector('.stat-suffix'));
      const label = txt(item.querySelector('.stat-label'));
      stats.push({ value: target, icon, prefix, suffix, label });
    });
    const node = makeBlock(doc, 'stat-row', {
      'data-stats': JSON.stringify(stats),
    });
    replaceElement(el, node);
  });
}

function reverseCodeDiffs(doc: Document) {
  doc.querySelectorAll('.code-diff').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const panels = el.querySelectorAll('.code-diff-panel');
    let codeBefore = '';
    let codeAfter = '';
    let language = 'javascript';

    if (panels.length >= 2) {
      const beforePre = panels[0].querySelector('.code-diff-pre');
      const afterPre = panels[1].querySelector('.code-diff-pre');
      if (beforePre) {
        codeBefore = Array.from(beforePre.querySelectorAll('.diff-line'))
          .map(line => line.textContent || '')
          .join('\n');
        const langClass = attr(beforePre, 'class').match(/lang-(\w+)/);
        if (langClass) language = langClass[1];
      }
      if (afterPre) {
        codeAfter = Array.from(afterPre.querySelectorAll('.diff-line'))
          .map(line => line.textContent || '')
          .join('\n');
      }
    }

    const node = makeBlock(doc, 'code-diff', {
      'data-code-before': codeBefore,
      'data-code-after': codeAfter,
      'data-language': language,
    });
    replaceElement(el, node);
  });
}

function reverseConfetti(doc: Document) {
  doc.querySelectorAll('.confetti-block').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const message = txt(el.querySelector('.confetti-message'));
    const emoji = txt(el.querySelector('.confetti-emoji'));
    const canvas = el.querySelector('.confetti-canvas');
    let colors = '["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6"]';
    if (canvas) {
      const colorsAttr = attr(canvas, 'data-colors');
      if (colorsAttr) colors = colorsAttr;
    }
    const node = makeBlock(doc, 'confetti', {
      'data-message': message,
      'data-emoji': emoji,
      'data-colors': colors,
    });
    replaceElement(el, node);
  });
}

function reverseBentoGrids(doc: Document) {
  doc.querySelectorAll('.bento-grid').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const cells: any[] = [];
    el.querySelectorAll('.bento-cell').forEach(cell => {
      const style = attr(cell, 'style');
      const colSpanMatch = style.match(/grid-column:\s*span\s+(\d+)/);
      const rowSpanMatch = style.match(/grid-row:\s*span\s+(\d+)/);
      const variantMatch = attr(cell, 'class').match(/bento-variant-(\w+)/);
      cells.push({
        icon: txt(cell.querySelector('.bento-icon')),
        title: txt(cell.querySelector('.bento-title')),
        description: txt(cell.querySelector('.bento-desc')),
        colSpan: colSpanMatch ? parseInt(colSpanMatch[1]) : 1,
        rowSpan: rowSpanMatch ? parseInt(rowSpanMatch[1]) : 1,
        variant: variantMatch ? variantMatch[1] : 'default',
      });
    });
    const node = makeBlock(doc, 'bento-grid', {
      'data-cells': JSON.stringify(cells),
    });
    replaceElement(el, node);
  });
}

function reverseFeatureSpotlights(doc: Document) {
  doc.querySelectorAll('.feature-spotlight').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const layout = attr(el, 'data-layout') || 'image-left';
    const visual = el.querySelector('.feature-spotlight-visual');
    const gradient = visual ? attr(visual, 'style').match(/background:\s*([^;]+)/)?.[1] || '' : '';
    const img = el.querySelector('.feature-spotlight-img');
    const icon = el.querySelector('.feature-spotlight-icon');
    const title = txt(el.querySelector('.feature-spotlight-title'));
    const description = txt(el.querySelector('.feature-spotlight-desc'));
    const bullets: string[] = [];
    el.querySelectorAll('.feature-spotlight-bullets li').forEach(li => {
      // Remove the check span text
      const check = li.querySelector('.feature-spotlight-check');
      const text = li.textContent?.replace(check?.textContent || '', '').trim() || '';
      bullets.push(text);
    });
    const checkEl = el.querySelector('.feature-spotlight-check');
    const accentColor = checkEl ? extractHex(attr(checkEl, 'style')) : '#6366f1';

    const node = makeBlock(doc, 'feature-spotlight', {
      'data-image': img ? attr(img, 'src') : '',
      'data-icon': icon ? txt(icon) : '',
      'data-title': title,
      'data-description': description,
      'data-gradient': gradient,
      'data-layout': layout,
      'data-bullets': JSON.stringify(bullets),
      'data-accent-color': accentColor,
    });
    replaceElement(el, node);
  });
}

function reverseStickyScroll(doc: Document) {
  doc.querySelectorAll('.sticky-scroll').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const stickyTitle = txt(el.querySelector('.sticky-scroll-title'));
    const stickyDescription = txt(el.querySelector('.sticky-scroll-desc'));
    const accentBar = el.querySelector('.sticky-scroll-accent-bar');
    const accentColor = accentBar ? extractHex(attr(accentBar, 'style')) : '#6366f1';

    const steps: any[] = [];
    el.querySelectorAll('.sticky-scroll-panel').forEach(panel => {
      steps.push({
        title: txt(panel.querySelector('.sticky-scroll-panel-title')),
        description: txt(panel.querySelector('.sticky-scroll-panel-desc')),
        code: txt(panel.querySelector('.sticky-scroll-code')),
      });
    });

    const node = makeBlock(doc, 'sticky-scroll', {
      'data-sticky-title': stickyTitle,
      'data-sticky-description': stickyDescription,
      'data-accent-color': accentColor,
      'data-steps': JSON.stringify(steps),
    });
    replaceElement(el, node);
  });
}

function reverseCodeWindows(doc: Document) {
  doc.querySelectorAll('.code-window').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const titleEl = el.querySelector('.code-window-title');
    const langEl = el.querySelector('.code-window-lang');
    const bodyEl = el.querySelector('.code-window-body');
    const titleBarEl = el.querySelector('.code-window-titlebar');

    const code = bodyEl?.textContent || '';
    const title = txt(titleEl);
    const language = txt(langEl);

    // Detect theme from body background
    const bodyStyle = bodyEl ? attr(bodyEl, 'style') : '';
    const bgColor = bodyStyle.match(/background:\s*(#[0-9a-fA-F]{6})/)?.[1] || '';
    let theme = 'dark';
    if (bgColor === '#fafafa') theme = 'light';
    else if (bgColor === '#2e3440') theme = 'nord';
    else if (bgColor === '#282a36') theme = 'dracula';

    const node = makeBlock(doc, 'code-window', {
      'data-code': code,
      'data-language': language,
      'data-title': title,
      'data-theme': theme,
    });
    replaceElement(el, node);
  });
}

function reverseChangelogTimelines(doc: Document) {
  doc.querySelectorAll('.changelog-timeline').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const entries: any[] = [];
    el.querySelectorAll('.changelog-entry').forEach(entry => {
      const version = txt(entry.querySelector('.changelog-version'));
      const date = txt(entry.querySelector('.changelog-date'));
      const items: { type: string; text: string }[] = [];

      entry.querySelectorAll('.changelog-type-group').forEach(group => {
        const badge = txt(group.querySelector('.changelog-type-badge')).toLowerCase();
        group.querySelectorAll('.changelog-items li').forEach(li => {
          items.push({ type: badge, text: txt(li) });
        });
      });

      entries.push({ version, date, items });
    });

    const node = makeBlock(doc, 'changelog-timeline', {
      'data-entries': JSON.stringify(entries),
    });
    replaceElement(el, node);
  });
}

function reverseBrowserMockups(doc: Document) {
  doc.querySelectorAll('.browser-mockup').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const variant = attr(el, 'data-variant') || 'light';
    const screenImg = el.querySelector('.browser-screen img');
    const urlSpan = el.querySelector('.browser-urlbar span');
    const node = makeBlock(doc, 'browser-mockup', {
      'data-image': screenImg ? attr(screenImg, 'src') : '',
      'data-url': txt(urlSpan),
      'data-variant': variant,
    });
    replaceElement(el, node);
  });
}

function reversePhoneMockups(doc: Document) {
  doc.querySelectorAll('.phone-mockup').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const variant = attr(el, 'data-variant') || 'dark';
    const screenImg = el.querySelector('.phone-screen img');
    const statusBar = el.querySelector('.phone-status-bar');
    const node = makeBlock(doc, 'phone-mockup', {
      'data-image': screenImg ? attr(screenImg, 'src') : '',
      'data-variant': variant,
      'data-show-status-bar': statusBar ? 'true' : 'false',
    });
    replaceElement(el, node);
  });
}

function reverseBeforeAfter(doc: Document) {
  doc.querySelectorAll('.before-after').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const container = el.querySelector('.before-after-container');
    const sliderPos = container ? attr(container, 'data-slider') : '50';
    const afterImg = el.querySelector('.before-after-after-img');
    const beforeImg = el.querySelector('.before-after-before-clip img');
    const leftLabel = el.querySelector('.before-after-label-left');
    const rightLabel = el.querySelector('.before-after-label-right');

    const node = makeBlock(doc, 'before-after', {
      'data-before-image': beforeImg ? attr(beforeImg, 'src') : '',
      'data-after-image': afterImg ? attr(afterImg, 'src') : '',
      'data-slider-position': sliderPos || '50',
      'data-before-label': txt(leftLabel) || 'Before',
      'data-after-label': txt(rightLabel) || 'After',
    });
    replaceElement(el, node);
  });
}

function reverseMarquees(doc: Document) {
  doc.querySelectorAll('.marquee-block').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const track = el.querySelector('.marquee-track');
    const trackStyle = track ? attr(track, 'style') : '';

    // Extract items (only first half since they're doubled)
    const allItems = el.querySelectorAll('.marquee-item');
    const halfLen = Math.ceil(allItems.length / 2);
    const items: { emoji: string; text: string }[] = [];
    for (let i = 0; i < halfLen; i++) {
      const item = allItems[i];
      const spans = item.querySelectorAll(':scope > span');
      let emoji = '';
      let text = '';
      spans.forEach(span => {
        if (span.classList.contains('marquee-sep')) return;
        const content = txt(span);
        if (content && !text && content.length <= 4 && /[\p{Emoji}]/u.test(content)) emoji = content;
        else if (content && !text) text = content;
        else if (content && text && !emoji) emoji = ''; // text was first
      });
      // Simpler: first span is emoji if it exists, second is text
      if (spans.length >= 2) {
        const first = spans[0];
        const second = spans[1];
        if (!first.classList.contains('marquee-sep') && !second.classList.contains('marquee-sep')) {
          emoji = txt(first);
          text = txt(second);
        }
      } else if (spans.length === 1 && !spans[0].classList.contains('marquee-sep')) {
        text = txt(spans[0]);
      }
      items.push({ emoji, text });
    }

    // Detect speed from animation-duration
    const durMatch = trackStyle.match(/animation-duration:\s*(\d+)s/);
    const dur = durMatch ? parseInt(durMatch[1]) : 35;
    const speed = dur >= 50 ? 'slow' : dur <= 25 ? 'fast' : 'medium';

    // Detect direction
    const dirMatch = trackStyle.match(/animation-direction:\s*(\w+)/);
    const direction = dirMatch?.[1] === 'reverse' ? 'right' : 'left';

    // Detect separator from content
    const sep = el.querySelector('.marquee-sep');
    const sepChar = txt(sep);
    let separator = 'star';
    if (sepChar === '●') separator = 'dot';
    else if (sepChar === '—') separator = 'dash';

    // Accent color from separator or item
    const accentColor = sep ? extractHex(attr(sep, 'style')) : '#6366f1';

    const node = makeBlock(doc, 'marquee', {
      'data-items': JSON.stringify(items),
      'data-speed': speed,
      'data-direction': direction,
      'data-separator': separator,
      'data-accent-color': accentColor,
    });
    replaceElement(el, node);
  });
}

function reverseGlowCards(doc: Document) {
  doc.querySelectorAll('.glow-cards-grid').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const style = attr(el, 'style');
    const colsMatch = style.match(/repeat\((\d+)/);
    const cols = colsMatch ? colsMatch[1] : '3';

    const cards: any[] = [];
    el.querySelectorAll('.glow-card').forEach(card => {
      const cardStyle = attr(card, 'style');
      const emojiEl = card.querySelector('div[style*="font-size:2rem"]');
      const titleEl = card.querySelector('h3');
      const descEl = card.querySelector('p');
      // Extract glow color from onmousemove attribute
      const mousemove = attr(card, 'onmousemove');
      const glowMatch = mousemove.match(/(#[0-9a-fA-F]{6})/);
      cards.push({
        emoji: txt(emojiEl),
        title: txt(titleEl),
        description: txt(descEl),
        glowColor: glowMatch ? glowMatch[1] : '#6366f1',
      });
    });

    // Detect card-bg from first card background
    const firstCard = el.querySelector('.glow-card');
    const firstStyle = firstCard ? attr(firstCard, 'style') : '';
    let cardBg = 'white';
    if (firstStyle.includes('#0f172a')) cardBg = 'dark';
    else if (firstStyle.includes('rgba(255,255,255,0.7)')) cardBg = 'glass';

    // Detect text color
    const firstTitle = el.querySelector('h3');
    const titleColor = firstTitle ? (attr(firstTitle, 'style').match(/color:\s*(#[0-9a-fA-F]{6})/)?.[1] || '') : '';
    const textColor = titleColor === '#f1f5f9' ? 'dark' : 'light';

    const node = makeBlock(doc, 'glow-cards', {
      'data-cards': JSON.stringify(cards),
      'data-cols': cols,
      'data-card-bg': cardBg,
      'data-text-color': textColor,
    });
    replaceElement(el, node);
  });
}

function reverseGradientBorders(doc: Document) {
  doc.querySelectorAll('.gradient-border-block').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const outerDiv = el.querySelector(':scope > div');
    const innerDiv = outerDiv?.querySelector(':scope > div');
    const title = innerDiv?.querySelector('p:first-child');
    const description = innerDiv?.querySelector('p:last-child');

    // Extract colors from gradient to detect preset
    const outerStyle = outerDiv ? attr(outerDiv, 'style') : '';
    const colors = extractAllHex(outerStyle);

    const PRESETS = [
      ['#6366f1', '#8b5cf6', '#ec4899'],
      ['#f59e0b', '#ef4444', '#ec4899'],
      ['#06b6d4', '#3b82f6', '#6366f1'],
      ['#10b981', '#06b6d4', '#3b82f6'],
      ['#fbbf24', '#f59e0b', '#d97706'],
      ['#64748b', '#94a3b8', '#cbd5e1'],
    ];

    let preset = 0;
    for (let i = 0; i < PRESETS.length; i++) {
      if (colors.length >= 2 && PRESETS[i][0] === colors[0]) { preset = i; break; }
    }

    // Detect border-width from padding
    const paddingMatch = outerStyle.match(/padding:\s*(\d+)px/);
    const borderWidth = paddingMatch ? paddingMatch[1] : '2';

    // Detect animation speed
    const durMatch = outerStyle.match(/gradient-shift\s+([\d.]+)s/);
    const dur = durMatch ? parseFloat(durMatch[1]) : 3.5;
    const animSpeed = dur <= 2.5 ? 'fast' : dur >= 5 ? 'slow' : 'medium';

    // Detect border radius
    const brMatch = outerStyle.match(/border-radius:\s*(\d+)px/);
    const br = brMatch ? parseInt(brMatch[1]) : 16;
    const borderRadius = br <= 12 ? 'sm' : br >= 24 ? 'lg' : 'md';

    const node = makeBlock(doc, 'gradient-border', {
      'data-title': title && title !== description ? txt(title) : '',
      'data-description': txt(description),
      'data-preset': String(preset),
      'data-border-width': borderWidth,
      'data-anim-speed': animSpeed,
      'data-border-radius': borderRadius,
    });
    replaceElement(el, node);
  });
}

function reverseHoverReveal(doc: Document) {
  doc.querySelectorAll('.hover-reveal-grid').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const style = attr(el, 'style');
    const colsMatch = style.match(/repeat\((\d+)/);
    const cols = colsMatch ? colsMatch[1] : '3';

    const cards: any[] = [];
    const hrCards = el.querySelectorAll('.hr-card');
    // Detect flip vs slide from presence of hr-inner (flip) vs hr-front (slide)
    const hasFlip = !!el.querySelector('.hr-inner');
    const revealStyle = hasFlip ? 'flip' : 'slide';

    hrCards.forEach(card => {
      // Front title is in the first visible span with font-weight:600
      const frontTitle = card.querySelector('span[style*="font-weight:600"]');
      const emoji = card.querySelector('span[style*="font-size:2.5rem"]');
      const backDesc = card.querySelector('p[style*="color:#fff"]');
      // Accent color from border or background
      const accentEl = card.querySelector('div[style*="background:"][style*="padding"]') ||
                       card.querySelector('.hr-back') ||
                       card.querySelector('div[style*="border:"]');
      let accentColor = '#6366f1';
      if (accentEl) {
        const hex = extractHex(attr(accentEl, 'style'));
        if (hex) accentColor = hex;
      }
      cards.push({
        emoji: txt(emoji),
        frontTitle: txt(frontTitle),
        backDescription: txt(backDesc),
        accentColor,
      });
    });

    const node = makeBlock(doc, 'hover-reveal', {
      'data-cards': JSON.stringify(cards),
      'data-cols': cols,
      'data-reveal-style': revealStyle,
    });
    replaceElement(el, node);
  });
}

function reverseAnnouncementPills(doc: Document) {
  doc.querySelectorAll('.announcement-pill-wrapper').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const wrapper = el.querySelector('div[style*="display:flex"]');
    const justifyStyle = wrapper ? attr(wrapper, 'style') : '';
    let align = 'center';
    if (justifyStyle.includes('flex-start')) align = 'left';
    else if (justifyStyle.includes('flex-end')) align = 'right';

    const badge = el.querySelector('span[style*="border-radius:9999px"][style*="font-size:0.75rem"]');
    const messageSpan = badge?.nextElementSibling;
    const linkEl = el.querySelector('a');
    const shimmerEl = el.querySelector('span[style*="shimmer-sweep"]');

    // Detect variant from badge background
    const badgeStyle = badge ? attr(badge, 'style') : '';
    const badgeBg = badgeStyle.match(/background:\s*(#[0-9a-fA-F]{6})/)?.[1] || '#6366f1';
    const variantMap: Record<string, string> = {
      '#6366f1': 'indigo', '#f43f5e': 'rose', '#10b981': 'emerald',
      '#f59e0b': 'amber', '#475569': 'slate',
    };
    let variant = variantMap[badgeBg] || 'indigo';
    // Check for dark variant
    const pillOuter = badge?.parentElement;
    if (pillOuter) {
      const pillBg = attr(pillOuter, 'style').match(/background:\s*(#[0-9a-fA-F]{6})/)?.[1] || '';
      if (pillBg === '#0f172a') variant = 'dark';
    }

    const node = makeBlock(doc, 'announcement-pill', {
      'data-label': txt(badge),
      'data-message': txt(messageSpan),
      'data-url': linkEl ? attr(linkEl, 'href') : '',
      'data-variant': variant,
      'data-shimmer': shimmerEl ? 'true' : 'false',
      'data-align': align,
    });
    replaceElement(el, node);
  });
}

function reverseGradientBlobs(doc: Document) {
  doc.querySelectorAll('.gradient-blobs-block').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const container = el.querySelector(':scope > div');
    const style = container ? attr(container, 'style') : '';
    const bgMatch = style.match(/background:\s*(#[0-9a-fA-F]{6})/);
    const bg = bgMatch ? bgMatch[1] : '#0f0f1a';

    // Detect preset from bg color
    const bgPresets: Record<string, number> = {
      '#0f0f1a': 0, '#0c1a2e': 1, '#1a0a0a': 2, '#0a1a0f': 3, '#f8fafc': 4,
    };
    const preset = bgPresets[bg] ?? 0;

    const title = txt(el.querySelector('p[style*="font-weight:700"]'));
    const subtitle = txt(el.querySelector('p[style*="opacity:0.7"]'));

    const minHMatch = style.match(/min-height:\s*(\d+)px/);
    const minH = minHMatch ? parseInt(minHMatch[1]) : 300;
    const height = minH <= 220 ? 'sm' : minH >= 380 ? 'lg' : 'md';

    // Detect animate from animation presence
    const blobDivs = container?.querySelectorAll('div[style*="border-radius:50%"]');
    const animate = blobDivs?.[0] ? attr(blobDivs[0], 'style').includes('animation:') : true;

    const node = makeBlock(doc, 'gradient-blobs', {
      'data-preset': String(preset),
      'data-title': title,
      'data-subtitle': subtitle,
      'data-height': height,
      'data-animate': String(animate),
    });
    replaceElement(el, node);
  });
}

function reverseNoiseOverlays(doc: Document) {
  doc.querySelectorAll('.noise-overlay-block').forEach(el => {
    if (el.getAttribute('data-type')) return;
    const container = el.querySelector(':scope > div');
    const style = container ? attr(container, 'style') : '';
    const bgMatch = style.match(/background:\s*(#[0-9a-fA-F]{6})/);
    const bg = bgMatch ? bgMatch[1] : '#ffffff';

    const bgPresets: Record<string, number> = {
      '#ffffff': 0, '#f8fafc': 1, '#fefce8': 2, '#0f172a': 3, '#1c1c1e': 4, '#1e1b4b': 5,
    };
    const bgPreset = bgPresets[bg] ?? 0;

    const title = txt(el.querySelector('p[style*="font-weight:700"]'));
    const subtitle = txt(el.querySelector('p[style*="opacity:0.7"]'));

    const minHMatch = style.match(/min-height:\s*(\d+)px/);
    const minH = minHMatch ? parseInt(minHMatch[1]) : 280;
    const height = minH <= 200 ? 'sm' : minH >= 350 ? 'lg' : 'md';

    // Try to extract noise opacity from SVG
    const noiseBg = el.querySelector('div[style*="background-image:url"]');
    const noiseSvg = noiseBg ? decodeURIComponent(attr(noiseBg, 'style')) : '';
    const opacityMatch = noiseSvg.match(/opacity='([\d.]+)'/);
    const noiseOpacity = opacityMatch ? opacityMatch[1] : '0.15';
    const freqMatch = noiseSvg.match(/baseFrequency='([\d.]+)'/);
    const freq = freqMatch ? parseFloat(freqMatch[1]) : 0.65;
    const noiseDensity = Math.round(((freq - 0.4) / 0.6) * 100);

    const node = makeBlock(doc, 'noise-overlay', {
      'data-bg-preset': String(bgPreset),
      'data-noise-opacity': noiseOpacity,
      'data-noise-density': String(Math.max(0, Math.min(100, noiseDensity))),
      'data-title': title,
      'data-subtitle': subtitle,
      'data-height': height,
    });
    replaceElement(el, node);
  });
}

function reverseMermaid(doc: Document) {
  doc.querySelectorAll('.mermaid-block').forEach((el) => {
    if (el.getAttribute('data-type')) return;
    const nodes = el.getAttribute('data-nodes') || '';
    const edges = el.getAttribute('data-edges') || '';
    const theme = el.getAttribute('data-theme') || 'default';
    const node = makeBlock(doc, 'mermaid', {
      'data-nodes': nodes,
      'data-edges': edges,
      'data-theme': theme,
    });
    replaceElement(el, node);
  });
}

// ── Main Import Function ────────────────────────────────────────────

export function importGuideHTML(rawHtml: string): ImportResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // 1. Extract title
  const titleEl = doc.querySelector('title');
  let title = titleEl ? txt(titleEl) : '';
  // Fallback: first h1 in hero
  if (!title) {
    const heroH1 = doc.querySelector('.hero-section h1, .hero-plain h1, .guide-container > div:first-child h1');
    if (heroH1) title = txt(heroH1);
  }
  if (!title) title = 'Imported Guide';

  // 2. Extract theme
  const theme = extractTheme(doc);

  // 3. Find main content container
  const guideContainer = doc.querySelector('.guide-container');
  if (!guideContainer) {
    // Fallback: return body content stripped of scripts
    doc.querySelectorAll('script, style, link').forEach(el => el.remove());
    return { title, content: sanitizeHtml(doc.body.innerHTML), theme };
  }

  // 4. Remove non-content elements from guide container
  // Remove brand header
  guideContainer.querySelectorAll('.brand-header').forEach(el => el.remove());

  // Remove hero cover section (first child that matches hero patterns)
  const firstChild = guideContainer.firstElementChild;
  if (firstChild) {
    const fc = firstChild as HTMLElement;
    const fcStyle = fc.getAttribute('style') || '';
    const isHero =
      fc.classList.contains('hero-section') ||
      fc.classList.contains('hero-plain') ||
      fcStyle.includes('linear-gradient(135deg') ||
      fcStyle.includes('background: #0c0c11') ||
      fcStyle.includes('background: #0f0c1a') ||
      fcStyle.includes('background: #fffbf7');
    if (isHero) fc.remove();
  }

  // Also remove legacy full-bleed hero section (outside guide-container)
  doc.querySelectorAll('.hero-section').forEach(el => el.remove());

  // 5. Strip export artifacts from the content
  // Remove ToC sidebar (it's a sibling of guide-container in .export-layout)
  doc.querySelectorAll('.toc-sidebar').forEach(el => el.remove());

  // Remove reading progress, back to top, share bar
  ['reading-progress', 'back-to-top', 'share-bar'].forEach(id => {
    doc.getElementById(id)?.remove();
  });

  // Remove copy buttons on pre blocks
  guideContainer.querySelectorAll('.copy-btn').forEach(el => el.remove());

  // Remove heading IDs (heading-0, heading-1, etc.) that were injected for ToC
  guideContainer.querySelectorAll('[id^="heading-"]').forEach(el => {
    el.removeAttribute('id');
  });

  // Remove scroll reveal classes
  const revealClasses = ['reveal-fade-up', 'reveal-slide-left', 'reveal-slide-right', 'reveal-zoom-in', 'active'];
  guideContainer.querySelectorAll('[class]').forEach(el => {
    revealClasses.forEach(cls => el.classList.remove(cls));
    // Remove data-scroll-reveal attribute
    el.removeAttribute('data-scroll-reveal');
  });

  // Remove inline cursor:zoom-in on images (added by export JS)
  guideContainer.querySelectorAll('img[style*="cursor"]').forEach(img => {
    (img as HTMLElement).style.removeProperty('cursor');
    if (!(img as HTMLElement).getAttribute('style')?.trim()) {
      img.removeAttribute('style');
    }
  });

  // 6. Reverse block transformations
  // Order matters: process galleries before standalone project cards
  reverseAccordions(doc);
  reverseTabs(doc);
  reverseTimelines(doc);
  reverseWorkflows(doc);
  reverseCardGrids(doc);
  reverseBackgroundSections(doc);
  reverseSectionDividers(doc);
  reverseVideoEmbeds(doc);
  reverseCounters(doc);
  reverseTestimonials(doc);
  reverseHeroBanners(doc);
  reverseProjectGalleries(doc); // Before standalone project cards
  reverseProjectCards(doc);
  reverseAboutMe(doc);
  reverseTechStack(doc);
  reverseSocialLinks(doc);
  reversePortfolioHero(doc);
  reverseStatRows(doc);
  reverseCodeDiffs(doc);
  reverseConfetti(doc);
  reverseBentoGrids(doc);
  reverseFeatureSpotlights(doc);
  reverseStickyScroll(doc);
  reverseCodeWindows(doc);
  reverseChangelogTimelines(doc);
  reverseBrowserMockups(doc);
  reversePhoneMockups(doc);
  reverseBeforeAfter(doc);
  reverseMarquees(doc);
  reverseGlowCards(doc);
  reverseGradientBorders(doc);
  reverseHoverReveal(doc);
  reverseAnnouncementPills(doc);
  reverseGradientBlobs(doc);
  reverseNoiseOverlays(doc);
  reverseMermaid(doc);

  // 7. Return cleaned content
  const content = sanitizeHtml(guideContainer.innerHTML);

  return { title, content, theme };
}
