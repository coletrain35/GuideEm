import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { BlockDeleteButton } from './BlockDeleteButton';

const GripIcon = () => (
  <div className="flex gap-[3px] items-center justify-center h-full">
    <div className="w-[2px] h-5 bg-slate-400 rounded-full" />
    <div className="w-[2px] h-5 bg-slate-400 rounded-full" />
  </div>
);

export const AnnotatedImageView = ({ node, updateAttributes, selected, editor, deleteNode, getPos }: any) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Capture selected state at the START of mousedown (capture phase), before
  // ProseMirror's bubble-phase listener fires and mutates selection.
  const selectedAtMouseDownRef = useRef(false);

  const handleImageClick = (e: React.MouseEvent) => {
    if (!editor.isEditable || isResizing) return;
    if (editingId) { setEditingId(null); return; }
    // Only add a marker if the image was already selected before this click
    if (!selectedAtMouseDownRef.current) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newAnnotation = { id: Math.random().toString(36).substr(2, 9), x, y, text: 'New note' };
    updateAttributes({ annotations: [...(node.attrs.annotations || []), newAnnotation] });
    setEditingId(newAnnotation.id);
  };

  const updateAnnotation = (id: string, text: string) => {
    updateAttributes({ annotations: node.attrs.annotations.map((a: any) => a.id === id ? { ...a, text } : a) });
  };

  const deleteAnnotation = (id: string) => {
    updateAttributes({ annotations: node.attrs.annotations.filter((a: any) => a.id !== id) });
    setEditingId(null);
  };

  const handleResizeStart = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = wrapperRef.current?.offsetWidth ?? 0;
    const parentWidth = wrapperRef.current?.parentElement?.offsetWidth ?? 1;

    setIsResizing(true);

    const onMouseMove = (ev: MouseEvent) => {
      const delta = side === 'right' ? ev.clientX - startX : startX - ev.clientX;
      const newPct = Math.round(Math.max(10, Math.min(100, ((startWidth + delta) / parentWidth) * 100)));
      updateAttributes({ width: newPct });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [updateAttributes]);

  const effect = node.attrs.effect || 'none';
  const width: number = node.attrs.width ?? 100;
  const showHandles = selected && editor.isEditable && !editingId;

  return (
    <NodeViewWrapper className={`group/block relative block my-8 ${selected ? 'ring-4 ring-blue-500/50 rounded-lg' : ''}`}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {selected && editor.isEditable && (
        <div className="absolute -top-16 left-0 bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-10 flex items-center justify-between gap-4 w-full animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-xs font-bold">+</span>
            <span>Click on the image to add a hotspot marker</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-slate-400 tabular-nums">{width}%</span>
            <select
              value={effect}
              onChange={(e) => { e.stopPropagation(); updateAttributes({ effect: e.target.value }); }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 cursor-pointer"
            >
              <option value="none">No Effect</option>
              <option value="tilt-on-hover">Tilt on Hover</option>
              <option value="polaroid">Polaroid</option>
              <option value="film-strip">Film Strip</option>
            </select>
          </div>
        </div>
      )}

      {/* Sizing wrapper */}
      <div ref={wrapperRef} style={{ width: `${width}%` }} className="mx-auto relative">

        {/* Left resize handle — centered on left edge of wrapper */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'left')}
          style={{ left: 0, top: '50%', transform: 'translate(-50%, -50%)' }}
          className={`absolute z-40 w-5 h-14 rounded-full bg-white border border-slate-300 shadow-lg cursor-ew-resize select-none transition-opacity duration-150 hover:border-blue-400 hover:bg-blue-50 ${showHandles ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <GripIcon />
        </div>

        {/* Image + annotations */}
        <div
          ref={containerRef}
          className={`relative inline-block w-full${editor.isEditable ? ' cursor-crosshair' : ''}${effect !== 'none' ? ` image-effect-${effect}` : ''}`}
          onMouseDownCapture={() => { selectedAtMouseDownRef.current = selected; }}
          onClick={handleImageClick}
        >
          <img
            src={node.attrs.src}
            alt={node.attrs.alt || ''}
            className="block w-full rounded-lg shadow-sm"
            draggable={false}
          />

          {(node.attrs.annotations || []).map((ann: any, i: number) => (
            <div
              key={ann.id}
              style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
              onClick={(e) => { e.stopPropagation(); if (editor.isEditable) setEditingId(ann.id); }}
            >
              <div className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white transition-transform ${editingId === ann.id ? 'bg-amber-500 scale-110 ring-4 ring-amber-500/30' : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'} text-white cursor-pointer`}>
                {i + 1}
              </div>

              {editingId === ann.id && editor.isEditable ? (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white p-3 rounded-xl shadow-2xl border border-slate-200 z-50 max-w-[min(16rem,calc(100vw-3rem))] w-64 cursor-default animate-in zoom-in-95"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-slate-200 rotate-45" />
                  <div className="relative z-10">
                    <textarea
                      autoFocus
                      value={ann.text}
                      onChange={e => updateAnnotation(ann.id, e.target.value)}
                      className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                      rows={3}
                      placeholder="Enter hover text..."
                    />
                    <div className="flex justify-between items-center mt-3">
                      <button onClick={() => deleteAnnotation(ann.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium">
                        <Trash2 size={14} /> Delete
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-slate-900 text-white text-sm p-3 rounded-lg shadow-xl z-40 w-max max-w-[250px] opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-pre-wrap text-center translate-y-1 group-hover:translate-y-0">
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
                  <span className="relative z-10">{ann.text}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right resize handle — centered on right edge of wrapper */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'right')}
          style={{ right: 0, top: '50%', transform: 'translate(50%, -50%)' }}
          className={`absolute z-40 w-5 h-14 rounded-full bg-white border border-slate-300 shadow-lg cursor-ew-resize select-none transition-opacity duration-150 hover:border-blue-400 hover:bg-blue-50 ${showHandles ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <GripIcon />
        </div>
      </div>
    </NodeViewWrapper>
  );
};
