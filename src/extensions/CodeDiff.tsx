import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Code2 } from 'lucide-react';
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
  const [showLangPopover, setShowLangPopover] = useState(false);

  const { beforeLines, afterLines } = computeDiff(codeBefore, codeAfter);

  return (
    <NodeViewWrapper className="group/block code-diff-editor-wrapper my-6 relative">
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />

      {/* Floating Style / Language Toolbar */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 p-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm z-30 text-sm opacity-0 group-hover/block:opacity-100 pointer-events-none group-hover/block:pointer-events-auto transition-opacity">
        <div className="relative">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowLangPopover(!showLangPopover)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${showLangPopover ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <Code2 size={14} /> Language: <span className="font-semibold uppercase text-xs">{language}</span>
          </button>
          {showLangPopover && (
            <div
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-48 max-h-56 overflow-y-auto"
            >
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Language</p>
              <div className="flex flex-col gap-0.5">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      updateAttributes({ language: l });
                      setShowLangPopover(false);
                    }}
                    className={`text-left px-2 py-1 text-xs rounded transition-colors ${language === l ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'hover:bg-slate-50 text-slate-600'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`rounded-xl overflow-hidden border-2 transition-all ${
          selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'
        }`}
        contentEditable={false}
      >
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-[#f8fafc]" style={{ minHeight: '180px' }}>
          
          {/* Before Panel */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-red-50 text-red-700 border-b border-red-100">
              Before
            </div>
            {selected ? (
              <textarea
                value={codeBefore}
                onChange={(e) => updateAttributes({ codeBefore: e.target.value })}
                spellCheck={false}
                rows={8}
                placeholder="// Paste original code here"
                className="w-full flex-1 p-4 bg-[#f8fafc] text-sm leading-relaxed outline-none resize-none font-mono text-slate-700 border-0"
              />
            ) : (
              <pre
                className="m-0 p-4 overflow-x-auto text-sm leading-relaxed rounded-none flex-1"
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
            )}
          </div>

          {/* After Panel */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-green-50 text-green-700 border-b border-green-100">
              After
            </div>
            {selected ? (
              <textarea
                value={codeAfter}
                onChange={(e) => updateAttributes({ codeAfter: e.target.value })}
                spellCheck={false}
                rows={8}
                placeholder="// Paste modified code here"
                className="w-full flex-1 p-4 bg-[#f8fafc] text-sm leading-relaxed outline-none resize-none font-mono text-slate-700 border-0"
              />
            ) : (
              <pre
                className="m-0 p-4 overflow-x-auto text-sm leading-relaxed rounded-none flex-1"
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
            )}
          </div>

        </div>
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
