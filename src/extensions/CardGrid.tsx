import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';
import { Plus } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

// --- Card ---

const CardNodeView = (props: any) => {
  const { node, updateAttributes } = props;
  const { emoji, title } = node.attrs;

  return (
    <NodeViewWrapper className="card-editor border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md transition-shadow flex flex-col gap-3 min-h-[140px]">
      <div className="flex items-start gap-3">
        <input
          value={emoji}
          onChange={(e) => updateAttributes({ emoji: e.target.value })}
          className="w-9 text-2xl text-center bg-transparent outline-none flex-shrink-0 leading-none"
          placeholder="📄"
          maxLength={2}
        />
        <input
          value={title}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          className="flex-1 font-semibold text-slate-900 bg-transparent outline-none text-base placeholder:text-slate-400"
          placeholder="Card title..."
        />
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

const CardGridNodeView = (props: any) => {
  const { node, selected, deleteNode, editor, getPos, updateAttributes } = props;
  const { cols } = node.attrs;

  const addCard = () => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos === undefined || node.childCount >= 6) return;
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-10 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => updateAttributes({ cols: n })}
            className={`px-3 py-1 rounded-full hover:bg-slate-100 ${cols === n ? 'bg-slate-100 font-medium' : 'text-slate-600'}`}
          >
            {n} cols
          </button>
        ))}
        {node.childCount < 6 && (
          <>
            <div className="w-px h-4 bg-slate-300 mx-1" />
            <button
              onClick={addCard}
              className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-slate-100 text-slate-600"
            >
              <Plus size={14} /> Add Card
            </button>
          </>
        )}
      </div>
      <NodeViewContent className={`grid gap-4 ${gridClass}`} />
    </NodeViewWrapper>
  );
};

export const CardGrid = Node.create({
  name: 'cardGrid',
  group: 'block',
  content: 'card{1,6}',
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
