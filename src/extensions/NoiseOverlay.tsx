import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useMemo } from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

// Generate an inline SVG noise pattern as a data URL
const buildNoiseSvg = (opacity: number, density: number): string => {
  // turbulence frequency controls density of grain
  const freq = 0.4 + (density / 100) * 0.6;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(#n)' opacity='${opacity}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
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

  const bg = BG_PRESETS[parseInt(bgPreset) ?? 0] ?? BG_PRESETS[0];
  const noiseBg = useMemo(() => buildNoiseSvg(parseFloat(noiseOpacity) || 0.15, parseInt(noiseDensity) || 50), [noiseOpacity, noiseDensity]);
  const h = height === 'sm' ? '180px' : height === 'lg' ? '380px' : '280px';

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      <div
        className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center"
        style={{ backgroundColor: bg.value, minHeight: h }}
      >
        {/* Noise texture layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: noiseBg, backgroundRepeat: 'repeat', backgroundSize: '200px 200px' }}
        />

        {/* Content */}
        <div className="relative z-10 px-8 py-12">
          {title && (
            <p className="text-2xl font-bold mb-2" style={{ color: bg.dark ? '#f1f5f9' : '#0f172a' }}>
              {title}
            </p>
          )}
          {subtitle && (
            <p className="text-base opacity-70" style={{ color: bg.dark ? '#cbd5e1' : '#475569' }}>
              {subtitle}
            </p>
          )}
          {!title && !subtitle && (
            <p className="text-sm opacity-40" style={{ color: bg.dark ? '#94a3b8' : '#64748b' }}>
              Noise/grain texture overlay — add title & subtitle in settings
            </p>
          )}
        </div>
      </div>

      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Noise / Grain Texture</p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Title</label>
              <input value={title} onChange={e => updateAttributes({ title: e.target.value })}
                placeholder="Section title" className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Subtitle</label>
              <input value={subtitle} onChange={e => updateAttributes({ subtitle: e.target.value })}
                placeholder="Supporting text" className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Background</label>
              <div className="flex gap-1.5">
                {BG_PRESETS.map((p, i) => (
                  <button key={i} onClick={() => updateAttributes({ bgPreset: String(i) })}
                    title={p.label}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${bgPreset === String(i) ? 'border-indigo-500 scale-110' : 'border-slate-200'}`}
                    style={{ backgroundColor: p.value }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Grain opacity: {Math.round(parseFloat(noiseOpacity) * 100)}%</label>
              <input type="range" min="0.05" max="0.5" step="0.05" value={noiseOpacity}
                onChange={e => updateAttributes({ noiseOpacity: e.target.value })}
                className="w-28" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Grain density: {noiseDensity}</label>
              <input type="range" min="10" max="100" step="10" value={noiseDensity}
                onChange={e => updateAttributes({ noiseDensity: e.target.value })}
                className="w-28" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Height</label>
              <select value={height} onChange={e => updateAttributes({ height: e.target.value })}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700">
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </div>
        </div>
      )}
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
