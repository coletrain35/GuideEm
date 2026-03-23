import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef } from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const AboutMeNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { avatar, name, role, bio, accentColor, layout } = node.attrs;

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const avatarEl = avatar ? (
    <img
      src={avatar}
      alt={name}
      className="w-28 h-28 rounded-full object-cover block"
    />
  ) : (
    <div
      className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold tracking-tight"
      style={{ background: accentColor, color: '#fff' }}
    >
      {initials || '?'}
    </div>
  );

  const avatarCol = (
    <div className="flex-shrink-0">
      {avatarEl}
    </div>
  );

  const textCol = (
    <div className="flex-1 min-w-0">
      <div className="text-xl font-extrabold leading-tight mb-1" style={{ color: accentColor }}>
        {name || 'Your Name'}
      </div>
      {role && (
        <div className="text-sm font-medium text-slate-500 mb-2">{role}</div>
      )}
      {bio && (
        <p className="text-[0.9375rem] text-slate-600 leading-relaxed m-0">{bio}</p>
      )}
      {!role && !bio && (
        <p className="text-sm text-slate-300 italic m-0">Add your role and bio below</p>
      )}
    </div>
  );

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div
        className={`rounded-2xl border-2 bg-white shadow-sm transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
        }`}
      >
        {/* Preview */}
        <div className="flex items-center gap-8 p-6">
          {layout === 'right' ? (
            <>
              {textCol}
              {avatarCol}
            </>
          ) : (
            <>
              {avatarCol}
              {textCol}
            </>
          )}
        </div>

        {/* Edit Panel */}
        {selected && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Name</label>
                <input
                  value={name}
                  onChange={(e) => updateAttributes({ name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Accent Color</label>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => updateAttributes({ accentColor: e.target.value })}
                  className="w-full h-[30px] cursor-pointer rounded border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Role</label>
              <input
                value={role}
                onChange={(e) => updateAttributes({ role: e.target.value })}
                placeholder="Your Role"
                className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => updateAttributes({ bio: e.target.value })}
                placeholder="Write a short bio about yourself..."
                rows={4}
                className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 resize-none bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Layout</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateAttributes({ layout: 'left' })}
                  className={`px-3 py-1 text-sm rounded border transition-colors ${
                    layout === 'left'
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  Avatar Left
                </button>
                <button
                  onClick={() => updateAttributes({ layout: 'right' })}
                  className={`px-3 py-1 text-sm rounded border transition-colors ${
                    layout === 'right'
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                      : 'border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  Avatar Right
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 block mb-0.5">Avatar</label>
              <div className="flex gap-2">
                <input
                  value={avatar?.startsWith('data:') ? '' : avatar}
                  onChange={(e) => updateAttributes({ avatar: e.target.value })}
                  placeholder="https://... or upload an image"
                  className="flex-1 px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-indigo-400 bg-white"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 text-sm border rounded border-slate-200 text-slate-600 hover:bg-white transition-colors"
                >
                  Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              {avatar && (
                <button
                  onClick={() => updateAttributes({ avatar: '' })}
                  className="text-xs text-red-400 hover:text-red-600 mt-1"
                >
                  Remove avatar
                </button>
              )}
            </div>
          </div>
        )}
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
