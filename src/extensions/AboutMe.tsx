import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Paintbrush } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const AboutMeNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { avatar, name, role, bio, accentColor, layout } = node.attrs;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateAttributes({ avatar: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const initials = (name as string)
    .split(' ')
    .map((w: string) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const avatarEl = (
    <div
      className="relative flex-shrink-0 cursor-pointer group/avatar"
      onClick={() => fileInputRef.current?.click()}
      title="Click to change avatar"
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-28 h-28 rounded-full object-cover block" />
      ) : (
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold tracking-tight"
          style={{ background: accentColor, color: '#fff' }}
        >
          {initials || '?'}
        </div>
      )}
      <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
        Change
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
    </div>
  );

  const textCol = (
    <div className="flex-1 min-w-0">
      <input
        value={name}
        onChange={(e) => updateAttributes({ name: e.target.value })}
        placeholder="Your Name"
        className="text-xl font-extrabold leading-tight mb-1 bg-transparent outline-none border-b-2 border-transparent hover:border-current/30 focus:border-current/60 transition-colors block w-full"
        style={{ color: accentColor }}
      />
      <input
        value={role}
        onChange={(e) => updateAttributes({ role: e.target.value })}
        placeholder="Your Role"
        className="text-sm font-medium text-slate-500 mb-2 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-slate-400 transition-colors block w-full"
      />
      <textarea
        value={bio}
        onChange={(e) => updateAttributes({ bio: e.target.value })}
        placeholder="Write a short bio..."
        rows={3}
        className="text-[0.9375rem] text-slate-600 leading-relaxed bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-slate-400 transition-colors w-full resize-none"
        style={{ fieldSizing: 'content' } as any}
      />
    </div>
  );

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
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
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-52"
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Layout</p>
              <div className="flex gap-1.5 mb-3">
                {[['left', 'Avatar Left'], ['right', 'Avatar Right']].map(([v, l]) => (
                  <button key={v} onMouseDown={(e) => e.preventDefault()} onClick={() => updateAttributes({ layout: v })}
                    className={`flex-1 py-1 text-xs rounded border transition-all ${layout === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'}`}
                  >{l}</button>
                ))}
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Accent Color</p>
              <div className="flex items-center gap-2">
                <input type="color" value={accentColor} onChange={(e) => updateAttributes({ accentColor: e.target.value })} className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
                <span className="text-xs text-slate-400 font-mono">{accentColor}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-2xl border-2 bg-white shadow-sm transition-all ${selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
        <div className="flex items-center gap-8 p-6">
          {layout === 'right' ? <>{textCol}{avatarEl}</> : <>{avatarEl}{textCol}</>}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const AboutMe = Node.create({
  name: 'aboutMe',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      avatar: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-avatar') || '',
        renderHTML: (attrs) => (attrs.avatar ? { 'data-avatar': attrs.avatar } : {}),
      },
      name: {
        default: 'Your Name',
        parseHTML: (el) => el.getAttribute('data-name') || 'Your Name',
        renderHTML: (attrs) => ({ 'data-name': attrs.name }),
      },
      role: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-role') || '',
        renderHTML: (attrs) => (attrs.role ? { 'data-role': attrs.role } : {}),
      },
      bio: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-bio') || '',
        renderHTML: (attrs) => (attrs.bio ? { 'data-bio': attrs.bio } : {}),
      },
      accentColor: {
        default: '#6366f1',
        parseHTML: (el) => el.getAttribute('data-accent-color') || '#6366f1',
        renderHTML: (attrs) => ({ 'data-accent-color': attrs.accentColor }),
      },
      layout: {
        default: 'left',
        parseHTML: (el) => el.getAttribute('data-layout') || 'left',
        renderHTML: (attrs) => ({ 'data-layout': attrs.layout }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="about-me"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'about-me' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AboutMeNodeView);
  },
});
