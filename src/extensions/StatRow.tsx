import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const STAT_ICONS = [
  '','🚀','⭐','💡','🔥','✅','📈','📉','💰','💎','🎯','⚡',
  '🌍','👥','🏆','🔒','📦','🛠️','❤️','🎉','📊','⏱️','🌟','💬',
  '🤝','📱','🔗','🧪','🌈','🎨','📝','🔔',
];

interface StatItem {
  value: string;
  prefix: string;
  suffix: string;
  label: string;
  icon: string;
}

const DEFAULT_STATS: StatItem[] = [
  { value: '100', prefix: '', suffix: '+', label: 'Label', icon: '' },
  { value: '50', prefix: '', suffix: 'k', label: 'Users', icon: '' },
  { value: '99', prefix: '', suffix: '%', label: 'Uptime', icon: '' },
];

const StatRowNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode } = props;
  const [openIconPicker, setOpenIconPicker] = useState<number | null>(null);

  let stats: StatItem[] = DEFAULT_STATS;
  try {
    const parsed = JSON.parse(node.attrs.stats);
    if (Array.isArray(parsed)) stats = parsed;
  } catch {
    // keep default
  }

  const updateStat = (index: number, field: keyof StatItem, value: string) => {
    const next = stats.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    updateAttributes({ stats: JSON.stringify(next) });
  };

  const addStat = () => {
    const next = [...stats, { value: '0', prefix: '', suffix: '', label: 'New Stat', icon: '' }];
    updateAttributes({ stats: JSON.stringify(next) });
  };

  const removeStat = (index: number) => {
    const next = stats.filter((_, i) => i !== index);
    updateAttributes({ stats: JSON.stringify(next) });
  };

  return (
    <NodeViewWrapper className="group/block stat-row-editor-wrapper my-6 relative">
      <BlockDeleteButton deleteNode={deleteNode} />
      <div
        className={`rounded-xl border transition-all ${
          selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200'
        }`}
        contentEditable={false}
      >
        {/* Preview row */}
        <div className="flex flex-wrap gap-4 justify-center p-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 border border-slate-200 rounded-xl bg-white min-w-[100px] sm:min-w-[140px] flex-1"
            >
              {stat.icon && <div className="text-2xl mb-2">{stat.icon}</div>}
              <div className="text-4xl font-bold text-blue-600 leading-none mb-1.5 tabular-nums">
                {stat.prefix && <span className="text-2xl opacity-75">{stat.prefix}</span>}
                <span>{stat.value}</span>
                {stat.suffix && <span className="text-2xl opacity-75">{stat.suffix}</span>}
              </div>
              <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Edit panel */}
        {selected && (
          <div className="border-t border-blue-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Edit Stats</p>
            {stats.map((stat, i) => (
              <div key={i} className="flex gap-2 items-end p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="relative">
                  <label className="text-xs font-medium text-slate-500 block mb-0.5">Icon</label>
                  <button
                    onClick={() => setOpenIconPicker(openIconPicker === i ? null : i)}
                    className="w-10 h-[30px] text-lg border rounded border-slate-200 hover:border-blue-400 bg-white flex items-center justify-center"
                    title="Pick icon"
                  >
                    {stat.icon || <span className="text-slate-300 text-xs">+</span>}
                  </button>
                  {openIconPicker === i && (
                    <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-2 grid grid-cols-8 gap-0.5" style={{ minWidth: '200px' }}>
                      {STAT_ICONS.map((emoji, ei) => (
                        <button
                          key={ei}
                          onClick={() => { updateStat(i, 'icon', emoji); setOpenIconPicker(null); }}
                          className={`w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-base ${stat.icon === emoji ? 'bg-blue-50 ring-1 ring-blue-400' : ''}`}
                          title={emoji || 'None'}
                        >
                          {emoji || <span className="text-slate-300 text-xs">∅</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-12">
                  <label className="text-xs font-medium text-slate-500 block mb-0.5">Prefix</label>
                  <input
                    value={stat.prefix}
                    onChange={(e) => updateStat(i, 'prefix', e.target.value)}
                    placeholder="$"
                    className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-500 block mb-0.5">Value</label>
                  <input
                    value={stat.value}
                    onChange={(e) => updateStat(i, 'value', e.target.value)}
                    placeholder="100"
                    className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="w-12">
                  <label className="text-xs font-medium text-slate-500 block mb-0.5">Suffix</label>
                  <input
                    value={stat.suffix}
                    onChange={(e) => updateStat(i, 'suffix', e.target.value)}
                    placeholder="+"
                    className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-500 block mb-0.5">Label</label>
                  <input
                    value={stat.label}
                    onChange={(e) => updateStat(i, 'label', e.target.value)}
                    placeholder="Label"
                    className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                  />
                </div>
                <button
                  onClick={() => removeStat(i)}
                  className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded border border-red-200 shrink-0"
                  title="Remove stat"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addStat}
              className="w-full py-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              + Add Stat
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const StatRow = Node.create({
  name: 'statRow',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      stats: {
        default: JSON.stringify(DEFAULT_STATS),
        parseHTML: (el) => {
          const raw = el.getAttribute('data-stats');
          if (!raw) return JSON.stringify(DEFAULT_STATS);
          try {
            JSON.parse(raw);
            return raw;
          } catch {
            return JSON.stringify(DEFAULT_STATS);
          }
        },
        renderHTML: (attrs) => ({ 'data-stats': attrs.stats }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="stat-row"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'stat-row' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(StatRowNodeView);
  },
});
