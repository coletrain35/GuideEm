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
  const removeCell = (i: number) => setCells(parsedCells.filter((_, idx) => idx !== i));
  const updateCell = (i: number, key: keyof BentoCell, value: any) =>
    setCells(parsedCells.map((c, idx) => idx === i ? { ...c, [key]: value } : c));

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: 'auto' }}>
        {parsedCells.map((cell, i) => {
          const v = CELL_VARIANTS[cell.variant] || CELL_VARIANTS.default;
          return (
            <div
              key={i}
              className="rounded-2xl p-6 flex flex-col justify-between overflow-hidden transition-shadow"
              style={{
                backgroundColor: v.bg,
                border: `1px solid ${v.border}`,
                gridColumn: `span ${Math.min(cell.colSpan, 3)}`,
                gridRow: `span ${cell.rowSpan}`,
                minHeight: cell.rowSpan === 2 ? '220px' : '130px',
                boxShadow: cell.variant === 'default' ? '0 1px 3px rgba(0,0,0,0.06)' : '0 4px 20px rgba(0,0,0,0.15)',
              }}
            >
              <div>
                {cell.icon && <div style={{ fontSize: '2.25rem', lineHeight: 1, marginBottom: '0.875rem' }}>{cell.icon}</div>}
                <h3 className="font-bold text-lg m-0 mb-1.5 leading-tight" style={{ color: v.text }}>{cell.title}</h3>
                <p className="text-sm m-0 leading-relaxed" style={{ color: v.sub }}>{cell.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Cells ({parsedCells.length})</span>
            <button
              onClick={addCell}
              className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={12} /> Add Cell
            </button>
          </div>
          {parsedCells.map((cell, i) => (
            <div key={i} className="border border-slate-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className="w-9 px-1 py-0.5 text-lg text-center border border-slate-200 rounded focus:outline-none"
                  value={cell.icon}
                  onChange={(e) => updateCell(i, 'icon', e.target.value)}
                  placeholder="✨"
                />
                <input
                  className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={cell.title}
                  onChange={(e) => updateCell(i, 'title', e.target.value)}
                  placeholder="Title"
                />
                <button onClick={() => removeCell(i)} className="text-slate-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
              <textarea
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none resize-none"
                rows={2}
                value={cell.description}
                onChange={(e) => updateCell(i, 'description', e.target.value)}
                placeholder="Description"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Col:</span>
                  {([1, 2, 3] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => updateCell(i, 'colSpan', n)}
                      className={`w-6 h-6 rounded text-xs font-medium ${cell.colSpan === n ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Row:</span>
                  {([1, 2] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => updateCell(i, 'rowSpan', n)}
                      className={`w-6 h-6 rounded text-xs font-medium ${cell.rowSpan === n ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Style:</span>
                  {(['default', 'accent', 'dark'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => updateCell(i, 'variant', v)}
                      className={`px-2 py-0.5 rounded text-xs ${cell.variant === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
