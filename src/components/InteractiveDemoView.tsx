import { NodeViewWrapper } from '@tiptap/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus, X, Play, Pencil, Trash2, ChevronLeft, ChevronRight,
  MousePointerClick, Eye, ArrowRight,
} from 'lucide-react';
import { compressImageToWebP } from '../utils/imageCompressor';
import { BlockDeleteButton } from './BlockDeleteButton';

interface DemoFrame {
  id: string;
  image: string;
  label: string;
}

interface DemoHotspot {
  id: string;
  frameId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetFrameId?: string;
  tooltip?: string;
  transition?: string;
}

type TransitionType = 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down';

// ── Helpers ──

const genId = () => Math.random().toString(36).substring(2, 11);

const getFrameHotspots = (hotspots: DemoHotspot[], frameId: string) =>
  hotspots.filter(h => h.frameId === frameId);

const getNextFrameId = (frames: DemoFrame[], currentId: string): string | null => {
  const idx = frames.findIndex(f => f.id === currentId);
  if (idx < 0 || idx >= frames.length - 1) return null;
  return frames[idx + 1].id;
};

// ── Component ──

export const InteractiveDemoView = ({ node, updateAttributes, selected, editor, deleteNode, getPos }: any) => {
  const frames: DemoFrame[] = node.attrs.frames || [];
  const hotspots: DemoHotspot[] = node.attrs.hotspots || [];
  const transition: TransitionType = node.attrs.transition || 'fade';
  const showNav: boolean = node.attrs.showNav ?? true;

  // Active frame in editor
  const [activeFrameId, setActiveFrameId] = useState<string | null>(
    node.attrs.activeFrameId || (frames[0]?.id ?? null)
  );

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  // Hotspot editing
  const [editingHotspotId, setEditingHotspotId] = useState<string | null>(null);

  // Preview mode
  const [previewMode, setPreviewMode] = useState(false);
  const [previewFrameId, setPreviewFrameId] = useState<string | null>(null);
  const [previewHistory, setPreviewHistory] = useState<string[]>([]);
  const [transitioning, setTransitioning] = useState(false);

  // Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragFrameIdRef = useRef<string | null>(null);

  // Keep activeFrameId in sync when frames change
  useEffect(() => {
    if (frames.length > 0 && (!activeFrameId || !frames.find(f => f.id === activeFrameId))) {
      setActiveFrameId(frames[0].id);
    }
    if (frames.length === 0) setActiveFrameId(null);
  }, [frames]);

  const activeFrame = frames.find(f => f.id === activeFrameId) || null;
  const activeHotspots = activeFrameId ? getFrameHotspots(hotspots, activeFrameId) : [];

  // ── Frame Management ──

  const handleAddFrame = async (file: File) => {
    try {
      const base64 = await compressImageToWebP(file);
      const newFrame: DemoFrame = { id: genId(), image: base64, label: `Frame ${frames.length + 1}` };
      const updated = [...frames, newFrame];
      updateAttributes({ frames: updated });
      if (!activeFrameId) setActiveFrameId(newFrame.id);
    } catch (err) {
      console.error('Image compression failed', err);
    }
  };

  const handleDeleteFrame = (frameId: string) => {
    const updated = frames.filter(f => f.id !== frameId);
    const updatedHotspots = hotspots.filter(
      h => h.frameId !== frameId && h.targetFrameId !== frameId
    ).map(h => h.targetFrameId === frameId ? { ...h, targetFrameId: undefined } : h);
    updateAttributes({ frames: updated, hotspots: updatedHotspots });
    if (activeFrameId === frameId) {
      setActiveFrameId(updated[0]?.id ?? null);
    }
  };

  const handleRenameFrame = (frameId: string, label: string) => {
    updateAttributes({ frames: frames.map(f => f.id === frameId ? { ...f, label } : f) });
  };

  const handleFrameDragStart = (frameId: string) => {
    dragFrameIdRef.current = frameId;
  };

  const handleFrameDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleFrameDrop = (dropIndex: number) => {
    const dragId = dragFrameIdRef.current;
    if (!dragId) return;
    const dragIndex = frames.findIndex(f => f.id === dragId);
    if (dragIndex < 0 || dragIndex === dropIndex) return;
    const reordered = [...frames];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    updateAttributes({ frames: reordered });
    dragFrameIdRef.current = null;
    setDragOverIndex(null);
  };

  // ── Hotspot Drawing ──

  const getPercentCoords = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!viewportRef.current) return { x: 0, y: 0 };
    const rect = viewportRef.current.getBoundingClientRect();
    const clientX = 'touches' in e && e.touches[0] ? e.touches[0].clientX : 'clientX' in e ? (e as MouseEvent).clientX : 0;
    const clientY = 'touches' in e && e.touches[0] ? e.touches[0].clientY : 'clientY' in e ? (e as MouseEvent).clientY : 0;
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  }, []);

  const handleViewportMouseDown = (e: React.MouseEvent) => {
    if (previewMode || !activeFrameId || !editor.isEditable) return;
    if ((e.target as HTMLElement).closest('.id-hotspot-rect')) return;
    e.preventDefault();
    const coords = getPercentCoords(e);
    setIsDrawing(true);
    setDrawStart(coords);
    setDrawCurrent(coords);
    setEditingHotspotId(null);
  };

  const handleViewportMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    setDrawCurrent(getPercentCoords(e));
  };

  const handleViewportTouchStart = (e: React.TouchEvent) => {
    if (previewMode || !activeFrameId || !editor.isEditable) return;
    if ((e.target as HTMLElement).closest('.id-hotspot-rect')) return;
    const coords = getPercentCoords(e);
    setIsDrawing(true);
    setDrawStart(coords);
    setDrawCurrent(coords);
    setEditingHotspotId(null);
  };

  const handleViewportTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing) return;
    setDrawCurrent(getPercentCoords(e));
  };

  const handleViewportMouseUp = () => {
    if (!isDrawing || !drawStart || !drawCurrent || !activeFrameId) {
      setIsDrawing(false);
      return;
    }

    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);

    // Minimum size threshold (2% in either dimension)
    if (width < 2 && height < 2) {
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    const newHotspot: DemoHotspot = {
      id: genId(),
      frameId: activeFrameId,
      x, y, width, height,
    };

    updateAttributes({ hotspots: [...hotspots, newHotspot] });
    setEditingHotspotId(newHotspot.id);
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  };

  // Global mouseup / touchend to catch releases outside viewport
  useEffect(() => {
    const onRelease = () => {
      if (isDrawing) {
        setIsDrawing(false);
        setDrawStart(null);
        setDrawCurrent(null);
      }
    };
    document.addEventListener('mouseup', onRelease);
    document.addEventListener('touchend', onRelease);
    return () => {
      document.removeEventListener('mouseup', onRelease);
      document.removeEventListener('touchend', onRelease);
    };
  }, [isDrawing]);

  // ── Hotspot Editing ──

  const handleUpdateHotspot = (id: string, updates: Partial<DemoHotspot>) => {
    updateAttributes({
      hotspots: hotspots.map(h => h.id === id ? { ...h, ...updates } : h),
    });
  };

  const handleDeleteHotspot = (id: string) => {
    updateAttributes({ hotspots: hotspots.filter(h => h.id !== id) });
    setEditingHotspotId(null);
  };

  // ── Preview Mode ──

  const enterPreview = () => {
    setPreviewMode(true);
    setPreviewFrameId(frames[0]?.id ?? null);
    setPreviewHistory([]);
  };

  const exitPreview = () => {
    setPreviewMode(false);
    setPreviewFrameId(null);
    setPreviewHistory([]);
  };

  const handlePreviewHotspotClick = (hotspot: DemoHotspot) => {
    if (transitioning || !previewFrameId) return;
    const targetId = hotspot.targetFrameId || getNextFrameId(frames, previewFrameId);
    if (!targetId) return;

    setTransitioning(true);
    setPreviewHistory(prev => [...prev, previewFrameId!]);

    // Short delay for transition
    setTimeout(() => {
      setPreviewFrameId(targetId);
      setTransitioning(false);
    }, 300);
  };

  const handlePreviewBack = () => {
    if (transitioning || previewHistory.length === 0) return;
    setTransitioning(true);
    const prev = [...previewHistory];
    const backId = prev.pop()!;
    setTimeout(() => {
      setPreviewFrameId(backId);
      setPreviewHistory(prev);
      setTransitioning(false);
    }, 300);
  };

  const handlePreviewNavDot = (frameId: string) => {
    if (transitioning || frameId === previewFrameId) return;
    setTransitioning(true);
    if (previewFrameId) setPreviewHistory(prev => [...prev, previewFrameId]);
    setTimeout(() => {
      setPreviewFrameId(frameId);
      setTransitioning(false);
    }, 300);
  };

  // ── Draw Preview Rectangle ──

  const drawRect = drawStart && drawCurrent ? {
    x: Math.min(drawStart.x, drawCurrent.x),
    y: Math.min(drawStart.y, drawCurrent.y),
    width: Math.abs(drawCurrent.x - drawStart.x),
    height: Math.abs(drawCurrent.y - drawStart.y),
  } : null;

  // ── Empty State ──

  if (frames.length === 0 && !previewMode) {
    return (
      <NodeViewWrapper className={`group/block relative my-8 ${selected ? 'ring-4 ring-blue-500/50 rounded-xl' : ''}`}>
        <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
        <div
          className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer p-12 text-center"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
              <MousePointerClick size={28} className="text-blue-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-700">Interactive Demo</p>
              <p className="text-sm text-slate-500 mt-1">Click to add your first frame, then draw clickable hotspots</p>
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            for (const file of files) await handleAddFrame(file);
            e.target.value = '';
          }}
        />
      </NodeViewWrapper>
    );
  }

  // ── Preview Mode Render ──

  if (previewMode) {
    const currentPreviewFrame = frames.find(f => f.id === previewFrameId);
    const currentPreviewHotspots = previewFrameId ? getFrameHotspots(hotspots, previewFrameId) : [];
    const previewIndex = frames.findIndex(f => f.id === previewFrameId);

    return (
      <NodeViewWrapper className={`group/block relative my-8 ${selected ? 'ring-4 ring-blue-500/50 rounded-xl' : ''}`}>
        <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

        {/* Preview toolbar */}
        <div className="absolute -top-12 left-0 right-0 flex items-center justify-between bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-10">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-blue-400" />
            <span className="font-medium">Preview Mode</span>
            {currentPreviewFrame && (
              <span className="text-slate-400 ml-2">
                {previewIndex + 1}/{frames.length}: {currentPreviewFrame.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviewBack}
              disabled={previewHistory.length === 0}
              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={exitPreview}
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              Exit Preview
            </button>
          </div>
        </div>

        {/* Preview viewport */}
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black">
          {currentPreviewFrame && (
            <div className={`relative transition-all duration-300 ${transitioning ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}>
              <img
                src={currentPreviewFrame.image}
                alt={currentPreviewFrame.label}
                className="block w-full"
                draggable={false}
              />
              {currentPreviewHotspots.map(hotspot => {
                const target = hotspot.targetFrameId || getNextFrameId(frames, previewFrameId!);
                return (
                  <div
                    key={hotspot.id}
                    role="button"
                    tabIndex={target ? 0 : -1}
                    aria-label={hotspot.tooltip || (target ? 'Navigate to frame' : 'No target')}
                    className={`absolute cursor-pointer transition-all duration-150 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      target ? 'hover:bg-blue-500/20 hover:ring-2 hover:ring-blue-400' : 'opacity-30 cursor-not-allowed'
                    }`}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      width: `${hotspot.width}%`,
                      height: `${hotspot.height}%`,
                    }}
                    onClick={() => target && handlePreviewHotspotClick(hotspot)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        if (target) handlePreviewHotspotClick(hotspot);
                      }
                    }}
                    title={hotspot.tooltip || (target ? 'Click to navigate' : 'No target')}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation dots */}
        {showNav && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {frames.map(f => (
              <button
                key={f.id}
                onClick={() => handlePreviewNavDot(f.id)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  f.id === previewFrameId
                    ? 'bg-blue-600 scale-125'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                title={f.label}
              />
            ))}
          </div>
        )}
      </NodeViewWrapper>
    );
  }

  // ── Edit Mode Render ──

  return (
    <NodeViewWrapper className={`group/block relative my-8 ${selected ? 'ring-4 ring-blue-500/50 rounded-xl' : ''}`}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Toolbar */}
      {selected && editor.isEditable && (
        <div className="absolute -top-12 left-0 right-0 flex items-center justify-between bg-slate-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-10 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <MousePointerClick size={16} className="text-blue-400" />
            <span className="text-xs text-slate-400">Draw hotspots on the image</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Default transition:</span>
              <select
                value={transition}
                onChange={(e) => updateAttributes({ transition: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="text-xs bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 cursor-pointer"
              >
                <option value="fade">Fade</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
                <option value="slide-up">Slide Up</option>
                <option value="slide-down">Slide Down</option>
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showNav}
                onChange={(e) => updateAttributes({ showNav: e.target.checked })}
                className="rounded border-slate-500"
              />
              Nav dots
            </label>
            <button
              onClick={enterPreview}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              <Play size={12} /> Preview
            </button>
          </div>
        </div>
      )}

      {/* Viewport — active frame */}
      {activeFrame && (
        <div
          ref={viewportRef}
          className={`relative rounded-t-xl overflow-hidden border border-b-0 border-slate-200 bg-slate-900 ${
            editor.isEditable && !previewMode ? 'cursor-crosshair' : ''
          }`}
          onMouseDown={handleViewportMouseDown}
          onMouseMove={handleViewportMouseMove}
          onMouseUp={handleViewportMouseUp}
          onTouchStart={handleViewportTouchStart}
          onTouchMove={handleViewportTouchMove}
          onTouchEnd={handleViewportMouseUp}
        >
          <img
            src={activeFrame.image}
            alt={activeFrame.label}
            className="block w-full"
            draggable={false}
          />

          {/* Existing hotspots */}
          {activeHotspots.map((hotspot, i) => {
            const targetFrame = hotspot.targetFrameId
              ? frames.find(f => f.id === hotspot.targetFrameId)
              : null;
            const isEditing = editingHotspotId === hotspot.id;
            const nextFrame = getNextFrameId(frames, activeFrameId!);

            return (
              <div
                key={hotspot.id}
                className={`id-hotspot-rect absolute border-2 border-dashed rounded-sm transition-colors ${
                  isEditing
                    ? 'border-blue-500 bg-blue-500/25 ring-2 ring-blue-400'
                    : 'border-blue-400/70 bg-blue-500/15 hover:bg-blue-500/25'
                }`}
                style={{
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                  width: `${hotspot.width}%`,
                  height: `${hotspot.height}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingHotspotId(isEditing ? null : hotspot.id);
                }}
              >
                {/* Hotspot badge */}
                <div className="absolute -top-3 -left-1 flex items-center gap-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow">
                    {i + 1}
                  </span>
                  {(hotspot.targetFrameId || hotspot.tooltip) && (
                    <span className="bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow max-w-[120px] truncate">
                      {hotspot.tooltip || (targetFrame?.label ?? 'Next')}
                    </span>
                  )}
                </div>

                {/* Arrow indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <ArrowRight size={20} className="text-blue-700" />
                </div>

                {/* Edit popover */}
                {isEditing && editor.isEditable && (
                  <div
                    className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-3 w-56 cursor-default animate-in zoom-in-95"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Target Frame</label>
                        <select
                          value={hotspot.targetFrameId || ''}
                          onChange={(e) => handleUpdateHotspot(hotspot.id, {
                            targetFrameId: e.target.value || undefined,
                          })}
                          className="w-full text-sm p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Next frame{nextFrame ? ` (${frames.find(f => f.id === nextFrame)?.label})` : ' (none)'}</option>
                          {frames.filter(f => f.id !== activeFrameId).map(f => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Tooltip</label>
                        <input
                          type="text"
                          value={hotspot.tooltip || ''}
                          onChange={(e) => handleUpdateHotspot(hotspot.id, { tooltip: e.target.value })}
                          className="w-full text-sm p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. Click this button"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Transition</label>
                        <select
                          value={hotspot.transition || ''}
                          onChange={(e) => handleUpdateHotspot(hotspot.id, { transition: e.target.value || undefined })}
                          className="w-full text-sm p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Default ({transition})</option>
                          <option value="fade">Fade</option>
                          <option value="slide-left">Slide Left</option>
                          <option value="slide-right">Slide Right</option>
                          <option value="slide-up">Slide Up</option>
                          <option value="slide-down">Slide Down</option>
                        </select>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <button
                          onClick={() => handleDeleteHotspot(hotspot.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                        <button
                          onClick={() => setEditingHotspotId(null)}
                          className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Drawing preview rectangle */}
          {isDrawing && drawRect && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500/20 rounded-sm pointer-events-none"
              style={{
                left: `${drawRect.x}%`,
                top: `${drawRect.y}%`,
                width: `${drawRect.width}%`,
                height: `${drawRect.height}%`,
              }}
            />
          )}
        </div>
      )}

      {/* Frame strip */}
      <div className="flex items-center gap-2 p-3 bg-slate-100 border border-t-0 border-slate-200 rounded-b-xl overflow-x-auto">
        {frames.map((frame, i) => (
          <div
            key={frame.id}
            draggable
            onDragStart={() => handleFrameDragStart(frame.id)}
            onDragOver={(e) => handleFrameDragOver(e, i)}
            onDragLeave={() => setDragOverIndex(null)}
            onDrop={() => handleFrameDrop(i)}
            onClick={() => setActiveFrameId(frame.id)}
            className={`relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all group/thumb ${
              frame.id === activeFrameId
                ? 'border-blue-500 ring-2 ring-blue-200 shadow-md'
                : 'border-slate-200 hover:border-slate-400'
            } ${dragOverIndex === i ? 'ring-2 ring-blue-400 scale-105' : ''}`}
            style={{ width: 96, height: 64 }}
          >
            <img
              src={frame.image}
              alt={frame.label}
              className="w-full h-full object-cover"
              draggable={false}
            />

            {/* Frame number */}
            <span className="absolute top-1 left-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/60 text-white text-[9px] font-bold">
              {i + 1}
            </span>

            {/* Hotspot count badge */}
            {getFrameHotspots(hotspots, frame.id).length > 0 && (
              <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[16px] h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold px-1">
                {getFrameHotspots(hotspots, frame.id).length}
              </span>
            )}

            {/* Delete button */}
            {editor.isEditable && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteFrame(frame.id); }}
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity hidden group-hover/thumb:flex"
              >
                <X size={10} />
              </button>
            )}

            {/* Frame label */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3">
              <input
                type="text"
                value={frame.label}
                onChange={(e) => handleRenameFrame(frame.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-transparent text-white text-[9px] font-medium outline-none truncate"
                title={frame.label}
              />
            </div>
          </div>
        ))}

        {/* Add frame button */}
        {editor.isEditable && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center"
          >
            <Plus size={20} className="text-slate-400" />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            for (const file of files) await handleAddFrame(file);
            e.target.value = '';
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};
