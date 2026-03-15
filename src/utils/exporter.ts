import { ThemeConfig } from './storage';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '37, 99, 235';
};

const getCodeThemeCSS = (codeTheme?: string): string => {
  switch (codeTheme) {
    case 'light':
      return `
    pre { background-color: #f8fafc; color: #1e293b; border: 1px solid #e2e8f0; }
    .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section, .hljs-link { color: #7c3aed; }
    .hljs-string, .hljs-title, .hljs-name, .hljs-type, .hljs-attribute, .hljs-symbol, .hljs-bullet, .hljs-addition { color: #16a34a; }
    .hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta { color: #94a3b8; font-style: italic; }
    .hljs-number, .hljs-regexp, .hljs-formula { color: #dc2626; }
    .hljs-function, .hljs-class .hljs-title, .hljs-built_in { color: #b45309; }
    .hljs-variable, .hljs-template-variable { color: #0369a1; }
    .copy-btn { background: rgba(0,0,0,0.07); border-color: rgba(0,0,0,0.12); color: #334155; }
    .copy-btn:hover { background: rgba(0,0,0,0.12); }`;
    case 'solarized':
      return `
    pre { background-color: #002b36; color: #839496; }
    .hljs-keyword, .hljs-selector-tag, .hljs-literal { color: #859900; }
    .hljs-string, .hljs-title, .hljs-name, .hljs-type, .hljs-attribute { color: #2aa198; }
    .hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta { color: #586e75; font-style: italic; }
    .hljs-number, .hljs-regexp, .hljs-formula, .hljs-symbol, .hljs-bullet { color: #d33682; }
    .hljs-function, .hljs-class .hljs-title, .hljs-built_in { color: #268bd2; }
    .hljs-variable, .hljs-template-variable, .hljs-addition { color: #cb4b16; }
    .hljs-section, .hljs-link { color: #93a1a1; }`;
    case 'dark':
    default:
      return `
    pre { background-color: #1f2937; color: #f3f4f6; }
    .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section, .hljs-link { color: #93c5fd; }
    .hljs-string, .hljs-title, .hljs-name, .hljs-type, .hljs-attribute, .hljs-symbol, .hljs-bullet, .hljs-addition { color: #86efac; }
    .hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta { color: #6b7280; font-style: italic; }
    .hljs-number, .hljs-regexp, .hljs-formula { color: #fca5a5; }
    .hljs-function, .hljs-class .hljs-title, .hljs-built_in { color: #fcd34d; }
    .hljs-variable, .hljs-template-variable { color: #e2e8f0; }`;
  }
};

const getFontStack = (fontFamily?: string) => {
  switch (fontFamily) {
    case 'editorial':
      return 'Georgia, Cambria, "Times New Roman", Times, serif';
    case 'technical':
      return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    case 'modern':
    default:
      return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  }
};

const escapeHtml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Extracts all CSS rules from the current document's stylesheets.
 * This ensures the exported HTML has the exact same styling as the editor,
 * without relying on external CDNs.
 *
 * @returns A string containing all CSS rules.
 */
const extractInlineCSS = (): string => {
  let cssString = '';
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      // Ignore cross-origin stylesheets that might throw SecurityError
      if (sheet.cssRules) {
        for (let j = 0; j < sheet.cssRules.length; j++) {
          cssString += sheet.cssRules[j].cssText + '\n';
        }
      }
    } catch (e) {
      console.warn('Could not read cssRules from stylesheet', sheet.href, e);
    }
  }
  return cssString;
};

/**
 * Generates a standalone HTML file containing the editor content,
 * inline CSS, and necessary interactive JavaScript.
 *
 * @param title - The title of the guide.
 * @param htmlContent - The raw HTML content from the editor.
 * @param theme - The document theme.
 */
export const generateHTML = (title: string, htmlContent: string, theme?: ThemeConfig): string => {
  const inlineCSS = extractInlineCSS();

  // Parse HTML to generate ToC and add IDs
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const headings = doc.querySelectorAll('h1, h2');
  let tocHTML = '';
  
  if (headings.length > 0) {
    tocHTML = `<aside class="toc-sidebar">
      <h3 class="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">On this page</h3>
      <nav class="flex flex-col">`;
    
    headings.forEach((heading, index) => {
      const id = `heading-${index}`;
      heading.setAttribute('id', id); // Inject ID into the DOM node to ensure it persists in processedHTML
      const level = heading.tagName.toLowerCase() === 'h1' ? 1 : 2;
      tocHTML += `<a class="toc-link level-${level}" href="#${id}">${heading.textContent}</a>`;
    });
    
    tocHTML += `</nav></aside>`;
  }

  // Transform accordion blocks into export-ready HTML
  doc.querySelectorAll('div[data-type="accordion"]').forEach((accordion) => {
    accordion.className = 'accordion-wrapper';
    accordion.removeAttribute('data-type');
    accordion.querySelectorAll('div[data-type="accordion-item"]').forEach((item) => {
      const title = item.getAttribute('data-title') || 'Section';
      const bodyHTML = item.innerHTML;
      item.className = 'accordion-item';
      item.removeAttribute('data-type');
      item.removeAttribute('data-title');
      item.innerHTML = `
        <button class="accordion-header">
          <svg class="accordion-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          <span>${title}</span>
        </button>
        <div class="accordion-body"><div class="accordion-body-inner">${bodyHTML}</div></div>
      `;
    });
  });

  // Transform tab groups into export-ready HTML
  doc.querySelectorAll('div[data-type="tab-group"]').forEach((tabGroup) => {
    const panels = tabGroup.querySelectorAll('div[data-type="tab-panel"]');
    let buttonsHTML = '<div class="tab-buttons">';
    const panelContents: string[] = [];
    panels.forEach((panel) => {
      const label = panel.getAttribute('data-label') || 'Tab';
      buttonsHTML += `<button class="tab-btn">${label}</button>`;
      panelContents.push(panel.innerHTML);
    });
    buttonsHTML += '</div>';
    let panelsHTML = '<div class="tab-panels">';
    panelContents.forEach((content) => {
      panelsHTML += `<div class="tab-panel">${content}</div>`;
    });
    panelsHTML += '</div>';
    tabGroup.className = 'tab-group';
    tabGroup.removeAttribute('data-type');
    tabGroup.innerHTML = buttonsHTML + panelsHTML;
  });

  // Transform section dividers
  doc.querySelectorAll('div[data-type="section-divider"]').forEach((divider) => {
    const style = divider.getAttribute('data-style') || 'gradient';
    divider.className = `section-divider`;
    divider.setAttribute('data-style', style);
    divider.removeAttribute('data-type');
    if (style === 'wave') {
      divider.innerHTML = `<svg viewBox="0 0 1200 40" preserveAspectRatio="none" style="width:100%;height:40px;display:block;"><path d="M0,20 C300,40 600,0 900,20 C1050,30 1150,10 1200,20" fill="none" stroke="#cbd5e1" stroke-width="2"/></svg>`;
    } else if (style === 'dots') {
      divider.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;gap:0.5rem;">${[1,2,3,4,5].map(() => '<span style="width:8px;height:8px;border-radius:50%;background:#cbd5e1;display:inline-block;flex-shrink:0;"></span>').join('')}</div>`;
    }
  });

  // Transform video embeds
  doc.querySelectorAll('div[data-type="video-embed"]').forEach((el) => {
    const src = el.getAttribute('data-src') || '';
    el.removeAttribute('data-type');
    el.removeAttribute('data-src');
    el.className = 'video-embed';

    const ytMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const vimeoMatch = src.match(/vimeo\.com\/(\d+)/);
    const isHtml5 = /\.(mp4|webm|ogg)(\?.*)?$/i.test(src);

    if (ytMatch) {
      el.innerHTML = `<div class="video-embed-wrapper"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" title="YouTube video" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" style="border:none;"></iframe></div>`;
    } else if (vimeoMatch) {
      el.innerHTML = `<div class="video-embed-wrapper"><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" title="Vimeo video" allowfullscreen style="border:none;"></iframe></div>`;
    } else if (isHtml5 && src) {
      el.innerHTML = `<video src="${src}" controls style="width:100%;border-radius:0.75rem;aspect-ratio:16/9;"></video>`;
    } else if (src) {
      el.innerHTML = `<p style="color:#dc2626;font-size:0.875rem;">Unsupported video URL: ${src}</p>`;
    }
  });

  // Transform timeline blocks
  doc.querySelectorAll('div[data-type="timeline"]').forEach((timeline) => {
    timeline.className = 'timeline';
    timeline.removeAttribute('data-type');
    let stepIndex = 0;
    timeline.querySelectorAll('div[data-type="timeline-step"]').forEach((step) => {
      stepIndex++;
      const title = step.getAttribute('data-title') || '';
      const bodyHTML = step.innerHTML;
      step.className = 'timeline-step';
      step.removeAttribute('data-type');
      step.removeAttribute('data-title');
      step.innerHTML = `
        <div class="timeline-step-marker">${stepIndex}</div>
        <div class="timeline-step-content">
          ${title ? `<h4 class="timeline-step-title">${title}</h4>` : ''}
          <div class="timeline-step-body">${bodyHTML}</div>
        </div>
      `;
    });
  });

  // Transform card grids
  doc.querySelectorAll('div[data-type="card-grid"]').forEach((grid) => {
    const cols = grid.getAttribute('data-cols') || '3';
    grid.className = 'card-grid';
    grid.setAttribute('data-cols', cols);
    grid.removeAttribute('data-type');
    grid.querySelectorAll('div[data-type="card"]').forEach((card) => {
      const emoji = card.getAttribute('data-emoji') || '';
      const title = card.getAttribute('data-title') || '';
      const bodyHTML = card.innerHTML;
      card.className = 'card';
      card.removeAttribute('data-type');
      card.removeAttribute('data-emoji');
      card.removeAttribute('data-title');
      card.innerHTML = `
        <div class="card-header">
          ${emoji ? `<span class="card-emoji">${emoji}</span>` : ''}
          ${title ? `<h4 class="card-title">${title}</h4>` : ''}
        </div>
        <div class="card-body">${bodyHTML}</div>
      `;
    });
  });

  // Transform animated counter blocks
  doc.querySelectorAll('div[data-type="counter"]').forEach((el) => {
    const value = parseFloat(el.getAttribute('data-value') || '0');
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const label = el.getAttribute('data-label') || '';
    el.className = 'counter-block';
    el.removeAttribute('data-type');
    el.removeAttribute('data-value');
    el.removeAttribute('data-prefix');
    el.removeAttribute('data-suffix');
    el.removeAttribute('data-label');
    el.setAttribute('data-target', String(value));
    el.innerHTML = `
      <div class="counter-number">
        ${prefix ? `<span class="counter-prefix">${prefix}</span>` : ''}
        <span class="counter-value">0</span>
        ${suffix ? `<span class="counter-suffix">${suffix}</span>` : ''}
      </div>
      ${label ? `<div class="counter-label">${label}</div>` : ''}
    `;
  });

  // Transform testimonial blocks
  doc.querySelectorAll('div[data-type="testimonial"]').forEach((el) => {
    const quote = el.getAttribute('data-quote') || 'Your testimonial goes here.';
    const authorName = el.getAttribute('data-author-name') || 'Author Name';
    const authorRole = el.getAttribute('data-author-role') || 'Title, Company';
    const avatarColor = el.getAttribute('data-avatar-color') || '#6366f1';
    const initial = authorName[0]?.toUpperCase() || '?';
    el.className = 'testimonial-card';
    el.removeAttribute('data-type');
    el.removeAttribute('data-quote');
    el.removeAttribute('data-author-name');
    el.removeAttribute('data-author-role');
    el.removeAttribute('data-avatar-color');
    el.innerHTML = `
      <div class="testimonial-quote-mark">❝</div>
      <p class="testimonial-quote">${escapeHtml(quote)}</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar" style="background-color: ${avatarColor};">${initial}</div>
        <div>
          <div class="testimonial-author-name">${escapeHtml(authorName)}</div>
          <div class="testimonial-author-role">${escapeHtml(authorRole)}</div>
        </div>
      </div>
    `;
  });

  // Transform hero banner blocks
  doc.querySelectorAll('div[data-type="hero-banner"]').forEach((el) => {
    const gradFrom = el.getAttribute('data-gradient-from') || '#6366f1';
    const gradTo = el.getAttribute('data-gradient-to') || '#ec4899';
    const title = el.getAttribute('data-title') || '';
    const subtitle = el.getAttribute('data-subtitle') || '';
    const ctaText = el.getAttribute('data-cta-text') || '';
    const ctaUrl = el.getAttribute('data-cta-url') || '';
    el.className = 'hero-banner';
    el.removeAttribute('data-type');
    ['data-gradient-from', 'data-gradient-to', 'data-title', 'data-subtitle', 'data-cta-text', 'data-cta-url'].forEach((a) => el.removeAttribute(a));
    el.innerHTML = `
      <div class="hero-banner-inner" style="background: linear-gradient(135deg, ${gradFrom}, ${gradTo});">
        <h2 class="hero-banner-title">${escapeHtml(title)}</h2>
        ${subtitle ? `<p class="hero-banner-subtitle">${escapeHtml(subtitle)}</p>` : ''}
        ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="hero-banner-cta">${escapeHtml(ctaText)}</a>` : ''}
      </div>
    `;
  });

  // Transform stat row blocks
  doc.querySelectorAll('div[data-type="stat-row"]').forEach((el) => {
    let stats: any[] = [];
    try { stats = JSON.parse(el.getAttribute('data-stats') || '[]'); } catch (e) { /* empty */ }
    el.className = 'stat-row';
    el.removeAttribute('data-type');
    el.removeAttribute('data-stats');
    el.innerHTML = stats.map((s: any) => `
      <div class="stat-item" data-target="${parseFloat(s.value) || 0}">
        ${s.icon ? `<div class="stat-icon">${s.icon}</div>` : ''}
        <div class="stat-number">
          ${s.prefix ? `<span class="stat-prefix">${escapeHtml(s.prefix)}</span>` : ''}
          <span class="stat-value">0</span>
          ${s.suffix ? `<span class="stat-suffix">${escapeHtml(s.suffix)}</span>` : ''}
        </div>
        <div class="stat-label">${escapeHtml(s.label || '')}</div>
      </div>
    `).join('');
  });

  // Transform code diff blocks
  doc.querySelectorAll('div[data-type="code-diff"]').forEach((el) => {
    const codeBefore = el.getAttribute('data-code-before') || '';
    const codeAfter = el.getAttribute('data-code-after') || '';
    const language = el.getAttribute('data-language') || 'javascript';

    const beforeLines = codeBefore.split('\n');
    const afterLines = codeAfter.split('\n');
    const maxLen = Math.max(beforeLines.length, afterLines.length);
    let beforeHTML = '';
    let afterHTML = '';
    for (let i = 0; i < maxLen; i++) {
      const b = beforeLines[i] ?? '';
      const a = afterLines[i] ?? '';
      const bSame = b === a;
      const bClass = !bSame && b ? 'diff-removed' : (bSame ? '' : 'diff-empty');
      const aClass = !bSame && a ? 'diff-added' : (bSame ? '' : 'diff-empty');
      beforeHTML += `<div class="diff-line ${bClass}">${escapeHtml(b) || ' '}</div>`;
      afterHTML += `<div class="diff-line ${aClass}">${escapeHtml(a) || ' '}</div>`;
    }

    el.className = 'code-diff';
    el.removeAttribute('data-type');
    ['data-code-before', 'data-code-after', 'data-language'].forEach((a) => el.removeAttribute(a));
    el.innerHTML = `
      <div class="code-diff-inner">
        <div class="code-diff-panel">
          <div class="code-diff-label diff-label-before">Before</div>
          <pre class="code-diff-pre lang-${language}">${beforeHTML}</pre>
        </div>
        <div class="code-diff-panel">
          <div class="code-diff-label diff-label-after">After</div>
          <pre class="code-diff-pre lang-${language}">${afterHTML}</pre>
        </div>
      </div>
    `;
  });

  // Transform before/after slider blocks
  doc.querySelectorAll('div[data-type="before-after"]').forEach((el) => {
    const beforeImage = el.getAttribute('data-before-image') || '';
    const afterImage = el.getAttribute('data-after-image') || '';
    const sliderPos = el.getAttribute('data-slider-position') || '50';
    const beforeLabel = el.getAttribute('data-before-label') || 'Before';
    const afterLabel = el.getAttribute('data-after-label') || 'After';

    el.className = 'before-after';
    el.removeAttribute('data-type');
    ['data-before-image', 'data-after-image', 'data-slider-position', 'data-before-label', 'data-after-label'].forEach((a) => el.removeAttribute(a));

    if (!beforeImage || !afterImage) {
      el.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:2rem;">Before/After slider: no images set</p>';
      return;
    }

    el.innerHTML = `
      <div class="before-after-container" data-slider="${sliderPos}">
        <img class="before-after-after-img" src="${afterImage}" alt="${escapeHtml(afterLabel)}" />
        <div class="before-after-before-clip" style="clip-path: inset(0 ${100 - parseFloat(sliderPos)}% 0 0);">
          <img src="${beforeImage}" alt="${escapeHtml(beforeLabel)}" />
        </div>
        <div class="before-after-divider" style="left: ${sliderPos}%;"></div>
        <span class="before-after-label before-after-label-left">${escapeHtml(beforeLabel)}</span>
        <span class="before-after-label before-after-label-right">${escapeHtml(afterLabel)}</span>
      </div>
    `;
  });

  // processedHTML now contains the headings with their newly injected IDs
  const processedHTML = doc.body.innerHTML;

  const primaryColor = theme?.primaryColor || '#2563eb';
  const primaryColorRgb = hexToRgb(primaryColor);
  const fontStack = getFontStack(theme?.fontFamily);

  // Basic interactive JS for accordions, checklists, etc.
  const inlineJS = `
    document.addEventListener('DOMContentLoaded', () => {
      // Handle interactive checklists
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
          const li = e.target.closest('li');
          if (li) {
            if (e.target.checked) {
              li.setAttribute('data-checked', 'true');
            } else {
              li.removeAttribute('data-checked');
            }
          }
        });
      });

      // Accordion toggle
      document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
          const item = header.closest('.accordion-item');
          const body = item.querySelector('.accordion-body');
          const isOpen = body.classList.contains('open');
          body.classList.toggle('open', !isOpen);
          header.classList.toggle('open', !isOpen);
        });
      });
      // Open first accordion item by default
      document.querySelectorAll('.accordion-wrapper').forEach(wrapper => {
        const firstHeader = wrapper.querySelector('.accordion-header');
        const firstBody = wrapper.querySelector('.accordion-body');
        if (firstHeader && firstBody) {
          firstHeader.classList.add('open');
          firstBody.classList.add('open');
        }
      });

      // Tabs
      document.querySelectorAll('.tab-group').forEach(group => {
        const buttons = group.querySelectorAll('.tab-btn');
        const panels = group.querySelectorAll('.tab-panel');
        buttons.forEach((btn, i) => {
          btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            panels[i].classList.add('active');
          });
        });
        if (buttons[0]) buttons[0].classList.add('active');
        if (panels[0]) panels[0].classList.add('active');
      });

      // Handle accordions/details toggles if any
      const details = document.querySelectorAll('details');
      details.forEach(detail => {
        detail.addEventListener('toggle', (e) => {
          // Add any custom animation or state handling here
        });
      });

      // Copy to Clipboard for Code Blocks
      document.querySelectorAll('pre').forEach(pre => {
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.innerText = 'Copy';
        btn.onclick = () => {
          navigator.clipboard.writeText(pre.innerText.replace(/^Copy\\n/, ''));
          btn.innerText = 'Copied!';
          setTimeout(() => btn.innerText = 'Copy', 2000);
        };
        pre.style.position = 'relative';
        pre.appendChild(btn);
      });

      // Image Lightbox
      const lightbox = document.createElement('div');
      lightbox.className = 'lightbox';
      lightbox.onclick = () => lightbox.classList.remove('active');
      const img = document.createElement('img');
      lightbox.appendChild(img);
      document.body.appendChild(lightbox);

      document.querySelectorAll('.guide-container img:not(.annotated-image-container img)').forEach(image => {
        image.style.cursor = 'zoom-in';
        image.onclick = (e) => {
          e.stopPropagation();
          img.src = image.src;
          lightbox.classList.add('active');
        };
      });

      // --- READING PROGRESS BAR ---
      const progressBar = document.getElementById('reading-progress');
      if (progressBar) {
        function updateProgress() {
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          progressBar.style.width = pct + '%';
        }
        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
      }

      // --- BACK TO TOP ---
      const backToTopBtn = document.getElementById('back-to-top');
      if (backToTopBtn) {
        window.addEventListener('scroll', () => {
          if ((window.scrollY || document.documentElement.scrollTop) > 400) {
            backToTopBtn.classList.add('visible');
          } else {
            backToTopBtn.classList.remove('visible');
          }
        }, { passive: true });
        backToTopBtn.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

      // --- SCROLL SPY LOGIC ---
      const tocLinks = document.querySelectorAll('.toc-link');
      const headingEls = document.querySelectorAll('.guide-container h1[id], .guide-container h2[id]');

      if (headingEls.length > 0 && tocLinks.length > 0) {
        tocLinks[0].classList.add('active');

        function setActiveLink(id) {
          tocLinks.forEach(link => link.classList.remove('active'));
          const activeLink = document.querySelector('.toc-link[href="#' + id + '"]');
          if (activeLink) activeLink.classList.add('active');
        }

        // Click handler: directly set active class and scroll
        let isClickScrolling = false;
        tocLinks.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href')?.substring(1);
            if (targetId) {
              const targetElement = document.getElementById(targetId);
              if (targetElement) {
                isClickScrolling = true;
                setActiveLink(targetId);
                targetElement.scrollIntoView({ behavior: 'smooth' });
                // Re-enable scroll spy after smooth scroll completes
                setTimeout(() => { isClickScrolling = false; }, 1000);
              }
            }
          });
        });

        // Scroll spy: find the heading closest to the top of the viewport
        function onScroll() {
          if (isClickScrolling) return;
          let current = null;
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          const offset = window.innerHeight * 0.25;

          headingEls.forEach(heading => {
            const top = heading.getBoundingClientRect().top + scrollY;
            if (top <= scrollY + offset) {
              current = heading;
            }
          });

          if (current) {
            const id = current.getAttribute('id');
            if (id) setActiveLink(id);
          }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }

      // --- ANIMATED COUNTERS ---
      const counterBlocks = document.querySelectorAll('.counter-block');
      if (counterBlocks.length > 0) {
        function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

        function animateCounter(el) {
          const target = parseFloat(el.getAttribute('data-target') || '0');
          const valueEl = el.querySelector('.counter-value');
          if (!valueEl) return;
          const duration = 2000;
          const startTime = performance.now();
          const isFloat = target % 1 !== 0;

          function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = easeOut(progress) * target;
            valueEl.textContent = isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString();
            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              valueEl.textContent = isFloat ? target.toFixed(1) : target.toLocaleString();
            }
          }
          requestAnimationFrame(update);
        }

        const counterObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.5 });

        counterBlocks.forEach(el => counterObserver.observe(el));
      }

      // --- ANIMATED TEXT ---
      const animatedTexts = document.querySelectorAll('.animated-text');
      if (animatedTexts.length > 0) {
        const textObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-active');
            } else {
              entry.target.classList.remove('animate-active');
            }
          });
        }, { threshold: 0.5 });
        animatedTexts.forEach(el => textObserver.observe(el));
      }

      // --- STAT ROW COUNTERS ---
      const statItems = document.querySelectorAll('.stat-item');
      if (statItems.length > 0) {
        function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
        function animateStat(el) {
          const target = parseFloat(el.getAttribute('data-target') || '0');
          const valueEl = el.querySelector('.stat-value');
          if (!valueEl) return;
          const duration = 2000;
          const startTime = performance.now();
          const isFloat = target % 1 !== 0;
          function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = easeOut(progress) * target;
            valueEl.textContent = isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
            else valueEl.textContent = isFloat ? target.toFixed(1) : target.toLocaleString();
          }
          requestAnimationFrame(update);
        }
        const statObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) { animateStat(entry.target); statObserver.unobserve(entry.target); }
          });
        }, { threshold: 0.5 });
        statItems.forEach(el => statObserver.observe(el));
      }

      // --- BEFORE/AFTER SLIDER ---
      document.querySelectorAll('.before-after-container').forEach(container => {
        const divider = container.querySelector('.before-after-divider');
        const beforeClip = container.querySelector('.before-after-before-clip');
        if (!divider || !beforeClip) return;
        let dragging = false;
        function setPos(x) {
          const rect = container.getBoundingClientRect();
          let pct = ((x - rect.left) / rect.width) * 100;
          pct = Math.max(0, Math.min(100, pct));
          divider.style.left = pct + '%';
          beforeClip.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
        }
        divider.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); });
        divider.addEventListener('touchstart', (e) => { dragging = true; }, { passive: true });
        document.addEventListener('mousemove', (e) => { if (dragging) setPos(e.clientX); });
        document.addEventListener('touchmove', (e) => { if (dragging && e.touches[0]) setPos(e.touches[0].clientX); }, { passive: true });
        document.addEventListener('mouseup', () => { dragging = false; });
        document.addEventListener('touchend', () => { dragging = false; });
      });

      // --- ANNOTATION TOUCH SUPPORT ---
      document.querySelectorAll('.annotation-marker').forEach(marker => {
        marker.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasActive = marker.classList.contains('active');
          document.querySelectorAll('.annotation-marker.active').forEach(m => m.classList.remove('active'));
          if (!wasActive) marker.classList.add('active');
        });
      });
      document.addEventListener('click', () => {
        document.querySelectorAll('.annotation-marker.active').forEach(m => m.classList.remove('active'));
      });

      // --- SHARE BUTTONS ---
      const copyLinkBtn = document.getElementById('copy-link-btn');
      if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(window.location.href).then(() => {
            const original = copyLinkBtn.innerHTML;
            copyLinkBtn.textContent = 'Copied!';
            setTimeout(() => { copyLinkBtn.innerHTML = original; }, 2000);
          }).catch(() => {
            const url = window.location.href;
            const ta = document.createElement('textarea');
            ta.value = url;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            const original = copyLinkBtn.innerHTML;
            copyLinkBtn.textContent = 'Copied!';
            setTimeout(() => { copyLinkBtn.innerHTML = original; }, 2000);
          });
        });
      }
    });
  `;

  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Untitled Guide'}</title>
  <style>
    :root {
      --brand-primary: ${primaryColor};
      --brand-primary-rgb: ${primaryColorRgb};
    }
    
    /* Reset and base styles */
    body {
      margin: 0;
      padding: 0;
      font-family: ${fontStack};
      background-color: #ffffff;
      color: #111827;
      line-height: 1.5;
    }
    
    /* Target specific elements with the brand color */
    .guide-container a { color: var(--brand-primary); }
    .guide-container .copy-btn { background-color: var(--brand-primary); }

    /* Layout */
    .export-layout {
      max-width: 80rem; /* max-w-7xl */
      margin: 0 auto;
      padding: 3rem 1rem;
      display: flex;
      align-items: flex-start;
      gap: 3rem;
    }

    .guide-container {
      flex: 1;
      min-width: 0;
    }

    .brand-header {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .brand-logo {
      max-height: 48px;
      object-fit: contain;
    }

    /* Annotated Images */
    .annotated-image-container {
      position: relative;
      display: block;
      margin: 2rem 0;
    }
    
    .annotated-image-container img {
      display: block;
      width: 100%;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    }
    
    .annotation-marker {
      position: absolute;
      transform: translate(-50%, -50%);
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 9999px;
      background-color: var(--brand-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      border: 2px solid white;
      cursor: help;
      z-index: 20;
    }
    
    .annotation-marker::after {
      content: attr(data-text);
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 0.75rem;
      background-color: #0f172a; /* slate-900 */
      color: white;
      font-size: 0.875rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      width: max-content;
      max-width: 250px;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s;
      pointer-events: none;
      white-space: pre-wrap;
      text-align: center;
      z-index: 40;
    }
    
    /* Tooltip arrow */
    .annotation-marker::before {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      margin-top: 0.375rem;
      width: 0.75rem;
      height: 0.75rem;
      background-color: #0f172a;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s;
      pointer-events: none;
      z-index: 41;
    }
    
    .annotation-marker:hover::after,
    .annotation-marker:hover::before {
      opacity: 1;
      visibility: visible;
      margin-top: calc(0.75rem - 4px); /* Slide up slightly */
    }
    
    .annotation-marker:hover::before {
      margin-top: calc(0.375rem - 4px);
    }

    /* Grid Styles */
    .grid-wrapper {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin: 1.5rem 0;
    }
    
    @media (min-width: 768px) {
      .grid-wrapper.ratio-50-50 {
        grid-template-columns: 1fr 1fr;
      }
      .grid-wrapper.ratio-40-60 {
        grid-template-columns: 2fr 3fr;
      }
      .grid-wrapper.ratio-60-40 {
        grid-template-columns: 3fr 2fr;
      }
    }
    
    .grid-column {
      min-width: 0;
      width: 100%;
    }
    
    .grid-column > *:first-child {
      margin-top: 0;
    }
    
    .grid-column > *:last-child {
      margin-bottom: 0;
    }

    /* Accordion */
    .accordion-wrapper {
      margin: 2rem 0;
    }
    .accordion-item + .accordion-item {
      margin-top: 0.375rem;
    }
    .accordion-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.875rem 1.25rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9375rem;
      text-align: left;
      color: #0f172a;
      transition: background-color 0.2s;
    }
    .accordion-header:hover {
      background: #f1f5f9;
    }
    .accordion-header.open {
      border-radius: 0.5rem 0.5rem 0 0;
      border-bottom-color: transparent;
    }
    .accordion-chevron {
      flex-shrink: 0;
      color: #64748b;
      transition: transform 0.3s ease;
    }
    .accordion-header.open .accordion-chevron {
      transform: rotate(180deg);
    }
    .accordion-body {
      overflow: hidden;
      max-height: 0;
      transition: max-height 0.3s ease;
    }
    .accordion-body.open {
      max-height: 9999px;
    }
    .accordion-body-inner {
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 0.5rem 0.5rem;
    }
    .accordion-body-inner > *:first-child { margin-top: 0; }
    .accordion-body-inner > *:last-child { margin-bottom: 0; }

    /* Tabs */
    .tab-group {
      margin: 2rem 0;
    }
    .tab-buttons {
      display: flex;
      flex-wrap: wrap;
      border-bottom: 2px solid #e2e8f0;
    }
    .tab-btn {
      padding: 0.75rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.2s, border-bottom-color 0.2s;
    }
    .tab-btn:hover {
      color: #0f172a;
    }
    .tab-btn.active {
      color: var(--brand-primary);
      border-bottom-color: var(--brand-primary);
    }
    .tab-panels {
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 0.5rem 0.5rem;
    }
    .tab-panel {
      display: none;
      padding: 1.5rem;
    }
    .tab-panel.active {
      display: block;
    }
    .tab-panel > *:first-child { margin-top: 0; }
    .tab-panel > *:last-child { margin-bottom: 0; }

    /* Section Dividers */
    .section-divider {
      margin: 3rem 0;
      overflow: hidden;
    }
    .section-divider[data-style="gradient"] {
      height: 3px;
      background: linear-gradient(to right, transparent, var(--brand-primary), transparent);
      border-radius: 9999px;
    }
    .section-divider[data-style="solid"] {
      height: 1px;
      background: #e2e8f0;
    }
    .section-divider[data-style="wave"] {
      height: 40px;
    }
    .section-divider[data-style="dots"] {
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Video Embeds */
    .video-embed {
      margin: 2rem 0;
    }
    .video-embed-wrapper {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      background: #000;
    }
    .video-embed-wrapper iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    /* Timeline */
    .timeline {
      margin: 2rem 0;
    }
    .timeline-step {
      display: flex;
      gap: 1.25rem;
      position: relative;
    }
    .timeline-step:not(:last-child)::after {
      content: '';
      position: absolute;
      left: 0.9375rem;
      top: 2rem;
      bottom: 0;
      width: 2px;
      background-color: #e2e8f0;
    }
    .timeline-step-marker {
      width: 2rem;
      height: 2rem;
      border-radius: 9999px;
      background-color: var(--brand-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8125rem;
      font-weight: 700;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      z-index: 1;
      position: relative;
    }
    .timeline-step-content {
      flex: 1;
      min-width: 0;
      padding-bottom: 2rem;
    }
    .timeline-step:last-child .timeline-step-content {
      padding-bottom: 0;
    }
    .timeline-step-title {
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0 0 0.5rem;
      line-height: 2rem;
    }
    .timeline-step-body > *:first-child { margin-top: 0; }
    .timeline-step-body > *:last-child { margin-bottom: 0; }

    /* Card Grid */
    .card-grid {
      display: grid;
      gap: 1.25rem;
      margin: 2rem 0;
      grid-template-columns: 1fr;
    }
    @media (min-width: 640px) {
      .card-grid[data-cols="2"] { grid-template-columns: repeat(2, 1fr); }
      .card-grid[data-cols="3"] { grid-template-columns: repeat(3, 1fr); }
      .card-grid[data-cols="4"] { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 1024px) {
      .card-grid[data-cols="4"] { grid-template-columns: repeat(4, 1fr); }
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.5rem;
      background-color: #ffffff;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    .card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }
    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.875rem;
    }
    .card-emoji {
      font-size: 1.75rem;
      line-height: 1;
      flex-shrink: 0;
    }
    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
      line-height: 1.75rem;
    }
    .card-body {
      color: #475569;
      font-size: 0.9375rem;
      line-height: 1.625;
    }
    .card-body > *:first-child { margin-top: 0; }
    .card-body > *:last-child { margin-bottom: 0; }

    /* ToC Styles */
    .toc-sidebar {
      width: 260px;
      flex-shrink: 0;
      position: sticky;
      top: 6rem;
      max-height: calc(100vh - 8rem);
      overflow-y: auto;
      padding-left: 1rem;
      border-left: 1px solid #f1f5f9;
    }
    .toc-sidebar h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
      margin-top: 0;
    }
    .toc-link {
      display: block;
      padding: 0.35rem 0 0.35rem 1rem;
      font-size: 0.875rem; /* text-sm */
      color: #64748b; /* Tailwind slate-500 */
      border-left: 2px solid #e2e8f0; /* Tailwind slate-200 */
      text-decoration: none;
      transition: all 0.2s ease-in-out;
      margin-left: -1px; /* Overlap border */
    }
    .toc-link:hover {
      color: #0f172a; /* Tailwind slate-900 */
      border-left-color: #cbd5e1; /* Tailwind slate-300 */
    }
    .toc-link.active {
      color: var(--brand-primary);
      border-left-color: var(--brand-primary);
      font-weight: 500;
      background-color: color-mix(in srgb, var(--brand-primary) 10%, transparent);
      border-top-right-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;
    }
    .toc-link.level-2 {
      padding-left: 2rem;
    }

    @media (max-width: 800px) {
      .export-layout {
        flex-direction: column-reverse;
      }
      .toc-sidebar {
        width: 100%;
        position: static;
        border-left: none;
        padding-left: 0;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 2rem;
        margin-bottom: 2rem;
        max-height: none;
      }
    }

    /* Copy Button */
    .copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f8fafc;
      border-radius: 0.375rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(4px);
    }
    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Lightbox */
    .lightbox {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      backdrop-filter: blur(8px);
    }
    .lightbox.active {
      opacity: 1;
      pointer-events: auto;
    }
    .lightbox img {
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 0.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      transform: scale(0.95);
      transition: transform 0.3s ease;
    }
    .lightbox.active img {
      transform: scale(1);
    }

    /* Animated Counters */
    .counter-block {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1.5rem 2rem;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
      background-color: #ffffff;
      min-width: 140px;
      margin: 0.5rem;
    }
    .counter-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--brand-primary);
      line-height: 1;
      margin-bottom: 0.5rem;
      font-variant-numeric: tabular-nums;
    }
    .counter-prefix,
    .counter-suffix {
      font-size: 1.5rem;
      opacity: 0.75;
    }
    .counter-label {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Testimonial Card */
    .testimonial-card {
      margin: 2rem 0;
      padding: 2rem;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      position: relative;
    }
    .testimonial-quote-mark {
      font-size: 4rem;
      line-height: 1;
      color: #e2e8f0;
      font-family: Georgia, serif;
      margin-bottom: 0.5rem;
    }
    .testimonial-quote {
      font-size: 1.125rem;
      line-height: 1.75;
      color: #334155;
      font-style: italic;
      margin-bottom: 1.5rem;
    }
    .testimonial-author {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .testimonial-avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      color: white;
      flex-shrink: 0;
    }
    .testimonial-author-name {
      font-weight: 600;
      color: #0f172a;
      font-size: 0.9375rem;
    }
    .testimonial-author-role {
      font-size: 0.8125rem;
      color: #64748b;
    }

    /* Hero Banner */
    .hero-banner { margin: 2rem 0; border-radius: 1rem; overflow: hidden; }
    .hero-banner-inner { padding: 4rem 3rem; text-align: center; }
    .hero-banner-title { font-size: 2.5rem; font-weight: 800; color: white; margin: 0 0 1rem; line-height: 1.2; }
    .hero-banner-subtitle { font-size: 1.125rem; color: rgba(255,255,255,0.9); margin: 0 0 2rem; max-width: 600px; margin-left: auto; margin-right: auto; }
    .hero-banner-cta { display: inline-block; padding: 0.75rem 2rem; background: rgba(255,255,255,0.2); color: white; border-radius: 9999px; text-decoration: none; font-weight: 600; border: 2px solid rgba(255,255,255,0.5); transition: background 0.2s; }
    .hero-banner-cta:hover { background: rgba(255,255,255,0.3); }

    /* Stat Row */
    .stat-row { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; margin: 2rem 0; }
    .stat-item { flex: 1; min-width: 140px; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; background: #ffffff; }
    .stat-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .stat-number { font-size: 2.5rem; font-weight: 700; color: var(--brand-primary); line-height: 1; margin-bottom: 0.375rem; font-variant-numeric: tabular-nums; }
    .stat-prefix, .stat-suffix { font-size: 1.5rem; opacity: 0.75; }
    .stat-label { font-size: 0.875rem; color: #64748b; font-weight: 500; }

    /* Code Diff */
    .code-diff { margin: 2rem 0; border-radius: 0.75rem; overflow: hidden; border: 1px solid #e2e8f0; }
    .code-diff-inner { display: flex; }
    .code-diff-panel { flex: 1; min-width: 0; }
    .code-diff-label { padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .diff-label-before { background: #fff1f2; color: #be123c; border-right: 1px solid #fecdd3; }
    .diff-label-after { background: #f0fdf4; color: #15803d; }
    .code-diff-pre { margin: 0; padding: 1rem; overflow-x: auto; background: #f8fafc; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.875rem; line-height: 1.6; border-radius: 0; }
    .code-diff-panel:first-child .code-diff-pre { border-right: 1px solid #e2e8f0; }
    .diff-line { padding: 0 0.25rem; min-height: 1.6em; white-space: pre; }
    .diff-removed { background: #fee2e2; color: #be123c; }
    .diff-added { background: #dcfce7; color: #15803d; }
    .diff-empty { opacity: 0.3; }
    @media (max-width: 600px) { .code-diff-inner { flex-direction: column; } .code-diff-panel:first-child .code-diff-pre { border-right: none; border-bottom: 1px solid #e2e8f0; } .diff-label-before { border-right: none; } }

    /* Before/After Slider */
    .before-after { margin: 2rem 0; border-radius: 0.75rem; overflow: hidden; }
    .before-after-container { position: relative; user-select: none; line-height: 0; }
    .before-after-container img { display: block; width: 100%; height: auto; }
    .before-after-before-clip { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; }
    .before-after-before-clip img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
    .before-after-divider { position: absolute; top: 0; bottom: 0; width: 3px; background: white; transform: translateX(-50%); cursor: ew-resize; box-shadow: 0 0 8px rgba(0,0,0,0.4); }
    .before-after-divider::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 2.5rem; height: 2.5rem; border-radius: 50%; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; }
    .before-after-label { position: absolute; top: 0.75rem; padding: 0.25rem 0.75rem; background: rgba(0,0,0,0.5); color: white; font-size: 0.75rem; font-weight: 600; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
    .before-after-label-left { left: 0.75rem; }
    .before-after-label-right { right: 0.75rem; }

    /* Share Buttons */
    #share-bar {
      position: fixed;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 0.5rem;
      z-index: 9996;
    }
    .share-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.4rem 0.75rem;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid #e2e8f0;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.2s;
      font-family: inherit;
    }
    .share-btn:hover {
      background: rgba(255, 255, 255, 1);
      border-color: #cbd5e1;
      color: var(--brand-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    /* Footer */
    .site-footer {
      width: 100%;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      margin-top: 4rem;
      padding: 2rem 1rem;
    }
    .site-footer-inner {
      max-width: 80rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
    }
    .site-footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      justify-content: center;
    }
    .site-footer-links a {
      font-size: 0.875rem;
      color: #64748b;
      text-decoration: none;
      transition: color 0.2s;
    }
    .site-footer-links a:hover {
      color: var(--brand-primary);
    }
    .site-footer-text {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }
    .site-footer-branding {
      font-size: 0.75rem;
      color: #94a3b8;
      margin: 0;
    }
    .site-footer-branding a {
      color: #94a3b8;
      text-decoration: underline;
    }

    /* Injected CSS from the editor environment */
    ${inlineCSS}

    /* Specific overrides for the exported view to ensure it looks like a document */
    .ProseMirror {
      outline: none !important;
    }
    
    /* Callout Panels */
    .callout {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      margin: 1.5rem 0;
      border-radius: 0.75rem;
      border: 1px solid transparent;
      line-height: 1.625;
    }
    .callout::before {
      content: '';
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      margin-top: 0.125rem;
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
    }
    
    .callout[data-type="info"] {
      background-color: #eff6ff;
      border-color: #dbeafe;
      color: #1e3a8a;
    }
    .callout[data-type="info"]::before {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%232563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>');
    }
    
    .callout[data-type="warning"] {
      background-color: #fffbeb;
      border-color: #fef3c7;
      color: #78350f;
    }
    .callout[data-type="warning"]::before {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>');
    }
    
    .callout[data-type="success"] {
      background-color: #ecfdf5;
      border-color: #d1fae5;
      color: #064e3b;
    }
    .callout[data-type="success"]::before {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>');
    }

    /* Tables */
    table {
      border-collapse: collapse;
      table-layout: auto;
      width: 100%;
      margin: 2rem 0;
      text-align: left;
    }
    
    table td,
    table th {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      position: relative;
    }
    
    table th {
      font-weight: 600;
      background-color: #f8fafc;
      color: #0f172a;
      border-bottom-color: #e2e8f0;
    }

    table tr:hover td {
      background-color: rgba(248, 250, 252, 0.5);
      transition: background-color 0.2s;
    }

    .tableWrapper {
      padding: 1rem 0;
      overflow-x: auto;
    }

    /* Highlight */
    mark {
      background-color: #fef08a;
      border-radius: 0.25rem;
      padding: 0.125rem 0;
    }

    /* Links */
    a {
      color: #2563eb;
      text-decoration: underline;
      cursor: pointer;
    }

    /* Annotated Images */
    .annotated-image-container {
      position: relative;
      display: inline-block;
      width: 100%;
      margin: 2rem 0;
    }
    .annotated-image-container img {
      display: block;
      width: 100%;
      border-radius: 0.5rem;
    }
    .annotation-marker {
      position: absolute;
      transform: translate(-50%, -50%);
      width: 28px;
      height: 28px;
      background-color: #2563eb;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      cursor: help;
      z-index: 20;
    }
    .annotation-marker::after {
      content: attr(data-text);
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 12px;
      background-color: #0f172a;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      white-space: pre-wrap;
      width: max-content;
      max-width: 250px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s, transform 0.2s;
      z-index: 50;
      text-align: center;
    }
    .annotation-marker::before {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-top: 4px;
      border-width: 0 6px 8px 6px;
      border-style: solid;
      border-color: transparent transparent #0f172a transparent;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 50;
    }
    .annotation-marker:hover::after,
    .annotation-marker:hover::before,
    .annotation-marker.active::after,
    .annotation-marker.active::before {
      opacity: 1;
    }

    /* Task Lists */
    ul[data-type="taskList"] {
      list-style: none;
      padding: 0;
    }
    
    ul[data-type="taskList"] li {
      display: flex;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    
    ul[data-type="taskList"] li > label {
      margin-right: 0.5rem;
      user-select: none;
    }
    
    ul[data-type="taskList"] li[data-checked="true"] > div {
      text-decoration: line-through;
      color: #6b7280;
    }
    
    /* Images */
    img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
    }
    
    /* Code Blocks */
    pre {
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }

    code {
      font-family: inherit;
    }

    /* Text Badge */
    .text-badge {
      display: inline;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75em;
      font-weight: 600;
      text-transform: uppercase;
    }

    /* Animated Text */
    @keyframes shimmer-text {
      to { background-position: 200% center; }
    }
    @keyframes fade-in-word {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animated-text-shimmer {
      background: linear-gradient(90deg, #6366f1 0%, #ec4899 40%, #6366f1 80%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .animated-text-shimmer.animate-active {
      animation: shimmer-text 2s linear infinite;
    }
    .animated-text-typewriter.animate-active {
      border-right: 2px solid currentColor;
      animation: typewriter-blink 1s step-end infinite;
    }
    @keyframes typewriter-blink {
      0%, 100% { border-color: transparent; }
      50% { border-color: currentColor; }
    }
    .animated-text-fade-in-word {
      opacity: 0;
    }
    .animated-text-fade-in-word.animate-active {
      animation: fade-in-word 0.6s ease-out forwards;
    }
    @media (prefers-reduced-motion: reduce) {
      .animated-text-shimmer.animate-active,
      .animated-text-typewriter.animate-active,
      .animated-text-fade-in-word.animate-active {
        animation: none !important;
        opacity: 1 !important;
        -webkit-text-fill-color: inherit !important;
        background: none !important;
      }
    }

    /* Mobile Responsive Overrides */
    @media (max-width: 640px) {
      .export-layout {
        padding: 1.5rem 0.75rem;
        gap: 1.5rem;
      }
      .hero-section {
        padding: 3rem 1rem !important;
      }
      .hero-section h1 {
        font-size: 2rem !important;
      }
      .hero-section p {
        font-size: 1rem !important;
      }
      #share-bar {
        position: static;
        justify-content: center;
        padding: 0.5rem 1rem;
        border-bottom: 1px solid #e2e8f0;
      }
      .tab-btn {
        white-space: normal;
        padding: 0.5rem 0.75rem;
        font-size: 0.8125rem;
      }
      .annotation-marker {
        width: 2.75rem;
        height: 2.75rem;
        font-size: 0.875rem;
      }
      .stat-item {
        min-width: calc(50% - 0.5rem);
        padding: 1rem;
      }
      .stat-number {
        font-size: 1.75rem;
      }
      .stat-prefix, .stat-suffix {
        font-size: 1.125rem;
      }
      .stat-label {
        font-size: 0.75rem;
      }
      .hero-banner-inner {
        padding: 2rem 1.5rem;
      }
      .hero-banner-title {
        font-size: 1.75rem;
      }
      .hero-banner-subtitle {
        font-size: 1rem;
      }
      .card-grid[data-cols="3"] {
        grid-template-columns: 1fr;
      }
      .card-grid[data-cols="4"] {
        grid-template-columns: 1fr;
      }
    }
    @media (min-width: 641px) and (max-width: 767px) {
      .card-grid[data-cols="3"] {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 640px) {
      #back-to-top {
        bottom: 1rem;
        right: 1rem;
        width: 3rem;
        height: 3rem;
      }
    }

    ${getCodeThemeCSS(theme?.codeTheme)}

    ${theme?.features?.darkModeSupport ? `
    @media (prefers-color-scheme: dark) {
      body { background-color: #0f172a; color: #f1f5f9; }
      .toc-sidebar { border-left-color: #1e293b; }
      .toc-sidebar h3 { color: #f8fafc; }
      .toc-link { color: #94a3b8; border-left-color: #334155; }
      .toc-link:hover { color: #e2e8f0; border-left-color: #cbd5e1; }
      table th { background-color: #1e293b; color: #f8fafc; border-bottom-color: #334155; }
      table td { border-bottom-color: #1e293b; color: #cbd5e1; }
      table tr:hover td { background-color: rgba(30, 41, 59, 0.5); }
      .grid-column { background-color: #1e293b; border-color: #334155; }
      @media (max-width: 800px) { .toc-sidebar { border-bottom-color: #1e293b; } }
      .accordion-header { background: #1e293b; border-color: #334155; color: #f1f5f9; }
      .accordion-header:hover { background: #253347; }
      .accordion-body-inner { border-color: #334155; }
      .tab-buttons { border-bottom-color: #334155; }
      .tab-btn { color: #94a3b8; }
      .tab-btn:hover { color: #f1f5f9; }
      .tab-panels { border-color: #334155; }
      .section-divider[data-style="solid"] { background: #334155; }
      .callout[data-type="info"] { background-color: rgba(37, 99, 235, 0.1); border-color: rgba(37, 99, 235, 0.2); color: #60a5fa; }
      .callout[data-type="warning"] { background-color: rgba(217, 119, 6, 0.1); border-color: rgba(217, 119, 6, 0.2); color: #fbbf24; }
      .callout[data-type="success"] { background-color: rgba(5, 150, 105, 0.1); border-color: rgba(5, 150, 105, 0.2); color: #34d399; }
      pre { background-color: #020617; }
      .guide-container { color: #e2e8f0; }
      .guide-container h1, .guide-container h2, .guide-container h3,
      .guide-container h4, .guide-container h5, .guide-container h6 { color: #f8fafc; }
      .guide-container p, .guide-container li { color: #cbd5e1; }
      .guide-container a { color: #93c5fd; }
      .guide-container strong { color: #f1f5f9; }
      .guide-container blockquote { color: #94a3b8; border-left-color: #334155; }
      .export-layout { background-color: #0f172a; }
      mark { background-color: #713f12; color: #fef3c7; }
      .timeline-step::after { background-color: #334155; }
      .timeline-step-title { color: #f1f5f9; }
      .card { background-color: #1e293b; border-color: #334155; }
      .card:hover { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); }
      .card-title { color: #f1f5f9; }
      .card-body { color: #94a3b8; }
      .counter-block { background-color: #1e293b; border-color: #334155; }
      .counter-label { color: #94a3b8; }
      .testimonial-card { background-color: #1e293b; border-color: #334155; }
      .testimonial-quote { color: #cbd5e1; }
      .testimonial-author-name { color: #f1f5f9; }
      .testimonial-author-role { color: #94a3b8; }
      .stat-item { background: #1e293b; border-color: #334155; }
      .stat-label { color: #94a3b8; }
      .code-diff { border-color: #334155; }
      .code-diff-pre { background: #0f172a; color: #e2e8f0; }
      .diff-removed { background: rgba(190,18,60,0.2); color: #fda4af; }
      .diff-added { background: rgba(21,128,61,0.2); color: #86efac; }
      .diff-label-before { background: rgba(190,18,60,0.15); border-color: #334155; }
      .diff-label-after { background: rgba(21,128,61,0.15); }
      .share-btn { background: rgba(15, 23, 42, 0.9); border-color: #334155; color: #94a3b8; }
      .share-btn:hover { background: rgba(30, 41, 59, 1); color: var(--brand-primary); }
    }

    html.dark body { background-color: #0f172a; color: #f1f5f9; }
    html.dark .toc-sidebar { border-left-color: #1e293b; }
    html.dark .toc-sidebar h3 { color: #f8fafc; }
    html.dark .toc-link { color: #94a3b8; border-left-color: #334155; }
    html.dark .toc-link:hover { color: #e2e8f0; border-left-color: #cbd5e1; }
    html.dark table th { background-color: #1e293b; color: #f8fafc; border-bottom-color: #334155; }
    html.dark table td { border-bottom-color: #1e293b; color: #cbd5e1; }
    html.dark table tr:hover td { background-color: rgba(30, 41, 59, 0.5); }
    html.dark .grid-column { background-color: #1e293b; border-color: #334155; }
    @media (max-width: 800px) { html.dark .toc-sidebar { border-bottom-color: #1e293b; } }
    html.dark .accordion-header { background: #1e293b; border-color: #334155; color: #f1f5f9; }
    html.dark .accordion-header:hover { background: #253347; }
    html.dark .accordion-header.open { border-bottom-color: transparent; }
    html.dark .accordion-body-inner { border-color: #334155; }
    html.dark .tab-buttons { border-bottom-color: #334155; }
    html.dark .tab-btn { color: #94a3b8; }
    html.dark .tab-btn:hover { color: #f1f5f9; }
    html.dark .tab-panels { border-color: #334155; }
    html.dark .section-divider[data-style="solid"] { background: #334155; }
    html.dark .callout[data-type="info"] { background-color: rgba(37, 99, 235, 0.1); border-color: rgba(37, 99, 235, 0.2); color: #60a5fa; }
    html.dark .callout[data-type="warning"] { background-color: rgba(217, 119, 6, 0.1); border-color: rgba(217, 119, 6, 0.2); color: #fbbf24; }
    html.dark .callout[data-type="success"] { background-color: rgba(5, 150, 105, 0.1); border-color: rgba(5, 150, 105, 0.2); color: #34d399; }
    html.dark pre { background-color: #020617; }
    html.dark .guide-container { color: #e2e8f0; }
    html.dark .guide-container h1, html.dark .guide-container h2, html.dark .guide-container h3,
    html.dark .guide-container h4, html.dark .guide-container h5, html.dark .guide-container h6 { color: #f8fafc; }
    html.dark .guide-container p, html.dark .guide-container li { color: #cbd5e1; }
    html.dark .guide-container a { color: #93c5fd; }
    html.dark .guide-container strong { color: #f1f5f9; }
    html.dark .guide-container blockquote { color: #94a3b8; border-left-color: #334155; }
    html.dark .export-layout { background-color: #0f172a; }
    html.dark mark { background-color: #713f12; color: #fef3c7; }
    html.dark .timeline-step::after { background-color: #334155; }
    html.dark .timeline-step-title { color: #f1f5f9; }
    html.dark .card { background-color: #1e293b; border-color: #334155; }
    html.dark .card:hover { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); }
    html.dark .card-title { color: #f1f5f9; }
    html.dark .card-body { color: #94a3b8; }
    html.dark .counter-block { background-color: #1e293b; border-color: #334155; }
    html.dark .counter-label { color: #94a3b8; }
    html.dark .testimonial-card { background-color: #1e293b; border-color: #334155; }
    html.dark .testimonial-quote { color: #cbd5e1; }
    html.dark .testimonial-author-name { color: #f1f5f9; }
    html.dark .testimonial-author-role { color: #94a3b8; }
    html.dark .stat-item { background: #1e293b; border-color: #334155; }
    html.dark .stat-label { color: #94a3b8; }
    html.dark .code-diff { border-color: #334155; }
    html.dark .code-diff-pre { background: #0f172a; color: #e2e8f0; }
    html.dark .diff-removed { background: rgba(190,18,60,0.2); color: #fda4af; }
    html.dark .diff-added { background: rgba(21,128,61,0.2); color: #86efac; }
    html.dark .diff-label-before { background: rgba(190,18,60,0.15); border-color: #334155; }
    html.dark .diff-label-after { background: rgba(21,128,61,0.15); }
    html.dark .share-btn { background: rgba(15, 23, 42, 0.9); border-color: #334155; color: #94a3b8; }
    html.dark .share-btn:hover { background: rgba(30, 41, 59, 1); color: var(--brand-primary); }
    html.dark .site-footer { background-color: #0f172a; border-top-color: #1e293b; }
    html.dark .site-footer-links a { color: #94a3b8; }
    html.dark .site-footer-text { color: #94a3b8; }
    html.dark .site-footer-branding, html.dark .site-footer-branding a { color: #475569; }
    @media (prefers-color-scheme: dark) {
      .site-footer { background-color: #0f172a; border-top-color: #1e293b; }
      .site-footer-links a { color: #94a3b8; }
      .site-footer-text { color: #94a3b8; }
      .site-footer-branding, .site-footer-branding a { color: #475569; }
    }
    ` : ''}

    ${theme?.features?.scrollReveal ? `
    .reveal {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    .reveal.active {
      opacity: 1;
      transform: translateY(0);
    }
    ` : ''}

    ${theme?.features?.readingProgressBar ? `
    #reading-progress {
      position: fixed;
      top: 0;
      left: 0;
      width: 0%;
      height: 3px;
      background-color: var(--brand-primary);
      z-index: 9998;
      transition: width 0.1s linear;
    }
    ` : ''}

    ${theme?.features?.backToTop ? `
    #back-to-top {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 9999px;
      background-color: var(--brand-primary);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.25s ease, transform 0.25s ease;
      z-index: 9997;
      pointer-events: none;
    }
    #back-to-top.visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    #back-to-top:hover {
      filter: brightness(1.1);
    }
    ` : ''}

    ${theme?.features?.printStylesheet ? `
    @media print {
      #reading-progress,
      #back-to-top,
      #share-bar,
      .sticky-header,
      .toc-sidebar,
      .copy-btn,
      .lightbox,
      .site-footer {
        display: none !important;
      }
      body {
        background-color: #ffffff !important;
        color: #000000 !important;
      }
      .export-layout {
        display: block;
        padding: 0;
        max-width: 100%;
      }
      .guide-container {
        width: 100%;
      }
      pre, blockquote {
        page-break-inside: avoid;
      }
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }
      details {
        display: block;
      }
      details > * {
        display: block !important;
      }
      .accordion-body { max-height: none !important; display: block !important; }
      .accordion-body-inner { border: none !important; padding: 0.5rem 0 !important; }
      .accordion-header { background: none !important; border: none !important; font-size: 1rem !important; padding: 0.5rem 0 !important; }
      .tab-buttons { display: none !important; }
      .tab-panel { display: block !important; padding: 0 !important; }
      .tab-panel + .tab-panel { border-top: 1px solid #e2e8f0; padding-top: 1rem !important; }
      .card-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.75rem !important; }
      .card { break-inside: avoid; box-shadow: none !important; transform: none !important; border: 1px solid #e2e8f0 !important; }
      .timeline-step::after { background-color: #e2e8f0 !important; }
      .video-embed-wrapper { display: none; }
      .video-embed video { display: none; }
      .before-after-container { display: flex; flex-direction: column; }
      .before-after-before-clip { position: static; clip-path: none; width: 100%; }
      .before-after-divider, .before-after-label { display: none; }
    }
    ` : ''}
  </style>
  ${theme?.customCSS ? `<style>${theme.customCSS}</style>` : ''}
</head>
<body>
  ${theme?.features?.readingProgressBar ? `<div id="reading-progress"></div>` : ''}
  ${theme?.features?.backToTop ? `
  <button id="back-to-top" aria-label="Back to top">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
  </button>` : ''}
  ${theme?.features?.shareButtons ? `
  <div id="share-bar">
    <button class="share-btn" id="copy-link-btn" aria-label="Copy link">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      Copy Link
    </button>
    <button class="share-btn" onclick="window.print()" aria-label="Print">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
      Print
    </button>
  </div>` : ''}
  ${theme?.hero?.enabled ? `
    <div class="hero-section" style="background-color: var(--brand-primary); color: white; padding: ${theme.hero.layout === 'full' ? '6rem 2rem' : '3rem 2rem'}; text-align: center; position: relative; overflow: hidden;">
      ${theme.hero.coverImageBase64 ? `<img src="${theme.hero.coverImageBase64}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.3; z-index: 0;" alt="Hero Cover" />` : ''}
      <div style="position: relative; z-index: 1; max-width: 800px; margin: 0 auto;">
        <h1 style="font-size: ${theme.hero.layout === 'full' ? '3.5rem' : '2.5rem'}; font-weight: 800; margin-bottom: 1rem; line-height: 1.2;">${title || 'Untitled Guide'}</h1>
        ${theme.hero.subtitle ? `<p style="font-size: 1.25rem; opacity: 0.9; max-width: 600px; margin: 0 auto;">${theme.hero.subtitle}</p>` : ''}
      </div>
    </div>
  ` : ''}
  ${theme?.features?.stickyHeader && theme?.logoBase64 ? `
    <div class="sticky-header" style="position: sticky; top: 0; z-index: 100; background: ${theme?.features?.darkModeSupport ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'}; backdrop-filter: blur(8px); border-bottom: 1px solid ${theme?.features?.darkModeSupport ? '#1e293b' : '#f1f5f9'}; padding: 1rem 2rem; display: flex; align-items: center;">
      <img src="${theme.logoBase64}" alt="Brand Logo" style="max-height: 32px; object-fit: contain;" />
      ${!theme?.hero?.enabled ? `<span style="margin-left: 1rem; font-weight: 600;">${title || 'Untitled Guide'}</span>` : ''}
    </div>
  ` : ''}
  <div class="export-layout">
    <div class="guide-container prose prose-slate max-w-none">
      ${theme?.logoBase64 && !theme?.features?.stickyHeader && !theme?.hero?.enabled ? `<div class="brand-header"><img src="${theme.logoBase64}" alt="Brand Logo" class="brand-logo" /></div>` : ''}
      ${!theme?.hero?.enabled ? `<h1>${title || 'Untitled Guide'}</h1>` : ''}
      ${processedHTML}
    </div>
    ${tocHTML}
  </div>
  ${theme?.footer?.enabled ? `
  <footer class="site-footer">
    <div class="site-footer-inner">
      ${(theme.footer.links ?? []).length > 0 ? `
      <nav class="site-footer-links">
        ${theme.footer.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a>`).join('')}
      </nav>` : ''}
      ${theme.footer.text ? `<p class="site-footer-text">${theme.footer.text}</p>` : ''}
      ${theme.footer.showBranding ? `<p class="site-footer-branding">Made with <a href="https://github.com/coletrain35/GuideEm" target="_blank" rel="noopener noreferrer">GuideEm</a></p>` : ''}
    </div>
  </footer>` : ''}
  <script>
    ${theme?.features?.scrollReveal ? `
    document.addEventListener('DOMContentLoaded', () => {
      const elements = document.querySelectorAll('.guide-container > *');
      elements.forEach(el => el.classList.add('reveal'));

      const revealElements = document.querySelectorAll('.reveal');
      const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        revealElements.forEach(el => {
          const elementTop = el.getBoundingClientRect().top;
          if (elementTop < windowHeight - elementVisible) {
            el.classList.add('active');
          }
        });
      };

      window.addEventListener('scroll', revealOnScroll);
      revealOnScroll(); // Trigger once on load
    });
    ` : ''}
    ${inlineJS}
  </script>
</body>
</html>`;

  return fullHTML;
};
