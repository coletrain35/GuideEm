import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

interface RevealCard {
  emoji: string;
  frontTitle: string;
  backDescription: string;
  accentColor: string;
}

const DEFAULT_CARDS: RevealCard[] = [
  { emoji: '🚀', frontTitle: 'Ship Faster', backDescription: 'Deploy to production in seconds with our automated CI/CD pipeline and one-click rollbacks.', accentColor: '#6366f1' },
  { emoji: '🔒', frontTitle: 'Stay Secure', backDescription: 'End-to-end encryption, SOC 2 certified, and zero-knowledge architecture keeps your data safe.', accentColor: '#10b981' },
  { emoji: '📊', frontTitle: 'Deep Analytics', backDescription: 'Real-time dashboards with custom metrics, funnels, and cohort analysis for data-driven decisions.', accentColor: '#f59e0b' },
];

const HoverRevealNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { cards: cardsJson, cols, revealStyle } = node.attrs;
  const [hovered, setHovered] = useState<number | null>(null);

  const cards: RevealCard[] = (() => { try { return JSON.parse(cardsJson); } catch { return DEFAULT_CARDS; } })();
  const setCards = (next: RevealCard[]) => updateAttributes({ cards: JSON.stringify(next) });

  const addCard = () => setCards([...cards, { emoji: '✨', frontTitle: 'New Card', backDescription: 'Description revealed on hover.', accentColor: '#8b5cf6' }]);
  const removeCard = (i: number) => setCards(cards.filter((_, idx) => idx !== i));
  const updateCard = (i: number, field: keyof RevealCard, val: string) =>
    setCards(cards.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const colClass = cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      <div className={`grid ${colClass} gap-5`}>
        {cards.map((card, i) => {
          const isHovered = hovered === i;
          return (
            <div
              key={i}
              className="relative h-48 rounded-2xl overflow-hidden cursor-pointer"
              style={{ perspective: '800px' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {revealStyle === 'flip' ? (
                /* Flip card */
                <div
                  className="w-full h-full transition-transform duration-500"
                  style={{ transformStyle: 'preserve-3d', transform: isHovered ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                  {/* Front */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
                    style={{
                      backfaceVisibility: 'hidden',
                      backgroundColor: `${card.accentColor}12`,
                      border: `1px solid ${card.accentColor}30`,
                    }}
                  >
                    <span className="text-4xl mb-3">{card.emoji}</span>
                    <span className="font-semibold text-slate-800 text-lg">{card.frontTitle}</span>
                  </div>
                  {/* Back */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      backgroundColor: card.accentColor,
                    }}
                  >
                    <p className="text-white text-sm leading-relaxed">{card.backDescription}</p>
                  </div>
                </div>
              ) : (
                /* Slide-up reveal */
                <div className="w-full h-full">
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl transition-all duration-300"
                    style={{
                      backgroundColor: `${card.accentColor}12`,
                      border: `1px solid ${card.accentColor}30`,
                      opacity: isHovered ? 0 : 1,
                      transform: isHovered ? 'translateY(-100%)' : 'translateY(0)',
                    }}
                  >
                    <span className="text-4xl mb-3">{card.emoji}</span>
                    <span className="font-semibold text-slate-800 text-lg">{card.frontTitle}</span>
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center transition-all duration-300"
                    style={{
                      backgroundColor: card.accentColor,
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
                    }}
                  >
                    <p className="text-white text-sm leading-relaxed">{card.backDescription}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Hover Reveal Cards</p>
            <button onClick={addCard}
              className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium">
              + Add Card
            </button>
          </div>

          <div className="flex gap-3 pb-2 border-b border-slate-100">
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
              <label className="block text-xs text-slate-500 mb-1">Reveal Style</label>
              <select value={revealStyle} onChange={e => updateAttributes({ revealStyle: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value="flip">Flip</option>
                <option value="slide">Slide Up</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {cards.map((card, i) => (
              <div key={i} className="flex gap-2 items-start bg-slate-50 rounded-lg p-2">
                <input value={card.emoji} onChange={e => updateCard(i, 'emoji', e.target.value)}
                  className="w-10 text-center text-sm border border-slate-200 rounded-lg px-1 py-1 bg-white" />
                <div className="flex-1 space-y-1">
                  <input value={card.frontTitle} onChange={e => updateCard(i, 'frontTitle', e.target.value)}
                    placeholder="Front title" className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700" />
                  <textarea value={card.backDescription} onChange={e => updateCard(i, 'backDescription', e.target.value)}
                    placeholder="Back description" rows={2}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-500 resize-none" />
                </div>
                <input type="color" value={card.accentColor} onChange={e => updateCard(i, 'accentColor', e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer border border-slate-200" title="Accent color" />
                <button onClick={() => removeCard(i)} className="text-slate-400 hover:text-red-400 text-xs mt-1">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const HoverReveal = Node.create({
  name: 'hoverReveal',
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
      revealStyle: {
        default: 'flip',
        parseHTML: el => el.getAttribute('data-reveal-style') || 'flip',
        renderHTML: attrs => ({ 'data-reveal-style': attrs.revealStyle }),
      },
    };
  },

  parseHTML() { return [{ tag: 'div[data-type="hover-reveal"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'hover-reveal' })];
  },
  addNodeView() { return ReactNodeViewRenderer(HoverRevealNodeView); },
});
