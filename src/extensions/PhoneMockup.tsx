import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const PhoneMockupNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { image, showStatusBar, variant } = node.attrs;
  const isDark = variant === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateAttributes({ image: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const phoneBg = isDark ? '#0a0a0a' : '#f9fafb';
  const frameColor = isDark ? '#2a2a2a' : '#d1d5db';
  const notchColor = isDark ? '#000' : '#1a1a1a';
  const statusTextColor = isDark ? '#ffffff' : '#000000';
  const homeBarColor = isDark ? '#4b4b4b' : '#c9cdd2';

  return (
    <NodeViewWrapper className="group/block relative my-8 flex flex-col items-center" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div style={{ width: '240px' }}>
        <div
          className="overflow-hidden relative"
          style={{
            backgroundColor: phoneBg,
            border: `4px solid ${frameColor}`,
            borderRadius: '2.25rem',
            boxShadow: `inset 0 0 0 1px ${isDark ? '#1a1a1a' : '#b8b8b8'}, 0 0 0 1px ${isDark ? '#333' : '#c5c5c5'}, 0 25px 50px rgba(0,0,0,${isDark ? '0.5' : '0.2'})`,
          }}
        >
          {/* Image fills the entire rounded frame — no wrapper, no gaps */}
          {image ? (
            <img
              src={image}
              alt="Phone screen"
              style={{ display: 'block', width: '100%', margin: 0, padding: 0, borderRadius: 0, boxShadow: 'none' }}
            />
          ) : (
            <div
              className="flex flex-col items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
              style={{ color: isDark ? '#6b7280' : '#9ca3af', backgroundColor: phoneBg, lineHeight: 'normal', height: '460px' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={28} className="mb-2 opacity-40" />
              <span style={{ fontSize: '0.6875rem' }}>Add screenshot</span>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          )}

          {/* Dynamic island — overlaid on top of the image */}
          <div style={{ position: 'absolute', top: '0.35rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 2 }}>
            <div style={{ width: '4.5rem', height: '1.125rem', borderRadius: '9999px', backgroundColor: notchColor }} />
          </div>

          {/* Status bar — overlaid on top of the image */}
          {showStatusBar && (
            <div
              style={{
                position: 'absolute', top: '1.625rem', left: 0, right: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 1rem', fontSize: '0.625rem', fontWeight: 600,
                color: statusTextColor, pointerEvents: 'none', zIndex: 2,
              }}
            >
              <span>9:41</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: 0.8 }}>
                <svg width="10" height="7" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="3" width="3" height="7" rx="0.5" /><rect x="4" y="2" width="3" height="8" rx="0.5" /><rect x="8" y="0" width="3" height="10" rx="0.5" /><rect x="12" y="0" width="2" height="10" rx="0.5" opacity="0.35" /></svg>
                <svg width="10" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" /></svg>
              </div>
            </div>
          )}

          {/* Home bar — overlaid at bottom */}
          <div style={{ position: 'absolute', bottom: '0.25rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 2 }}>
            <div style={{ width: '5rem', height: '0.2rem', borderRadius: '9999px', backgroundColor: homeBarColor }} />
          </div>
        </div>
      </div>

      {selected && (
        <div className="mt-3 border border-slate-200 rounded-xl bg-white p-3 space-y-2 shadow-sm" style={{ width: '240px' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Frame</span>
            <div className="flex gap-1">
              {(['dark', 'light'] as const).map((v) => (
                <button key={v} onClick={() => updateAttributes({ variant: v })} className={`px-2 py-0.5 text-xs rounded border transition-all ${variant === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'}`}>{v}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Status bar</span>
            <button
              onClick={() => updateAttributes({ showStatusBar: !showStatusBar })}
              className={`px-2 py-0.5 text-xs rounded border ${showStatusBar ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'}`}
            >
              {showStatusBar ? 'On' : 'Off'}
            </button>
          </div>
          <button
            className="w-full px-2 py-1.5 text-xs bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? 'Change image' : 'Upload screenshot'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const PhoneMockup = Node.create({
  name: 'phoneMockup',
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
      showStatusBar: {
        default: false,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-show-status-bar') !== 'false',
        renderHTML: (attrs: any) => ({ 'data-show-status-bar': String(attrs.showStatusBar) }),
      },
      variant: {
        default: 'dark',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-variant') || 'dark',
        renderHTML: (attrs: any) => ({ 'data-variant': attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="phone-mockup"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'phone-mockup' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PhoneMockupNodeView);
  },
});
