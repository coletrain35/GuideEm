import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const LANGS = ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'css', 'html', 'json', 'bash', 'sql', 'plaintext'];

const DEFAULT_BEFORE = `// Before\nfunction hello() {\n  console.log('hello');\n}`;
const DEFAULT_AFTER = `// After\nfunction hello(name) {\n  console.log(\`hello, \${name}!\`);\n}`;

interface DiffLine {
  text: string;
  type: 'same' | 'removed' | 'added' | 'empty';
}

function computeDiff(before: string, after: string): { beforeLines: DiffLine[]; afterLines: DiffLine[] } {
  const bl = before.split('\n');
  const al = after.split('\n');
  const maxLen = Math.max(bl.length, al.length);
  const beforeLines: DiffLine[] = [];
  const afterLines: DiffLine[] = [];

  for (let i = 0; i < maxLen; i++) {
    const b = bl[i] ?? null;
    const a = al[i] ?? null;
    const same = b === a;

    if (b === null) {
      beforeLines.push({ text: '', type: 'empty' });
    } else if (same) {
      beforeLines.push({ text: b, type: 'same' });
    } else {
      beforeLines.push({ text: b, type: 'removed' });
    }

    if (a === null) {
      afterLines.push({ text: '', type: 'empty' });
    } else if (same) {
      afterLines.push({ text: a, type: 'same' });
    } else {
      afterLines.push({ text: a, type: 'added' });
    }
  }

  return { beforeLines, afterLines };
}

const lineStyle = (type: DiffLine['type']): React.CSSProperties => {
  switch (type) {
    case 'removed': return { background: '#fee2e2', color: '#be123c' };
    case 'added': return { background: '#dcfce7', color: '#15803d' };
    case 'empty': return { opacity: 0.3 };
    default: return {};
  }
};

const CodeDiffNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { codeBefore, codeAfter, language } = node.attrs;

  const { beforeLines, afterLines } = computeDiff(codeBefore, codeAfter);

  return (
    <NodeViewWrapper className="group/block code-diff-editor-wrapper my-6 relative">
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div
        className={`rounded-xl overflow-hidden border transition-all ${
          selected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200'
        }`}
        contentEditable={false}
      >
        {/* Split view */}
        <div className="flex flex-col sm:flex-row" style={{ minHeight: '100px' }}>
          {/* Before panel */}
          <div className="flex-1 min-w-0">
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-red-50 text-red-700 border-b sm:border-r border-red-100">
              Before
            </div>
            <pre
              className="m-0 p-4 overflow-x-auto text-sm leading-relaxed rounded-none"
              style={{
                background: '#f8fafc',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
            >
              {beforeLines.map((line, i) => (
                <div key={i} style={{ ...lineStyle(line.type), padding: '0 4px', minHeight: '1.6em', whiteSpace: 'pre' }}>
                  {line.text || ' '}
                </div>
              ))}
            </pre>
          </div>
          {/* After panel */}
          <div className="flex-1 min-w-0">
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-green-50 text-green-700 border-b border-green-100">
              After
            </div>
            <pre
              className="m-0 p-4 overflow-x-auto text-sm leading-relaxed rounded-none"
              style={{
                background: '#f8fafc',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
            >
              {afterLines.map((line, i) => (
                <div key={i} style={{ ...lineStyle(line.type), padding: '0 4px', minHeight: '1.6em', whiteSpace: 'pre' }}>
                  {line.text || ' '}
                </div>
              ))}
            </pre>
          </div>
        </div>

        {/* Edit panel */}
        {selected && (
          <div className="border-t border-blue-200 p-4 bg-white space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <label className="text-xs font-medium text-slate-500">Language</label>
              <select
                value={language}
                onChange={(e) => updateAttributes({ language: e.target.value })}
                className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-700 outline-none focus:border-blue-400"
              >
                {LANGS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 block mb-0.5">Before Code</label>
                <textarea
                  value={codeBefore}
                  onChange={(e) => updateAttributes({ codeBefore: e.target.value })}
                  rows={8}
                  spellCheck={false}
                  className="w-full px-2 py-1.5 text-xs border rounded border-slate-200 outline-none focus:border-blue-400 resize-y font-mono"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 block mb-0.5">After Code</label>
                <textarea
                  value={codeAfter}
                  onChange={(e) => updateAttributes({ codeAfter: e.target.value })}
                  rows={8}
                  spellCheck={false}
                  className="w-full px-2 py-1.5 text-xs border rounded border-slate-200 outline-none focus:border-blue-400 resize-y font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const CodeDiff = Node.create({
  name: 'codeDiff',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      codeBefore: {
        default: DEFAULT_BEFORE,
        parseHTML: (el) => el.getAttribute('data-code-before') || DEFAULT_BEFORE,
        renderHTML: (attrs) => ({ 'data-code-before': attrs.codeBefore }),
      },
      codeAfter: {
        default: DEFAULT_AFTER,
        parseHTML: (el) => el.getAttribute('data-code-after') || DEFAULT_AFTER,
        renderHTML: (attrs) => ({ 'data-code-after': attrs.codeAfter }),
      },
      language: {
        default: 'javascript',
        parseHTML: (el) => el.getAttribute('data-language') || 'javascript',
        renderHTML: (attrs) => ({ 'data-language': attrs.language }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="code-diff"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'code-diff' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeDiffNodeView);
  },
});
