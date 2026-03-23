import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
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

  const steps: ScrollStep[] = (() => {
    try { return JSON.parse(stepsJson); } catch { return DEFAULT_STEPS; }
  })();

  const [activeStep, setActiveStep] = useState(0);

  const setSteps = (s: ScrollStep[]) => updateAttributes({ steps: JSON.stringify(s) });
  const addStep = () => setSteps([...steps, { title: 'New Step', description: 'Describe this step.' }]);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i));
  const updateStep = (i: number, key: keyof ScrollStep, value: string) =>
    setSteps(steps.map((s, idx) => idx === i ? { ...s, [key]: value } : s));

  const safeActive = Math.min(activeStep, steps.length - 1);

  return (
    <NodeViewWrapper className="group/block relative my-10" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      <div
        className="grid rounded-2xl overflow-hidden border border-slate-200"
        style={{ gridTemplateColumns: '1fr 1fr' }}
      >
        {/* Left sticky panel */}
        <div
          className="p-8 flex flex-col justify-center"
          style={{ background: `linear-gradient(160deg, ${accentColor}18 0%, ${accentColor}06 100%)`, borderRight: '1px solid #e2e8f0' }}
        >
          <div className="w-10 h-1 rounded-full mb-5" style={{ backgroundColor: accentColor }} />
          <h2 className="text-xl font-bold text-slate-900 mb-2.5 mt-0">{stickyTitle || 'How It Works'}</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6 m-0">
            {stickyDescription || 'Follow these steps to get started.'}
          </p>
          <div className="flex flex-col gap-1.5">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${safeActive === i ? 'text-white shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
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
                <span className="text-sm font-medium leading-tight">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right content panel */}
        <div className="p-8 bg-white flex flex-col justify-center">
          {steps[safeActive] ? (
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-2 mt-0">{steps[safeActive].title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 m-0">{steps[safeActive].description}</p>
              {steps[safeActive].code && (
                <pre className="p-4 rounded-xl text-xs font-mono overflow-x-auto m-0" style={{ backgroundColor: '#0f172a', color: '#e2e8f0', lineHeight: '1.7' }}>
                  {steps[safeActive].code}
                </pre>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Add steps to get started.</div>
          )}
        </div>
      </div>

      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Panel Title</label>
              <input
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={stickyTitle || ''}
                onChange={(e) => updateAttributes({ stickyTitle: e.target.value })}
                placeholder="How It Works"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                  value={accentColor || '#6366f1'}
                  onChange={(e) => updateAttributes({ accentColor: e.target.value })}
                />
                <span className="text-xs text-slate-500 font-mono">{accentColor}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Panel Description</label>
            <textarea
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none resize-none"
              rows={2}
              value={stickyDescription || ''}
              onChange={(e) => updateAttributes({ stickyDescription: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Steps ({steps.length})</span>
            <button
              onClick={addStep}
              className="flex items-center gap-1.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={12} /> Add Step
            </button>
          </div>
          {steps.map((step, i) => (
            <div key={i} className="border border-slate-100 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={step.title}
                  onChange={(e) => updateStep(i, 'title', e.target.value)}
                  placeholder="Step title"
                />
                <button onClick={() => removeStep(i)} className="text-slate-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
              <textarea
                className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none resize-none"
                rows={2}
                value={step.description}
                onChange={(e) => updateStep(i, 'description', e.target.value)}
                placeholder="Description"
              />
              <textarea
                className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded focus:outline-none resize-none"
                rows={3}
                value={step.code || ''}
                onChange={(e) => updateStep(i, 'code', e.target.value)}
                placeholder="// Optional code snippet"
              />
            </div>
          ))}
        </div>
      )}
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
