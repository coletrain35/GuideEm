import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useEffect, useState } from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';
import { Edit3, Check } from 'lucide-react';

export interface MathBlockOptions {
  HTMLAttributes: Record<string, any>;
}

const MathBlockView = ({ node, updateAttributes, deleteNode, getPos, editor }: any) => {
  const latex: string = node.attrs.latex ?? 'E = mc^2';
  const caption: string = node.attrs.caption ?? '';
  const [renderedHtml, setRenderedHtml] = useState<string>(node.attrs.cachedHtml || '');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const katex = await import('katex');
        const render = katex.default?.renderToString || katex.renderToString;
        const html = render(latex || 'E = mc^2', {
          displayMode: true,
          throwOnError: false,
          output: 'mathml',
        });
        if (cancelled) return;
        setRenderedHtml(html);
        if (html && html !== node.attrs.cachedHtml) {
          updateAttributes({ cachedHtml: html });
        }
      } catch {
        // Fallback when KaTeX fails to load
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [latex, node.attrs.cachedHtml, updateAttributes]);

  return (
    <NodeViewWrapper className="math-block-wrapper my-6 relative group/block">
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} editor={editor} node={node} />

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 pr-20 transition-colors hover:border-slate-300">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            KaTeX Formula
          </span>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="math-edit-toggle-btn inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
          >
            {editing ? <><Check size={12} /> Done</> : <><Edit3 size={12} /> Edit LaTeX</>}
          </button>
        </div>

        <div
          className="math-block-preview py-3 px-4 bg-white rounded-lg border border-slate-100 overflow-x-auto text-center text-slate-900"
          contentEditable={false}
          {...(renderedHtml
            ? { dangerouslySetInnerHTML: { __html: renderedHtml } }
            : { children: <code className="font-mono text-sm text-slate-700">$${latex}$$</code> })}
        />

        {caption && !editing && (
          <p className="text-xs text-slate-500 text-center mt-2 mb-0">{caption}</p>
        )}

        {editing && (
          <div className="mt-3 space-y-2 pt-3 border-t border-slate-200" onMouseDown={(e) => e.stopPropagation()}>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">LaTeX Expression</label>
              <input
                type="text"
                value={latex}
                onChange={(e) => updateAttributes({ latex: e.target.value })}
                placeholder="e.g. \int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}"
                className="math-latex-input w-full px-3 py-1.5 text-sm font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Caption (optional)</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => updateAttributes({ caption: e.target.value })}
                placeholder="Equation description…"
                className="math-caption-input w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const MathBlock = Node.create<MathBlockOptions>({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      latex: {
        default: 'E = mc^2',
        parseHTML: (element) => element.getAttribute('data-latex') || 'E = mc^2',
        renderHTML: (attributes) => {
          const val = typeof attributes === 'string' ? attributes : attributes.latex;
          return { 'data-latex': val || '' };
        },
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption') || '',
        renderHTML: (attributes) => {
          const val = typeof attributes === 'string' ? attributes : attributes.caption;
          return val ? { 'data-caption': val } : {};
        },
      },
      cachedHtml: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-cached-html') || '',
        renderHTML: (attributes) => {
          const val = typeof attributes === 'string' ? attributes : attributes.cachedHtml;
          return val ? { 'data-cached-html': val } : {};
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="math-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, { 'data-type': 'math-block' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView);
  },
});
