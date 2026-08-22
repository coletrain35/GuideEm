import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useMemo, useRef, useState } from 'react';
import { Paintbrush } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

// Generate a canvas-based grayscale noise pattern as a PNG data URL.
const buildNoiseDataUrl = (opacity: number, density: number): string => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const blockSize = Math.max(1, Math.round(8 - (density / 100) * 7));
  const alpha = Math.floor(opacity * 255);

  for (let y = 0; y < size; y += blockSize) {
    for (let x = 0; x < size; x += blockSize) {
      const value = Math.floor(Math.random() * 255);
      for (let dy = 0; dy < blockSize && y + dy < size; dy++) {
        for (let dx = 0; dx < blockSize && x + dx < size; dx++) {
          const idx = ((y + dy) * size + (x + dx)) * 4;
          data[idx] = value;
          data[idx + 1] = value;
          data[idx + 2] = value;
          data[idx + 3] = alpha;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return `url("${canvas.toDataURL('image/png')}")`;
};

const BG_PRESETS: { label: string; value: string; dark: boolean }[] = [
  { label: 'White', value: '#ffffff', dark: false },
  { label: 'Light Gray', value: '#f8fafc', dark: false },
  { label: 'Warm Cream', value: '#fefce8', dark: false },
  { label: 'Slate 900', value: '#0f172a', dark: true },
  { label: 'Dark Gray', value: '#1c1c1e', dark: true },
  { label: 'Indigo', value: '#1e1b4b', dark: true },
];

const NoiseOverlayNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { bgPreset, noiseOpacity, noiseDensity, title, subtitle, height } = node.attrs;
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const bg = BG_PRESETS[parseInt(bgPreset) ?? 0] ?? BG_PRESETS[0];
  const noiseBg = useMemo(() => buildNoiseDataUrl(parseFloat(noiseOpacity) || 0.15, parseInt(noiseDensity) || 50), [noiseOpacity, noiseDensity]);
  const h = height === 'sm' ? '180px' : height === 'lg' ? '380px' : '280px';

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
            <Paintbrush size={14} /> Style Noise
          </button>
          {showStyle && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-56 space-y-3"
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Background Presets</label>
                <div className="flex gap-1.5 flex-wrap">
                  {BG_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ bgPreset: String(i) })}
                      title={p.label}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${bgPreset === String(i) ? 'border-indigo-650 scale-110' : 'border-slate-200 hover:scale-105'}`}
                      style={{ backgroundColor: p.value }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Grain Opacity: {Math.round(parseFloat(noiseOpacity) * 100)}%
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={noiseOpacity}
                  onChange={e => updateAttributes({ noiseOpacity: e.target.value })}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Grain Density: {noiseDensity}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={noiseDensity}
                  onChange={e => updateAttributes({ noiseDensity: e.target.value })}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
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
            </div>
          )}
        </div>
      </div>

      <div
        className={`relative rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center transition-all ${
          selected ? 'ring-2 ring-indigo-200' : ''
        }`}
        style={{ backgroundColor: bg.value, minHeight: h }}
      >
        {/* Noise texture layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: noiseBg, backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }}
        />

        {/* Content (fully inline editing fields) */}
        <div className="relative z-10 px-8 py-12 w-full max-w-xl flex flex-col items-center justify-center space-y-2">
          {/* Title Input */}
          <input
            value={title}
            onChange={e => updateAttributes({ title: e.target.value })}
            placeholder="Section Title"
            className="text-2xl font-bold text-center w-full bg-transparent border-b border-transparent hover:border-slate-450 focus:border-indigo-400 outline-none py-0.5 transition-colors"
            style={{ color: bg.dark ? '#f1f5f9' : '#0f172a' }}
          />

          {/* Subtitle Textarea */}
          <textarea
            value={subtitle}
            onChange={e => updateAttributes({ subtitle: e.target.value })}
            placeholder="Add supporting subtitle text..."
            rows={1}
            className="text-base text-center w-full bg-transparent border-b border-transparent hover:border-slate-450 focus:border-indigo-400 outline-none py-0.5 resize-none transition-colors"
            style={{
              color: bg.dark ? '#cbd5e1' : '#475569',
              opacity: 0.85,
              fieldSizing: 'content',
            } as any}
          />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const NoiseOverlay = Node.create({
  name: 'noiseOverlay',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      bgPreset: {
        default: '0',
        parseHTML: el => el.getAttribute('data-bg-preset') || '0',
        renderHTML: attrs => ({ 'data-bg-preset': attrs.bgPreset }),
      },
      noiseOpacity: {
        default: '0.15',
        parseHTML: el => el.getAttribute('data-noise-opacity') || '0.15',
        renderHTML: attrs => ({ 'data-noise-opacity': attrs.noiseOpacity }),
      },
      noiseDensity: {
        default: '50',
        parseHTML: el => el.getAttribute('data-noise-density') || '50',
        renderHTML: attrs => ({ 'data-noise-density': attrs.noiseDensity }),
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
    };
  },

  parseHTML() { return [{ tag: 'div[data-type="noise-overlay"]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'noise-overlay' })];
  },
  addNodeView() { return ReactNodeViewRenderer(NoiseOverlayNodeView); },
});
