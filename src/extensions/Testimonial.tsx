import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

// Reusable inline-editable field styles
const inlineTextClass = 'bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-400 transition-colors cursor-text';
const inlineTextareaClass = 'bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-400 transition-colors cursor-text resize-none w-full';

const TestimonialNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { quote, authorName, authorRole, avatarColor } = node.attrs;
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);
  const initial = authorName ? authorName[0].toUpperCase() : '?';

  return (
    <NodeViewWrapper className="group/block testimonial-editor-wrapper my-6 relative">
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
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

        {/* Quote text — inline editable */}
        <textarea
          value={quote}
          onChange={(e) => updateAttributes({ quote: e.target.value })}
          rows={3}
          className={`${inlineTextareaClass} text-lg leading-relaxed text-slate-700 italic mb-6 block`}
          placeholder="Your testimonial goes here."
          style={{ fieldSizing: 'content' } as any}
        />

        {/* Author row */}
        <div className="flex items-center gap-3 mt-4">
          {/* Avatar — click to change color */}
          <div className="relative" ref={colorRef}>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base text-white flex-shrink-0 transition-all hover:ring-2 hover:ring-offset-1 hover:ring-blue-400"
              style={{ backgroundColor: avatarColor }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Click to change color"
            >
              {initial}
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 flex items-center gap-2">
                <label className="text-xs text-slate-500 whitespace-nowrap">Avatar Color</label>
                <input
                  type="color"
                  value={avatarColor}
                  onChange={(e) => updateAttributes({ avatarColor: e.target.value })}
                  className="w-8 h-8 cursor-pointer rounded border border-slate-200"
                />
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 ml-1"
                >✕</button>
              </div>
            )}
          </div>
          <div>
            <input
              value={authorName}
              onChange={(e) => updateAttributes({ authorName: e.target.value })}
              className={`${inlineTextClass} font-semibold text-slate-900 text-[0.9375rem] block w-full`}
              placeholder="Author Name"
            />
            <input
              value={authorRole}
              onChange={(e) => updateAttributes({ authorRole: e.target.value })}
              className={`${inlineTextClass} text-[0.8125rem] text-slate-500 block w-full mt-0.5`}
              placeholder="Title, Company"
            />
          </div>
        </div>
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
