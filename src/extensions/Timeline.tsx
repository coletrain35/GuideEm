import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Paintbrush } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const TIMELINE_COLORS: Record<string, { 500: string; 100: string }> = {
  blue:    { 500: '#3b82f6', 100: '#dbeafe' },
  indigo:  { 500: '#6366f1', 100: '#e0e7ff' },
  emerald: { 500: '#10b981', 100: '#d1fae5' },
  amber:   { 500: '#f59e0b', 100: '#fef3c7' },
  rose:    { 500: '#f43f5e', 100: '#ffe4e6' },
  violet:  { 500: '#8b5cf6', 100: '#ede9fe' },
  slate:   { 500: '#64748b', 100: '#f1f5f9' },
};

const MARKER_STYLES = [
  { id: 'number', label: 'Number', preview: '1' },
  { id: 'dot',   label: 'Dot',    preview: '·' },
  { id: 'check', label: 'Check',  preview: '✓' },
] as const;

// --- TimelineStepTitle ---

const TimelineStepTitleNodeView = () => {
  return (
    <NodeViewWrapper as="div">
      <NodeViewContent as="div" className="tiptap-step-title" />
    </NodeViewWrapper>
  );
};

export const TimelineStepTitle = Node.create({
  name: 'timelineStepTitle',
  content: 'inline*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="timeline-step-title"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'timeline-step-title' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimelineStepTitleNodeView);
  },
});

// --- TimelineStep ---

const TimelineStepNodeView = (props: any) => {
  const { node, updateAttributes } = props;
  const { date } = node.attrs;

  return (
    <NodeViewWrapper className="timeline-step-editor flex gap-4 relative">
      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
        <div className="timeline-step-num w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 shadow-md" />
        <div className="w-0.5 bg-slate-200 flex-1 mt-2 min-h-[32px]" />
      </div>
      <div className="flex-1 min-w-0 pb-6">
        <input
          value={date}
          onChange={(e) => updateAttributes({ date: e.target.value })}
          className="w-full text-xs font-medium text-slate-400 bg-transparent outline-none mb-1 placeholder:text-slate-300 uppercase tracking-wide"
          placeholder="Date or label (optional)..."
        />
        <NodeViewContent className="prose prose-slate prose-sm max-w-none min-h-[40px]" />
      </div>
    </NodeViewWrapper>
  );
};

export const TimelineStep = Node.create({
  name: 'timelineStep',
  content: 'timelineStepTitle block+',
  isolating: true,

  addAttributes() {
    return {
      date: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-date') || '',
        renderHTML: (attrs) => attrs.date ? { 'data-date': attrs.date } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="timeline-step"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'timeline-step' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimelineStepNodeView);
  },
});

// --- Timeline (parent) ---

const TimelineNodeView = (props: any) => {
  const { node, selected, deleteNode, editor, getPos, updateAttributes } = props;
  const { accentColor, markerStyle } = node.attrs;
  const [showStylePanel, setShowStylePanel] = useState(false);
  const stylePanelRef = useRef<HTMLDivElement>(null);

  const colors = TIMELINE_COLORS[accentColor] || TIMELINE_COLORS.blue;

  useEffect(() => {
    if (!showStylePanel) return;
    const handler = (e: MouseEvent) => {
      if (stylePanelRef.current && !stylePanelRef.current.contains(e.target as globalThis.Node)) {
        setShowStylePanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStylePanel]);

  const addStep = () => {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos === undefined) return;
    const endPos = pos + node.nodeSize - 1;
    editor.chain().focus().insertContentAt(endPos, {
      type: 'timelineStep',
      attrs: { date: '' },
      content: [
        { type: 'timelineStepTitle', content: [{ type: 'text', text: 'New Step' }] },
        { type: 'paragraph' },
      ],
    }).run();
  };

  return (
    <NodeViewWrapper
      className={`group/block timeline-editor relative my-8 transition-all ${selected ? 'ring-2 ring-slate-200 rounded-xl p-3' : ''}`}
      style={{ '--tl-accent': colors[500], '--tl-accent-ring': colors[100] } as React.CSSProperties}
      data-marker-style={markerStyle}
    >
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-10 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        <button
          onClick={addStep}
          className="flex items-center gap-1 px-3 py-1 rounded-full hover:bg-slate-100 text-slate-600"
        >
          <Plus size={14} /> Add Step
        </button>
        <div className="w-px h-4 bg-slate-200" />
        <div ref={stylePanelRef} className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowStylePanel(!showStylePanel)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${showStylePanel ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Paintbrush size={14} /> Style
          </button>
          {showStylePanel && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-52"
            >
              {/* Accent Color */}
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Accent Color</p>
              <div className="flex gap-1.5 flex-wrap mb-3">
                {Object.entries(TIMELINE_COLORS).map(([name, c]) => (
                  <button
                    key={name}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => updateAttributes({ accentColor: name })}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${accentColor === name ? 'border-slate-900 ring-2 ring-slate-900/20 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c[500] }}
                    title={name}
                  />
                ))}
              </div>

              {/* Marker Style */}
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Marker Style</p>
              <div className="flex gap-1.5">
                {MARKER_STYLES.map((ms) => (
                  <button
                    key={ms.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => updateAttributes({ markerStyle: ms.id })}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border-2 text-xs transition-all ${markerStyle === ms.id ? 'border-slate-900 bg-slate-50 text-slate-900' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: colors[500] }}
                    >
                      {ms.preview}
                    </span>
                    <span>{ms.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <NodeViewContent className="flex flex-col" />
    </NodeViewWrapper>
  );
};

export const Timeline = Node.create({
  name: 'timeline',
  group: 'block',
  content: 'timelineStep+',
  isolating: true,

  addAttributes() {
    return {
      accentColor: {
        default: 'blue',
        parseHTML: (el) => el.getAttribute('data-accent-color') || 'blue',
        renderHTML: (attrs) => ({ 'data-accent-color': attrs.accentColor }),
      },
      markerStyle: {
        default: 'number',
        parseHTML: (el) => el.getAttribute('data-marker-style') || 'number',
        renderHTML: (attrs) => ({ 'data-marker-style': attrs.markerStyle }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="timeline"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'timeline' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimelineNodeView);
  },
});
