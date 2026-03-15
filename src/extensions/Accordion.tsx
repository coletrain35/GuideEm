import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState } from 'react';
import { ChevronDown, Trash2, Plus } from 'lucide-react';

// --- AccordionItem ---

const AccordionItemNodeView = (props: any) => {
  const { node, updateAttributes } = props;
  const { title } = node.attrs;
  const [isOpen, setIsOpen] = useState(true);

  return (
    <NodeViewWrapper className="accordion-item-editor my-0.5">
      <div
        className="flex items-center gap-2 px-4 py-3 bg-slate-100 border border-slate-200 cursor-pointer select-none"
        style={{ borderRadius: isOpen ? '0.5rem 0.5rem 0 0' : '0.5rem' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <ChevronDown
          size={16}
          className="text-slate-500 flex-shrink-0 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
        <input
          value={title}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent font-medium text-slate-800 outline-none text-sm"
          placeholder="Section title..."
        />
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
    <NodeViewWrapper className={`relative my-8 transition-all ${selected ? 'ring-2 ring-slate-200 rounded-xl p-2' : ''}`}>
      {selected && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-10 text-sm">
          <button
            onClick={addItem}
            className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-slate-100 text-slate-600"
          >
            <Plus size={14} />
            Add Section
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button
            onClick={() => deleteNode()}
            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
            title="Delete Accordion"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
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
