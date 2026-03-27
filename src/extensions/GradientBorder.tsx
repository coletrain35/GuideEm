import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const PRESETS = [
  { label: 'Aurora', colors: ['#6366f1', '#8b5cf6', '#ec4899'] },
  { label: 'Sunset', colors: ['#f59e0b', '#ef4444', '#ec4899'] },
  { label: 'Ocean', colors: ['#06b6d4', '#3b82f6', '#6366f1'] },
  { label: 'Forest', colors: ['#10b981', '#06b6d4', '#3b82f6'] },
  { label: 'Gold', colors: ['#fbbf24', '#f59e0b', '#d97706'] },
  { label: 'Mono', colors: ['#64748b', '#94a3b8', '#cbd5e1'] },
];

const GradientBorderNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { title, description, preset, borderWidth, animSpeed, borderRadius } = node.attrs;

  const colors = PRESETS[parseInt(preset) ?? 0]?.colors ?? PRESETS[0].colors;
  const gradient = `linear-gradient(135deg, ${colors.join(', ')})`;
  const dur = animSpeed === 'fast' ? '2s' : animSpeed === 'slow' ? '6s' : '3.5s';
  const br = borderRadius === 'sm' ? '12px' : borderRadius === 'lg' ? '24px' : '16px';
  const bw = parseInt(borderWidth) || 2;

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Animated gradient border via padding trick */}
      <div
        className="p-[2px] rounded-2xl"
        style={{
          background: gradient,
          backgroundSize: '200% 200%',
          animation: `gradient-shift ${dur} ease infinite`,
          borderRadius: br,
          padding: `${bw}px`,
        }}
      >
        <div
          className="rounded-2xl bg-white p-8 text-center"
          style={{ borderRadius: `calc(${br} - ${bw}px)` }}
        >
          <p className="text-2xl font-bold text-slate-800 mb-2">{title || 'Your title here'}</p>
          <p className="text-slate-500">{description || 'Add a description for this highlighted block.'}</p>
        </div>
      </div>

      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Gradient Border</p>

          <div className="space-y-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Title</label>
              <input value={title} onChange={e => updateAttributes({ title: e.target.value })}
                placeholder="Title text" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Description</label>
              <input value={description} onChange={e => updateAttributes({ description: e.target.value })}
                placeholder="Description" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Gradient</label>
              <div className="flex gap-1">
                {PRESETS.map((p, i) => (
                  <button key={i} onClick={() => updateAttributes({ preset: String(i) })}
                    title={p.label}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${preset === String(i) ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                    style={{ background: `linear-gradient(135deg, ${p.colors.join(', ')})` }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Speed</label>
              <select value={animSpeed} onChange={e => updateAttributes({ animSpeed: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Border Width</label>
              <select value={borderWidth} onChange={e => updateAttributes({ borderWidth: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value="1">Thin (1px)</option>
                <option value="2">Medium (2px)</option>
                <option value="3">Thick (3px)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Radius</label>
              <select value={borderRadius} onChange={e => updateAttributes({ borderRadius: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </NodeViewWrapper>
  );
};

export const GradientBorder = Node.create({
  name: 'gradientBorder',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'Your title here',
        parseHTML: el => el.getAttribute('data-title') || '',
        renderHTML: attrs => ({ 'data-title': attrs.title }),
      },
      description: {
        default: 'Add a description for this highlighted block.',
        parseHTML: el => el.getAttribute('data-description') || '',
        renderHTML: attrs => ({ 'data-description': attrs.description }),
      },
      preset: {
        default: '0',
        parseHTML: el => el.getAttribute('data-preset') || '0',
        renderHTML: attrs => ({ 'data-preset': attrs.preset }),
      },
      borderWidth: {
        default: '2',
        parseHTML: el => el.getAttribute('data-border-width') || '2',
        renderHTML: attrs => ({ 'data-border-width': attrs.borderWidth }),
      },
      animSpeed: {
        default: 'medium',
        parseHTML: el => el.getAttribute('data-anim-speed') || 'medium',
        renderHTML: attrs => ({ 'data-anim-speed': attrs.animSpeed }),
      },
      borderRadius: {
        default: 'md',
        parseHTML: el => el.getAttribute('data-border-radius') || 'md',
        renderHTML: attrs => ({ 'data-border-radius': attrs.borderRadius }),
      },
    };
  },

  parseHTML() { return [{ tag: 'div[data-type="gradient-border"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'gradient-border' })];
  },
  addNodeView() { return ReactNodeViewRenderer(GradientBorderNodeView); },
});
