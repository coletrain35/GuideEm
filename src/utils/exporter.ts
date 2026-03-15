import { ThemeConfig } from './storage';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '37, 99, 235';
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
    .annotation-marker:hover::before {
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
      background-color: #1f2937;
      color: #f3f4f6;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    }
    
    code {
      font-family: inherit;
    }

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
  </style>
</head>
<body>
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
