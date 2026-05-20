import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Plus, X, Paintbrush } from 'lucide-react';
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
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const items: TechItem[] = (() => {
    try { return JSON.parse(node.attrs.items); } catch { return DEFAULT_ITEMS; }
  })();

  const updateItems = (next: TechItem[]) => updateAttributes({ items: JSON.stringify(next) });
  const updateItem = (idx: number, patch: Partial<TechItem>) =>
    updateItems(items.map((item, i) => (i === idx ? { ...item, ...patch } : item)));

  const addItem = () => updateItems([...items, { icon: '🔧', label: 'Tool' }]);
  
  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    updateItems(items.filter((_, i) => i !== idx));
  };

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Floating Style/Settings Toolbar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-30 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        <div ref={styleRef} className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowStyle(!showStyle)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${showStyle ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Paintbrush size={14} /> Style Layout
          </button>
          {showStyle && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-52 space-y-3"
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Columns</label>
                <div className="flex gap-1 flex-wrap">
                  {[3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ cols: n })}
                      className={`flex-1 min-w-[20px] py-1 text-xs rounded border transition-colors ${
                        cols === n
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer border border-slate-200 shrink-0"
                    value={accentColor || '#6366f1'}
                    onChange={(e) => updateAttributes({ accentColor: e.target.value })}
                  />
                  <span className="text-xs text-slate-500 font-mono">{accentColor}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`p-4 rounded-2xl border transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100 bg-slate-50/20' : 'border-transparent bg-transparent'
        }`}
      >
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className={`group/card relative flex flex-col items-center gap-1.5 py-4 px-2.5 rounded-xl border text-center transition-all ${
                selected ? 'bg-white shadow-sm border-slate-200 hover:border-indigo-300' : ''
              }`}
              style={{
                borderColor: selected ? undefined : `${accentColor}30`,
                background: selected ? undefined : `${accentColor}08`
              }}
            >
              {/* Individual Card Delete trigger */}
              {selected && items.length > 1 && (
                <button
                  onClick={() => removeItem(i)}
                  className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 transition-opacity opacity-0 group-hover/card:opacity-100"
                  title="Delete Tech"
                >
                  <X size={10} />
                </button>
              )}

              {/* Emoji Icon Input */}
              <input
                value={item.icon}
                onChange={e => updateItem(i, { icon: e.target.value })}
                placeholder="⚛️"
                className="w-10 text-center text-2xl bg-transparent border-none outline-none p-0 text-slate-800 cursor-text shrink-0"
              />

              {/* Label Name Input */}
              <input
                value={item.label}
                onChange={e => updateItem(i, { label: e.target.value })}
                placeholder="Tool name"
                className="text-xs font-semibold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-350 focus:border-indigo-500 outline-none w-full text-center py-0.5 transition-colors"
              />
            </div>
          ))}

          {/* Dash Add Item Card Trigger */}
          {selected && (
            <button
              onClick={addItem}
              className="flex flex-col items-center justify-center py-4 px-2.5 border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl bg-slate-50/50 hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-600 transition-all gap-1"
              style={{ minHeight: '84px' }}
            >
              <Plus size={18} />
              <span className="text-[10px] font-bold">Add Tech</span>
            </button>
          )}
        </div>
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
