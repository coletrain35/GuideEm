import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { BlockDeleteButton } from '../components/BlockDeleteButton';

const THEMES: Record<string, { bg: string; text: string; titleBg: string; titleText: string; dot1: string; dot2: string; dot3: string }> = {
  dark:    { bg: '#1e1e2e', text: '#cdd6f4', titleBg: '#313244', titleText: '#a6adc8', dot1: '#f38ba8', dot2: '#f9e2af', dot3: '#a6e3a1' },
  light:   { bg: '#fafafa', text: '#383a42', titleBg: '#e8e8e8', titleText: '#696c77', dot1: '#e06c75', dot2: '#e5c07b', dot3: '#98c379' },
  nord:    { bg: '#2e3440', text: '#d8dee9', titleBg: '#3b4252', titleText: '#8fbcbb', dot1: '#bf616a', dot2: '#ebcb8b', dot3: '#a3be8c' },
  dracula: { bg: '#282a36', text: '#f8f8f2', titleBg: '#44475a', titleText: '#6272a4', dot1: '#ff5555', dot2: '#ffb86c', dot3: '#50fa7b' },
};

const LANGUAGES = ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'css', 'html', 'bash', 'json', 'sql', 'yaml', 'php', 'c', 'cpp'];

const CodeWindowNodeView = (props: any) => {
  const { node, updateAttributes, selected, deleteNode, getPos, editor } = props;
  const { code, language, title, theme } = node.attrs;
  const t = THEMES[theme] || THEMES.dark;

  const lineCount = (code || '').split('\n').length;

  return (
    <NodeViewWrapper className="group/block relative my-6" contentEditable={false}>
      <BlockDeleteButton deleteNode={deleteNode} getPos={getPos} node={node} editor={editor} />
      <div
        className={`rounded-xl overflow-hidden shadow-xl transition-all ${selected ? 'ring-2 ring-indigo-400' : ''}`}
        style={{ border: `1px solid ${t.titleBg}` }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: t.titleBg }}>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.dot1 }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.dot2 }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.dot3 }} />
          </div>
          {selected ? (
            <input
              className="mx-auto text-xs font-mono text-center bg-transparent border-b border-dashed focus:outline-none"
              style={{ color: t.titleText, borderColor: `${t.titleText}60`, width: '12rem' }}
              value={title || ''}
              onChange={(e) => updateAttributes({ title: e.target.value })}
              placeholder="filename"
            />
          ) : (
            <span className="mx-auto text-xs font-mono" style={{ color: t.titleText }}>
              {title || 'untitled'}
            </span>
          )}
          <span className="text-xs font-mono opacity-50" style={{ color: t.titleText }}>
            {language}
          </span>
        </div>

        {/* Code body — always an editable textarea styled to look like a code block */}
        <div className="relative" style={{ backgroundColor: t.bg }}>
          {/* Line numbers */}
          <div
            className="absolute left-0 top-0 bottom-0 flex flex-col items-end pt-5 pr-2 select-none pointer-events-none"
            style={{ width: '2.5rem', color: `${t.text}40`, fontSize: '0.8125rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', lineHeight: '1.65' }}
          >
            {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <textarea
            className="w-full resize-none focus:outline-none"
            style={{
              backgroundColor: 'transparent',
              color: t.text,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.875rem',
              lineHeight: '1.65',
              padding: '1.25rem 1.25rem 1.25rem 3rem',
              border: 'none',
              margin: 0,
              minHeight: '4rem',
              caretColor: t.text,
            }}
            rows={Math.max(lineCount, 3)}
            value={code || ''}
            onChange={(e) => updateAttributes({ code: e.target.value })}
            placeholder="// Write your code here"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Settings panel — shown on select */}
      {selected && (
        <div className="mt-2 border border-slate-200 rounded-xl bg-white p-3 shadow-sm flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Language</label>
            <select
              className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none"
              value={language}
              onChange={(e) => updateAttributes({ language: e.target.value })}
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Theme</label>
            <div className="flex gap-1">
              {Object.keys(THEMES).map((th) => (
                <button
                  key={th}
                  onClick={() => updateAttributes({ theme: th })}
                  className={`px-2.5 py-0.5 text-xs rounded-full border transition-all ${theme === th ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                >
                  {th}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const CodeWindow = Node.create({
  name: 'codeWindow',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      code: {
        default: 'const greet = (name: string) => {\n  return `Hello, ${name}!`;\n};\n\nconsole.log(greet("World"));',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-code') || '',
        renderHTML: (attrs: any) => ({ 'data-code': attrs.code }),
      },
      language: {
        default: 'typescript',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-language') || 'typescript',
        renderHTML: (attrs: any) => ({ 'data-language': attrs.language }),
      },
      title: {
        default: 'index.ts',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-title') || 'index.ts',
        renderHTML: (attrs: any) => ({ 'data-title': attrs.title }),
      },
      theme: {
        default: 'dark',
        parseHTML: (el: HTMLElement) => el.getAttribute('data-theme') || 'dark',
        renderHTML: (attrs: any) => ({ 'data-theme': attrs.theme }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="code-window"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'code-window' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeWindowNodeView);
  },
});
