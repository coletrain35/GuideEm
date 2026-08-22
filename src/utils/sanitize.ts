import DOMPurify from 'dompurify';

/**
 * Escapes all 5 HTML-significant characters for safe interpolation into HTML.
 */
export const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

const DANGEROUS_PROTOCOL_RE = /^\s*(javascript|vbscript|data)\s*:/i;
const SAFE_DATA_IMAGE_RE = /^\s*data:image\//i;

/**
 * Sanitizes a URL for use in href attributes.
 * Allows http, https, mailto, tel, and relative URLs.
 * Rejects javascript:, vbscript:, and data: protocols.
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (DANGEROUS_PROTOCOL_RE.test(trimmed)) return '';
  return trimmed;
}

/**
 * Sanitizes a URL for use in img/video src attributes.
 * Like sanitizeUrl but also allows data:image/ URIs (for base64 images).
 */
export function sanitizeImageSrc(src: string | undefined | null): string {
  if (!src) return '';
  const trimmed = src.trim();
  if (!trimmed) return '';
  if (SAFE_DATA_IMAGE_RE.test(trimmed)) return trimmed;
  if (DANGEROUS_PROTOCOL_RE.test(trimmed)) return '';
  return trimmed;
}

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3,8})$/;
const CSS_NAMED_COLOR_RE = /^[a-zA-Z]{3,25}$/;
const SAFE_CSS_COLOR_RE = /^(rgb|hsl)a?\(\s*[\d.,\s%]+\)$/;

/**
 * Sanitizes a CSS color value to prevent CSS injection.
 * Allows hex colors, named colors, and rgb/hsl functions.
 * Returns a safe fallback for anything else.
 */
export function sanitizeColor(color: string | undefined | null, fallback = '#000000'): string {
  if (!color) return fallback;
  const trimmed = color.trim();
  if (!trimmed) return fallback;
  if (HEX_COLOR_RE.test(trimmed)) return trimmed;
  if (CSS_NAMED_COLOR_RE.test(trimmed)) return trimmed;
  if (SAFE_CSS_COLOR_RE.test(trimmed)) return trimmed;
  return fallback;
}

/**
 * Sanitizes a numeric value for use in CSS (e.g., position percentages).
 * Returns a clamped number or the fallback.
 */
export function sanitizeCssNumber(value: any, min = 0, max = 100, fallback = 0): number {
  const num = parseFloat(value);
  if (isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

// Shared DOMPurify configuration for content sanitization
const ALLOWED_TAGS = [
  // Block elements
  'p', 'div', 'span', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  // Inline formatting
  'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
  // Media
  'img', 'figure', 'figcaption', 'picture', 'source', 'video', 'audio',
  // Links & interactive
  'a', 'button', 'details', 'summary',
  // Form elements used in task lists
  'input', 'label',
  // SVG (for inline icons)
  'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'use',
  // iframe (for YouTube/Vimeo embeds)
  'iframe',
];

const ALLOWED_ATTR = [
  'class', 'style', 'id',
  'href', 'src', 'alt', 'title', 'target', 'rel',
  'width', 'height',
  'type', 'checked', 'disabled',
  'colspan', 'rowspan', 'scope',
  // SVG attributes
  'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'points', 'transform', 'xmlns',
  // Media
  'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload',
  'allow', 'allowfullscreen', 'frameborder', 'loading',
  // Data attributes (used extensively by block types)
  'data-type', 'data-text', 'data-annotations', 'data-label',
];

export const SANITIZE_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: true,
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|blob):|data:image\/|#)/i,
  ADD_ATTR: ['target'],
};

/**
 * Sanitizes HTML content using DOMPurify.
 * Removes all script tags, event handlers, and dangerous content.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}
