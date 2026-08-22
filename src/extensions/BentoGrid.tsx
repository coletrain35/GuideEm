import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { Plus, X } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

type BentoCell = {
  colSpan: 1 | 2 | 3;
  rowSpan: 1 | 2;
  title: string;
  description: string;
  icon: string;
  variant: 'default' | 'accent' | 'dark';
  accentColor: string;
};

const CELL_VARIANTS = {
  default: { bg: '#ffffff', border: '#e2e8f0', text: '#0f172a', sub: '#64748b' },
  accent:  { bg: '#6366f1', border: '#6366f1', text: '#ffffff', sub: '#e0e7ff' },
  dark:    { bg: '#0f172a', border: '#1e293b', text: '#f8fafc', sub: '#94a3b8' },
};

const DEFAULT_CELLS: BentoCell[] = [
  { colSpan: 2, rowSpan: 1, title: 'Ship faster', description: 'Build and deploy at the speed of thought with instant previews and hot reloads.', icon: '🚀', variant: 'accent', accentColor: '#6366f1' },
  { colSpan: 1, rowSpan: 2, title: 'Always on', description: '99.99% uptime SLA backed by enterprise-grade infrastructure and global redundancy.', icon: '⚡', variant: 'dark', accentColor: '#10b981' },
  { colSpan: 1, rowSpan: 1, title: 'Analytics', description: 'Real-time insights across your entire stack.', icon: '📊', variant: 'default', accentColor: '#f59e0b' },
  { colSpan: 1, rowSpan: 1, title: 'Secure', description: 'End-to-end encryption, SOC 2 Type II certified.', icon: '🔒', variant: 'default', accentColor: '#3b82f6' },
];

const BentoGridNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;

  const parsedCells: BentoCell[] = (() => {
    try { return JSON.parse(node.attrs.cells); } catch { return DEFAULT_CELLS; }
  })();

  const setCells = (cells: BentoCell[]) => updateAttributes({ cells: JSON.stringify(cells) });
  
  const addCell = () => setCells([...parsedCells, {
    colSpan: 1, rowSpan: 1, title: 'New Feature', description: 'Describe this feature.', icon: '✨', variant: 'default', accentColor: '#6366f1',
  }]);
  
  const removeCell = (i: number) => {
    if (parsedCells.length <= 1) return;
    setCells(parsedCells.filter((_, idx) => idx !== i));
  };
  
  const updateCell = (i: number, key: keyof BentoCell, value: any) =>
    setCells(parsedCells.map((c, idx) => idx === i ? { ...c, [key]: value } : c));

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      <div
        className={`p-4 rounded-2xl border transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100 bg-slate-50/20' : 'border-transparent'
        }`}
      >
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: 'auto' }}>
          {parsedCells.map((cell, i) => {
            const v = CELL_VARIANTS[cell.variant] || CELL_VARIANTS.default;
            return (
              <div
                key={i}
                className="group/card relative rounded-2xl p-6 flex flex-col justify-between overflow-hidden transition-all hover:shadow-sm"
                style={{
                  backgroundColor: v.bg,
                  border: selected ? '1px solid #c7d2fe' : `1px solid ${v.border}`,
                  gridColumn: `span ${Math.min(cell.colSpan, 3)}`,
                  gridRow: `span ${cell.rowSpan}`,
                  minHeight: cell.rowSpan === 2 ? '220px' : '140px',
                  boxShadow: cell.variant === 'default' ? '0 1px 3px rgba(0,0,0,0.05)' : '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                {/* Individual Card Control Overlay (visible on card hover if parent is selected) */}
                {selected && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-20 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-slate-200 shadow-sm text-[10px]">
                    {/* Cols span toggle */}
                    <div className="flex border-r border-slate-200 pr-1.5 mr-1.5 gap-0.5 font-bold">
                      <span className="text-slate-400 self-center px-1">Col:</span>
                      {([1, 2, 3] as const).map(c => (
                        <button
                          key={c}
                          onClick={() => updateCell(i, 'colSpan', c)}
                          className={`w-4 h-4 rounded text-center leading-none transition-colors ${
                            cell.colSpan === c ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    {/* Row span toggle */}
                    <div className="flex border-r border-slate-200 pr-1.5 mr-1.5 gap-0.5 font-bold">
                      <span className="text-slate-400 self-center px-1">Row:</span>
                      {([1, 2] as const).map(r => (
                        <button
                          key={r}
                          onClick={() => updateCell(i, 'rowSpan', r)}
                          className={`w-4 h-4 rounded text-center leading-none transition-colors ${
                            cell.rowSpan === r ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>

                    {/* Variant toggle */}
                    <div className="flex border-r border-slate-200 pr-1.5 mr-1.5 gap-0.5 font-semibold">
                      {(['default', 'accent', 'dark'] as const).map(variant => (
                        <button
                          key={variant}
                          onClick={() => updateCell(i, 'variant', variant)}
                          className={`px-1 rounded capitalize transition-colors ${
                            cell.variant === variant ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {variant}
                        </button>
                      ))}
                    </div>

                    {/* Remove Card */}
                    {parsedCells.length > 1 && (
                      <button
                        onClick={() => removeCell(i)}
                        className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
                        title="Delete Cell"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-2 flex flex-col h-full justify-between">
                  <div>
                    {/* Emoji/Icon Input */}
                    <input
                      value={cell.icon}
                      onChange={(e) => updateCell(i, 'icon', e.target.value)}
                      placeholder="🚀"
                      className="text-3xl bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none w-10 py-0.5 transition-colors shrink-0 mb-2 block"
                    />

                    {/* Title Input */}
                    <input
                      value={cell.title}
                      onChange={(e) => updateCell(i, 'title', e.target.value)}
                      placeholder="Title"
                      className="font-bold text-lg m-0 mb-1 leading-tight bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none w-full py-0.5 transition-colors"
                      style={{ color: v.text }}
                    />
                  </div>

                  {/* Description Textarea */}
                  <textarea
                    value={cell.description}
                    onChange={(e) => updateCell(i, 'description', e.target.value)}
                    placeholder="Cell description..."
                    rows={2}
                    className="text-sm m-0 leading-relaxed bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none w-full py-0.5 resize-none transition-colors"
                    style={{ color: v.sub, fieldSizing: 'content' } as any}
                  />
                </div>
              </div>
            );
          })}

          {/* Dash Add Cell Trigger Card */}
          {selected && (
            <button
              onClick={addCell}
              className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl bg-slate-50/40 hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-600 transition-all gap-1.5"
              style={{ minHeight: '140px' }}
            >
              <Plus size={24} />
              <span className="text-xs font-semibold">Add Bento Cell</span>
            </button>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const BentoGrid = Node.create({
  name: 'bentoGrid',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      cells: {
        default: JSON.stringify(DEFAULT_CELLS),
        parseHTML: (el: HTMLElement) => el.getAttribute('data-cells') || JSON.stringify(DEFAULT_CELLS),
        renderHTML: (attrs: any) => ({ 'data-cells': attrs.cells }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="bento-grid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'bento-grid' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BentoGridNodeView);
  },
});
