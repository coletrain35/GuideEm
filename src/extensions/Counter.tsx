import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';

const CounterNodeView = (props: any) => {
  const { node, updateAttributes, selected } = props;
  const { value, prefix, suffix, label } = node.attrs;

  return (
    <NodeViewWrapper className="counter-editor-wrapper my-4 flex justify-start">
      <div
        className={`counter-editor flex flex-col items-center text-center p-6 rounded-xl border transition-all ${
          selected ? 'border-blue-400 ring-2 ring-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
        } min-w-[160px]`}
        contentEditable={false}
      >
        <div className="text-4xl font-bold text-blue-600 leading-none mb-1 tabular-nums">
          {prefix && <span className="text-xl opacity-75">{prefix}</span>}
          <span>{Number(value).toLocaleString()}</span>
          {suffix && <span className="text-xl opacity-75">{suffix}</span>}
        </div>
        <div className="text-sm text-slate-500 font-medium mt-1">{label || 'Label'}</div>

        {selected && (
          <div className="mt-4 w-full space-y-2 text-left border-t border-blue-200 pt-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Value</label>
              <input
                type="number"
                value={value}
                onChange={(e) => updateAttributes({ value: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Prefix</label>
                <input
                  value={prefix}
                  onChange={(e) => updateAttributes({ prefix: e.target.value })}
                  placeholder="$"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Suffix</label>
                <input
                  value={suffix}
                  onChange={(e) => updateAttributes({ suffix: e.target.value })}
                  placeholder="%"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Label</label>
              <input
                value={label}
                onChange={(e) => updateAttributes({ label: e.target.value })}
                placeholder="Happy Customers"
                className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
              />
            </div>
          </div>
        )}
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
