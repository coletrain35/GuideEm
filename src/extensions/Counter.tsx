import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const CounterNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { value, prefix, suffix, label } = node.attrs;

  return (
    <NodeViewWrapper className="group/block counter-editor-wrapper my-4 flex justify-start relative">
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div
        className={`counter-editor flex flex-col items-center text-center p-6 rounded-xl border transition-all ${
          selected ? 'border-blue-400 ring-2 ring-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
        } min-w-[160px]`}
        contentEditable={false}
      >
        {/* Big number row — all inline */}
        <div className="flex items-baseline gap-0.5 text-blue-600 leading-none mb-1 tabular-nums">
          <input
            value={prefix}
            onChange={(e) => updateAttributes({ prefix: e.target.value })}
            placeholder="$"
            className="text-xl opacity-75 bg-transparent outline-none border-b border-transparent hover:border-blue-300 focus:border-blue-500 transition-colors text-center w-8 shrink-0 placeholder:text-blue-300/60"
          />
          <input
            value={String(value)}
            onChange={(e) => updateAttributes({ value: e.target.value })}
            placeholder="0"
            className="text-4xl font-bold bg-transparent outline-none border-b border-transparent hover:border-blue-300 focus:border-blue-500 transition-colors text-center placeholder:text-blue-300/60"
            style={{ width: `${Math.max(String(value).length, 2) + 1}ch` }}
          />
          <input
            value={suffix}
            onChange={(e) => updateAttributes({ suffix: e.target.value })}
            placeholder="%"
            className="text-xl opacity-75 bg-transparent outline-none border-b border-transparent hover:border-blue-300 focus:border-blue-500 transition-colors text-center w-8 shrink-0 placeholder:text-blue-300/60"
          />
        </div>

        {/* Label */}
        <input
          value={label}
          onChange={(e) => updateAttributes({ label: e.target.value })}
          placeholder="Label"
          className="text-sm text-slate-500 font-medium mt-1 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-400 transition-colors text-center w-full placeholder:text-slate-300"
        />
      </div>
    </NodeViewWrapper>
  );
};

export const Counter = Node.create({
  name: 'counter',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      value: {
        default: 100,
        parseHTML: (el) => parseFloat(el.getAttribute('data-value') || '100'),
        renderHTML: (attrs) => ({ 'data-value': String(attrs.value) }),
      },
      prefix: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-prefix') || '',
        renderHTML: (attrs) => (attrs.prefix ? { 'data-prefix': attrs.prefix } : {}),
      },
      suffix: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-suffix') || '',
        renderHTML: (attrs) => (attrs.suffix ? { 'data-suffix': attrs.suffix } : {}),
      },
      label: {
        default: 'Label',
        parseHTML: (el) => el.getAttribute('data-label') || 'Label',
        renderHTML: (attrs) => ({ 'data-label': attrs.label }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="counter"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'counter' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CounterNodeView);
  },
});
