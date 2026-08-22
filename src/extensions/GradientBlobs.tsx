import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useEffect, useRef, useState } from 'react';
import { Paintbrush } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

interface Blob {
  color: string;
  size: number;   // % of container width
  x: number;     // % left
  y: number;     // % top
  opacity: number;
}

const PRESETS: { label: string; blobs: Blob[]; bg: string }[] = [
  {
    label: 'Aurora',
    bg: '#0f0f1a',
    blobs: [
      { color: '#6366f1', size: 60, x: 10, y: 5, opacity: 0.5 },
      { color: '#ec4899', size: 55, x: 55, y: 15, opacity: 0.45 },
      { color: '#8b5cf6', size: 45, x: 30, y: 50, opacity: 0.4 },
    ],
  },
  {
    label: 'Ocean',
    bg: '#0c1a2e',
    blobs: [
      { color: '#06b6d4', size: 65, x: 5, y: 10, opacity: 0.5 },
      { color: '#3b82f6', size: 55, x: 50, y: 5, opacity: 0.45 },
      { color: '#6366f1', size: 50, x: 25, y: 55, opacity: 0.4 },
    ],
  },
  {
    label: 'Sunset',
    bg: '#1a0a0a',
    blobs: [
      { color: '#f59e0b', size: 55, x: 10, y: 20, opacity: 0.45 },
      { color: '#ef4444', size: 60, x: 55, y: 5, opacity: 0.5 },
      { color: '#ec4899', size: 45, x: 35, y: 55, opacity: 0.4 },
    ],
  },
  {
    label: 'Forest',
    bg: '#0a1a0f',
    blobs: [
      { color: '#10b981', size: 60, x: 5, y: 5, opacity: 0.45 },
      { color: '#06b6d4', size: 50, x: 55, y: 20, opacity: 0.4 },
      { color: '#3b82f6', size: 55, x: 25, y: 50, opacity: 0.35 },
    ],
  },
  {
    label: 'Minimal',
    bg: '#f8fafc',
    blobs: [
      { color: '#6366f1', size: 50, x: 5, y: 5, opacity: 0.2 },
      { color: '#ec4899', size: 45, x: 60, y: 15, opacity: 0.18 },
      { color: '#8b5cf6', size: 40, x: 30, y: 55, opacity: 0.15 },
    ],
  },
];

const GradientBlobsNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { preset, title, subtitle, height, animate } = node.attrs;
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const p = PRESETS[parseInt(preset) ?? 0] ?? PRESETS[0];
  const isDark = p.bg.startsWith('#0') || p.bg.startsWith('#1');
  const h = height === 'sm' ? '200px' : height === 'lg' ? '400px' : '300px';

  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
            <Paintbrush size={14} /> Style Background
          </button>
          {showStyle && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-52 space-y-3"
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Color Preset</label>
                <div className="flex gap-1.5 flex-wrap">
                  {PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ preset: String(i) })}
                      title={p.label}
                      className={`w-7 h-7 rounded-lg border-2 overflow-hidden transition-all ${preset === String(i) ? 'border-indigo-600 scale-110' : 'border-slate-200 hover:scale-105'}`}
                      style={{ backgroundColor: p.bg }}
                    >
                      <div className="w-full h-full" style={{
                        background: `radial-gradient(circle at 30% 30%, ${p.blobs[0].color}88, transparent 70%),
                                     radial-gradient(circle at 70% 70%, ${p.blobs[1].color}88, transparent 70%)`
                      }} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Height</label>
                <select
                  value={height}
                  onChange={e => updateAttributes({ height: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none"
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="blob-animate"
                  checked={animate}
                  onChange={e => updateAttributes({ animate: e.target.checked })}
                  className="rounded text-indigo-650 focus:ring-indigo-400 cursor-pointer"
                />
                <label htmlFor="blob-animate" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">Animate Blobs</label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center transition-all ${
          selected ? 'ring-2 ring-indigo-200' : ''
        }`}
        style={{ backgroundColor: p.bg, minHeight: h }}
      >
        {/* Blobs */}
        {p.blobs.map((blob, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{
              width: `${blob.size}%`,
              paddingTop: `${blob.size}%`,
              left: `${blob.x}%`,
              top: `${blob.y}%`,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              backgroundColor: blob.color,
              opacity: blob.opacity,
              filter: 'blur(80px)',
              willChange: 'transform',
              animation: animate ? `blob-drift-${i % 3} ${8 + i * 2}s ease-in-out infinite` : undefined,
              animationPlayState: (animate && isVisible) ? 'running' : 'paused',
            }}
          />
        ))}

        {/* Content Panel (inline editing fields!) */}
        <div className="relative z-10 px-8 py-12 w-full max-w-xl flex flex-col items-center justify-center space-y-2">
          {/* Title Input */}
          <input
            value={title}
            onChange={e => updateAttributes({ title: e.target.value })}
            placeholder="Section Title"
            className="text-2xl font-bold text-center w-full bg-transparent border-b border-transparent hover:border-slate-400 focus:border-indigo-400 outline-none py-0.5 transition-colors"
            style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
          />

          {/* Subtitle Textarea */}
          <textarea
            value={subtitle}
            onChange={e => updateAttributes({ subtitle: e.target.value })}
            placeholder="Add supporting subtitle text..."
            rows={1}
            className="text-base text-center w-full bg-transparent border-b border-transparent hover:border-slate-400 focus:border-indigo-400 outline-none py-0.5 resize-none transition-colors"
            style={{
              color: isDark ? '#cbd5e1' : '#475569',
              opacity: 0.85,
              fieldSizing: 'content',
            } as any}
          />
        </div>
      </div>

      <style>{`
        @keyframes blob-drift-0 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-45%, -55%) scale(1.1); }
        }
        @keyframes blob-drift-1 {
          0%, 100% { transform: translate(-50%, -50%) scale(1.05); }
          50% { transform: translate(-55%, -45%) scale(0.95); }
        }
        @keyframes blob-drift-2 {
          0%, 100% { transform: translate(-50%, -50%) scale(0.95); }
          50% { transform: translate(-48%, -52%) scale(1.08); }
        }
      `}</style>
    </NodeViewWrapper>
  );
};

export const GradientBlobs = Node.create({
  name: 'gradientBlobs',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      preset: {
        default: '0',
        parseHTML: el => el.getAttribute('data-preset') || '0',
        renderHTML: attrs => ({ 'data-preset': attrs.preset }),
      },
      title: {
        default: '',
        parseHTML: el => el.getAttribute('data-title') || '',
        renderHTML: attrs => ({ 'data-title': attrs.title }),
      },
      subtitle: {
        default: '',
        parseHTML: el => el.getAttribute('data-subtitle') || '',
        renderHTML: attrs => ({ 'data-subtitle': attrs.subtitle }),
      },
      height: {
        default: 'md',
        parseHTML: el => el.getAttribute('data-height') || 'md',
        renderHTML: attrs => ({ 'data-height': attrs.height }),
      },
      animate: {
        default: true,
        parseHTML: el => el.getAttribute('data-animate') !== 'false',
        renderHTML: attrs => ({ 'data-animate': String(attrs.animate) }),
      },
    };
  },

  parseHTML() { return [{ tag: 'div[data-type="gradient-blobs"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'gradient-blobs' })];
  },
  addNodeView() { return ReactNodeViewRenderer(GradientBlobsNodeView); },
});
