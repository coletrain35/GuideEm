import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Paintbrush } from 'lucide-react';
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
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const colors = VARIANTS[variant as keyof typeof VARIANTS] ?? VARIANTS.indigo;
  const alignClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

  return (
    <NodeViewWrapper className="not-prose group/block relative my-2" contentEditable={false}>
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
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64 space-y-3"
            >
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Variant / Color</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(Object.keys(VARIANTS) as Array<keyof typeof VARIANTS>).map(v => (
                    <button
                      key={v}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ variant: v })}
                      title={v}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${variant === v ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: VARIANTS[v].badge }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Alignment</p>
                <div className="flex gap-1">
                  {['left', 'center', 'right'].map((a) => (
                    <button
                      key={a}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ align: a })}
                      className={`flex-1 py-1 text-[10px] rounded border capitalize transition-all ${align === a ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shimmer-toggle"
                  checked={shimmer}
                  onChange={e => updateAttributes({ shimmer: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="shimmer-toggle" className="text-[11px] font-medium text-slate-600 select-none">Shimmer effect</label>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Link URL (optional)</label>
                <input
                  value={url}
                  onChange={e => updateAttributes({ url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-2 py-1 text-xs border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`flex ${alignClass}`}>
        <div
          className={`relative inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-sm leading-5 font-medium overflow-hidden select-none border transition-all ${
            selected ? 'ring-2 ring-indigo-200 border-indigo-400 scale-105 shadow-sm bg-white' : 'border-transparent'
          }`}
          style={{
            backgroundColor: colors.pill,
            borderColor: selected ? undefined : colors.pillBorder,
            color: colors.pillText,
          }}
        >
          {/* Badge Label - Bulletproof Auto-growing Inline Grid Input with absolute min-width: 0 override */}
          <div
            className="px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center justify-center transition-colors shrink-0"
            style={{
              backgroundColor: colors.badge,
              color: colors.badgeText,
            }}
          >
            <span className="inline-grid grid-cols-1 min-w-0">
              <span className="invisible row-start-1 col-start-1 whitespace-pre text-xs font-bold px-0.5">{label || 'New'}</span>
              <input
                value={label}
                onChange={e => updateAttributes({ label: e.target.value })}
                placeholder="New"
                className="row-start-1 col-start-1 bg-transparent border-none outline-none p-0 text-center w-full min-w-0 text-xs font-bold placeholder:text-white/40 cursor-text"
                style={{ color: colors.badgeText }}
              />
            </span>
          </div>

          {/* Message - Bulletproof Auto-growing Inline Grid Input with absolute min-width: 0 override */}
          <span className="inline-grid grid-cols-1 min-w-0">
            <span className="invisible row-start-1 col-start-1 whitespace-pre px-0.5 text-sm font-medium">{message || 'Something exciting just launched'}</span>
            <input
              value={message}
              onChange={e => updateAttributes({ message: e.target.value })}
              placeholder="Something exciting just launched"
              className="row-start-1 col-start-1 bg-transparent border-none outline-none p-0 w-full min-w-0 text-sm font-medium placeholder:text-slate-400 cursor-text"
              style={{ color: colors.pillText }}
            />
          </span>

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
