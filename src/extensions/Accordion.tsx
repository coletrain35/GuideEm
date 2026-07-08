import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

// --- AccordionItem ---

const AccordionItemNodeView = (props: any) => {
  const { node, updateAttributes, deleteNode, getPos, editor } = props;
  const { title } = node.attrs;
  const [isOpen, setIsOpen] = useState(true);

  // Don't allow deletion of the last remaining section — that would leave
  // the parent Accordion node empty, which Tiptap disallows.
  const canDelete = editor && typeof getPos === 'function' && (() => {
    const pos = getPos();
    if (pos == null) return false;
    const parent = editor.state.doc.nodeAt(pos);
    return !!parent && parent.childCount > 1;
  })();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDelete) return;
    const pos = getPos();
    if (pos == null) return;
    const itemNodeSize = node.nodeSize;
    editor.chain().focus().deleteRange({ from: pos, to: pos + itemNodeSize }).run();
  };

  return (
    <NodeViewWrapper className="accordion-item-editor my-0.5 group/accordion-item">
      <div
        className="flex items-center gap-2 px-4 py-3 bg-slate-100 border border-slate-200 cursor-pointer select-none"
        style={{ borderRadius: isOpen ? '0.5rem 0.5rem 0 0' : '0.5rem' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronDown
          size={16}
          className="text-slate-500 flex-shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden
        />
        <input
          value={title}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent font-medium text-slate-800 outline-none text-sm"
          placeholder="Section title..."
          aria-label="Section title"
        />
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover/accordion-item:opacity-100"
            title="Delete this section"
            aria-label={`Delete section "${title || 'Untitled'}"`}
          >
            <X size={14} aria-hidden />
          </button>
        )}
      </div>
      <div
        className="overflow-hidden"
        style={{ maxHeight: isOpen ? '9999px' : '0', transition: 'max-height 0.25s ease' }}
      >
        <NodeViewContent className="p-4 border border-t-0 border-slate-200 rounded-b-lg min-h-[60px]" />
      </div>
    </NodeViewWrapper>
  );
};

export const AccordionItem = Node.create({
  name: 'accordionItem',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      title: {
        default: 'New Section',
        parseHTML: (el) => el.getAttribute('data-title') || 'New Section',
        renderHTML: (attrs) => ({ 'data-title': attrs.title }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="accordion-item"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'accordion-item' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionItemNodeView);
  },
});

// --- Accordion (parent) ---

const AccordionNodeView = (props: any) => {
  const { node, selected, deleteNode, editor, getPos } = props;

  const addItem = () => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos === undefined) return;
    const endPos = pos + node.nodeSize - 1;
    editor.chain().focus().insertContentAt(endPos, {
      type: 'accordionItem',
      attrs: { title: 'New Section' },
      content: [{ type: 'paragraph' }],
    }).run();
  };

  return (
    <NodeViewWrapper className={`group/block relative my-8 transition-all ${selected ? 'ring-2 ring-slate-200 rounded-xl p-2' : ''}`}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-30 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        <button
          onClick={addItem}
          className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-slate-100 text-slate-600"
        >
          <Plus size={14} />
          Add Section
        </button>
      </div>
      <NodeViewContent className="flex flex-col" />
    </NodeViewWrapper>
  );
};

export const Accordion = Node.create({
  name: 'accordion',
  group: 'block',
  content: 'accordionItem+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="accordion"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'accordion' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AccordionNodeView);
  },
});
