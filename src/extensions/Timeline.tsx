import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';
import { Plus } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

// --- TimelineStep ---

const TimelineStepNodeView = (props: any) => {
  const { node, updateAttributes } = props;
  const { title } = node.attrs;

  return (
    <NodeViewWrapper className="timeline-step-editor flex gap-4 relative">
      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
        <div className="timeline-step-num w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 shadow-md" />
        <div className="w-0.5 bg-slate-200 flex-1 mt-2 min-h-[32px]" />
      </div>
      <div className="flex-1 min-w-0 pb-6">
        <input
          value={title}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          className="w-full font-semibold text-slate-900 bg-transparent outline-none text-base mb-2 placeholder:text-slate-400"
          placeholder="Step title..."
        />
        <NodeViewContent className="prose prose-slate prose-sm max-w-none min-h-[40px]" />
      </div>
    </NodeViewWrapper>
  );
};

export const TimelineStep = Node.create({
  name: 'timelineStep',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      title: {
        default: 'New Step',
        parseHTML: (el) => el.getAttribute('data-title') || 'New Step',
        renderHTML: (attrs) => ({ 'data-title': attrs.title }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="timeline-step"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'timeline-step' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimelineStepNodeView);
  },
});

// --- Timeline (parent) ---

const TimelineNodeView = (props: any) => {
  const { node, selected, deleteNode, editor, getPos } = props;

  const addStep = () => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos === undefined) return;
    const endPos = pos + node.nodeSize - 1;
    editor.chain().focus().insertContentAt(endPos, {
      type: 'timelineStep',
      attrs: { title: 'New Step' },
      content: [{ type: 'paragraph' }],
    }).run();
  };

  return (
    <NodeViewWrapper className={`group/block timeline-editor relative my-8 transition-all ${selected ? 'ring-2 ring-slate-200 rounded-xl p-3' : ''}`}>
      <BlockDeleteButton deleteNode={deleteNode} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-10 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        <button
          onClick={addStep}
          className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-slate-100 text-slate-600"
        >
          <Plus size={14} /> Add Step
        </button>
      </div>
      <NodeViewContent className="flex flex-col" />
    </NodeViewWrapper>
  );
};

export const Timeline = Node.create({
  name: 'timeline',
  group: 'block',
  content: 'timelineStep+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="timeline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'timeline' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimelineNodeView);
  },
});
