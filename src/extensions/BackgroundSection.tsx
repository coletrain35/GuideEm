import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState, useEffect, useRef } from 'react';
import { Paintbrush, Trash2 } from 'lucide-react';
import { SECTION_BG_PRESETS, getSectionBgPreset } from '../utils/backgroundPresets';

const BackgroundSectionNodeView = (props: any) => {
  const { node, updateAttributes, deleteNode } = props;
  const { bgPreset, padding, borderRadius } = node.attrs;
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const preset = getSectionBgPreset(bgPreset);
  const isDark = preset?.dark ?? false;
  const textColor = bgPreset === 'brand-tint' ? 'var(--brand-text-color)' : isDark ? '#f8fafc' : undefined;
  const textColorAttr = bgPreset === 'brand-tint' ? 'brand' : isDark ? 'light' : undefined;

  const paddingMap: Record<string, string> = { sm: '1rem', md: '2rem', lg: '3rem' };
  const radiusMap: Record<string, string> = { none: '0', md: '0.75rem', lg: '1.5rem' };
  const resolvedRadius = radiusMap[borderRadius] || '0.75rem';

  useEffect(() => {
    if (!showPanel) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as HTMLElement)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPanel]);

  return (
    <NodeViewWrapper
      className="background-section group/block relative my-8"
      data-text-color={textColorAttr}
      style={{
        color: textColor,
        borderRadius: resolvedRadius,
        backgroundColor: preset?.backgroundColor,
        backgroundImage: preset?.backgroundImage,
        backgroundSize: preset?.backgroundSize,
        backgroundRepeat: 'repeat',
        outline: bgPreset === 'none' ? '2px dashed rgba(148,163,184,0.5)' : undefined,
        outlineOffset: bgPreset === 'none' ? '0px' : undefined,
      }}
    >
      {/* Style button + popover — not editable */}
      <div
        ref={panelRef}
        className="absolute top-2 right-2 z-10"
        contentEditable={false}
      >
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowPanel((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border shadow-sm transition-all
            ${showPanel
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white/90 backdrop-blur-sm text-slate-600 border-slate-200 opacity-0 group-hover/block:opacity-100 hover:bg-white hover:text-slate-900'
            }`}
        >
          <Paintbrush size={12} />
          Style
        </button>

        {showPanel && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute top-full right-0 mt-1.5 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-60"
          >
            {/* Background */}
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Background</p>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {SECTION_BG_PRESETS.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-0.5">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => updateAttributes({ bgPreset: p.id })}
                    title={p.name}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-105
                      ${bgPreset === p.id
                        ? 'border-blue-500 ring-1 ring-blue-300 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                    style={{
                      backgroundColor:
                        p.id === 'none' ? '#f1f5f9'
                        : (p.backgroundColor || 'transparent'),
                      backgroundImage: p.backgroundImage || undefined,
                      backgroundSize: p.backgroundSize || undefined,
                    }}
                  />
                  <span className="text-[9px] text-slate-400 leading-tight text-center truncate w-full">{p.name}</span>
                </div>
              ))}
            </div>

            {/* Padding */}
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Padding</p>
            <div className="flex gap-1 mb-3">
              {(['sm', 'md', 'lg'] as const).map((p) => (
                <button
                  key={p}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateAttributes({ padding: p })}
                  className={`flex-1 py-1 text-xs rounded-lg border transition-colors
                    ${padding === p
                      ? 'border-slate-800 bg-slate-800 text-white font-medium'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Corners */}
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Corners</p>
            <div className="flex gap-1 mb-3">
              {(['none', 'md', 'lg'] as const).map((r) => (
                <button
                  key={r}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateAttributes({ borderRadius: r })}
                  className={`flex-1 py-1 text-xs rounded-lg border transition-colors
                    ${borderRadius === r
                      ? 'border-slate-800 bg-slate-800 text-white font-medium'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                >
                  {r === 'none' ? 'Sharp' : r === 'md' ? 'Round' : 'Pill'}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-2">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { deleteNode(); setShowPanel(false); }}
                className="w-full py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 size={12} />
                Delete Section
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <NodeViewContent
        className="background-section-content"
        style={{ padding: paddingMap[padding] || '2rem' }}
      />
    </NodeViewWrapper>
  );
};

export const BackgroundSection = Node.create({
  name: 'backgroundSection',
  group: 'block',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      bgPreset: {
        default: 'dots',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-bg-preset') || 'dots',
        renderHTML: (attrs: any) => ({ 'data-bg-preset': attrs.bgPreset }),
      },
      padding: {
        default: 'md',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-padding') || 'md',
        renderHTML: (attrs: any) => ({ 'data-padding': attrs.padding }),
      },
      borderRadius: {
        default: 'md',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-border-radius') || 'md',
        renderHTML: (attrs: any) => ({ 'data-border-radius': attrs.borderRadius }),
      },
    };
  },

  addCommands() {
    return {
      setBackgroundSection: (attrs: Record<string, any> = {}) =>
        ({ commands }: any) => commands.wrapIn(this.name, attrs),
    } as any;
  },

  parseHTML() {
    return [{ tag: 'div[data-type="background-section"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'background-section' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BackgroundSectionNodeView);
  },
});
