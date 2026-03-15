import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { compressImageToWebP } from '../utils/imageCompressor';

const BeforeAfterNodeView = (props: any) => {
  const { node, updateAttributes, selected } = props;
  const { beforeImage, afterImage, sliderPosition, beforeLabel, afterLabel } = node.attrs;

  const [sliderPos, setSliderPos] = useState<number>(sliderPosition);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  // Sync slider position attribute when drag ends
  const commitSliderPos = useCallback((pos: number) => {
    updateAttributes({ sliderPosition: pos });
  }, [updateAttributes]);

  const setPos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    setSliderPos(pct);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) setPos(e.clientX);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (dragging.current) {
        dragging.current = false;
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          let pct = ((e.clientX - rect.left) / rect.width) * 100;
          pct = Math.max(0, Math.min(100, pct));
          commitSliderPos(Math.round(pct));
        }
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (dragging.current && e.touches[0]) setPos(e.touches[0].clientX);
    };
    const onTouchEnd = () => { dragging.current = false; };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [setPos, commitSliderPos]);

  const handleImageUpload = async (file: File, which: 'before' | 'after') => {
    try {
      const base64 = await compressImageToWebP(file);
      if (which === 'before') updateAttributes({ beforeImage: base64 });
      else updateAttributes({ afterImage: base64 });
    } catch (err) {
      console.error('Image compression failed', err);
    }
  };

  const hasImages = beforeImage && afterImage;

  return (
    <NodeViewWrapper className="before-after-editor-wrapper my-6">
      <div
        className={`rounded-xl overflow-hidden border transition-all ${
          selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200'
        }`}
        contentEditable={false}
      >
        {hasImages ? (
          /* Slider preview */
          <div
            ref={containerRef}
            className="relative select-none"
            style={{ lineHeight: 0, cursor: 'ew-resize' }}
          >
            {/* After image (bottom layer) */}
            <img
              src={afterImage}
              alt={afterLabel}
              className="block w-full h-auto"
              draggable={false}
            />
            {/* Before image (clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                src={beforeImage}
                alt={beforeLabel}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            </div>
            {/* Divider */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: `${sliderPos}%`,
                width: '3px',
                background: 'white',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 8px rgba(0,0,0,0.4)',
                cursor: 'ew-resize',
              }}
              onMouseDown={(e) => { dragging.current = true; e.preventDefault(); }}
              onTouchStart={() => { dragging.current = true; }}
            >
              {/* Handle circle */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 8H11M5 8L3 6M5 8L3 10M11 8L13 6M11 8L13 10" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {/* Labels */}
            <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>
              {beforeLabel}
            </span>
            <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>
              {afterLabel}
            </span>
          </div>
        ) : (
          /* Placeholder */
          <div className="flex items-center justify-center gap-6 p-4 sm:p-8 lg:p-12 bg-slate-50">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              </div>
              <span className="text-xs text-slate-500 font-medium">Before Image</span>
              <button
                onClick={() => beforeInputRef.current?.click()}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload
              </button>
              <input
                ref={beforeInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'before'); }}
              />
            </div>
            <div className="text-2xl text-slate-300 font-bold">↔</div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              </div>
              <span className="text-xs text-slate-500 font-medium">After Image</span>
              <button
                onClick={() => afterInputRef.current?.click()}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Upload
              </button>
              <input
                ref={afterInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'after'); }}
              />
            </div>
          </div>
        )}

        {/* Selected edit panel */}
        {selected && (
          <div className="border-t border-blue-200 p-4 bg-white space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Before Label</label>
                <input
                  value={beforeLabel}
                  onChange={(e) => updateAttributes({ beforeLabel: e.target.value })}
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 block mb-0.5">After Label</label>
                <input
                  value={afterLabel}
                  onChange={(e) => updateAttributes({ afterLabel: e.target.value })}
                  className="w-full px-2 py-1 text-sm border rounded border-slate-200 outline-none focus:border-blue-400"
                />
              </div>
            </div>
            {hasImages && (
              <div className="flex gap-2">
                <button
                  onClick={() => beforeInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50 text-slate-600"
                >
                  Change Before Image
                </button>
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'before'); }}
                />
                <button
                  onClick={() => afterInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50 text-slate-600"
                >
                  Change After Image
                </button>
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'after'); }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const BeforeAfter = Node.create({
  name: 'beforeAfter',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      beforeImage: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-before-image') || '',
        renderHTML: (attrs) => (attrs.beforeImage ? { 'data-before-image': attrs.beforeImage } : {}),
      },
      afterImage: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-after-image') || '',
        renderHTML: (attrs) => (attrs.afterImage ? { 'data-after-image': attrs.afterImage } : {}),
      },
      sliderPosition: {
        default: 50,
        parseHTML: (el) => parseFloat(el.getAttribute('data-slider-position') || '50'),
        renderHTML: (attrs) => ({ 'data-slider-position': String(attrs.sliderPosition) }),
      },
      beforeLabel: {
        default: 'Before',
        parseHTML: (el) => el.getAttribute('data-before-label') || 'Before',
        renderHTML: (attrs) => ({ 'data-before-label': attrs.beforeLabel }),
      },
      afterLabel: {
        default: 'After',
        parseHTML: (el) => el.getAttribute('data-after-label') || 'After',
        renderHTML: (attrs) => ({ 'data-after-label': attrs.afterLabel }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="before-after"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'before-after' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BeforeAfterNodeView);
  },
});
