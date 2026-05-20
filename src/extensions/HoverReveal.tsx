import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Plus, X, Paintbrush } from 'lucide-react';
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

const HoverRevealCardItem = ({
  card,
  selected,
  revealStyle,
  onUpdate,
  onRemove,
}: {
  card: RevealCard;
  selected: boolean;
  revealStyle: string;
  onUpdate: (field: keyof RevealCard, val: string) => void;
  onRemove: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // If in edit mode (selected), we show both Front and Back stacked for easy editing
  if (selected) {
    return (
      <div
        className="relative rounded-2xl p-5 border border-slate-200 bg-white flex flex-col gap-3 shadow-sm hover:border-indigo-300 transition-all"
        style={{ minHeight: '192px' }}
      >
        {/* Card Header Actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
          {/* Accent Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-4 h-4 rounded-full border border-white shadow-sm cursor-pointer"
              style={{ backgroundColor: card.accentColor }}
              title="Accent Color"
            />
            {showColorPicker && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-2 flex items-center gap-1.5">
                <input
                  type="color"
                  value={card.accentColor}
                  onChange={e => onUpdate('accentColor', e.target.value)}
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
            className="p-0.5 rounded-full bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-100 transition-colors"
            title="Delete Card"
          >
            <X size={11} />
          </button>
        </div>

        {/* Front Edit Panel */}
        <div className="space-y-1.5 pb-2 border-b border-dashed border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Front Face</p>
          <div className="flex items-center gap-2">
            <input
              value={card.emoji}
              onChange={e => onUpdate('emoji', e.target.value)}
              placeholder="🚀"
              className="w-8 text-center text-xl bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none transition-colors"
            />
            <input
              value={card.frontTitle}
              onChange={e => onUpdate('frontTitle', e.target.value)}
              placeholder="Front Title"
              className="font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full transition-colors"
              style={{ color: card.accentColor }}
            />
          </div>
        </div>

        {/* Back Edit Panel */}
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Back Face (Hover Reveal)</p>
          <textarea
            value={card.backDescription}
            onChange={e => onUpdate('backDescription', e.target.value)}
            placeholder="Description revealed on hover..."
            rows={2}
            className="text-xs text-slate-600 leading-relaxed bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full resize-none transition-colors"
            style={{ fieldSizing: 'content' } as any}
          />
        </div>
      </div>
    );
  }

  // Not selected: render beautiful interactive hover card
  return (
    <div
      className="relative h-48 rounded-2xl overflow-hidden cursor-pointer"
      style={{ perspective: '800px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {revealStyle === 'flip' ? (
        /* Flip card */
        <div
          className="w-full h-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: hovered ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
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
              opacity: hovered ? 0 : 1,
              transform: hovered ? 'translateY(-100%)' : 'translateY(0)',
            }}
          >
            <span className="text-4xl mb-3">{card.emoji}</span>
            <span className="font-semibold text-slate-800 text-lg">{card.frontTitle}</span>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center transition-all duration-300"
            style={{
              backgroundColor: card.accentColor,
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(100%)',
            }}
          >
            <p className="text-white text-sm leading-relaxed">{card.backDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const HoverRevealNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { cards: cardsJson, cols, revealStyle } = node.attrs;
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const cards: RevealCard[] = (() => { try { return JSON.parse(cardsJson); } catch { return DEFAULT_CARDS; } })();
  const setCards = (next: RevealCard[]) => updateAttributes({ cards: JSON.stringify(next) });

  const addCard = () => setCards([...cards, { emoji: '✨', frontTitle: 'New Card', backDescription: 'Description revealed on hover.', accentColor: '#6366f1' }]);
  const removeCard = (i: number) => {
    if (cards.length <= 1) return;
    setCards(cards.filter((_, idx) => idx !== i));
  };
  const updateCard = (i: number, field: keyof RevealCard, val: string) =>
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
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Reveal Style</label>
                <div className="flex gap-1">
                  {[
                    ['flip', 'Flip'],
                    ['slide', 'Slide Up'],
                  ].map(([v, l]) => (
                    <button
                      key={v}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ revealStyle: v })}
                      className={`flex-1 py-1 text-xs rounded border transition-all ${revealStyle === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
            <HoverRevealCardItem
              key={i}
              card={card}
              selected={selected}
              revealStyle={revealStyle}
              onUpdate={(f, v) => updateCard(i, f, v)}
              onRemove={() => removeCard(i)}
            />
          ))}

          {/* Inline Add Card */}
          {selected && (
            <button
              onClick={addCard}
              className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl bg-slate-50/40 hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-600 transition-all gap-1.5"
              style={{ minHeight: '192px' }}
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
