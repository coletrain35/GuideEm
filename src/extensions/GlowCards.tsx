import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef } from 'react';
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

// Extract each card into its own component so hooks are called at the top level
const GlowCardItem = ({ card, cardBg, textColor }: { card: GlowCard; cardBg: string; textColor: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="relative rounded-2xl p-6 overflow-hidden cursor-default group/card transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        backgroundColor: cardBg === 'dark' ? '#0f172a' : cardBg === 'glass' ? 'rgba(255,255,255,0.7)' : '#ffffff',
        border: cardBg === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        backdropFilter: cardBg === 'glass' ? 'blur(12px)' : undefined,
      }}
    >
      {/* Glow spotlight overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(300px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${card.glowColor}22, transparent 70%)`,
        }}
      />
      {/* Border glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{
          boxShadow: `0 0 0 1px ${card.glowColor}44, 0 8px 32px ${card.glowColor}22`,
        }}
      />
      <div className="relative z-10">
        <div className="text-3xl mb-3">{card.emoji}</div>
        <h3 className="font-semibold text-base mb-2" style={{ color: textColor === 'dark' ? '#f1f5f9' : '#0f172a' }}>{card.title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: textColor === 'dark' ? '#94a3b8' : '#64748b' }}>{card.description}</p>
      </div>
    </div>
  );
};

const GlowCardsNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { cards: cardsJson, cols, cardBg, textColor } = node.attrs;

  const cards: GlowCard[] = (() => { try { return JSON.parse(cardsJson); } catch { return DEFAULT_CARDS; } })();
  const setCards = (next: GlowCard[]) => updateAttributes({ cards: JSON.stringify(next) });

  const addCard = () => setCards([...cards, { emoji: '✨', title: 'New Card', description: 'Card description.', glowColor: '#8b5cf6' }]);
  const removeCard = (i: number) => setCards(cards.filter((_, idx) => idx !== i));
  const updateCard = (i: number, field: keyof GlowCard, val: string) =>
    setCards(cards.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const colClass = cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      <div className={`grid ${colClass} gap-5`}>
        {cards.map((card, i) => (
          <GlowCardItem key={i} card={card} cardBg={cardBg} textColor={textColor} />
        ))}
      </div>

      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Glow Cards</p>
            <button onClick={addCard}
              className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium transition-colors">
              + Add Card
            </button>
          </div>

          <div className="flex flex-wrap gap-3 pb-2 border-b border-slate-100">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Columns</label>
              <select value={cols} onChange={e => updateAttributes({ cols: parseInt(e.target.value) })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Card Background</label>
              <select value={cardBg} onChange={e => updateAttributes({ cardBg: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value="white">White</option>
                <option value="dark">Dark</option>
                <option value="glass">Glass</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Text</label>
              <select value={textColor} onChange={e => updateAttributes({ textColor: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value="light">Dark text</option>
                <option value="dark">Light text</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {cards.map((card, i) => (
              <div key={i} className="flex gap-2 items-start bg-slate-50 rounded-lg p-2">
                <input value={card.emoji} onChange={e => updateCard(i, 'emoji', e.target.value)}
                  placeholder="emoji" className="w-10 text-center text-sm border border-slate-200 rounded-lg px-1 py-1 bg-white" />
                <div className="flex-1 space-y-1">
                  <input value={card.title} onChange={e => updateCard(i, 'title', e.target.value)}
                    placeholder="Title" className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700" />
                  <input value={card.description} onChange={e => updateCard(i, 'description', e.target.value)}
                    placeholder="Description" className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-500" />
                </div>
                <input type="color" value={card.glowColor} onChange={e => updateCard(i, 'glowColor', e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer border border-slate-200" title="Glow color" />
                <button onClick={() => removeCard(i)} className="text-slate-400 hover:text-red-400 transition-colors text-xs mt-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
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
