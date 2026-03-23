import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { Plus, X } from 'lucide-react';
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
  {
    version: 'v1.0.0',
    date: '2024-01-01',
    items: [
      { type: 'added', text: 'Initial release' },
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
    { version: 'v0.0.0', date: new Date().toISOString().split('T')[0], items: [{ type: 'added', text: 'New feature' }] },
    ...parsedEntries,
  ]);
  const removeVersion = (i: number) => setEntries(parsedEntries.filter((_, idx) => idx !== i));
  const updateVersion = (i: number, key: keyof VersionEntry, value: any) =>
    setEntries(parsedEntries.map((e, idx) => idx === i ? { ...e, [key]: value } : e));
  const addItem = (vi: number) =>
    setEntries(parsedEntries.map((e, i) => i === vi ? { ...e, items: [...e.items, { type: 'added' as EntryType, text: 'New item' }] } : e));
  const removeItem = (vi: number, ii: number) =>
    setEntries(parsedEntries.map((e, i) => i === vi ? { ...e, items: e.items.filter((_, idx) => idx !== ii) } : e));
  const updateItem = (vi: number, ii: number, key: keyof ChangeItem, value: string) =>
    setEntries(parsedEntries.map((e, i) => i === vi ? { ...e, items: e.items.map((item, idx) => idx === ii ? { ...item, [key]: value } : item) } : e));

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Timeline display */}
      <div className="relative pl-8">
        <div className="absolute left-3 top-2 bottom-2 w-0.5 rounded-full" style={{ backgroundColor: '#e2e8f0' }} />

        {parsedEntries.map((entry, ei) => (
          <div key={ei} className="relative mb-8 last:mb-0">
            {/* Timeline dot */}
            <div className="absolute -left-5 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-slate-300" />

            {/* Version header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold font-mono text-white bg-slate-800">
                {entry.version}
              </span>
              {entry.date && (
                <span className="text-sm text-slate-400">{entry.date}</span>
              )}
            </div>

            {/* Items grouped by type */}
            {(Object.keys(ENTRY_TYPES) as EntryType[]).map((type) => {
              const items = entry.items.filter((it) => it.type === type);
              if (items.length === 0) return null;
              const { label, color, bg } = ENTRY_TYPES[type];
              return (
                <div key={type} className="mb-2.5">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold mb-1.5"
                    style={{ backgroundColor: bg, color }}
                  >
                    {label}
                  </span>
                  <ul className="space-y-1 m-0 p-0">
                    {items.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}

        {parsedEntries.length === 0 && (
          <div className="text-slate-400 text-sm text-center py-8">No entries yet. Select to add versions.</div>
        )}
      </div>

      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Changelog Entries</span>
            <button
              onClick={addVersion}
              className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={12} /> Add Version
            </button>
          </div>
          {parsedEntries.map((entry, vi) => (
            <div key={vi} className="border border-slate-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className="w-24 px-2 py-1 text-xs font-mono border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={entry.version}
                  onChange={(e) => updateVersion(vi, 'version', e.target.value)}
                  placeholder="v1.0.0"
                />
                <input
                  className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={entry.date}
                  onChange={(e) => updateVersion(vi, 'date', e.target.value)}
                  placeholder="2024-01-15"
                />
                <button onClick={() => removeVersion(vi)} className="text-slate-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
              {entry.items.map((item, ii) => (
                <div key={ii} className="flex items-center gap-1.5">
                  <select
                    className="text-xs border border-slate-200 rounded px-1 py-0.5 focus:outline-none"
                    value={item.type}
                    onChange={(e) => updateItem(vi, ii, 'type', e.target.value)}
                  >
                    {Object.entries(ENTRY_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <input
                    className="flex-1 px-2 py-0.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={item.text}
                    onChange={(e) => updateItem(vi, ii, 'text', e.target.value)}
                  />
                  <button onClick={() => removeItem(vi, ii)} className="text-slate-400 hover:text-red-500">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addItem(vi)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Plus size={10} /> Add item
              </button>
            </div>
          ))}
        </div>
      )}
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
