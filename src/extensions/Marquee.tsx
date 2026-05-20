import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, X, Paintbrush } from 'lucide-react';
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
  const trackRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const items: MarqueeItem[] = (() => { try { return JSON.parse(itemsJson); } catch { return DEFAULT_ITEMS; } })();
  const dur = SPEED_MAP[speed as keyof typeof SPEED_MAP] ?? 35;
  const animDir = direction === 'right' ? 'reverse' : 'normal';

  const setItems = (next: MarqueeItem[]) => updateAttributes({ items: JSON.stringify(next) });

  const addItem = () => setItems([...items, { text: 'New item', emoji: '✨' }]);
  const removeItem = (i: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== i));
  };
  const updateItem = (i: number, field: keyof MarqueeItem, val: string) =>
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  // Duplicate items for seamless loop
  const doubled = [...items, ...items];

  return (
    <NodeViewWrapper className="group/block relative my-8 overflow-hidden" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Floating Style/Settings Toolbar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-30 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        <div ref={styleRef} className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowStyle(!showStyle)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${showStyle ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Paintbrush size={14} /> Style
          </button>
          {showStyle && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-56 space-y-3"
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Speed</label>
                <div className="flex gap-1">
                  {['slow', 'medium', 'fast'].map(s => (
                    <button
                      key={s}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ speed: s })}
                      className={`flex-1 py-1 text-[10px] rounded border capitalize transition-all ${speed === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Direction</label>
                <div className="flex gap-1">
                  {[
                    ['left', 'Left'],
                    ['right', 'Right'],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ direction: v })}
                      className={`flex-1 py-1 text-xs rounded border transition-all ${direction === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Separator</label>
                <select
                  value={separator}
                  onChange={e => updateAttributes({ separator: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none focus:border-indigo-400"
                >
                  <option value="none">None</option>
                  <option value="dot">Dot (●)</option>
                  <option value="star">Star (✦)</option>
                  <option value="dash">Dash (—)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Accent Color</label>
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => updateAttributes({ accentColor: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer border border-slate-200"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview marquee (visible when not selected) */}
      {!selected && (
        <div ref={trackRef} className="overflow-hidden py-3 relative">
          {/* Fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, white, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, white, transparent)' }} />

          <div
            className="flex gap-6 w-max"
            style={{
              willChange: 'transform',
              animation: `marquee-scroll ${dur}s linear infinite ${animDir}`,
              animationPlayState: isVisible ? 'running' : 'paused',
            }}
          >
            {doubled.map((item, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium select-none"
                style={{ borderColor: `${accentColor}25`, backgroundColor: `${accentColor}0a`, color: '#1e293b' }}>
                {item.emoji && <span className="text-base leading-none">{item.emoji}</span>}
                <span>{item.text}</span>
                {separator !== 'none' && (
                  <span className="ml-3 opacity-30" style={{ color: accentColor }}>
                    {separator === 'dot' ? '●' : separator === 'star' ? '✦' : '—'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paused, Inline-Editable grid of pills (visible when selected) */}
      {selected && (
        <div className="border border-indigo-400 ring-2 ring-indigo-100 rounded-2xl p-4 bg-slate-50/20 flex flex-wrap gap-2.5 justify-center">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all hover:border-indigo-400 group/item bg-white"
              style={{ borderColor: `${accentColor}33` }}
            >
              <input
                value={item.emoji ?? ''}
                onChange={e => updateItem(i, 'emoji', e.target.value)}
                placeholder="✦"
                className="w-5 text-center bg-transparent outline-none border-none p-0 text-sm placeholder:text-slate-300 cursor-text shrink-0"
              />
              <input
                value={item.text}
                onChange={e => updateItem(i, 'text', e.target.value)}
                placeholder="Tagline..."
                className="bg-transparent outline-none border-none p-0 text-sm placeholder:text-slate-400 cursor-text text-slate-800 font-medium"
                style={{ width: `${Math.max(item.text.length, 1) + 1.2}ch` }}
              />
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(i)}
                  className="p-0.5 rounded-full text-slate-300 hover:text-red-500 hover:bg-slate-100 transition-colors"
                  title="Delete Item"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}

          {/* Add Item Trigger */}
          <button
            onClick={addItem}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Plus size={12} />
            <span>Add Item</span>
          </button>
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
