import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';

const HeroBannerNodeView = (props: any) => {
  const { node, updateAttributes, selected } = props;
  const { gradientFrom, gradientTo, title, subtitle, ctaText, ctaUrl } = node.attrs;

  return (
    <NodeViewWrapper className="hero-banner-editor-wrapper my-6">
      <div
        className={`rounded-2xl overflow-hidden border-2 transition-all ${
          selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-transparent'
        }`}
        contentEditable={false}
      >
        {/* Preview */}
        <div
          className="px-4 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16 text-center"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white m-0 mb-4 leading-tight">
            {title || 'Your Title Here'}
          </h2>
          {subtitle && (
            <p className="text-lg text-white/90 m-0 mb-8 max-w-xl">
              {subtitle}
            </p>
          )}
          {ctaText && (
            <span
              className="inline-block px-8 py-3 rounded-full font-semibold text-white border-2"
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderColor: 'rgba(255,255,255,0.5)',
              }}
            >
              {ctaText}
            </span>
          )}
        </div>

        {/* Edit panel */}
        {selected && (
          <div className="bg-white border-t border-slate-200 p-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Title</label>
                <input
                  value={title}
                  onChange={(e) => updateAttributes({ title: e.target.value })}
                  placeholder="Your Title Here"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Subtitle</label>
              <input
                value={subtitle}
                onChange={(e) => updateAttributes({ subtitle: e.target.value })}
                placeholder="Optional subtitle text"
                className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 block mb-0.5">CTA Text</label>
                <input
                  value={ctaText}
                  onChange={(e) => updateAttributes({ ctaText: e.target.value })}
                  placeholder="Get Started"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 block mb-0.5">CTA URL</label>
                <input
                  value={ctaUrl}
                  onChange={(e) => updateAttributes({ ctaUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500">Gradient From</label>
                <input
                  type="color"
                  value={gradientFrom}
                  onChange={(e) => updateAttributes({ gradientFrom: e.target.value })}
                  className="w-8 h-8 cursor-pointer rounded border border-slate-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500">Gradient To</label>
                <input
                  type="color"
                  value={gradientTo}
                  onChange={(e) => updateAttributes({ gradientTo: e.target.value })}
                  className="w-8 h-8 cursor-pointer rounded border border-slate-200"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const HeroBanner = Node.create({
  name: 'heroBanner',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
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
      title: {
        default: 'Your Title Here',
        parseHTML: (el) => el.getAttribute('data-title') || 'Your Title Here',
        renderHTML: (attrs) => ({ 'data-title': attrs.title }),
      },
      subtitle: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-subtitle') || '',
        renderHTML: (attrs) => (attrs.subtitle ? { 'data-subtitle': attrs.subtitle } : {}),
      },
      ctaText: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-cta-text') || '',
        renderHTML: (attrs) => (attrs.ctaText ? { 'data-cta-text': attrs.ctaText } : {}),
      },
      ctaUrl: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-cta-url') || '',
        renderHTML: (attrs) => (attrs.ctaUrl ? { 'data-cta-url': attrs.ctaUrl } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="hero-banner"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'hero-banner' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HeroBannerNodeView);
  },
});
