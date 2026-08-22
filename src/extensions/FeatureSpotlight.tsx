import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Plus, X, Paintbrush } from 'lucide-react';
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
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

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
      className="relative rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer border border-slate-200 shadow-sm"
      style={{ background: gradient, minHeight: '280px' }}
      onClick={() => !image && fileInputRef.current?.click()}
    >
      {image ? (
        <img src={image} alt={title} className="w-full h-full object-cover absolute inset-0" />
      ) : (
        <div className="flex flex-col items-center gap-3 text-white/70">
          <input
            value={icon}
            onChange={e => updateAttributes({ icon: e.target.value })}
            placeholder="🚀"
            onClick={e => e.stopPropagation()}
            className="w-14 text-center text-4xl bg-transparent border border-transparent hover:border-white/30 focus:border-white/50 outline-none rounded transition-all"
          />
          <span className="text-sm opacity-70">Click to add image</span>
        </div>
      )}
      {image && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            className="px-2.5 py-1 text-xs bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          >
            Change
          </button>
          <button
            className="px-2.5 py-1 text-xs bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-colors backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); updateAttributes({ image: '' }); }}
          >
            Remove
          </button>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  );

  const contentPanel = (
    <div className="flex flex-col justify-center py-4 space-y-4">
      {/* Title */}
      <input
        value={title}
        onChange={e => updateAttributes({ title: e.target.value })}
        placeholder="Feature Title"
        className="text-2xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none transition-colors w-full"
      />

      {/* Description */}
      <textarea
        value={description}
        onChange={e => updateAttributes({ description: e.target.value })}
        placeholder="Describe the main value proposition here."
        rows={3}
        className="text-slate-600 leading-relaxed text-base bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none resize-none w-full"
        style={{ fieldSizing: 'content' } as any}
      />

      {/* Bullets List */}
      <div className="space-y-2.5">
        {parsedBullets.map((b, i) => (
          <div key={i} className="flex items-start gap-3 group/bullet">
            <span
              className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold select-none"
              style={{ background: accentColor }}
            >
              ✓
            </span>
            <input
              value={b}
              onChange={e => updateBullet(i, e.target.value)}
              placeholder="Feature point"
              className="text-slate-700 text-sm leading-relaxed bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none flex-1"
            />
            <button
              onClick={() => removeBullet(i)}
              className="text-slate-300 hover:text-red-500 opacity-0 group-hover/bullet:opacity-100 transition-opacity flex-shrink-0 self-center"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        <button
          onClick={addBullet}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors mt-2"
        >
          <Plus size={12} /> Add Bullet
        </button>
      </div>
    </div>
  );

  return (
    <NodeViewWrapper className="group/block relative my-10" contentEditable={false}>
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
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Layout</p>
                <div className="flex gap-1.5">
                  {[['image-left', 'Image Left'], ['image-right', 'Image Right']].map(([v, l]) => (
                    <button
                      key={v}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ layout: v })}
                      className={`flex-1 py-1 text-[10px] rounded border transition-all ${layout === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Gradient Background</p>
                <div className="flex gap-1.5 flex-wrap">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g.label}
                      title={g.label}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ gradient: g.value })}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${gradient === g.value ? 'border-indigo-600 scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ background: g.value }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Accent Color (Checks)</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                    value={accentColor || '#6366f1'}
                    onChange={(e) => updateAttributes({ accentColor: e.target.value })}
                  />
                  <span className="text-xs text-slate-400 font-mono">{accentColor}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`grid gap-10 items-center p-4 rounded-2xl border transition-all ${selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-transparent'}`} style={{ gridTemplateColumns: '1fr 1fr' }}>
        {isReversed ? <>{contentPanel}{visualPanel}</> : <>{visualPanel}{contentPanel}</>}
      </div>
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
