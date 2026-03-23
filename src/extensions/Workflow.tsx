import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, Paintbrush, ImagePlus, X, Sparkles } from 'lucide-react';
import {
  CircleDot, Rocket, Settings, Users, Code, Zap, CheckCircle, Search, Send,
  Shield, Database, Globe, Mail, FileText, BarChart, Lock, Unlock, Edit,
  Eye, Download, Upload, Play, Flag, Target, Lightbulb,
} from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';
import { compressImageToWebP } from '../utils/imageCompressor';

// Color map
const WORKFLOW_COLORS: Record<string, { 50: string; 100: string; 500: string; 600: string }> = {
  indigo:  { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5' },
  emerald: { 50: '#ecfdf5', 100: '#d1fae5', 500: '#10b981', 600: '#059669' },
  amber:   { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706' },
  rose:    { 50: '#fff1f2', 100: '#ffe4e6', 500: '#f43f5e', 600: '#e11d48' },
  sky:     { 50: '#f0f9ff', 100: '#e0f2fe', 500: '#0ea5e9', 600: '#0284c7' },
  violet:  { 50: '#f5f3ff', 100: '#ede9fe', 500: '#8b5cf6', 600: '#7c3aed' },
  slate:   { 50: '#f8fafc', 100: '#f1f5f9', 500: '#64748b', 600: '#475569' },
};

// Card background presets
const WORKFLOW_CARD_BG = [
  // Solids
  { id: 'white',      name: 'White',    bg: '#ffffff',  bgImage: undefined as string | undefined, animated: false as false | string, dark: false },
  { id: 'light-gray', name: 'Light',    bg: '#f8fafc',  bgImage: undefined as string | undefined, animated: false as false | string, dark: false },
  { id: 'warm-cream', name: 'Cream',    bg: '#fefce8',  bgImage: undefined as string | undefined, animated: false as false | string, dark: false },
  { id: 'dark-slate', name: 'Dark',     bg: '#1e293b',  bgImage: undefined as string | undefined, animated: false as false | string, dark: true  },
  // Gradients
  { id: 'frost',      name: 'Frost',    bg: undefined as string | undefined, bgImage: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', animated: false as false | string, dark: false },
  { id: 'dusk',       name: 'Dusk',     bg: undefined as string | undefined, bgImage: 'linear-gradient(135deg, #faf5ff 0%, #fce7f3 100%)', animated: false as false | string, dark: false },
  { id: 'mint',       name: 'Mint',     bg: undefined as string | undefined, bgImage: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)', animated: false as false | string, dark: false },
  { id: 'charcoal',   name: 'Charcoal', bg: undefined as string | undefined, bgImage: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', animated: false as false | string, dark: true  },
  // Animated
  { id: 'shimmer',    name: 'Shimmer',  bg: '#ffffff', bgImage: 'linear-gradient(110deg, transparent 33%, rgba(99,102,241,0.05) 50%, transparent 67%)', animated: 'shimmer' as false | string, dark: false },
  { id: 'pulse-glow', name: 'Glow',     bg: '#ffffff', bgImage: undefined as string | undefined, animated: 'pulse-glow' as false | string, dark: false },
];

function getCardBgPreset(id: string | null) {
  return WORKFLOW_CARD_BG.find((p) => p.id === id) || WORKFLOW_CARD_BG[0];
}

// Curated icon set for workflows
const WORKFLOW_ICONS = [
  'circle-dot', 'rocket', 'settings', 'users', 'code', 'zap', 'check-circle',
  'search', 'send', 'shield', 'database', 'globe', 'mail', 'file-text',
  'bar-chart', 'lock', 'unlock', 'edit', 'eye', 'download', 'upload',
  'play', 'flag', 'target', 'lightbulb',
] as const;

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  'circle-dot': CircleDot,
  'rocket': Rocket,
  'settings': Settings,
  'users': Users,
  'code': Code,
  'zap': Zap,
  'check-circle': CheckCircle,
  'search': Search,
  'send': Send,
  'shield': Shield,
  'database': Database,
  'globe': Globe,
  'mail': Mail,
  'file-text': FileText,
  'bar-chart': BarChart,
  'lock': Lock,
  'unlock': Unlock,
  'edit': Edit,
  'eye': Eye,
  'download': Download,
  'upload': Upload,
  'play': Play,
  'flag': Flag,
  'target': Target,
  'lightbulb': Lightbulb,
};

// --- WorkflowStep ---

const WorkflowStepNodeView = (props: any) => {
  const { node, updateAttributes, editor, getPos } = props;
  const { title, icon, image, cardBgOverride } = node.attrs;
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const bgPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as globalThis.Node)) {
        setShowIconPicker(false);
      }
      if (bgPickerRef.current && !bgPickerRef.current.contains(e.target as globalThis.Node)) {
        setShowBgPicker(false);
      }
    };
    if (showIconPicker || showBgPicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showIconPicker, showBgPicker]);

  // Compute step number from position among siblings
  let stepNumber = 1;
  try {
    const pos = typeof getPos === 'function' ? getPos() : undefined;
    if (pos !== undefined) {
      const resolved = editor.state.doc.resolve(pos);
      stepNumber = resolved.index(resolved.depth) + 1;
    }
  } catch { /* fallback to 1 */ }

  const IconComponent = ICON_MAP[icon] || CircleDot;

  // Resolve card bg: override if set, otherwise inherit from parent.
  // React node views don't re-render when parent attrs change, so we
  // listen to editor transactions to re-read the parent's cardBg.
  const overridePreset = cardBgOverride ? getCardBgPreset(cardBgOverride) : null;
  const [parentDark, setParentDark] = useState(false);
  const [parentAnimated, setParentAnimated] = useState<false | string>(false);

  useEffect(() => {
    if (overridePreset) return; // don't need parent state when overriding
    const readParent = () => {
      try {
        const pos = typeof getPos === 'function' ? getPos() : undefined;
        if (pos === undefined) return;
        const resolved = editor.state.doc.resolve(pos);
        // getPos() returns position before the step node.
        // resolved.node(resolved.depth) is the direct parent (workflow).
        for (let d = resolved.depth; d >= 0; d--) {
          const ancestor = resolved.node(d);
          if (ancestor.type.name === 'workflow') {
            const preset = getCardBgPreset(ancestor.attrs.cardBg || 'white');
            setParentDark(preset.dark);
            setParentAnimated(preset.animated);
            break;
          }
        }
      } catch { /* fallback */ }
    };
    readParent();
    const handler = () => readParent();
    editor.on('transaction', handler);
    return () => { editor.off('transaction', handler); };
  }, [editor, getPos, overridePreset]);

  const isDark = overridePreset ? overridePreset.dark : parentDark;

  const cardStyle: React.CSSProperties = {
    borderLeftColor: 'var(--wf-accent-500)',
  };

  if (overridePreset) {
    cardStyle.backgroundColor = overridePreset.bg || 'transparent';
    if (overridePreset.bgImage) cardStyle.backgroundImage = overridePreset.bgImage;
    if (overridePreset.animated === 'shimmer') cardStyle.backgroundSize = '200% 100%';
  } else {
    cardStyle.backgroundColor = 'var(--wf-card-bg)';
    cardStyle.backgroundImage = 'var(--wf-card-bg-image)';
  }

  const activeAnim = overridePreset ? overridePreset.animated : parentAnimated;
  const animClass = activeAnim === 'shimmer' ? 'wf-card-shimmer' : activeAnim === 'pulse-glow' ? 'wf-card-pulse-glow' : '';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImageToWebP(file);
    updateAttributes({ image: base64 });
    e.target.value = '';
  };

  return (
    <NodeViewWrapper className="workflow-step-editor mb-0">
      <div
        className={`group/step relative border border-l-[3px] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all ${animClass}`}
        style={{ ...cardStyle, borderColor: isDark ? '#334155' : '#e2e8f0', borderLeftColor: cardStyle.borderLeftColor }}
        data-dark={isDark ? 'true' : undefined}
      >
        {/* Per-step bg override button */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/step:opacity-100 transition-opacity" contentEditable={false} ref={bgPickerRef}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowBgPicker(!showBgPicker)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg border shadow-sm transition-all
              ${showBgPicker
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white/90 backdrop-blur-sm text-slate-500 border-slate-200 hover:bg-white hover:text-slate-700'
              }`}
          >
            <Paintbrush size={10} />
          </button>
          {showBgPicker && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full right-0 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-52"
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Card Background</p>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {/* Default/inherit option */}
                <div className="flex flex-col items-center gap-0.5">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { updateAttributes({ cardBgOverride: null }); setShowBgPicker(false); }}
                    className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center text-[8px] font-bold text-slate-400
                      ${!cardBgOverride ? 'border-slate-900 ring-1 ring-slate-900/20' : 'border-slate-200 hover:border-slate-400'}`}
                    style={{ background: 'repeating-conic-gradient(#e2e8f0 0% 25%, white 0% 50%) 50%/8px 8px' }}
                    title="Default (inherit)"
                  />
                  <span className="text-[8px] text-slate-400 leading-none">Auto</span>
                </div>
                {WORKFLOW_CARD_BG.map((p) => (
                  <div key={p.id} className="flex flex-col items-center gap-0.5">
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { updateAttributes({ cardBgOverride: p.id }); setShowBgPicker(false); }}
                      className={`w-8 h-8 rounded-lg border-2 transition-all relative overflow-hidden
                        ${cardBgOverride === p.id ? 'border-slate-900 ring-1 ring-slate-900/20' : 'border-slate-200 hover:border-slate-400'}`}
                      style={{
                        backgroundColor: p.bg || 'transparent',
                        backgroundImage: p.bgImage || undefined,
                      }}
                      title={p.name}
                    >
                      {p.animated && (
                        <Sparkles size={8} className="absolute bottom-0.5 right-0.5 text-indigo-400 opacity-60" />
                      )}
                    </button>
                    <span className="text-[8px] text-slate-400 leading-none">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step badge */}
        <span
          className="workflow-step-badge inline-flex px-2.5 py-0.5 rounded-full text-[0.625rem] font-bold uppercase tracking-[0.1em] mb-2"
          style={{ backgroundColor: 'var(--wf-accent-50)', color: 'var(--wf-accent-600)' }}
        >
          STEP {stepNumber}
        </span>
        {/* Header row */}
        <div className="flex items-center gap-3">
          {/* Icon circle with picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: 'linear-gradient(to bottom right, var(--wf-accent-50), var(--wf-accent-100))',
              }}
              title="Change icon"
            >
              <IconComponent size={22} style={{ color: 'var(--wf-accent-600)' }} />
            </button>
            {showIconPicker && (
              <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 grid grid-cols-6 gap-0.5" style={{ minWidth: '210px' }}>
                {WORKFLOW_ICONS.map((iconName) => {
                  const IC = ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
                      onClick={() => { updateAttributes({ icon: iconName }); setShowIconPicker(false); }}
                      className={`w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 ${icon === iconName ? 'bg-indigo-100 ring-2 ring-indigo-400' : ''}`}
                      title={iconName}
                    >
                      <IC size={16} className="text-slate-600" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {/* Title input */}
          <input
            value={title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            className="flex-1 font-bold bg-transparent outline-none text-lg text-slate-900"
            placeholder="Step title..."
          />
        </div>

        {/* Step image */}
        <div contentEditable={false} className="mt-3">
          {image ? (
            <div className="relative group/img">
              <img src={image} alt="" className="max-h-[160px] w-full object-cover rounded-lg" />
              <button
                onClick={() => updateAttributes({ image: null })}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors"
              style={{ color: isDark ? '#94a3b8' : '#94a3b8' }}
            >
              <ImagePlus size={14} /> Add image
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        {/* Rich content */}
        <div className="mt-3 pt-3" style={{ borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9' }}>
          <NodeViewContent className="prose prose-slate prose-sm max-w-none min-h-[48px]" />
        </div>
      </div>
      {/* Arrow connector */}
      <div className="workflow-arrow flex flex-col items-center py-1">
        <div className="w-px h-3 bg-slate-200" />
        <ChevronDown size={20} className="text-slate-300" />
      </div>
    </NodeViewWrapper>
  );
};

export const WorkflowStep = Node.create({
  name: 'workflowStep',
  content: 'block+',
  isolating: true,

  addAttributes() {
    return {
      title: {
        default: 'New Step',
        parseHTML: (el) => el.getAttribute('data-title') || 'New Step',
        renderHTML: (attrs) => ({ 'data-title': attrs.title }),
      },
      icon: {
        default: 'circle-dot',
        parseHTML: (el) => el.getAttribute('data-icon') || 'circle-dot',
        renderHTML: (attrs) => ({ 'data-icon': attrs.icon }),
      },
      image: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-image') || null,
        renderHTML: (attrs) => attrs.image ? { 'data-image': attrs.image } : {},
      },
      cardBgOverride: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-card-bg-override') || null,
        renderHTML: (attrs) => attrs.cardBgOverride ? { 'data-card-bg-override': attrs.cardBgOverride } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="workflow-step"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'workflow-step' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WorkflowStepNodeView);
  },
});

// --- Workflow (parent) ---

const WorkflowNodeView = (props: any) => {
  const { node, selected, deleteNode, editor, getPos, updateAttributes } = props;
  const { accentColor, cardBg } = node.attrs;
  const [showStylePanel, setShowStylePanel] = useState(false);
  const stylePanelRef = useRef<HTMLDivElement>(null);

  const colors = WORKFLOW_COLORS[accentColor] || WORKFLOW_COLORS.indigo;
  const bgPreset = getCardBgPreset(cardBg);

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
      type: 'workflowStep',
      attrs: { title: 'New Step', icon: 'circle-dot' },
      content: [{ type: 'paragraph' }],
    }).run();
  };

  return (
    <NodeViewWrapper
      className={`group/block workflow-editor relative my-8 transition-all ${selected ? 'ring-2 ring-slate-200 rounded-xl p-3' : ''}`}
      style={{
        '--wf-accent-50': colors[50],
        '--wf-accent-100': colors[100],
        '--wf-accent-500': colors[500],
        '--wf-accent-600': colors[600],
        '--wf-card-bg': bgPreset.bg || 'transparent',
        '--wf-card-bg-image': bgPreset.bgImage || 'none',
        '--wf-card-dark': bgPreset.dark ? '1' : '0',
      } as React.CSSProperties}
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
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64"
            >
              {/* Accent Color */}
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Accent Color</p>
              <div className="flex gap-1.5 mb-3">
                {Object.entries(WORKFLOW_COLORS).map(([name, c]) => (
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

              {/* Card Background */}
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Card Background</p>
              <div className="grid grid-cols-5 gap-1.5">
                {WORKFLOW_CARD_BG.map((p) => (
                  <div key={p.id} className="flex flex-col items-center gap-0.5">
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => updateAttributes({ cardBg: p.id })}
                      className={`w-8 h-8 rounded-lg border-2 transition-all relative overflow-hidden
                        ${cardBg === p.id ? 'border-slate-900 ring-1 ring-slate-900/20' : 'border-slate-200 hover:border-slate-400'}`}
                      style={{
                        backgroundColor: p.bg || 'transparent',
                        backgroundImage: p.bgImage || undefined,
                      }}
                      title={p.name}
                    >
                      {p.animated && (
                        <Sparkles size={8} className="absolute bottom-0.5 right-0.5 text-indigo-400 opacity-60" />
                      )}
                    </button>
                    <span className="text-[8px] text-slate-400 leading-none">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <NodeViewContent className="flex flex-col gap-0" />
    </NodeViewWrapper>
  );
};

export const Workflow = Node.create({
  name: 'workflow',
  group: 'block',
  content: 'workflowStep+',
  isolating: true,

  addAttributes() {
    return {
      accentColor: {
        default: 'indigo',
        parseHTML: (el) => el.getAttribute('data-accent-color') || 'indigo',
        renderHTML: (attrs) => ({ 'data-accent-color': attrs.accentColor }),
      },
      cardBg: {
        default: 'white',
        parseHTML: (el) => el.getAttribute('data-card-bg') || 'white',
        renderHTML: (attrs) => ({ 'data-card-bg': attrs.cardBg }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="workflow"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'workflow' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WorkflowNodeView);
  },
});
