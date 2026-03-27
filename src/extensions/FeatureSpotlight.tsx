import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef } from 'react';
import { Image as ImageIcon, Plus, X } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const GRADIENT_PRESETS = [
  { label: 'Indigo', value: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' },
  { label: 'Cyan', value: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
  { label: 'Emerald', value: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { label: 'Rose', value: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)' },
  { label: 'Amber', value: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' },
  { label: 'Slate', value: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' },
];

const FeatureSpotlightNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { image, icon, title, description, bullets, layout, gradient, accentColor } = node.attrs;

  const parsedBullets: string[] = (() => {
    try { return JSON.parse(bullets); } catch { return []; }
  })();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isReversed = layout === 'image-right';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateAttributes({ image: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const updateBullet = (i: number, val: string) => {
    const next = [...parsedBullets];
    next[i] = val;
    updateAttributes({ bullets: JSON.stringify(next) });
  };
  const addBullet = () => updateAttributes({ bullets: JSON.stringify([...parsedBullets, 'New feature point']) });
  const removeBullet = (i: number) => updateAttributes({ bullets: JSON.stringify(parsedBullets.filter((_, idx) => idx !== i)) });

  const visualPanel = (
    <div
      className="relative rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer"
      style={{ background: gradient, minHeight: '280px' }}
      onClick={() => !image && fileInputRef.current?.click()}
    >
      {image ? (
        <img src={image} alt={title} className="w-full h-full object-cover absolute inset-0" />
      ) : (
        <div className="flex flex-col items-center gap-3 text-white/70">
          {icon ? <span style={{ fontSize: '4rem' }}>{icon}</span> : <ImageIcon size={48} className="opacity-50" />}
          <span className="text-sm opacity-70">Click to add image</span>
        </div>
      )}
      {image && (
        <button
          className="absolute bottom-3 right-3 px-2.5 py-1 text-xs bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
        >
          Change
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  );

  const contentPanel = (
    <div className="flex flex-col justify-center py-4">
      <h2 className="text-2xl font-bold text-slate-900 mb-3 mt-0 leading-tight">
        {title || 'Feature Title'}
      </h2>
      <p className="text-slate-600 mb-5 leading-relaxed text-base m-0">
        {description || 'Describe the main value proposition here.'}
      </p>
      {parsedBullets.length > 0 && (
        <ul className="space-y-2.5 list-none p-0 m-0">
          {parsedBullets.map((b, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                style={{ background: accentColor }}
              >
                ✓
              </span>
              <span className="text-slate-700 text-sm leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <NodeViewWrapper className="group/block relative my-10" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div className="grid gap-10 items-center" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {isReversed ? <>{contentPanel}{visualPanel}</> : <>{visualPanel}{contentPanel}</>}
      </div>

      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Title</label>
              <input
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={title || ''}
                onChange={(e) => updateAttributes({ title: e.target.value })}
                placeholder="Feature Title"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Icon (emoji)</label>
              <input
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={icon || ''}
                onChange={(e) => updateAttributes({ icon: e.target.value })}
                placeholder="🚀"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Description</label>
            <textarea
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
              rows={2}
              value={description || ''}
              onChange={(e) => updateAttributes({ description: e.target.value })}
              placeholder="Describe the feature..."
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-500">Bullet Points</label>
              <button onClick={addBullet} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
                <Plus size={12} /> Add
              </button>
            </div>
            {parsedBullets.map((b, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <input
                  className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={b}
                  onChange={(e) => updateBullet(i, e.target.value)}
                />
                <button onClick={() => removeBullet(i)} className="text-slate-400 hover:text-red-500 flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Layout</label>
              <div className="flex gap-1">
                {[['image-left', 'Image Left'], ['image-right', 'Image Right']].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => updateAttributes({ layout: v })}
                    className={`px-2 py-1 text-xs rounded border transition-all ${layout === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Gradient</label>
              <div className="flex gap-1.5">
                {GRADIENT_PRESETS.map((g) => (
                  <button
                    key={g.label}
                    title={g.label}
                    onClick={() => updateAttributes({ gradient: g.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${gradient === g.value ? 'border-indigo-600 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ background: g.value }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Accent</label>
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                value={accentColor || '#6366f1'}
                onChange={(e) => updateAttributes({ accentColor: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const FeatureSpotlight = Node.create({
  name: 'featureSpotlight',
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
      icon: {
        default: '🚀',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-icon') || '🚀',
        renderHTML: (attrs: any) => ({ 'data-icon': attrs.icon }),
      },
      title: {
        default: 'Powerful Feature',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-title') || 'Powerful Feature',
        renderHTML: (attrs: any) => ({ 'data-title': attrs.title }),
      },
      description: {
        default: 'Describe what makes this feature compelling and how it helps users accomplish their goals faster.',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-description') || '',
        renderHTML: (attrs: any) => ({ 'data-description': attrs.description }),
      },
      bullets: {
        default: '["Built for performance","Fully customizable","Works out of the box"]',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-bullets') || '[]',
        renderHTML: (attrs: any) => ({ 'data-bullets': attrs.bullets }),
      },
      layout: {
        default: 'image-left',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-layout') || 'image-left',
        renderHTML: (attrs: any) => ({ 'data-layout': attrs.layout }),
      },
      gradient: {
        default: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-gradient') || 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        renderHTML: (attrs: any) => ({ 'data-gradient': attrs.gradient }),
      },
      accentColor: {
        default: '#6366f1',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-accent-color') || '#6366f1',
        renderHTML: (attrs: any) => ({ 'data-accent-color': attrs.accentColor }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="feature-spotlight"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'feature-spotlight' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FeatureSpotlightNodeView);
  },
});
