import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
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
  { value: '50', prefix: '', suffix: 'k', label: 'Users', icon: '🚀' },
  { value: '99', prefix: '', suffix: '%', label: 'Uptime', icon: '⚡' },
];

const StatRowNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
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
    const next = [...stats, { value: '10', prefix: '', suffix: '', label: 'New Stat', icon: '💡' }];
    updateAttributes({ stats: JSON.stringify(next) });
  };

  const removeStat = (index: number) => {
    if (stats.length <= 1) return; // Keep at least one
    const next = stats.filter((_, i) => i !== index);
    updateAttributes({ stats: JSON.stringify(next) });
  };

  return (
    <NodeViewWrapper className="group/block stat-row-editor-wrapper my-6 relative">
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      
      <div
        className={`rounded-2xl border transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100 bg-slate-50/20' : 'border-slate-200 bg-transparent'
        }`}
        contentEditable={false}
      >
        {/* Inline Grid Row */}
        <div className="flex flex-wrap gap-4 justify-center p-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`group/card relative flex flex-col items-center text-center p-6 border rounded-xl bg-white min-w-[140px] flex-1 transition-all ${
                selected ? 'border-slate-200 hover:border-indigo-300 hover:shadow-sm' : 'border-slate-200'
              }`}
            >
              {/* Individual Card Delete Button */}
              {selected && stats.length > 1 && (
                <button
                  onClick={() => removeStat(i)}
                  className="absolute top-2 right-2 p-0.5 rounded-full bg-slate-50 text-slate-400 hover:text-red-500 border border-slate-100 opacity-0 group-hover/card:opacity-100 transition-opacity"
                  title="Delete Stat"
                >
                  <X size={12} />
                </button>
              )}

              {/* Icon Picker Block */}
              <div className="relative mb-2 shrink-0">
                <button
                  onClick={() => setOpenIconPicker(openIconPicker === i ? null : i)}
                  className="w-10 h-10 text-2xl flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                  title="Change icon"
                >
                  {stat.icon || <span className="text-slate-300 text-sm">💡</span>}
                </button>
                {openIconPicker === i && (
                  <div
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-2 grid grid-cols-6 gap-0.5"
                    style={{ minWidth: '180px' }}
                  >
                    {STAT_ICONS.map((emoji, ei) => (
                      <button
                        key={ei}
                        onClick={() => {
                          updateStat(i, 'icon', emoji);
                          setOpenIconPicker(null);
                        }}
                        className={`w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-lg transition-colors ${
                          stat.icon === emoji ? 'bg-indigo-50 ring-1 ring-indigo-400' : ''
                        }`}
                        title={emoji || 'None'}
                      >
                        {emoji || <span className="text-slate-300 text-xs">∅</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stat Value Row */}
              <div className="flex items-baseline gap-0.5 text-3xl font-extrabold text-indigo-600 leading-none mb-1.5 justify-center">
                <input
                  value={stat.prefix}
                  onChange={(e) => updateStat(i, 'prefix', e.target.value)}
                  placeholder=""
                  className="text-lg opacity-75 bg-transparent outline-none border-b border-transparent hover:border-indigo-300 focus:border-indigo-500 text-center w-5 shrink-0 transition-colors"
                />
                <input
                  value={stat.value}
                  onChange={(e) => updateStat(i, 'value', e.target.value)}
                  placeholder="0"
                  className="font-extrabold bg-transparent outline-none border-b border-transparent hover:border-indigo-300 focus:border-indigo-500 text-center"
                  style={{ width: `${Math.max(stat.value.length, 1) + 1.2}ch` }}
                />
                <input
                  value={stat.suffix}
                  onChange={(e) => updateStat(i, 'suffix', e.target.value)}
                  placeholder=""
                  className="text-lg opacity-75 bg-transparent outline-none border-b border-transparent hover:border-indigo-300 focus:border-indigo-500 text-center w-5 shrink-0 transition-colors"
                />
              </div>

              {/* Label */}
              <input
                value={stat.label}
                onChange={(e) => updateStat(i, 'label', e.target.value)}
                placeholder="Stat Label"
                className="text-xs text-slate-500 font-semibold bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-indigo-500 text-center w-full transition-colors"
              />
            </div>
          ))}

          {/* Inline Add Card */}
          {selected && (
            <button
              onClick={addStat}
              className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl bg-slate-50/50 hover:bg-indigo-50/30 min-w-[140px] flex-1 text-slate-400 hover:text-indigo-600 transition-all gap-1.5"
            >
              <Plus size={24} />
              <span className="text-xs font-semibold">Add Stat</span>
            </button>
          )}
        </div>
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
