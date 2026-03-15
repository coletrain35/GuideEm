import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React from 'react';
import { Trash2, Plus } from 'lucide-react';

// --- TabPanel ---

const TabPanelNodeView = (props: any) => {
  const { node, updateAttributes } = props;
  const { label } = node.attrs;

  return (
    <NodeViewWrapper className="tab-panel-editor border border-slate-200 overflow-hidden my-0.5 last:rounded-b-lg">
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex-shrink-0">Tab:</span>
        <input
          value={label}
          onChange={(e) => updateAttributes({ label: e.target.value })}
          className="flex-1 bg-transparent font-medium text-slate-700 outline-none text-sm"
          placeholder="Tab label..."
        />
      </div>
      <NodeViewContent className="p-4 min-h-[60px]" />
    </NodeViewWrapper>
  );
};

export const TabPanel = Node.create({
  name: 'tabPanel',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      label: {
        default: 'Tab',
        parseHTML: (el) => el.getAttribute('data-label') || 'Tab',
        renderHTML: (attrs) => ({ 'data-label': attrs.label }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="tab-panel"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tab-panel' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabPanelNodeView);
  },
});

// --- TabGroup (parent) ---

const TabGroupNodeView = (props: any) => {
  const { node, selected, deleteNode, editor, getPos } = props;

  const addTab = () => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos === undefined) return;
    const endPos = pos + node.nodeSize - 1;
    const tabCount = node.childCount;
    editor.chain().focus().insertContentAt(endPos, {
      type: 'tabPanel',
      attrs: { label: `Tab ${tabCount + 1}` },
      content: [{ type: 'paragraph' }],
    }).run();
  };

  // Collect tab labels for the header preview
  const labels: string[] = [];
  node.forEach((child: any) => {
    labels.push(child.attrs.label || 'Tab');
  });

  return (
    <NodeViewWrapper className={`relative my-8 transition-all ${selected ? 'ring-2 ring-slate-200 rounded-xl p-2' : ''}`}>
      {selected && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-10 text-sm">
          <button
            onClick={addTab}
            className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-slate-100 text-slate-600"
          >
            <Plus size={14} />
            Add Tab
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button
            onClick={() => deleteNode()}
            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
            title="Delete Tab Group"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
      {/* Tab label preview bar */}
      <div className="flex gap-0 flex-wrap border-b-2 border-slate-200">
        {labels.map((label, i) => (
          <div
            key={i}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-0.5 ${
              i === 0
                ? 'text-blue-600 border-blue-500'
                : 'text-slate-500 border-transparent'
            }`}
          >
            {label}
          </div>
        ))}
      </div>
      <NodeViewContent className="border border-t-0 border-slate-200 rounded-b-lg" />
    </NodeViewWrapper>
  );
};

export const TabGroup = Node.create({
  name: 'tabGroup',
  group: 'block',
  content: 'tabPanel+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="tab-group"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tab-group' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TabGroupNodeView);
  },
});
