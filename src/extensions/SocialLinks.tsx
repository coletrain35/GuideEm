import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
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

  const links: SocialLink[] = (() => {
    try { return JSON.parse(node.attrs.links); } catch { return []; }
  })();

  const updateLinks = (next: SocialLink[]) => updateAttributes({ links: JSON.stringify(next) });
  const updateLink = (idx: number, patch: Partial<SocialLink>) =>
    updateLinks(links.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const addLink = () => updateLinks([...links, { platform: 'GitHub', url: '', label: '' }]);
  const removeLink = (idx: number) => updateLinks(links.filter((_, i) => i !== idx));

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
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
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
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold"
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
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border"
        style={{ borderColor: `${meta.color}40`, color: meta.color, background: meta.bg }}
      >
        <span className="text-xs font-bold">{meta.initials}</span>
        <span>{display}</span>
      </div>
    );
  };

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div
        className={`rounded-2xl border-2 bg-white shadow-sm transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
        }`}
      >
        {/* Preview */}
        <div className={`flex flex-wrap gap-3 p-5 ${alignClass}`}>
          {links.length === 0 ? (
            <span className="text-sm text-slate-300 italic">No links yet — add some below</span>
          ) : (
            links.map((link, i) => renderLink(link, i))
          )}
        </div>

        {/* Edit Panel */}
        {selected && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-600">Social Links</span>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs text-slate-400 mr-1">Style:</span>
                {(['icons', 'pills', 'buttons'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateAttributes({ style: s })}
                    className={`px-2 py-0.5 text-xs rounded border capitalize transition-colors ${
                      style === s
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'border-slate-200 text-slate-600 bg-white hover:border-indigo-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400 mr-1">Align:</span>
                {(['left', 'center', 'right'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => updateAttributes({ alignment: a })}
                    className={`px-2 py-0.5 text-xs rounded border capitalize transition-colors ${
                      alignment === a
                        ? 'bg-indigo-500 text-white border-indigo-500'
                        : 'border-slate-200 text-slate-600 bg-white hover:border-indigo-300'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {links.map((link, idx) => (
                <div
                  key={idx}
                  className="grid items-center gap-2 bg-white rounded-lg border border-slate-200 p-2"
                  style={{ gridTemplateColumns: '148px 1fr auto' }}
                >
                  <select
                    value={link.platform}
                    onChange={(e) => updateLink(idx, { platform: e.target.value })}
                    className="text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white px-1.5 py-1"
                  >
                    {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input
                    value={link.url}
                    onChange={(e) => updateLink(idx, { url: e.target.value })}
                    placeholder="https://..."
                    className="px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                  />
                  <button
                    onClick={() => removeLink(idx)}
                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addLink}
              className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors w-full justify-center font-medium border border-dashed border-indigo-200"
            >
              <Plus size={14} /> Add Link
            </button>
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
