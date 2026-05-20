import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Paintbrush } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const GRADIENT_PRESETS = [
  { from: '#6366f1', to: '#ec4899' },
  { from: '#3b82f6', to: '#06b6d4' },
  { from: '#10b981', to: '#059669' },
  { from: '#f97316', to: '#ef4444' },
  { from: '#8b5cf6', to: '#6366f1' },
  { from: '#334155', to: '#1e293b' },
];

const PortfolioHeroNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const {
    name, tagline, badgeText,
    ctaText, ctaUrl, ctaSecondaryText, ctaSecondaryUrl,
    gradientFrom, gradientTo, alignment,
  } = node.attrs;
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const alignClass = alignment === 'left' ? 'items-start text-left' : 'items-center text-center';
  const ctaRowClass = alignment === 'center' ? 'justify-center' : '';
  const inputAlign = alignment === 'center' ? 'text-center' : 'text-left';

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Floating style toolbar */}
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
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-72"
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Gradient</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {GRADIENT_PRESETS.map((p, pi) => (
                  <button key={pi} onMouseDown={(e) => e.preventDefault()} onClick={() => updateAttributes({ gradientFrom: p.from, gradientTo: p.to })}
                    className="w-8 h-8 rounded-full border-2 hover:scale-110 transition-all"
                    style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})`, borderColor: gradientFrom === p.from ? '#1e293b' : 'transparent' }} />
                ))}
              </div>
              <div className="flex items-center gap-3 border-t border-slate-100 pt-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-slate-400">From</label>
                  <input type="color" value={gradientFrom} onChange={(e) => updateAttributes({ gradientFrom: e.target.value })} className="w-7 h-7 rounded border border-slate-200 cursor-pointer" />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-slate-400">To</label>
                  <input type="color" value={gradientTo} onChange={(e) => updateAttributes({ gradientTo: e.target.value })} className="w-7 h-7 rounded border border-slate-200 cursor-pointer" />
                </div>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Alignment</p>
              <div className="flex gap-1.5 mb-2">
                {['left', 'center'].map((a) => (
                  <button key={a} onMouseDown={(e) => e.preventDefault()} onClick={() => updateAttributes({ alignment: a })}
                    className={`flex-1 py-1 text-xs rounded border capitalize transition-all ${alignment === a ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'}`}
                  >{a}</button>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">CTA URLs</p>
              <input value={ctaUrl} onChange={(e) => updateAttributes({ ctaUrl: e.target.value })} placeholder="Primary URL" className="w-full px-2 py-1 text-xs border rounded border-slate-200 outline-none focus:border-blue-400 mb-1" />
              <input value={ctaSecondaryUrl} onChange={(e) => updateAttributes({ ctaSecondaryUrl: e.target.value })} placeholder="Secondary URL" className="w-full px-2 py-1 text-xs border rounded border-slate-200 outline-none focus:border-blue-400" />
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-2xl border-2 overflow-hidden transition-all ${selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
        <div
          className={`flex flex-col ${alignClass} gap-4 px-10 py-16`}
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        >
          {/* Badge */}
          <input
            value={badgeText}
            onChange={(e) => updateAttributes({ badgeText: e.target.value })}
            placeholder="Open to work"
            className={`${inputAlign} inline-block bg-white/20 text-white text-xs font-semibold px-3.5 py-1 rounded-full outline-none border border-transparent hover:border-white/40 focus:border-white/70 placeholder:text-white/40 transition-colors`}
            style={{ width: 'fit-content', backdropFilter: 'blur(6px)' }}
          />

          {/* Name / Headline */}
          <input
            value={name}
            onChange={(e) => updateAttributes({ name: e.target.value })}
            placeholder="Your Name"
            className={`${inputAlign} text-4xl font-black tracking-tight text-white bg-transparent outline-none border-b-2 border-transparent hover:border-white/40 focus:border-white/70 transition-colors w-full placeholder:text-white/40`}
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
          />

          {/* Tagline */}
          <textarea
            value={tagline}
            onChange={(e) => updateAttributes({ tagline: e.target.value })}
            placeholder="Your tagline or role..."
            rows={2}
            className={`${inputAlign} text-lg bg-transparent outline-none border-b border-transparent hover:border-white/30 focus:border-white/60 transition-colors w-full max-w-xl resize-none placeholder:text-white/40`}
            style={{ color: 'rgba(255,255,255,0.85)', fieldSizing: 'content' } as any}
          />

          {/* CTA buttons */}
          <div className={`flex flex-wrap gap-3 mt-1 ${ctaRowClass}`}>
            <input
              value={ctaText}
              onChange={(e) => updateAttributes({ ctaText: e.target.value })}
              placeholder="View My Work"
              className="inline-flex items-center px-6 py-2.5 rounded-xl font-semibold text-sm bg-white outline-none border-2 border-transparent hover:border-white/60 focus:border-indigo-300 transition-colors placeholder:text-slate-300"
              style={{ color: gradientFrom }}
            />
            <input
              value={ctaSecondaryText}
              onChange={(e) => updateAttributes({ ctaSecondaryText: e.target.value })}
              placeholder="Contact Me"
              className="inline-flex items-center px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-transparent outline-none border-2 border-white/40 hover:border-white/70 focus:border-white transition-colors placeholder:text-white/40"
            />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const PortfolioHero = Node.create({
  name: 'portfolioHero',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      name: {
        default: 'Your Name',
        parseHTML: (el) => el.getAttribute('data-name') || 'Your Name',
        renderHTML: (attrs) => ({ 'data-name': attrs.name }),
      },
      tagline: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-tagline') || '',
        renderHTML: (attrs) => (attrs.tagline ? { 'data-tagline': attrs.tagline } : {}),
      },
      badgeText: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-badge-text') || '',
        renderHTML: (attrs) => (attrs.badgeText ? { 'data-badge-text': attrs.badgeText } : {}),
      },
      ctaText: {
        default: 'View My Work',
        parseHTML: (el) => el.getAttribute('data-cta-text') || '',
        renderHTML: (attrs) => (attrs.ctaText ? { 'data-cta-text': attrs.ctaText } : {}),
      },
      ctaUrl: {
        default: '#work',
        parseHTML: (el) => el.getAttribute('data-cta-url') || '',
        renderHTML: (attrs) => (attrs.ctaUrl ? { 'data-cta-url': attrs.ctaUrl } : {}),
      },
      ctaSecondaryText: {
        default: 'Contact Me',
        parseHTML: (el) => el.getAttribute('data-cta-secondary-text') || '',
        renderHTML: (attrs) => (attrs.ctaSecondaryText ? { 'data-cta-secondary-text': attrs.ctaSecondaryText } : {}),
      },
      ctaSecondaryUrl: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-cta-secondary-url') || '',
        renderHTML: (attrs) => (attrs.ctaSecondaryUrl ? { 'data-cta-secondary-url': attrs.ctaSecondaryUrl } : {}),
      },
      gradientFrom: {
        default: '#6366f1',
        parseHTML: (el) => el.getAttribute('data-gradient-from') || '#6366f1',
        renderHTML: (attrs) => ({ 'data-gradient-from': attrs.gradientFrom }),
      },
      gradientTo: {
        default: '#ec4899',
        parseHTML: (el) => el.getAttribute('data-gradient-to') || '#ec4899',
        renderHTML: (attrs) => ({ 'data-gradient-to': attrs.gradientTo }),
      },
      alignment: {
        default: 'center',
        parseHTML: (el) => el.getAttribute('data-alignment') || 'center',
        renderHTML: (attrs) => ({ 'data-alignment': attrs.alignment }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="portfolio-hero"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'portfolio-hero' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PortfolioHeroNodeView);
  },
});
