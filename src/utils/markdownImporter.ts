import { marked } from 'marked';
import { sanitizeHtml } from './sanitize';

// Configure marked for clean output
marked.setOptions({
  gfm: true,
  breaks: false,
});

export function markdownToHtml(markdown: string): string {
  const rawHtml = marked(markdown) as string;
  return sanitizeHtml(rawHtml);
}
