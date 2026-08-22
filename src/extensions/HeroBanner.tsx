import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Paintbrush } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const GRADIENT_PRESETS = [
  { label: 'Indigo → Pink', from: '#6366f1', to: '#ec4899' },
  { label: 'Blue → Cyan', from: '#3b82f6', to: '#06b6d4' },
  { label: 'Emerald → Teal', from: '#10b981', to: '#14b8a6' },
  { label: 'Orange → Rose', from: '#f97316', to: '#f43f5e' },
  { label: 'Violet → Indigo', from: '#8b5cf6', to: '#6366f1' },
  { label: 'Slate → Dark', from: '#475569', to: '#1e293b' },
];

const HeroBannerNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { gradientFrom, gradientTo, title, subtitle, ctaText, ctaUrl } = node.attrs;
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  return (
    <NodeViewWrapper className="group/block hero-banner-editor-wrapper my-6 relative">
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
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64"
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Gradient Presets</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {GRADIENT_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => updateAttributes({ gradientFrom: p.from, gradientTo: p.to })}
                    className="w-8 h-8 rounded-full border-2 hover:scale-110 transition-all"
                    style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})`, borderColor: gradientFrom === p.from ? '#1e293b' : 'transparent' }}
                    title={p.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 border-t border-slate-100 pt-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-slate-400">From</label>
                  <input type="color" value={gradientFrom} onChange={(e) => updateAttributes({ gradientFrom: e.target.value })} className="w-7 h-7 rounded border border-slate-200 cursor-pointer" />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-slate-400">To</label>
                  <input type="color" value={gradientTo} onChange={(e) => updateAttributes({ gradientTo: e.target.value })} className="w-7 h-7 rounded border border-slate-200 cursor-pointer" />
                </div>
              </div>
              <div className="mt-2 border-t border-slate-100 pt-2">
                <label className="text-[10px] text-slate-400 block mb-1">CTA URL</label>
                <input
                  value={ctaUrl}
                  onChange={(e) => updateAttributes({ ctaUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-2 py-1 text-xs border rounded border-slate-200 outline-none focus:border-blue-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hero preview — fully inline editable */}
      <div
        className={`rounded-2xl overflow-hidden border-2 transition-all ${selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-transparent'}`}
        contentEditable={false}
      >
        <div
          className="px-4 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16 text-center flex flex-col items-center justify-center gap-4"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            minHeight: '200px',
          }}
        >
          <input
            value={title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            placeholder="Your Title Here"
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white text-center bg-transparent outline-none border-b-2 border-transparent hover:border-white/40 focus:border-white/70 transition-colors w-full max-w-xl placeholder:text-white/50"
          />
          <input
            value={subtitle}
            onChange={(e) => updateAttributes({ subtitle: e.target.value })}
            placeholder="Optional subtitle..."
            className="text-lg text-white/90 text-center bg-transparent outline-none border-b border-transparent hover:border-white/30 focus:border-white/60 transition-colors w-full max-w-xl placeholder:text-white/40"
          />
          <input
            value={ctaText}
            onChange={(e) => updateAttributes({ ctaText: e.target.value })}
            placeholder="CTA Button Text"
            className="inline-block px-8 py-3 rounded-full font-semibold text-white text-center bg-transparent border-2 border-white/40 hover:border-white/70 focus:border-white outline-none transition-colors placeholder:text-white/40 max-w-xs"
          />
        </div>
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
