import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';
import { Plus, X, GripVertical } from 'lucide-react';

type Theme = 'default' | 'dark' | 'forest' | 'neutral';
type NodeType = 'start' | 'process' | 'decision' | 'subprocess' | 'end';

interface FlowNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
}

interface FlowEdge {
  from: string;
  to: string;
  label: string;
}

const THEMES: { value: Theme; label: string; preview: string }[] = [
  { value: 'default', label: 'Default', preview: '#f8fafc' },
  { value: 'dark', label: 'Dark', preview: '#1e293b' },
  { value: 'forest', label: 'Forest', preview: '#14532d' },
  { value: 'neutral', label: 'Neutral', preview: '#737373' },
];

const NODE_TYPES: { value: NodeType; label: string; color: string; icon: string }[] = [
  { value: 'start', label: 'Start/End', color: '#10b981', icon: '●' },
  { value: 'process', label: 'Process', color: '#3b82f6', icon: '▭' },
  { value: 'decision', label: 'Decision', color: '#f59e0b', icon: '◆' },
  { value: 'subprocess', label: 'Sub-process', color: '#8b5cf6', icon: '▭▭' },
  { value: 'end', label: 'End', color: '#ef4444', icon: '●' },
];

let nid = 0;
const nextId = () => `n${++nid}`;

function toMermaid(nodes: FlowNode[], edges: FlowEdge[]): string {
  const lines = ['flowchart TD'];
  // Build node definitions with styles
  nodes.forEach((n) => {
    const safeLabel = n.label.replace(/"/g, '#quot;');
    switch (n.type) {
      case 'start':
      case 'end':
        lines.push(`  ${n.id}(["${safeLabel}"])`);
        break;
      case 'decision':
        lines.push(`  ${n.id}{"${safeLabel}"}`);
        break;
      case 'subprocess':
        lines.push(`  ${n.id}[["${safeLabel}"]]`);
        break;
      default:
        lines.push(`  ${n.id}["${safeLabel}"]`);
    }
  });
  // Style classes
  const typeColors: Record<NodeType, string> = {
    start: '#10b981',
    process: '#3b82f6',
    decision: '#f59e0b',
    subprocess: '#8b5cf6',
    end: '#ef4444',
  };
  NODE_TYPES.forEach((t) => {
    const nodesOfType = nodes.filter((n) => n.type === t.value);
    if (nodesOfType.length) {
      lines.push(`  classDef ${t.value} fill:${typeColors[t.value]}15,stroke:${typeColors[t.value]},stroke-width:2px,color:#334155`);
      lines.push(`  class ${nodesOfType.map((n) => n.id).join(',')} ${t.value}`);
    }
  });
  // Edges
  const seen = new Set<string>();
  edges.forEach((e) => {
    const key = `${e.from}-${e.to}`;
    if (seen.has(key)) return;
    seen.add(key);
    const label = e.label ? `|"${e.label.replace(/"/g, '#quot;')}"|` : '';
    lines.push(`  ${e.from} -->${label} ${e.to}`);
  });
  // Auto-connect if no edges
  if (edges.length === 0 && nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      lines.push(`  ${nodes[i].id} --> ${nodes[i + 1].id}`);
    }
  }
  return lines.join('\n');
}

const DEFAULT_NODES: FlowNode[] = [
  { id: nextId(), label: 'Start', type: 'start', x: 0, y: 0 },
  { id: nextId(), label: 'Process', type: 'process', x: 0, y: 0 },
  { id: nextId(), label: 'End', type: 'end', x: 0, y: 0 },
];

const FlowchartNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { theme, cachedSvg } = node.attrs;

  const [nodes, setNodes] = useState<FlowNode[]>(() => {
    try {
      return JSON.parse(node.attrs.nodes || '[]');
    } catch {
      return [];
    }
  });
  const [edges, setEdges] = useState<FlowEdge[]>(() => {
    try {
      return JSON.parse(node.attrs.edges || '[]');
    } catch {
      return [];
    }
  });
  const [svg, setSvg] = useState(cachedSvg || '');
  const [loading, setLoading] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const render = useCallback(
    async (ns: FlowNode[], es: FlowEdge[], th: Theme) => {
      if (!ns.length) {
        setSvg('');
        return;
      }
      setLoading(true);
      try {
        const def = toMermaid(ns, es);
        const m = await import('mermaid');
        const mermaid = m.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: th,
          flowchart: { curve: 'basis', padding: 16 },
        });
        const id = 'flow-' + Math.random().toString(36).slice(2, 8);
        const { svg: out } = await mermaid.render(id, def);
        setSvg(out);
        updateAttributes({ cachedSvg: out });
      } catch {
        // Silently fail — user will see stale preview
      } finally {
        setLoading(false);
      }
    },
    [updateAttributes]
  );

  // Debounced render on changes
  useEffect(() => {
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      render(nodes, edges, theme);
      updateAttributes({
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
      });
    }, 300);
    return () => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, [nodes, edges, theme, render, updateAttributes]);

  const addNode = (type: NodeType = 'process') => {
    const newNode: FlowNode = {
      id: nextId(),
      label: type === 'start' ? 'Start' : type === 'end' ? 'End' : 'Step',
      type,
      x: 0,
      y: 0,
    };
    setNodes([...nodes, newNode]);
    // Auto-connect to previous
    if (nodes.length > 0) {
      const prev = nodes[nodes.length - 1];
      if (prev.type !== 'end') {
        setEdges([...edges, { from: prev.id, to: newNode.id, label: '' }]);
      }
    }
  };

  const updateNode = (id: string, key: keyof FlowNode, value: any) => {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, [key]: value } : n)));
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter((n) => n.id !== id));
    setEdges(edges.filter((e) => e.from !== id && e.to !== id));
  };

  const addEdge = () => {
    if (nodes.length < 2) return;
    setEdges([...edges, { from: nodes[0].id, to: nodes[nodes.length - 1].id, label: '' }]);
  };

  const updateEdge = (i: number, key: keyof FlowEdge, value: string) => {
    const updated = [...edges];
    updated[i] = { ...updated[i], [key]: value };
    setEdges(updated);
  };

  const removeEdge = (i: number) => {
    setEdges(edges.filter((_, idx) => idx !== i));
  };

  const getNodeLabel = (id: string) => {
    const n = nodes.find((x) => x.id === id);
    return n ? n.label : id;
  };

  return (
    <NodeViewWrapper className="group/block relative my-8" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Preview Area */}
      <div
        className={`rounded-2xl overflow-hidden border bg-white transition-all ${
          selected ? 'ring-2 ring-indigo-400 border-indigo-300 shadow-lg' : 'border-slate-200 shadow-sm'
        }`}
      >
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Flowchart</span>
            {loading && <span className="text-xs text-slate-400">Rendering...</span>}
          </div>
          <div className="flex items-center gap-1">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => updateAttributes({ theme: t.value, cachedSvg: '' })}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  theme === t.value ? 'border-slate-900 ring-1 ring-slate-900/20 scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: t.preview }}
                title={t.label}
              />
            ))}
          </div>
        </div>

        <div className="p-6 min-h-[200px] flex items-center justify-center bg-white">
          {svg ? (
            <div className="w-full overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-3">Add steps to build your flowchart</p>
              <button
                onClick={() => addNode('start')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus size={16} /> Add First Step
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {selected && (
        <div className="mt-4 border border-slate-200 rounded-xl bg-white p-4 shadow-sm space-y-4">
          {/* Quick Add Buttons */}
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Add Node</p>
            <div className="flex flex-wrap gap-2">
              {NODE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => addNode(t.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:shadow-sm"
                  style={{
                    backgroundColor: `${t.color}08`,
                    borderColor: `${t.color}30`,
                    color: t.color,
                  }}
                >
                  <span className="text-sm">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nodes List */}
          {nodes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Steps ({nodes.length})</p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {nodes.map((n, i) => {
                  const typeInfo = NODE_TYPES.find((t) => t.value === n.type) || NODE_TYPES[1];
                  return (
                    <div
                      key={n.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}
                      >
                        {typeInfo.icon}
                      </div>
                      <input
                        value={n.label}
                        onChange={(e) => updateNode(n.id, 'label', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-400 bg-white"
                        placeholder="Label"
                      />
                      <select
                        value={n.type}
                        onChange={(e) => updateNode(n.id, 'type', e.target.value as NodeType)}
                        className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none"
                      >
                        {NODE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeNode(n.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edges */}
          {nodes.length > 1 && (
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Connections {edges.length > 0 && `(${edges.length})`}
                </p>
                <button
                  onClick={addEdge}
                  className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                >
                  + Add Connection
                </button>
              </div>
              {edges.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Auto-connected in order</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {edges.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <select
                        value={e.from}
                        onChange={(v) => updateEdge(i, 'from', v.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none flex-1"
                      >
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                      <span className="text-slate-300">→</span>
                      <input
                        value={e.label}
                        onChange={(v) => updateEdge(i, 'label', v.target.value)}
                        className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none text-center"
                        placeholder="Label"
                      />
                      <span className="text-slate-300">→</span>
                      <select
                        value={e.to}
                        onChange={(v) => updateEdge(i, 'to', v.target.value)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none flex-1"
                      >
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeEdge(i)}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const Mermaid = Node.create({
  name: 'mermaid',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      nodes: {
        default: JSON.stringify(DEFAULT_NODES),
        parseHTML: (el) => el.getAttribute('data-nodes') || JSON.stringify(DEFAULT_NODES),
        renderHTML: (attrs) => ({ 'data-nodes': attrs.nodes }),
      },
      edges: {
        default: '[]',
        parseHTML: (el) => el.getAttribute('data-edges') || '[]',
        renderHTML: (attrs) => ({ 'data-edges': attrs.edges }),
      },
      theme: {
        default: 'default',
        parseHTML: (el) => el.getAttribute('data-theme') || 'default',
        renderHTML: (attrs) => ({ 'data-theme': attrs.theme }),
      },
      cachedSvg: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-cached-svg') || '',
        renderHTML: (attrs) => ({ 'data-cached-svg': attrs.cachedSvg }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mermaid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mermaid' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FlowchartNodeView);
  },
});
