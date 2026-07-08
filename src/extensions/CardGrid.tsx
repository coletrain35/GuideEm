import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';
import { Plus, X } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

// --- Card ---

const CardNodeView = (props: any) => {
  const { node, updateAttributes, editor, getPos } = props;
  const { emoji, title } = node.attrs;

  // Don't allow deletion of the only card — would leave CardGrid empty.
  let canDelete = false;
  try {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos !== undefined) {
      const resolved = editor.state.doc.resolve(pos);
      const parent = resolved.node(resolved.depth);
      canDelete = parent.childCount > 1;
    }
  } catch { /* fallback */ }

  const handleDeleteCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDelete) return;
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos === undefined) return;
    const cardSize = node.nodeSize;
    editor.chain().focus().deleteRange({ from: pos, to: pos + cardSize }).run();
  };

  return (
    <NodeViewWrapper className="card-editor relative border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md transition-shadow flex flex-col gap-3 min-h-[140px] group/card">
      <div className="flex items-start gap-3">
        <input
          value={emoji}
          onChange={(e) => updateAttributes({ emoji: e.target.value })}
          className="w-9 text-2xl text-center bg-transparent outline-none flex-shrink-0 leading-none"
          placeholder="📄"
          maxLength={2}
          aria-label="Card emoji"
        />
        <input
          value={title}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          className="flex-1 min-w-0 font-semibold text-slate-900 bg-transparent outline-none text-base placeholder:text-slate-400"
          placeholder="Card title..."
          aria-label="Card title"
        />
        {canDelete && (
          <button
            type="button"
            onClick={handleDeleteCard}
            onMouseDown={(e) => e.stopPropagation()}
            className="opacity-0 group-hover/card:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors flex-shrink-0"
            title="Delete this card"
            aria-label={`Delete card "${title || 'Untitled'}"`}
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </div>
      <NodeViewContent className="prose prose-slate prose-sm max-w-none flex-1 min-h-[40px] text-slate-600" />
    </NodeViewWrapper>
  );
};

export const Card = Node.create({
  name: 'card',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      emoji: {
        default: '📄',
        parseHTML: (el) => el.getAttribute('data-emoji') || '📄',
        renderHTML: (attrs) => ({ 'data-emoji': attrs.emoji }),
      },
      title: {
        default: 'Card Title',
        parseHTML: (el) => el.getAttribute('data-title') || 'Card Title',
        renderHTML: (attrs) => ({ 'data-title': attrs.title }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="card"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'card' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CardNodeView);
  },
});

// --- CardGrid (parent) ---

const MAX_CARDS = 12;

const CardGridNodeView = (props: any) => {
  const { node, selected, deleteNode, editor, getPos, updateAttributes } = props;
  const { cols } = node.attrs;
  const atMax = node.childCount >= MAX_CARDS;

  const addCard = () => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos === undefined || atMax) return;
    const endPos = pos + node.nodeSize - 1;
    editor.chain().focus().insertContentAt(endPos, {
      type: 'card',
      attrs: { emoji: '📄', title: 'New Card' },
      content: [{ type: 'paragraph' }],
    }).run();
  };

  const gridClass =
    cols === 2 ? 'grid-cols-2' :
    cols === 4 ? 'grid-cols-4' :
    'grid-cols-3';

  return (
    <NodeViewWrapper className={`group/block relative my-8 transition-all ${selected ? 'ring-2 ring-slate-200 rounded-xl p-2' : ''}`}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-30 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => updateAttributes({ cols: n })}
            className={`px-3 py-1 rounded-full hover:bg-slate-100 ${cols === n ? 'bg-slate-100 font-medium' : 'text-slate-600'}`}
            aria-label={`${n} columns`}
            aria-pressed={cols === n}
          >
            {n} cols
          </button>
        ))}
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <span
          className="px-2 py-1 text-[10px] text-slate-500 tabular-nums"
          aria-live="polite"
        >
          {node.childCount} / {MAX_CARDS}
        </span>
        <button
          onClick={addCard}
          disabled={atMax}
          className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          title={atMax ? `Maximum ${MAX_CARDS} cards` : 'Add a card'}
          aria-label={atMax ? `Maximum ${MAX_CARDS} cards reached` : 'Add a card'}
        >
          <Plus size={14} aria-hidden /> Add Card
        </button>
      </div>
      <NodeViewContent className={`grid gap-4 ${gridClass}`} />
    </NodeViewWrapper>
  );
};

export const CardGrid = Node.create({
  name: 'cardGrid',
  group: 'block',
  content: `card{1,${MAX_CARDS}}`,
  isolating: true,

  addAttributes() {
    return {
      cols: {
        default: 3,
        parseHTML: (el) => parseInt(el.getAttribute('data-cols') || '3', 10),
        renderHTML: (attrs) => ({ 'data-cols': String(attrs.cols) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="card-grid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'card-grid' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CardGridNodeView);
  },
});
