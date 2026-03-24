import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const VARIANTS = {
  indigo: { pill: '#eef2ff', pillBorder: '#c7d2fe', pillText: '#4338ca', badge: '#6366f1', badgeText: '#fff' },
  rose:   { pill: '#fff1f2', pillBorder: '#fecdd3', pillText: '#be123c', badge: '#f43f5e', badgeText: '#fff' },
  emerald:{ pill: '#ecfdf5', pillBorder: '#a7f3d0', pillText: '#065f46', badge: '#10b981', badgeText: '#fff' },
  amber:  { pill: '#fffbeb', pillBorder: '#fde68a', pillText: '#92400e', badge: '#f59e0b', badgeText: '#fff' },
  slate:  { pill: '#f8fafc', pillBorder: '#e2e8f0', pillText: '#334155', badge: '#475569', badgeText: '#fff' },
  dark:   { pill: '#0f172a', pillBorder: '#1e293b', pillText: '#e2e8f0', badge: '#6366f1', badgeText: '#fff' },
};

const AnnouncementPillNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { label, message, url, variant, shimmer, align } = node.attrs;

  const colors = VARIANTS[variant as keyof typeof VARIANTS] ?? VARIANTS.indigo;
  const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      <div className={`flex ${alignClass}`}>
        <div
          className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium overflow-hidden select-none ${url ? 'cursor-pointer' : ''}`}
          style={{
            backgroundColor: colors.pill,
            border: `1px solid ${colors.pillBorder}`,
            color: colors.pillText,
          }}
        >
          {/* Badge */}
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: colors.badge, color: colors.badgeText }}
          >
            {label || 'New'}
          </span>

          {/* Message */}
          <span>{message || 'Something exciting just launched'}</span>

          {/* Arrow */}
          {url && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          )}

          {/* Shimmer overlay */}
          {shimmer && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.4) 50%, transparent 80%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer-sweep 2.5s ease-in-out infinite',
              }}
            />
          )}
        </div>
      </div>

      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Announcement Pill</p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Badge Label</label>
              <input value={label} onChange={e => updateAttributes({ label: e.target.value })}
                placeholder="New" className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Message</label>
              <input value={message} onChange={e => updateAttributes({ message: e.target.value })}
                placeholder="Something new just launched" className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Link URL (optional)</label>
              <input value={url} onChange={e => updateAttributes({ url: e.target.value })}
                placeholder="https://..." className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Alignment</label>
              <select value={align} onChange={e => updateAttributes({ align: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value="center">Center</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Color</label>
              <div className="flex gap-1.5">
                {(Object.keys(VARIANTS) as Array<keyof typeof VARIANTS>).map(v => (
                  <button key={v} onClick={() => updateAttributes({ variant: v })}
                    title={v}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${variant === v ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: VARIANTS[v].badge }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="shimmer-toggle" checked={shimmer} onChange={e => updateAttributes({ shimmer: e.target.checked })}
                className="rounded" />
              <label htmlFor="shimmer-toggle" className="text-xs text-slate-600">Shimmer effect</label>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer-sweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </NodeViewWrapper>
  );
};

export const AnnouncementPill = Node.create({
  name: 'announcementPill',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      label: {
        default: 'New',
        parseHTML: el => el.getAttribute('data-label') || 'New',
        renderHTML: attrs => ({ 'data-label': attrs.label }),
      },
      message: {
        default: 'Something exciting just launched',
        parseHTML: el => el.getAttribute('data-message') || '',
        renderHTML: attrs => ({ 'data-message': attrs.message }),
      },
      url: {
        default: '',
        parseHTML: el => el.getAttribute('data-url') || '',
        renderHTML: attrs => ({ 'data-url': attrs.url }),
      },
      variant: {
        default: 'indigo',
        parseHTML: el => el.getAttribute('data-variant') || 'indigo',
        renderHTML: attrs => ({ 'data-variant': attrs.variant }),
      },
      shimmer: {
        default: true,
        parseHTML: el => el.getAttribute('data-shimmer') !== 'false',
        renderHTML: attrs => ({ 'data-shimmer': String(attrs.shimmer) }),
      },
      align: {
        default: 'center',
        parseHTML: el => el.getAttribute('data-align') || 'center',
        renderHTML: attrs => ({ 'data-align': attrs.align }),
      },
    };
  },

  parseHTML() { return [{ tag: 'div[data-type="announcement-pill"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'announcement-pill' })];
  },
  addNodeView() { return ReactNodeViewRenderer(AnnouncementPillNodeView); },
});
