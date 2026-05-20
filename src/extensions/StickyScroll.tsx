import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { Plus, X, Paintbrush, Code } from 'lucide-react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

type ScrollStep = { title: string; description: string; code?: string };

const DEFAULT_STEPS: ScrollStep[] = [
  {
    title: 'Install the package',
    description: 'Get started by installing the package with your preferred package manager.',
    code: 'npm install @yourlib/core\n# or\nyarn add @yourlib/core',
  },
  {
    title: 'Configure your project',
    description: 'Add the configuration file to your project root to customize behavior.',
    code: '// yourlib.config.ts\nexport default {\n  apiKey: process.env.API_KEY,\n  region: "us-east-1",\n};',
  },
  {
    title: 'Ship to production',
    description: 'Deploy your application with a single command and go live instantly.',
    code: 'yourlib deploy --prod\n# Deploying to production...\n# ✓ Done in 3.2s',
  },
];

const StickyScrollNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { stickyTitle, stickyDescription, accentColor, steps: stepsJson } = node.attrs;
  const [activeStep, setActiveStep] = useState(0);
  const [showStyle, setShowStyle] = useState(false);
  const styleRef = useRef<HTMLDivElement>(null);

  const steps: ScrollStep[] = (() => {
    try { return JSON.parse(stepsJson); } catch { return DEFAULT_STEPS; }
  })();

  const setSteps = (s: ScrollStep[]) => updateAttributes({ steps: JSON.stringify(s) });
  
  const addStep = () => {
    const next = [...steps, { title: 'New Step', description: 'Describe this step.' }];
    setSteps(next);
    setActiveStep(next.length - 1);
  };
  
  const removeStep = (i: number) => {
    if (steps.length <= 1) return;
    const next = steps.filter((_, idx) => idx !== i);
    setSteps(next);
    setActiveStep(Math.max(0, Math.min(activeStep, next.length - 1)));
  };
  
  const updateStep = (i: number, key: keyof ScrollStep, value: string) => {
    setSteps(steps.map((s, idx) => idx === i ? { ...s, [key]: value } : s));
  };

  const safeActive = Math.min(activeStep, steps.length - 1);
  const currentStep = steps[safeActive];

  return (
    <NodeViewWrapper className="group/block relative my-10" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Floating Style/Settings Toolbar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-30 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        <div ref={styleRef} className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowStyle(!showStyle)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${showStyle ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Paintbrush size={14} /> Color Accent
          </button>
          {showStyle && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-48 space-y-3"
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-8 h-8 rounded cursor-pointer border border-slate-200 shrink-0"
                    value={accentColor || '#6366f1'}
                    onChange={(e) => updateAttributes({ accentColor: e.target.value })}
                  />
                  <span className="text-xs text-slate-500 font-mono">{accentColor}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`grid rounded-2xl overflow-hidden border transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
        }`}
        style={{ gridTemplateColumns: '1fr 1fr' }}
      >
        {/* Left sticky panel */}
        <div
          className="p-8 flex flex-col justify-center"
          style={{ background: `linear-gradient(160deg, ${accentColor}12 0%, ${accentColor}03 100%)`, borderRight: '1px solid #e2e8f0' }}
        >
          <div className="w-10 h-1 rounded-full mb-5" style={{ backgroundColor: accentColor }} />
          
          {/* Header Title Input */}
          <input
            value={stickyTitle || ''}
            onChange={(e) => updateAttributes({ stickyTitle: e.target.value })}
            placeholder="How It Works"
            className="text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full mb-2 py-0.5 mt-0 transition-colors"
          />

          {/* Header Description Textarea */}
          <textarea
            value={stickyDescription || ''}
            onChange={(e) => updateAttributes({ stickyDescription: e.target.value })}
            placeholder="Follow these steps to get started."
            rows={2}
            className="text-slate-500 text-sm leading-relaxed bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full py-0.5 mb-6 m-0 resize-none transition-colors"
            style={{ fieldSizing: 'content' } as any}
          />

          {/* Steps List */}
          <div className="flex flex-col gap-1.5">
            {steps.map((s, i) => (
              <div key={i} className="group/item relative flex items-center">
                <button
                  onClick={() => setActiveStep(i)}
                  className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${safeActive === i ? 'text-white shadow-sm font-semibold' : 'text-slate-600 hover:bg-white/70'}`}
                  style={safeActive === i ? { backgroundColor: accentColor } : {}}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={safeActive === i
                      ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }
                      : { backgroundColor: `${accentColor}20`, color: accentColor }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-tight">{s.title || 'Empty Step'}</span>
                </button>

                {/* Remove Step Trigger (visible on step hover if selected) */}
                {selected && steps.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(i);
                    }}
                    className={`absolute right-2 p-1 rounded-full border border-slate-100 shadow-sm transition-opacity opacity-0 group-hover/item:opacity-100 ${
                      safeActive === i ? 'bg-white text-red-500 hover:bg-red-50' : 'bg-slate-50 text-slate-400 hover:text-red-500'
                    }`}
                    title="Delete Step"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}

            {/* Inline Add Step */}
            {selected && (
              <button
                onClick={addStep}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-left border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-white/50 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-all mt-1"
              >
                <Plus size={14} className="shrink-0" />
                <span>Add Step</span>
              </button>
            )}
          </div>
        </div>

        {/* Right content panel (edit active step inline!) */}
        <div className="p-8 bg-white flex flex-col justify-center relative">
          {currentStep ? (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Step Title</p>
                <input
                  value={currentStep.title}
                  onChange={(e) => updateStep(safeActive, 'title', e.target.value)}
                  placeholder="Step title"
                  className="font-bold text-lg text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full py-0.5 transition-colors"
                />
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Step Description</p>
                <textarea
                  value={currentStep.description}
                  onChange={(e) => updateStep(safeActive, 'description', e.target.value)}
                  placeholder="Describe this step..."
                  rows={3}
                  className="text-slate-600 text-sm leading-relaxed bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full py-0.5 resize-none transition-colors"
                  style={{ fieldSizing: 'content' } as any}
                />
              </div>

              {/* Code Snippet */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Code Snippet (Optional)</p>
                  {selected && !currentStep.code && (
                    <button
                      onClick={() => updateStep(safeActive, 'code', '// Code snippet here')}
                      className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <Plus size={10} /> Add Code
                    </button>
                  )}
                  {selected && currentStep.code && (
                    <button
                      onClick={() => updateStep(safeActive, 'code', '')}
                      className="flex items-center gap-1 text-[10px] font-semibold text-red-500 hover:text-red-600 transition-colors"
                    >
                      <X size={10} /> Remove Code
                    </button>
                  )}
                </div>

                {currentStep.code ? (
                  <div className="relative group/code font-mono text-xs rounded-xl overflow-hidden bg-[#0f172a] text-[#e2e8f0] p-4">
                    <textarea
                      value={currentStep.code}
                      onChange={(e) => updateStep(safeActive, 'code', e.target.value)}
                      placeholder="// Type code here..."
                      rows={4}
                      className="w-full bg-transparent border-none outline-none resize-none font-mono text-xs leading-relaxed text-[#e2e8f0] focus:ring-0 p-0"
                      style={{ fieldSizing: 'content' } as any}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm text-center py-6">Select or add a step on the left to edit.</div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const StickyScroll = Node.create({
  name: 'stickyScroll',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      stickyTitle: {
        default: 'How It Works',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-sticky-title') || 'How It Works',
        renderHTML: (attrs: any) => ({ 'data-sticky-title': attrs.stickyTitle }),
      },
      stickyDescription: {
        default: 'Follow the steps to get up and running in minutes.',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-sticky-description') || '',
        renderHTML: (attrs: any) => ({ 'data-sticky-description': attrs.stickyDescription }),
      },
      accentColor: {
        default: '#6366f1',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-accent-color') || '#6366f1',
        renderHTML: (attrs: any) => ({ 'data-accent-color': attrs.accentColor }),
      },
      steps: {
        default: JSON.stringify(DEFAULT_STEPS),
        parseHTML: (el: HTMLElement) => el.getAttribute('data-steps') || JSON.stringify(DEFAULT_STEPS),
        renderHTML: (attrs: any) => ({ 'data-steps': attrs.steps }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="sticky-scroll"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'sticky-scroll' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(StickyScrollNodeView);
  },
});
