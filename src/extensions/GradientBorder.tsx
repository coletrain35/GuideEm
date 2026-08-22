import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Paintbrush } from 'lucide-react';
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
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const colors = PRESETS[parseInt(preset) ?? 0]?.colors ?? PRESETS[0].colors;
  const gradient = `linear-gradient(135deg, ${colors.join(', ')})`;
  const dur = animSpeed === 'fast' ? '2s' : animSpeed === 'slow' ? '6s' : '3.5s';
  const br = borderRadius === 'sm' ? '12px' : borderRadius === 'lg' ? '24px' : '16px';
  const bw = parseInt(borderWidth) || 2;

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Floating Style/Settings Toolbar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-30 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        <div ref={styleRef} className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowStyle(!showStyle)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${showStyle ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Paintbrush size={14} /> Style Border
          </button>
          {showStyle && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-56 space-y-3"
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Gradient Preset</label>
                <div className="flex gap-1.5 flex-wrap">
                  {PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ preset: String(i) })}
                      title={p.label}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${preset === String(i) ? 'border-indigo-650 scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ background: `linear-gradient(135deg, ${p.colors.join(', ')})` }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Speed</label>
                <select
                  value={animSpeed}
                  onChange={e => updateAttributes({ animSpeed: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none"
                >
                  <option value="slow">Slow</option>
                  <option value="medium">Medium</option>
                  <option value="fast">Fast</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Border Width</label>
                <select
                  value={borderWidth}
                  onChange={e => updateAttributes({ borderWidth: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none"
                >
                  <option value="1">Thin (1px)</option>
                  <option value="2">Medium (2px)</option>
                  <option value="3">Thick (3px)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Corner Radius</label>
                <select
                  value={borderRadius}
                  onChange={e => updateAttributes({ borderRadius: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none"
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animated gradient border via padding trick */}
      <div
        className={`p-[2px] rounded-2xl transition-all ${
          selected ? 'ring-2 ring-indigo-150' : ''
        }`}
        style={{
          background: gradient,
          backgroundSize: '200% 200%',
          animation: `gradient-shift ${dur} ease infinite`,
          borderRadius: br,
          padding: `${bw}px`,
        }}
      >
        <div
          className="rounded-2xl bg-white p-8 text-center flex flex-col items-center justify-center space-y-2"
          style={{ borderRadius: `calc(${br} - ${bw}px)` }}
        >
          {/* Title Input */}
          <input
            value={title}
            onChange={e => updateAttributes({ title: e.target.value })}
            placeholder="Your title here"
            className="text-2xl font-bold text-slate-800 text-center w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 outline-none py-0.5 transition-colors"
          />

          {/* Description Textarea */}
          <textarea
            value={description}
            onChange={e => updateAttributes({ description: e.target.value })}
            placeholder="Add a description for this highlighted block."
            rows={1}
            className="text-slate-500 text-sm text-center w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 outline-none py-0.5 resize-none transition-colors"
            style={{ fieldSizing: 'content' } as any}
          />
        </div>
      </div>

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
