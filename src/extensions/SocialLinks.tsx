import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Plus, X, Paintbrush } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

const PLATFORM_META: Record<string, { color: string; bg: string; initials: string }> = {
  'GitHub':     { color: '#171515', bg: '#f6f8fa', initials: 'GH' },
  'LinkedIn':   { color: '#0a66c2', bg: '#e8f0fb', initials: 'in' },
  'Twitter/X':  { color: '#000000', bg: '#f5f5f5', initials: 'X'  },
  'Dribbble':   { color: '#ea4c89', bg: '#fdf0f5', initials: 'Dr' },
  'Email':      { color: '#6366f1', bg: '#eef2ff', initials: '✉'  },
  'Website':    { color: '#0ea5e9', bg: '#e0f2fe', initials: '🌐' },
  'YouTube':    { color: '#ff0000', bg: '#fff1f0', initials: '▶'  },
  'Instagram':  { color: '#e1306c', bg: '#fdf2f8', initials: 'IG' },
  'Behance':    { color: '#1769ff', bg: '#e8efff', initials: 'Be' },
};

const PLATFORMS = Object.keys(PLATFORM_META);

const SocialLinksNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { style, alignment } = node.attrs;
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const links: SocialLink[] = (() => {
    try { return JSON.parse(node.attrs.links); } catch { return []; }
  })();

  const updateLinks = (next: SocialLink[]) => updateAttributes({ links: JSON.stringify(next) });
  const updateLink = (idx: number, patch: Partial<SocialLink>) =>
    updateLinks(links.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const addLink = () => updateLinks([...links, { platform: 'GitHub', url: '', label: '' }]);
  const removeLink = (idx: number) => {
    if (links.length <= 1) return;
    updateLinks(links.filter((_, i) => i !== idx));
  };

  const alignClass =
    alignment === 'center' ? 'justify-center' :
    alignment === 'right' ? 'justify-end' : 'justify-start';

  const renderLink = (link: SocialLink, i: number) => {
    const meta = PLATFORM_META[link.platform] || { color: '#6366f1', bg: '#eef2ff', initials: '?' };
    const display = link.label || link.platform;

    if (style === 'icons') {
      return (
        <div
          key={i}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all shadow-sm"
          style={{ background: meta.bg, color: meta.color }}
          title={display}
        >
          {meta.initials}
        </div>
      );
    }
    if (style === 'pills') {
      return (
        <div
          key={i}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold shadow-sm"
          style={{ background: meta.bg, color: meta.color }}
        >
          <span className="text-xs font-bold">{meta.initials}</span>
          <span>{display}</span>
        </div>
      );
    }
    // buttons
    return (
      <div
        key={i}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border shadow-sm"
        style={{ borderColor: `${meta.color}33`, color: meta.color, background: meta.bg }}
      >
        <span className="text-xs font-bold">{meta.initials}</span>
        <span>{display}</span>
      </div>
    );
  };

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Floating Style/Settings Toolbar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-30 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        <div ref={styleRef} className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowStyle(!showStyle)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${showStyle ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Paintbrush size={14} /> Style & Align
          </button>
          {showStyle && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-52 space-y-3"
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Pill Style</label>
                <div className="flex gap-1">
                  {['icons', 'pills', 'buttons'].map((s) => (
                    <button
                      key={s}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ style: s })}
                      className={`flex-1 py-1 text-[10px] rounded border capitalize transition-colors ${
                        style === s
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Alignment</label>
                <div className="flex gap-1">
                  {['left', 'center', 'right'].map((a) => (
                    <button
                      key={a}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ alignment: a })}
                      className={`flex-1 py-1 text-xs rounded border capitalize transition-colors ${
                        alignment === a
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`rounded-2xl border transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100 bg-slate-50/20' : 'border-slate-200 bg-transparent'
        }`}
      >
        {/* Preview row */}
        <div className={`flex flex-wrap gap-3 p-5 ${alignClass}`}>
          {links.length === 0 ? (
            <span className="text-sm text-slate-350 italic">No links yet — click block to add</span>
          ) : (
            links.map((link, i) => renderLink(link, i))
          )}
        </div>

        {/* Clean, premium Inline Config Panel */}
        {selected && (
          <div className="border-t border-slate-200 bg-white/70 p-4 space-y-3 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configure Links</span>
              <button
                onClick={addLink}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Plus size={12} /> Add Link
              </button>
            </div>

            <div className="space-y-2">
              {links.map((link, idx) => {
                const meta = PLATFORM_META[link.platform] || { color: '#6366f1', bg: '#eef2ff', initials: '?' };
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-2 shadow-sm"
                  >
                    {/* Visual color tag */}
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      {meta.initials}
                    </div>

                    {/* Platform select */}
                    <select
                      value={link.platform}
                      onChange={(e) => updateLink(idx, { platform: e.target.value })}
                      className="text-xs font-semibold border border-slate-200 rounded-lg outline-none focus:border-indigo-400 bg-slate-50 px-2 py-1 shrink-0"
                      style={{ color: meta.color }}
                    >
                      {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>

                    {/* Target Link input */}
                    <input
                      value={link.url}
                      onChange={(e) => updateLink(idx, { url: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-400 bg-transparent transition-colors"
                    />

                    {/* Label Link input */}
                    <input
                      value={link.label}
                      onChange={(e) => updateLink(idx, { label: e.target.value })}
                      placeholder="Optional label"
                      className="w-24 px-2.5 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-400 bg-transparent transition-colors"
                    />

                    {/* Delete button */}
                    {links.length > 1 && (
                      <button
                        onClick={() => removeLink(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const SocialLinks = Node.create({
  name: 'socialLinks',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      links: {
        default: JSON.stringify([
          { platform: 'GitHub', url: '', label: '' },
          { platform: 'LinkedIn', url: '', label: '' },
        ]),
        parseHTML: (el) => el.getAttribute('data-links') || '[]',
        renderHTML: (attrs) => ({ 'data-links': attrs.links }),
      },
      style: {
        default: 'pills',
        parseHTML: (el) => el.getAttribute('data-style') || 'pills',
        renderHTML: (attrs) => ({ 'data-style': attrs.style }),
      },
      alignment: {
        default: 'center',
        parseHTML: (el) => el.getAttribute('data-alignment') || 'center',
        renderHTML: (attrs) => ({ 'data-alignment': attrs.alignment }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="social-links"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'social-links' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SocialLinksNodeView);
  },
});
