import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { Trash2 } from 'lucide-react';

const STYLES = ['gradient', 'solid', 'wave', 'dots'] as const;
type DividerStyle = typeof STYLES[number];

const DividerPreview = ({ style }: { style: DividerStyle }) => {
  switch (style) {
    case 'gradient':
      return (
        <div
          className="h-0.5 w-full rounded-full"
          style={{ background: 'linear-gradient(to right, transparent, var(--brand-primary, #2563eb), transparent)' }}
        />
      );
    case 'solid':
      return <div className="h-px w-full bg-slate-300" />;
    case 'wave':
      return (
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="w-full" style={{ height: '32px', display: 'block' }}>
          <path
            d="M0,20 C300,40 600,0 900,20 C1050,30 1150,10 1200,20"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
        </svg>
      );
    case 'dots':
      return (
        <div className="flex items-center justify-center gap-2 py-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          ))}
        </div>
      );
  }
};

const SectionDividerNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode } = props;
  const { style } = node.attrs as { style: DividerStyle };

  return (
    <NodeViewWrapper
      className={`relative my-8 transition-all ${selected ? 'ring-2 ring-slate-200 rounded p-2' : ''}`}
      contentEditable={false}
    >
      {selected && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-10 text-sm">
          {STYLES.map((s) => (
            <button
              key={s}
              onClick={() => updateAttributes({ style: s })}
              className={`px-3 py-1 rounded-full capitalize hover:bg-slate-100 ${
                style === s ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button
            onClick={() => deleteNode()}
            className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
            title="Delete Divider"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
      <div className="py-2">
        <DividerPreview style={style} />
      </div>
    </NodeViewWrapper>
  );
};

export const SectionDivider = Node.create({
  name: 'sectionDivider',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      style: {
        default: 'gradient',
        parseHTML: (el) => el.getAttribute('data-style') || 'gradient',
        renderHTML: (attrs) => ({ 'data-style': attrs.style }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="section-divider"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'section-divider',
        class: 'section-divider',
        contenteditable: 'false',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SectionDividerNodeView);
  },
});
