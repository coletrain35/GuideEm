import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef } from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

interface MarqueeItem {
  text: string;
  emoji?: string;
}

const DEFAULT_ITEMS: MarqueeItem[] = [
  { text: 'Fast delivery', emoji: '⚡' },
  { text: 'World-class design', emoji: '✦' },
  { text: 'Open source', emoji: '🚀' },
  { text: 'Trusted by thousands', emoji: '❤️' },
  { text: 'Ship faster', emoji: '🎯' },
  { text: 'Built for developers', emoji: '🛠️' },
];

const SPEED_MAP = { slow: 60, medium: 35, fast: 18 };

const MarqueeNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { items: itemsJson, speed, direction, separator, accentColor } = node.attrs;
  const editingRef = useRef<HTMLInputElement>(null);

  const items: MarqueeItem[] = (() => { try { return JSON.parse(itemsJson); } catch { return DEFAULT_ITEMS; } })();
  const dur = SPEED_MAP[speed as keyof typeof SPEED_MAP] ?? 35;
  const animDir = direction === 'right' ? 'reverse' : 'normal';

  const setItems = (next: MarqueeItem[]) => updateAttributes({ items: JSON.stringify(next) });

  const addItem = () => setItems([...items, { text: 'New item', emoji: '✦' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof MarqueeItem, val: string) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  // Duplicate items for seamless loop
  const doubled = [...items, ...items];

  return (
    <NodeViewWrapper className="group/block relative my-8 overflow-hidden" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Marquee track */}
      <div className="overflow-hidden py-3 relative">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, white, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, white, transparent)' }} />

        <div
          className="flex gap-6 w-max"
          style={{
            animation: `marquee-scroll ${dur}s linear infinite ${animDir}`,
          }}
        >
          {doubled.map((item, i) => (
            <div key={i} className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium select-none"
              style={{ borderColor: `${accentColor}33`, backgroundColor: `${accentColor}0d`, color: '#1e293b' }}>
              {item.emoji && <span className="text-base leading-none">{item.emoji}</span>}
              <span>{item.text}</span>
              {i < items.length && separator !== 'none' && (
                <span className="ml-2 opacity-40" style={{ color: accentColor }}>
                  {separator === 'dot' ? '●' : separator === 'star' ? '✦' : '—'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Editor panel */}
      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Marquee Settings</p>
            <button onClick={addItem}
              className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium transition-colors">
              + Add Item
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Speed</label>
              <select value={speed} onChange={e => updateAttributes({ speed: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Direction</label>
              <select value={direction} onChange={e => updateAttributes({ direction: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Separator</label>
              <select value={separator} onChange={e => updateAttributes({ separator: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value="none">None</option>
                <option value="dot">Dot</option>
                <option value="star">Star</option>
                <option value="dash">Dash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Accent</label>
              <input type="color" value={accentColor} onChange={e => updateAttributes({ accentColor: e.target.value })}
                className="h-8 w-12 rounded cursor-pointer border border-slate-200" />
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={item.emoji ?? ''} onChange={e => updateItem(i, 'emoji', e.target.value)}
                  placeholder="emoji" className="w-12 text-center text-sm border border-slate-200 rounded-lg px-2 py-1 text-slate-700" />
                <input value={item.text} onChange={e => updateItem(i, 'text', e.target.value)}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1 text-slate-700" ref={i === items.length - 1 ? editingRef : undefined} />
                <button onClick={() => removeItem(i)}
                  className="text-slate-400 hover:text-red-400 transition-colors text-xs px-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </NodeViewWrapper>
  );
};

export const Marquee = Node.create({
  name: 'marquee',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: JSON.stringify(DEFAULT_ITEMS),
        parseHTML: el => el.getAttribute('data-items') || JSON.stringify(DEFAULT_ITEMS),
        renderHTML: attrs => ({ 'data-items': attrs.items }),
      },
      speed: {
        default: 'medium',
        parseHTML: el => el.getAttribute('data-speed') || 'medium',
        renderHTML: attrs => ({ 'data-speed': attrs.speed }),
      },
      direction: {
        default: 'left',
        parseHTML: el => el.getAttribute('data-direction') || 'left',
        renderHTML: attrs => ({ 'data-direction': attrs.direction }),
      },
      separator: {
        default: 'star',
        parseHTML: el => el.getAttribute('data-separator') || 'star',
        renderHTML: attrs => ({ 'data-separator': attrs.separator }),
      },
      accentColor: {
        default: '#6366f1',
        parseHTML: el => el.getAttribute('data-accent-color') || '#6366f1',
        renderHTML: attrs => ({ 'data-accent-color': attrs.accentColor }),
      },
    };
  },

  parseHTML() { return [{ tag: 'div[data-type="marquee"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'marquee' })];
  },
  addNodeView() { return ReactNodeViewRenderer(MarqueeNodeView); },
});
