import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const ENTRY_TYPES = {
  added:   { label: 'Added',   color: '#10b981', bg: '#d1fae5' },
  fixed:   { label: 'Fixed',   color: '#3b82f6', bg: '#dbeafe' },
  changed: { label: 'Changed', color: '#f59e0b', bg: '#fef3c7' },
  removed: { label: 'Removed', color: '#ef4444', bg: '#fee2e2' },
};

type EntryType = keyof typeof ENTRY_TYPES;
type ChangeItem = { type: EntryType; text: string };
type VersionEntry = { version: string; date: string; items: ChangeItem[] };

const DEFAULT_ENTRIES: VersionEntry[] = [
  {
    version: 'v1.2.0',
    date: '2024-03-15',
    items: [
      { type: 'added', text: 'Dark mode support across the entire app' },
      { type: 'added', text: 'Keyboard shortcuts overlay (Ctrl+/)' },
      { type: 'fixed', text: 'Fixed scroll position on page reload' },
    ],
  },
  {
    version: 'v1.1.0',
    date: '2024-02-01',
    items: [
      { type: 'added', text: 'Export to PDF' },
      { type: 'changed', text: 'Improved performance for large documents' },
      { type: 'fixed', text: 'Fixed copy-paste formatting issues' },
    ],
  },
];

const ChangelogTimelineNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;

  const parsedEntries: VersionEntry[] = (() => {
    try { return JSON.parse(node.attrs.entries); } catch { return DEFAULT_ENTRIES; }
  })();

  const setEntries = (entries: VersionEntry[]) => updateAttributes({ entries: JSON.stringify(entries) });

  const addVersion = () => setEntries([
    { version: 'v1.0.0', date: new Date().toISOString().split('T')[0], items: [{ type: 'added' as EntryType, text: 'New feature release' }] },
    ...parsedEntries,
  ]);
  
  const removeVersion = (i: number) => {
    if (parsedEntries.length <= 1) return;
    setEntries(parsedEntries.filter((_, idx) => idx !== i));
  };

  const updateVersion = (i: number, key: keyof VersionEntry, value: any) =>
    setEntries(parsedEntries.map((e, idx) => idx === i ? { ...e, [key]: value } : e));
  
  const addItem = (vi: number) =>
    setEntries(parsedEntries.map((e, i) => i === vi ? { ...e, items: [...e.items, { type: 'added' as EntryType, text: 'New changelog item' }] } : e));
  
  const removeItem = (vi: number, ii: number) =>
    setEntries(parsedEntries.map((e, i) => i === vi ? { ...e, items: e.items.filter((_, idx) => idx !== ii) } : e));
  
  const updateItem = (vi: number, ii: number, key: keyof ChangeItem, value: string) =>
    setEntries(parsedEntries.map((e, i) => i === vi ? { ...e, items: e.items.map((item, idx) => idx === ii ? { ...item, [key]: value } : item) } : e));

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      <div
        className={`p-6 rounded-2xl border transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100 bg-slate-50/20' : 'border-transparent bg-transparent'
        }`}
      >
        {/* Timeline Header actions when selected */}
        {selected && (
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-indigo-150">
            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Changelog Editor</h4>
            <button
              onClick={addVersion}
              className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors"
            >
              <Plus size={13} /> Add Version
            </button>
          </div>
        )}

        {/* Timeline Line & Items */}
        <div className="relative pl-8">
          {/* Vertical timeline bar */}
          <div className="absolute left-3.5 top-2 bottom-2 w-0.5 rounded-full bg-slate-200" />

          {parsedEntries.map((entry, vi) => (
            <div key={vi} className="group/version relative mb-10 last:mb-0">
              {/* Timeline marker node */}
              <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow-sm" />

              {/* Version Block Header */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                {/* Version badge tag input */}
                <input
                  value={entry.version}
                  onChange={(e) => updateVersion(vi, 'version', e.target.value)}
                  placeholder="v1.0.0"
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-800 text-white border-b border-transparent hover:border-slate-500 focus:border-indigo-400 outline-none w-20 transition-all shrink-0"
                />

                {/* Date input */}
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar size={12} />
                  <input
                    value={entry.date}
                    onChange={(e) => updateVersion(vi, 'date', e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none w-24 text-xs transition-colors"
                  />
                </div>

                {/* Delete version block (visible on hover when selected) */}
                {selected && parsedEntries.length > 1 && (
                  <button
                    onClick={() => removeVersion(vi)}
                    className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors ml-auto opacity-0 group-hover/version:opacity-100"
                    title="Remove Version"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Items editing block (visible when selected) */}
              {selected && (
                <div className="space-y-2 bg-white/70 border border-slate-200 rounded-xl p-3 shadow-sm mb-4">
                  {entry.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-2">
                      {/* Type Dropdown select */}
                      <select
                        value={item.type}
                        onChange={(e) => updateItem(vi, ii, 'type', e.target.value as EntryType)}
                        className="text-xs border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-semibold bg-white"
                        style={{
                          color: ENTRY_TYPES[item.type]?.color,
                          backgroundColor: ENTRY_TYPES[item.type]?.bg,
                        }}
                      >
                        {Object.entries(ENTRY_TYPES).map(([k, v]) => (
                          <option key={k} value={k} style={{ color: v.color, backgroundColor: '#fff' }}>
                            {v.label}
                          </option>
                        ))}
                      </select>

                      {/* Item description input */}
                      <input
                        value={item.text}
                        onChange={(e) => updateItem(vi, ii, 'text', e.target.value)}
                        placeholder="Feature detail..."
                        className="flex-1 px-2 py-0.5 text-xs border border-slate-200 rounded hover:border-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-transparent transition-colors"
                      />

                      {/* Remove item bullet */}
                      {entry.items.length > 1 && (
                        <button
                          onClick={() => removeItem(vi, ii)}
                          className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove item"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => addItem(vi)}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors mt-2"
                  >
                    <Plus size={12} /> Add Item
                  </button>
                </div>
              )}

              {/* Grouped layout (visible when not selected) */}
              {!selected && (
                <div className="space-y-3 pl-2">
                  {(Object.keys(ENTRY_TYPES) as EntryType[]).map((type) => {
                    const items = entry.items.filter((it) => it.type === type);
                    if (items.length === 0) return null;
                    const { label, color, bg } = ENTRY_TYPES[type];
                    return (
                      <div key={type} className="mb-2">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-1"
                          style={{ backgroundColor: bg, color }}
                        >
                          {label}
                        </span>
                        <ul className="space-y-1.5 m-0 p-0 pl-1 list-none">
                          {items.map((item, ii) => (
                            <li key={ii} className="flex items-start gap-2 text-sm text-slate-600">
                              <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              <span>{item.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {parsedEntries.length === 0 && (
            <div className="text-slate-400 text-sm text-center py-6">No changelog entries yet. Select to edit.</div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const ChangelogTimeline = Node.create({
  name: 'changelogTimeline',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      entries: {
        default: JSON.stringify(DEFAULT_ENTRIES),
        parseHTML: (el: HTMLElement) => el.getAttribute('data-entries') || JSON.stringify(DEFAULT_ENTRIES),
        renderHTML: (attrs: any) => ({ 'data-entries': attrs.entries }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="changelog-timeline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'changelog-timeline' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChangelogTimelineNodeView);
  },
});
