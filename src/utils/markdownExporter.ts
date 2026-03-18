/**
 * Converts a Tiptap JSON document to Markdown.
 * Handles all standard Tiptap/ProseMirror node types used in this editor.
 * Custom blocks (CardGrid, HeroBanner, etc.) degrade to their text content.
 */
export function tiptapJsonToMarkdown(doc: any): string {
  if (!doc || doc.type !== 'doc') return '';
  return blocksToMarkdown(doc.content || []);
}

function blocksToMarkdown(nodes: any[]): string {
  return nodes.map(blockToMarkdown).filter(Boolean).join('\n\n');
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
      return `\`\`\`${lang}\n${code}\n\`\`\``;
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
      const kind = node.attrs?.kind || 'info';
      const inner = blocksToMarkdown(node.content || []);
      const prefixed = inner.split('\n').map((l: string) => `> ${l}`).join('\n');
      return `> **[${kind.toUpperCase()}]**\n${prefixed}`;
    }

    default:
      // Fallback: extract text content recursively
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
        case 'highlight': text = `==${text}==`; break;
        case 'link': {
          const href = mark.attrs?.href || '';
          text = `[${text}](${href})`;
          break;
        }
        // gradientText, textBadge, animatedText: keep text as-is
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
