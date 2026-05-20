import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';
import { ChevronDown, AlertCircle, Loader2, HelpCircle, X } from 'lucide-react';

/* ── Diagram templates ─────────────────────────────────────────────── */

interface DiagramTemplate {
  id: string;
  label: string;
  icon: string;
  definition: string;
}

const TEMPLATES: DiagramTemplate[] = [
  {
    id: 'flowchart-td',
    label: 'Flowchart',
    icon: '⬇️',
    definition: `flowchart TD
    Start([Start]) --> Process[Do Something]
    Process --> Decision{Is it done?}
    Decision -->|Yes| Success([Done])
    Decision -->|No| Process`,
  },
  {
    id: 'flowchart-lr',
    label: 'Flow (Left → Right)',
    icon: '➡️',
    definition: `flowchart LR
    Input([Input]) --> Step1[Step 1]
    Step1 --> Step2[Step 2]
    Step2 --> Output([Output])`,
  },
  {
    id: 'sequence',
    label: 'Sequence',
    icon: '↕️',
    definition: `sequenceDiagram
    participant User
    participant App
    participant Server

    User->>App: Click button
    App->>Server: API request
    Server-->>App: Response
    App-->>User: Show result`,
  },
  {
    id: 'gantt',
    label: 'Gantt Chart',
    icon: '📊',
    definition: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
        Research       :a1, 2024-01-01, 7d
        Design         :a2, after a1, 5d
    section Development
        Build          :b1, after a2, 14d
        Testing        :b2, after b1, 7d
    section Launch
        Deploy         :c1, after b2, 3d`,
  },
  {
    id: 'pie',
    label: 'Pie Chart',
    icon: '🥧',
    definition: `pie title Traffic Sources
    "Organic Search" : 42
    "Direct" : 28
    "Social Media" : 18
    "Referral" : 12`,
  },
  {
    id: 'er',
    label: 'ER Diagram',
    icon: '🗄️',
    definition: `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "ordered in"
    USER {
        string name
        string email
    }
    ORDER {
        int id
        date created
    }`,
  },
  {
    id: 'state',
    label: 'State Machine',
    icon: '🔄',
    definition: `stateDiagram-v2
    [*] --> Idle
    Idle --> Loading : fetch
    Loading --> Success : resolve
    Loading --> Error : reject
    Error --> Loading : retry
    Success --> [*]`,
  },
  {
    id: 'mindmap',
    label: 'Mind Map',
    icon: '🧠',
    definition: `mindmap
  root((Project))
    Planning
      Research
      Requirements
    Design
      Wireframes
      Prototypes
    Development
      Frontend
      Backend
    Launch
      Testing
      Deploy`,
  },
];

const DEFAULT_DEFINITION = TEMPLATES[0].definition;

/* ── Theme config ──────────────────────────────────────────────────── */

type Theme = 'default' | 'dark' | 'forest' | 'neutral';

const THEMES: { value: Theme; label: string; editorBg: string; editorText: string; previewBg: string }[] = [
  { value: 'default', label: 'Light', editorBg: '#1e293b', editorText: '#e2e8f0', previewBg: '#ffffff' },
  { value: 'dark', label: 'Dark', editorBg: '#0f172a', editorText: '#94a3b8', previewBg: '#1e293b' },
  { value: 'forest', label: 'Forest', editorBg: '#14532d', editorText: '#bbf7d0', previewBg: '#f0fdf4' },
  { value: 'neutral', label: 'Neutral', editorBg: '#27272a', editorText: '#d4d4d8', previewBg: '#fafafa' },
];

/* ── Node view component ───────────────────────────────────────────── */

const DiagramNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;

  // ─ Derive state reactively from node.attrs (fixes undo/redo) ─
  const definition = node.attrs.definition || '';
  const theme = (node.attrs.theme || 'default') as Theme;
  const cachedSvg = node.attrs.cachedSvg || '';

  const [svg, setSvg] = useState(cachedSvg);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const lastRenderedRef = useRef<string>('');

  const themeConfig = useMemo(
    () => THEMES.find((t) => t.value === theme) || THEMES[0],
    [theme]
  );

  // ─ Close template dropdown on outside click ─
  useEffect(() => {
    if (!templateOpen) return;
    const handler = (e: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target as HTMLElement)) {
        setTemplateOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [templateOpen]);

  // ─ Render Mermaid diagram ─
  const renderDiagram = useCallback(
    async (def: string, th: Theme) => {
      const trimmed = def.trim();
      if (!trimmed) {
        setSvg('');
        setError('');
        lastRenderedRef.current = '';
        return;
      }

      // Skip if we already rendered this exact combo
      const renderKey = `${trimmed}::${th}`;
      if (renderKey === lastRenderedRef.current) return;

      setLoading(true);
      setError('');
      try {
        const m = await import('mermaid');
        const mermaid = m.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: th,
          flowchart: { curve: 'basis', padding: 16 },
        });
        const id = 'mmd-' + Math.random().toString(36).slice(2, 8);
        const { svg: out } = await mermaid.render(id, trimmed);
        setSvg(out);
        setError('');
        lastRenderedRef.current = renderKey;
        updateAttributes({ cachedSvg: out });
      } catch (e: any) {
        const msg = e?.message || 'Invalid diagram syntax';
        // Strip Mermaid's verbose noise — keep only the useful part
        const cleaned = msg.replace(/^.*?Parse error on line/s, 'Parse error on line').slice(0, 200);
        setError(cleaned);
        lastRenderedRef.current = '';
      } finally {
        setLoading(false);
      }
    },
    [updateAttributes]
  );

  // ─ Debounced render when definition or theme changes ─
  useEffect(() => {
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      renderDiagram(definition, theme);
    }, 500);
    return () => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, [definition, theme, renderDiagram]);

  // ─ Sync cachedSvg from attrs when it changes externally (undo/redo) ─
  useEffect(() => {
    if (cachedSvg && cachedSvg !== svg) {
      setSvg(cachedSvg);
    }
  }, [cachedSvg]);

  // ─ Auto-resize textarea ─
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [definition, selected]);

  const handleDefinitionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateAttributes({ definition: e.target.value });
  };

  const applyTemplate = (template: DiagramTemplate) => {
    updateAttributes({ definition: template.definition, cachedSvg: '' });
    lastRenderedRef.current = '';
    setTemplateOpen(false);
  };

  const lineCount = (definition || '').split('\n').length;

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      <div
        className={`rounded-2xl overflow-hidden transition-all ${
          selected
            ? 'ring-2 ring-indigo-400 shadow-xl'
            : 'shadow-md hover:shadow-lg'
        }`}
        style={{ border: '1px solid rgba(99,102,241,0.15)' }}
      >
        {/* ── Titlebar ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ background: themeConfig.editorBg }}
        >
          <div className="flex items-center gap-3">
            {/* Traffic light dots */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f38ba8' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f9e2af' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#a6e3a1' }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: `${themeConfig.editorText}80` }}>
              Diagram
            </span>
            {loading && (
              <Loader2 size={13} className="animate-spin" style={{ color: themeConfig.editorText }} />
            )}
          </div>

          {/* Theme pills */}
          <div className="flex items-center gap-1">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  lastRenderedRef.current = '';
                  updateAttributes({ theme: t.value, cachedSvg: '' });
                }}
                className={`px-2 py-0.5 text-[10px] rounded-full border transition-all font-medium ${
                  theme === t.value
                    ? 'bg-white/20 border-white/30 text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main content area ── */}
        {selected ? (
          /* ── Edit mode: split panel ── */
          <div className="flex" style={{ minHeight: '280px' }}>
            {/* Left: Code editor */}
            <div
              className="flex-1 flex flex-col relative"
              style={{ backgroundColor: themeConfig.editorBg, minWidth: 0 }}
            >
              {/* Template picker bar */}
              <div
                className="flex items-center gap-2 px-3 py-2 border-b"
                style={{ borderColor: `${themeConfig.editorText}15` }}
              >
                <div className="relative" ref={templateDropdownRef}>
                  <button
                    onClick={() => setTemplateOpen(!templateOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all hover:bg-white/10"
                    style={{ color: themeConfig.editorText, border: `1px solid ${themeConfig.editorText}25` }}
                  >
                    Templates
                    <ChevronDown size={12} className={`transition-transform ${templateOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {templateOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 z-50 rounded-xl shadow-2xl overflow-hidden"
                      style={{
                        backgroundColor: themeConfig.editorBg,
                        border: `1px solid ${themeConfig.editorText}20`,
                        width: '220px',
                      }}
                    >
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => applyTemplate(t)}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs transition-all hover:bg-white/10"
                          style={{ color: themeConfig.editorText }}
                        >
                          <span className="text-base">{t.icon}</span>
                          <span className="font-medium">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setGuideOpen(!guideOpen)}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg transition-all ${
                    guideOpen ? 'bg-white/15 text-white' : 'hover:bg-white/10'
                  }`}
                  style={{ color: guideOpen ? '#fff' : `${themeConfig.editorText}70`, border: `1px solid ${guideOpen ? themeConfig.editorText + '30' : 'transparent'}` }}
                >
                  <HelpCircle size={12} />
                  Guide
                </button>
              </div>

              {/* ── Built-in syntax guide (Modal Overlay) ── */}
              {guideOpen && (
                <div 
                  className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 transition-all duration-200"
                  onClick={() => setGuideOpen(false)}
                >
                  <div 
                    className="relative max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden border border-slate-800 bg-slate-900 text-slate-100 flex flex-col max-h-[85vh] transition-all transform scale-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
                      <div className="flex items-center gap-2">
                        <HelpCircle size={18} className="text-indigo-400" />
                        <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-200">Mermaid Syntax Reference</h3>
                      </div>
                      <button 
                        onClick={() => setGuideOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="overflow-y-auto p-6 space-y-6 text-xs custom-scrollbar">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          {
                            title: '⬇️ Flowchart',
                            lines: [
                              'flowchart TD',
                              '  A[Rectangle] --> B(Rounded)',
                              '  B --> C{Decision}',
                              '  C -->|Yes| D([Stadium])',
                              '  C -->|No| E[[Subroutine]]',
                            ],
                          },
                          {
                            title: '↕️ Sequence Diagram',
                            lines: [
                              'sequenceDiagram',
                              '  Alice->>Bob: Hello',
                              '  Bob-->>Alice: Hi back',
                              '  Alice-)Bob: Async msg',
                              '  Note over Alice,Bob: A note',
                            ],
                          },
                          {
                            title: '📊 Gantt Chart',
                            lines: [
                              'gantt',
                              '  title My Plan',
                              '  dateFormat YYYY-MM-DD',
                              '  section Phase 1',
                              '    Task A :a1, 2024-01-01, 7d',
                              '    Task B :after a1, 5d',
                            ],
                          },
                          {
                            title: '🥧 Pie Chart',
                            lines: [
                              'pie title Responses',
                              '  "Yes" : 42',
                              '  "No" : 28',
                              '  "Maybe" : 30',
                            ],
                          },
                          {
                            title: '🗄️ ER Diagram',
                            lines: [
                              'erDiagram',
                              '  USER ||--o{ ORDER : places',
                              '  USER { string name }',
                              '  ORDER { int id }',
                            ],
                          },
                          {
                            title: '🔄 State Machine',
                            lines: [
                              'stateDiagram-v2',
                              '  [*] --> Idle',
                              '  Idle --> Active : start',
                              '  Active --> [*] : done',
                            ],
                          },
                        ].map((section) => (
                          <div
                            key={section.title}
                            className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 relative group flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                                  {section.title}
                                </p>
                                <button
                                  onClick={() => {
                                    updateAttributes({ definition: section.lines.join('\n'), cachedSvg: '' });
                                    lastRenderedRef.current = '';
                                    setGuideOpen(false);
                                  }}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  Use Template
                                </button>
                              </div>
                              <pre
                                className="leading-relaxed"
                                style={{
                                  fontSize: '0.725rem',
                                  color: 'rgb(148, 163, 184)',
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                  whiteSpace: 'pre',
                                  margin: 0,
                                }}
                              >
                                {section.lines.join('\n')}
                              </pre>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Node shapes cheat sheet */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                        <p className="font-semibold mb-2 text-[11px] uppercase tracking-wider text-slate-300">
                          🔷 Flowchart Node Shapes
                        </p>
                        <div className="flex flex-wrap gap-x-2 gap-y-2 font-mono text-[10px] text-slate-400">
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">A[Rectangle]</span>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">A(Rounded)</span>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">A([Stadium])</span>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">A{"{}"}Decision{"}"}</span>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">A[[Subroutine]]</span>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">A((Circle))</span>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">A{">"}Flag]</span>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">A[/Parallelogram/]</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40">
                        <p className="font-semibold mb-2 text-[11px] uppercase tracking-wider text-slate-300">
                          🔗 Arrow Types & Connections
                        </p>
                        <div className="flex flex-wrap gap-x-2 gap-y-2 font-mono text-[10px] text-slate-400">
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">{"A --> B"} (Solid Arrow)</span>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">{"A ---> B"} (Thick Arrow)</span>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">{"A -.-> B"} (Dotted Arrow)</span>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">{"A ==> B"} (Bold Arrow)</span>
                          <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800/60">{"A --> |label| B"} (Labeled Arrow)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Textarea with line numbers */}
              <div className="flex flex-1 overflow-auto">
                {/* Line numbers */}
                <div
                  className="flex-shrink-0 select-none pt-3 pr-2 text-right"
                  style={{
                    width: '2.5rem',
                    color: `${themeConfig.editorText}30`,
                    fontSize: '0.75rem',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    lineHeight: '1.7',
                  }}
                >
                  {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  className="flex-1 resize-none focus:outline-none"
                  style={{
                    backgroundColor: 'transparent',
                    color: themeConfig.editorText,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '0.8125rem',
                    lineHeight: '1.7',
                    padding: '0.75rem 0.75rem 0.75rem 0.25rem',
                    border: 'none',
                    minHeight: '200px',
                    caretColor: '#818cf8',
                    tabSize: 4,
                  }}
                  value={definition}
                  onChange={handleDefinitionChange}
                  placeholder={`Pick a template or write Mermaid syntax...\n\nExample:\nflowchart TD\n    A[Start] --> B[End]`}
                  spellCheck={false}
                />
              </div>

              {/* Error bar */}
              {error && (
                <div
                  className="flex items-start gap-2 px-3 py-2 text-xs border-t"
                  style={{
                    backgroundColor: '#991b1b20',
                    borderColor: '#f87171',
                    color: '#fca5a5',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  }}
                >
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <span className="break-all">{error}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: '1px', backgroundColor: `${themeConfig.editorText}15` }} />

            {/* Right: Live preview */}
            <div
              className="flex-1 flex items-center justify-center p-6 overflow-auto"
              style={{ backgroundColor: themeConfig.previewBg, minWidth: 0 }}
            >
              {svg ? (
                <div
                  className="w-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:mx-auto"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-400">
                    {definition.trim() ? (error ? 'Fix the syntax error to see preview' : 'Rendering...') : 'Pick a template to get started →'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── View mode: full-width preview only ── */
          <div
            className="p-8 flex items-center justify-center"
            style={{ backgroundColor: themeConfig.previewBg, minHeight: '180px' }}
          >
            {svg ? (
              <div
                className="w-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:mx-auto"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : (
              <p className="text-sm text-slate-400 italic">
                Click to edit diagram
              </p>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

/* ── Tiptap node definition ────────────────────────────────────────── */

export const Mermaid = Node.create({
  name: 'mermaid',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      definition: {
        default: DEFAULT_DEFINITION,
        parseHTML: (el: HTMLElement) => el.getAttribute('data-definition') || DEFAULT_DEFINITION,
        renderHTML: (attrs: Record<string, any>) => ({ 'data-definition': attrs.definition }),
      },
      theme: {
        default: 'default',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-theme') || 'default',
        renderHTML: (attrs: Record<string, any>) => ({ 'data-theme': attrs.theme }),
      },
      cachedSvg: {
        default: '',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-cached-svg') || '',
        renderHTML: (attrs: Record<string, any>) => ({ 'data-cached-svg': attrs.cachedSvg }),
      },
      // Legacy compat: silently accept old nodes/edges attrs so old docs don't throw
      nodes: { default: null, rendered: false },
      edges: { default: null, rendered: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mermaid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mermaid' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DiagramNodeView);
  },
});
