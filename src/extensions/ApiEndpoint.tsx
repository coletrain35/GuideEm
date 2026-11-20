import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface ApiEndpointOptions {
  HTMLAttributes: Record<string, any>;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  POST: 'bg-blue-100 text-blue-800 border-blue-200',
  PUT: 'bg-amber-100 text-amber-800 border-amber-200',
  PATCH: 'bg-purple-100 text-purple-800 border-purple-200',
  DELETE: 'bg-rose-100 text-rose-800 border-rose-200',
};

const ApiEndpointView = ({ node, updateAttributes, deleteNode, getPos, editor }: any) => {
  const method: string = (node.attrs.method || 'GET').toUpperCase();
  const path: string = node.attrs.path ?? '/api/v1/resources';
  const summary: string = node.attrs.summary ?? 'Retrieve a list of resources';
  const responseCode: string = node.attrs.responseCode ?? '200 OK';
  const responseBody: string = node.attrs.responseBody ?? '{\n  "ok": true,\n  "items": []\n}';
  const [showResponse, setShowResponse] = useState(true);

  const badgeClass = METHOD_COLORS[method] || METHOD_COLORS.GET;

  return (
    <NodeViewWrapper className="api-endpoint-wrapper my-6 relative group/block">
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} editor={editor} node={node} />

      <div
        className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 pr-24 bg-slate-50 border-b border-slate-200">
          <select
            value={method}
            onChange={(e) => updateAttributes({ method: e.target.value })}
            aria-label="HTTP method"
            className={`api-method-select px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${badgeClass}`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          <input
            type="text"
            value={path}
            onChange={(e) => updateAttributes({ path: e.target.value })}
            placeholder="/api/v1/endpoint"
            aria-label="Endpoint path"
            className="api-path-input flex-1 min-w-[160px] px-2.5 py-1 text-sm font-mono font-semibold text-slate-800 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Summary & Response */}
        <div className="p-4 space-y-3">
          <input
            type="text"
            value={summary}
            onChange={(e) => updateAttributes({ summary: e.target.value })}
            placeholder="Endpoint summary…"
            aria-label="Endpoint summary"
            className="api-summary-input w-full px-2.5 py-1.5 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <button
                type="button"
                onClick={() => setShowResponse((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                {showResponse ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                Sample Response
              </button>
              <input
                type="text"
                value={responseCode}
                onChange={(e) => updateAttributes({ responseCode: e.target.value })}
                aria-label="Response status code"
                className="api-status-input w-24 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
              />
            </div>

            {showResponse && (
              <textarea
                value={responseBody}
                onChange={(e) => updateAttributes({ responseBody: e.target.value })}
                rows={4}
                spellCheck={false}
                aria-label="Response JSON payload"
                className="api-response-textarea w-full p-3 text-xs font-mono text-slate-100 bg-slate-900 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            )}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const ApiEndpoint = Node.create<ApiEndpointOptions>({
  name: 'apiEndpoint',
  group: 'block',
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      method: {
        default: 'GET',
        parseHTML: (el) => el.getAttribute('data-method') || 'GET',
        renderHTML: (a) => ({ 'data-method': typeof a === 'string' ? a : (a.method || 'GET') }),
      },
      path: {
        default: '/api/v1/resources',
        parseHTML: (el) => el.getAttribute('data-path') || '/api/v1/resources',
        renderHTML: (a) => ({ 'data-path': typeof a === 'string' ? a : (a.path || '') }),
      },
      summary: {
        default: 'Retrieve a list of resources',
        parseHTML: (el) => el.getAttribute('data-summary') || '',
        renderHTML: (a) => ({ 'data-summary': typeof a === 'string' ? a : (a.summary || '') }),
      },
      responseCode: {
        default: '200 OK',
        parseHTML: (el) => el.getAttribute('data-response-code') || '200 OK',
        renderHTML: (a) => ({ 'data-response-code': typeof a === 'string' ? a : (a.responseCode || '200 OK') }),
      },
      responseBody: {
        default: '{\n  "ok": true,\n  "items": []\n}',
        parseHTML: (el) => el.getAttribute('data-response-body') || '',
        renderHTML: (a) => ({ 'data-response-body': typeof a === 'string' ? a : (a.responseBody || '') }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="api-endpoint"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, { 'data-type': 'api-endpoint' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ApiEndpointView);
  },
});
