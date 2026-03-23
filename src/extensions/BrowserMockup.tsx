import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const BrowserMockupNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { image, url, variant } = node.attrs;
  const isDark = variant === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateAttributes({ image: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const titleBarBg = isDark ? '#2d2d2d' : '#e8e8e8';
  const borderColor = isDark ? '#3d3d3d' : '#d1d5db';
  const bodyBg = isDark ? '#1a1a1a' : '#ffffff';
  const urlBarBg = isDark ? '#1e1e1e' : '#f3f4f6';
  const urlTextColor = isDark ? '#9ca3af' : '#6b7280';

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div className="rounded-xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${borderColor}` }}>
        {/* Chrome bar */}
        <div className="flex items-center gap-3 px-4 py-2.5" style={{ backgroundColor: titleBarBg, borderBottom: `1px solid ${borderColor}` }}>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffbe2e' }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#28c941' }} />
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono" style={{ backgroundColor: urlBarBg, color: urlTextColor }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            <span className="truncate">{url || 'https://example.com'}</span>
          </div>
        </div>
        {/* Content */}
        <div style={{ backgroundColor: bodyBg, lineHeight: 0 }}>
          {image ? (
            <img src={image} alt="Browser screenshot" className="w-full block" style={{ display: 'block' }} />
          ) : (
            <div
              className="flex flex-col items-center justify-center cursor-pointer py-20 hover:opacity-70 transition-opacity"
              style={{ color: isDark ? '#6b7280' : '#9ca3af', backgroundColor: bodyBg, lineHeight: 'normal' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={40} className="mb-3 opacity-40" />
              <span className="text-sm">Click to add screenshot</span>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="mt-2 border border-slate-200 rounded-xl bg-white p-4 space-y-3 shadow-sm">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">URL Bar</label>
            <input
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={url || ''}
              onChange={(e) => updateAttributes({ url: e.target.value })}
              placeholder="https://yourapp.com"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">Chrome:</span>
            {(['light', 'dark'] as const).map((v) => (
              <button
                key={v}
                onClick={() => updateAttributes({ variant: v })}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${variant === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
              >
                {v}
              </button>
            ))}
            <button
              className="ml-auto px-3 py-1 text-xs bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? 'Change image' : 'Upload image'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const BrowserMockup = Node.create({
  name: 'browserMockup',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      image: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-image') || '',
        renderHTML: (attrs: any) => (attrs.image ? { 'data-image': attrs.image } : {}),
      },
      url: {
        default: 'https://yourapp.com',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-url') || 'https://yourapp.com',
        renderHTML: (attrs: any) => ({ 'data-url': attrs.url }),
      },
      variant: {
        default: 'light',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-variant') || 'light',
        renderHTML: (attrs: any) => ({ 'data-variant': attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="browser-mockup"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'browser-mockup' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BrowserMockupNodeView);
  },
});
