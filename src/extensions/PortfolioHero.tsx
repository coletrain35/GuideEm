import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const PortfolioHeroNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const {
    name, tagline, badgeText,
    ctaText, ctaUrl, ctaSecondaryText, ctaSecondaryUrl,
    gradientFrom, gradientTo, alignment,
  } = node.attrs;

  const alignClass = alignment === 'left' ? 'items-start text-left' : 'items-center text-center';
  const ctaRowClass = alignment === 'center' ? 'justify-center' : '';

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div
        className={`rounded-2xl border-2 overflow-hidden transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
        }`}
      >
        {/* Hero Preview */}
        <div
          className={`flex flex-col ${alignClass} gap-5 px-10 py-16`}
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        >
          {badgeText && (
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(6px)', width: 'fit-content' }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 inline-block" />
              {badgeText}
            </div>
          )}

          <h1
            className="text-4xl font-black tracking-tight text-white leading-tight m-0"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
          >
            {name || 'Your Name'}
          </h1>

          {tagline && (
            <p className="text-lg m-0 max-w-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
              {tagline}
            </p>
          )}

          {(ctaText || ctaSecondaryText) && (
            <div className={`flex flex-wrap gap-3 mt-1 ${ctaRowClass}`}>
              {ctaText && (
                <span
                  className="inline-flex items-center px-6 py-2.5 rounded-xl font-semibold text-sm bg-white shadow-sm"
                  style={{ color: gradientFrom }}
                >
                  {ctaText}
                </span>
              )}
              {ctaSecondaryText && (
                <span
                  className="inline-flex items-center px-6 py-2.5 rounded-xl font-semibold text-sm border-2 text-white"
                  style={{ borderColor: 'rgba(255,255,255,0.45)' }}
                >
                  {ctaSecondaryText}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Edit Panel */}
        {selected && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Name / Headline</label>
                <input
                  value={name}
                  onChange={(e) => updateAttributes({ name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Badge Text</label>
                <input
                  value={badgeText}
                  onChange={(e) => updateAttributes({ badgeText: e.target.value })}
                  placeholder="Open to work"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Tagline</label>
              <textarea
                value={tagline}
                onChange={(e) => updateAttributes({ tagline: e.target.value })}
                placeholder="I build fast, accessible web experiences..."
                rows={2}
                className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 resize-none bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Primary CTA</label>
                <input
                  value={ctaText}
                  onChange={(e) => updateAttributes({ ctaText: e.target.value })}
                  placeholder="View My Work"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Primary CTA URL</label>
                <input
                  value={ctaUrl}
                  onChange={(e) => updateAttributes({ ctaUrl: e.target.value })}
                  placeholder="#work"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Secondary CTA</label>
                <input
                  value={ctaSecondaryText}
                  onChange={(e) => updateAttributes({ ctaSecondaryText: e.target.value })}
                  placeholder="Contact Me"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Secondary CTA URL</label>
                <input
                  value={ctaSecondaryUrl}
                  onChange={(e) => updateAttributes({ ctaSecondaryUrl: e.target.value })}
                  placeholder="mailto:you@email.com"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Gradient From</label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={gradientFrom}
                    onChange={(e) => updateAttributes({ gradientFrom: e.target.value })}
                    className="w-9 h-[30px] cursor-pointer rounded border border-slate-200 flex-shrink-0"
                  />
                  <input
                    value={gradientFrom}
                    onChange={(e) => updateAttributes({ gradientFrom: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Gradient To</label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={gradientTo}
                    onChange={(e) => updateAttributes({ gradientTo: e.target.value })}
                    className="w-9 h-[30px] cursor-pointer rounded border border-slate-200 flex-shrink-0"
                  />
                  <input
                    value={gradientTo}
                    onChange={(e) => updateAttributes({ gradientTo: e.target.value })}
                    className="flex-1 px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Alignment</label>
              <div className="flex gap-2">
                {[
                  { value: 'left', label: 'Left aligned' },
                  { value: 'center', label: 'Centered' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateAttributes({ alignment: opt.value })}
                    className={`px-3 py-1 text-sm rounded border transition-colors ${
                      alignment === opt.value
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                        : 'border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
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
