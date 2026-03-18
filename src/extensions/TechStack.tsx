import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

interface TechItem {
  icon: string;
  label: string;
}

const DEFAULT_ITEMS: TechItem[] = [
  { icon: '⚛️', label: 'React' },
  { icon: '🟦', label: 'TypeScript' },
  { icon: '🟩', label: 'Node.js' },
  { icon: '🐍', label: 'Python' },
];

const TechStackNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { accentColor, cols } = node.attrs;

  const items: TechItem[] = (() => {
    try { return JSON.parse(node.attrs.items); } catch { return DEFAULT_ITEMS; }
  })();

  const updateItems = (next: TechItem[]) => updateAttributes({ items: JSON.stringify(next) });
  const updateItem = (idx: number, patch: Partial<TechItem>) =>
    updateItems(items.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

  const addItem = () => updateItems([...items, { icon: '🔧', label: 'Tool' }]);
  const removeItem = (idx: number) => updateItems(items.filter((_, i) => i !== idx));

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div
        className={`rounded-2xl border-2 bg-white shadow-sm transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
        }`}
      >
        {/* Preview Grid */}
        <div className="p-5">
          {items.length === 0 ? (
            <div className="py-10 text-center text-slate-300 text-sm">
              No items yet — add some below
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl border text-center"
                  style={{ borderColor: `${accentColor}30`, background: `${accentColor}08` }}
                >
                  <span className="text-2xl leading-none">{item.icon}</span>
                  <span className="text-xs font-semibold text-slate-700 leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Panel */}
        {selected && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-600">Tech Stack</span>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs text-slate-400 mr-1">Columns:</span>
                {[3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateAttributes({ cols: n })}
                    className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                      cols === n
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'border-slate-200 text-slate-600 bg-white hover:border-indigo-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => updateAttributes({ accentColor: e.target.value })}
                  title="Accent color"
                  className="w-7 h-7 cursor-pointer rounded border border-slate-200 p-0.5 ml-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-2 py-1.5"
                >
                  <input
                    value={item.icon}
                    onChange={(e) => updateItem(idx, { icon: e.target.value })}
                    placeholder="🔧"
                    className="w-14 text-center text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white py-0.5"
                  />
                  <input
                    value={item.label}
                    onChange={(e) => updateItem(idx, { label: e.target.value })}
                    placeholder="Tool name"
                    className="flex-1 px-2 py-0.5 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addItem}
              className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors w-full justify-center font-medium border border-dashed border-indigo-200"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const TechStack = Node.create({
  name: 'techStack',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      items: {
        default: JSON.stringify(DEFAULT_ITEMS),
        parseHTML: (el) => el.getAttribute('data-items') || JSON.stringify(DEFAULT_ITEMS),
        renderHTML: (attrs) => ({ 'data-items': attrs.items }),
      },
      cols: {
        default: 4,
        parseHTML: (el) => parseInt(el.getAttribute('data-cols') || '4', 10),
        renderHTML: (attrs) => ({ 'data-cols': attrs.cols }),
      },
      accentColor: {
        default: '#6366f1',
        parseHTML: (el) => el.getAttribute('data-accent-color') || '#6366f1',
        renderHTML: (attrs) => ({ 'data-accent-color': attrs.accentColor }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="tech-stack"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'tech-stack' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TechStackNodeView);
  },
});
