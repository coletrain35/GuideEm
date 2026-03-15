import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const TestimonialNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode } = props;
  const { quote, authorName, authorRole, avatarColor } = node.attrs;

  const initial = authorName ? authorName[0].toUpperCase() : '?';

  return (
    <NodeViewWrapper className="group/block testimonial-editor-wrapper my-6 relative">
      <BlockDeleteButton deleteNode={deleteNode} />
      <div
        className={`relative bg-white rounded-2xl border transition-all ${
          selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200'
        } p-8`}
        contentEditable={false}
      >
        {/* Quote mark */}
        <div className="text-6xl leading-none font-serif text-slate-200 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          ❝
        </div>

        {/* Quote text */}
        <p className="text-lg leading-relaxed text-slate-700 italic mb-6">
          {quote}
        </p>

        {/* Author row */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base text-white flex-shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {initial}
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-[0.9375rem]">{authorName}</div>
            <div className="text-[0.8125rem] text-slate-500">{authorRole}</div>
          </div>
        </div>

        {/* Edit panel */}
        {selected && (
          <div className="mt-6 border-t border-blue-200 pt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Quote</label>
              <textarea
                value={quote}
                onChange={(e) => updateAttributes({ quote: e.target.value })}
                rows={3}
                className="w-full px-2 py-1.5 text-sm border rounded border-slate-200 outline-none focus:border-blue-400 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Author Name</label>
                <input
                  value={authorName}
                  onChange={(e) => updateAttributes({ authorName: e.target.value })}
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Role / Company</label>
                <input
                  value={authorRole}
                  onChange={(e) => updateAttributes({ authorRole: e.target.value })}
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-500">Avatar Color</label>
              <input
                type="color"
                value={avatarColor}
                onChange={(e) => updateAttributes({ avatarColor: e.target.value })}
                className="w-8 h-8 cursor-pointer rounded border border-slate-200"
              />
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const Testimonial = Node.create({
  name: 'testimonial',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      quote: {
        default: 'Your testimonial goes here.',
        parseHTML: (el) => el.getAttribute('data-quote') || 'Your testimonial goes here.',
        renderHTML: (attrs) => ({ 'data-quote': attrs.quote }),
      },
      authorName: {
        default: 'Author Name',
        parseHTML: (el) => el.getAttribute('data-author-name') || 'Author Name',
        renderHTML: (attrs) => ({ 'data-author-name': attrs.authorName }),
      },
      authorRole: {
        default: 'Title, Company',
        parseHTML: (el) => el.getAttribute('data-author-role') || 'Title, Company',
        renderHTML: (attrs) => ({ 'data-author-role': attrs.authorRole }),
      },
      avatarColor: {
        default: '#6366f1',
        parseHTML: (el) => el.getAttribute('data-avatar-color') || '#6366f1',
        renderHTML: (attrs) => ({ 'data-avatar-color': attrs.avatarColor }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="testimonial"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'testimonial' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TestimonialNodeView);
  },
});
