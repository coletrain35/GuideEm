import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Plus, X, Paintbrush } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

interface GlowCard {
  emoji: string;
  title: string;
  description: string;
  glowColor: string;
}

const DEFAULT_CARDS: GlowCard[] = [
  { emoji: '⚡', title: 'Lightning Fast', description: 'Optimized for performance with sub-millisecond response times.', glowColor: '#facc15' },
  { emoji: '🔒', title: 'Secure by Default', description: 'Enterprise-grade security built into every layer of the stack.', glowColor: '#6366f1' },
  { emoji: '🚀', title: 'Ship Faster', description: 'From idea to production in minutes, not months.', glowColor: '#f43f5e' },
];

const GlowCardItem = ({
  card,
  cardBg,
  textColor,
  selected,
  onUpdate,
  onRemove,
}: {
  card: GlowCard;
  cardBg: string;
  textColor: string;
  selected: boolean;
  onUpdate: (field: keyof GlowCard, val: string) => void;
  onRemove: () => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
  };

  const bgStyle =
    cardBg === 'dark'
      ? '#0f172a'
      : cardBg === 'glass'
      ? 'rgba(255,255,255,0.75)'
      : '#ffffff';
  const borderStyle =
    cardBg === 'dark'
      ? '1px solid rgba(255,255,255,0.08)'
      : '1px solid rgba(0,0,0,0.08)';
  const headColor = textColor === 'dark' ? '#f1f5f9' : '#0f172a';
  const bodyColor = textColor === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="relative rounded-2xl p-6 overflow-hidden cursor-default group/card transition-all duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: bgStyle,
        border: borderStyle,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        backdropFilter: cardBg === 'glass' ? 'blur(16px)' : undefined,
      }}
    >
      {/* Glow spotlight overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(300px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${card.glowColor}18, transparent 70%)`,
        }}
      />
      
      {/* Border glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{
          boxShadow: `0 0 0 1px ${card.glowColor}33, 0 8px 32px ${card.glowColor}11`,
        }}
      />

      {/* Card Delete & Glow Color Buttons (visible on hover if parent is selected) */}
      {selected && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity">
          {/* Color Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-4 h-4 rounded-full border border-white shadow-sm cursor-pointer"
              style={{ backgroundColor: card.glowColor }}
              title="Glow Color"
            />
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-2 flex items-center gap-1.5">
                <input
                  type="color"
                  value={card.glowColor}
                  onChange={e => onUpdate('glowColor', e.target.value)}
                  className="w-6 h-6 border border-slate-200 rounded cursor-pointer shrink-0"
                />
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-600"
                >✕</button>
              </div>
            )}
          </div>

          {/* Delete Card */}
          <button
            onClick={onRemove}
            className="p-0.5 rounded-full bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 transition-colors"
            title="Delete Card"
          >
            <X size={11} />
          </button>
        </div>
      )}

      <div className="relative z-10 space-y-2 flex flex-col">
        {/* Emoji Input */}
        <input
          value={card.emoji}
          onChange={e => onUpdate('emoji', e.target.value)}
          placeholder="⚡"
          className="text-3xl bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-10 py-0.5 transition-colors shrink-0"
        />

        {/* Title Input */}
        <input
          value={card.title}
          onChange={e => onUpdate('title', e.target.value)}
          placeholder="Card Title"
          className="font-bold text-base bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full py-0.5 transition-colors"
          style={{ color: headColor }}
        />

        {/* Description Textarea */}
        <textarea
          value={card.description}
          onChange={e => onUpdate('description', e.target.value)}
          placeholder="Describe this feature..."
          rows={3}
          className="text-sm leading-relaxed bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full resize-none py-0.5 transition-colors"
          style={{ color: bodyColor, fieldSizing: 'content' } as any}
        />
      </div>
    </div>
  );
};

const GlowCardsNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { cards: cardsJson, cols, cardBg, textColor } = node.attrs;
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const cards: GlowCard[] = (() => { try { return JSON.parse(cardsJson); } catch { return DEFAULT_CARDS; } })();
  const setCards = (next: GlowCard[]) => updateAttributes({ cards: JSON.stringify(next) });

  const addCard = () => setCards([...cards, { emoji: '✨', title: 'New Card', description: 'Describe this feature...', glowColor: '#6366f1' }]);
  const removeCard = (i: number) => {
    if (cards.length <= 1) return;
    setCards(cards.filter((_, idx) => idx !== i));
  };
  const updateCard = (i: number, field: keyof GlowCard, val: string) =>
    setCards(cards.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const colClass = cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
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
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Columns</label>
                <div className="flex gap-1">
                  {[2, 3, 4].map(c => (
                    <button
                      key={c}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ cols: c })}
                      className={`flex-1 py-1 text-xs rounded border transition-all ${cols === c ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Background</label>
                <select
                  value={cardBg}
                  onChange={e => updateAttributes({ cardBg: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none focus:border-indigo-400"
                >
                  <option value="white">White</option>
                  <option value="dark">Dark</option>
                  <option value="glass">Glass</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Text Theme</label>
                <div className="flex gap-1">
                  {[
                    ['light', 'Dark text'],
                    ['dark', 'Light text'],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ textColor: v })}
                      className={`flex-1 py-1 text-[10px] rounded border transition-all ${textColor === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`p-4 rounded-2xl border transition-all ${selected ? 'border-indigo-400 ring-2 ring-indigo-100 bg-slate-50/20' : 'border-transparent'}`}>
        <div className={`grid ${colClass} gap-5`}>
          {cards.map((card, i) => (
            <GlowCardItem
              key={i}
              card={card}
              cardBg={cardBg}
              textColor={textColor}
              selected={selected}
              onUpdate={(f, v) => updateCard(i, f, v)}
              onRemove={() => removeCard(i)}
            />
          ))}

          {/* Inline Add Card */}
          {selected && (
            <button
              onClick={addCard}
              className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl bg-slate-50/40 hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-600 transition-all gap-1.5"
              style={{ minHeight: '160px' }}
            >
              <Plus size={24} />
              <span className="text-xs font-semibold">Add Card</span>
            </button>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const GlowCards = Node.create({
  name: 'glowCards',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      cards: {
        default: JSON.stringify(DEFAULT_CARDS),
        parseHTML: el => el.getAttribute('data-cards') || JSON.stringify(DEFAULT_CARDS),
        renderHTML: attrs => ({ 'data-cards': attrs.cards }),
      },
      cols: {
        default: 3,
        parseHTML: el => parseInt(el.getAttribute('data-cols') || '3'),
        renderHTML: attrs => ({ 'data-cols': String(attrs.cols) }),
      },
      cardBg: {
        default: 'white',
        parseHTML: el => el.getAttribute('data-card-bg') || 'white',
        renderHTML: attrs => ({ 'data-card-bg': attrs.cardBg }),
      },
      textColor: {
        default: 'light',
        parseHTML: el => el.getAttribute('data-text-color') || 'light',
        renderHTML: attrs => ({ 'data-text-color': attrs.textColor }),
      },
    };
  },

  parseHTML() { return [{ tag: 'div[data-type="glow-cards"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'glow-cards' })];
  },
  addNodeView() { return ReactNodeViewRenderer(GlowCardsNodeView); },
});
